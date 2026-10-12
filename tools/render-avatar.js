/* 渲染全身像与装备图标为 PNG 便于肉眼检查
   用法： node tools/render-avatar.js [输出目录]          */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'tools', '_preview');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const api = new Function(read('data.js') + '\n' + read('avatar.js') +
  '\n;return {OUTFITS,Avatar,BASE_TOP,BASE_BOTTOM};')();

const W = 168, H = 300;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const A = api.Avatar;

  /* ---- 第 1 张：默认 + 全套穿戴 ---- */
  {
    const cells = [
      { label: '男孩 · 初始', svg: A.svg('boy', {}) },
      { label: '女孩 · 初始', svg: A.svg('girl', {}) },
      {
        label: '男孩 · 华丽全套', svg: A.svg('boy', {
          hat: 'hat_crown', eyes: 'eye_sun', ear: 'ear_gold_x', neck: 'neck_gold', wrist: 'wrist_gold',
          top: 'top_super', cape: 'cape_hero', bottom: 'bot_jeans', shoes: 'shoe_light',
          back: 'back_rocket', hand: 'hand_wand', pet: 'pet_dino', vehicle: 'veh_car'
        })
      },
      {
        label: '女孩 · 甜美全套', svg: A.svg('girl', {
          hat: 'hat_flower', eyes: 'eye_heart', ear: 'ear_pearl', neck: 'neck_pearl', wrist: 'wrist_kid',
          top: 'top_sailor', cape: 'cape_butterfly', bottom: 'bot_tutu', shoes: 'shoe_sandal',
          back: 'back_butterfly', hand: 'hand_flower', pet: 'pet_unicorn', vehicle: 'veh_bike'
        })
      }
    ];
    const cols = cells.length;
    let body = '';
    cells.forEach((c, i) => {
      const inner = c.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      body += `<g transform="translate(${i * W + 6},28)">
        <rect width="${W - 12}" height="${H - 42}" rx="12" fill="#fff" stroke="#ECEAF6"/>
        <text x="${(W - 12) / 2}" y="-9" font-size="12" font-weight="700" fill="#6C5CE7" text-anchor="middle">${c.label}</text>
        <g transform="scale(${(W - 12) / 160})">${inner}</g></g>`;
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cols * W}" height="${H}" viewBox="0 0 ${cols * W} ${H}">
      <style>text{font-family:"Microsoft YaHei",sans-serif}</style><rect width="100%" height="100%" fill="#F4F2FF"/>${body}</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, 'avatar-1.png'));
    console.log('已输出 avatar-1.png');
  }

  /* ---- 第 2 张起：全部装备图标 ---- */
  const icons = api.OUTFITS;
  const COLS = 6;
  const rows = Math.ceil(icons.length / COLS);
  let body = '';
  icons.forEach((o, i) => {
    const c = i % COLS, r = Math.floor(i / COLS);
    const ic = A.itemIcon(o.id, o.slot).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    body += `<g transform="translate(${c * W + 6},${r * (H * 0.72) + 26})">
      <rect width="${W - 12}" height="${H * 0.72 - 34}" rx="10" fill="#fff" stroke="#ECEAF6"/>
      <text x="${(W - 12) / 2}" y="-7" font-size="11" font-weight="700" fill="#6C5CE7" text-anchor="middle">${o.name}</text>
      <g transform="translate(${(W - 12) / 2},${(H * 0.72 - 34) / 2 + 2})">${ic}</g></g>`;
  });
  const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${COLS * W}" height="${rows * H * 0.72}" viewBox="0 0 ${COLS * W} ${rows * H * 0.72}">
    <style>text{font-family:"Microsoft YaHei",sans-serif}</style><rect width="100%" height="100%" fill="#F4F2FF"/>${body}</svg>`;
  await sharp(Buffer.from(svg2)).png().toFile(path.join(OUT, 'avatar-2.png'));
  console.log('已输出 avatar-2.png（' + icons.length + ' 件装备）');
})();
