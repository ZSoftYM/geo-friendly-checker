# GeoFriendlyChecker

星图邻开源项目系列之一。

GeoFriendlyChecker 是一款轻量级、可自托管的 GEO（生成式引擎优化）诊断工具。输入网址，从结构化数据、Meta 标签、内容语义、AI 可读性四个维度打分，并给出可落地的优化建议。另含 AI 引用实测——自动模拟真实用户向 AI 提问，检测品牌或域名是否在 AI 回答中被提及；以及一个开箱即用的 JSON-LD 生成器。

粘贴 HTML 的检测全程在浏览器本地完成，零数据上传；URL 抓取和引用实测由自带的 Node 服务处理。

## 功能

### GEO 友好度检测

- 输入 URL（后端抓取）或粘贴 HTML 源码（浏览器本地解析，不上传）
- 四维评分（满分 100）：结构化数据 · Meta 标签 · 内容语义 · AI 可读性
- 逐项问题定位 + 优化建议，支持导出 Canvas 分享图

### AI 引用实测

- 输入目标网址 + 行业关键词
- 服务端自动生成 6 个不带品牌名的中立测试问题，调用 DeepSeek 逐条提问
- 命中判定在本地用正则完成（品牌名 / 域名匹配），不依赖模型自评
- SSE 流式展示检测进度，约 20–40 秒；单题失败自动跳过，另对未引用问题做一次原因分析

### JSON-LD 生成器

- 支持 Organization / Article / FAQ / HowTo / Product / LocalBusiness
- 表单填写，实时生成符合 Schema.org 规范的代码，一键复制或下载

全站中 / 英双语。

## 界面预览

<!-- 截图占位：将截图放入 img/ 并替换为实际文件，也可直接改下面的路径 -->

首页

![首页截图](./img/homepage-screenshot.png)

GEO 友好度检测器（含 AI 引用实测）

![GEO 检测器截图](./img/geo-checker-screenshot.png)

JSON-LD 生成器

![JSON-LD 生成器截图](./img/json-ld-generator-screenshot.png)

AI引用实测

![ai-citation-benchmarking](./img/ai-citation-benchmarking.png)

## 代码结构

```
.
├── index.html                         首页
├── 404.html / robots.txt / sitemap.xml
├── contact/index.html                 联系方式与隐私政策
├── tools/
│   ├── geo-checker/index.html         GEO 检测器页（内含 AI 引用实测）
│   └── json-ld-generator/index.html   JSON-LD 生成器页
├── public/                            前端：纯原生 JS，零依赖、零构建
│   ├── styles.css                     全站样式
│   ├── i18n.js                        中英文切换
│   ├── site.js                        导航、移动端菜单、全站 JSON-LD 注入
│   ├── geo-checker.js                 四维检测、评分、报告渲染与分享图
│   ├── citation-test.js               引用实测前端（SSE 接收与渲染）
│   └── json-ld-generator.js           生成器表单与代码拼装
├── img/                               Logo 与界面截图
└── server/                            后端：只用 Node 内置模块，Node >= 18
    ├── server.js                      HTTP 入口：静态托管 + API 路由 + SSE
    ├── package.json                   npm start 入口，无第三方依赖
    ├── .env.example                   环境变量示例
    └── src/
        ├── env.js                     .env 读取与配置汇总
        ├── store.js                   按 IP 的内存滑窗限频
        ├── static.js                  静态文件服务（含目录穿越防护）
        ├── fetchPage.js               页面抓取（UA、跳转、超时/体积限制、SSRF 拦截）
        ├── extract.js                 从页面 HTML 启发式提取品牌名候选
        ├── deepseek.js                DeepSeek Chat Completions 客户端
        └── citation.js                引用实测主流程：出题、提问、命中判定、原因分析
```

后端一个进程同时托管静态页面和三个接口：`GET /api/health`（健康检查）、`GET /api/fetch`（页面抓取）、`POST /api/geo/citation-test`（引用实测，SSE 返回进度）。

## 快速开始

### 前端本地检测（零配置）

粘贴 HTML 的检测不需要后端，但页面使用绝对路径引用资源，需用任意静态服务器打开（直接双击 `index.html` 会丢样式）：

```bash
python -m http.server 8080
# 或
npx serve .
```

访问 `http://localhost:8080/tools/geo-checker/`，切到「粘贴 HTML 源码」即可。

### 完整服务（含 URL 抓取与 AI 引用实测）

无需安装依赖，Node.js 18+：

```bash
cd server
cp .env.example .env        # Windows 用 copy
# 编辑 .env，填入 DEEPSEEK_API_KEY
node server.js              # 或 npm start，默认端口 8080
```

不配置 `DEEPSEEK_API_KEY` 时服务照常运行，仅 AI 引用实测不可用。

## 环境变量

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `PORT` | 否 | `8080` | 服务监听端口 |
| `DEEPSEEK_API_KEY` | 使用引用实测时必填 | 无 | DeepSeek API Key，仅服务端读取，不下发浏览器 |
| `DEEPSEEK_MODEL` | 否 | `deepseek-chat` | 调用的模型 |
| `DEEPSEEK_BASE_URL` | 否 | `https://api.deepseek.com` | API 地址，可指向自建中转 |
| `CITATION_RATE_MAX` | 否 | `2` | 同一 IP 每个时间窗内引用实测的最大次数，设为 `false`（或 `0` / `off`）关闭限制 |
| `FETCH_RATE_MAX` | 否 | `20` | 同一 IP 每个时间窗内页面抓取的最大次数，设为 `false`（或 `0` / `off`）关闭限制 |
| `RATE_WINDOW_MS` | 否 | `60000` | 限频时间窗，单位毫秒（默认 1 分钟） |

## 技术栈

- 前端：纯 HTML / CSS / Vanilla JS，零构建、零第三方依赖
- 后端：Node.js 原生 HTTP（`node:http` / `node:fs` 等），零第三方 npm 依赖
- AI：DeepSeek API（OpenAI 兼容协议，可选）
- 国际化：中 / 英双语

## License

MIT

---

**About**

星图邻（[xingtulink.com](https://xingtulink.com)）是栈上月明（[zsoftym.com](https://zsoftym.com)）旗下的开源技术品牌。我们在 AI 方向持续产出开源工具，帮助企业解决实际问题，GeoFriendlyChecker 是其中第一个。
