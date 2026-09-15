// DeepSeek chat/completions 调用，走 OpenAI 兼容协议
import { config } from "./env.js";

export class DeepSeekError extends Error {
  constructor(message, status = 502, detail = "") {
    super(message);
    this.name = "DeepSeekError";
    this.status = status;
    this.detail = detail;
  }
}

// 调一次 chat/completions，messages 为 [{role, content}]
export async function chat(messages, opts = {}) {
  if (!config.deepseekApiKey) {
    throw new DeepSeekError("服务端未配置 DEEPSEEK_API_KEY", 503);
  }
  const {
    temperature = 0.7,
    maxTokens = 1024,
    json = false,
    timeoutMs = 60_000,
    signal,
  } = opts;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  let resp;
  try {
    resp = await fetch(`${config.deepseekBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: config.deepseekModel,
        messages,
        temperature,
        stream: false,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new DeepSeekError("DeepSeek 调用超时或已被取消", 504);
    }
    throw new DeepSeekError(`无法连接 DeepSeek API：${e.message}`, 502);
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }

  if (!resp.ok) {
    const detail = (await resp.text().catch(() => "")).slice(0, 300);
    if (resp.status === 401) {
      throw new DeepSeekError("DeepSeek API Key 无效或未授权（401）", 502, detail);
    }
    if (resp.status === 429) {
      throw new DeepSeekError("DeepSeek API 触发限流（429），请稍后重试", 502, detail);
    }
    throw new DeepSeekError(`DeepSeek API 返回错误（HTTP ${resp.status}）`, 502, detail);
  }

  const data = await resp.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new DeepSeekError("DeepSeek 返回结构异常，未找到回答内容", 502);
  }
  return { content, raw: data };
}

// 要求返回 JSON，解析失败时兜底截取首个 {...} 片段
export async function chatJSON(messages, opts = {}) {
  const { content } = await chat(messages, { ...opts, json: true });
  return parseLooseJSON(content);
}

export function parseLooseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("模型返回内容不是有效 JSON");
  }
}
