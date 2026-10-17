// Validator: recursively compares key sets of each locale file against en.json
import en from "/home/z/my-project/src/i18n/locales/en.json";
import pa from "/home/z/my-project/src/i18n/locales/pa.json";
import or from "/home/z/my-project/src/i18n/locales/or.json";
import as from "/home/z/my-project/src/i18n/locales/as.json";
import ur from "/home/z/my-project/src/i18n/locales/ur.json";

function flatten(obj: Record<string, unknown>, prefix = "", out: Set<string> = new Set()): Set<string> {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      flatten(v as Record<string, unknown>, path, out);
    } else {
      out.add(path);
    }
  }
  return out;
}

const enKeys = flatten(en as Record<string, unknown>);
const files: Array<[string, Record<string, unknown>]> = [
  ["pa.json", pa as Record<string, unknown>],
  ["or.json", or as Record<string, unknown>],
  ["as.json", as as Record<string, unknown>],
  ["ur.json", ur as Record<string, unknown>],
];

let allPass = true;
for (const [name, obj] of files) {
  const keys = flatten(obj);
  const missing = [...enKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !enKeys.has(k));
  const empty = [...keys].filter((k) => {
    const parts = k.split(".");
    let cur: unknown = obj;
    for (const p of parts) cur = (cur as Record<string, unknown>)[p];
    return typeof cur === "string" && cur.trim() === "";
  });
  if (missing.length === 0 && extra.length === 0 && empty.length === 0) {
    console.log(`PASS  ${name}  (${keys.size} keys, matches en.json)`);
  } else {
    allPass = false;
    console.log(`FAIL  ${name}`);
    if (missing.length) console.log(`  missing: ${missing.join(", ")}`);
    if (extra.length) console.log(`  extra:   ${extra.join(", ")}`);
    if (empty.length) console.log(`  empty:   ${empty.join(", ")}`);
  }
}
console.log(allPass ? "ALL FILES PASS" : "SOME FILES FAILED");
process.exit(allPass ? 0 : 1);
