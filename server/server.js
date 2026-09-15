// 星图邻 GEO 工具站后端入口，只用 Node 自带模块
// GET  /api/health              健康检查
// GET  /api/fetch?url=          服务端抓取网页，替代前端 CORS 代理
// POST /api/geo/citation-test   AI 引用实测，SSE 推送进度，按 IP 限频
// 其他路径托管项目根目录的静态文件
import http from "node:http";
import { config } from "./src/env.js";
import { RateLimiter } from "./src/store.js";
import { fetchPage, FetchPageError } from "./src/fetchPage.js";
import { runCitationTest } from "./src/citation.js";
import { serveStatic } from "./src/static.js";

const citationLimiter = new RateLimiter({ windowMs: config.rateWindowMs, max: config.citationRateMax });
const fetchLimiter = new RateLimiter({ windowMs: config.rateWindowMs, max: config.fetchRateMax });

function sendJson(res, status, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  else res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function readJsonBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;
    req.on("data", (c) => {
      if (rejected) return;
      size += c.length;
      if (size > limit) {
        rejected = true;
        reject(Object.assign(new Error("请求体过大"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (rejected) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(Object.assign(new Error("请求体不是有效 JSON"), { status: 400 }));
      }
    });
    req.on("error", (e) => {
      if (!rejected) reject(e);
    });
  });
}

function normalizeInput(urlStr, keyword) {
  const errors = [];
  let u = null;
  try {
    u = new URL(String(urlStr || "").trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") errors.push("URL 仅支持 http/https");
  } catch {
    errors.push("URL 格式不正确");
  }
  const kw = String(keyword || "").trim();
  if (!kw) errors.push("请填写行业/领域关键词");
  if (kw.length > 40) errors.push("关键词最长 40 个字符");
  if (u) {
    u.hash = "";
    u.searchParams.sort();
  }
  return {
    errors,
    url: u ? u.toString() : "",
    keyword: kw,
  };
}

// SSE 事件流
function openSse(res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (evt) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(evt)}\n\n`);
  };
  return { send, end: () => res.end() };
}

async function handleCitationTest(req, res) {
  let body;
  try {
    body = await readJsonBody(req, config.maxBodyBytes);
  } catch (e) {
    sendJson(res, e.status || 400, { ok: false, error: e.message });
    return;
  }

  const { errors, url, keyword } = normalizeInput(body.url, body.keyword);
  if (errors.length) {
    sendJson(res, 400, { ok: false, error: errors.join("；") });
    return;
  }

  const ip = getClientIp(req);
  const limit = citationLimiter.check(ip);
  if (!limit.ok) {
    const secs = Math.round(config.rateWindowMs / 1000);
    const period = secs % 60 === 0 ? `${secs / 60} 分钟` : `${secs} 秒`;
    sendJson(res, 429, {
      ok: false,
      error: `请求过于频繁，同一 IP 每 ${period} 最多 ${config.citationRateMax} 次检测`,
      retryAfter: limit.retryAfter,
    });
    return;
  }

  if (!config.deepseekApiKey) {
    sendJson(res, 503, { ok: false, error: "AI 引用实测服务尚未配置 DEEPSEEK_API_KEY" });
    return;
  }

  const sse = openSse(res);
  const ctrl = new AbortController();
  req.on("close", () => ctrl.abort());

  try {
    sse.send({ type: "stage", stage: "fetching" });
    const { html, finalUrl } = await fetchPage(url, {
      timeoutMs: config.fetchTimeoutMs,
      maxBytes: config.maxHtmlBytes,
      signal: ctrl.signal,
    });

    await runCitationTest(
      { url: finalUrl || url, keyword, html },
      { emit: sse.send, signal: ctrl.signal }
    );
  } catch (e) {
    const stage = e instanceof FetchPageError ? "fetch" : "llm";
    sse.send({ type: "error", stage, message: e.message || "检测失败，请稍后重试" });
    console.error(`[citation-test] ${e.stack || e.message}`);
  } finally {
    sse.end();
  }
}

async function handleFetch(req, res, urlObj) {
  const target = urlObj.searchParams.get("url") || "";
  let parsed;
  try {
    parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
  } catch {
    sendJson(res, 400, { ok: false, error: "参数 url 必须是合法的 http/https 地址" });
    return;
  }

  const ip = getClientIp(req);
  const limit = fetchLimiter.check(ip);
  if (!limit.ok) {
    sendJson(res, 429, { ok: false, error: "抓取请求过于频繁，请稍后再试", retryAfter: limit.retryAfter });
    return;
  }

  try {
    const { html, finalUrl } = await fetchPage(target, {
      timeoutMs: config.fetchTimeoutMs,
      maxBytes: config.maxHtmlBytes,
    });
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Final-Url": encodeURIComponent(finalUrl),
      "Access-Control-Expose-Headers": "X-Final-Url",
    });
    res.end(html);
  } catch (e) {
    const status = e.status || 502;
    sendJson(res, status, { ok: false, error: e.message || "抓取失败" });
  }
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  if (pathname.startsWith("/api/")) {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      if (req.method === "GET" && pathname === "/api/health") {
        sendJson(res, 200, {
          ok: true,
          service: "xingtulink-geo-server",
          model: config.deepseekModel,
          deepseekConfigured: Boolean(config.deepseekApiKey),
        });
        return;
      }
      if (req.method === "GET" && pathname === "/api/fetch") {
        await handleFetch(req, res, urlObj);
        return;
      }
      if (req.method === "POST" && pathname === "/api/geo/citation-test") {
        await handleCitationTest(req, res);
        return;
      }
      sendJson(res, 404, { ok: false, error: "接口不存在" });
      return;
    } catch (e) {
      console.error(`[api] ${pathname} 异常：`, e);
      if (!res.headersSent) sendJson(res, 500, { ok: false, error: "服务器内部错误" });
      else res.end();
    }
  }

  serveStatic(req, res);
});

server.listen(config.port, () => {
  console.log("");
  console.log("  星图邻 GEO 工具站服务已启动");
  console.log(`  - 本地访问：  http://localhost:${config.port}/`);
  console.log(`  - 检测页：    http://localhost:${config.port}/tools/geo-checker/`);
  console.log(`  - DeepSeek：  ${config.deepseekApiKey ? "" : "未配置 DEEPSEEK_API_KEY（AI 引用实测不可用）"}${config.deepseekModel} @ ${config.deepseekBase}`);
  console.log("");
});
