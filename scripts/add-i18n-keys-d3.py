#!/usr/bin/env python3
# Adds follow-up picker / whatsapp chooser / switch-account keys to en + gu locales
# and syncs all locales to public/i18n for lazy loading.
import json, os, shutil

ROOT = "/home/z/my-project"
LOCALES = f"{ROOT}/src/i18n/locales"
PUBLIC = f"{ROOT}/public/i18n"

EN = {
    "common": {
        "done": "Done",
    },
    "fu": {
        "quick": "Quick picks",
        "pickDate": "Pick a date",
        "pickTime": "Pick a time",
        "custom": "Custom date & time",
        "placeholder": "Select date & time",
    },
    "wa": {
        "title": "Send via WhatsApp",
        "desc": "Which WhatsApp should open?",
        "business": "WhatsApp Business",
        "businessDesc": "Open in the Business app",
        "normal": "WhatsApp",
        "normalDesc": "Open in the normal WhatsApp app",
        "always": "Always use this app?",
        "businessShort": "Business",
        "normalShort": "Normal",
        "prefTitle": "WhatsApp app",
        "prefDesc": "Which WhatsApp app to use when sending messages?",
        "prefAsk": "Ask every time",
    },
    "switch": {
        "title": "Switch Account",
        "desc": "Switch between business accounts saved on this device - each has its own leads & data",
        "current": "Current",
        "go": "Open",
        "remove": "Remove from list",
        "useSavedAccount": "Use a saved account",
        "open": "Switch",
        "addAccount": "Add a business account",
        "addAccountDesc": "Creates a separate business - leads & data stay fully separate. You can switch anytime.",
    },
}

GU = {
    "common": {
        "done": "થઈ ગયું",
    },
    "fu": {
        "quick": "ઝડપી પસંદગી",
        "pickDate": "તારીખ પસંદ કરો",
        "pickTime": "સમય પસંદ કરો",
        "custom": "કસ્ટમ તારીખ અને સમય",
        "placeholder": "તારીખ અને સમય પસંદ કરો",
    },
    "wa": {
        "title": "WhatsApp પર મોકલો",
        "desc": "કયા WhatsApp માં ખોલવું છે?",
        "business": "WhatsApp Business",
        "businessDesc": "Business એપમાં ખોલો",
        "normal": "WhatsApp",
        "normalDesc": "નોર્મલ WhatsApp એપમાં ખોલો",
        "always": "હંમેશા આ જ એપ વાપરવી છે?",
        "businessShort": "Business",
        "normalShort": "Normal",
        "prefTitle": "WhatsApp એપ",
        "prefDesc": "મેસેજ મોકલતી વખતે કઈ WhatsApp એપ વાપરવી?",
        "prefAsk": "દર વખતે પૂછો",
    },
    "switch": {
        "title": "એકાઉન્ટ સ્વિચ કરો",
        "desc": "આ ડિવાઇસ પર સેવ થયેલા બિઝનેસ એકાઉન્ટ વચ્ચે સ્વિચ કરો - દરેકનો લીડ અને ડેટા અલગ રહે છે",
        "current": "વર્તમાન",
        "go": "ખોલો",
        "remove": "લિસ્ટમાંથી દૂર કરો",
        "useSavedAccount": "સેવ થયેલું એકાઉન્ટ વાપરો",
        "open": "સ્વિચ કરો",
        "addAccount": "નવું બિઝનેસ એકાઉન્ટ ઉમેરો",
        "addAccountDesc": "નવું એકાઉન્ટ બનશે - લીડ અને ડેટા સંપૂર્ણ અલગ રહેશે. પછી ક્યારેય પણ સ્વિચ કરી શકાશે.",
    },
}


def deep_merge(base: dict, patch: dict) -> dict:
    out = dict(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


for fname, patch in (("en", EN), ("gu", GU)):
    path = f"{LOCALES}/{fname}.json"
    data = json.load(open(path, encoding="utf-8"))
    merged = deep_merge(data, patch)
    json.dump(merged, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"updated {fname}: +{len(patch)} sections")

# Sync all locales to public/i18n (lazy-load source of truth)
os.makedirs(PUBLIC, exist_ok=True)
for f in os.listdir(LOCALES):
    if f.endswith(".json"):
        shutil.copy(f"{LOCALES}/{f}", f"{PUBLIC}/{f}")
        print("synced public/i18n/" + f)
