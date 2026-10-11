/* 题库结构自检 —— 用法： node tools/check-data.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
const api = new Function(
  read('data.js') + '\n' + read('questions.js') + '\n' + read('illus.js') + '\n' + read('avatar.js') +
  '\n;return {KNOWLEDGE_POINTS, EXPLANATIONS, QUESTIONS, OUTFITS, CONFIG, renderIllustration, Avatar, AV_ART, BASE_TOP, BASE_BOTTOM};'
)();
const { KNOWLEDGE_POINTS, EXPLANATIONS, QUESTIONS, OUTFITS, renderIllustration, Avatar, AV_ART, BASE_TOP, BASE_BOTTOM } = api;

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
const uneven = KNOWLEDGE_POINTS.filter(k => byK[k.id] !== 8);
if (uneven.length) warn.push('题数不是8的知识点: ' + uneven.map(k => k.id + '(' + (byK[k.id] || 0) + ')').join(', '));

const ids = new Set();
QUESTIONS.forEach((q, n) => {
  const tag = `#${n} ${q.id} ${q.content}`;
  if (ids.has(q.id)) errs.push('题目 id 重复: ' + q.id);
  ids.add(q.id);
  if (!kpIds.has(q.knowledge)) errs.push(tag + ' 知识点不存在: ' + q.knowledge);
  if (!q.why) warn.push(tag + ' 缺少一句话说明(why)');
  if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(tag + ' 选项数不是4');
  else if (new Set(q.options).size !== 4) errs.push(tag + ' 选项有重复: ' + JSON.stringify(q.options));
  if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= 4) errs.push(tag + ' answer 下标非法');
  if (q.content.length > 4) errs.push(tag + ' 题面过长');
});

const seen = {};
QUESTIONS.forEach(q => {
  const key = q.knowledge + '|' + q.content;
  if (seen[key]) errs.push('同知识点内题面重复: ' + key);
  seen[key] = 1;
});

console.log('装扮数量:', OUTFITS.length);
const oIds = new Set();
const slots = ['hat', 'eyes', 'top', 'bottom', 'shoes', 'back', 'hand'];
OUTFITS.forEach(o => {
  if (oIds.has(o.id)) errs.push('装扮 id 重复: ' + o.id);
  oIds.add(o.id);
  if (slots.indexOf(o.slot) < 0) errs.push('装扮槽位非法: ' + o.id + '/' + o.slot);
  if (!o.name || typeof o.cost !== 'number') errs.push('装扮字段不全: ' + o.id);
  if (!AV_ART[o.id]) errs.push('装扮缺少图形(AV_ART): ' + o.id);
  else if (!Avatar.itemIcon(o.id)) errs.push('装扮图标生成失败: ' + o.id);
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

// 语音文件是否齐全
const qdir = path.join(ROOT, 'audio', 'q');
const edir = path.join(ROOT, 'audio', 'e');
if (fs.existsSync(qdir)) {
  const missQ = QUESTIONS.filter(q => !fs.existsSync(path.join(qdir, q.id + '.mp3')));
  if (missQ.length) warn.push('缺少题目语音 ' + missQ.length + ' 个（会自动降级到浏览器合成）: ' + missQ.slice(0, 5).map(q => q.id).join(',') + (missQ.length > 5 ? ' …' : ''));
} else warn.push('未找到 audio/q 目录，将使用浏览器语音合成');

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
