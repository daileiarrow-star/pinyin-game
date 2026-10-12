/* 清理孤儿音频：题目/知识点已删除，对应 mp3 不再被引用。
   生成文件，可随时用 tools/generate_audio.py 重建 —— 删除是安全的。 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const api = new Function(
  fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(ROOT, 'js/questions.js'), 'utf8') +
  '\n;return {KNOWLEDGE_POINTS, QUESTIONS};'
)();
const { KNOWLEDGE_POINTS, QUESTIONS } = api;

const usedQ = new Set(QUESTIONS.map(q => q.audioId || q.id));
const usedE = new Set(KNOWLEDGE_POINTS.map(k => k.id));

function clean(dir, used) {
  const full = path.join(ROOT, 'audio', dir);
  if (!fs.existsSync(full)) return [];
  const removed = [];
  for (const f of fs.readdirSync(full)) {
    if (!f.endsWith('.mp3')) continue;
    const id = f.slice(0, -4);
    if (!used.has(id)) { fs.unlinkSync(path.join(full, f)); removed.push(dir + '/' + f); }
  }
  return removed;
}
const rq = clean('q', usedQ);
const re = clean('e', usedE);
console.log('题目语音 删除', rq.length, '个');
console.log('讲解语音 删除', re.length, '个:', re.join(', '));
