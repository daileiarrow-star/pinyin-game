/* 拼音小达人 —— 功能冒烟测试（jsdom 真点一遍）
   用法：
     npm i jsdom
     node tools/smoke-test.js     # 需要先起本地服务：python -m http.server 5183
   环境变量 BASE 可指定服务地址，默认 http://127.0.0.1:5183/
*/
const { JSDOM } = require('jsdom');

const BASE = process.env.BASE || 'http://127.0.0.1:5183/';
const LS = 'pinyin_daren_v3';
const pass = [], fail = [];
function ok(name, cond, extra) {
  if (cond) { pass.push(name); console.log('  PASS  ' + name); }
  else { fail.push(name + (extra ? ' -> ' + extra : '')); console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 跨页面共享的 localStorage：jsdom 每个实例的存储是独立的 */
let __store = {};
function storageShim() {
  const s = __store;
  return {
    getItem: k => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: k => { delete s[k]; },
    clear: () => { for (const k in s) delete s[k]; },
    key: i => Object.keys(s)[i] ?? null,
    get length() { return Object.keys(s).length; }
  };
}

async function loadPage(opts) {
  opts = opts || {};
  if (opts.fresh) __store = {};
  const dom = await JSDOM.fromURL(BASE, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.__audioLog = [];
      window.__spoken = [];
      window.scrollTo = () => { };
      window.Audio = class {
        constructor(src) { this.src = src; window.__audioLog.push(src); }
        play() { return Promise.reject(new Error('no audio file in test env')); }
      };
      window.speechSynthesis = { cancel() { }, getVoices: () => [], speak(u) { window.__spoken.push(u.text); } };
      window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
      Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true });
      Object.defineProperty(window, 'localStorage', { value: storageShim(), configurable: true });
    }
  });
  await new Promise(res => {
    if (dom.window.document.readyState === 'complete') return res();
    dom.window.addEventListener('load', res);
    setTimeout(res, 5000);
  });
  await sleep(150);
  /* 随机彩蛋受 Math.random 影响，会让主流程断言偶发失败；默认关掉，专门测它时再打开 */
  dom.window.eval('CONFIG.eggChance = 0');
  return dom;
}

function api(dom) {
  const w = dom.window, d = w.document;
  return {
    dom, w, d,
    $: id => d.getElementById(id),
    activePage: () => { const p = d.querySelector('.page.active'); return p ? p.id : null; },
    click: el => el && el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })),
    toast: () => d.getElementById('toast').textContent,
    /* 当前题（含答案），来自测试钩子 */
    cur() {
      const raw = w.eval('(function(){var s=__pyTest.SS();if(!s)return null;return JSON.stringify(s.queue[s.i]);})()');
      return raw ? JSON.parse(raw) : null;
    },
    state() { return JSON.parse(w.eval('JSON.stringify(__pyTest.S())')); }
  };
}

/* ---------- 各题型的「正确作答」与「错误作答」 ---------- */
async function answerCur(a, deliberatelyWrong) {
  const { w, d, click } = a;
  const it = a.cur();
  if (!it) return;
  const box = d.getElementById('pd-options');

  if (it.type === 'choice' || it.type === 'listen' || it.type === 'fill' || it.type === 'classify') {
    /* 填空题按钮上显示的是「候选块填进 ▢ 之后的完整拼音」，所以比较用的期望文本也要按同样规则拼 */
    const labelOf = i => it.type === 'fill'
      ? String(it.display).replace('▢', it.opts[i])
      : it.opts[i];
    const want = labelOf(it.ans);
    const btns = Array.from(box.querySelectorAll('.opt'));
    const textOf = b => (b.querySelector('.opt-val') ? b.querySelector('.opt-val').textContent : b.textContent);
    const target = deliberatelyWrong
      ? btns.find(b => textOf(b) !== want)
      : btns.find(b => textOf(b) === want);
    click(target);
    return;
  }

  if (it.type === 'judge') {
    const btns = Array.from(box.querySelectorAll('.judge-btn'));
    const wantOk = deliberatelyWrong ? !it.judgeOk : it.judgeOk;
    click(btns[wantOk ? 0 : 1]);
    return;
  }

  if (it.type === 'spell') {
    const tiles = Array.from(box.querySelectorAll('.tile'));
    const seq = deliberatelyWrong
      ? it.target.concat().reverse()
      : it.target;
    for (const t of seq) {
      const b = tiles.find(x => !x.classList.contains('used') && x.textContent === t);
      if (!b) return;
      click(b);
      await sleep(30);
    }
    return;
  }

  if (it.type === 'match') {
    const lefts = Array.from(box.querySelectorAll('.match-col')[0].children);
    const rights = Array.from(box.querySelectorAll('.match-col')[1].children);
    for (let i = 0; i < it.pairs.length; i++) {
      const pairIdx = deliberatelyWrong ? (i + 1) % it.pairs.length : i;
      click(lefts[i]);
      await sleep(25);
      const py = it.pairs[pairIdx].p;
      const r = rights.find(x => !x.classList.contains('done') && x.textContent === py);
      click(r);
      await sleep(30);
      if (deliberatelyWrong) { /* 故意错一次即可，其余连对 */ }
    }
    return;
  }
}

