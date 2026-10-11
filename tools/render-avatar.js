/* 渲染全身像与装备图标为 PNG 便于肉眼检查
   用法： node tools/render-avatar.js [输出目录]          */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'tools', '_preview');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const api = new Function(read('data.js') + '\n' + read('questions.js') + '\n' + read('avatar.js') +
  '\n;return {OUTFITS,Avatar,BASE_TOP,BASE_BOTTOM};')();

const W = 168, H = 274;          // 单元格
const COLS = 5;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const A = api.Avatar;

  /* ---- 第 1 张：男孩 / 女孩 默认形象 + 全装备形象 ---- */
  {
    const cells = [
      { label: '男孩 · 初始', svg: A.svg('boy', {}) },
      { label: '女孩 · 初始', svg: A.svg('girl', {}) },
      { label: '男孩 · 全装备', svg: A.svg('boy', { hat: 'hat_crown', eyes: 'eye_sun', top: 'top_hoodie', bottom: 'bot_jeans', shoes: 'shoe_sneak', back: 'back_rocket', hand: 'hand_wand' }) },
      { label: '女孩 · 全装备', svg: A.svg('girl', { hat: 'hat_sun', eyes: 'eye_star', top: 'top_dino', bottom: 'bot_skirt', shoes: 'shoe_boot', back: 'back_wing', hand: 'hand_balloon' }) },
      { label: '女孩 · 运动装', svg: A.svg('girl', { hat: 'hat_cap', top: 'top_star', bottom: 'bot_ball', shoes: 'shoe_sneak', back: 'back_bag', hand: 'hand_ball' }) }
    ];
    const rows = 1, cols = cells.length;
    let body = '';
    cells.forEach((c, i) => {
      const inner = c.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      body += `<g transform="translate(${i * W + 6},26)">
        <rect width="${W - 12}" height="${H - 32}" rx="12" fill="#fff" stroke="#ECEAF6"/>
        <text x="${(W - 12) / 2}" y="-8" font-size="12" font-weight="700" fill="#6C5CE7" text-anchor="middle">${c.label}</text>
        <g transform="scale(${(W - 12) / 160})">${inner}</g></g>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * W}" height="${H}" viewBox="0 0 ${cols * W} ${H}">
      <style>text{font-family:"Microsoft YaHei",sans-serif}</style><rect width="100%" height="100%" fill="#F4F2FF"/>${body}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, 'avatar-1.png'));
    console.log('已输出 avatar-1.png');
  }

  /* ---- 第 2 张起：22 件装备图标 ---- */
  const icons = api.OUTFITS;
  const rows = Math.ceil(icons.length / COLS);
  let body = '';
  icons.forEach((o, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const ic = A.itemIcon(o.id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    body += `<g transform="translate(${c * W + 6},${r * H + 26})">
      <rect width="${W - 12}" height="${H - 32}" rx="12" fill="#fff" stroke="#ECEAF6"/>
      <text x="${(W - 12) / 2}" y="-8" font-size="12" font-weight="700" fill="#6C5CE7" text-anchor="middle">${o.slot} · ${o.name}</text>
      <g transform="translate(${(W - 12) / 2},${(H - 32) / 2})">${ic}</g></g>`;
  });
  const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * W}" height="${rows * H}" viewBox="0 0 ${COLS * W} ${rows * H}">
    <style>text{font-family:"Microsoft YaHei",sans-serif}</style><rect width="100%" height="100%" fill="#F4F2FF"/>${body}</svg>`;
  await sharp(Buffer.from(svg2)).png().toFile(path.join(OUT, 'avatar-2.png'));
  console.log('已输出 avatar-2.png（' + icons.length + ' 件装备）');
})();
