/* =========================================================
   拼音小达人 — 主逻辑
   零 API 成本：所有内容预置，语音走「预生成音频 → 浏览器合成」两级降级
   ========================================================= */
(function () {
  'use strict';

  /* ============ 常量 ============ */
  var LS_KEY = 'pinyin_daren_v3';   // v3：槽位扩到 13 个、题库加题型，旧进度不迁移
  var SLOTS = ['hat', 'eyes', 'ear', 'neck', 'wrist', 'top', 'cape', 'bottom', 'shoes', 'back', 'hand', 'pet', 'vehicle'];
  var PURCHASE_EGG_EVERY = 3;   // 每掌握 3 个知识点触发一次彩蛋
  var DAY_EGG_EVERY = 3;        // 连续练习满 3 天触发一次彩蛋

  /* ============ 状态 ============ */
  function freshState() {
    return {
      v: 2,
      gender: '',       // 'boy' | 'girl'，首次进入时选择
      points: 0,
      paid: false,
      answered: {},     // qid -> 累计作答次数
      wrong: {},        // qid -> 错误次数
      rightStreak: {},  // qid -> 连续答对次数
      wrongTime: {},    // qid -> 最近答错时间
      mastered: {},     // kid -> true
      owned: [],        // 已拥有的装扮 id
      worn: {},         // slot -> outfit id
      day: '',
      dayCount: 0,
      dayCorrect: 0,
      totalCount: 0,
      totalCorrect: 0,
      playDays: [],
      eggGot: {},       // 彩蛋领取记录（防重复）
      rounds: 0
    };
  }
  var S = freshState();

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      var base = freshState();
      for (var k in base) { if (k in o) base[k] = o[k]; }
      S = base;
    } catch (e) { S = freshState(); }
  }

  /* ============ 小工具 ============ */
  function $(id) { return document.getElementById(id); }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function pickOne(a) { return a[rnd(a.length)]; }
  function kpOf(kid) { return KP_MAP[kid] || { name: kid, tag: kid }; }
  function masteredCount() {
    var c = 0; for (var k in S.mastered) { if (S.mastered[k]) c++; } return c;
  }

  var toastTimer = null;
  function toast(msg, ms) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 1800);
  }

  function confirmBox(title, text) {
    return new Promise(function (resolve) {
      $('cf-title').textContent = title;
      $('cf-text').textContent = text;
      showModal('modal-confirm');
      $('btn-cf-yes').onclick = function () { hideModal('modal-confirm'); resolve(true); };
      $('btn-cf-no').onclick = function () { hideModal('modal-confirm'); resolve(false); };
    });
  }
  function showModal(id) { $(id).classList.add('show'); }
  function hideModal(id) { $(id).classList.remove('show'); }

  function showPage(id) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
    $(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  /* ============ 语音（两级降级，零成本） ============ */
  var audioFail = 0;              // 连续失败计数，连续 2 次才永久降级到浏览器合成
  function speak(text) {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'zh-CN';
      u.rate = 0.82;
      u.pitch = 1.05;
      var zh = null, vs = window.speechSynthesis.getVoices() || [];
      for (var i = 0; i < vs.length; i++) {
        if (/zh|Chinese|中文|普通话/i.test(vs[i].lang + vs[i].name)) { zh = vs[i]; break; }
      }
      if (zh) u.voice = zh;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function playAudioFile(path) {
    return new Promise(function (resolve, reject) {
      if (audioFail >= 2) return reject(new Error('downgraded'));
      var a = new Audio(path);
      var done = false;
      a.onended = function () { if (!done) { done = true; resolve(true); } };
      a.onerror = function () { if (!done) { done = true; reject(new Error('audio not found')); } };
      var p = a.play();
      if (p && p.catch) p.catch(function (e) { if (!done) { done = true; reject(e); } });
    });
  }
  function playOrSpeak(path, text) {
    playAudioFile(path).then(function () {
      audioFail = 0;
    }).catch(function () {
      audioFail++;
      if (!speak(text)) toast('这个浏览器不支持朗读，请换一个试试');
    });
  }
  function playQuestion(q) {
    if (q.noAudio) { toast('这道题不用听哦，直接选吧'); return; }
    playOrSpeak(CONFIG.audioBase + 'q/' + questionAudioId(q) + '.mp3', q.content);
  }
  function playExplain(kid) {
    var t = explainSpeech(kid);   // 朗读稿定义在 data.js，与语音生成脚本共用
    if (!t) return;
    playOrSpeak(CONFIG.audioBase + 'e/' + kid + '.mp3', t);
  }

  /* ============ 日期 / 连续天数 ============ */
  function rollDay() {
    var t = today();
    if (S.day === t) return false;
    S.day = t;
    S.dayCount = 0;
    S.dayCorrect = 0;
    if (S.playDays.indexOf(t) < 0) S.playDays.push(t);
    if (S.playDays.length > 400) S.playDays = S.playDays.slice(-400);
    save();
    return true;
  }
  function consecutiveDays() {
    if (!S.playDays.length) return 0;
    var set = {}, i;
    for (i = 0; i < S.playDays.length; i++) set[S.playDays[i]] = 1;
    var d = new Date(), n = 0;
    for (i = 0; i < 400; i++) {
      var key = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      if (set[key]) { n++; d.setDate(d.getDate() - 1); }
      else { break; }
    }
    return n;
  }

  /* ============ 首页 ============ */
  function renderStage() {
    var box = $('stage');
    if (box) box.innerHTML = Avatar.svg(S.gender || 'boy', S.worn, { cls: 'avatar-svg' });
    var row = $('worn-row');
    row.innerHTML = '';
    var names = [];
    SLOTS.forEach(function (s) {
      var oid = S.worn[s];
      if (oid && OUTFIT_MAP[oid]) names.push(OUTFIT_MAP[oid].name);
    });
    if (!names.length) {
      row.innerHTML = '<div class="worn-chip">穿着白 T 恤和短裤，去衣柜换新装扮吧～</div>';
    } else {
      names.forEach(function (n) {
        var d = document.createElement('div');
        d.className = 'worn-chip';
        d.textContent = n;
        row.appendChild(d);
      });
    }
  }

  function renderHome() {
    rollDay();
    $('hd-points').textContent = S.points;
    $('hd-mastered').textContent = masteredCount();
    var mt = $('hd-mastered-total');
    if (mt) mt.textContent = KNOWLEDGE_POINTS.length;
    renderStage();

    var tip = $('free-tip');
    if (S.paid) {
      tip.innerHTML = '👑 已开通完整版，今天已练 <b>' + S.dayCount + '</b> 题';
    } else {
      var left = Math.max(0, CONFIG.freeDailyLimit - S.dayCount);
      tip.innerHTML = '免费版每天 ' + CONFIG.freeDailyLimit + ' 题，今天还剩 <b>' + left + '</b> 题';
    }
  }

  /* ============ 抽题算法（智能 + 零成本） ============ */
  function buildPriorityList() {
    var tA = [], tB = [], tC = [], i, q;
    for (i = 0; i < QUESTIONS.length; i++) {
      q = QUESTIONS[i];
      var answered = S.answered[q.id] || 0;
      var wrong = S.wrong[q.id] || 0;
      if (wrong > 0 && !S.mastered[q.knowledge]) tA.push(q);        // 1. 错过的题（且知识点未掌握）
      else if (answered === 0) tB.push(q);                          // 2. 没做过的题
      else tC.push(q);                                              // 3. 复习题
    }
    // 错的越多的越靠前
    shuffle(tA);
    tA.sort(function (a, b) { return (S.wrong[b.id] || 0) - (S.wrong[a.id] || 0); });
    shuffle(tB);
    // 复习题：优先答对次数少的
    shuffle(tC);
    tC.sort(function (a, b) { return (S.rightStreak[a.id] || 0) - (S.rightStreak[b.id] || 0); });
    return tA.concat(tB, tC);
  }

  function pickQueue(n) {
    var order = buildPriorityList();
    var chosen = [], lastK = null, i, q, used = {};
    // 第一轮：避免连续两道同知识点
    for (i = 0; i < order.length && chosen.length < n; i++) {
      q = order[i];
      if (q.knowledge === lastK) continue;
      if (used[q.id]) continue;
      used[q.id] = 1; chosen.push(q); lastK = q.knowledge;
    }
    // 第二轮：补足
    for (i = 0; i < order.length && chosen.length < n; i++) {
      q = order[i];
      if (used[q.id]) continue;
      used[q.id] = 1; chosen.push(q);
    }
    return chosen;
  }

  function toItem(q) {
    var it = {
      src: q, id: q.id, type: q.type || 'choice', knowledge: q.knowledge,
      content: q.content, why: q.why, audioId: q.audioId,
      hideWord: q.hideWord, noAudio: q.noAudio, display: q.display
    };

    if (it.type === 'match') {
      it.pairs = q.pairs.map(function (p) { return { c: p[0], p: p[1] }; });
    } else if (it.type === 'spell') {
      it.target = q.tiles.slice();
      it.tiles = shuffle(q.tiles.concat(q.extraTiles).slice());
    } else if (it.type === 'judge') {
      it.judgePinyin = q.judgePinyin;
      it.judgeOk = q.judgeOk;
    } else {
      /* choice / listen / fill：打乱选项顺序并重算答案下标 */
      var idx = [];
      for (var i = 0; i < q.options.length; i++) idx.push(i);
      shuffle(idx);
      var opts = [], ans = 0;
      for (var j = 0; j < idx.length; j++) {
        opts.push(q.options[idx[j]]);
        if (idx[j] === q.answer) ans = j;
      }
      it.opts = opts;
      it.ans = ans;
    }
    return it;
  }

  /* ============ 练习会话 ============ */
  var SS = null;   // 当前会话

  function sessionQuota() {
    if (S.paid) return CONFIG.sessionLength;
    return Math.max(0, Math.min(CONFIG.sessionLength, CONFIG.freeDailyLimit - S.dayCount));
  }

  function startPractice(customList) {
    rollDay();
    var quota = sessionQuota();
    if (quota <= 0) {
      openPay();
      toast('今天的免费练习已经用完啦');
      return;
    }
    var list = customList || pickQueue(quota);
    if (!list.length) { toast('题库为空'); return; }
    if (list.length > quota) list = list.slice(0, quota);

    SS = {
      queue: list.map(toItem),
      i: 0,
      answered: 0,
      correct: 0,
      gain: 0,
      streak: 0,
      best: 0,
      len: list.length,
      locked: false,
      retestIds: {},
      justMastered: [],
      pendingRewards: []
    };
    showPage('page-practice');
    renderQuestion();
  }

  function renderQuestion() {
    var it = SS.queue[SS.i];
    if (!it) return endPractice();
    SS.locked = false;

    $('pd-index').textContent = Math.min(SS.answered + 1, SS.len);
    $('pd-total').textContent = SS.len;
    $('pd-streak').textContent = SS.streak;
    $('pd-bar').style.width = Math.round(SS.answered / SS.len * 100) + '%';
    $('pd-tag').textContent = kpOf(it.knowledge).tag;

    $('pd-feedback').textContent = '';
    $('pd-feedback').className = 'feedback';

    var w = $('pd-word');
    var card = $('q-card');
    var box = $('pd-options');
    box.innerHTML = '';
    box.className = 'options';
    card.classList.remove('q-listen');

    /* ---- 按题型渲染 ---- */
    var hint = $('q-hint');
    if (it.type === 'listen') {
      card.classList.add('q-listen');
      w.className = 'q-word q-word-audio';
      w.textContent = '🔊';
      w.onclick = function () { playQuestion(it); };
      hint.textContent = '点上面的喇叭再听一遍，选出正确的拼音';
    } else if (it.type === 'fill') {
      w.onclick = null;
      w.className = 'q-word';
      w.textContent = it.content;
      hint.textContent = '补完整：' + String(it.display).replace('▢', '（　）');
    } else if (it.type === 'classify') {
      /* v4：音节归类题 —— 给一个字，判断它的音节是不是整体认读 */
      w.onclick = function () { playQuestion(it); };
      w.className = 'q-word';
      w.textContent = it.content;
      hint.textContent = '点一下字可以听读音，再判断它的音节';
    } else {
      w.onclick = null;
      w.className = 'q-word' + (it.content.length > 1 ? ' long' : '');
      w.textContent = it.content;
      hint.textContent = '听不清？点左边按钮再听一遍';
    }

    if (it.type === 'judge') { hint.textContent = '看看它标的读音对不对'; return renderJudge(it); }
    if (it.type === 'match') { hint.textContent = '把字和它的读音连起来'; return renderMatch(it); }
    if (it.type === 'spell') { hint.textContent = '按顺序点字母块，拼出正确读音'; return renderSpell(it); }
    renderOptions(it);
  }

  /* choice / listen / fill 共用：选项网格 */
  function renderOptions(it) {
    var box = $('pd-options');
    if (it.type === 'fill') box.className = 'options options-fill';
    it.opts.forEach(function (txt, i) {
      var b = document.createElement('button');
      b.className = 'opt' + (it.type === 'fill' ? ' opt-fill' : '');
      if (it.type === 'fill') {
        /* 把候选块直接填进 ▢，按钮上显示的就是「填好之后的完整拼音」，
           比「p▢ + í」这种拆开显示直观得多 */
        b.innerHTML = '<span class="opt-val">' + esc(String(it.display).replace('▢', txt)) + '</span>';
      } else {
        b.innerHTML = '<span class="opt-val">' + esc(txt) + '</span>';
      }
      b.onclick = function () { onPick(i, b); };
      box.appendChild(b);
    });
    if (it.type === 'fill') {
      var hint = document.createElement('div');
      hint.className = 'fill-hint';
      hint.textContent = '选一个，把拼音补完整';
      box.appendChild(hint);
    }
  }

  /* judge 判断对错 */
  function renderJudge(it) {
    var box = $('pd-options');
    box.className = 'options options-judge';
    var card = document.createElement('div');
    card.className = 'judge-card';
    card.innerHTML = '<div class="judge-word">' + esc(it.content) + '</div>' +
      '<div class="judge-py">' + esc(it.judgePinyin) + '</div>' +
      '<div class="judge-ask">这样读，对吗？</div>';
    box.appendChild(card);
    var row = document.createElement('div');
    row.className = 'judge-row';
    [['✓ 读对了', true], ['✗ 读错了', false]].forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'opt judge-btn';
      b.textContent = p[0];
      b.onclick = function () { onJudge(p[1] === it.judgeOk, b); };
      row.appendChild(b);
    });
    box.appendChild(row);
  }

  /* match 连线配对 */
  function renderMatch(it) {
    var box = $('pd-options');
    box.className = 'options options-match';
    var hint = document.createElement('div');
    hint.className = 'match-hint';
    hint.textContent = '点一个字，再点它的读音，把它们连起来';
    box.appendChild(hint);

    var wrap = document.createElement('div');
    wrap.className = 'match-wrap';

    var left = document.createElement('div');
    left.className = 'match-col';
    var right = document.createElement('div');
    right.className = 'match-col';

    var rights = shuffle(it.pairs.map(function (p, i) { return { p: p.p, i: i }; }));
    it.pairs.forEach(function (p, i) {
      var a = document.createElement('button');
      a.className = 'match-cell';
      a.innerHTML = '<span class="mc-main">' + esc(p.c) + '</span>';
      a.onclick = function () { matchPick('L', i, a); };
      left.appendChild(a);
    });
    rights.forEach(function (r) {
      var b = document.createElement('button');
      b.className = 'match-cell';
      b.innerHTML = '<span class="mc-main py">' + esc(r.p) + '</span>';
      b.onclick = function () { matchPick('R', r.i, b); };
      right.appendChild(b);
    });

    wrap.appendChild(left);
    wrap.appendChild(right);
    box.appendChild(wrap);

    SS.match = { picked: null, done: 0, mistakes: 0, left: left.children, right: right.children, it: it };
  }

  var matchSel = null;   // {side, idx, el}
  function matchPick(side, idx, el) {
    var M = SS.match;
    if (!M || SS.locked) return;
    if (el.classList.contains('done')) return;

    if (!matchSel) { matchSel = { side: side, idx: idx, el: el }; el.classList.add('picked'); return; }
    if (matchSel.side === side) {
      matchSel.el.classList.remove('picked');
      if (matchSel.el === el) { matchSel = null; return; }
      matchSel = { side: side, idx: idx, el: el };
      el.classList.add('picked');
      return;
    }

    var li = side === 'L' ? idx : matchSel.idx;
    var ri = side === 'R' ? idx : matchSel.idx;
    matchSel.el.classList.remove('picked');
    matchSel = null;

    var ok = M.it.pairs[li].p === M.it.pairs[ri].p;
    if (ok) {
      M.done++;
      var le = M.left[li], re = M.right[ri];
      /* right 列的顺序被打乱过，找到真正对应的那一格 */
      re = null;
      for (var k = 0; k < M.right.length; k++) {
        if (!M.right[k].classList.contains('done') &&
            M.right[k].textContent === M.it.pairs[li].p) { re = M.right[k]; break; }
      }
      le.classList.add('done'); if (re) re.classList.add('done');
      beep('good');
      if (M.done >= M.it.pairs.length) {
        onMatchDone();
      }
    } else {
      M.mistakes++;
      el.classList.add('shake');
      beep('bad');
      setTimeout(function () { el.classList.remove('shake'); }, 420);
    }
  }

  function onMatchDone() {
    var M = SS.match;
    SS.match = null;
    settle(M.mistakes === 0, { unit: '全连对' });
  }

  /* spell 拼读积木 */
  function renderSpell(it) {
    var box = $('pd-options');
    box.className = 'options options-spell';
    var hint = document.createElement('div');
    hint.className = 'spell-hint';
    hint.innerHTML = '按顺序点字母块，拼出「' + esc(it.content) + '」的读音';
    box.appendChild(hint);

    var slot = document.createElement('div');
    slot.className = 'spell-slot';
    slot.id = 'spell-slot';
    box.appendChild(slot);

    var row = document.createElement('div');
    row.className = 'spell-row';
    it.tiles.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'tile';
      b.textContent = t;
      b.onclick = function () { spellPick(i, b); };
      row.appendChild(b);
    });
    box.appendChild(row);

    SS.spell = { picked: [], row: row, slot: slot, it: it };
    renderSpellSlot();
  }

  function renderSpellSlot() {
    var sp = SS.spell;
    var html = '';
    for (var i = 0; i < sp.it.target.length; i++) {
      html += '<span class="ss-cell' + (sp.picked[i] !== undefined ? ' filled' : '') + '">' +
        (sp.picked[i] !== undefined ? esc(sp.it.target[i]) : '&nbsp;') + '</span>';
    }
    sp.slot.innerHTML = html;
  }

  function spellPick(tileIdx, btn) {
    var sp = SS.spell;
    if (!sp || SS.locked || btn.classList.contains('used')) return;
    var need = sp.it.target.length;
    if (sp.picked.length >= need) return;

    sp.picked.push(sp.it.tiles[tileIdx]);
    btn.classList.add('used');
    renderSpellSlot();
    beep('tap');

    if (sp.picked.length >= need) {
      var ok = true;
      for (var i = 0; i < need; i++) {
        if (sp.picked[i] !== sp.it.target[i]) { ok = false; break; }
      }
      SS.spell = null;
      setTimeout(function () { settle(ok, { unit: '拼读' }); }, 260);
    }
  }

  /* choice / listen / fill 选项点击 */
  function onPick(i, btn) {
    if (!SS || SS.locked) return;
    var it = SS.queue[SS.i];
    onJudge(i === it.ans, btn, it);
  }
  function onJudge(ok, btn, itOverride) {
    if (!SS || SS.locked) return;
    var it = itOverride || SS.queue[SS.i];
    settle(ok, { btn: btn, it: it });
  }

  /* ---------- 统一判分 ---------- */
  function settle(ok, opt) {
    opt = opt || {};
    if (!SS || SS.locked) return;
    SS.locked = true;
    var it = opt.it || SS.queue[SS.i];
    var j;

    SS.answered++;
    S.totalCount++;
    S.answered[it.id] = (S.answered[it.id] || 0) + 1;
    S.dayCount++;

    if (ok) {
      SS.correct++;
      S.totalCorrect++;
      S.dayCorrect++;
      S.rightStreak[it.id] = (S.rightStreak[it.id] || 0) + 1;
      SS.streak++;
      if (SS.streak > SS.best) SS.best = SS.streak;

      var gain = 10, bonus = 0;
      if (SS.streak % 5 === 0) bonus += 20;
      if (SS.retestIds[it.id]) { bonus += 15; delete SS.retestIds[it.id]; }
      if (it.type && it.type !== 'choice') bonus += 5;   // 新题型稍微多给一点
      gain += bonus;
      S.points += gain;
      SS.gain += gain;

      if (opt.btn) {
        opt.btn.classList.add('correct');
        var sibs = opt.btn.parentNode.parentNode.querySelectorAll('.opt');
        for (j = 0; j < sibs.length; j++) sibs[j].classList.add('locked');
      }

      var fb = $('pd-feedback');
      fb.className = 'feedback good';
      if (SS.streak % 5 === 0 && SS.streak > 0) fb.textContent = '连对 ' + SS.streak + ' 题！额外 +' + bonus + ' 分 🎊';
      else if (SS.retestIds && bonus >= 15) fb.textContent = '看完讲解答对啦！+' + gain + ' 分 💪';
      else fb.textContent = '答对啦！+' + gain + ' 分 ⭐';

      checkMastery(it.knowledge);
      save();
      beep('good');
      setTimeout(advance, 780);
    } else {
      SS.streak = 0;
      S.wrong[it.id] = (S.wrong[it.id] || 0) + 1;
      S.wrongTime[it.id] = Date.now();
      S.rightStreak[it.id] = 0;

      if (opt.btn) {
        opt.btn.classList.add('wrong');
        var sibs2 = opt.btn.parentNode.parentNode.querySelectorAll('.opt');
        for (j = 0; j < sibs2.length; j++) {
          sibs2[j].classList.add('locked');
          if (it.opts && j === it.ans) sibs2[j].classList.add('correct');
        }
      } else if (it.opts) {
        var os = $('pd-options').querySelectorAll('.opt');
        for (j = 0; j < os.length; j++) {
          os[j].classList.add('locked');
          if (j === it.ans) os[j].classList.add('correct');
        }
      }
      var f2 = $('pd-feedback');
      f2.className = 'feedback bad';
      f2.textContent = '没关系，我们一起来看看～';
      save();
      beep('bad');
      setTimeout(function () { showExplain(it.knowledge, it); }, 1050);
    }
  }

  /* 讲解弹窗（图 + 口诀 + 例词 + 提醒）→ 关闭后插入「举一反三」+ 原题重测 */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function showExplain(kid, it) {
    var ex = EXPLANATIONS[kid];
    var kp = KP_MAP[kid] || {};
    $('ex-title').textContent = ex ? ex.title : (kp.name || kid);
    $('ex-tag').textContent = kp.tag ? '考：' + kp.tag : '';

    var box = $('ex-body');
    box.innerHTML = '';
    if (ex) {
      var svg = renderIllustration(ex.illus);
      if (svg) {
        var d = document.createElement('div');
        d.className = 'ex-illus';
        d.innerHTML = svg;
        box.appendChild(d);
      }
      if (ex.one) {
        var o = document.createElement('div');
        o.className = 'ex-one';
        o.textContent = ex.one;
        box.appendChild(o);
      }
      if (ex.key) {
        var k = document.createElement('div');
        k.className = 'ex-key';
        k.innerHTML = '<span class="ex-key-badge">口诀</span><span>' + esc(ex.key) + '</span>';
        box.appendChild(k);
      }
      if (ex.pairs && ex.pairs.length) {
        var pr = document.createElement('div');
        pr.className = 'ex-pairs';
        ex.pairs.forEach(function (p) {
          var c = document.createElement('div');
          c.className = 'ex-pair';
          c.innerHTML = '<b>' + esc(p[0]) + '</b><span>' + esc(p[1]) + '</span>';
          pr.appendChild(c);
        });
        box.appendChild(pr);
      }
      if (ex.warn) {
        var w = document.createElement('div');
        w.className = 'ex-warn';
        w.innerHTML = '<span class="ex-warn-ico">⚠️</span><span>' + esc(ex.warn) + '</span>';
        box.appendChild(w);
      }
    }

    $('btn-ex-audio').onclick = function () { playExplain(kid); };
    $('btn-ex-ok').onclick = function () {
      hideModal('modal-explain');
      if (it) insertFollowUp(it);
      advance();
    };
    showModal('modal-explain');
  }

  function insertFollowUp(it) {
    // 1) 同类知识点：插一道「举一反三」到当前题后面
    var cands = QUESTIONS.filter(function (q) {
      return q.knowledge === it.knowledge && q.id !== it.id;
    });
    var fresh = cands.filter(function (q) { return !S.answered[q.id]; });
    var pool = fresh.length ? fresh : cands;
    if (pool.length) {
      var chosen = shuffle(pool.slice())[0];
      // 避免会话里重复插入同一题
      var dup = SS.queue.some(function (x) { return x.id === chosen.id; });
      if (!dup) {
        SS.queue.splice(SS.i + 1, 0, toItem(chosen));
        return;   // 先练同类题，原题排到本会话最后重测
      }
    }
    // 2) 没有同类题就直接把原题放到最后重测
    retest(it);
  }

  function retest(it) {
    SS.retestIds[it.id] = 1;
    SS.queue.push(toItem(it.src));
  }

  function advance() {
    if (!SS) return;
    SS.i++;
    if (SS.answered >= SS.len || SS.i >= SS.queue.length) return endPractice();
    renderQuestion();
  }

  /* ============ 掌握判定 ============ */
  function checkMastery(kid) {
    if (S.mastered[kid]) return;
    var qs = QUESTIONS.filter(function (q) { return q.knowledge === kid; });
    var tried = 0, solid = 0;
    qs.forEach(function (q) {
      if ((S.answered[q.id] || 0) > 0) {
        tried++;
        if ((S.rightStreak[q.id] || 0) >= 2) solid++;
      }
    });
    if (tried >= 4 && solid >= 3) {
      S.mastered[kid] = true;
      S.points += 50;
      SS && SS.gain !== undefined && (SS.gain += 50);
      SS && SS.justMastered.push(kid);
      SS && SS.pendingRewards.push({ type: 'master', kid: kid });
      save();
    }
  }

  /* ============ 结算 ============ */
  function endPractice() {
    S.rounds++;
    save();

    var total = SS.answered, right = SS.correct;
    var rate = total ? Math.round(right / total * 100) : 0;

    $('rs-correct').textContent = right + '/' + total;
    $('rs-rate').textContent = rate + '%';
    $('rs-gain').textContent = '+' + SS.gain;
    $('rs-total').textContent = S.points;

    var emoji = '🎉', title = '练习完成！';
    if (rate === 100) { emoji = '🏆'; title = '全部答对，太厉害了！'; }
    else if (rate >= 80) { emoji = '🌟'; title = '表现很棒！'; }
    else if (rate >= 60) { emoji = '💪'; title = '继续加油！'; }
    else { emoji = '🤗'; title = '慢慢来，我们再来一次'; }
    $('rs-emoji').textContent = emoji;
    $('rs-title').textContent = title;

    // 奖励展示
    var box = $('rs-rewards');
    box.innerHTML = '';
    SS.justMastered.forEach(function (kid) {
      box.appendChild(rewardRow('🏅', '掌握了「' + kpOf(kid).name + '」，额外 +50 分'));
    });
    if (SS.best >= 5) {
      box.appendChild(rewardRow('🔥', '本局最高连对 ' + SS.best + ' 题'));
    }
    if (S.dayCount >= CONFIG.freeDailyLimit && !S.paid) {
      box.appendChild(rewardRow('👑', '免费额度已用完，开通完整版可无限练习'));
    }

    showPage('page-result');

    // 彩蛋判定（延迟弹出，避免和结算页抢注意力）
    var eggs = collectEggs();
    if (eggs) setTimeout(function () { showReward(eggs); }, 700);
  }

  function rewardRow(e, txt) {
    var d = document.createElement('div');
    d.className = 'reward-item';
    d.innerHTML = '<span class="ri-emoji">' + e + '</span><span>' + txt + '</span>';
    return d;
  }

  /* ============ 彩蛋判定 ============ */
  function collectEggs() {
    var m = masteredCount();
    var keyM = 'm' + Math.floor(m / PURCHASE_EGG_EVERY);
    var cd = consecutiveDays();
    var keyD = 'd' + Math.floor(cd / DAY_EGG_EVERY);

    if (m >= PURCHASE_EGG_EVERY && !S.eggGot[keyM]) {
      S.eggGot[keyM] = 1; save();
      return { reason: '你已掌握 ' + m + ' 个知识点' };
    }
    if (cd >= DAY_EGG_EVERY && !S.eggGot[keyD]) {
      S.eggGot[keyD] = 1; save();
      return { reason: '你已连续练习 ' + cd + ' 天' };
    }
    return null;
  }

  /* ============ 音效（WebAudio 合成，零素材依赖）============ */
  var AC = null;
  function ac() {
    if (!AC) {
      try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) { } }
    return AC;
  }
  function tone(c, f, t0, dur, type, vol) {
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + t0);
    g.gain.linearRampToValueAtTime(vol || 0.1, t + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t + t0); o.stop(t + t0 + dur + 0.05);
  }
  function beep(kind) {
    var c = ac();
    if (!c) return;
    try {
      if (kind === 'good') { tone(c, 660, 0, .10, 'sine', .09); tone(c, 880, .07, .16, 'sine', .09); }
      else if (kind === 'bad') { tone(c, 300, 0, .15, 'sine', .08); tone(c, 210, .09, .2, 'sine', .07); }
      else if (kind === 'tap') { tone(c, 540, 0, .05, 'triangle', .05); }
      else if (kind === 'pop') { tone(c, 320, 0, .05, 'square', .05); tone(c, 520, .03, .08, 'triangle', .06); }
      else if (kind === 'egg') {
        tone(c, 170, 0, .05, 'square', .05);
        tone(c, 120, .03, .1, 'sawtooth', .04);
        [523, 659, 784, 1047].forEach(function (f, i) { tone(c, f, .1 + i * .07, .18, 'triangle', .08); });
        tone(c, 1568, .42, .32, 'sine', .06);
      }
    } catch (e) { /* 某些浏览器限制，静默 */ }
  }

  /* ============ 彩蛋：先出现蛋 → 点开 → 特效 + 音效 ============ */
  var eggPending = null, eggOpened = false;
  function showReward(egg) {
    var notOwned = OUTFITS.filter(function (o) { return S.owned.indexOf(o.id) < 0; });
    eggPending = { reason: egg.reason, item: null, bonus: null };

    if (notOwned.length) {
      var item = pickOne(notOwned);
      S.owned.push(item.id);
      save();
      eggPending.item = item;
    } else {
      var bonus = pickOne(EGG_BONUS);
      S.points += 100; save();
      eggPending.bonus = bonus;
    }

    $('btn-egg').classList.remove('opening');
    $('egg-hint').textContent = '点一下打开它！';
    eggOpened = false;
    showModal('modal-egg');
    beep('pop');
  }

  function openEgg() {
    if (eggOpened || !eggPending) return;
    eggOpened = true;
    var el = $('btn-egg');
    el.classList.add('opening');
    $('egg-hint').textContent = '……';
    beep('egg');

    setTimeout(function () {
      var e = eggPending;
      eggPending = null;
      eggOpened = false;
      el.classList.remove('opening');
      hideModal('modal-egg');

      if (e.item) {
        $('rw-emoji').textContent = '🎁';
        $('rw-title').textContent = '惊喜彩蛋！';
        $('rw-item').innerHTML = '<span class="rw-icon">' + Avatar.itemIcon(e.item.id, e.item.slot) + '</span>' +
          '<span class="rw-name">' + esc(e.item.name) + '</span>';
        $('rw-desc').innerHTML = e.reason + '，<br>获得了限定装扮：<b>' + esc(e.item.name) + '</b>！<br><small>去「我的衣柜」穿上试试～</small>';
      } else {
        $('rw-emoji').textContent = '🎊';
        $('rw-title').textContent = '惊喜彩蛋！';
        $('rw-item').textContent = e.bonus;
        $('rw-desc').innerHTML = e.reason + '，<br>装扮都收集齐啦！奖励你 <b>+100 积分</b>。';
      }
      showModal('modal-reward');
      confetti($('modal-reward'));
    }, 1050);
  }

  /* 彩带粒子 */
  function confetti(container) {
    var colors = ['#FF6B81', '#FFD166', '#7EDDC0', '#8EC9FF', '#B08CF0', '#FF9F43'];
    var host = container.querySelector('.confetti-host') || container;
    for (var i = 0; i < 30; i++) {
      var p = document.createElement('span');
      p.className = 'cf';
      p.style.left = (4 + Math.random() * 92) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.35) + 's';
      p.style.animationDuration = (1 + Math.random() * 0.8) + 's';
      var size = 6 + Math.random() * 7;
      p.style.width = size + 'px';
      p.style.height = (size * (Math.random() > .5 ? 1 : 0.45)) + 'px';
      host.appendChild(p);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200); })(p);
    }
  }


  /* ============ 报告 ============ */
  function renderReport() {
    var body = $('report-body');
    body.innerHTML = '';

    var cRate = S.totalCount ? Math.round(S.totalCorrect / S.totalCount * 100) : 0;
    var dRate = S.dayCount ? Math.round(S.dayCorrect / S.dayCount * 100) : 0;

    var sec1 = document.createElement('div');
    sec1.className = 'report-sec';
    sec1.innerHTML =
      '<h4><span>📅</span> 今天</h4>' +
      row('练习题数', S.dayCount + ' 题') +
      row('答对题数', S.dayCorrect + ' 题') +
      row('今日正确率', dRate + '%');
    body.appendChild(sec1);

    var sec2 = document.createElement('div');
    sec2.className = 'report-sec';
    sec2.innerHTML =
      '<h4><span>📈</span> 累计</h4>' +
      row('累计练习', S.totalCount + ' 题') +
      row('累计正确率', cRate + '%') +
      row('连续练习', consecutiveDays() + ' 天') +
      row('掌握知识点', masteredCount() + ' / ' + KNOWLEDGE_POINTS.length) +
      row('当前积分', S.points + ' 分') +
      row('完成轮次', S.rounds + ' 轮');
    body.appendChild(sec2);

    // 知识点掌握度
    var sec3 = document.createElement('div');
    sec3.className = 'report-sec';
    var h3 = document.createElement('h4');
    h3.innerHTML = '<span>🧠</span> 知识点掌握度';
    sec3.appendChild(h3);
    var cloud = document.createElement('div');
    cloud.className = 'tag-cloud';
    KNOWLEDGE_POINTS.forEach(function (kp) {
      var d = document.createElement('div');
      var cls = '';
      var done = 0, solid = 0;
      QUESTIONS.forEach(function (q) {
        if (q.knowledge !== kp.id) return;
        if ((S.answered[q.id] || 0) > 0) { done++; if ((S.rightStreak[q.id] || 0) >= 2) solid++; }
      });
      if (S.mastered[kp.id]) cls = 'mastered';
      else if (done > 0 && solid / done < 0.6) cls = 'weak';
      d.className = 'tg ' + cls;
      d.textContent = (S.mastered[kp.id] ? '✔ ' : '') + kp.name;
      cloud.appendChild(d);
    });
    sec3.appendChild(cloud);
    body.appendChild(sec3);

    // 错题本
    var wrongIds = Object.keys(S.wrong).filter(function (id) { return (S.wrong[id] || 0) > 0; });
    wrongIds.sort(function (a, b) { return (S.wrong[b] || 0) - (S.wrong[a] || 0); });

    var sec4 = document.createElement('div');
    sec4.className = 'report-sec';
    var h4b = document.createElement('h4');
    h4b.innerHTML = '<span>📕</span> 错题本（' + wrongIds.length + ' 题）';
    sec4.appendChild(h4b);
    if (!wrongIds.length) {
      var p = document.createElement('div');
      p.className = 'rp-row';
      p.innerHTML = '<span>还没有错题，太厉害了！</span>';
      sec4.appendChild(p);
    } else {
      wrongIds.slice(0, 12).forEach(function (qid) {
        var q = null;
        for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].id === qid) { q = QUESTIONS[i]; break; }
        if (!q) return;
        var ans = answerText(q);
        var item = document.createElement('div');
        item.className = 'wrong-item';
        item.innerHTML =
          '<div class="wrong-char">' + esc(q.content) + '</div>' +
          '<div class="wrong-info">' +
          '<div class="wi-p">' + esc(ans) + '</div>' +
          '<div class="wi-k">' + esc(kpOf(q.knowledge).name) + ' · 错过 ' + S.wrong[qid] + ' 次</div>' +
          '</div>';
        sec4.appendChild(item);
      });
      var btn = document.createElement('button');
      btn.className = 'btn btn-primary';
      btn.style.marginTop = '14px';
      btn.textContent = '🔁 只练错题（' + Math.min(wrongIds.length, CONFIG.sessionLength) + ' 题）';
      btn.onclick = function () {
        var list = [];
        for (var i = 0; i < wrongIds.length && list.length < CONFIG.sessionLength; i++) {
          for (var j = 0; j < QUESTIONS.length; j++) {
            if (QUESTIONS[j].id === wrongIds[i]) { list.push(QUESTIONS[j]); break; }
          }
        }
        if (!S.paid && S.dayCount >= CONFIG.freeDailyLimit) { openPay(); toast('今天的免费练习已经用完啦'); return; }
        startPractice(list);
      };
      sec4.appendChild(btn);
    }
    body.appendChild(sec4);

    // 重置
    var reset = document.createElement('button');
    reset.className = 'btn btn-ghost';
    reset.style.marginTop = '6px';
    reset.textContent = '清空学习进度（重新开始）';
    reset.onclick = function () {
      confirmBox('确认清空？', '这会删除积分、装扮和全部练习记录，且无法恢复。').then(function (yes) {
        if (!yes) return;
        S = freshState(); save();
        renderHome(); renderReport(); toast('已重置');
      });
    };
    body.appendChild(reset);
  }

  function row(k, v) {
    return '<div class="rp-row"><span>' + k + '</span><b>' + v + '</b></div>';
  }
  /* 一道题的「正确答案」展示文本（各题型不同） */
  function answerText(q) {
    if (q.type === 'judge') return q.content + ' ' + (q.judgeOk ? '读 ' : '不读 ') + q.judgePinyin;
    if (q.type === 'match') return '连线配对';
    if (q.type === 'spell') return (q.tiles || []).join(' ');
    return q.options ? q.options[q.answer] : '';
  }

  /* ============ 衣柜 ============ */
  function renderWardrobe() {
    $('wd-points').textContent = S.points;
    $('wd-tip').innerHTML = '点一下装备就能穿上或脱下，左边的小人马上换好。<br>积分来自答对题目和掌握知识点，彩蛋还会掉落限定装扮～';

    var pv = $('wd-preview');
    if (pv) pv.innerHTML = Avatar.svg(S.gender || 'boy', S.worn, { cls: 'avatar-svg' });

    var grid = $('wd-grid');
    grid.innerHTML = '';
    OUTFITS.forEach(function (o) {
      var owned = S.owned.indexOf(o.id) >= 0;
      var on = S.worn[o.slot] === o.id;
      var cell = document.createElement('div');
      cell.className = 'wd-cell' + (owned ? '' : ' locked') + (on ? ' on' : '');
      cell.innerHTML =
        (owned ? '' : '<div class="wd-lock">🔒</div>') +
        '<div class="wd-icon-box">' + Avatar.itemIcon(o.id) + '</div>' +
        '<div class="wd-name">' + esc(o.name) + '</div>' +
        '<div class="wd-slot">' + esc(SLOT_NAME[o.slot] || o.slot) + '</div>' +
        (owned ? (on ? '<div class="wd-cost">穿着中</div>' : '<div class="wd-cost">点我穿上</div>')
               : '<div class="wd-cost">⭐ ' + o.cost + '</div>');
      cell.onclick = function () {
        if (owned) {
          if (S.worn[o.slot] === o.id) { delete S.worn[o.slot]; toast('脱下了' + o.name); }
          else { S.worn[o.slot] = o.id; toast('穿上了' + o.name); }
          save(); renderWardrobe(); renderStage();
        } else {
          if (S.points < o.cost) { toast('还差 ' + (o.cost - S.points) + ' 分，再练几题吧～'); return; }
          confirmBox('兑换 ' + o.name + '？', '将消耗 ' + o.cost + ' 积分，兑换后可以随时穿戴。').then(function (yes) {
            if (!yes) return;
            S.points -= o.cost;
            S.owned.push(o.id);
            S.worn[o.slot] = o.id;
            save(); renderWardrobe(); renderStage();
            toast('🎉 获得 ' + o.name + '！');
          });
        }
      };
      grid.appendChild(cell);
    });
  }

  var SLOT_NAME = {
    hat: '帽子', eyes: '眼镜', ear: '耳饰', neck: '项链', wrist: '手表',
    top: '上衣', cape: '披风', bottom: '裤子', shoes: '鞋', back: '背部',
    hand: '手持', pet: '宠物', vehicle: '载具'
  };

  /* ============ 支付 ============ */
  function openPay() {
    $('pay-note').innerHTML = '扫码支付 ¥9.9 后，把激活码发给客服获取并填在下面。<br>' +
      '<span style="color:#A9A6C0">客服 ' + CONFIG.contact + '</span>';
    var box = $('qr-box');
    box.innerHTML = '';
    var img = document.createElement('img');
    img.src = CONFIG.qrImage;
    img.alt = '收款码';
    img.onerror = function () {
      box.innerHTML = '<div class="qr-ph">［在这里放你的收款码］<br><small>把你的收款码存成 assets/qrcode.png 即可<br>建议用微信「设置金额」生成 9.9 元固定收款码</small></div>';
    };
    box.appendChild(img);
    showModal('modal-pay');
  }
  function redeem() {
    var v = ($('inp-code').value || '').trim().toUpperCase();
    if (!v) { toast('请输入激活码'); return; }
    if (CONFIG.activationCodes.indexOf(v) >= 0) {
      S.paid = true; save();
      hideModal('modal-pay');
      renderHome();
      toast('👑 开通成功，可以无限练习啦！');
    } else {
      toast('激活码不对，请检查后重试');
    }
  }

  /* ============ 事件绑定 ============ */
  function bind() {
    $('btn-start').onclick = function () { startPractice(); };
    $('btn-report').onclick = function () { renderReport(); showPage('page-report'); };
    $('btn-wardrobe').onclick = function () { renderWardrobe(); showPage('page-wardrobe'); };

    $('btn-quit').onclick = function () {
      confirmBox('要退出练习吗？', '本轮的进度会保留，下次继续。').then(function (yes) {
        if (yes) { if (SS) endPractice(); else showPage('page-home'); renderHome(); }
      });
    };
    $('btn-audio').onclick = function () {
      if (SS && SS.queue[SS.i]) playQuestion(SS.queue[SS.i]);
    };

    $('btn-again').onclick = function () { startPractice(); };
    $('btn-result-home').onclick = function () { renderHome(); showPage('page-home'); };

    $('btn-report-back').onclick = function () { renderHome(); showPage('page-home'); };
    $('btn-wardrobe-back').onclick = function () { renderHome(); showPage('page-home'); };
    $('btn-change-avatar').onclick = function () { openChoose('wardrobe'); };

    $('btn-share').onclick = function () {
      var url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast('链接已复制，发给小朋友吧～'); },
          function () { toast(url); });
      } else { toast(url); }
    };

    $('btn-rw-ok').onclick = function () { hideModal('modal-reward'); };
    $('btn-egg').onclick = openEgg;
    $('btn-pay-close').onclick = function () { hideModal('modal-pay'); };
    $('btn-code').onclick = redeem;
    $('inp-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') redeem(); });

    // 点击弹窗遮罩关闭（讲解弹窗除外，必须点按钮）
    ['modal-reward', 'modal-pay', 'modal-confirm'].forEach(function (id) {
      $(id).addEventListener('click', function (e) { if (e.target === this) hideModal(id); });
    });
  }

  /* ============ 选择小伙伴（首次进入 / 衣柜里可重选）============ */
  var chooseFrom = null;
  function openChoose(from) {
    chooseFrom = from || null;
    var box = $('choose-grid');
    box.innerHTML = '';
    ['boy', 'girl'].forEach(function (g) {
      var card = document.createElement('button');
      card.className = 'choose-card' + (S.gender === g ? ' picked' : '');
      card.innerHTML = Avatar.svg(g, {}, { cls: 'avatar-svg' }) +
        '<div class="choose-name">' + (g === 'boy' ? '我是小男孩' : '我是小女孩') + '</div>';
      card.onclick = function () {
        S.gender = g; save();
        if (chooseFrom === 'wardrobe') { renderWardrobe(); showPage('page-wardrobe'); }
        else { renderHome(); showPage('page-home'); }
        toast('你好呀，' + (g === 'boy' ? '小勇士！' : '小公主！'));
      };
      box.appendChild(card);
    });
    showPage('page-choose');
  }

  /* ============ 启动 ============ */
  function boot() {
    load();
    if ('speechSynthesis' in window) {
      // 预热语音列表（部分浏览器首次为空）
      try { window.speechSynthesis.getVoices(); } catch (e) { }
    }
    bind();

    // 支持通过链接直接激活：?code=XXXX
    try {
      var m = (location.search || '').match(/[?&]code=([^&]+)/);
      if (m) {
        var c = decodeURIComponent(m[1]).toUpperCase();
        if (CONFIG.activationCodes.indexOf(c) >= 0) { S.paid = true; save(); toast('👑 已激活完整版'); }
      }
    } catch (e) { }

    renderHome();

    // 首次使用：先选小男孩还是小女孩
    if (!S.gender) openChoose(null);

    // 免费额度用完后，首页主按钮依然可用，但会引导开通
    console.log('%c拼音小达人 已就绪', 'color:#6C5CE7;font-weight:bold');

    // 自动化测试钩子（只读状态 + 直达会话，不影响正常使用）
    window.__pyTest = {
      S: function () { return S; },
      SS: function () { return SS; },
      start: startPractice,
      toItem: toItem,
      /* 供自动化测试驱动内部状态用（不参与任何线上逻辑） */
      grant: function (ids, pts) {
        (ids || []).forEach(function (id) { if (S.owned.indexOf(id) < 0) S.owned.push(id); });
        if (typeof pts === 'number') S.points = pts;
        save(); renderWardrobe(); renderStage();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