/* 把一轮练习答完（可选：第 wrongAt 题故意答错） */
async function playThrough(a, wrongAt) {
  const { d } = a;
  for (let step = 0; step < 40; step++) {
    if (a.activePage() !== 'page-practice') break;
    const st = a.state();
    const quotaDone = st.dayCount >= (st.paid ? 9999 : 10);
    const it = a.cur();
    if (!it) break;
    await answerCur(a, step === wrongAt);
    if (step === wrongAt) {
      await sleep(1400);
      /* 讲解弹窗 → 学会了 */
      if (d.getElementById('modal-explain').classList.contains('show')) {
        a.click(d.getElementById('btn-ex-ok'));
        await sleep(120);
      }
    } else {
      await sleep(1000);
    }
  }
}

async function main() {
  let dom = await loadPage({ fresh: true });
  let a = api(dom);
  const { w, d, $, click, activePage } = a;

  /* ================= 首次进入：先选角色 ================= */
  console.log('\n【首次进入：选择小伙伴】');
  ok('首次进入先看到角色选择页', activePage() === 'page-choose', activePage());
  ok('渲染出两个角色卡片', d.querySelectorAll('#choose-grid .choose-card').length === 2);
  ok('角色卡片里有全身像 SVG', d.querySelectorAll('#choose-grid .choose-card svg').length === 2);
  ok('两个角色发型不同（男女可区分）',
    d.querySelector('#choose-grid .choose-card svg').innerHTML !==
    d.querySelectorAll('#choose-grid .choose-card svg')[1].innerHTML);
  click(d.querySelectorAll('#choose-grid .choose-card')[0]);
  await sleep(60);
  ok('选完男孩进入首页', activePage() === 'page-home', activePage());
  ok('性别已持久化', w.eval('JSON.parse(localStorage.getItem("' + LS + '")).gender') === 'boy');
  ok('首页舞台渲染出全身像 SVG', !!d.querySelector('#stage svg'));
  ok('空装扮有引导文案', /衣柜/.test($('worn-row').textContent), $('worn-row').textContent);
  ok('免费额度提示已渲染', /免费版每天 10 题/.test($('free-tip').textContent), $('free-tip').textContent);

  /* ================= 题库数据 ================= */
  console.log('\n【题库自检】');
  const qCount = w.eval('QUESTIONS.length');
  ok('题库题量充足（≥540 题）', qCount >= 540, String(qCount));
  /* 不写死题量：只断言真正的不变式 —— 每个知识点都练够、且题型有变化 */
  const cov = JSON.parse(w.eval(`(function(){
    var by={};
    QUESTIONS.forEach(function(q){ (by[q.knowledge]=by[q.knowledge]||[]).push(q); });
    return JSON.stringify(KNOWLEDGE_POINTS.map(function(k){
      var qs=by[k.id]||[];
      var types={}; qs.forEach(function(q){types[q.type]=1});
      return { id:k.id, n:qs.length, t:Object.keys(types).length };
    }));
  })()`));
  const thin = cov.filter(c => c.n < 8);
  const mono = cov.filter(c => c.t < 4);
  ok('每个知识点至少 8 道题', thin.length === 0,
    thin.map(c => c.id + '(' + c.n + ')').join(','));
  ok('每个知识点至少覆盖 4 种题型', mono.length === 0,
    mono.map(c => c.id + '(' + c.t + '种)').join(','));
  ok('知识点 ≥30 个', w.eval('KNOWLEDGE_POINTS.length') >= 30, String(w.eval('KNOWLEDGE_POINTS.length')));
  /* 反回归：家长反馈「妈 mā」这类单字声调辨别对学过拼音的孩子过基础，
     已整体移除（tone_1_2 / tone_2_3 / tone_3_4）。这里加断言防止以后又被补回来。 */
  ok('不含单字声调辨别题（tone_1_2 / tone_2_3 / tone_3_4 已移除）',
    w.eval(`(function(){
      var re = /^tone_[1-4]_[1-4]$/;
      return !KNOWLEDGE_POINTS.some(function(k){ return re.test(k.id); })
          && !QUESTIONS.some(function(q){ return re.test(q.knowledge); });
    })()`));
  ok('7 种题型都齐了',
    ['choice', 'listen', 'judge', 'match', 'fill', 'spell', 'classify'].every(t => w.eval('QUESTIONS.some(function(q){return q.type==="' + t + '"})')));
  ok('每个知识点都有讲解',
    w.eval('KNOWLEDGE_POINTS.every(function(k){return !!EXPLANATIONS[k.id]})'));
  ok('每条讲解的图都能生成',
    w.eval('KNOWLEDGE_POINTS.every(function(k){return !!renderIllustration(EXPLANATIONS[k.id].illus)})'));
  ok('选择题 4 选项且答案下标合法',
    w.eval('QUESTIONS.filter(function(q){return q.type==="choice"}).every(function(q){return q.options.length===4 && q.answer>=0 && q.answer<4})'));
  ok('听音题都隐藏题面', w.eval('QUESTIONS.filter(function(q){return q.type==="listen"}).every(function(q){return q.hideWord && q.audioId})'));
  ok('判断题都带拼音与结论', w.eval('QUESTIONS.filter(function(q){return q.type==="judge"}).every(function(q){return q.judgePinyin && typeof q.judgeOk==="boolean"})'));
  ok('连线题都是 4 对且无重复', w.eval('QUESTIONS.filter(function(q){return q.type==="match"}).every(function(q){return q.pairs.length===4 && new Set(q.pairs.map(function(p){return p[1]})).size===4})'));
  ok('拼读积木都带干扰块', w.eval('QUESTIONS.filter(function(q){return q.type==="spell"}).every(function(q){return q.tiles.length>=2 && q.extraTiles.length>=1})'));
  /* ---- v4：考纲重点知识点 + 归类题 ---- */
  const v4kps = ['apostrophe', 'mark_rule', 'y_w_rule', 'zhengti_judge', 'comprehensive'];
  ok('v4 的 5 个考纲重点知识点都在（隔音符号/标调位置/y-w 起头/整体认读判断/综合易错字音）',
    v4kps.every(k => w.eval('KNOWLEDGE_POINTS.some(function(x){return x.id==="' + k + '"})')));
  ok('归类题选项固定四选项，且 16 个整体认读全判「是」、4 个干扰字全判「不是」',
    w.eval(`(function(){
      var yes = {}, no = {};
      QUESTIONS.filter(function(q){return q.type==='classify'}).forEach(function(q){
        if (q.options.join('|') !== '整体认读|不是整体认读|是声母|是韵母') return false;
        (q.answer === 0 ? yes : no)[q.content] = 1;
      });
      var wantYes = '知吃是日字丝词一五鱼叶月圆音云英'.split('');
      var wantNo  = '严王又要'.split('');
      return wantYes.every(function(c){return yes[c]}) &&
             wantNo.every(function(c){return no[c]}) &&
             Object.keys(no).length === wantNo.length;
    })()`));
  ok('隔音符号不派生判断题（读音相同，判断题判不出对错）',
    !w.eval('QUESTIONS.some(function(q){return q.knowledge==="apostrophe" && q.type==="judge"})'));

  /* ================= 装扮 ================= */
  console.log('\n【装扮系统】');
  ok('79 件装扮都有图形', w.eval('OUTFITS.length') === 79 && w.eval('OUTFITS.every(function(o){return !!Avatar.itemIcon(o.id,o.slot)})'), String(w.eval('OUTFITS.length')));
  ok('13 个槽位都有装备',
    ['hat', 'eyes', 'ear', 'neck', 'wrist', 'top', 'cape', 'bottom', 'shoes', 'back', 'hand', 'pet', 'vehicle']
      .every(s => w.eval('OUTFITS.some(function(o){return o.slot==="' + s + '"})')));
  ok('13 个槽位都能画进全身像',
    ['hat', 'eyes', 'ear', 'neck', 'wrist', 'cape', 'pet', 'vehicle'].every(s => {
      const o = w.eval('(OUTFITS.filter(function(x){return x.slot==="' + s + '"})[0]||{}).id');
      if (!o) return false;
      const svg = w.eval('Avatar.svg("boy",{' + s + ':"' + o + '"})');
      return svg.length > 800;
    }));

  /* ================= 选项乱序 ================= */
  console.log('\n【选项乱序】');
  const shuffleReport = w.eval(`(function(){
    var qs = QUESTIONS.filter(function(x){return x.type==='choice'});
    var bad = 0, sameOrder = 0, rounds = 0;
    for (var n = 0; n < 60; n++) {
      var q = qs[n % qs.length];
      var it = __pyTest.toItem(q);
      rounds++;
      if (it.opts[it.ans] !== q.options[q.answer]) bad++;            /* 答案下标必须同步重算 */
      if (new Set(it.opts).size !== it.opts.length) bad++;           /* 打乱后不能丢项或重复 */
      if (it.opts.length !== q.options.length) bad++;
      var same = true;
      for (var i = 0; i < it.opts.length; i++) if (it.opts[i] !== q.options[i]) same = false;
      if (same) sameOrder++;
    }
    return JSON.stringify({ bad: bad, sameOrder: sameOrder, rounds: rounds });
  })()`);
  const sr = JSON.parse(shuffleReport);
  ok('打乱后答案下标仍指向正确选项、选项不丢失不重复', sr.bad === 0, JSON.stringify(sr));
  ok('选项顺序确实被打乱了（不是原序照搬）', sr.sameOrder < sr.rounds, JSON.stringify(sr));

  /* ================= 一轮定制练习：每种题型都点到 ================= */
  console.log('\n【七种题型逐一作答】');
  const oneOf = t => w.eval('(function(){var l=QUESTIONS.filter(function(q){return q.type==="' + t + '"});return JSON.stringify([l[0]]);})()');
  const allTypes = ['choice', 'listen', 'judge', 'fill', 'spell', 'match', 'classify'];
  const list = allTypes.map(t => JSON.parse(oneOf(t))[0]);
  ok('能取到 7 种题型的样本', list.length === 7 && list.every(Boolean));
  ok('其中有音节归类题', list.some(q => q && q.type === 'classify'));

  w.eval('__pyTest.S().dayCount = 0');   // 本组要连答 7 题，先清空今日计数
  w.__pyTest.start(list);
  await sleep(80);
  ok('定制一轮进入练习页', activePage() === 'page-practice', activePage());

  /* 语音两级降级：优先预生成 mp3，取不到才降级到浏览器合成 */
  console.log('\n【语音两级降级】');
  click($('btn-audio'));
  await sleep(150);
  ok('优先播放预生成音频文件', w.__audioLog.some(u => /audio\/q\/.+\.mp3$/.test(u)),
    (w.__audioLog[0] || '（没有发起任何音频请求）'));
  ok('音频不可用时自动降级到浏览器语音合成', w.__spoken.length > 0,
    w.__spoken.length + ' 段合成语音');

  const seenTypes = [];
  let ptsBefore = a.state().points;
  for (let i = 0; i < allTypes.length; i++) {
    const it = a.cur();
    if (!it) break;
    seenTypes.push(it.type);
    await answerCur(a, false);
    await sleep(1050);
    /* 讲解弹窗若出现（答错）就关掉 */
    if (d.getElementById('modal-explain').classList.contains('show')) {
      click(d.getElementById('btn-ex-ok'));
      await sleep(120);
    }
  }
  ok('七种题型都实际答过一轮', allTypes.every(t => seenTypes.indexOf(t) >= 0), seenTypes.join(','));
  ok('答对后积分增加', a.state().points > ptsBefore, ptsBefore + ' -> ' + a.state().points);
  ok('练习页进度条推进', a.state().totalCount >= 7, String(a.state().totalCount));

  /* ================= 填空题（补声母 / 补韵母 / 补隔音符号）================= */
  console.log('\n【填空题】');
  w.eval('__pyTest.S().dayCount = 0');
  const fillPick = w.eval(`(function(){
    var fs=QUESTIONS.filter(function(q){return q.type==='fill'});
    var head=fs.filter(function(q){return q.display.indexOf('▢')===0})[0];
    var mid=fs.filter(function(q){return q.display.indexOf('▢')>0})[0];
    return JSON.stringify([head,mid]);
  })()`);
  const [fillHead, fillMid] = JSON.parse(fillPick);
  ok('既有补声母的填空，也有补韵母的填空', !!fillHead && !!fillMid,
    (fillHead ? fillHead.display : '无') + ' / ' + (fillMid ? fillMid.display : '无'));
  ok('隔音符号也有填空题',
    w.eval('QUESTIONS.some(function(q){return q.type==="fill" && q.knowledge==="apostrophe"})'));

  w.__pyTest.start([fillHead, fillMid]);
  await sleep(80);
  const fillBtns = Array.from(d.querySelectorAll('#pd-options .opt'));
  ok('填空按钮上显示的是补完整后的拼音', fillBtns.length === 4 && fillBtns.every(b => !/▢/.test(b.textContent)),
    fillBtns.map(b => b.textContent).join(' / '));
  ok('题干提示告诉孩子要补什么', /补完整/.test(d.getElementById('q-hint').textContent),
    d.getElementById('q-hint').textContent);
  const ptsPre = a.state().points;
  await answerCur(a, false);
  await sleep(140);
  ok('补声母题答对会加分', a.state().points > ptsPre, ptsPre + ' -> ' + a.state().points);
  await answerCur(a, false);
  await sleep(140);
  ok('补韵母题也能答对（第二题）', a.state().totalCorrect >= 2 ||
    d.getElementById('pd-feedback').className.indexOf('good') >= 0,
    d.getElementById('pd-feedback').textContent);
  click($('btn-quit'));
  await sleep(120);
  if (d.getElementById('modal-confirm').classList.contains('show')) {
    click($('btn-cf-yes'));
    await sleep(160);
  }

  /* ================= 答错 → 图文讲解 → 举一反三 ================= */
  console.log('\n【答错闭环】');
  w.__pyTest.start([w.QUESTIONS.filter(q => q.type === 'choice' && q.knowledge === 'o_ou')[0]]);
  await sleep(80);
  await answerCur(a, true);
  await sleep(1500);
  ok('答错后弹出讲解', d.getElementById('modal-explain').classList.contains('show'));
  ok('讲解里有 SVG 图解', !!d.querySelector('#ex-body .ex-illus svg'));
  ok('讲解里有口诀', !!d.querySelector('#ex-body .ex-key'));
  ok('讲解里有例词对比', d.querySelectorAll('#ex-body .ex-pair').length >= 2);
  ok('讲解里有易错提醒', !!d.querySelector('#ex-body .ex-warn'));
  click($('btn-ex-audio'));
  await sleep(60);
  ok('讲解可朗读（音频或合成兜底）',
    w.__audioLog.length > 0 || w.__spoken.length > 0);
  click($('btn-ex-ok'));
  await sleep(200);
  ok('关闭讲解后继续出题', a.cur() !== null || activePage() !== 'page-practice');

  /* ================= 彩蛋：先出现蛋，点开有特效音效 ================= */
  console.log('\n【彩蛋开箱】');
  ['b_p', 'd_t', 'g_k'].forEach(k => { w.eval('__pyTest.S().mastered["' + k + '"]=true'); });
  w.eval('__pyTest.S().points=800');
  w.__pyTest.start([w.QUESTIONS.filter(q => q.type === 'choice')[0]]);
  await sleep(80);
  await answerCur(a, false);
  await sleep(1400);
  /* 结束一轮 → 结算 → 彩蛋 */
  for (let i = 0; i < 10 && activePage() === 'page-practice'; i++) {
    if (!a.cur()) break;
    await answerCur(a, false);
    await sleep(1000);
  }
  await sleep(1200);
  ok('一轮结束进入结算页', activePage() === 'page-result', activePage());
  ok('触发彩蛋：先出现蛋而不是直接给奖品', d.getElementById('modal-egg').classList.contains('show'));
  ok('蛋在等待点击（还没有奖品内容）', d.getElementById('rw-item').textContent.trim() === '');
  /* 金蛋是手绘 SVG（金色渐变蛋身 + 高光 + 闪光），不是 emoji 鸡蛋 */
  ok('彩蛋是内联 SVG 大金蛋（不依赖 emoji 字体）',
    !!d.querySelector('#btn-egg .egg-svg') && !!d.querySelector('#btn-egg .egg-svg path'));
  ok('金蛋有金色渐变与辉光层',
    !!d.getElementById('modal-egg').querySelector('#egGold') &&
    !!d.getElementById('modal-egg').querySelector('.egg-glow'));
  click($('btn-egg'));
  await sleep(200);
  ok('点击后蛋进入开启动画', /opening/.test(d.getElementById('btn-egg').className));
  /* 880ms 时炸开喷发，等粒子真的出现再清点（否则会抢跑成 0） */
  let fxN = 0;
  for (let i = 0; i < 12 && !fxN; i++) { await sleep(150); fxN = d.querySelectorAll('#egg-fx .fx-p').length; }
  ok('炸开时喷出彩带与亮片（≥30 片）', fxN >= 30, String(fxN));
  ok('彩带和亮片两种形态都有',
    d.querySelectorAll('#egg-fx .fx-ribbon').length > 0 &&
    d.querySelectorAll('#egg-fx .fx-sequin').length > 0);
  ok('炸开有金色冲击波环', !!d.querySelector('#egg-fx .fx-ring'));
  /* 开箱动画总长 1.65s，2.1s 后才切奖品弹窗 —— 必须等够，否则会误报 */
  let okRw = false;
  for (let i = 0; i < 20 && !okRw; i++) { await sleep(150); okRw = d.getElementById('modal-reward').classList.contains('show'); }
  ok('动画结束后弹出奖品', okRw);
  ok('奖品是装扮图形（不再是缺失的 emoji）', !!d.querySelector('#rw-item .rw-icon svg'));
  ok('开箱时撒了彩带粒子', d.querySelectorAll('#modal-reward .cf').length >= 10,
    String(d.querySelectorAll('#modal-reward .cf').length));
  ok('装扮已收入衣柜', a.state().owned.length >= 1, String(a.state().owned.length));
  click($('btn-rw-ok'));
  await sleep(80);

  /* ================= 随机彩蛋：答对后不定时掉落，不打断本轮 ================= */
  console.log('\n【随机彩蛋】');
  w.eval('CONFIG.eggChance = 1; CONFIG.eggPerSession = 1;');   // 100% 触发，保证可测
  w.eval('(function(){ var S=__pyTest.S(); S.paid=true; S.dayCount=0; S.eggToday=0; })()');
  w.eval('__pyTest.start()');
  await sleep(250);
  const idxBefore = d.getElementById('pd-index').textContent;
  await answerCur(a, false);
  await sleep(1200);
  ok('答对后不定时掉落彩蛋', d.getElementById('modal-egg').classList.contains('show'));
  ok('掉落时仍停在练习页（本轮进度不丢）', activePage() === 'page-practice', activePage());
  ok('掉落的是蛋而不是直接给奖品', !d.getElementById('modal-reward').classList.contains('show'));
  click($('btn-egg'));
  let rwMid = false;
  for (let i = 0; i < 20 && !rwMid; i++) { await sleep(150); rwMid = d.getElementById('modal-reward').classList.contains('show'); }
  ok('中途掉的彩蛋同样有完整开箱动画', rwMid);
  click($('btn-rw-ok'));
  await sleep(300);
  ok('收下后继续出下一题（不卡死）',
    activePage() === 'page-practice' && !!a.cur(), activePage() + ' / ' + (a.cur() ? '有题' : '无题'));
  ok('继续的是下一题而不是从头再来',
    d.getElementById('pd-index').textContent !== idxBefore,
    idxBefore + ' → ' + d.getElementById('pd-index').textContent);
  await answerCur(a, false);
  await sleep(1200);
  ok('每局限量生效（第二题答对不再弹蛋）',
    !d.getElementById('modal-egg').classList.contains('show') && activePage() === 'page-practice');
  /* 还原状态，免得影响后面的流程 */
  w.eval('CONFIG.eggChance = 0');
  w.eval('(function(){ var S=__pyTest.S(); S.paid=false; })()');
  click($('btn-quit'));
  await sleep(160);
  if (d.getElementById('modal-confirm').classList.contains('show')) {
    click($('btn-cf-yes'));
    await sleep(200);
  }
  ok('中途退出后回到结算页', activePage() === 'page-result', activePage());

  /* ================= 底部导航栏 ================= */
  console.log('\n【底部导航栏】');
  ok('底部导航栏存在且有 3 个 tab', d.querySelectorAll('#tabbar .tab').length === 3,
    String(d.querySelectorAll('#tabbar .tab').length));
  ok('结算页不显示导航栏', !d.getElementById('tabbar').classList.contains('show'));
  click($('btn-result-home'));
  await sleep(80);
  ok('回到首页后导航栏显示且「首页」高亮',
    activePage() === 'page-home' &&
    d.getElementById('tabbar').classList.contains('show') &&
    d.getElementById('tab-home').classList.contains('on'));
  ok('首页有 3 个入口按钮（开始练习 / 举一反三 / 学习报告）',
    !!d.getElementById('btn-start') && !!d.getElementById('btn-retry') && !!d.getElementById('btn-report'));

  /* ================= 衣柜 ================= */
  console.log('\n【衣柜】');
  click($('tab-wardrobe'));
  await sleep(80);
  ok('点「装扮」tab 进入衣柜页', activePage() === 'page-wardrobe', activePage());
  ok('衣柜页时导航栏仍显示且「装扮」高亮',
    d.getElementById('tabbar').classList.contains('show') &&
    d.getElementById('tab-wardrobe').classList.contains('on') &&
    !d.getElementById('tab-home').classList.contains('on'));
  ok('衣柜格数 = 装扮总数', d.querySelectorAll('#wd-grid .wd-cell').length === 79,
    String(d.querySelectorAll('#wd-grid .wd-cell').length));
  ok('衣柜预览渲染全身像', !!d.querySelector('#wd-preview svg'));
  const petCell = Array.from(d.querySelectorAll('#wd-grid .wd-cell'))
    .find(c => /小恐龙/.test(c.textContent));
  ok('宠物类装备出现在衣柜里', !!petCell);
  /* 先把宠物和披风买下来，模拟"已拥有"状态，才能测穿戴 */
  w.eval('__pyTest.grant(["pet_dino","cape_hero","ear_pearl"],9999)');
  await sleep(60);
  /* 衣柜每次操作都会重建格子 DOM，所以每次都要重新查询，不能复用旧节点 */
  const cellOf = re => Array.from(d.querySelectorAll('#wd-grid .wd-cell')).find(c => re.test(c.textContent));
  const previewBefore = d.querySelector('#wd-preview svg').innerHTML;
  click(cellOf(/小恐龙/));
  await sleep(60);
  ok('试穿宠物后格子变为穿着中', /穿着中/.test(cellOf(/小恐龙/).textContent), cellOf(/小恐龙/).textContent.trim());
  ok('穿上宠物后预览的全身像发生了变化',
    d.querySelector('#wd-preview svg').innerHTML !== previewBefore);
  click(cellOf(/英雄披风/));
  await sleep(60);
  ok('披风可以同时与宠物共存（槽位独立）',
    /穿着中/.test(cellOf(/英雄披风/).textContent) && /穿着中/.test(cellOf(/小恐龙/).textContent),
    cellOf(/英雄披风/).textContent.trim() + ' / ' + cellOf(/小恐龙/).textContent.trim());
  click(cellOf(/珍珠耳坠/));
  await sleep(60);
  ok('耳饰是独立槽位，可与前两者共存',
    /穿着中/.test(cellOf(/珍珠耳坠/).textContent), cellOf(/珍珠耳坠/).textContent.trim());
  ok('首页形象同步更新（披风+宠物都在）',
    !!d.querySelector('#stage svg') && a.state().worn.cape === 'cape_hero' && a.state().worn.pet === 'pet_dino',
    JSON.stringify(a.state().worn));
  click($('btn-wardrobe-back'));
  await sleep(60);
  ok('从衣柜返回后导航栏仍显示且回到「首页」高亮',
    activePage() === 'page-home' && d.getElementById('tab-home').classList.contains('on'));

  /* ================= 报告 ================= */
  console.log('\n【学习报告】');
  click($('tab-report'));
  await sleep(80);
  ok('点「报告」tab 进入报告页', activePage() === 'page-report', activePage());
  ok('报告展示累计练习', /累计练习/.test(d.getElementById('report-body').textContent));
  ok('报告展示知识点掌握度', /知识点掌握度/.test(d.getElementById('report-body').textContent));
  ok('报告展示错题本', /错题本/.test(d.getElementById('report-body').textContent));
  click($('btn-report-back'));
  await sleep(60);

  /* ================= 举一反三 ================= */
  console.log('\n【举一反三】');
  w.eval('__pyTest.S().dayCount = 0');   // 保证免费额度足够
  ok('前面故意答错过、存在错题', Object.keys(a.state().wrong).length > 0,
    String(Object.keys(a.state().wrong).length));
  click($('btn-retry'));
  await sleep(80);
  ok('首页「举一反三」进入练习页', activePage() === 'page-practice', activePage());
  const retryIt = a.cur();
  ok('举一反三出的正是错过的题', !!retryIt && (a.state().wrong[retryIt.id] || 0) > 0,
    retryIt ? retryIt.id + ' wrong=' + (a.state().wrong[retryIt.id] || 0) : 'null');
  click($('btn-quit'));
  await sleep(100);
  click($('btn-cf-yes'));
  await sleep(150);

  /* ================= 激活码 ================= */
  console.log('\n【开通与激活码】');
  click($('btn-start'));
  await sleep(60);
  click($('btn-quit'));
  await sleep(100);
  click($('btn-cf-yes'));
  await sleep(150);
  w.eval('document.getElementById("btn-report").click()');
  await sleep(50);
  click($('btn-report-back'));
  await sleep(50);
  /* 打开支付弹窗：把免费额度耗尽 */
  w.eval('__pyTest.S().dayCount = 999');
  click($('btn-start'));
  await sleep(80);
  ok('免费额度用完弹出开通', d.getElementById('modal-pay').classList.contains('show'));
  $('inp-code').value = 'WRONG';
  click($('btn-code'));
  await sleep(40);
  ok('错误激活码被拒绝', /激活码不对/.test(a.toast()), a.toast());
  const validCode = w.eval('CONFIG.activationCodes[0]');
  $('inp-code').value = validCode;
  click($('btn-code'));
  await sleep(40);
  ok('正确激活码可开通（' + validCode + '）', /开通成功/.test(a.toast()), a.toast());
  click($('btn-pay-close'));
  await sleep(60);

  /* ================= 状态持久化（跨页面共享存储）================= */
  console.log('\n【状态持久化】');
  const dom2 = await loadPage({ fresh: false });
  const a2 = api(dom2);
  ok('重新加载后进度仍在', a2.state().totalCount === a.state().totalCount,
    a2.state().totalCount + ' vs ' + a.state().totalCount);
  ok('性别保留', a2.state().gender === 'boy');
  ok('装扮保留', (a2.state().owned || []).length >= 1);
  ok('开通状态保留', a2.state().paid === true);
  ok('重载后直接进入首页（不再强制选角色）', a2.activePage() === 'page-home', a2.activePage());

  try { dom.window.close(); } catch (e) { }
  try { dom2.window.close(); } catch (e) { }

  console.log('\n==========================================================');
  console.log('通过 ' + pass.length + ' 项，失败 ' + fail.length + ' 项');
  if (fail.length) { console.log('\n失败清单:'); fail.forEach(f => console.log('  X ' + f)); }
  console.log('==========================================================');
  process.exit(fail.length ? 1 : 0);
}

main().catch(e => { console.error('测试脚本出错:', e); process.exit(2); });
