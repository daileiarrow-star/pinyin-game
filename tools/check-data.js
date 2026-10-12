/* 题库结构自检 —— 用法： node tools/check-data.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const api = new Function(
  read('data.js') + '\n' + read('questions.js') + '\n' + read('illus.js') + '\n' + read('avatar.js') +
  '\n;return {KNOWLEDGE_POINTS, EXPLANATIONS, QUESTIONS, OUTFITS, CONFIG, renderIllustration, Avatar, AV_ART, BASE_TOP, BASE_BOTTOM};'
)();
const { KNOWLEDGE_POINTS, EXPLANATIONS, QUESTIONS, OUTFITS, renderIllustration, Avatar, AV_ART, BASE_TOP, BASE_BOTTOM, CONFIG } = api;

const errs = [], warn = [];

console.log('知识点数量:', KNOWLEDGE_POINTS.length);
const kpIds = new Set(KNOWLEDGE_POINTS.map(k => k.id));
if (kpIds.size !== KNOWLEDGE_POINTS.length) errs.push('知识点 id 有重复');

// 题卡上的短标签必须唯一，否则孩子分不清具体是哪个规则
const tagSeen = {};
KNOWLEDGE_POINTS.forEach(k => {
  if (!k.tag) errs.push('知识点缺少 tag: ' + k.id);
  if (tagSeen[k.tag]) errs.push('知识点 tag 重复（题卡上会分不清）: "' + k.tag + '" 被 ' + tagSeen[k.tag] + ' 和 ' + k.id + ' 共用');
  tagSeen[k.tag] = k.id;
  if (!k.name || !k.category) errs.push('知识点字段不全: ' + k.id);
});

const missingExp = KNOWLEDGE_POINTS.filter(k => !EXPLANATIONS[k.id]);
if (missingExp.length) errs.push('缺少讲解: ' + missingExp.map(k => k.id).join(','));
const orphanExp = Object.keys(EXPLANATIONS).filter(k => !kpIds.has(k));
if (orphanExp.length) errs.push('多余讲解: ' + orphanExp.join(','));

// 图文讲解：图必须能生成，口诀 / 例词 / 提醒必须齐
KNOWLEDGE_POINTS.forEach(k => {
  const ex = EXPLANATIONS[k.id];
  if (!ex) return;
  ['title', 'illus', 'one', 'key', 'pairs', 'warn'].forEach(f => {
    if (!ex[f]) errs.push(`讲解 ${k.id} 缺少字段 ${f}`);
  });
  if (ex.illus && !renderIllustration(ex.illus)) errs.push(`讲解 ${k.id} 的图解生成失败（illus 配置有误）`);
  if (Array.isArray(ex.pairs) && ex.pairs.length < 2) warn.push(`讲解 ${k.id} 的例词少于 2 组`);
});

const byK = {};
QUESTIONS.forEach(q => { byK[q.knowledge] = (byK[q.knowledge] || 0) + 1; });
console.log('题目总数:', QUESTIONS.length);
const types = {};
QUESTIONS.forEach(q => { types[q.type] = (types[q.type] || 0) + 1; });
console.log('题型分布:', JSON.stringify(types));
const uneven = KNOWLEDGE_POINTS.filter(k => byK[k.id] < 8);
if (uneven.length) warn.push('题数少于8的知识点: ' + uneven.map(k => k.id + '(' + (byK[k.id] || 0) + ')').join(', '));

const TYPE_NEEDS_OPTS = { choice: 1, listen: 1, fill: 1, classify: 1 };
const ids = new Set();
QUESTIONS.forEach((q, n) => {
  const tag = `#${n} ${q.id} ${q.content}`;
  if (ids.has(q.id)) errs.push('题目 id 重复: ' + q.id);
  ids.add(q.id);
  if (!kpIds.has(q.knowledge)) errs.push(tag + ' 知识点不存在: ' + q.knowledge);
  if (!q.why) warn.push(tag + ' 缺少一句话说明(why)');
  if (!q.type) errs.push(tag + ' 缺少 type');

  if (TYPE_NEEDS_OPTS[q.type]) {
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(tag + ' 选项数不是4');
    else if (new Set(q.options).size !== 4) errs.push(tag + ' 选项有重复: ' + JSON.stringify(q.options));
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= 4) errs.push(tag + ' answer 下标非法');
  }
  if (q.type === 'listen' && !q.hideWord) errs.push(tag + ' listen 题缺少 hideWord');
  if (q.type === 'judge') {
    if (typeof q.judgePinyin !== 'string' || !q.judgePinyin) errs.push(tag + ' judge 缺 judgePinyin');
    if (typeof q.judgeOk !== 'boolean') errs.push(tag + ' judge 缺 judgeOk');
  }
  if (q.type === 'match') {
    if (!Array.isArray(q.pairs) || q.pairs.length !== 4) errs.push(tag + ' match 必须恰好 4 对');
    else {
      const pys = q.pairs.map(p => p[1]);
      if (new Set(pys).size !== 4) errs.push(tag + ' match 拼音有重复: ' + pys.join(','));
      const cs = q.pairs.map(p => p[0]);
      if (new Set(cs).size !== 4) errs.push(tag + ' match 汉字有重复');
    }
  }
  if (q.type === 'spell') {
    if (!Array.isArray(q.tiles) || q.tiles.length < 2) errs.push(tag + ' spell 缺 tiles');
    if (!Array.isArray(q.extraTiles) || !q.extraTiles.length) errs.push(tag + ' spell 缺 extraTiles');
  }
  if (q.content.length > 4) errs.push(tag + ' 题面过长');
  // choice 自带语音；match 不用听；classify 的题面是汉字，会生成独立语音
  if (['choice', 'match', 'classify'].indexOf(q.type) < 0 && !q.audioId) {
    warn.push(tag + ' 未指定 audioId（会生成独立语音文件）');
  }
  if (q.type === 'classify') {
    const labels = q.options.join('|');
    if (labels !== '整体认读|不是整体认读|是声母|是韵母') errs.push(tag + ' classify 选项不是标准四选项: ' + labels);
  }
});

const seen = {};
QUESTIONS.forEach(q => {
  if (q.type !== 'choice') return;
  const key = q.knowledge + '|' + q.content;
  if (seen[key]) errs.push('同知识点内题面重复: ' + key);
  seen[key] = 1;
});

console.log('装扮数量:', OUTFITS.length);
const oIds = new Set();
const slots = ['hat', 'eyes', 'ear', 'neck', 'wrist', 'top', 'cape', 'bottom', 'shoes', 'back', 'hand', 'pet', 'vehicle'];
OUTFITS.forEach(o => {
  if (oIds.has(o.id)) errs.push('装扮 id 重复: ' + o.id);
  oIds.add(o.id);
  if (slots.indexOf(o.slot) < 0) errs.push('装扮槽位非法: ' + o.id + '/' + o.slot);
  if (!o.name || typeof o.cost !== 'number') errs.push('装扮字段不全: ' + o.id);
  if (!AV_ART[o.id]) errs.push('装扮缺少图形(AV_ART): ' + o.id);
  else if (!Avatar.itemIcon(o.id, o.slot)) errs.push('装扮图标生成失败: ' + o.id);
});
// 每个槽位至少 3 件
slots.forEach(s => {
  const c = OUTFITS.filter(o => o.slot === s).length;
  if (c < 3) warn.push('槽位 ' + s + ' 只有 ' + c + ' 件');
});
[BASE_TOP, BASE_BOTTOM, 'shoe_base'].forEach(id => {
  if (!AV_ART[id]) errs.push('默认穿搭缺少图形: ' + id);
});

// 男孩 / 女孩全身像必须能生成
['boy', 'girl'].forEach(g => {
  const svg = Avatar.svg(g, {});
  if (!svg || svg.length < 500) errs.push(g + ' 全身像生成失败');
  if (!Avatar.svg(g, { hat: 'hat_crown', eyes: 'eye_sun', top: 'top_hoodie', bottom: 'bot_jeans', shoes: 'shoe_sneak', back: 'back_bag', hand: 'hand_ball' })) {
    errs.push(g + ' 全装备像生成失败');
  }
});

// 语音文件是否齐全（按 audioId 去重：新题型复用选择题语音）
const qdir = path.join(ROOT, 'audio', 'q');
const edir = path.join(ROOT, 'audio', 'e');
const needIds = [...new Set(QUESTIONS.filter(q => !q.noAudio).map(q => q.audioId || q.id))];
if (fs.existsSync(qdir)) {
  const missQ = needIds.filter(id => !fs.existsSync(path.join(qdir, id + '.mp3')));
  if (missQ.length) warn.push('缺少题目语音 ' + missQ.length + ' 个（会自动降级到浏览器合成）: ' + missQ.slice(0, 5).join(',') + (missQ.length > 5 ? ' …' : ''));
} else warn.push('未找到 audio/q 目录，将使用浏览器语音合成');

// 音频复用一致性：新题型（听音/判断/填空/拼读）会共用选择题的录音，
// 如果 audioId 指向的那道选择题问面字不同，就会出现「听到的是 A、题目问的是 B」的严重错误
const choiceById = {};
QUESTIONS.filter(q => q.type === 'choice').forEach(q => { choiceById[q.id] = q; });
QUESTIONS.forEach(q => {
  if (q.noAudio || !q.audioId) return;
  const src = choiceById[q.audioId];
  if (!src) {
    if (errs.length < 200) errs.push(`${q.id}: audioId「${q.audioId}」不存在对应的选择题语音`);
  } else if (src.content !== q.content) {
    errs.push(`${q.id}: 题面「${q.content}」但复用 ${q.audioId} 的语音，而那条录的是「${src.content}」`);
  }
});

// 填空题：▢ 必须在显示串里，且候选块不能重复
QUESTIONS.filter(q => q.type === 'fill').forEach(q => {
  if (!q.display || q.display.indexOf('▢') < 0) errs.push(`${q.id}: 填空题缺少 ▢ 空位`);
  if (new Set(q.options).size !== q.options.length) errs.push(`${q.id}: 填空候选块有重复`);
  if (q.options.some(o => !o)) errs.push(`${q.id}: 填空有空的候选块`);
});

/* ---------- 上线配置自检（激活码 / 客服 / 收款码）---------- */
const CODES = CONFIG.activationCodes || [];
console.log('激活码数量:', CODES.length);
if (!CODES.length) errs.push('CONFIG.activationCodes 为空：家长付款后无法开通');
if (new Set(CODES).size !== CODES.length) {
  const dup = [...new Set(CODES.filter((c, i) => CODES.indexOf(c) !== i))];
  errs.push('激活码有重复: ' + dup.join(','));
}
CODES.forEach(c => {
  if (!/^[A-Z0-9]+$/.test(c)) errs.push('激活码只能由大写字母和数字组成（输入框会自动转大写）: ' + c);
  if (c.length < 6) errs.push('激活码短于 6 位，容易被猜中: ' + c);
  if (/[0O1IL]/.test(c)) warn.push('激活码含易混字符 0/O/1/I/L，家长容易输错: ' + c);
});
if (!CONFIG.contact || /your_wechat_id|占位/i.test(CONFIG.contact)) errs.push('CONFIG.contact 还是占位值，家长付完款找不到客服');
if (CONFIG.eggChance !== undefined && (CONFIG.eggChance < 0 || CONFIG.eggChance > 1)) errs.push('CONFIG.eggChance 必须在 0 ~ 1 之间（是概率，不是百分比）');
if (!CONFIG.qrImage) errs.push('CONFIG.qrImage 未配置');
else if (!fs.existsSync(path.join(ROOT, CONFIG.qrImage))) warn.push('收款码图片不存在: ' + CONFIG.qrImage);

if (fs.existsSync(edir)) {
  const missE = KNOWLEDGE_POINTS.filter(k => !fs.existsSync(path.join(edir, k.id + '.mp3')));
  if (missE.length) warn.push('缺少讲解语音 ' + missE.length + ' 个: ' + missE.map(k => k.id).join(','));
} else warn.push('未找到 audio/e 目录，将使用浏览器语音合成');

console.log('\n===== 警告 =====');
console.log(warn.length ? warn.join('\n') : '（无）');
console.log('\n===== 错误 =====');
console.log(errs.length ? errs.join('\n') : '（无）');
console.log('\n结论：' + (errs.length ? '❌ 存在必须修复的错误' : '✅ 通过'));
process.exit(errs.length ? 1 : 0);
