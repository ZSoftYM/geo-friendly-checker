// 中英双语切换。默认中文即 HTML 原文；元素加 data-i18n="key" 即可按字典替换，
// 属性用 data-i18n-attr="placeholder:key|title:key2"，title/description/og:* 单独处理。
// 语言选择存 localStorage。
(function () {
  "use strict";

  // 翻译字典
  const DICT = {
    "zh-CN": {}, // 中文用 HTML 原文，空字典不替换
    en: {
      "brand.github.title": "Open Source · GitHub",
      // 导航 / 页脚
      "nav.home": "Home",
      "nav.geo-check": "GEO Checker",
      "nav.jsonld": "JSON-LD Generator",
      "nav.contact": "Contact",
      "nav.zsoftym": "ZSoftYM Site →",
      "nav.menu": "Menu",

      "footer.desc": "Follow the StarMap, Join the Open Neighborhood.",
      "footer.desc.short": "Follow the StarMap, Join the Open Neighborhood.",
      "footer.title.tools": "Tools",
      "footer.tools.geo": "GEO Friendliness Checker",
      "footer.tools.jsonld": "JSON-LD Generator",
      "footer.title.company": "Company",
      "footer.company.zsoftym": "ZSoftYM Official",
      "footer.company.contact": "Contact Us",
      "footer.company.privacy": "Privacy Policy",
      "footer.title.contact": "Contact",
      "footer.contact.phone": "Tel: +86 176 2902 0227",
      "footer.contact.email": "Email: guohao@zsymtech.cn",
      "footer.contact.addr": "Xi'an, Shaanxi",
      "footer.copyright": "© 2026 Xi'an Zhanshang Yueming Software Technology Co., Ltd. · XingTuLink",

      "brand.alt": "XingTuLink",

      // CTA / 按钮
      "btn.use-now": "Use Now →",
      "btn.visit-zsoftym": "Visit ZSoftYM →",
      "btn.contact-zsoftym": "Contact ZSoftYM →",
      "btn.return-home": "Back to Home",
      "btn.go-geo": "Go to GEO Checker",

      // 首页
      "home.eyebrow": "Open-Source GEO Toolkit",
      "home.hero.h1.part1": "Make AI",
      "home.hero.h1.part2": "cite your website",
      "home.hero.lead": "GEO (Generative Engine Optimization) helps web pages appear in answers from AI assistants like Doubao, Kimi and ChatGPT. Three open-source tools — GEO Check, AI Citation Test and JSON-LD Generator — free to use and self-hostable.",
      "home.hero.cta-primary": "Start GEO Check →",
      "home.hero.cta-ghost": "AI Citation Test",

      "home.what.eyebrow": "What is GEO",
      "home.what.h2": "From SEO to GEO: the traffic gateway is changing",
      "home.what.lead": "Users no longer only type keywords — they ask AI directly. Whether you appear in AI answers determines your new traffic source.",
      "home.what.q1.title": "Users ask AI directly",
      "home.what.q1.desc": "More people ask questions in AI assistants; AI composes the answer and lists sources, instead of returning a page of links.",
      "home.what.q2.title": "AI picks citable sources",
      "home.what.q2.desc": "Pages that are well structured, authoritative and easy to extract are more likely to be chosen as reference sources in AI answers.",
      "home.what.q3.title": "GEO turns pages into answers",
      "home.what.q3.desc": "Structured data, clear semantics and FAQ-style content improve a page's citability — this is SEO for the AI era.",

      "home.tools.eyebrow": "Open-Source Tools",
      "home.tools.h2": "Check → Optimize → Verify, a closed loop",
      "home.card.geo.title": "GEO Friendliness Check",
      "home.card.geo.desc": "Enter a URL or paste HTML to get a 4-dimension, 100-point score — Structured Data, Meta, Content Semantics and AI Readability — with an optimization checklist.",
      "home.card.geo.chip": "4 dimensions · 100-point scale",
      "home.card.cite.title": "AI Citation Test",
      "home.card.cite.desc": "Enter a URL and industry keywords; the system generates 6 real-user questions for an AI, then reports your brand/domain citation rate and why questions went uncited.",
      "home.card.cite.chip": "6 real questions · citation report",
      "home.card.jsonld.title": "JSON-LD Generator",
      "home.card.jsonld.desc": "6 Schema types: Organization / Article / FAQ / HowTo / Product / LocalBusiness. Fill in the form and get copy-paste ready code.",
      "home.card.jsonld.chip": "Schema.org standard · one-click copy",

      "home.end.eyebrow": "Free · Self-Hostable",
      "home.end.h2": "Check whether AI cites your website now",
      "home.end.desc": "Paste HTML to run the check entirely in your browser — nothing is uploaded.",
      "home.end.btn": "Start GEO Check →",

      // GEO 检测器页
      "geo.eyebrow": "Open-Source Tool",
      "geo.h1": "GEO Friendliness Checker",
      "geo.lead": "Rates your page across 4 dimensions — Structured Data, Meta Tags, Content Semantics and AI Readability — with actionable optimization suggestions.",
      "geo.tab.paste": "Paste HTML Source",
      "geo.tab.url": "Enter URL to Fetch",
      "geo.label.url": "Target Webpage URL",
      "geo.placeholder.url": "https://example.com/article",
      "geo.tip.url": "URL mode fetches HTML through XingTuLink's server-side fetch endpoint. If the target site has anti-scraping policies it may fail; please use \"Paste HTML Source\" instead.",
      "geo.btn.fetch": "Fetch & Analyze →",
      "geo.label.html": "HTML Source Code",
      "geo.placeholder.html": "Right-click the page → View Page Source → Select all and paste here…\n(Chrome: right-click → View page source → Ctrl+A then copy)",
      "geo.tip.html": "All parsing runs locally in your browser. The HTML source will <b>never be uploaded</b> to any server — safe and stable.",
      "geo.btn.analyze": "Start Analysis →",
      "geo.disclaimer.title": "Disclaimer: ",
      "geo.disclaimer.body": "This tool only analyzes the technical structure of public webpages. It does not store or disseminate any page content. By using this tool you agree to our ",
      "geo.disclaimer.link": "Privacy Policy",
      "geo.disclaimer.end": ".",

      "geo.empty.title": "Awaiting Analysis",
      "geo.empty.desc": "After filling in the left-side form, GEO friendliness score and optimization suggestions will appear here.",

      "geo.score.max": "/ 100",
      "geo.rtab.dims": "Dimension Scores",
      "geo.rtab.issues": "Issues",
      "geo.rtab.sug": "Suggestions",

      "geo.cta.title": "Need Foundational GEO Optimization?",
      "geo.cta.desc": "ZSoftYM skips GEO marketing flooding and focuses on foundational optimization — from structured data and content semantics to technical compliance — so your website itself is understood and willingly cited by AI.",

      "geo.watermark": "Tested by xingtulink.com",
      "geo.shareImg": "Download Result Image",

      // AI 引用实测
      "cite.eyebrow": "Advanced GEO Lab · AI Citation Test",
      "cite.title": "AI Citation Test",
      "cite.lead": "Enter your website URL and industry keywords. The system simulates real users asking DeepSeek 6 questions, and checks whether the AI proactively cites your brand or domain with reference links in its answers.",
      "cite.label.url": "Target Webpage URL <i>*</i>",
      "cite.ph.url": "https://example.com/",
      "cite.label.keyword": "Industry / Domain Keywords <i>*</i>",
      "cite.ph.keyword": "e.g. Xi'an AI companies",
      "cite.btn.start": "Start AI Citation Test →",
      "cite.tip": "Limit: 2 tests per minute per IP. A run takes about 20–40 seconds. AI answers are stochastic — results are for reference only.",
      "cite.stage.ready": "Preparing…",

      // JSON-LD 生成器页
      "jsonld.eyebrow": "Open-Source Tool",
      "jsonld.h1": "JSON-LD Structured Data Generator",
      "jsonld.lead": "Pick a Schema type, fill in the fields, and get ready-to-paste JSON-LD in real time. Covers 90% of GEO citation scenarios and conforms to Schema.org standards.",

      "jsonld.tab.org": "Organization",
      "jsonld.tab.article": "Article",
      "jsonld.tab.faq": "FAQ",
      "jsonld.tab.howto": "HowTo",
      "jsonld.tab.product": "Product",
      "jsonld.tab.localbiz": "LocalBusiness",

      "jsonld.formTitle.org": "Organization · Info",
      "jsonld.formTitle.article": "Article · Info",
      "jsonld.formTitle.faq": "FAQ · Info",
      "jsonld.formTitle.howto": "HowTo · Info",
      "jsonld.formTitle.product": "Product · Info",
      "jsonld.formTitle.localbiz": "LocalBusiness · Info",
      "jsonld.formDesc": "Fill in the fields below — the code on the right updates live.",

      "jsonld.preview.title": "Live Preview",
      "jsonld.btn.copy": "Copy Code",
      "jsonld.btn.download": "Download",
      "jsonld.tip.code": "Paste the code at the end of your page's <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code>, wrapped in <code>&lt;script type=\"application/ld+json\"&gt;...&lt;/script&gt;</code>.",
      "jsonld.copy.success": "Copied ✓",
      "jsonld.copy.fail": "Copy failed — please copy manually",

      "jsonld.howto.title": "How to Use",
      "jsonld.howto.1": "Select the matching Schema type on the left and fill in required fields.",
      "jsonld.howto.2": "Click \"Copy Code\" or \"Download\" to get the generated JSON-LD.",
      "jsonld.howto.3": "Embed the code in your website's HTML <code>&lt;head&gt;</code> section.",
      "jsonld.howto.4": "Validate with <a href=\"https://search.google.com/test/rich-results\" data-external=\"1\" style=\"color:var(--brand-3);\">Google Rich Results Test</a>.",

      "jsonld.cta.title": "Batch Generation · Long-Term GEO Monitoring?",
      "jsonld.cta.desc": "ZSoftYM provides enterprise-grade GEO optimization and structured data services.",

      // 关于 GEO 页
      "about.eyebrow": "GEO Knowledge Base",
      "about.h1.part1": "About GEO: Let AI",
      "about.h1.part2": "actively recommend",
      "about.h1.part3": "your brand",
      "about.lead": "GEO (Generative Engine Optimization) is a set of content optimization methods targeting Generative AI platforms such as Doubao, Kimi, Wenxin Yiyan and ChatGPT.",

      "about.toc.what": "What is GEO",
      "about.toc.vs": "GEO vs SEO",
      "about.toc.how": "How to do GEO",
      "about.toc.faq": "FAQ",

      "about.what.h2": "What is GEO?",
      "about.what.p1": "<b>GEO (Generative Engine Optimization)</b> is an optimization methodology targeting <b>Generative AI search engines</b>. When a user asks AI \"What are the domestic GEO optimization service providers?\", AI doesn't return 10 blue links — it directly generates an \"answer\". Whether your brand appears in that answer depends on how well structured your website is, how widely your brand entity is cited, and the readability of your content.",
      "about.what.p2": "In short, <b>SEO gets Google to rank you #1; GEO gets AI to say your name directly</b>.",
      "about.what.cardTitle": "Three Core GEO Signals",
      "about.what.signal1": "<b>Structured data</b>: JSON-LD and Schema.org let AI \"read\" your page.",
      "about.what.signal2": "<b>Brand entity</b>: Consistently reference brand name, logo and contact info across multiple platforms.",
      "about.what.signal3": "<b>Content semantics</b>: Clear hierarchy, FAQ, HowTo, citations and lists.",

      "about.vs.eyebrow": "Comparison",
      "about.vs.h2": "GEO vs SEO",
      "about.vs.lead": "The two are <b>complementary</b>, not substitutes: SEO solves \"being found by search\"; GEO solves \"being cited by AI answers\".",
      "about.vs.th.dim": "Dimension",
      "about.vs.th.seo": "SEO",
      "about.vs.th.geo": "GEO",
      "about.vs.td.goal.name": "Goal",
      "about.vs.td.goal.seo": "Rankings in keyword results",
      "about.vs.td.goal.geo": "Direct citation in AI answers",
      "about.vs.td.target.name": "Target",
      "about.vs.td.target.seo": "Google / Baidu / Bing",
      "about.vs.td.target.geo": "Doubao / Kimi / Wenxin Yiyan / ChatGPT",
      "about.vs.td.method.name": "Core Methods",
      "about.vs.td.method.seo": "Keyword density, backlinks, authority",
      "about.vs.td.method.geo": "Structured data, semantic clarity, brand entities",
      "about.vs.td.kpi.name": "Metrics",
      "about.vs.td.kpi.seo": "Rankings, click-through rate",
      "about.vs.td.kpi.geo": "Citation rate, answer appearance rate",
      "about.vs.td.time.name": "Time to Effect",
      "about.vs.td.time.seo": "1–6 months",
      "about.vs.td.time.geo": "1–3 months",

      "about.how.eyebrow": "Methodology",
      "about.how.h2": "How to Do GEO Optimization?",
      "about.how.c1.title": "Add Structured Data",
      "about.how.c1.desc": 'Use the <a href="/tools/json-ld-generator/" style="color:var(--brand-3);">JSON-LD Generator</a> to add Organization, Article, FAQ, HowTo, Product and other structured data types.',
      "about.how.c2.title": "Optimize Content Semantics",
      "about.how.c2.desc": 'Clear H1–H6 hierarchy, lists, citations and tables. Keep paragraphs to 3–5 lines. Validate with the <a href="/tools/geo-checker/" style="color:var(--brand-3);">GEO Checker</a>.',
      "about.how.c3.title": "Build Brand Entities",
      "about.how.c3.desc": "Consistently use your brand name, logo and contact info across platforms like GitHub, Zhihu, CSDN and WeChat.",
      "about.how.c4.title": "FAQ + HowTo",
      "about.how.c4.desc": "Turn common customer questions into FAQ, and how-to content into HowTo steps. This significantly raises AI citation probability.",
      "about.how.c5.title": "Improve AI Readability",
      "about.how.c5.desc": "Set <html lang>, add alt text to images, use simple sentences and avoid jargon — so LLMs can extract key points more easily.",
      "about.how.c6.title": "Monitor & Iterate",
      "about.how.c6.desc": "Regularly revisit using the Checker, target specific low-score dimensions for improvements, and track AI citation frequency for your brand.",

      "about.faq.eyebrow": "FAQ",
      "about.faq.h2": "Frequently Asked Questions about GEO",
      "about.faq.q1.q": "Which is more important, GEO or SEO?",
      "about.faq.q1.a": "They complement each other — do both. SEO secures \"being found\"; GEO claims \"being cited by AI\".",
      "about.faq.q2.q": "How long does GEO take to show results?",
      "about.faq.q2.a": "Typically 1–3 months to see higher citation frequency on AI platforms. After shipping structured data, Google Rich Results may appear within days.",
      "about.faq.q3.q": "Which AI platforms deserve GEO the most?",
      "about.faq.q3.a": "Domestic priority: Doubao, Kimi, Wenxin Yiyan, Tongyi Qianwen. Overseas priority: ChatGPT, Gemini, Perplexity.",
      "about.faq.q4.q": "Are XingTuLink tools free?",
      "about.faq.q4.a": 'Yes. The GEO Checker and JSON-LD Generator are 100% free, with all parsing running locally and no data uploads. For enterprise-grade full-stack GEO services, please contact our parent company <a href="https://zsoftym.com/" data-external="1" style="color:var(--brand-3);">zsoftym.com</a>.',
      "about.faq.q5.q": "Does JSON-LD have to be placed in <head>?",
      "about.faq.q5.a": "No. Either <head> or end of <body> works. Google and mainstream AI crawlers both support it. The key is ensuring the script exists in the HTML when the page renders.",

      "about.cta.h2": "Want a Systematic GEO Optimization?",
      "about.cta.desc": "ZSoftYM provides full-stack GEO services, from structured data and content renovation to brand entity building.",

      // 联系页
      "contact.eyebrow": "Contact Us",
      "contact.h1.part1": "Have GEO optimization needs?",
      "contact.h1.part2": "Let's talk",
      "contact.lead": "XingTuLink tools help you self-check for free. For enterprise-grade GEO optimization, contact our parent company ZSoftYM.",
      "contact.pos.a": "We don't do GEO marketing or content flooding. ",
      "contact.pos.b": "We focus only on foundational GEO optimization",
      "contact.pos.c": " — structured data, content semantics and technical compliance, so your website itself is understood and willingly cited by AI.",

      "contact.section.h2": "Contact Information",
      "contact.section.lead": "Feel free to reach us via any of the following channels.",
      "contact.cc.company.label": "Company",
      "contact.cc.company.name": "Xi'an Zhanshang Yueming Software Technology Co., Ltd.",
      "contact.cc.company.desc": "XingTuLink operating entity",
      "contact.cc.email.label": "Email",
      "contact.cc.phone.label": "Phone",
      "contact.cc.addr.label": "Address",
      "contact.cc.addr.value": "Xi'an · Shaanxi",

      "contact.btn.zsoftym": "Visit ZSoftYM Official →",

      "contact.privacy.eyebrow": "Compliance",
      "contact.privacy.h2": "Privacy Policy & Disclaimer",
      "contact.privacy.updated": "Last updated: 2026-09-13",
      "contact.privacy.h.1": "1. How Your Data Is Handled (Local vs. Server)",
      "contact.privacy.p.1": 'In <b>"Paste HTML Source"</b> mode, all parsing runs <b>locally</b> in your browser and never touches any server. The <b>"URL Fetch"</b> and <b>"AI Citation Test"</b> features require a backend: the URL and keywords you submit are sent to the server of the <b>deployer</b> whose site you are visiting, which fetches the target page and calls a large language model on your behalf.',
      "contact.privacy.p.1b": "On the official site <b>xingtulink.com</b>, the backend is operated by Xi'an Zhanshang Yueming Software Technology Co., Ltd. Submitted content is not persisted — only temporary in-memory timestamps per IP are kept for rate limiting. No sign-up is required, users are not tracked, and your language preference is stored solely in your local browser.",
      "contact.privacy.h.2": "2. Third-Party AI Services",
      "contact.privacy.p.2": "AI Citation Test calls a third-party LLM provider using an API key configured by the deployer (the official site uses DeepSeek). The URL and keywords you enter are sent to that provider, whose data handling is governed by its own privacy policy. AI answers are stochastic; citation results are for reference only.",
      "contact.privacy.h.3": "3. Open Source & Third-Party Deployments",
      "contact.privacy.p.3": "This software is released free of charge under an open-source license (see LICENSE in the repository). Anyone may download, run and configure their own backend instance. When you use the tool through a non-official deployment (any address other than xingtulink.com), that instance's data processing, log retention and API calls are <b>the sole responsibility of its operator and have no connection with Xi'an Zhanshang Yueming Software Technology Co., Ltd. or XingTuLink</b>. Use such instances at your own discretion and risk.",
      "contact.privacy.h.4": "4. Disclaimer",
      "contact.privacy.p.4": "This tool only analyzes the technical structure of public webpages. Check and test results are for reference only and do not constitute any SEO/GEO performance commitment or service guarantee. We assume no responsibility for the availability or accuracy of third-party deployments or third-party AI services.",
      "contact.privacy.h.5": "5. Contact",
      "contact.privacy.p.5": 'If you have questions about this policy, or about data handling on the official site, please email <a href="mailto:guohao@zsymtech.cn" style="color:var(--brand-3);">guohao@zsymtech.cn</a>.',

      // 404 页
      "404.h1": "Page Not Found",
      "404.lead.part1": "Sorry, the page you requested doesn't exist or has been moved.<br />",
      "404.lead.part2": "You can return home or go directly to our tools.",

      // 语言切换器自身
      "lang.label": "Language",
      "lang.zh": "中文",
      "lang.en": "EN",
    },
  };

  // 核心逻辑
  const STORAGE_KEY = "xtl_lang";
  const SUPPORTED = ["zh-CN", "en"];

  function detectLang() {
    // 先看用户之前选过没
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && SUPPORTED.includes(s)) return s;
    } catch (e) {}
    // 再看浏览器语言
    const nav = (navigator.language || "zh-CN").toLowerCase();
    if (nav.startsWith("en")) return "en";
    return "zh-CN";
  }

  // 第一次覆盖之前先存好中文原文，不然切英文再切回来就没东西可还原了
  let originalsCaptured = false;
  const originalHtml = new WeakMap();
  const originalAttrs = new WeakMap();

  function captureOriginals() {
    if (originalsCaptured) return;
    originalsCaptured = true;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      if (originalAttrs.has(el)) return;
      const raw = el.getAttribute("data-i18n-attr") || "";
      const saved = {};
      raw.split("|").forEach((pair) => {
        const [attr] = pair.split(":").map((s) => s.trim());
        if (attr) saved[attr] = el.getAttribute(attr);
      });
      originalAttrs.set(el, saved);
    });
  }

  function setLang(lang, persist) {
    if (!SUPPORTED.includes(lang)) lang = "zh-CN";
    captureOriginals();
    if (persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {}
    }
    document.documentElement.setAttribute("lang", lang === "zh-CN" ? "zh-CN" : "en");
    document.documentElement.setAttribute("data-lang", lang);

    const dict = DICT[lang] || {};

    // 替换 data-i18n 元素的 innerHTML
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      if (Object.prototype.hasOwnProperty.call(dict, key)) {
        el.innerHTML = dict[key];
      } else if (lang === "zh-CN" && originalHtml.has(el)) {
        // 中文词典没这条，还原原文
        el.innerHTML = originalHtml.get(el);
      }
    });

    // 替换属性，格式 placeholder:key|title:key2
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const raw = el.getAttribute("data-i18n-attr") || "";
      raw.split("|").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (!attr || !key) return;
        if (Object.prototype.hasOwnProperty.call(dict, key)) {
          el.setAttribute(attr, dict[key]);
        } else if (lang === "zh-CN" && originalAttrs.has(el)) {
          // 词典没这条就还原原始属性
          const saved = originalAttrs.get(el);
          if (Object.prototype.hasOwnProperty.call(saved, attr)) {
            if (saved[attr] === null) el.removeAttribute(attr);
            else el.setAttribute(attr, saved[attr]);
          }
        }
      });
    });

    // title / description / og:* 等 meta
    translateMeta(dict);

    // 通知页面脚本重绘动态内容
    try {
      const ev = new CustomEvent("xtl:langchange", { detail: { lang } });
      window.dispatchEvent(ev);
    } catch (e) {}
  }

  function translateMeta(dict) {
    // 每个页面的 meta 文案单独配一份
    let path = location.pathname.replace(/\/+$/, "") + "/";
    // 几种首页路径统一成 /
    if (path === "/index.html/" || path === "//") path = "/";
    const normPath = path.replace(/\/+/g, "/");

    const PAGE_META = {
      "/": {
        "zh-CN": {
          title: "GEO优化工具_AI搜索引擎优化_JSON-LD生成器 - 星图邻",
          description: "开源 GEO（生成式引擎优化）工具集：GEO 友好度检测、AI 引用实测、JSON-LD 结构化数据生成，助力网站在豆包、Kimi、ChatGPT 等 AI 回答中被主动引用。免费使用，支持自托管。",
          ogTitle: "星图邻 - 开源 GEO 工具集",
          ogDesc: "GEO 检测、AI 引用实测、JSON-LD 生成，三个开源工具助力网站被 AI 主动引用。",
          twTitle: "星图邻 - 开源 GEO 工具集",
          twDesc: "GEO 检测、AI 引用实测、JSON-LD 生成，三个开源工具助力网站被 AI 主动引用。",
          ogLocale: "zh_CN",
        },
        en: {
          title: "GEO Optimization Tool · AI SEO · JSON-LD Generator - XingTuLink",
          description: "Open-source GEO (Generative Engine Optimization) toolkit: GEO friendliness check, AI citation test and JSON-LD structured-data generator — helping your site get cited in answers from Doubao, Kimi and ChatGPT. Free to use, self-hostable.",
          ogTitle: "XingTuLink - Open-Source GEO Toolkit",
          ogDesc: "GEO check, AI citation test and JSON-LD generator — three open-source tools to help your site get cited by AI.",
          twTitle: "XingTuLink - Open-Source GEO Toolkit",
          twDesc: "GEO check, AI citation test and JSON-LD generator — three open-source tools for AI citations.",
          ogLocale: "en_US",
        },
      },
      "/tools/geo-checker/": {
        "zh-CN": {
          title: "GEO 友好度检测器 | 星图邻",
          description: "在线 GEO 友好度检测工具，从结构化数据、Meta 标签、内容语义、AI 可读性 4 个维度 100 分制评估你的网站，给出可落地的优化建议。所有分析在浏览器本地完成，URL 与 HTML 不会上传。",
          ogLocale: "zh_CN",
        },
        en: {
          title: "GEO Friendliness Checker | XingTuLink",
          description: "Online GEO friendliness checker. Rates your website on a 100-point scale across 4 dimensions — structured data, meta tags, content semantics and AI readability — with actionable optimization suggestions. All analysis runs locally in your browser. URLs and HTML are never uploaded.",
          ogLocale: "en_US",
        },
      },
      "/tools/json-ld-generator/": {
        "zh-CN": {
          title: "JSON-LD 生成器 | 星图邻",
          description: "在线 JSON-LD Schema 生成器，支持 Organization、Article、FAQ、HowTo、Product、LocalBusiness 6 种类型。表单填写即可生成符合 Schema.org 标准的结构化数据代码，一键复制。",
          ogLocale: "zh_CN",
        },
        en: {
          title: "JSON-LD Generator | XingTuLink",
          description: "Online JSON-LD Schema generator supporting 6 types — Organization, Article, FAQ, HowTo, Product, LocalBusiness. Fill a form to get copy-paste ready structured data conforming to Schema.org standards.",
          ogLocale: "en_US",
        },
      },
      "/contact/": {
        "zh-CN": {
          title: "联系我们 | 星图邻",
          description: "联系星图邻（XingTuLink）：邮箱 guohao@zsymtech.cn，电话 +86 176 2902 0227。也可访问母公司西安栈上月明软件科技有限公司 zsoftym.com 了解企业级 GEO 优化服务。",
          ogLocale: "zh_CN",
        },
        en: {
          title: "Contact | XingTuLink",
          description: "Contact XingTuLink — email guohao@zsymtech.cn, phone +86 176 2902 0227. Enterprise-grade GEO services by our parent company Xi'an Zhanshang Yueming Software Technology Co., Ltd. at zsoftym.com.",
          ogLocale: "en_US",
        },
      },
      "/404.html": {
        "zh-CN": {
          title: "404 页面不存在 | 星图邻",
          description: "404 页面",
          ogLocale: "zh_CN",
        },
        en: {
          title: "404 Not Found | XingTuLink",
          description: "404 page",
          ogLocale: "en_US",
        },
      },
    };

    const pageMeta = PAGE_META[normPath] || PAGE_META["/404.html"] || null;
    const lang = document.documentElement.getAttribute("data-lang") || "zh-CN";
    if (!pageMeta || !pageMeta[lang]) return;
    const m = pageMeta[lang];

    if (m.title) {
      const t = document.querySelector("head > title");
      if (t) t.textContent = m.title;
    }
    if (m.description) {
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute("content", m.description);
    }
    if (m.ogTitle) {
      const ogt = document.querySelector('meta[property="og:title"]');
      if (ogt) ogt.setAttribute("content", m.ogTitle);
    }
    if (m.ogDesc) {
      const ogd = document.querySelector('meta[property="og:description"]');
      if (ogd) ogd.setAttribute("content", m.ogDesc);
    }
    if (m.twTitle) {
      const twt = document.querySelector('meta[name="twitter:title"]');
      if (twt) twt.setAttribute("content", m.twTitle);
    }
    if (m.twDesc) {
      const twd = document.querySelector('meta[name="twitter:description"]');
      if (twd) twd.setAttribute("content", m.twDesc);
    }
    if (m.ogLocale) {
      const ogl = document.querySelector('meta[property="og:locale"]');
      if (ogl) ogl.setAttribute("content", m.ogLocale);
    }
  }

  // 语言切换按钮，插到 .nav 末尾
  function injectToggle() {
    if (document.querySelector(".lang-toggle")) return;
    const nav = document.querySelector(".site-header .nav");
    if (!nav) return;

    const current = document.documentElement.getAttribute("data-lang") || "zh-CN";
    const other = current === "zh-CN" ? "en" : "zh-CN";

    const wrap = document.createElement("div");
    wrap.className = "lang-toggle";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Language Switch");
    wrap.innerHTML =
      '<button type="button" class="lt-btn lt-zh" data-lang="zh-CN" title="中文">' +
      '<span class="lt-ico"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="3" y1="12" x2="21" y2="12"></line><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path></svg></span>' +
      '<span class="lt-label">中文</span>' +
      "</button>" +
      '<button type="button" class="lt-btn lt-en" data-lang="en" title="English">' +
      '<span class="lt-label">EN</span>' +
      "</button>";

    // 放在 .nav-cta 旁边；找不到 cta 就直接追加到 nav 末尾
    const cta = nav.querySelector(".nav-cta");
    // GitHub 图标固定夹在语言切换和 cta 之间
    const GITHUB_URL = "https://github.com/ZSoftYM/geo-friendly-checker";
    const GITHUB_TITLE_ZH = "开源仓库 · GitHub";
    const GITHUB_TITLE_EN = "Open Source · GitHub";
    const githubLabel = (document.documentElement.getAttribute("data-lang") === "en") ? GITHUB_TITLE_EN : GITHUB_TITLE_ZH;
    const gh = document.createElement("a");
    gh.className = "nav-github";
    gh.setAttribute("href", GITHUB_URL);
    gh.setAttribute("target", "_blank");
    gh.setAttribute("rel", "noopener noreferrer");
    gh.setAttribute("title", githubLabel);
    gh.setAttribute("aria-label", githubLabel);
    gh.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.63 22.42c.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.65 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.39-2.69 5.36-5.25 5.64.41.35.78 1.04.78 2.11 0 1.52-.01 2.75-.01 3.13 0 .3.21.66.79.55A11.5 11.5 0 0 0 12 .5z"/></svg>';

    if (cta && cta.parentNode) {
      // 顺序：lang-toggle | nav-github | nav-cta
      cta.parentNode.insertBefore(gh, cta);
      cta.parentNode.insertBefore(wrap, gh);
    } else {
      nav.appendChild(wrap);
      nav.appendChild(gh);
    }

    wrap.querySelectorAll(".lt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        setLang(lang);
        updateToggleUI();
        // GitHub 图标的 tooltip 也跟着换
        const ghEl = document.querySelector(".nav-github");
        if (ghEl) {
          const t =
            (document.documentElement.getAttribute("data-lang") === "en")
              ? GITHUB_TITLE_EN
              : GITHUB_TITLE_ZH;
          ghEl.setAttribute("title", t);
          ghEl.setAttribute("aria-label", t);
        }
      });
    });
    updateToggleUI();
  }

  function updateToggleUI() {
    const current = document.documentElement.getAttribute("data-lang") || "zh-CN";
    document.querySelectorAll(".lang-toggle .lt-btn").forEach((btn) => {
      if (btn.getAttribute("data-lang") === current) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // 对外 API
  window.XTLi18n = {
    get t() {
      const lang = document.documentElement.getAttribute("data-lang") || "zh-CN";
      const dict = DICT[lang] || {};
      return (key) => (Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : null);
    },
    get dict() {
      const lang = document.documentElement.getAttribute("data-lang") || "zh-CN";
      return DICT[lang] || {};
    },
    get lang() {
      return document.documentElement.getAttribute("data-lang") || "zh-CN";
    },
    setLang: setLang,
    init: function (opts) {
      const lang = (opts && opts.lang) || detectLang();
      setLang(lang, !(opts && opts.persist === false));
      if (!opts || opts.injectToggle !== false) injectToggle();
    },
    SUPPORTED: SUPPORTED,
  };

  // 自动初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.XTLi18n.init());
  } else {
    window.XTLi18n.init();
  }
})();
