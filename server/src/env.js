// 读取 server/.env 里的环境变量，再汇总成 config
// 已存在的系统环境变量不覆盖
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_DIR = path.resolve(__dirname, "..");
export const PROJECT_ROOT = path.resolve(SERVER_DIR, "..");

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}

loadDotEnv(path.join(SERVER_DIR, ".env"));

// 限频次数：false / 0 / off 表示不限；其他非法值也按不限处理
function parseRateMax(raw, fallback) {
  if (raw === undefined || raw === "") return fallback;
  const v = String(raw).trim().toLowerCase();
  if (v === "false" || v === "0" || v === "off" || v === "none") return 0;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// 限频时间窗，毫秒，最小 1 秒
function parseWindowMs(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1000 ? Math.floor(n) : 60_000;
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  projectRoot: PROJECT_ROOT,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBase: (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
  deepseekModel: process.env.DEEPSEEK_MODEL || "deepseek-chat",
  // 按 IP 滑窗限频，max 为 0 表示不限
  rateWindowMs: parseWindowMs(process.env.RATE_WINDOW_MS),
  citationRateMax: parseRateMax(process.env.CITATION_RATE_MAX, 2),
  fetchRateMax: parseRateMax(process.env.FETCH_RATE_MAX, 20),
  // 抓网页
  fetchTimeoutMs: 15_000,
  maxHtmlBytes: 5 * 1024 * 1024,
  // 调 DeepSeek 的超时
  genTimeoutMs: 60_000,
  answerTimeoutMs: 60_000,
  analysisTimeoutMs: 45_000,
  maxBodyBytes: 64 * 1024,
};
