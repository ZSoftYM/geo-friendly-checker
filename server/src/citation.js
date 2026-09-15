// AI 引用实测主流程：
// 提品牌 → 1 次调用生成 6 个中立问题 → 逐题提问并本地判定是否提到品牌 → 有未引用再 1 次调用做原因分析
import { config } from "./env.js";
import { chat, chatJSON, DeepSeekError } from "./deepseek.js";
import { extractBrandCandidates } from "./extract.js";

const QUESTION_COUNT = 6;

const GEN_SYSTEM = `你是一名「用户提问模拟」专家，服务于 GEO（生成式引擎优化）品牌引用测试。
任务：根据用户给出的【行业/领域关键词】，模拟真实用户在 AI 助手中可能提出的自然提问。

严格要求：
1. 只输出 JSON：{"brand":"最终确认的品牌名","aliases":["别名1"],"questions":["问题1"]}
2. questions 恰好 ${QUESTION_COUNT} 个中文问句，意图必须各不相同，分别覆盖：
   - 清单/盘点类（如"有哪些""盘点"）
   - 推荐/哪家好类（如"推荐""哪家比较好"）
   - 口碑/评价类（如"怎么样""靠谱吗"）
   - 选择/对比类（如"如何选择""对比"）
   - 价格/费用类（如"多少钱""收费标准"）
   - 地域 + 服务类（若关键词已含地域，可换成周边区域或改为服务流程类）
3. 问题必须中立客观，像毫不知情的普通用户提出；【严禁】在任何问题中出现候选品牌名、公司名或域名，否则测试无效。
4. 每个问题 10–30 字，不要编号，不要"帮我""请问你"之类的称呼堆砌，口语自然。
5. brand：从候选品牌名中确认最规范、最像正式品牌的一个（去掉 SEO 堆砌词和营销话术）；aliases 给出 0–3 个用户实际可能使用的简称、英文名或子品牌名；若候选全部不合理，brand 直接返回目标域名的主域名。`;

const ANSWER_SYSTEM = `你是一个乐于助人、知识广博的 AI 助手。请像平时一样用中文如实回答用户的问题。
回答要求：
1. 若问题涉及列举、推荐、对比，请给出 3–6 个具体的公司/产品/方案名称，每个用一句话说明推荐理由，按你认为合理的顺序排列；
2. 当提到具体公司、产品或网站时，请在名称后用半角括号附上它的官方网址，格式示例：星图邻（xingtulink.com）。只附你确实知道的网址，不确定的不要编造；
3. 基于你的真实知识回答，不要提及本要求；整体回答控制在 400 字以内。`;

const ANALYSIS_SYSTEM = `你是一名 GEO（生成式引擎优化）分析师。针对某品牌的 AI 引用测试已经完成：AI 回答了若干模拟用户问题，其中部分回答没有提到目标品牌。
请逐条分析未引用的可能原因，并给出提升该品牌 AI 引用率的可落地建议。

只输出 JSON：{"items":[{"index":0,"reason":"30-80字原因"}],"summary":"80-150字总体结论与优先级建议"}
要求：
- items 中 index 必须是输入数据里该问题的原始 index；
- reason 必须结合该条回答的实际内容，例如"回答被 A、B、C 等知名竞品占据，品牌未进入推荐名单""问题属于信息查询类，回答没有推荐任何商家""品牌公开权威信息不足，AI 无法确认其业务"等，不要空泛套话；
- summary 要给出可执行的优化优先级（如结构化数据、百科/媒体露出、口碑内容建设等）。`;

function genUserMessage(keyword, candidates, domain) {
  return `【行业/领域关键词】
${keyword}

【候选品牌名（从目标页面自动提取，可能含 SEO 噪声）】
${candidates.length ? candidates.map((c, i) => `${i + 1}. ${c}`).join("\n") : "（无）"}

【目标域名】
${domain}`;
}

