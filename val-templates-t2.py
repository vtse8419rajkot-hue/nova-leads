#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T-tr-2 validator: checks ml/pa/or/as/ur "templates" sections against en.json
and the .bak-t2 backups. Follows the A-2/A-3 validator pattern."""
import json, io, re, sys

BASE = "/home/z/my-project/src/i18n/locales"
BAK  = "/home/z/my-project/.bak-t2"
FILES = ["ml.json", "pa.json", "or.json", "as.json", "ur.json"]
PLACEHOLDERS = ["{name}", "{company}", "{city}", "{value}", "{business}", "{date}"]
VARKEYS = ["varName", "varCompany", "varCity", "varValue", "varBusiness", "varDate"]

def load(path):
    with io.open(path, encoding="utf-8") as f:
        return json.load(f, object_pairs_hook=lambda p: dict(p))

def flatten(obj, prefix=""):
    out = {}
    for k, v in obj.items():
        key = prefix + "." + k if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out

fail = 0

def check(cond, msg):
    global fail
    if not cond:
        fail += 1
        print("  FAIL: " + msg)
    return cond

# --- en.json reference ---
en = load(BASE + "/en.json")
en_flat = flatten(en["templates"])
print("en.json templates leaf keys: %d" % len(en_flat))
check(len(en_flat) == 30, "en templates leaf count != 30")
check(len(en) == 23, "en top-level count != 23 (got %d)" % len(en))

# placeholder positions in en
en_vars = {k: re.findall(r"\{\w+\}", en["templates"][k]) for k in VARKEYS}
check([en["templates"][k] for k in VARKEYS] ==
      ["{name} - customer name", "{company} - company", "{city} - city",
       "{value} - deal value", "{business} - your business name", "{date} - today's date"],
      "en var keys unexpected (reference changed?)")

print()
for fname in FILES:
    print("== %s ==" % fname)
    cur = load("%s/%s" % (BASE, fname))
    bak = load("%s/%s" % (BAK, fname))

    # (d) total top-level keys = 23
    check(len(cur) == 23, "top-level key count = %d (expected 23)" % len(cur))

    # (c) section order: templates strictly between alarm and languageNames
    keys = list(cur.keys())
    check("alarm" in keys and "templates" in keys and "languageNames" in keys,
          "alarm/templates/languageNames all present")
    if all(k in keys for k in ("alarm", "templates", "languageNames")):
        ia, it, il = keys.index("alarm"), keys.index("templates"), keys.index("languageNames")
        check(ia < it < il, "order alarm(%d) < templates(%d) < languageNames(%d)" % (ia, it, il))

    # (b1) templates key set EXACTLY equals en; all non-empty strings
    t = cur.get("templates", {})
    check(set(t) == set(en_flat), "templates key set != en (missing=%s extra=%s)"
          % (sorted(set(en_flat) - set(t)), sorted(set(t) - set(en_flat))))
    check(len(t) == 30, "templates has %d keys (expected 30)" % len(t))
    for k, v in t.items():
        check(isinstance(v, str) and v.strip() != "", "templates.%s empty or non-string" % k)

    # (b2) placeholders in varName..varDate exactly as in en
    for k in VARKEYS:
        check(k in t and t.get(k, "").find(en["templates"][k].split(" - ")[0]) >= 0,
              "templates.%s missing its placeholder" % k)
        got = re.findall(r"\{\w+\}", t.get(k, ""))
        check(got == en_vars[k], "templates.%s placeholders %s != en %s" % (k, got, en_vars[k]))

    # (b3) every non-templates section deep-equals backup
    for sec in bak:
        if sec == "templates":
            continue
        check(sec in cur and cur[sec] == bak[sec], "section '%s' differs from backup" % sec)
    check("templates" not in bak, "backup already had templates (unexpected)")

    # extra: Latin-letter leakage scan (only the 6 placeholders allowed)
    for k, v in t.items():
        stripped = re.sub(r"\{(name|company|city|value|business|date)\}", "", v)
        latin = re.findall(r"[A-Za-z]+", stripped)
        check(not latin, "templates.%s contains Latin text: %s" % (k, latin))

    print("  -> PASS" if fail == 0 else "  -> (see failures above)")

print()
en_keys = list(en.keys())
for fname in FILES:
    cur = load("%s/%s" % (BASE, fname))
    check(list(cur.keys()) == en_keys, "%s top-level key ORDER != en order" % fname)

if fail == 0:
    print("ALL FILES PASS (templates section: 30 keys each, order + placeholders + backup-identity OK)")
else:
    print("VALIDATION FAILED: %d check(s) failed" % fail)
sys.exit(0 if fail == 0 else 1)
