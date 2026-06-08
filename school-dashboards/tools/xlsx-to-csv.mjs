/**
 * xlsx-to-csv.mjs — dump every sheet of an .xlsx to CSV. Zero dependencies.
 *   node tools/xlsx-to-csv.mjs "<file.xlsx>" "<out-dir>"
 *
 * The bus source is an .xlsx (one tab per trip), so we need to read it without
 * pulling in a library. An .xlsx is a ZIP of XML; we read the ZIP central
 * directory, inflate entries with zlib, and parse the (simple) spreadsheet XML.
 *
 * Times stored as Excel serials are emitted raw — we care about STRUCTURE here,
 * not exact formatting (the formatted truth already lives in fixtures/buses.json).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const [, , xlsxPath, outDir] = process.argv;
if (!xlsxPath || !outDir) { console.error('usage: xlsx-to-csv.mjs <file.xlsx> <out-dir>'); process.exit(1); }

// ---- minimal ZIP reader ----
function unzip(buf) {
  const files = new Map();
  // find End Of Central Directory
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a zip');
  let off = buf.readUInt32LE(eocd + 16);
  const count = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) break;
    const method = buf.readUInt16LE(off + 10);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    // local header to find data start
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const compSize = buf.readUInt32LE(off + 20);
    const raw = buf.subarray(dataStart, dataStart + compSize);
    files.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    off += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const xml = (b) => b ? b.toString('utf8') : '';
const colToIdx = (c) => { let n = 0; for (const ch of c) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
const csvCell = (v) => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;

const zip = unzip(readFileSync(xlsxPath));

// shared strings
const shared = [];
const ssXml = xml(zip.get('xl/sharedStrings.xml'));
for (const m of ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
  let text = '';
  for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) text += decode(t[1]);
  shared.push(text);
}

// workbook order + rels
const wbXml = xml(zip.get('xl/workbook.xml'));
const relsXml = xml(zip.get('xl/_rels/workbook.xml.rels'));
const relMap = {};
for (const r of relsXml.matchAll(/<Relationship[^>]*Id="([^"]*)"[^>]*Target="([^"]*)"/g)) relMap[r[1]] = r[2];
const sheets = [];
for (const s of wbXml.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)) {
  sheets.push({ name: decode(s[1]), target: relMap[s[2]] });
}

mkdirSync(resolve(outDir), { recursive: true });
const safe = (s) => s.replace(/[^\w.+-]+/g, '_').slice(0, 60);

sheets.forEach((sh, i) => {
  const path = 'xl/' + sh.target.replace(/^\/?xl\//, '').replace(/^\//, '');
  const sx = xml(zip.get(path) || zip.get('xl/worksheets/sheet' + (i + 1) + '.xml'));
  const grid = [];
  let maxCol = 0;
  for (const row of sx.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const r = +row[1] - 1;
    grid[r] = grid[r] || [];
    for (const c of row[2].matchAll(/<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1], inner = c[2] || '';
      const ref = (attrs.match(/r="([A-Z]+)\d+"/) || [])[1];
      const t = (attrs.match(/t="([^"]*)"/) || [])[1];
      if (!ref) continue;
      const ci = colToIdx(ref);
      let val = '';
      if (t === 's') { const vi = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; val = shared[+vi] ?? ''; }
      else if (t === 'inlineStr') { const it = (inner.match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1]; val = decode(it || ''); }
      else { const vi = (inner.match(/<v>([\s\S]*?)<\/v>/) || [])[1]; val = vi != null ? decode(vi) : ''; }
      grid[r][ci] = val;
      if (ci + 1 > maxCol) maxCol = ci + 1;
    }
  }
  const lines = grid.map((row) => {
    const cells = [];
    for (let c = 0; c < maxCol; c++) cells.push(csvCell((row && row[c]) || ''));
    return cells.join(',');
  });
  const file = join(resolve(outDir), `${String(i)}_${safe(sh.name)}.csv`);
  writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  console.log(`${sh.name}  ->  ${file.split(/[\\/]/).pop()}  (${grid.length} rows x ${maxCol} cols)`);
});