function cleanTerm(s) {
  return String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 去掉公司后缀，拿简称（如"XX有限公司"→"XX"）
function suffixVariant(term) {
  return term
    .replace(/(集团股份有限公司|集团有限责任公司|股份有限公司|有限责任公司|集团有限公司|有限公司|集团公司|集团)$/, "")
    .trim();
}

// 汇总要匹配的品牌词和域名词
export function buildTerms({ brand, aliases = [], domain }) {
  const brandTerms = new Set();
  const addBrand = (raw) => {
    const t = cleanTerm(raw);
    if (t.length < 2 || t.toLowerCase() === domain) return;
    brandTerms.add(t);
    const short = suffixVariant(t);
    if (short.length >= 2 && short !== t) brandTerms.add(short);
  };
  addBrand(brand);
  aliases.forEach(addBrand);

  const domainTerms = new Set([domain]);
  const parts = domain.split(".");
  if (parts.length >= 3) {
    // co.uk、com.cn 这种多级后缀不能切，否则会把 "co.uk" 当成匹配词
    const SECOND_LEVEL = new Set(["com", "net", "org", "gov", "edu", "ac", "co", "me", "ltd", "plc", "nhs", "go", "ne"]);
    const tld = parts[parts.length - 1];
    const sld = parts[parts.length - 2];
    const isMultiPartSuffix = tld.length === 2 && SECOND_LEVEL.has(sld);
    if (isMultiPartSuffix) {
      if (parts.length >= 4) domainTerms.add(parts.slice(-3).join("."));
    } else {
      domainTerms.add(parts.slice(-2).join("."));
    }
  }

  return { domainTerms: [...domainTerms], brandTerms: [...brandTerms] };
}

// 品牌词转正则：中文允许字间夹空白，纯英文用词边界
function termPattern(term) {
  const esc = escapeRe(term);
  if (/^[\x00-\x7f]+$/.test(term)) {
    return `(?<![a-z0-9])${esc.replace(/\s+/g, "\\s+")}(?![a-z0-9])`;
  }
  return [...esc].join("\\s*");
}

// 在回答里找品牌/域名，收集命中文本和上下文片段
export function detectMention(answer, terms) {
  const matches = [];
  const contexts = [];
  const seenMatch = new Set();
  const seenCtx = new Set();

  const collect = (re, type, value) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(answer)) !== null) {
      const key = `${type}:${value.toLowerCase()}`;
      if (!seenMatch.has(key)) {
        seenMatch.add(key);
        matches.push({ type, value });
      }
      const start = Math.max(0, m.index - 40);
      const end = Math.min(answer.length, m.index + m[0].length + 40);
      const ctx = answer.slice(start, end).trim();
      if (!seenCtx.has(ctx) && contexts.length < 4) {
        seenCtx.add(ctx);
        contexts.push(ctx);
      }
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  };

  for (const d of terms.domainTerms) {
    collect(new RegExp(`(?<![a-z0-9-])${escapeRe(d)}(?![a-z0-9-])`, "gi"), "domain", d);
  }
  for (const b of terms.brandTerms) {
    collect(new RegExp(termPattern(b), "gi"), "brand", b);
  }
  return { matches, contexts };
}

// 问题里如果漏出了品牌名就剔除（模型偶尔不守规矩）；剔完不足 3 个就宁可不剔
function sanitizeQuestions(questions, terms) {
  const clean = questions.filter((q) => {
    const lower = q.toLowerCase();
    if (terms.domainTerms.some((d) => lower.includes(d))) return false;
    const compact = lower.replace(/\s+/g, "");
    if (terms.brandTerms.some((b) => b.length >= 3 && compact.includes(b.toLowerCase().replace(/\s+/g, "")))) {
      return false;
    }
    return true;
  });
  return clean.length >= 3 ? clean : questions;
}

