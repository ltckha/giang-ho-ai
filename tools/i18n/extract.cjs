/**
 * Gom mọi chữ tiếng Việt người chơi có thể thấy (chuỗi trong code + chữ trong dữ liệu màn)
 * → so với src/i18n/en.json → ghi chỗ còn thiếu ra tools/i18n/missing.json.
 *
 * Chạy: node tools/i18n/extract.cjs            (in số liệu, ghi missing.json)
 *       node tools/i18n/extract.cjs --check    (thiếu bản dịch thì báo lỗi, dùng trong kiểm thử)
 *
 * Quy ước khoá (giống src/game/i18n.ts):
 *  - khoá = chữ đã gộp khoảng trắng + bỏ đầu đuôi trắng
 *  - chuỗi có biến `${x}` thành mẫu "{0} …" (bản dịch dùng lại {0}, {1}… được đổi thứ tự)
 *  - chuỗi có thẻ HTML được cắt theo thẻ (mỗi đoạn chữ giữa thẻ là 1 khoá), giá trị
 *    title / aria-label / placeholder / alt trong thẻ cũng là khoá
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '../..');
const VN = /[ạảãàáâầấậẩẫăằắặẳẵđèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹĐÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴỶỸÝ]/;
// Chữ Việt không dấu (giống ASCII_KEYS trong src/game/i18n.ts)
const ASCII_VN = /(?<!\p{L})(?:Kim|xu|Xu|tim|Tim|Sinh|Kem|Hoa|Atiso)(?!\p{L})/u;
const isVn = (s) => VN.test(s) || ASCII_VN.test(s);
// Tệp không có chữ cho người chơi (máy chủ, công cụ, kiểm thử)
const SKIP = [/^src\/server\//, /\.test\.ts$/, /^src\/i18n\//, /^src\/assets\//];

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const decode = (s) =>
  s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

/** Cắt 1 chuỗi (có thể có thẻ HTML, có {n}) thành các khoá */
function piecesOf(s) {
  const out = [];
  if (!/<[a-zA-Z/!]/.test(s)) {
    out.push(s);
  } else {
    const re = /<[^>]*>/g;
    let last = 0;
    let m;
    while ((m = re.exec(s))) {
      out.push(s.slice(last, m.index));
      const tag = m[0];
      for (const a of tag.matchAll(/\b(?:title|aria-label|placeholder|alt|data-tip)\s*=\s*"([^"]*)"/g)) out.push(a[1]);
      last = m.index + tag.length;
    }
    out.push(s.slice(last));
  }
  const keys = [];
  for (let p of out) {
    p = norm(decode(p));
    if (!p || !isVn(p)) continue;
    // {0} rời ở đầu / cuối đoạn nhưng nằm sát chữ khác vẫn giữ: "Đợt {0}/{1}"
    // đánh số lại {n} từ 0 trong từng đoạn
    let i = 0;
    const map = new Map();
    p = p.replace(/\{(\d+)\}/g, (_, n) => {
      if (!map.has(n)) map.set(n, i++);
      return `{${map.get(n)}}`;
    });
    keys.push(p);
  }
  return keys;
}

function templateToString(node) {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  let s = node.head.text;
  node.templateSpans.forEach((sp, i) => {
    s += `{${i}}` + sp.literal.text;
  });
  return s;
}

function fromTs(file, add) {
  const src = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    // bỏ: import, khoá thuộc tính, console.*
    if (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) return;
    if (ts.isCallExpression(n) && n.expression.getText(src).startsWith('console.')) return;
    let s = null;
    if (ts.isStringLiteral(n)) {
      if (n.parent && ts.isPropertyAssignment(n.parent) && n.parent.name === n) return;
      if (n.parent && ts.isElementAccessExpression(n.parent)) return;
      s = n.text;
    } else if (ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) {
      s = templateToString(n);
    }
    if (s && isVn(s)) for (const k of piecesOf(s)) add(k, file);
    ts.forEachChild(n, visit);
  };
  visit(src);
}

function fromJson(file, add) {
  const walk = (o) => {
    if (typeof o === 'string') {
      if (isVn(o)) for (const k of piecesOf(o)) add(k, file);
    } else if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk(JSON.parse(fs.readFileSync(file, 'utf8')));
}

function listFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(p, out);
    else if (/\.(ts|json)$/.test(e.name)) out.push(p);
  }
  return out;
}

function collect() {
  const keys = new Map(); // khoá → tệp đầu tiên
  const add = (k, file) => {
    if (!keys.has(k)) keys.set(k, path.relative(ROOT, file));
  };
  for (const f of listFiles(path.join(ROOT, 'src'))) {
    const rel = path.relative(ROOT, f).split(path.sep).join('/');
    if (SKIP.some((r) => r.test(rel))) continue;
    if (f.endsWith('.ts')) fromTs(f, add);
    else fromJson(f, add);
  }
  // Chữ trong trang gốc (màn chờ tải)
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<head>[\s\S]*?<\/head>/g, '');
  for (const k of piecesOf(html)) add(k, path.join(ROOT, 'index.html'));
  return keys;
}

module.exports = { collect, piecesOf, norm };

if (require.main === module) {
  const keys = collect();
  const dictPath = path.join(ROOT, 'src/i18n/en.json');
  const dict = fs.existsSync(dictPath) ? JSON.parse(fs.readFileSync(dictPath, 'utf8')) : {};
  const missing = {};
  for (const [k, f] of keys) if (!(k in dict)) (missing[f] ||= []).push(k);
  const nMissing = Object.values(missing).reduce((a, b) => a + b.length, 0);
  const unused = Object.keys(dict).filter((k) => !keys.has(k));
  console.log(`khoá: ${keys.size} | đã dịch: ${keys.size - nMissing} | thiếu: ${nMissing} | thừa: ${unused.length}`);
  if (process.argv.includes('--check')) {
    if (nMissing) {
      console.error(JSON.stringify(missing, null, 1).slice(0, 4000));
      process.exit(1);
    }
  } else {
    fs.writeFileSync(path.join(__dirname, 'missing.json'), JSON.stringify(missing, null, 1));
    if (process.argv.includes('--prune') && unused.length) {
      for (const k of unused) delete dict[k];
      fs.writeFileSync(dictPath, JSON.stringify(dict, null, 1) + '\n');
      console.log('đã bỏ khoá thừa');
    }
  }
}
