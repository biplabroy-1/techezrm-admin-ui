#!/usr/bin/env node
/**
 * EZRM product image template: 1000x1000 PNG, EZRM navy/amber, product name +
 * grade + pack size. Flat typographic card - no pouch or packshot mock-up.
 *
 * One image:
 *   node scripts/product-image.mjs --name "Vitamin C" --grade "Ascorbic acid, food grade" \
 *     --pack "25 kg drum" --out vitamin-c.png
 *
 * Many images from a CSV with the header  name,grade,pack[,file]:
 *   node scripts/product-image.mjs --csv products.csv --out-dir ./product-images
 *
 * Text is rendered by librsvg through sharp. Install IBM Plex Sans / Mono on the
 * machine for an exact match with the site; otherwise it falls back to Helvetica.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const NAVY = "#073656";
const AMBER = "#F9A200";
const PAPER = "#F5F7F9";
const STEEL = "#3A444B";
const SIZE = 1000;

const here = path.dirname(fileURLToPath(import.meta.url));
const MARK = path.resolve(here, "../../user-ui/public/ezrm-mark.png");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

/** Greedy word wrap by an approximate character budget per line. */
const wrap = (text, maxChars, maxLines) => {
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s*\S*$/, "") + "…";
    return kept;
  }
  return lines;
};

const svgFor = ({ name, grade, pack }) => {
  // Long names step down in size so they still fit in three lines.
  const nameSize = name.length > 40 ? 64 : name.length > 22 ? 78 : 96;
  const nameLines = wrap(name, Math.floor(1700 / nameSize), 3);
  const gradeLines = grade ? wrap(grade, 38, 2) : [];
  const sans = "'IBM Plex Sans', Helvetica, Arial, sans-serif";
  const mono = "'IBM Plex Mono', Menlo, monospace";

  let y = 430 - (nameLines.length - 1) * nameSize * 0.55;
  const nameSvg = nameLines
    .map((l, i) => `<text x="90" y="${y + i * nameSize * 1.1}" font-family="${sans}" font-weight="600" font-size="${nameSize}" fill="${NAVY}">${esc(l)}</text>`)
    .join("");
  y += nameLines.length * nameSize * 1.1 + 30;
  const gradeSvg = gradeLines
    .map((l, i) => `<text x="90" y="${y + i * 50}" font-family="${sans}" font-size="40" fill="${STEEL}">${esc(l)}</text>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${SIZE}" height="14" fill="${AMBER}"/>
  <rect x="90" y="250" width="72" height="8" fill="${AMBER}"/>
  ${nameSvg}
  ${gradeSvg}
  <rect x="0" y="800" width="${SIZE}" height="200" fill="${NAVY}"/>
  <text x="90" y="878" font-family="${mono}" font-size="26" letter-spacing="4" fill="${AMBER}">PACK SIZE</text>
  <text x="90" y="940" font-family="${sans}" font-weight="600" font-size="54" fill="#FFFFFF">${esc(pack || "—")}</text>
  <text x="910" y="940" text-anchor="end" font-family="${mono}" font-size="24" letter-spacing="3" fill="#FFFFFF" fill-opacity="0.6">JNPA SEZ · INDIA</text>
</svg>`;
};

export const renderProductImage = async ({ name, grade, pack }, outFile) => {
  if (!name) throw new Error("name is required");
  const mark = await sharp(MARK).resize({ width: 300 }).png().toBuffer();
  await sharp(Buffer.from(svgFor({ name, grade, pack })))
    .composite([{ input: mark, left: 90, top: 90 }])
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  return outFile;
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Minimal CSV: header row, comma-separated, double quotes for fields containing commas. */
const parseCsv = (text) => {
  const rows = [];
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const cells = [];
    let cur = "", q = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (q) {
        if (ch === '"' && raw[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells.map((c) => c.trim()));
  }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.toLowerCase(), r[i] ?? ""])));
};

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), [])
);

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (args.csv) {
    const outDir = args["out-dir"] || "product-images";
    fs.mkdirSync(outDir, { recursive: true });
    for (const row of parseCsv(fs.readFileSync(args.csv, "utf8"))) {
      const file = path.join(outDir, row.file || `${slug(row.name)}.png`);
      await renderProductImage(row, file);
      console.log(file);
    }
  } else if (args.name) {
    console.log(await renderProductImage(args, args.out || `${slug(args.name)}.png`));
  } else {
    console.error('Usage: node scripts/product-image.mjs --name "Vitamin C" --grade "Food grade" --pack "25 kg drum" [--out file.png]');
    process.exit(1);
  }
}
