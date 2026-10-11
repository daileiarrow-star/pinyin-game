/* 把 29 张知识点图解渲染成 PNG 便于肉眼检查
   用法： node tools/render-illus.js [输出目录]            */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'tools', '_preview');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const api = new Function(read('data.js') + '\n' + read('questions.js') + '\n' + read('illus.js') +
  '\n;return {KNOWLEDGE_POINTS,EXPLANATIONS,renderIllustration};')();

const COLS = 2, ROWS = 5, CW = 360, CH = 232;
const perPage = COLS * ROWS;
const items = api.KNOWLEDGE_POINTS.map(kp => ({
  id: kp.id, title: kp.name, tag: kp.tag,
  svg: api.renderIllustration(api.EXPLANATIONS[kp.id].illus)
}));

console.log('共', items.length, '张图解');
const empty = items.filter(i => !i.svg);
if (empty.length) console.log('!! 未生成图形的知识点:', empty.map(i => i.id).join(','));

function cell(it, x, y) {
  const inner = it.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return `<g transform="translate(${x + 10},${y + 26})">
    <rect x="0" y="0" width="${CW - 20}" height="${CH - 36}" rx="12" fill="#fff" stroke="#ECEAF6"/>
    <text x="0" y="-8" font-size="13" font-weight="700" fill="#6C5CE7">${it.id} · ${it.tag}</text>
    <g transform="scale(${(CW - 20) / 320})">${inner}</g>
  </g>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const pages = Math.ceil(items.length / perPage);
  for (let p = 0; p < pages; p++) {
    const chunk = items.slice(p * perPage, (p + 1) * perPage);
    let body = '';
    chunk.forEach((it, i) => {
      const c = i % COLS, r = Math.floor(i / COLS);
      body += cell(it, c * CW, r * CH);
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * CW}" height="${ROWS * CH}"
      viewBox="0 0 ${COLS * CW} ${ROWS * CH}">
      <style>text{font-family:"Microsoft YaHei","PingFang SC",sans-serif}</style>
      <rect width="100%" height="100%" fill="#F4F2FF"/>
      ${body}</svg>`;
    const out = path.join(OUT, `illus-${p + 1}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log('已输出', out);
  }
})();
