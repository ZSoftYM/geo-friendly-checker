// 从页面 HTML 里猜品牌名，按可信度取候选：
// og:site_name → JSON-LD 里的组织/网站名 → application-name → <title> 片段 → 第一个 <h1>

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(s) {
  return String(s || "")
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => {
      try {
        return String.fromCodePoint(parseInt(h, 16));
      } catch {
        return "";
      }
    })
    .replace(/&#(\d+);?/g, (_, d) => {
      try {
        return String.fromCodePoint(parseInt(d, 10));
      } catch {
        return "";
      }
    })
    .replace(/&([a-z]+);?/gi, (m, n) => NAMED_ENTITIES[n.toLowerCase()] ?? m);
}

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]*>/g, " "));
}

function collapseSpaces(s) {
  return s.replace(/\s+/g, " ").trim();
}

function cleanName(s) {
  return collapseSpaces(stripTags(s)).replace(/^[【\[〈《\s]+|[】\]〉》\s]+$/g, "").trim();
}

// 从 JSON-LD 对象里收集组织/网站类名称
function walkJsonLd(node, out, depth = 0) {
  if (depth > 6) return;
  if (Array.isArray(node)) {
    node.forEach((n) => walkJsonLd(n, out, depth + 1));
    return;
  }
  if (node && typeof node === "object") {
    const rawType = node["@type"];
    const types = Array.isArray(rawType) ? rawType.join(",") : String(rawType || "");
    if (/organization|corporation|company|website|localbusiness|brand|store/i.test(types)) {
      if (typeof node.name === "string" && node.name.trim()) out.push(node.name);
    }
    for (const key of ["author", "publisher", "provider", "brand", "manufacturer", "creator", "owner"]) {
      if (node[key]) walkJsonLd(node[key], out, depth + 1);
    }
  }
}

const GENERIC_TITLE_PARTS = /^(首页|主页|官网|官方网站|home|homepage|welcome|index|official(\s+website)?)$/i;

// 返回品牌名候选，按可信度排序、去重，最多 6 个
export function extractBrandCandidates(html) {
  const ordered = [];
  const push = (raw) => {
    const name = cleanName(raw);
    if (name.length < 2 || name.length > 40) return;
    if (!ordered.includes(name)) ordered.push(name);
  };

  // 1) og:site_name / application-name
  const metaMatch = html.match(
    /<meta[^>]+(?:property|name)\s*=\s*["'](?:og:site_name|application-name)["'][^>]*>/i
  );
  if (metaMatch) {
    const content = metaMatch[0].match(/content\s*=\s*["']([^"']*)["']/i);
    if (content) push(content[1]);
  }

  // 2) JSON-LD 中的组织/网站名称（排在 og:site_name 之后）
  const ldBlocks = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of ldBlocks) {
    const jsonText = block.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "");
    try {
      const names = [];
      walkJsonLd(JSON.parse(jsonText.trim()), names);
      names.forEach(push);
    } catch {
      // 忽略解析失败的 JSON-LD
    }
  }

  // 3) <title> 按分隔符拆分
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const title = cleanName(titleMatch[1]);
    if (title) {
      const parts = title
        .split(/[|\-·_–—•▪►›>]/)
        .map((p) => cleanName(p))
        .filter((p) => p.length >= 2 && p.length <= 30 && !GENERIC_TITLE_PARTS.test(p));
      // 通常品牌名在首段或末段，按此顺序入列
      if (parts.length) {
        push(parts[0]);
        push(parts[parts.length - 1]);
        parts.slice(1, -1).forEach(push);
      } else {
        push(title);
      }
    }
  }

  // 4) 首个 h1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const h1 = cleanName(h1Match[1]);
    if (h1 && h1.length <= 40) push(h1);
  }

  return ordered.filter(Boolean).slice(0, 6);
}
