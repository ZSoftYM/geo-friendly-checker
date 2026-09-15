// GEO 检测器：粘贴 HTML 或走后端 /api/fetch 抓 URL，四维打分出报告
(function () {
  const $ = (s, r) => (r || document).querySelector(s);

  // 界面文案的中英文词典
  const UI_STR = {
    "zh-CN": {
      dimStructured: "结构化数据",
      dimMeta: "Meta 标签",
      dimContent: "内容语义",
      dimAI: "AI 可读性",
      commentBase: "基础可用，仍有较大优化空间。",
      commentGreat: "表现优秀！GEO 友好度很高，被 AI 引用的概率较大。",
      commentGood: "表现良好，关键维度基本达标。",
      commentMid: "中等水平，多个维度需要优化。",
      commentPoor: "较弱，强烈建议按下方建议进行改造。",
      tagTbd: "待优化",
      tagGreat: "优秀",
      tagGood: "良好",
      tagMid: "中等",
      tagPoor: "较弱",
      issueEmpty: "未发现明显问题，表现优秀！",
      sugEmpty: "暂无额外建议。",
      noJsonLd: "页面没有任何 JSON-LD 结构化数据",
      sugNoJsonLd: "至少为页面添加 Organization 与 Article/Website 的 JSON-LD 块（可使用我们的 JSON-LD 生成器）。",
      fewJsonLd: (n) => `JSON-LD 数量较少（${n} 个），建议覆盖 3 种以上类型`,
      sugFewJsonLd: "组合使用 Organization + Article + FAQ + BreadcrumbList，覆盖更多 AI 引用场景。",
      noMicro: "未发现 Microdata/RDFa 标记（可选，但有助兼容性）",
      invalidJsonLd: "存在 JSON-LD 解析错误，请检查语法",
      sugInvalidJsonLd: "用 Google Rich Results Test 验证每条 JSON-LD。",
      titleBad: (len) => `title 标签${len === 0 ? "缺失" : "长度 " + len + " 字符"}（建议 10–60 字符）`,
      descBad: (len) => `description${len === 0 ? "缺失" : "长度 " + len + " 字符"}（建议 70–160 字符）`,
      noKw: "缺少 keywords meta（影响较小，可选）",
      ogBad: (n) => `OpenGraph 不完整（已设置 ${n}/5）`,
      sugOgBad: "补齐 og:title / og:description / og:image / og:type / og:url。",
      twBad: (n) => `Twitter Card 缺失（已设置 ${n}/3）`,
      sugTwBad: "补齐 twitter:card / twitter:title / twitter:image。",
      noCanonical: "缺少 canonical 链接",
      sugCanonical: '添加 <link rel="canonical" href="..."> 避免重复内容。',
      h1Bad: (n) => `H1 数量异常（${n} 个），建议恰好 1 个`,
      paraLong: (n) => `段落平均 ${n} 字符偏长，建议控制在 200 以内`,
      sugParaLong: "把长段落拆成多个短段落，并在段落开头给出结论。",
      noQuote: "未发现 blockquote 引用块",
      sugQuote: "为关键观点使用 <blockquote> 包裹，便于 AI 抽取。",
      noList: "未使用 ul/ol 列表",
      sugList: "将并列内容改为列表（ul/ol），大模型对列表结构更敏感。",
      imgsNoAlt: (bad, total) => `${bad}/${total} 张图片缺少 alt`,
      sugImgsAlt: "为所有 <img> 填写描述性 alt，提升可访问性。",
      noImg: "页面没有任何图片",
      noLang: "html 缺少 lang 属性",
      sugLang: "为 <html> 加上 lang=\"zh-CN\"，便于 AI 识别语种。",
      shortText: (n) => `正文内容过短（${n} 字符），信息密度不足`,
      sugShortText: "补充正文，建议单页正文 600 字以上。",
      noFaq: "未发现 FAQ 结构（FAQPage）",
      sugFaq: "整理常见问题，添加 FAQPage JSON-LD（可一键生成）。",
      noHowTo: "未发现 HowTo 结构（如教程类页面）",
      sugHowTo: "如果是教程/步骤类页面，使用 HowTo JSON-LD 显著提升被引用概率。",
      fetching: "正在抓取…",
      fetchOk: (n) => "抓取成功，共 " + n + " 字符，开始分析…",
      fetchFail: (msg) => "抓取失败：" + msg + "。请改用「粘贴 HTML 源码」模式。",
      errNoHtml: "请先粘贴 HTML 源码",
      errNoUrl: "请输入 URL",
      errBadUrl: "URL 必须以 http:// 或 https:// 开头",
    },
    en: {
      dimStructured: "Structured Data",
      dimMeta: "Meta Tags",
      dimContent: "Content Semantics",
      dimAI: "AI Readability",
      commentBase: "Baseline usable — still plenty of room for improvement.",
      commentGreat: "Excellent! GEO friendliness is high, AI citation probability is strong.",
      commentGood: "Good — critical dimensions are mostly in place.",
      commentMid: "Fair — several dimensions still need work.",
      commentPoor: "Weak — we strongly recommend improvements below.",
      tagTbd: "Needs Work",
      tagGreat: "Excellent",
      tagGood: "Good",
      tagMid: "Fair",
      tagPoor: "Weak",
      issueEmpty: "No obvious issues found. Great job!",
      sugEmpty: "No extra suggestions at this time.",
      noJsonLd: "No JSON-LD structured data found on page",
      sugNoJsonLd: "Add at least Organization + Article/Website JSON-LD blocks (use our JSON-LD Generator).",
      fewJsonLd: (n) => `Only ${n} JSON-LD block(s). Recommend covering 3+ types`,
      sugFewJsonLd: "Combine Organization + Article + FAQ + BreadcrumbList for more AI citation coverage.",
      noMicro: "No Microdata/RDFa markup (optional, but helps compatibility)",
      invalidJsonLd: "Some JSON-LD failed to parse — please check syntax",
      sugInvalidJsonLd: "Validate each JSON-LD block with Google Rich Results Test.",
      titleBad: (len) => len === 0 ? "Missing <title>" : `Title length ${len} chars (recommend 10–60)`,
      descBad: (len) => len === 0 ? "Missing meta description" : `Description length ${len} chars (recommend 70–160)`,
      noKw: "Missing keywords meta (low impact, optional)",
      ogBad: (n) => `Incomplete OpenGraph (${n}/5 set)`,
      sugOgBad: "Fill in og:title / og:description / og:image / og:type / og:url.",
      twBad: (n) => `Missing Twitter Card fields (${n}/3 set)`,
      sugTwBad: "Fill in twitter:card / twitter:title / twitter:image.",
      noCanonical: "Missing canonical link",
      sugCanonical: 'Add <link rel="canonical" href="..."> to avoid duplicate content.',
      h1Bad: (n) => `Unexpected H1 count (${n}) — exactly 1 is recommended`,
      paraLong: (n) => `Average paragraph ${n} chars is a bit long; aim for ≤ 200`,
      sugParaLong: "Split long paragraphs into short ones and lead with the conclusion.",
      noQuote: "No <blockquote> found",
      sugQuote: "Wrap key claims in <blockquote> so AI can extract them.",
      noList: "No ul/ol lists used",
      sugList: "Turn parallel content into lists (ul/ol) — LLMs are more sensitive to list structure.",
      imgsNoAlt: (bad, total) => `${bad}/${total} image(s) missing alt`,
      sugImgsAlt: "Add descriptive alt text to every <img> for accessibility.",
      noImg: "Page has no images",
      noLang: "Missing lang attribute on <html>",
      sugLang: "Add lang=\"en\" (or match) to <html> so AI can detect the language.",
      shortText: (n) => `Body too short (${n} chars) — low information density`,
      sugShortText: "Expand the body; aim for 600+ words per page.",
      noFaq: "No FAQ structure (FAQPage) detected",
      sugFaq: "Compile FAQs and add FAQPage JSON-LD (generate with one click).",
      noHowTo: "No HowTo structure detected (for tutorial-style pages)",
      sugHowTo: "For how-to / step-by-step pages, use HowTo JSON-LD — it significantly boosts citation.",
      fetching: "Fetching…",
      fetchOk: (n) => `Fetched ${n} chars, starting analysis…`,
      fetchFail: (msg) => `Fetch failed: ${msg}. Please switch to "Paste HTML Source" mode.`,
      errNoHtml: "Please paste HTML source first",
      errNoUrl: "Please enter a URL",
      errBadUrl: "URL must start with http:// or https://",
    },
  };
  function T(key) {
    const lang = window.XTLi18n?.lang || "zh-CN";
    const dict = UI_STR[lang] || UI_STR["zh-CN"];
    const v = dict[key];
    if (typeof v === "function") return v;
    return (
      v ||
      (UI_STR["zh-CN"][key] !== undefined ? UI_STR["zh-CN"][key] : key)
    );
  }
  // T("key") 拿到字符串；值是函数时原样返回，如 T("fewJsonLd")(n)
  let _cachedResult = null;

  // 走后端中转抓页面；后端若独立部署可改成完整地址
  const FETCH_API = '/api/fetch';

  // 模式切换
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const mode = tab.dataset.mode;
      document.querySelectorAll("[data-pane]").forEach((p) => {
        p.style.display = p.dataset.pane === mode ? "" : "none";
      });
    });
  });

  // HTML 解析
  function parse(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc;
  }

  // 各项检测
  function checkStructuredData(doc) {
    const jsonLd = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    const types = new Set();
    let validCount = 0;
    jsonLd.forEach((s) => {
      try {
        const data = JSON.parse(s.textContent.trim());
        collectTypes(data, types);
        validCount++;
      } catch (e) {
        // 解析失败不计为有效
      }
    });
    const microdata = doc.querySelectorAll("[itemscope]").length;
    return {
      jsonLdCount: jsonLd.length,
      types: Array.from(types),
      hasMicrodata: microdata > 0,
      validCount,
    };
  }

  function collectTypes(obj, set) {
    if (!obj) return;
    if (Array.isArray(obj)) return obj.forEach((o) => collectTypes(o, set));
    if (typeof obj === "object") {
      if (obj["@type"]) {
        const t = obj["@type"];
        if (Array.isArray(t)) t.forEach((x) => set.add(x));
        else set.add(t);
      }
      Object.values(obj).forEach((v) => collectTypes(v, set));
    }
  }

  function checkMeta(doc) {
    const get = (sel) => doc.querySelector(sel);
    const title = (get("title")?.textContent || "").trim();
    const desc = (get('meta[name="description"]')?.getAttribute("content") || "").trim();
    const kw = (get('meta[name="keywords"]')?.getAttribute("content") || "").trim();
    const og = {
      title: get('meta[property="og:title"]')?.getAttribute("content"),
      desc: get('meta[property="og:description"]')?.getAttribute("content"),
      image: get('meta[property="og:image"]')?.getAttribute("content"),
      type: get('meta[property="og:type"]')?.getAttribute("content"),
      url: get('meta[property="og:url"]')?.getAttribute("content"),
    };
    const ogCount = Object.values(og).filter(Boolean).length;
    const twitter = {
      card: get('meta[name="twitter:card"]')?.getAttribute("content"),
      title: get('meta[name="twitter:title"]')?.getAttribute("content"),
      image: get('meta[name="twitter:image"]')?.getAttribute("content"),
    };
    const twCount = Object.values(twitter).filter(Boolean).length;
    const canonical = get('link[rel="canonical"]')?.getAttribute("href");

    return {
      title,
      titleLen: title.length,
      titleOk: title.length > 0 && title.length <= 60,
      desc,
      descLen: desc.length,
      descOk: desc.length > 0 && desc.length <= 160,
      hasKw: kw.length > 0,
      ogCount,
      ogOk: ogCount >= 4,
      twCount,
      twOk: twCount >= 2,
      hasCanonical: !!canonical,
    };
  }

  function checkContent(doc) {
    const headings = {};
    ["h1", "h2", "h3", "h4", "h5", "h6"].forEach((tag) => {
      headings[tag] = doc.querySelectorAll(tag).length;
    });
    const paragraphs = Array.from(doc.querySelectorAll("p"));
    const paraLenAvg =
      paragraphs.length > 0
        ? Math.round(
            paragraphs.reduce((s, p) => s + (p.textContent || "").trim().length, 0) /
              paragraphs.length
          )
        : 0;
    const hasBlockquote = doc.querySelectorAll("blockquote").length > 0;
    const lists = doc.querySelectorAll("ul, ol").length;
    const imgs = doc.querySelectorAll("img");
    const imgsNoAlt = Array.from(imgs).filter(
      (i) => !(i.getAttribute("alt") || "").trim()
    ).length;
    return {
      headings,
      h1Count: headings.h1,
      paraLenAvg,
      hasBlockquote,
      lists,
      imgsTotal: imgs.length,
      imgsNoAlt,
    };
  }

  function checkAI(doc) {
    const html = doc.documentElement;
    const hasLang = !!html.getAttribute("lang");
    const text = (doc.body?.textContent || "").trim();
    const hasFaq = !!doc.querySelector(
      'script[type="application/ld+json"]'
    ) && /FAQPage/i.test(
      Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent)
        .join(" ")
    );
    const hasHowTo = !!doc.querySelector(
      'script[type="application/ld+json"]'
    ) && /HowTo/i.test(
      Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
        .map((s) => s.textContent)
        .join(" ")
    );
    return {
      hasLang,
      wordCount: text.length,
      hasFaq,
      hasHowTo,
    };
  }

  // 评分
  function calcStructured(d) {
    let score = 0;
    const issues = [];
    const sug = [];
    if (d.jsonLdCount > 0) score += 10;
    else {
      issues.push({ level: "bad", text: T("noJsonLd") });
      sug.push(T("sugNoJsonLd"));
    }
    if (d.jsonLdCount >= 3) score += 10;
    else if (d.jsonLdCount > 0) {
      issues.push({ level: "warn", text: T("fewJsonLd")(d.jsonLdCount) });
      sug.push(T("sugFewJsonLd"));
    }
    if (d.hasMicrodata) score += 5;
    else {
      issues.push({ level: "warn", text: T("noMicro") });
    }
    if (d.jsonLdCount > 0 && d.validCount === d.jsonLdCount) score += 5;
    else if (d.jsonLdCount > 0) {
      issues.push({ level: "bad", text: T("invalidJsonLd") });
      sug.push(T("sugInvalidJsonLd"));
    }
    return { score, max: 30, label: T("dimStructured"), issues, sug };
  }

  function calcMeta(d) {
    let score = 0;
    const issues = [];
    const sug = [];
    if (d.titleOk) score += 5;
    else
      issues.push({
        level: d.titleLen === 0 ? "bad" : "warn",
        text: T("titleBad")(d.titleLen),
      });
    if (d.descOk) score += 5;
    else
      issues.push({
        level: d.descLen === 0 ? "bad" : "warn",
        text: T("descBad")(d.descLen),
      });
    if (d.hasKw) score += 3;
    else issues.push({ level: "warn", text: T("noKw") });
    if (d.ogOk) score += 6;
    else {
      issues.push({ level: "bad", text: T("ogBad")(d.ogCount) });
      sug.push(T("sugOgBad"));
    }
    if (d.twOk) score += 3;
    else {
      issues.push({ level: "warn", text: T("twBad")(d.twCount) });
      sug.push(T("sugTwBad"));
    }
    if (d.hasCanonical) score += 3;
    else {
      issues.push({ level: "warn", text: T("noCanonical") });
      sug.push(T("sugCanonical"));
    }
    return { score, max: 25, label: T("dimMeta"), issues, sug };
  }

  function calcContent(d) {
    let score = 0;
    const issues = [];
    const sug = [];
    if (d.h1Count === 1) score += 8;
    else {
      issues.push({
        level: d.h1Count === 0 ? "bad" : "warn",
        text: T("h1Bad")(d.h1Count),
      });
    }
    if (d.paraLenAvg > 0 && d.paraLenAvg <= 200) score += 5;
    else if (d.paraLenAvg > 200) {
      issues.push({ level: "warn", text: T("paraLong")(d.paraLenAvg) });
      sug.push(T("sugParaLong"));
    }
    if (d.hasBlockquote) score += 4;
    else {
      issues.push({ level: "warn", text: T("noQuote") });
      sug.push(T("sugQuote"));
    }
    if (d.lists > 0) score += 4;
    else {
      issues.push({ level: "warn", text: T("noList") });
      sug.push(T("sugList"));
    }
    if (d.imgsTotal > 0 && d.imgsNoAlt === 0) score += 4;
    else if (d.imgsTotal > 0) {
      issues.push({ level: "bad", text: T("imgsNoAlt")(d.imgsNoAlt, d.imgsTotal) });
      sug.push(T("sugImgsAlt"));
    } else {
      issues.push({ level: "warn", text: T("noImg") });
    }
    return { score, max: 25, label: T("dimContent"), issues, sug };
  }

  function calcAI(d) {
    let score = 0;
    const issues = [];
    const sug = [];
    if (d.hasLang) score += 5;
    else {
      issues.push({ level: "bad", text: T("noLang") });
      sug.push(T("sugLang"));
    }
    if (d.wordCount > 300) score += 5;
    else if (d.wordCount > 0) {
      issues.push({ level: "warn", text: T("shortText")(d.wordCount) });
      sug.push(T("sugShortText"));
    }
    if (d.hasFaq) score += 5;
    else {
      issues.push({ level: "warn", text: T("noFaq") });
      sug.push(T("sugFaq"));
    }
    if (d.hasHowTo) score += 5;
    else {
      issues.push({ level: "warn", text: T("noHowTo") });
      sug.push(T("sugHowTo"));
    }
    return { score, max: 20, label: T("dimAI"), issues, sug };
  }

  // 渲染结果
  function render(result) {
    _cachedResult = result;
    const re = $("#resultEmpty");
    if (re) re.style.display = "none";
    const rb = $("#resultBody");
    if (rb) rb.style.display = "";
    // 有结果了才显示水印栏和下载按钮
    const sb = $("#geoShareBar");
    if (sb) sb.style.display = "flex";
    const ts = $("#totalScore");
    if (ts) ts.textContent = result.total;

    const total = result.total;
    let comment = T("commentBase");
    let tag = T("tagTbd");
    let tagCls = "warn";
    if (total >= 85) {
      comment = T("commentGreat");
      tag = T("tagGreat");
      tagCls = "ok";
    } else if (total >= 70) {
      comment = T("commentGood");
      tag = T("tagGood");
      tagCls = "ok";
    } else if (total >= 50) {
      comment = T("commentMid");
      tag = T("tagMid");
      tagCls = "warn";
    } else {
      comment = T("commentPoor");
      tag = T("tagPoor");
      tagCls = "bad";
    }
    const tc = $("#totalComment");
    if (tc) tc.textContent = comment;
    const tagEl = $("#totalTag");
    if (tagEl) {
      tagEl.textContent = tag;
      tagEl.className = "score-tag " + tagCls;
    }

    const dims = $("#dims");
    if (dims) {
      dims.innerHTML = "";
      result.dims.forEach((d) => {
        const ratio = d.max > 0 ? Math.round((d.score / d.max) * 100) : 0;
        const cls = ratio >= 85 ? "ok" : ratio >= 60 ? "" : ratio >= 40 ? "warn" : "bad";
        const wrap = document.createElement("div");
        wrap.className = "dim-row";
        wrap.innerHTML = `
          <header>
            <span>${escape(d.label)}</span>
            <b>${d.score} / ${d.max}</b>
          </header>
          <div class="bar ${cls}"><i style="width:${ratio}%"></i></div>
        `;
        dims.appendChild(wrap);
      });
    }

    const issues = $("#issues");
    if (issues) {
      issues.innerHTML = "";
      if (result.allIssues.length === 0) {
        issues.innerHTML = `<li><span class="dot ok"></span><span>${escape(T("issueEmpty"))}</span></li>`;
      } else {
        result.allIssues.forEach((it) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="dot ${it.level}"></span><span>${escape(it.text)}</span>`;
          issues.appendChild(li);
        });
      }
    }

    const sug = $("#suggestions");
    if (sug) {
      sug.innerHTML = "";
      if (result.allSug.length === 0) {
        sug.innerHTML = `<li><span class="dot ok"></span><span>${escape(T("sugEmpty"))}</span></li>`;
      } else {
        result.allSug.forEach((t) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="dot warn"></span><span>${escape(t)}</span>`;
          sug.appendChild(li);
        });
      }
    }

    // 更新标签徽标计数
    $("#issuesCount") && ($("#issuesCount").textContent = result.allIssues.length);
    $("#sugCount") && ($("#sugCount").textContent = result.allSug.length);

    // 重置到「各维度得分」标签
    switchResultTab("dims");
  }

  // 结果标签切换
  function switchResultTab(name) {
    document.querySelectorAll(".result-tab").forEach((t) => {
      if (t && t.dataset && t.classList) {
        t.classList.toggle("active", t.dataset.rtab === name);
      }
    });
    document.querySelectorAll(".result-pane").forEach((p) => {
      if (p && p.dataset && p.classList) {
        p.classList.toggle("active", p.dataset.rpane === name);
      }
    });
  }

  document.querySelectorAll(".result-tab").forEach((tab) => {
    if (tab && tab.addEventListener) {
      tab.addEventListener("click", () => switchResultTab(tab.dataset.rtab));
    }
  });

  function escape(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  // 主流程
  function runAnalysis(html) {
    const doc = parse(html);
    const sd = checkStructuredData(doc);
    const mt = checkMeta(doc);
    const ct = checkContent(doc);
    const ai = checkAI(doc);

    const a = calcStructured(sd);
    const b = calcMeta(mt);
    const c = calcContent(ct);
    const d = calcAI(ai);

    const dims = [a, b, c, d];
    const total = dims.reduce((s, x) => s + x.score, 0);
    const allIssues = [];
    const allSug = [];
    dims.forEach((x) => {
      x.issues.forEach((i) => allIssues.push(i));
      x.sug.forEach((i) => allSug.push(i));
    });
    allIssues.sort((x, y) =>
      ["bad", "warn", "ok"].indexOf(x.level) - ["bad", "warn", "ok"].indexOf(y.level)
    );

    render({ total, dims, allIssues, allSug });
  }

  $("#analyzeBtn")?.addEventListener("click", () => {
    const html = $("#htmlInput").value.trim();
    if (!html) {
      alert(T("errNoHtml"));
      return;
    }
    runAnalysis(html);
  });

  $("#fetchBtn")?.addEventListener("click", async () => {
    const url = $("#urlInput").value.trim();
    if (!url) {
      alert(T("errNoUrl"));
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      alert(T("errBadUrl"));
      return;
    }
    const status = $("#fetchStatus");
    status.textContent = T("fetching");
    $("#fetchBtn").disabled = true;
    try {
      const apiUrl = FETCH_API + "?url=" + encodeURIComponent(url);
      const r = await fetch(apiUrl);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const html = await r.text();
      if (!html) throw new Error("抓取接口未返回内容");
      status.textContent = T("fetchOk")(html.length);
      runAnalysis(html);
    } catch (e) {
      status.textContent = T("fetchFail")(e.message);
    } finally {
      $("#fetchBtn").disabled = false;
    }
  });

  $("#shareImgBtn")?.addEventListener("click", () => {
    try {
      const tip = typeof T === "function" ? T : (k) => k;
      // 从结果页取数据拼一张分享卡片图
      const ts = document.querySelector("#totalScore")?.textContent?.trim() || "0";
      const tg = document.querySelector("#totalTag")?.textContent?.trim() || "";
      const dls = Array.from(document.querySelectorAll(".dim-row header")).map((h) => {
        const sp = h.querySelector("span")?.textContent?.trim() || "";
        const b = h.querySelector("b")?.textContent?.trim() || "";
        return { sp, b };
      });
      const top =
        "GEO " + (tip("siteName") || "Checker") + " · xingtulink.com";
      const wm =
        (document.documentElement.getAttribute("data-lang") === "en"
          ? "Tested by xingtulink.com"
          : "由 xingtulink.com 检测");
      downloadShareCard({ score: ts, tag: tg, dims: dls, top, wm });
    } catch (e) {
      alert("生成图片失败：" + e.message);
    }
  });

  // 分享卡片，原生 Canvas 画完直接下载
  function downloadShareCard({ score, tag, dims, top, wm }) {
    const W = 680;
    const PAD = 32;
    const headerH = 72;
    const scoreH = 180;
    const dimCardH = 78;
    const rowsH = dims.length * dimCardH + Math.max(0, dims.length - 1) * 16;
    const footerH = 82;
    const H = PAD * 2 + headerH + scoreH + rowsH + 32 + footerH;

    const canvas = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    // 背景：浅色渐变
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f7f9ff");
    bg.addColorStop(1, "#eef1ff");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // 卡片
    roundRect(ctx, 20, 20, W - 40, H - 40, 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // 顶栏
    ctx.fillStyle = "#0b0f1a";
    ctx.font = "600 18px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.fillText(top, PAD, 56);

    // 分数区
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.arc(PAD + 80, PAD + headerH + 80, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "800 56px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(score), PAD + 80, PAD + headerH + 80);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = "#0b0f1a";
    ctx.font = "700 28px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.fillText("GEO " + (tag || "Score"), PAD + 180, PAD + headerH + 70);
    ctx.fillStyle = "#5b6172";
    ctx.font = "500 14px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.fillText(
      "AI Search Engine Friendliness Report",
      PAD + 180,
      PAD + headerH + 100
    );
    ctx.fillStyle = "#6366f1";
    ctx.fillText("100 points · 4 dimensions", PAD + 180, PAD + headerH + 126);

    // 维度卡
    let y = PAD + headerH + scoreH + 16;
    dims.forEach((d, i) => {
      const x = PAD;
      const w = W - PAD * 2;
      roundRect(ctx, x, y, w, dimCardH, 16);
      ctx.fillStyle = i % 2 === 0 ? "#f7f8ff" : "#eef0ff";
      ctx.fill();
      // 标题
      ctx.fillStyle = "#0b0f1a";
      ctx.font = "600 16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
      ctx.fillText(String(d.sp || ("Dimension " + (i + 1))), x + 20, y + 30);
      // 得分
      ctx.fillStyle = "#6366f1";
      ctx.font = "700 18px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
      const scoreText = String(d.b || "0 / 25");
      const sw = ctx.measureText(scoreText).width;
      ctx.fillText(scoreText, x + w - 20 - sw, y + 30);
      // 进度条
      const [a, m] = String(d.b || "0/25").replace(/\s+/g, "").split("/").map((s) => parseInt(s, 10));
      const ratio = !isNaN(a) && !isNaN(m) && m > 0 ? a / m : 0;
      const barY = y + 48;
      roundRect(ctx, x + 20, barY, w - 40, 12, 999);
      ctx.fillStyle = "#e6e8ff";
      ctx.fill();
      const barW = Math.max(0, Math.min(1, ratio)) * (w - 40);
      const grd = ctx.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, "#6366f1");
      grd.addColorStop(1, "#8b5cf6");
      roundRect(ctx, x + 20, barY, barW, 12, 999);
      ctx.fillStyle = grd;
      ctx.fill();
      y += dimCardH + 16;
    });

    // 底部水印
    const fy = H - PAD - 10;
    ctx.fillStyle = "#5b6172";
    ctx.font = "500 13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(wm, PAD, fy);
    // 右下角星图邻
    ctx.textAlign = "right";
    ctx.fillStyle = "#0b0f1a";
    ctx.font = "700 15px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
    ctx.fillText("星图邻 · XingTuLink", W - PAD, fy);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // 保存
    const fn = "xingtulink-geo-" + score + ".png";
    try {
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fn;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, "image/png");
    } catch (e) {
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fn;
      a.click();
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 换语言后如果有结果就重画一遍
  window.addEventListener("xtl:langchange", function () {
    if (_cachedResult) {
      // 重跑分析才能让报告里的标签和问题建议都换成新语言
      const htmlInput = $("#htmlInput");
      const htmlVal = (htmlInput && htmlInput.value) || "";
      if (htmlVal.trim()) {
        runAnalysis(htmlVal);
        return;
      }
      // URL 模式抓到的 HTML 没留在输入框里，这里没法重跑
    }
  });
})();
