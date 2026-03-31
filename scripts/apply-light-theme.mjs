import fs from "fs";
import path from "path";

const root = process.cwd();
const skip = new Set(["node_modules", ".next", ".git"]);

const replacements = [
  // 長いパターンを先に
  ["bg-zinc-900/50", "bg-slate-100/90"],
  ["bg-zinc-800/50", "bg-slate-100/80"],
  ["bg-zinc-900 border border-zinc-800", "bg-white border border-slate-200 shadow-sm"],
  ["bg-zinc-950 border border-zinc-800", "bg-slate-50 border border-slate-200"],
  ["border border-zinc-800", "border border-slate-200"],
  ["border-zinc-800", "border-slate-200"],
  ["border-zinc-700", "border-slate-200"],
  ["divide-zinc-800", "divide-slate-200"],
  ["divide-zinc-700", "divide-slate-200"],
  ["bg-zinc-950", "bg-slate-50"],
  ["bg-zinc-900", "bg-white"],
  ["bg-black/95", "bg-white/95"],
  ["bg-black/80", "bg-white/90"],
  ["bg-black/40", "bg-slate-100/90"],
  ["bg-black/30", "bg-slate-100/80"],
  ["bg-black/20", "bg-slate-50/80"],
  ["bg-black", "bg-slate-50"],
  ["bg-zinc-800", "bg-slate-100"],
  ["hover:bg-zinc-800/50", "hover:bg-slate-100"],
  ["hover:bg-zinc-800/40", "hover:bg-slate-100"],
  ["hover:bg-zinc-800", "hover:bg-slate-100"],
  ["hover:bg-zinc-900/60", "hover:bg-slate-100"],
  ["hover:bg-zinc-900", "hover:bg-slate-50"],
  ["hover:border-zinc-700", "hover:border-slate-300"],
  ["hover:border-zinc-600", "hover:border-slate-300"],
  ["text-white", "text-slate-900"],
  ["text-zinc-200", "text-slate-800"],
  ["text-zinc-300", "text-slate-700"],
  ["text-zinc-400", "text-slate-600"],
  ["text-zinc-500", "text-slate-500"],
  ["text-zinc-600", "text-slate-600"],
  ["text-blue-400", "text-blue-700"],
  ["hover:text-blue-300", "hover:text-blue-800"],
  ["text-emerald-300", "text-emerald-800"],
  ["text-emerald-400", "text-emerald-700"],
  ["text-red-300", "text-red-700"],
  ["text-red-400", "text-red-600"],
  ["text-green-400", "text-green-700"],
  ["text-yellow-400", "text-yellow-700"],
  ["text-orange-400", "text-orange-700"],
  ["text-sky-200", "text-sky-800"],
  ["text-amber-200", "text-amber-900"],
  ["shadow-black/40", "shadow-slate-900/10"],
  ["shadow-2xl shadow-slate-900/10", "shadow-xl shadow-slate-900/10"],
  ["text-zinc-100", "text-slate-900"],
  ["text-zinc-50", "text-slate-900"],
  ["bg-zinc-600", "bg-slate-400"],
  ["bg-zinc-500/15", "bg-slate-200/90"],
  ["bg-zinc-400/10", "bg-slate-100"],
  ["border-zinc-400/35", "border-slate-300/70"],
  ["border-zinc-400/20", "border-slate-200"],
  ["border-zinc-500", "border-slate-300"],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx|ts|css)$/.test(ent.name) && !ent.name.endsWith(".d.ts"))
      files.push(p);
  }
  return files;
}

const dirs = [
  path.join(root, "app"),
  path.join(root, "components"),
  path.join(root, "lib"),
].filter((d) => fs.existsSync(d));

let changed = [];
for (const d of dirs) {
  for (const file of walk(d)) {
    let c = fs.readFileSync(file, "utf8");
    const orig = c;
    for (const [a, b] of replacements) {
      if (c.includes(a)) c = c.split(a).join(b);
    }
    if (c !== orig) {
      fs.writeFileSync(file, c, "utf8");
      changed.push(path.relative(root, file));
    }
  }
}

console.log("Updated", changed.length, "files");
changed.slice(0, 80).forEach((f) => console.log(f));
if (changed.length > 80) console.log("... and", changed.length - 80, "more");
