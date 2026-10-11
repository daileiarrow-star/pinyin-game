/* =========================================================
   拼音小达人 — 主逻辑
   零 API 成本：所有内容预置，语音走「预生成音频 → 浏览器合成」两级降级
   ========================================================= */
(function () {
  'use strict';

  /* ============ 常量 ============ */
  var LS_KEY = 'pinyin_daren_v1';
  var SLOT2EL = {
    hat: 'av-hat', eyes: 'av-eyes', top: 'av-top',
    bottom: 'av-bottom', acc: 'av-acc', prop: 'av-prop'
  };
  var PURCHASE_EGG_EVERY = 3;   // 每掌握 3 个知识点触发一次彩蛋
  var DAY_EGG_EVERY = 3;        // 连续练习满 3 天触发一次彩蛋

  /* ============ 状态 ============ */
  function freshState() {
    return {
      v: 1,
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
    playOrSpeak(CONFIG.audioBase + 'q/' + q.id + '.mp3', q.content);
  }
  function playExplain(kid) {
    var ex = EXPLANATIONS[kid];
    if (!ex) return;
    var plain = ex.title + '。' + ex.text.replace(/[🔑📝⚠️·]/g, '，').replace(/\n+/g, '，');
    playOrSpeak(CONFIG.audioBase + 'e/' + kid + '.mp3', plain);
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
    for (var slot in SLOT2EL) {
      var el = $(SLOT2EL[slot]);
      var oid = S.worn[slot];
      el.textContent = (oid && OUTFIT_MAP[oid]) ? OUTFIT_MAP[oid].emoji : '';
    }
    var row = $('worn-row');
    row.innerHTML = '';
    var names = [];
    for (var s in S.worn) {
      if (S.worn[s] && OUTFIT_MAP[S.worn[s]]) names.push(OUTFIT_MAP[S.worn[s]].emoji + ' ' + OUTFIT_MAP[S.worn[s]].name);
    }
    if (!names.length) {
      row.innerHTML = '<div class="worn-chip">还没穿装扮，去衣柜看看吧～</div>';
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
    // 打乱选项顺序，并把正确答案下标重算
    var idx = [];
    for (var i = 0; i < q.options.length; i++) idx.push(i);
    shuffle(idx);
    var opts = [], ans = 0;
    for (var j = 0; j < idx.length; j++) {
      opts.push(q.options[idx[j]]);
      if (idx[j] === q.answer) ans = j;
    }
    return { src: q, id: q.id, knowledge: q.knowledge, content: q.content, opts: opts, ans: ans };
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

    var w = $('pd-word');
    w.textContent = it.content;
    w.className = 'q-word' + (it.content.length > 1 ? ' long' : '');

    $('pd-feedback').textContent = '';
    $('pd-feedback').className = 'feedback';

    var box = $('pd-options');
    box.innerHTML = '';
    it.opts.forEach(function (txt, i) {
      var b = document.createElement('button');
      b.className = 'opt';
      b.textContent = txt;
      b.onclick = function () { onChoose(i, b); };
      box.appendChild(b);
    });
  }

  function onChoose(i, btn) {
    if (!SS || SS.locked) return;
    SS.locked = true;
    var it = SS.queue[SS.i];
    var ok = (i === it.ans);
    var opts = $('pd-options').children;
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

      var gain = 10;
      var bonus = 0;
      if (SS.streak % 5 === 0) { bonus += 20; }
      if (SS.retestIds[it.id]) { bonus += 15; delete SS.retestIds[it.id]; }
      gain += bonus;
      S.points += gain;
      SS.gain += gain;

      btn.classList.add('correct');
      for (j = 0; j < opts.length; j++) opts[j].classList.add('locked');

      var fb = $('pd-feedback');
      fb.className = 'feedback good';
      if (bonus && SS.streak % 5 === 0) fb.textContent = '连对 ' + SS.streak + ' 题！额外 +' + bonus + ' 分 🎊';
      else if (bonus) fb.textContent = '看完讲解答对啦！+' + gain + ' 分 💪';
      else fb.textContent = '答对啦！+' + gain + ' 分 ⭐';

      checkMastery(it.knowledge);
      save();
      setTimeout(advance, 720);
    } else {
      SS.streak = 0;
      S.wrong[it.id] = (S.wrong[it.id] || 0) + 1;
      S.wrongTime[it.id] = Date.now();
      S.rightStreak[it.id] = 0;

      btn.classList.add('wrong');
      for (j = 0; j < opts.length; j++) {
        opts[j].classList.add('locked');
        if (j === it.ans) opts[j].classList.add('correct');
      }
      var f2 = $('pd-feedback');
      f2.className = 'feedback bad';
      f2.textContent = '没关系，我们一起来看看～';
      save();
      setTimeout(function () { showExplain(it.knowledge, it); }, 1050);
    }
  }

  /* 讲解弹窗 → 关闭后插入「举一反三」+ 原题重测 */
  function showExplain(kid, it) {
    var ex = EXPLANATIONS[kid];
    $('ex-title').textContent = ex ? ex.title : kpOf(kid).name;
    $('ex-text').textContent = ex ? ex.text : '';
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

  /* ============ 彩蛋 ============ */
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

  function showReward(egg) {
    // 随机掉落一件「还没拥有」的装扮；全都有了就送随机小惊喜
    var notOwned = OUTFITS.filter(function (o) { return S.owned.indexOf(o.id) < 0; });
    var item = null;
    if (notOwned.length) {
      item = pickOne(notOwned);
      S.owned.push(item.id);
      save();
      $('rw-emoji').textContent = '🎁';
      $('rw-title').textContent = '惊喜彩蛋！';
      $('rw-item').textContent = item.emoji;
      $('rw-desc').innerHTML = egg.reason + '，<br>获得了限定装扮：<b>' + item.name + '</b>！<br><small>去「我的衣柜」穿上试试～</small>';
    } else {
      var bonus = pickOne(EGG_BONUS);
      S.points += 100; save();
      $('rw-emoji').textContent = '🎊';
      $('rw-title').textContent = '惊喜彩蛋！';
      $('rw-item').textContent = bonus;
      $('rw-desc').innerHTML = egg.reason + '，<br>装扮都收集齐啦！奖励你 <b>+100 积分</b>。';
    }
    showModal('modal-reward');
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
        var item = document.createElement('div');
        item.className = 'wrong-item';
        item.innerHTML =
          '<div class="wrong-char">' + q.content + '</div>' +
          '<div class="wrong-info">' +
          '<div class="wi-p">' + q.options[q.answer] + '</div>' +
          '<div class="wi-k">' + kpOf(q.knowledge).name + ' · 错过 ' + S.wrong[qid] + ' 次</div>' +
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

  /* ============ 衣柜 ============ */
  function renderWardrobe() {
    $('wd-points').textContent = S.points;
    $('wd-tip').innerHTML = '用积分兑换装扮，点一下就能穿上或脱下。<br>积分来自答对题目与掌握知识点，彩蛋还会掉落限定装扮哦～';

    var grid = $('wd-grid');
    grid.innerHTML = '';
    OUTFITS.forEach(function (o) {
      var owned = S.owned.indexOf(o.id) >= 0;
      var on = S.worn[o.slot] === o.id;
      var cell = document.createElement('div');
      cell.className = 'wd-cell' + (owned ? '' : ' locked') + (on ? ' on' : '');
      cell.innerHTML =
        (owned ? '' : '<div class="wd-lock">🔒</div>') +
        '<div class="wd-emoji">' + o.emoji + '</div>' +
        '<div class="wd-name">' + o.name + '</div>' +
        (owned ? (on ? '<div class="wd-cost">穿着中</div>' : '<div class="wd-cost">点我穿上</div>')
               : '<div class="wd-cost">⭐ ' + o.cost + '</div>');
      cell.onclick = function () {
        if (owned) {
          if (S.worn[o.slot] === o.id) { delete S.worn[o.slot]; toast('脱下了' + o.name); }
          else { S.worn[o.slot] = o.id; toast('穿上了' + o.name + ' ' + o.emoji); }
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

  /* ============ 支付 ============ */
  function openPay() {
    $('pay-note').innerHTML = '扫码支付 ¥99 后，把激活码发给客服获取并填在下面。<br>' +
      '<span style="color:#A9A6C0">客服 ' + CONFIG.contact + '</span>';
    var box = $('qr-box');
    box.innerHTML = '';
    var img = document.createElement('img');
    img.src = CONFIG.qrImage;
    img.alt = '收款码';
    img.onerror = function () {
      box.innerHTML = '<div class="qr-ph">［在这里放你的收款码］<br><small>把 assets/qrcode.png 换成你的收款码即可</small></div>';
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

    $('btn-share').onclick = function () {
      var url = location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { toast('链接已复制，发给小朋友吧～'); },
          function () { toast(url); });
      } else { toast(url); }
    };

    $('btn-rw-ok').onclick = function () { hideModal('modal-reward'); };
    $('btn-pay-close').onclick = function () { hideModal('modal-pay'); };
    $('btn-code').onclick = redeem;
    $('inp-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') redeem(); });

    // 点击弹窗遮罩关闭（讲解弹窗除外，必须点按钮）
    ['modal-reward', 'modal-pay', 'modal-confirm'].forEach(function (id) {
      $(id).addEventListener('click', function (e) { if (e.target === this) hideModal(id); });
    });
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

    // 免费额度用完后，首页主按钮依然可用，但会引导开通
    console.log('%c拼音小达人 已就绪', 'color:#6C5CE7;font-weight:bold');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
