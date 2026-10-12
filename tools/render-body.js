/* 快速渲染形象检查（只用 avatar.js，不依赖题库）
   用法： node tools/render-body.js [输出目录] */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'tools', '_preview');
const api = new Function(fs.readFileSync(path.join(ROOT, 'js', 'avatar.js'), 'utf8') +
  '\n;return {Avatar,AV_ART,AV_ANCHOR,AV_BASE};')();

const W = 176, H = 296;
const D = { hat: {}, eyes: {}, top: {}, bottom: {}, shoes: {} };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const cells = [
    { label: '男孩 · 初始', svg: api.Avatar.svg('boy', {}) },
    { label: '女孩 · 初始', svg: api.Avatar.svg('girl', {}) }
  ];
  let body = '';
  cells.forEach((c, i) => {
    const inner = c.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    body += `<g transform="translate(${i * W + 8},28)">
      <rect width="${W - 16}" height="${H - 40}" rx="14" fill="#fff" stroke="#ECEAF6"/>
      <text x="${(W - 16) / 2}" y="-10" font-size="13" font-weight="700" fill="#6C5CE7" text-anchor="middle">${c.label}</text>
      <g transform="translate(${((W - 16) - 160) / 2},4) scale(1.02)">${inner}</g></g>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cells.length * W}" height="${H}" viewBox="0 0 ${cells.length * W} ${H}">
    <style>text{font-family:"Microsoft YaHei",sans-serif}</style><rect width="100%" height="100%" fill="#F4F2FF"/>${body}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, 'body.png'));
  console.log('已输出 body.png');
})();
