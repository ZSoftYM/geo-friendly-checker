// 托管项目根目录下的静态文件，找不到时回 404.html
import fs from "node:fs";
import path from "node:path";
import { config } from "./env.js";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function send404(res) {
  const fallback = path.join(config.projectRoot, "404.html");
  if (fs.existsSync(fallback)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(fallback).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
  }
}

export function serveStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    send404(res);
    return;
  }

  // 防目录穿越：normalize 后必须仍在项目根目录内
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(config.projectRoot, safePath);
  if (filePath !== config.projectRoot && !filePath.startsWith(config.projectRoot + path.sep)) {
    send404(res);
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      stat = fs.statSync(filePath);
    }
  } catch {
    send404(res);
    return;
  }
  if (!stat.isFile()) {
    send404(res);
    return;
  }

  const type = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": stat.size,
    "Cache-Control": "public, max-age=300",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}
