#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T-tr-2: insert native "templates" i18n section (30 keys) into ml/pa/or/as/ur.

Follows the proven A-2/A-3 pattern: text-splice the serialized block exactly
before the top-level "languageNames" line -> zero existing bytes touched.
Idempotent: skips files that already contain a top-level "templates" key.
"""
import sys, io

BASE = "/home/z/my-project/src/i18n/locales"

BLOCKS = {
"ml.json": {
"title": "സന്ദേശ ടെംപ്ലേറ്റുകൾ",
"desc": "നിങ്ങളുടെ സ്വന്തം വാട്ട്സ്ആപ്പ് സന്ദേശങ്ങൾ സേവ് ചെയ്യുക. ഏതെങ്കിലും ലീഡ് തുറന്ന് ടെംപ്ലേറ്റിൽ ടാപ്പ് ചെയ്താൽ അയക്കാൻ തയ്യാറാകും.",
"add": "ടെംപ്ലേറ്റ് ചേർക്കുക",
"edit": "ടെംപ്ലേറ്റ് തിരുത്തുക",
"name": "ടെംപ്ലേറ്റിന്റെ പേര്",
"namePh": "ഉദാ: ആദ്യ ബന്ധപ്പെടൽ",
"content": "സന്ദേശം",
"contentPh": "ഇവിടെ നിങ്ങളുടെ സന്ദേശം എഴുതുക...",
"insertVar": "ചേർക്കാൻ ടാപ്പ് ചെയ്യുക",
"makeDefault": "സ്ഥിരസ്ഥിതിയാക്കുക",
"defaultDesc": "ലീഡ് തുറക്കുമ്പോൾ ഈ സന്ദേശം തനിച്ചുതന്നെ തുറക്കും",
"defaultBadge": "സ്ഥിരസ്ഥിതി",
"noTemplates": "ഇതുവരെ ടെംപ്ലേറ്റുകളില്ല",
"noTemplatesDesc": "ആദ്യ സന്ദേശ ടെംപ്ലേറ്റ് സേവ് ചെയ്യുക, പിന്നെ ഒറ്റ ടാപ്പിൽ വാട്ട്സ്ആപ്പ് ഫോളോ-അപ്പ് അയക്കാം",
"preview": "പ്രിവ്യൂ",
"useHint": "ഏതെങ്കിലും ലീഡ് തുറന്ന് ടെംപ്ലേറ്റിൽ ടാപ്പ് ചെയ്യുക - സന്ദേശം അയക്കാൻ തയ്യാറായി വാട്ട്സ്ആപ്പിൽ തുറക്കും",
"emptyName": "ടെംപ്ലേറ്റിന്റെ പേര് എഴുതുക",
"emptyContent": "സന്ദേശം എഴുതുക",
"confirmDelete": "ഈ ടെംപ്ലേറ്റ് നീക്കം ചെയ്യണോ?",
"varName": "{name} - ഉപഭോക്താവിന്റെ പേര്",
"varCompany": "{company} - കമ്പനി",
"varCity": "{city} - നഗരം",
"varValue": "{value} - ഇടപാടിന്റെ മൂല്യം",
"varBusiness": "{business} - നിങ്ങളുടെ ബിസിനസ്സിന്റെ പേര്",
"varDate": "{date} - ഇന്നത്തെ തീയതി",
"composerTitle": "വാട്ട്സ്ആപ്പ് സന്ദേശം",
"pickTemplate": "നിങ്ങളുടെ ടെംപ്ലേറ്റുകൾ",
"aiGenerate": "എഐ കൊണ്ട് എഴുതുക",
"sentActivity": "ടെംപ്ലേറ്റ് ഉപയോഗിച്ച് വാട്ട്സ്ആപ്പ് അയച്ചു",
"sampleName": "മാതൃക ഉപഭോക്താവ്",
},
"pa.json": {
"title": "ਮੈਸੇਜ ਟੈਂਪਲੇਟ",
"desc": "ਆਪਣੇ ਵਟਸਐਪ ਮੈਸੇਜ ਸੇਵ ਕਰੋ। ਕੋਈ ਵੀ ਲੀਡ ਖੋਲ੍ਹੋ, ਟੈਂਪਲੇਟ 'ਤੇ ਦਬਾਓ ਅਤੇ ਮੈਸੇਜ ਭੇਜਣ ਲਈ ਤਿਆਰ ਹੈ।",
"add": "ਟੈਂਪਲੇਟ ਜੋੜੋ",
"edit": "ਟੈਂਪਲੇਟ ਸੋਧੋ",
"name": "ਟੈਂਪਲੇਟ ਦਾ ਨਾਮ",
"namePh": "ਜਿਵੇਂ: ਪਹਿਲਾ ਸੰਪਰਕ",
"content": "ਮੈਸੇਜ",
"contentPh": "ਇੱਥੇ ਆਪਣਾ ਮੈਸੇਜ ਲਿਖੋ...",
"insertVar": "ਜੋੜਨ ਲਈ ਦਬਾਓ",
"makeDefault": "ਡਿਫ਼ਾਲਟ ਬਣਾਓ",
"defaultDesc": "ਲੀਡ ਖੋਲ੍ਹਣ 'ਤੇ ਇਹ ਮੈਸੇਜ ਆਪੇ ਖੁੱਲ੍ਹੇਗਾ",
"defaultBadge": "ਡਿਫ਼ਾਲਟ",
"noTemplates": "ਹਾਲੇ ਕੋਈ ਟੈਂਪਲੇਟ ਨਹੀਂ",
"noTemplatesDesc": "ਪਹਿਲਾ ਮੈਸੇਜ ਟੈਂਪਲੇਟ ਸੇਵ ਕਰੋ ਅਤੇ ਇੱਕ ਹੀ ਦਬਾਉਣ ਵਿੱਚ ਵਟਸਐਪ ਫਾਲੋ-ਅੱਪ ਭੇਜੋ",
"preview": "ਝਲਕ",
"useHint": "ਕੋਈ ਵੀ ਲੀਡ ਖੋਲ੍ਹੋ, ਟੈਂਪਲੇਟ 'ਤੇ ਦਬਾਓ - ਮੈਸੇਜ ਵਟਸਐਪ ਵਿੱਚ ਭੇਜਣ ਲਈ ਤਿਆਰ ਖੁੱਲ੍ਹੇਗਾ",
"emptyName": "ਟੈਂਪਲੇਟ ਦਾ ਨਾਮ ਲਿਖੋ",
"emptyContent": "ਮੈਸੇਜ ਲਿਖੋ",
"confirmDelete": "ਇਹ ਟੈਂਪਲੇਟ ਮਿਟਾਉਣਾ ਹੈ?",
"varName": "{name} - ਗਾਹਕ ਦਾ ਨਾਮ",
"varCompany": "{company} - ਕੰਪਨੀ",
"varCity": "{city} - ਸ਼ਹਿਰ",
"varValue": "{value} - ਸੌਦੇ ਦੀ ਕੀਮਤ",
"varBusiness": "{business} - ਤੁਹਾਡੇ ਧੰਦੇ ਦਾ ਨਾਮ",
"varDate": "{date} - ਅੱਜ ਦੀ ਤਾਰੀਖ਼",
"composerTitle": "ਵਟਸਐਪ ਮੈਸੇਜ",
"pickTemplate": "ਤੁਹਾਡੇ ਟੈਂਪਲੇਟ",
"aiGenerate": "ਏਆਈ ਤੋਂ ਲਿਖਵਾਓ",
"sentActivity": "ਟੈਂਪਲੇਟ ਨਾਲ ਵਟਸਐਪ ਭੇਜਿਆ",
"sampleName": "ਨਮੂਨਾ ਗਾਹਕ",
},
"or.json": {
"title": "ମେସେଜ୍ ଟେମ୍ପଲେଟ୍",
"desc": "ନିଜର ହ୍ୱାଟସଆପ୍ ମେସେଜ୍ ସେଭ୍ କରନ୍ତୁ। ଯେକୌଣସି ଲିଡ୍ ଖୋଲନ୍ତୁ, ଟେମ୍ପଲେଟ୍ ଦବାନ୍ତୁ ଆଉ ମେସେଜ୍ ପଠାଇବାକୁ ସଜ୍ଜ।",
"add": "ଟେମ୍ପଲେଟ୍ ଯୋଗ କରନ୍ତୁ",
"edit": "ଟେମ୍ପଲେଟ୍ ସମ୍ପାଦନ କରନ୍ତୁ",
"name": "ଟେମ୍ପଲେଟ୍‌ର ନାମ",
"namePh": "ଯେପରି: ପ୍ରଥମ ସମ୍ପର୍କ",
"content": "ମେସେଜ୍",
"contentPh": "ଏଠାରେ ନିଜ ମେସେଜ୍ ଲେଖନ୍ତୁ...",
"insertVar": "ଯୋଗ କରିବାକୁ ଦବାନ୍ତୁ",
"makeDefault": "ଡିଫଲ୍ଟ ଭାବେ ସେଟ୍ କରନ୍ତୁ",
"defaultDesc": "ଲିଡ୍ ଖୋଲିଲେ ଏହି ମେସେଜ୍ ଆପେଆପେ ଖୋଲିଯିବ",
"defaultBadge": "ଡିଫଲ୍ଟ",
"noTemplates": "ଏବେ ଯାଏଁ କୌଣସି ଟେମ୍ପଲେଟ୍ ନାହିଁ",
"noTemplatesDesc": "ପ୍ରଥମ ମେସେଜ୍ ଟେମ୍ପଲେଟ୍ ସେଭ୍ କରନ୍ତୁ ଆଉ ଗୋଟିଏ ଦବାରେ ହ୍ୱାଟସଆପ୍ ଫଲୋ-ଅପ୍ ପଠାନ୍ତୁ",
"preview": "ଝଲକ",
"useHint": "ଯେକୌଣସି ଲିଡ୍ ଖୋଲନ୍ତୁ, ଟେମ୍ପଲେଟ୍ ଦବାନ୍ତୁ - ମେସେଜ୍ ପଠାଇବାକୁ ସଜ୍ଜ ହୋଇ ହ୍ୱାଟସଆପ୍‌ରେ ଖୋଲିବ",
"emptyName": "ଟେମ୍ପଲେଟ୍‌ର ନାମ ଲେଖନ୍ତୁ",
"emptyContent": "ମେସେଜ୍ ଲେଖନ୍ତୁ",
"confirmDelete": "ଏହି ଟେମ୍ପଲେଟ୍ ଡିଲିଟ୍ କରିବେ?",
"varName": "{name} - ଗ୍ରାହକଙ୍କ ନାମ",
"varCompany": "{company} - କମ୍ପାନୀ",
"varCity": "{city} - ସହର",
"varValue": "{value} - ଡିଲ୍‌ର ମୂଲ୍ୟ",
"varBusiness": "{business} - ଆପଣଙ୍କ ବ୍ୟବସାୟର ନାମ",
"varDate": "{date} - ଆଜିର ତାରିଖ",
"composerTitle": "ହ୍ୱାଟସଆପ୍ ମେସେଜ୍",
"pickTemplate": "ଆପଣଙ୍କ ଟେମ୍ପଲେଟ୍",
"aiGenerate": "ଏଆଇରୁ ଲେଖାଇନନ୍ତୁ",
"sentActivity": "ଟେମ୍ପଲେଟ୍ ବ୍ୟବହାର କରି ହ୍ୱାଟସଆପ୍ ପଠାଗଲା",
"sampleName": "ନମୁନା ଗ୍ରାହକ",
},
"as.json": {
"title": "মেছেজ টেমপ্লেট",
"desc": "নিজৰ ৱাটছএপ মেছেজ ছেভ কৰক। যিকোনো লিড খোলক, টেমপ্লেট টিপক আৰু মেছেজ পঠাবলৈ সাজু।",
"add": "টেমপ্লেট যোগ কৰক",
"edit": "টেমপ্লেট সম্পাদনা কৰক",
"name": "টেমপ্লেটৰ নাম",
"namePh": "যেনে: প্ৰথম সম্পৰ্ক",
"content": "মেছেজ",
"contentPh": "ইয়াত নিজৰ মেছেজ লিখক...",
"insertVar": "যোগ কৰিবলৈ টিপক",
"makeDefault": "ডিফল্ট হিচাপে ছেট কৰক",
"defaultDesc": "লিড খোলতে এই মেছেজ আপোনা-আপুনিকৈ খুলিব",
"defaultBadge": "ডিফল্ট",
"noTemplates": "এতিয়ালৈ কোনো টেমপ্লেট নাই",
"noTemplatesDesc": "প্ৰথম মেছেজ টেমপ্লেট ছেভ কৰক আৰু এটা টিপতে ৱাটছএপ ফলো-আপ পঠাওক",
"preview": "প্ৰিভিউ",
"useHint": "যিকোনো লিড খোলক, টেমপ্লেট টিপক - মেছেজ পঠাবলৈ সাজু হৈ ৱাটছএপত খুলিব",
"emptyName": "টেমপ্লেটৰ নাম লিখক",
"emptyContent": "মেছেজ লিখক",
"confirmDelete": "এই টেমপ্লেট মচিব?",
"varName": "{name} - গ্ৰাহকৰ নাম",
"varCompany": "{company} - কোম্পানী",
"varCity": "{city} - চহৰ",
"varValue": "{value} - ডিলৰ মূল্য",
"varBusiness": "{business} - আপোনাৰ ব্যৱসায়ৰ নাম",
"varDate": "{date} - আজিৰ তাৰিখ",
"composerTitle": "ৱাটছএপ মেছেজ",
"pickTemplate": "আপোনাৰ টেমপ্লেট",
"aiGenerate": "এআইৰে লিখাওক",
"sentActivity": "টেমপ্লেট ব্যৱহাৰ কৰি ৱাটছএপ পঠিয়ালো",
"sampleName": "নমুনা গ্ৰাহক",
},
"ur.json": {
"title": "میسج ٹیمپلیٹ",
"desc": "اپنے واٹسایپ میسج سیو کریں۔ کوئی بھی لیڈ کھولیں، ٹیمپلیٹ دبائیں اور میسج بھیجنے کے لیے تیار۔",
"add": "ٹیمپلیٹ شامل کریں",
"edit": "ٹیمپلیٹ ترمیم کریں",
"name": "ٹیمپلیٹ کا نام",
"namePh": "جیسے: پہلا رابطہ",
"content": "میسج",
"contentPh": "یہاں اپنا میسج لکھیں...",
"insertVar": "شامل کرنے کے لیے دبائیں",
"makeDefault": "ڈیفالٹ سیٹ کریں",
"defaultDesc": "لیڈ کھولنے پر یہ میسج خود بخود کھلے گا",
"defaultBadge": "ڈیفالٹ",
"noTemplates": "ابھی کوئی ٹیمپلیٹ نہیں",
"noTemplatesDesc": "پہلا میسج ٹیمپلیٹ سیو کریں اور ایک ہی دباء سے واٹسایپ فالو اپ بھیجیں",
"preview": "جھلک",
"useHint": "کوئی بھی لیڈ کھولیں، ٹیمپلیٹ دبائیں - میسج بھیجنے کے لیے تیار واٹسایپ میں کھلے گا",
"emptyName": "ٹیمپلیٹ کا نام لکھیں",
"emptyContent": "میسج لکھیں",
"confirmDelete": "یہ ٹیمپلیٹ حذف کرنا ہے؟",
"varName": "{name} - گاہک کا نام",
"varCompany": "{company} - کمپنی",
"varCity": "{city} - شہر",
"varValue": "{value} - سودے کی قیمت",
"varBusiness": "{business} - آپ کے کاروبار کا نام",
"varDate": "{date} - آج کی تاریخ",
"composerTitle": "واٹسایپ میسج",
"pickTemplate": "آپ کے ٹیمپلیٹ",
"aiGenerate": "اے آئی سے لکھوائیں",
"sentActivity": "ٹیمپلیٹ سے واٹسایپ بھیجا",
"sampleName": "نمونہ گاہک",
},
}

# canonical key order = en.json order
KEY_ORDER = ["title","desc","add","edit","name","namePh","content","contentPh",
             "insertVar","makeDefault","defaultDesc","defaultBadge","noTemplates",
             "noTemplatesDesc","preview","useHint","emptyName","emptyContent",
             "confirmDelete","varName","varCompany","varCity","varValue",
             "varBusiness","varDate","composerTitle","pickTemplate","aiGenerate",
             "sentActivity","sampleName"]

def esc(s):
    # JSON string escaping consistent with json.dumps(ensure_ascii=False)
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")

def serialize_block(trans):
    lines = ['  "templates": {']
    for i, k in enumerate(KEY_ORDER):
        v = trans[k]
        comma = "," if i < len(KEY_ORDER) - 1 else ""
        lines.append('    "%s": "%s"%s' % (k, esc(v), comma))
    lines.append("  },")
    return [l + "\n" for l in lines]

def main():
    ok = True
    for fname, trans in BLOCKS.items():
        assert set(trans) == set(KEY_ORDER), "%s: key mismatch" % fname
        path = "%s/%s" % (BASE, fname)
        with io.open(path, encoding="utf-8") as f:
            text = f.read()
        if '\n  "templates": {' in text:
            print("%s: already has templates section - SKIP" % fname)
            continue
        lines = text.splitlines(True)
        idx = None
        for i, ln in enumerate(lines):
            if ln.rstrip("\r\n") == '  "languageNames": {':
                idx = i
                break
        if idx is None:
            print("%s: languageNames line NOT FOUND - ABORT" % fname)
            ok = False
            continue
        new_lines = lines[:idx] + serialize_block(trans) + lines[idx:]
        with io.open(path, "w", encoding="utf-8") as f:
            f.write("".join(new_lines))
        print("%s: inserted templates block (%d keys) before languageNames line %d" % (fname, len(KEY_ORDER), idx + 1))
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
