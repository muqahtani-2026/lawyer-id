#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
محرّك التدقيق الذكيّ للطبقة 3 — مشروع لام (LAM)
================================================
الغرض: يمرّ على الروابط بين الأحداث والأنظمة الأمّ (l3_event_links)،
ويستخدم GPT لـ:
  1. تأكيد أنّ الحدث تعديل/إصدار حقيقيّ للنظام (لا ذكر عابر).
  2. تصحيح التاريخ الهجريّ المشوّه إلى نسق صحيح.
  3. تصحيح/تنقية قائمة المواد المتأثّرة (إزالة الأرقام الخاطئة).
  4. استخراج ملخّص دقيق للتعديل (ماذا تغيّر).

يكتب النتائج في جدول l3_event_links (أعمدة جديدة) دون لمس النصّ الحرفيّ raw_text.

التشغيل:
  python refine.py            # يدقّق كلّ الروابط غير المدقّقة
  python refine.py 10         # يدقّق 10 فقط (تجربة)

المتطلّبات: pip install openai requests
"""

import sys, json, time
import requests

# ───────────────────────── الإعدادات ─────────────────────────
# تُقرأ من config.py (نفس نمط سكربت أم القرى)
try:
    from config import OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
except ImportError:
    print("✗ لم يُعثر على config.py. أنشئه بالمفاتيح المطلوبة (انظر config.example.py).")
    sys.exit(1)

OPENAI_MODEL = "gpt-4o-mini"   # اقتصاديّ ودقيق لهذه المهمّة
BATCH_LIMIT  = int(sys.argv[1]) if len(sys.argv) > 1 else 100000

HEADERS_SB = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}

# ───────────────────────── دالّة GPT ─────────────────────────
SYSTEM_PROMPT = """أنت مدقّق قانونيّ سعوديّ خبير. تُعطى نصّ قرار/مرسوم من جريدة أم القرى،
واسم نظام أمّ مُقترَح. مهمّتك التحقّق والتصحيح بدقّة تامّة.

أعِد JSON فقط بهذا الشكل (لا تكتب أيّ شيء آخر):
{
  "is_real_amendment": true/false,   // هل هذا فعلًا تعديل/إصدار/لائحة للنظام المذكور؟ (لا ذكر عابر)
  "relation": "issued|amended|executive|repealed|mention",  // نوع العلاقة بالنظام
  "corrected_date_hijri": "YYYY/MM/DD",  // التاريخ الهجريّ الصحيح من النصّ (أو null)
  "affected_articles": [أرقام المواد المعدّلة فعلًا كما وردت في النصّ، أو []],
  "summary": "جملة واحدة دقيقة: ماذا عدّل هذا القرار في النظام؟"
}

قواعد صارمة:
- لا تخترع. إن لم يُذكر تاريخ صحيح، أعِد null.
- المواد: فقط ما ذُكر صراحةً أنّه عُدّل. تجاهل أرقام المعاملات والبرقيات.
- إن كان النصّ لا يخصّ النظام المذكور (ذكر عابر)، اجعل is_real_amendment=false."""

def ask_gpt(raw_text, system_name):
    user = f"اسم النظام الأمّ المُقترَح: {system_name}\n\nنصّ القرار:\n{raw_text[:3500]}"
    body = {
        "model": OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }
    for attempt in range(5):
        try:
            r = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}",
                         "Content-Type": "application/json"},
                json=body, timeout=60,
            )
            if r.status_code == 200:
                return json.loads(r.json()["choices"][0]["message"]["content"])
            print(f"    ⚠ GPT {r.status_code} (محاولة {attempt+1}/5): {r.text[:120]}")
        except Exception as e:
            print(f"    ⚠ خطأ اتّصال (محاولة {attempt+1}/5): {str(e)[:120]}")
        time.sleep(10)
    return None

# ───────────────────────── Supabase ─────────────────────────
def fetch_pending():
    """يجلب الروابط التي لم تُدقّق بعد، مع نصّ الحدث واسم النظام."""
    url = (f"{SUPABASE_URL}/rest/v1/l3_event_links"
           "?select=id,link_kind,refined,event_id,l3_instrument_id,"
           "legal_events(raw_text),l3_instruments(canonical_name)"
           "&refined=is.null"
           f"&limit={BATCH_LIMIT}")
    r = requests.get(url, headers=HEADERS_SB, timeout=60)
    r.raise_for_status()
    return r.json()

def update_link(link_id, data):
    url = f"{SUPABASE_URL}/rest/v1/l3_event_links?id=eq.{link_id}"
    requests.patch(url, headers=HEADERS_SB, json=data, timeout=30).raise_for_status()

# ───────────────────────── الرئيسيّ ─────────────────────────
def main():
    print("محرّك التدقيق الذكيّ — الطبقة 3")
    print("جلب الروابط غير المدقّقة…")
    rows = fetch_pending()
    print(f"وُجد {len(rows)} رابطًا للتدقيق.\n")

    ok = real = skip = 0
    for idx, row in enumerate(rows, 1):
        ev = row.get("legal_events") or {}
        inst = row.get("l3_instruments") or {}
        raw = ev.get("raw_text", "")
        name = inst.get("canonical_name", "")
        if not raw or not name:
            skip += 1
            continue

        res = ask_gpt(raw, name)
        if res is None:
            print(f"[{idx}/{len(rows)}] فشل GPT — نتخطّى")
            skip += 1
            continue

        patch = {
            "refined": True,
            "is_real": bool(res.get("is_real_amendment")),
            "link_kind": res.get("relation", row.get("link_kind")),
            "refined_date": res.get("corrected_date_hijri"),
            "refined_articles": ("، ".join(str(a) for a in res.get("affected_articles", []))
                                 if res.get("affected_articles") else None),
            "refined_summary": res.get("summary"),
        }
        try:
            update_link(row["id"], patch)
            ok += 1
            if patch["is_real"]:
                real += 1
            tag = "✓ تعديل حقيقيّ" if patch["is_real"] else "— ذكر عابر"
            print(f"[{idx}/{len(rows)}] {name}: {tag} ({patch['refined_date'] or 'بلا تاريخ'})")
        except Exception as e:
            print(f"[{idx}/{len(rows)}] فشل الحفظ: {str(e)[:80]}")
            skip += 1

    print(f"\nاكتمل. دُقّق: {ok} · تعديلات حقيقيّة: {real} · متخطّى: {skip}")

if __name__ == "__main__":
    main()
