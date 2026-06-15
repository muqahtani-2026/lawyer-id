import { supabaseAdmin } from "@/lib/supabase/admin";

/** يزيل وسوم HTML ويُنظّف المسافات. */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** يستخرج روابط <a> مع نصوصها من HTML. */
function extractAnchors(html: string, baseUrl: string): { url: string; text: string }[] {
  const out: { url: string; text: string }[] = [];
  const re = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    const text = stripHtml(m[2]);
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;
    let abs: string;
    try {
      abs = new URL(href, baseUrl).toString();
    } catch {
      continue;
    }
    out.push({ url: abs, text });
  }
  return out;
}

/** الشرط الإلزاميّ: الرابط يجب أن يكون ضمن نطاق gov.sa الرسميّ. */
function isGovSa(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "gov.sa" || h.endsWith(".gov.sa");
  } catch {
    return false;
  }
}

/** كلمات تدلّ على نظام/لائحة (لتصفية الضوضاء). */
const REG_HINTS = ["نظام", "لائحة", "لوائح", "أنظمة", "تنظيم", "قرار", "مرسوم", "law", "regulation", "system"];

export interface IngestResult {
  ok: boolean;
  inserted: number;
  perSource: { channel: string; name: string; found: number; staged: number; error?: string }[];
}

export async function runIngestion(maxPerSource = 60): Promise<IngestResult> {
  const { data: sources } = await supabaseAdmin
    .from("ingestion_sources")
    .select("channel, name, list_url, enabled")
    .eq("enabled", true);

  const result: IngestResult = { ok: true, inserted: 0, perSource: [] };

  for (const src of sources ?? []) {
    const entry = { channel: src.channel as string, name: src.name as string, found: 0, staged: 0, error: undefined as string | undefined };
    const listUrl = src.list_url as string | null;
    if (!listUrl) { result.perSource.push(entry); continue; }

    try {
      const res = await fetch(listUrl, {
        headers: { "User-Agent": "LAM-Ingest/1.0 (+https://lawyer-id-tgi1.vercel.app)", Accept: "text/html,application/xhtml+xml" },
        // لا نُفشل البناء إن تأخّر الموقع
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      const anchors = extractAnchors(html, listUrl);

      // الإلزاميّ: gov.sa فقط + تلميح أنّه نظام/لائحة + نصّ معقول
      const seen = new Set<string>();
      const candidates = anchors
        .filter((a) => isGovSa(a.url))
        .filter((a) => a.text && a.text.length >= 6 && a.text.length <= 240)
        .filter((a) => REG_HINTS.some((h) => a.text.includes(h) || a.url.toLowerCase().includes(h)))
        .filter((a) => (seen.has(a.url) ? false : (seen.add(a.url), true)))
        .slice(0, maxPerSource);

      entry.found = candidates.length;

      for (const c of candidates) {
        const { error } = await supabaseAdmin
          .from("regulation_ingest")
          .insert({
            source_channel: src.channel,
            source_authority: src.name,
            source_url: c.url,
            url_hash: c.url,
            title: c.text.slice(0, 240),
            status: "pending",
          });
        // تجاهل التكرار (unique على source_url)
        if (!error) { entry.staged++; result.inserted++; }
      }
    } catch (e) {
      entry.error = e instanceof Error ? e.message : "fetch failed";
      result.ok = false;
    }
    result.perSource.push(entry);
  }

  return result;
}

/** يجلب نصّ نظام معيّن (best-effort) عند الاستيراد. */
export async function fetchRegulationText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LAM-Ingest/1.0", Accept: "text/html" },
      signal: AbortSignal.timeout(15000),
    });
    const html = await res.text();
    const text = stripHtml(html);
    return text.slice(0, 20000);
  } catch {
    return "";
  }
}
