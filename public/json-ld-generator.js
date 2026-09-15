// JSON-LD 生成器：Organization / Article / FAQ / HowTo / Product / LocalBusiness
(function () {
  const $ = (s, r) => (r || document).querySelector(s);

  // 表单 Label / 描述的中英文映射
  const SCHEMA_I18N = {
    "zh-CN": {
      orgTitle: "Organization · 组织信息",
      orgDesc: "适用于品牌官网、About 页面。",
      artTitle: "Article · 文章",
      artDesc: "适用于博客、新闻、教程文章。",
      faqTitle: "FAQ · 常见问答",
      faqDesc: "输入 Q&A，自动生成 FAQPage 结构。",
      howtoTitle: "HowTo · 操作步骤",
      howtoDesc: "适用于教程、流程类内容。",
      prodTitle: "Product · 产品",
      prodDesc: "适用于商品页。",
      localTitle: "LocalBusiness · 本地商家",
      localDesc: "适用于门店、线下服务商家。",
      // 字段
      fld_org_name: "组织名称 *",
      fld_org_url: "官网 URL *",
      fld_org_logo: "Logo URL",
      fld_org_desc: "简介",
      fld_org_phone: "客服电话",
      fld_org_email: "联系邮箱",
      fld_org_sameas: "社交/其他链接（逗号分隔）",

      fld_art_headline: "标题 *",
      fld_art_author: "作者 *",
      fld_art_date: "发布日期 * (YYYY-MM-DD)",
      fld_art_image: "封面图 URL",
      fld_art_desc: "摘要",
      fld_art_url: "文章 URL *",

      fld_faq_q1: "问题 1 *",
      fld_faq_a1: "答案 1 *",
      fld_faq_q2: "问题 2",
      fld_faq_a2: "答案 2",
      fld_faq_q3: "问题 3",
      fld_faq_a3: "答案 3",

      fld_ht_name: "教程名称 *",
      fld_ht_time: "总耗时（ISO 8601，如 PT5M）",
      fld_ht_step1: "步骤 1 *",
      fld_ht_step2: "步骤 2",
      fld_ht_step3: "步骤 3",
      fld_ht_step4: "步骤 4",
      fld_ht_step5: "步骤 5",

      fld_prod_name: "产品名 *",
      fld_prod_image: "产品图 URL",
      fld_prod_desc: "描述",
      fld_prod_brand: "品牌",
      fld_prod_sku: "SKU",

      fld_lb_name: "商家名 *",
      fld_lb_street: "街道地址 *",
      fld_lb_phone: "电话",
      fld_lb_url: "官网 URL",
      fld_lb_hours: "营业时间（Mo-Fr 09:00-18:00）",

      tipRequired: "提示：标记 * 的必填字段为空时，预览仍会生成，但请补全后再发布。",
      copyOkScript: "✓ 已复制（含 <script> 包裹）",
      copyOkFallback: "✓ 已复制",
    },
    en: {
      orgTitle: "Organization · Info",
      orgDesc: "For brand websites and About pages.",
      artTitle: "Article",
      artDesc: "For blog posts, news and tutorial articles.",
      faqTitle: "FAQ",
      faqDesc: "Enter Q&A pairs to auto-generate FAQPage markup.",
      howtoTitle: "HowTo · Steps",
      howtoDesc: "For tutorials and step-by-step content.",
      prodTitle: "Product",
      prodDesc: "For product pages.",
      localTitle: "LocalBusiness",
      localDesc: "For storefronts and local service providers.",

      fld_org_name: "Organization Name *",
      fld_org_url: "Website URL *",
      fld_org_logo: "Logo URL",
      fld_org_desc: "Description",
      fld_org_phone: "Support Phone",
      fld_org_email: "Contact Email",
      fld_org_sameas: "Social / other URLs (comma-separated)",

      fld_art_headline: "Headline *",
      fld_art_author: "Author *",
      fld_art_date: "Published Date * (YYYY-MM-DD)",
      fld_art_image: "Cover Image URL",
      fld_art_desc: "Description",
      fld_art_url: "Article URL *",

      fld_faq_q1: "Question 1 *",
      fld_faq_a1: "Answer 1 *",
      fld_faq_q2: "Question 2",
      fld_faq_a2: "Answer 2",
      fld_faq_q3: "Question 3",
      fld_faq_a3: "Answer 3",

      fld_ht_name: "How-To Name *",
      fld_ht_time: "Total Time (ISO 8601, e.g. PT5M)",
      fld_ht_step1: "Step 1 *",
      fld_ht_step2: "Step 2",
      fld_ht_step3: "Step 3",
      fld_ht_step4: "Step 4",
      fld_ht_step5: "Step 5",

      fld_prod_name: "Product Name *",
      fld_prod_image: "Product Image URL",
      fld_prod_desc: "Description",
      fld_prod_brand: "Brand",
      fld_prod_sku: "SKU",

      fld_lb_name: "Business Name *",
      fld_lb_street: "Street Address *",
      fld_lb_phone: "Phone",
      fld_lb_url: "Website URL",
      fld_lb_hours: "Opening Hours (Mo-Fr 09:00-18:00)",

      tipRequired: "Note: required * fields are empty — the preview still generates, but please fill them in before publishing.",
      copyOkScript: "✓ Copied (with <script> wrapper)",
      copyOkFallback: "✓ Copied",
    },
  };
  // schema 字段名 → i18n key 的映射
  const FIELD_I18N_MAP = {
    Organization: {
      name: "fld_org_name",
      url: "fld_org_url",
      logo: "fld_org_logo",
      description: "fld_org_desc",
      phone: "fld_org_phone",
      email: "fld_org_email",
      sameAs: "fld_org_sameas",
    },
    Article: {
      headline: "fld_art_headline",
      author: "fld_art_author",
      datePublished: "fld_art_date",
      image: "fld_art_image",
      description: "fld_art_desc",
      url: "fld_art_url",
    },
    FAQ: {
      q1: "fld_faq_q1", a1: "fld_faq_a1",
      q2: "fld_faq_q2", a2: "fld_faq_a2",
      q3: "fld_faq_q3", a3: "fld_faq_a3",
    },
    HowTo: {
      name: "fld_ht_name",
      totalTime: "fld_ht_time",
      step1: "fld_ht_step1", step2: "fld_ht_step2", step3: "fld_ht_step3",
      step4: "fld_ht_step4", step5: "fld_ht_step5",
    },
    Product: {
      name: "fld_prod_name",
      image: "fld_prod_image",
      description: "fld_prod_desc",
      brand: "fld_prod_brand",
      sku: "fld_prod_sku",
    },
    LocalBusiness: {
      name: "fld_lb_name",
      street: "fld_lb_street",
      phone: "fld_lb_phone",
      url: "fld_lb_url",
      openingHours: "fld_lb_hours",
    },
  };
  const TITLE_I18N_KEY = {
    Organization: { title: "orgTitle", desc: "orgDesc" },
    Article: { title: "artTitle", desc: "artDesc" },
    FAQ: { title: "faqTitle", desc: "faqDesc" },
    HowTo: { title: "howtoTitle", desc: "howtoDesc" },
    Product: { title: "prodTitle", desc: "prodDesc" },
    LocalBusiness: { title: "localTitle", desc: "localDesc" },
  };
  function _T(key) {
    const lang = window.XTLi18n?.lang || "zh-CN";
    const d = SCHEMA_I18N[lang] || SCHEMA_I18N["zh-CN"];
    return d[key] ?? SCHEMA_I18N["zh-CN"][key] ?? key;
  }

  // 各 Schema 的表单定义
  const SCHEMAS = {
    Organization: {
      title: "Organization · 组织信息",
      desc: "适用于品牌官网、About 页面。",
      defaults: {
        name: "星图邻 XingTuLink",
        url: "https://xingtulink.com",
        logo: "https://xingtulink.com/img/logo.png",
        description: "在线工具与开源项目发布平台",
        phone: "+86-17629020227",
        email: "guohao@zsymtech.cn",
        sameAs: "https://zsoftym.com/,https://github.com/xingtulink",
      },
      fields: [
        { k: "name", label: "组织名称 *", required: true },
        { k: "url", label: "官网 URL *", required: true },
        { k: "logo", label: "Logo URL", type: "url" },
        { k: "description", label: "简介", textarea: true },
        { k: "phone", label: "客服电话" },
        { k: "email", label: "联系邮箱", type: "email" },
        { k: "sameAs", label: "社交/其他链接（逗号分隔）" },
      ],
      build: (d) => {
        const sameAs = (d.sameAs || "")
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean);
        const obj = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: d.name,
          url: d.url,
        };
        if (d.logo) obj.logo = d.logo;
        if (d.description) obj.description = d.description;
        if (d.phone || d.email) {
          obj.contactPoint = {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["Chinese", "English"],
          };
          if (d.phone) obj.contactPoint.telephone = d.phone;
          if (d.email) obj.contactPoint.email = d.email;
        }
        if (sameAs.length) obj.sameAs = sameAs;
        return obj;
      },
    },

    Article: {
      title: "Article · 文章",
      desc: "适用于博客、新闻、教程文章。",
      defaults: {
        headline: "什么是 GEO？与 SEO 有什么区别？",
        author: "栈上月明",
        datePublished: "2026-08-21",
        image: "https://xingtulink.com/img/og.png",
        description: "一份面向 AI 时代的搜索优化指南。",
        url: "https://xingtulink.com/blog/what-is-geo",
      },
      fields: [
        { k: "headline", label: "标题 *", required: true },
        { k: "author", label: "作者 *", required: true },
        { k: "datePublished", label: "发布日期 * (YYYY-MM-DD)", required: true },
        { k: "image", label: "封面图 URL", type: "url" },
        { k: "description", label: "摘要", textarea: true },
        { k: "url", label: "文章 URL *", required: true, type: "url" },
      ],
      build: (d) => {
        const obj = {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: d.headline,
          author: { "@type": "Person", name: d.author },
          datePublished: d.datePublished,
        };
        if (d.image) obj.image = d.image;
        if (d.description) obj.description = d.description;
        if (d.url) obj.mainEntityOfPage = { "@type": "WebPage", "@id": d.url };
        return obj;
      },
    },

    FAQ: {
      title: "FAQ · 常见问答",
      desc: "输入 Q&A，自动生成 FAQPage 结构。",
      defaults: {
        q1: "什么是 GEO？",
        a1: "GEO（Generative Engine Optimization）是面向生成式 AI 搜索引擎的优化方法。",
        q2: "GEO 和 SEO 有什么区别？",
        a2: "SEO 面向 Google、百度等关键词搜索引擎；GEO 面向豆包、Kimi、文心一言等生成式 AI 回答。",
      },
      fields: [
        { k: "q1", label: "问题 1 *", required: true },
        { k: "a1", label: "答案 1 *", required: true, textarea: true },
        { k: "q2", label: "问题 2" },
        { k: "a2", label: "答案 2", textarea: true },
        { k: "q3", label: "问题 3" },
        { k: "a3", label: "答案 3", textarea: true },
      ],
      build: (d) => {
        const list = [];
        for (let i = 1; i <= 3; i++) {
          if (d["q" + i] && d["a" + i])
            list.push({
              "@type": "Question",
              name: d["q" + i],
              acceptedAnswer: { "@type": "Answer", text: d["a" + i] },
            });
        }
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: list,
        };
      },
    },

    HowTo: {
      title: "HowTo · 操作步骤",
      desc: "适用于教程、流程类内容。",
      defaults: {
        name: "如何为网站添加 JSON-LD？",
        totalTime: "PT5M",
        step1: "选择 Schema 类型",
        step2: "填写表单字段",
        step3: "复制 JSON-LD 并粘贴到 <head> 中",
      },
      fields: [
        { k: "name", label: "教程名称 *", required: true },
        { k: "totalTime", label: "总耗时（ISO 8601，如 PT5M）" },
        { k: "step1", label: "步骤 1 *", required: true },
        { k: "step2", label: "步骤 2" },
        { k: "step3", label: "步骤 3" },
        { k: "step4", label: "步骤 4" },
        { k: "step5", label: "步骤 5" },
      ],
      build: (d) => {
        const steps = [];
        for (let i = 1; i <= 5; i++) {
          if (d["step" + i])
            steps.push({
              "@type": "HowToStep",
              position: i,
              text: d["step" + i],
            });
        }
        const obj = {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: d.name,
          step: steps,
        };
        if (d.totalTime) obj.totalTime = d.totalTime;
        return obj;
      },
    },

    Product: {
      title: "Product · 产品",
      desc: "适用于商品页。",
      defaults: {
        name: "GEO 优化服务（基础版）",
        image: "https://zsoftym.com/og.png",
        description: "面向中小企业的入门级 GEO 优化服务。",
        brand: "栈上月明",
        sku: "ZSYM-GEO-STD-001",
      },
      fields: [
        { k: "name", label: "产品名 *", required: true },
        { k: "image", label: "产品图 URL" },
        { k: "description", label: "描述", textarea: true },
        { k: "brand", label: "品牌" },
        { k: "sku", label: "SKU" },
      ],
      build: (d) => {
        const obj = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: d.name,
        };
        if (d.image) obj.image = d.image;
        if (d.description) obj.description = d.description;
        if (d.brand) obj.brand = { "@type": "Brand", name: d.brand };
        if (d.sku) obj.sku = d.sku;
        return obj;
      },
    },

    LocalBusiness: {
      title: "LocalBusiness · 本地商家",
      desc: "适用于门店、线下服务商家。",
      defaults: {
        name: "西安栈上月明软件科技有限公司",
        street: "陕西 · 西安",
        phone: "+86-17629020227",
        url: "https://zsoftym.com",
        openingHours: "Mo-Fr 09:00-18:00",
      },
      fields: [
        { k: "name", label: "商家名 *", required: true },
        { k: "street", label: "街道地址 *", required: true },
        { k: "phone", label: "电话" },
        { k: "url", label: "官网 URL" },
        { k: "openingHours", label: "营业时间（Mo-Fr 09:00-18:00）" },
      ],
      build: (d) => {
        const obj = {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: d.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: d.street,
            addressLocality: "西安市",
            addressRegion: "陕西省",
            addressCountry: "CN",
          },
        };
        if (d.phone) obj.telephone = d.phone;
        if (d.url) obj.url = d.url;
        if (d.openingHours) obj.openingHours = d.openingHours;
        return obj;
      },
    },
  };

  // 渲染表单
  let current = "Organization";

  function renderForm(type) {
    const def = SCHEMAS[type];
    const tk = TITLE_I18N_KEY[type] || {};
    const titleEl = $("#formTitle");
    const descEl = $("#formDesc");
    if (tk.title) titleEl.textContent = _T(tk.title);
    else titleEl.textContent = def.title;
    if (tk.desc) descEl.textContent = _T(tk.desc);
    else descEl.textContent = def.desc;
    // 挂上 data-i18n，语言切换时好统一处理
    titleEl.setAttribute("data-i18n", "jsonld.formTitle." + type.toLowerCase());
    const form = $("#schemaForm");
    form.innerHTML = "";
    const fieldMap = FIELD_I18N_MAP[type] || {};
    def.fields.forEach((f) => {
      const id = "f_" + f.k;
      const wrap = document.createElement("div");
      const lab = document.createElement("label");
      lab.setAttribute("for", id);
      const i18nKey = fieldMap[f.k];
      lab.textContent = i18nKey ? _T(i18nKey) : f.label;
      wrap.appendChild(lab);
      let el;
      if (f.textarea) {
        el = document.createElement("textarea");
        el.className = "textarea";
        el.rows = 3;
      } else {
        el = document.createElement("input");
        el.className = "input";
        el.type = f.type || "text";
      }
      el.id = id;
      el.name = f.k;
      // 重绘时把已经填的值带过来
      const existing = form.querySelector(`[name="${f.k}"]`);
      el.value = existing && existing.value !== "" ? existing.value : (def.defaults[f.k] || "");
      el.addEventListener("input", update);
      wrap.appendChild(el);
      form.appendChild(wrap);
    });
    update();
  }

  function collect() {
    const form = $("#schemaForm");
    const data = {};
    form.querySelectorAll("[name]").forEach((el) => (data[el.name] = el.value));
    return data;
  }

  function highlight(json) {
    return json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (m) => {
          if (/^"/.test(m)) {
            return /:$/.test(m) ? '<span class="b">' + m + "</span>" : '<span class="s">' + m + "</span>";
          } else if (/true|false/.test(m)) return '<span class="k">' + m + "</span>";
          else if (/null/.test(m)) return '<span class="k">' + m + "</span>";
          else return '<span class="n">' + m + "</span>";
        }
      );
  }

  function update() {
    const def = SCHEMAS[current];
    const data = collect();
    // 必填校验
    let ok = true;
    def.fields.forEach((f) => {
      if (f.required && !data[f.k]) ok = false;
    });
    const obj = def.build(data);
    const str = JSON.stringify(obj, null, 2);
    $("#codePreview").innerHTML = highlight(str);
    $("#codePreview").dataset.raw = str;
    $("#copyTip").textContent = ok
      ? ""
      : _T("tipRequired");
  }

  // 交互
  document.querySelectorAll("#schemaTabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("#schemaTabs .tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      current = tab.dataset.type;
      renderForm(current);
    });
  });

  $("#copyBtn").addEventListener("click", async () => {
    const raw = $("#codePreview").dataset.raw || "";
    // 复制时带一行来源注释
    const wrapped =
      '<!-- Generated by xingtulink.com -->\n' +
      '<script type="application/ld+json">\n' + raw + "\n</script>";
    try {
      await navigator.clipboard.writeText(wrapped);
      $("#copyTip").textContent = _T("copyOkScript");
      setTimeout(() => ($("#copyTip").textContent = ""), 2500);
    } catch (e) {
      // 剪贴板 API 不可用时退回 execCommand
      const ta = document.createElement("textarea");
      ta.value = wrapped;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      $("#copyTip").textContent = _T("copyOkFallback");
      setTimeout(() => ($("#copyTip").textContent = ""), 2500);
    }
  });

  $("#downloadBtn").addEventListener("click", () => {
    const raw = $("#codePreview").dataset.raw || "";
    // 下载的文件也带上来源注释
    const withWatermark =
      "<!-- Generated by xingtulink.com -->\n" +
      '<script type="application/ld+json">\n' + raw + "\n</script>";
    const blob = new Blob([withWatermark], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = current.toLowerCase() + ".jsonld.html";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // 换语言时重绘表单标题和字段
  window.addEventListener("xtl:langchange", function () {
    // renderForm 里已有 existing 逻辑，重绘不会丢填写值
    renderForm(current);
  });

  // 初始化
  renderForm(current);
})();
