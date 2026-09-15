// 服务端抓网页：带浏览器 UA、跟随跳转、限制超时和体积
// 拦 SSRF：localhost、内网 IP、解析到内网的域名都不放行
import dns from "node:dns/promises";
import net from "node:net";

export class FetchPageError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "FetchPageError";
    this.status = status;
  }
}

function isPrivateIp(ip) {
  let addr = String(ip || "").toLowerCase();
  // IPv4-mapped IPv6
  if (addr.startsWith("::ffff:")) addr = addr.slice(7);

  if (net.isIP(addr) === 4) {
    const [a, b] = addr.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (net.isIP(addr) === 6) {
    if (addr === "::1" || addr === "::") return true;
    if (/^f[cd]/.test(addr)) return true; // fc00::/7
    if (addr.startsWith("fe8")) return true; // fe80::/10
    return false;
  }
  return false;
}

async function assertPublicHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new FetchPageError("不允许抓取内网/本机地址", 400);
    return;
  }
  if (host === "localhost" || host.endsWith(".local") || !host.includes(".")) {
    throw new FetchPageError("不允许抓取内网主机名", 400);
  }
  const records = await dns.lookup(host, { all: true }).catch(() => null);
  if (!records || records.length === 0) {
    throw new FetchPageError("目标域名无法解析", 400);
  }
  if (records.some((r) => isPrivateIp(r.address))) {
    throw new FetchPageError("目标域名解析到了内网地址，已拒绝", 400);
  }
}

export async function fetchPage(targetUrl, { timeoutMs = 15_000, maxBytes = 5 * 1024 * 1024, signal } = {}) {
  let u;
  try {
    u = new URL(targetUrl);
  } catch {
    throw new FetchPageError("URL 格式不正确", 400);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new FetchPageError("仅支持 http/https 协议", 400);
  }
  await assertPublicHost(u.hostname);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  let resp;
  try {
    resp = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    if (e.name === "AbortError") throw new FetchPageError("抓取目标页面超时", 504);
    throw new FetchPageError(`抓取失败：${e.message}`, 502);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }

  if (!resp.ok) {
    throw new FetchPageError(`目标站点返回 HTTP ${resp.status}`, 502);
  }

  // 限制读取体积
  let html = "";
  let length = 0;
  let truncated = false;
  const reader = resp.body?.getReader ? resp.body.getReader() : null;
  if (!reader) {
    html = await resp.text();
  } else {
    const decoder = new TextDecoder("utf-8");
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        truncated = true;
        html += decoder.decode(value.slice(0, maxBytes - (length - value.byteLength)), { stream: false });
        await reader.cancel().catch(() => {});
        break;
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
  }
  if (!html.trim()) throw new FetchPageError("目标页面内容为空", 502);
  return { html, finalUrl: resp.url || targetUrl, status: resp.status, truncated };
}