// 跑完整实测，过程事件通过 emit 推给前端
export async function runCitationTest({ url, keyword, html }, { emit, signal }) {
  const startedAt = Date.now();
  const u = new URL(url);
  const hostname = u.hostname.toLowerCase();
  const domain = hostname.replace(/^www\./, "");

  // 先从页面里提品牌候选
  emit({ type: "stage", stage: "extracting" });
  const candidates = extractBrandCandidates(html);

  // 让模型确认品牌并出问题
  emit({ type: "stage", stage: "questions" });
  let gen;
  try {
    gen = await chatJSON(
      [
        { role: "system", content: GEN_SYSTEM },
        { role: "user", content: genUserMessage(keyword, candidates, domain) },
      ],
      { temperature: 0.8, maxTokens: 1200, timeoutMs: config.genTimeoutMs, signal }
    );
  } catch (e) {
    const msg = e instanceof DeepSeekError ? e.message : e.message;
    throw new DeepSeekError(`生成测试问题失败：${msg}`, e.status || 502);
  }

  const brand = cleanTerm(gen.brand) || candidates[0] || domain;
  const aliases = Array.isArray(gen.aliases)
    ? gen.aliases.map(cleanTerm).filter((x) => x && x !== brand).slice(0, 3)
    : [];
  const terms = buildTerms({ brand, aliases, domain });

  let questions = Array.isArray(gen.questions)
    ? [...new Set(gen.questions.map((q) => cleanTerm(q)).filter(Boolean))]
    : [];
  if (questions.length < 3) {
    throw new DeepSeekError("模型返回的有效问题数量不足，请重试", 502);
  }
  questions = sanitizeQuestions(questions.slice(0, 8), terms);

  emit({ type: "brand", brand, aliases, domain, candidates });
  emit({ type: "questions", questions });

  // 逐题提问并判定引用，单题挂了不影响后面
  const items = [];
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    emit({ type: "progress", index: i + 1, total: questions.length, question });

    const item = {
      index: i,
      question,
      status: "uncited",
      cited: false,
      answer: "",
      matches: [],
      contexts: [],
      error: null,
    };
    try {
      const { content } = await chat(
        [
          { role: "system", content: ANSWER_SYSTEM },
          { role: "user", content: question },
        ],
        { temperature: 0.7, maxTokens: 1500, timeoutMs: config.answerTimeoutMs, signal }
      );
      item.answer = content.trim();
      const found = detectMention(item.answer, terms);
      item.matches = found.matches;
      item.contexts = found.contexts;
      item.cited = found.matches.length > 0;
      item.status = item.cited ? "cited" : "uncited";
    } catch (e) {
      item.status = "error";
      item.error = e instanceof DeepSeekError ? e.message : `调用失败：${e.message}`;
    }

    items.push(item);
    emit({ type: "item", item });
  }

  // 有没提到的题再花一次调用问原因，这步挂了就算了
  let analysis = null;
  const uncited = items.filter((x) => x.status === "uncited");
  if (uncited.length > 0) {
    emit({ type: "stage", stage: "analyzing" });
    try {
      analysis = await chatJSON(
        [
          { role: "system", content: ANALYSIS_SYSTEM },
          {
            role: "user",
            content: `【目标品牌】${brand}（${domain}）
【行业/领域关键词】${keyword}
【未引用问题及 AI 回答（index 为原始题号，从 0 开始）】
${JSON.stringify(
  uncited.map((x) => ({ index: x.index, question: x.question, answer: x.answer })),
  null,
  2
)}`,
          },
        ],
        { temperature: 0.4, maxTokens: 1200, timeoutMs: config.analysisTimeoutMs, signal }
      );
      if (!analysis || typeof analysis !== "object") analysis = null;
    } catch {
      analysis = null;
    }
  }

  const citedCount = items.filter((x) => x.status === "cited").length;
  const errorCount = items.filter((x) => x.status === "error").length;
  const report = {
    url,
    keyword,
    brand,
    aliases,
    domain,
    questions,
    items,
    citedCount,
    uncitedCount: items.length - citedCount - errorCount,
    errorCount,
    total: items.length,
    rate: items.length ? Math.round((citedCount / items.length) * 100) : 0,
    analysis,
    model: config.deepseekModel,
    durationMs: Date.now() - startedAt,
    createdAt: new Date().toISOString(),
  };
  emit({ type: "done", report });
  return report;
}
