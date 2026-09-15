// AI 引用实测的前端交互：POST 接口、SSE 读进度、渲染报告，文案走双语
(function () {
  const $ = (s) => document.querySelector(s);

  const API_PATH = "/api/geo/citation-test";

  // 界面文案的中英文词典
  const UI_STR = {
    "zh-CN": {
      stageFetching: "正在抓取目标页面…",
      stageExtracting: "正在从页面提取品牌信息…",
      stageQuestions: "正在生成 6 个测试问题…",
      stageAnalyzing: "正在分析未被引用的原因…",
      stageDetecting: "检测中…",
      stageReady: "准备中…",
      progressTesting: (i, t) => `正在检测第 ${i}/${t} 个问题…`,
      brandPrefix: (b) => `品牌：${b}`,
      questionsCount: (n) => `共 ${n} 个问题`,
      btnStart: "开始 AI 引用实测 →",
      btnRunning: "检测进行中…",
      qWaiting: "等待检测",
      qAsking: "正在向 AI 提问…",
      qCited: "已引用 ✓",
      qUncited: "未被引用",
      qFailed: "调用失败，已跳过",
      errUrl: "请填写合法的目标网页 URL（以 http:// 或 https:// 开头）。",
      errKeyword: "请填写行业 / 领域关键词，例如「西安 AI 公司」。",
      errKeywordLen: "关键词最长 40 个字符。",
      errConnect:
        "无法连接检测服务。该功能需要由 Node 后端提供，请通过 node server/server.js 启动服务后访问本页面。",
      errHttp: (s) => `检测服务异常（HTTP ${s}）`,
      errRetry: (s) => `，请 ${s} 秒后重试`,
      errRead: (m) => "读取检测结果中断：" + (m || "网络错误"),
      errGeneric: "检测失败，请稍后重试。",
      statRate: "引用率",
      statCited: "被引用次数",
      statUncited: "未被引用",
      statFailed: "检测失败（已跳过）",
      metaBrand: (v) => `品牌：${v}`,
      metaDomain: (v) => `域名：${v}`,
      metaKeyword: (v) => `关键词：${v}`,
      metaModel: (v) => `模型：${v}`,
      metaDuration: (v) => `耗时：${v}s`,
      metaAliases: (v) => `别名：${v}`,
      badgeCited: "已引用",
      badgeUncited: "未被引用",
      badgeFailed: "检测失败",
      ctxLabel: "引用上下文：",
      itemErr: (m) => `该问题调用失败，已自动跳过：${m}`,
      reasonLabel: "未引用分析：",
      analysisTitle: "未引用原因总结与优化建议",
      reportTitle: "实测报告",
      foot: (time, model) =>
        `检测时间：${time} ｜ 本结果由 ${model} 实时生成，AI 回答存在随机性；引用判定基于品牌名/域名的文本匹配，建议多次检测观察趋势。`,
      locale: "zh-CN",
    },
    en: {
      stageFetching: "Fetching the target page…",
      stageExtracting: "Extracting brand information from the page…",
      stageQuestions: "Generating 6 test questions…",
      stageAnalyzing: "Analyzing why citations were missed…",
      stageDetecting: "Running…",
      stageReady: "Preparing…",
      progressTesting: (i, t) => `Testing question ${i}/${t}…`,
      brandPrefix: (b) => `Brand: ${b}`,
      questionsCount: (n) => `${n} questions in total`,
      btnStart: "Start AI Citation Test →",
      btnRunning: "Test in progress…",
      qWaiting: "Waiting",
      qAsking: "Asking the AI…",
      qCited: "Cited ✓",
      qUncited: "Not cited",
      qFailed: "Call failed, skipped",
      errUrl:
        "Please enter a valid target webpage URL (starting with http:// or https://).",
      errKeyword:
        "Please enter industry / domain keywords, e.g. \"Xi'an AI companies\".",
      errKeywordLen: "Keywords must be no longer than 40 characters.",
      errConnect:
        "Cannot reach the test service. This feature requires the Node backend — start it with node server/server.js and reload the page.",
      errHttp: (s) => `Test service error (HTTP ${s})`,
      errRetry: (s) => ` — please retry in ${s} seconds`,
      errRead: (m) => "Reading the test result was interrupted: " + (m || "network error"),
      errGeneric: "Test failed, please try again later.",
      statRate: "Citation rate",
      statCited: "Cited count",
      statUncited: "Not cited",
      statFailed: "Failed (skipped)",
      metaBrand: (v) => `Brand: ${v}`,
      metaDomain: (v) => `Domain: ${v}`,
      metaKeyword: (v) => `Keywords: ${v}`,
      metaModel: (v) => `Model: ${v}`,
      metaDuration: (v) => `Time: ${v}s`,
      metaAliases: (v) => `Aliases: ${v}`,
      badgeCited: "Cited",
      badgeUncited: "Not cited",
      badgeFailed: "Failed",
      ctxLabel: "Citation context:",
      itemErr: (m) => `This question failed and was skipped: ${m}`,
      reasonLabel: "Why not cited: ",
      analysisTitle: "Summary of missed citations and optimization suggestions",
      reportTitle: "Citation Test Report",
      foot: (time, model) =>
        `Tested at: ${time} | Generated in real time by ${model}. AI answers are stochastic; citation detection is based on brand/domain text matching. Run the test multiple times to observe trends.`,
      locale: "en-US",
    },
  };

  function currentLang() {
    return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh-CN";
  }
  function T() {
    return UI_STR[currentLang()] || UI_STR["zh-CN"];
  }

  const els = {};
  let running = false;
  let total = 0;
  let lastReport = null;
  let lastStageKey = null; // 当前阶段标识，便于切换语言时刷新

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.btn = $("#citeStartBtn");
    els.url = $("#citeUrl");
    els.keyword = $("#citeKeyword");
    els.error = $("#citeError");
    els.progress = $("#citeProgress");
    els.stage = $("#citeStage");
    els.stageCount = $("#citeProgressText");
    els.bar = $("#citeBar");
    els.qList = $("#citeQList");
    els.report = $("#citeReport");
    if (!els.btn) return;
    els.btn.addEventListener("click", start);
  }

  function showError(msg) {
    els.error.hidden = false;
    els.error.textContent = msg;
  }
  function clearError() {
    els.error.hidden = true;
    els.error.textContent = "";
  }

  function resetViews() {
    clearError();
    lastReport = null;
    lastStageKey = "ready";
    els.report.hidden = true;
    els.report.innerHTML = "";
    els.progress.hidden = false;
    els.stage.textContent = T().stageReady;
    els.stageCount.textContent = "";
    els.bar.style.width = "0%";
    els.qList.innerHTML = "";
  }

  async function start() {
    if (running) return;

    // 若用户在上方 URL 模式已填网址，这里自动带入
    if (!els.url.value.trim()) {
      const upperUrl = $("#urlInput");
      if (upperUrl && upperUrl.value.trim()) els.url.value = upperUrl.value.trim();
    }

    const url = els.url.value.trim();
    const keyword = els.keyword.value.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      showError(T().errUrl);
      return;
    }
    if (!keyword) {
      showError(T().errKeyword);
      return;
    }
    if (keyword.length > 40) {
      showError(T().errKeywordLen);
      return;
    }

    running = true;
    els.btn.disabled = true;
    els.btn.textContent = T().btnRunning;
    resetViews();

    let resp;
    try {
      resp = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, keyword }),
      });
    } catch {
      finishWithError(T().errConnect);
      return;
    }

    if (!resp.ok || !resp.body) {
      const S = T();
      let msg = S.errHttp(resp.status);
      try {
        const j = await resp.json();
        if (j && j.error) msg = j.error;
        if (resp.status === 429 && j.retryAfter) msg += S.errRetry(j.retryAfter);
      } catch {
        /* 保留默认文案 */
      }
      finishWithError(msg);
      return;
    }

    try {
      await readStream(resp);
    } catch (e) {
      finishWithError(T().errRead(e.message));
    } finally {
      running = false;
      els.btn.disabled = false;
      els.btn.textContent = T().btnStart;
    }
  }

  function finishWithError(msg) {
    els.progress.hidden = true;
    showError(msg);
    running = false;
    els.btn.disabled = false;
    els.btn.textContent = T().btnStart;
  }

  async function readStream(resp) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let sep;
      while ((sep = buf.indexOf("\n\n")) >= 0) {
        const chunk = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        const line = chunk.split(/\r?\n/).find((l) => l.startsWith("data:"));
        if (!line) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        try {
          handleEvent(JSON.parse(jsonStr));
        } catch {
          /* 忽略个别无法解析的事件 */
        }
      }
    }
  }

  // SSE 事件处理
  function handleEvent(evt) {
    const S = T();
    switch (evt.type) {
      case "stage":
        lastStageKey = evt.stage;
        els.stage.textContent =
          {
            fetching: S.stageFetching,
            extracting: S.stageExtracting,
            questions: S.stageQuestions,
            analyzing: S.stageAnalyzing,
          }[evt.stage] || S.stageDetecting;
        break;
      case "brand":
        // 这里只轻提示一下，完整信息等报告
        els.stageCount.textContent = S.brandPrefix(evt.brand);
        break;
      case "questions":
        total = evt.questions.length;
        els.stageCount.textContent = S.questionsCount(total);
        renderQuestionSkeleton(evt.questions);
        break;
      case "progress": {
        total = evt.total;
        lastStageKey = "progress";
        els.stage.textContent = S.progressTesting(evt.index, evt.total);
        els.stageCount.textContent = `${evt.index}/${evt.total}`;
        els.bar.style.width = `${Math.round(((evt.index - 1) / evt.total) * 100)}%`;
        setRowActive(evt.index - 1);
        break;
      }
      case "item":
        fillRow(evt.item);
        els.bar.style.width = `${Math.round(((evt.item.index + 1) / total) * 100)}%`;
        break;
      case "error":
        showError(evt.message || T().errGeneric);
        els.progress.hidden = true;
        break;
      case "done":
        els.bar.style.width = "100%";
        els.progress.hidden = true;
        renderReport(evt.report);
        break;
    }
  }

  // 检测中的问题列表
  function iconSvg(state) {
    if (state === "active") {
      return '<svg class="cite-spin cite-q-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.56"></path></svg>';
    }
    if (state === "cited") {
      return '<svg class="cite-q-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';
    }
    if (state === "uncited") {
      return '<svg class="cite-q-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"></path></svg>';
    }
    if (state === "error") {
      return '<svg class="cite-q-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 8v5M12 16.5v.5"></path><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path></svg>';
    }
    return '<span class="cite-q-dot"></span>';
  }

  function renderQuestionSkeleton(questions) {
    els.qList.innerHTML = "";
    questions.forEach((q, i) => {
      const li = document.createElement("li");
      li.dataset.index = String(i);
      li.innerHTML =
        '<span class="cite-q-icon-wrap">' + iconSvg("pending") + "</span>" +
        '<div class="cite-q-body"><div class="cite-q-text"></div>' +
        '<div class="cite-q-state"></div></div>';
      li.querySelector(".cite-q-text").textContent = q;
      li.querySelector(".cite-q-state").textContent = T().qWaiting;
      els.qList.appendChild(li);
    });
  }

  function rowAt(i) {
    return els.qList.querySelector(`li[data-index="${i}"]`);
  }

  function setRowActive(i) {
    const li = rowAt(i);
    if (!li || li.classList.contains("is-done")) return;
    li.classList.add("is-active");
    li.querySelector(".cite-q-icon-wrap").innerHTML = iconSvg("active");
    const state = li.querySelector(".cite-q-state");
    if (state) {
      state.textContent = T().qAsking;
      state.className = "cite-q-state cite-q-state-active";
    }
  }

  function fillRow(item) {
    const li = rowAt(item.index);
    if (!li) return;
    li.classList.remove("is-active");
    li.classList.add("is-done", "is-" + item.status);
    li.querySelector(".cite-q-icon-wrap").innerHTML = iconSvg(item.status);
    const state = li.querySelector(".cite-q-state");
    if (state) {
      state.className = "cite-q-state cite-q-state-" + item.status;
      state.textContent =
        item.status === "cited"
          ? T().qCited
          : item.status === "uncited"
            ? T().qUncited
            : T().qFailed;
    }
    if (item.answer) {
      const excerpt = document.createElement("div");
      excerpt.className = "cite-q-excerpt";
      excerpt.textContent = item.answer.slice(0, 110) + (item.answer.length > 110 ? "…" : "");
      li.querySelector(".cite-q-body").appendChild(excerpt);
    }
  }

  // 报告渲染
  function rateClass(rate) {
    if (rate >= 60) return "rate-high";
    if (rate >= 30) return "rate-mid";
    return "rate-low";
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 高亮回答里的品牌名/域名，一遍扫完避免嵌套
  function highlight(text, report) {
    const terms = [];
    const push = (t, type) => {
      t = String(t || "").trim();
      if (t.length < 2) return;
      if (!terms.some((x) => x.t.toLowerCase() === t.toLowerCase())) terms.push({ t, type });
    };
    push(report.brand, "brand");
    (report.aliases || []).forEach((a) => push(a, "brand"));
    push(report.domain, "domain");
    terms.sort((a, b) => b.t.length - a.t.length);

    const safe = escapeHtml(text);
    if (!terms.length) return safe;
    const parts = terms.map(({ t }) => {
      const esc = escapeHtml(t);
      if (/^[\x00-\x7f]+$/.test(t)) {
        // 英文：先转义正则特殊字符，再放宽空白匹配，最后加词边界
        const core = escapeRe(esc).replace(/\s+/g, "\\s+");
        return `(?<![a-z0-9-])${core}(?![a-z0-9-])`;
      }
      // 中文：字与字之间允许出现空白/换行
      return [...esc].map((ch) => escapeRe(ch)).join("\\s*");
    });
    const re = new RegExp(parts.join("|"), "gi");
    return safe.replace(re, (m) => `<mark class="cite-hl">${m}</mark>`);
  }

  function renderReport(r) {
    const S = T();
    lastReport = r;
    const reasonMap = {};
    if (r.analysis && Array.isArray(r.analysis.items)) {
      r.analysis.items.forEach((it) => {
        if (typeof it.index === "number" && it.reason) reasonMap[it.index] = it.reason;
      });
    }

    const stats = [
      `<div class="cite-stat"><div class="k">${S.statRate}</div><div class="v ${rateClass(r.rate)}">${r.rate}%</div></div>`,
      `<div class="cite-stat"><div class="k">${S.statCited}</div><div class="v">${r.citedCount}<small> / ${r.total}</small></div></div>`,
      `<div class="cite-stat"><div class="k">${S.statUncited}</div><div class="v rate-low">${r.uncitedCount}</div></div>`,
    ];
    if (r.errorCount > 0) {
      stats.push(
        `<div class="cite-stat"><div class="k">${S.statFailed}</div><div class="v" style="color:var(--warn)">${r.errorCount}</div></div>`
      );
    }

    const chips = [
      S.metaBrand(escapeHtml(r.brand)),
      S.metaDomain(escapeHtml(r.domain)),
      S.metaKeyword(escapeHtml(r.keyword)),
      S.metaModel(escapeHtml(r.model)),
      S.metaDuration((r.durationMs / 1000).toFixed(1)),
    ];
    if (r.aliases && r.aliases.length) chips.push(S.metaAliases(r.aliases.map(escapeHtml).join(" / ")));

    const itemsHtml = r.items
      .map((item) => {
        const badge =
          item.status === "cited"
            ? `<span class="cite-badge cite-badge-ok">${S.badgeCited}</span>`
            : item.status === "uncited"
              ? `<span class="cite-badge cite-badge-warn">${S.badgeUncited}</span>`
              : `<span class="cite-badge cite-badge-err">${S.badgeFailed}</span>`;
        let body = "";
        if (item.answer) {
          body += `<div class="cite-answer">${highlight(item.answer, r)}</div>`;
          if (item.contexts && item.contexts.length) {
            body +=
              `<div class="cite-ctx"><div>${S.ctxLabel}</div>` +
              item.contexts
                .map((c) => `<p>${highlight(c, r)}</p>`)
                .join("") +
              "</div>";
          }
        }
        if (item.error) {
          body += `<p class="cite-item-err">${S.itemErr(escapeHtml(item.error))}</p>`;
        }
        if (item.status === "uncited" && reasonMap[item.index]) {
          body += `<div class="cite-reason"><b>${S.reasonLabel}</b>${escapeHtml(reasonMap[item.index])}</div>`;
        }
        return (
          '<article class="cite-item">' +
          '<div class="cite-item-head">' +
          `<span class="cite-q-no">Q${item.index + 1}</span>` +
          `<div class="cite-q-main">${escapeHtml(item.question)}</div>` +
          badge +
          "</div>" +
          body +
          "</article>"
        );
      })
      .join("");

    const analysisHtml =
      r.analysis && r.analysis.summary
        ? `<div class="cite-analysis"><h4>${S.analysisTitle}</h4><p>${escapeHtml(r.analysis.summary)}</p></div>`
        : "";

    const created = new Date(r.createdAt).toLocaleString(S.locale, { hour12: false });

    els.report.innerHTML =
      '<div class="cite-report-head">' +
      `<h3>${S.reportTitle}</h3>` +
      "</div>" +
      '<div class="cite-stats">' + stats.join("") + "</div>" +
      '<div class="cite-meta">' +
      chips.map((c) => `<span class="cite-chip">${c}</span>`).join("") +
      "</div>" +
      itemsHtml +
      analysisHtml +
      `<p class="cite-foot">${S.foot(created, escapeHtml(r.model))}</p>`;

    els.report.hidden = false;
  }

  // 换语言时把当前界面按新语言刷一遍
  window.addEventListener("xtl:langchange", function () {
    const S = T();
    // 按钮
    if (els.btn) els.btn.textContent = running ? S.btnRunning : S.btnStart;
    // 进度阶段文案
    if (els.progress && !els.progress.hidden) {
      if (lastStageKey === "ready") els.stage.textContent = S.stageReady;
      else if (lastStageKey === "progress") {
        const m = (els.stageCount.textContent || "").match(/^(\d+)\/(\d+)$/);
        if (m) els.stage.textContent = S.progressTesting(Number(m[1]), Number(m[2]));
      } else if (lastStageKey) {
        els.stage.textContent =
          {
            fetching: S.stageFetching,
            extracting: S.stageExtracting,
            questions: S.stageQuestions,
            analyzing: S.stageAnalyzing,
          }[lastStageKey] || S.stageDetecting;
      }
    } else if (els.stage && !running) {
      els.stage.textContent = S.stageReady;
    }
    // 问题行状态按 li 上的 class 还原，不依赖接口数据
    if (els.qList) {
      els.qList.querySelectorAll("li").forEach((li) => {
        const state = li.querySelector(".cite-q-state");
        if (!state) return;
        if (li.classList.contains("is-cited")) state.textContent = S.qCited;
        else if (li.classList.contains("is-uncited")) state.textContent = S.qUncited;
        else if (li.classList.contains("is-error")) state.textContent = S.qFailed;
        else if (li.classList.contains("is-active")) state.textContent = S.qAsking;
        else state.textContent = S.qWaiting;
      });
    }
    // 报告还在就整份重画
    if (lastReport) renderReport(lastReport);
  });
})();
