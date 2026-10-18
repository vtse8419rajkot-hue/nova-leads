#!/usr/bin/env python3
# T-tr-1 validator for the new "templates" i18n section (hi/mr/bn/ta/te/kn)
import json, re, sys, os, collections

ROOT = "/home/z/my-project/src/i18n/locales"
BAK = "/home/z/my-project/.bak-t1"
FILES = ["hi", "mr", "bn", "ta", "te", "kn"]
PLACEHOLDER_RE = re.compile(r"\{[a-zA-Z]+\}")
LATIN_RE = re.compile(r"[A-Za-z]")


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def ph_tokens(s):
    return sorted(PLACEHOLDER_RE.findall(s))


failures = []

# ---- a) en templates: exactly 30 leaf keys ----
en = json.load(open(os.path.join(ROOT, "en.json"), encoding="utf-8"))
assert "templates" in en and isinstance(en["templates"], dict)
en_t = en["templates"]
en_keys = set(en_t.keys())
en_flat_in_t = flatten(en_t)
if len(en_flat_in_t) != 30:
    failures.append(f"en templates has {len(en_flat_in_t)} leaf keys, expected 30")
print(f"en.templates leaf keys: {len(en_flat_in_t)} (expected 30)")
en_order = list(en_t.keys())

# ---- b) per-file checks ----
for lang in FILES:
    probs = []
    new = json.load(open(os.path.join(ROOT, f"{lang}.json"), encoding="utf-8"))
    bak = json.load(open(os.path.join(BAK, f"{lang}.json"), encoding="utf-8"))

    # templates present, key set EXACTLY equals en
    if "templates" not in new:
        probs.append("missing templates section")
    else:
        t = new["templates"]
        keys = set(t.keys())
        if keys != en_keys:
            probs.append(f"key mismatch: missing={sorted(en_keys - keys)} extra={sorted(keys - en_keys)}")
        # order within section matches en
        if list(t.keys()) != en_order:
            probs.append("templates key ORDER differs from en")
        # values: non-empty strings only
        for k, v in t.items():
            if not isinstance(v, str) or not v.strip():
                probs.append(f"empty/non-string value at {k}")
        # placeholders exactly as en, per key
        for k in en_keys:
            en_v = en_t[k]
            new_v = t.get(k, "")
            if ph_tokens(en_v) != ph_tokens(new_v):
                probs.append(f"placeholder mismatch at {k}: en={ph_tokens(en_v)} got={ph_tokens(new_v)}")
            if k in ("varName", "varCompany", "varCity", "varValue", "varBusiness", "varDate"):
                want = "{" + k[3:].lower() + "}"
                want = want.replace("{name}", "{name}")
                if want not in new_v:
                    probs.append(f"{k} missing required token {want}")
        # no Latin letters outside placeholders (no English leakage)
        for k, v in t.items():
            stripped = PLACEHOLDER_RE.sub("", v)
            latin = LATIN_RE.findall(stripped)
            if latin:
                probs.append(f"latin leak in {k}: {''.join(latin)!r}")

    # every non-templates section deep-equals the backup
    new_wo = {k: v for k, v in new.items() if k != "templates"}
    if new_wo != bak:
        bak_keys = set(bak.keys())
        new_keys = set(new_wo.keys())
        diff = [k for k in bak_keys | new_keys if new_wo.get(k) != bak.get(k)]
        probs.append(f"non-templates content changed: {diff}")

    # c) section order: alarm -> templates -> languageNames (adjacent)
    order = list(new.keys())
    if not ("alarm" in order and "templates" in order and "languageNames" in order):
        probs.append("missing one of alarm/templates/languageNames in top-level order")
    else:
        ia, it, il = order.index("alarm"), order.index("templates"), order.index("languageNames")
        if not (ia < it < il and il - it == 1 and it - ia == 1):
            probs.append(f"order wrong: alarm@{ia} templates@{it} languageNames@{il}")

    # d) total top-level keys = 23
    if len(order) != 23:
        probs.append(f"top-level key count {len(order)}, expected 23")

    total_leaf = len(flatten(new))
    if probs:
        failures.append((lang, probs))
        print(f"{lang}: FAIL -> " + "; ".join(probs))
    else:
        print(f"{lang}: PASS (templates=30 keys, leaf total={total_leaf}, top-level=23, order ai>alarm>templates>languageNames, rest byte-equal to backup)")

print()
if failures:
    print(f"RESULT: {len(FILES) - len(failures)}/{len(FILES)} PASS -> FAILURES PRESENT")
    sys.exit(1)
print("RESULT: ALL 6 FILES PASS")
