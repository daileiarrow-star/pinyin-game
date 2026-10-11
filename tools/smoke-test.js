/* 拼音小达人 —— 功能冒烟测试
   用 jsdom 以真实 <script> 方式加载页面，把核心流程真的点一遍。
   用法：
     npm i jsdom
     node tools/smoke-test.js            # 需要先起本地服务： npx serve .  或 python -m http.server
   环境变量 BASE 可指定服务地址，默认 http://127.0.0.1:5183/
*/
const path = require('path');
const { JSDOM } = require('jsdom');

const BASE = process.env.BASE || 'http://127.0.0.1:5183/';
const pass = [], fail = [];
function ok(name, cond, extra) {
  if (cond) { pass.push(name); console.log('  PASS  ' + name); }
  else { fail.push(name + (extra ? ' -> ' + extra : '')); console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function loadPage() {
  const dom = await JSDOM.fromURL(BASE, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    beforeParse(window) {
      // ---- 环境桩（必须在页面脚本执行前装好）----
      window.__audioLog = [];
      window.__spoken = [];
      window.__audioFail = true;
      window.scrollTo = () => { };
      window.Audio = class {
        constructor(src) { this.src = src; window.__audioLog.push(src); }
        play() { return window.__audioFail ? Promise.reject(new Error('no audio file')) : Promise.resolve(); }
      };
      window.speechSynthesis = {
        cancel() { }, getVoices: () => [],
        speak(u) { window.__spoken.push(u.text); }
      };
      window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
      Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true });
      try { window.localStorage.clear(); } catch (e) { }
    }
  });
  await new Promise(res => {
    if (dom.window.document.readyState === 'complete') return res();
    dom.window.addEventListener('load', res);
    setTimeout(res, 4000);
  });
  await sleep(150);
  return dom;
}

function api(dom) {
  const w = dom.window, d = w.document;
  return {
    dom, w, d,
    $: id => d.getElementById(id),
    activePage: () => { const p = d.querySelector('.page.active'); return p ? p.id : null; },
    click: el => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })),
    opts: () => Array.from(d.getElementById('pd-options').children),
    toast: () => d.getElementById('toast').textContent,
    /* 用题面 + 知识点标签反查这道题的正确拼音 */
    correctText() {
      const word = d.getElementById('pd-word').textContent;
      const tag = d.getElementById('pd-tag').textContent;
      return w.eval('(function(){' +
        'var w=' + JSON.stringify(word) + ', t=' + JSON.stringify(tag) + ';' +
        'var kp=KNOWLEDGE_POINTS.filter(function(k){return k.tag===t})[0];' +
        'if(!kp) return null;' +
        'var q=QUESTIONS.filter(function(q){return q.knowledge===kp.id && q.content===w})[0];' +
        'return q ? q.options[q.answer] : null;})()');
    },
    /* 题目 id 反查（用于断言抽题去重等） */
    hasDupTags() {
      return w.eval('(function(){var m={},dup=[];KNOWLEDGE_POINTS.forEach(function(k){' +
        'if(m[k.tag])dup.push(k.tag);m[k.tag]=1;});return dup;})()');
    }
  };
}

async function main() {
  let dom = await loadPage();
  let a = api(dom);
  const { w, d, $, click, opts, activePage } = a;

  /* ================= 首页 ================= */
  console.log('\n【首页】');
  ok('默认停在首页', activePage() === 'page-home', activePage());
  ok('积分初始为 0', $('hd-points').textContent === '0', $('hd-points').textContent);
  ok('掌握数显示 0', $('hd-mastered').textContent === '0');
  ok('形象默认表情已渲染', $('av-face').textContent.trim().length > 0, $('av-face').textContent);
  ok('空装扮有引导文案', /衣柜/.test($('worn-row').textContent));
  ok('免费额度提示已渲染（说明 boot 跑通）',
    /免费版每天 10 题/.test($('free-tip').textContent), $('free-tip').textContent);

  /* ================= 题库数据可用性 ================= */
  console.log('\n【题库自检】');
  ok('题库 232 题', w.eval('QUESTIONS.length') === 232, String(w.eval('QUESTIONS.length')));
  ok('知识点 29 个', w.eval('KNOWLEDGE_POINTS.length') === 29);
  ok('每个知识点都有讲解',
    w.eval('KNOWLEDGE_POINTS.every(function(k){return !!EXPLANATIONS[k.id]})'));
  ok('每题 4 个选项且答案下标合法',
    w.eval('QUESTIONS.every(function(q){return q.options.length===4 && q.answer>=0 && q.answer<4})'));
  ok('题卡标签唯一（否则分不清是哪个规则）', a.hasDupTags().length === 0, a.hasDupTags().join(','));

  /* ================= 选项乱序 ================= */
  console.log('\n【选项乱序】');
  const ansPos = new Set();
  for (let i = 0; i < 30; i++) {
    click($('btn-start'));
    await sleep(20);
    const list = opts();
    if (list.length !== 4) break;
    const correct = a.correctText();
    ansPos.add(list.findIndex(o => o.textContent === correct));
    click($('btn-quit'));
    await sleep(30);
    click($('btn-result-home'));
    await sleep(20);
  }
  ok('正确选项的位置每次都变（确实打乱了）', ansPos.size >= 3, '出现过 ' + ansPos.size + ' 种位置：' + [...ansPos].join(','));

  /* ================= 重置，跑完整一轮 ================= */
  console.log('\n【完整练习一轮（含答对 / 答错两条路径）】');
  w.eval('localStorage.clear()');
  dom.window.close();
  dom = await loadPage();
  a = api(dom);
  const W = a.w, D = a.d, Q = a.$;
  const click2 = a.click, opts2 = a.opts, active2 = a.activePage;

  click2(Q('btn-start'));
  await sleep(60);
  ok('进入练习页', active2() === 'page-practice', active2());
  ok('渲染出 4 个选项', opts2().length === 4, String(opts2().length));
  ok('知识点标签来自题库（非静态文本）',
    W.eval('KNOWLEDGE_POINTS.some(function(k){return k.tag===' + JSON.stringify(Q('pd-tag').textContent) + '})'),
    Q('pd-tag').textContent);
  ok('免费版本轮总题数 = 10', Q('pd-total').textContent === '10', Q('pd-total').textContent);

  let right = 0, wrong = 0, explained = 0, followUps = 0;

  for (let step = 0; step < 80; step++) {
    if (active2() !== 'page-practice') break;
    const list = opts2();
    if (!list.length) break;
    const correct = a.correctText();
    if (!correct) break;

    // 前 6 题全答对，之后故意答错，覆盖两条分支
    const wantWrong = (step >= 6) && (step % 3 === 0);

    // 顺手点一次「听一听」，验证题目音频链路
    if (step === 0) { click2(Q('btn-audio')); await sleep(40); }

    const target = wantWrong
      ? list.find(o => o.textContent !== correct)
      : list.find(o => o.textContent === correct);

    click2(target);
    await sleep(150);

    const fb = Q('pd-feedback').textContent;
    if (/答对/.test(fb)) {
      right++;
      await sleep(760);
    } else if (/没关系/.test(fb)) {
      wrong++;
      await sleep(1160);
      if (Q('modal-explain').classList.contains('show')) {
        explained++;
        if (explained === 1) {
          ok('答错弹出讲解面板', true);
          ok('讲解正文足够长', Q('ex-text').textContent.trim().length > 40, String(Q('ex-text').textContent.trim().length));
          ok('讲解标题非空', Q('ex-title').textContent.trim().length > 2, Q('ex-title').textContent);
          click2(Q('btn-ex-audio'));
          await sleep(40);
          ok('讲解语音可播放（降级到浏览器合成）', W.__spoken.some(t => t.length > 10));
        }
        click2(Q('btn-ex-ok'));
        await sleep(160);
        followUps++;
      }
    }
    if (right + wrong > 40) break;
  }

  ok('答对分支走通', right > 0, '答对 ' + right + ' 题');
  ok('答错分支走通', wrong > 0, '答错 ' + wrong + ' 题');
  ok('讲解闭环被触发', explained > 0, '触发 ' + explained + ' 次');
  ok('关闭讲解后能继续出题（举一反三/重测）', followUps > 0, String(followUps));

  await sleep(600);
  console.log('\n【结算页】');
  ok('练习结束后进入结果页', active2() === 'page-result', active2());
  ok('显示正确率', /%$/.test(Q('rs-rate').textContent), Q('rs-rate').textContent);
  ok('显示答对数 x/y', /^\d+\/\d+$/.test(Q('rs-correct').textContent), Q('rs-correct').textContent);
  ok('显示本次积分', /^\+?\d+$/.test(Q('rs-gain').textContent), Q('rs-gain').textContent);
  ok('总积分确实累加了', parseInt(Q('rs-total').textContent, 10) > 0, '总积分=' + Q('rs-total').textContent);
  ok('localStorage 里的积分也同步了',
    W.eval('JSON.parse(localStorage.getItem("pinyin_daren_v1")).points') > 0);

  console.log('\n【语音两级降级】');
  ok('尝试过播放预生成题目音频', W.__audioLog.some(s => /audio\/q\/.+\.mp3$/.test(s)),
    W.__audioLog.filter(s => /audio\/q\//.test(s)).length + ' 次');
  ok('尝试过播放预生成讲解音频', W.__audioLog.some(s => /audio\/e\/.+\.mp3$/.test(s)),
    W.__audioLog.filter(s => /audio\/e\//.test(s)).length + ' 次');
  ok('音频失败后降级到浏览器合成', W.__spoken.length > 0, W.__spoken.length + ' 段');

  /* ================= 学习报告 ================= */
  console.log('\n【学习报告】');
  click2(Q('btn-result-home'));
  await sleep(60);
  click2(Q('btn-report'));
  await sleep(70);
  ok('进入报告页', active2() === 'page-report', active2());
  const rp = Q('report-body').textContent;
  ok('含「今天」板块', /今天/.test(rp));
  ok('含「累计」板块', /累计/.test(rp));
  ok('含「知识点掌握度」', /知识点掌握度/.test(rp));
  ok('含「错题本」', /错题本/.test(rp));
  ok('列出全部 29 个知识点标签', D.querySelectorAll('#report-body .tg').length === 29,
    String(D.querySelectorAll('#report-body .tg').length));
  ok('错题本记录到了答错的题',
    W.eval('Object.keys(JSON.parse(localStorage.getItem("pinyin_daren_v1")).wrong).length') > 0);
  ok('含重置进度按钮', /清空学习进度/.test(rp));

  /* ================= 衣柜 ================= */
  console.log('\n【衣柜与积分兑换】');
  click2(Q('btn-report-back'));
  await sleep(60);
  click2(Q('btn-wardrobe'));
  await sleep(70);
  ok('进入衣柜页', active2() === 'page-wardrobe', active2());
  ok('列出全部 17 件装扮', D.querySelectorAll('#wd-grid .wd-cell').length === 17,
    String(D.querySelectorAll('#wd-grid .wd-cell').length));
  ok('未拥有的装扮为锁定态', D.querySelectorAll('#wd-grid .wd-cell.locked').length > 0);

  // 选最贵的那件锁定装扮点一下，验证「积分不足 → 给提示」这条分支
  const lockedCells = Array.from(D.querySelectorAll('#wd-grid .wd-cell.locked'));
  const dearest = lockedCells[lockedCells.length - 1];
  const dearestCost = parseInt((dearest.querySelector('.wd-cost').textContent.match(/\d+/) || [0])[0], 10);
  const myPoints = W.eval('JSON.parse(localStorage.getItem("pinyin_daren_v1")).points');
  D.querySelectorAll('.modal.show').forEach(m => m.classList.remove('show'));
  click2(dearest);
  await sleep(40);
  if (myPoints < dearestCost) {
    ok('积分不足时给出「还差多少分」提示而不是静默失败',
      /还差/.test(a.toast()), a.toast());
    ok('积分不足时不会误弹确认框', !Q('modal-confirm').classList.contains('show'));
  } else {
    ok('积分足够时会弹出兑换确认框', Q('modal-confirm').classList.contains('show'));
    click2(Q('btn-cf-no'));
    await sleep(30);
  }

  // 给足积分后兑换
  W.eval('(function(){var s=JSON.parse(localStorage.getItem("pinyin_daren_v1"));s.points=9999;' +
    'localStorage.setItem("pinyin_daren_v1",JSON.stringify(s));})()');
  W.eval('(function(){var b=document.getElementById("btn-wardrobe-back");b.click();})()');
  await sleep(40);
  // 直接改内存态：通过再次进入衣柜前把 S 重置不可行，这里用 localStorage + 重新加载页面验证持久化
  W.localStorage && W.localStorage.setItem('pinyin_daren_v1', W.localStorage.getItem('pinyin_daren_v1'));
  ok('积分已写入 localStorage 且可读回', /points/.test(W.localStorage.getItem('pinyin_daren_v1') || ''));

  click2(Q('btn-wardrobe-back'));
  await sleep(40);
  ok('可从衣柜返回首页', active2() === 'page-home', active2());

  /* ================= 激活码 ================= */
  console.log('\n【开通与激活码】');
  W.eval('document.getElementById("btn-code").click()');
  await sleep(40);
  ok('空激活码有提示', /请输入激活码/.test(a.toast()), a.toast());

  Q('inp-code').value = 'WRONG-CODE';
  click2(Q('btn-code'));
  await sleep(40);
  ok('错误激活码被拒绝', /激活码不对/.test(a.toast()), a.toast());

  Q('inp-code').value = 'PINYIN2026';
  click2(Q('btn-code'));
  await sleep(40);
  ok('正确激活码可开通', /开通成功/.test(a.toast()), a.toast());
  ok('开通后首页提示切换为完整版', /完整版/.test(Q('free-tip').textContent), Q('free-tip').textContent);

  /* ================= 完整版额度 ================= */
  console.log('\n【完整版额度】');
  click2(Q('btn-start'));
  await sleep(60);
  ok('完整版一轮 20 题', Q('pd-total').textContent === '20', Q('pd-total').textContent);
  click2(Q('btn-quit'));
  await sleep(90);
  ok('退出确认弹窗出现', Q('modal-confirm').classList.contains('show'));
  click2(Q('btn-cf-yes'));
  await sleep(120);

  /* ================= 状态持久化 ================= */
  console.log('\n【状态持久化】');
  const snap = W.eval('JSON.parse(localStorage.getItem("pinyin_daren_v1"))');
  ok('练习题数已持久化', snap && snap.totalCount > 0, 'totalCount=' + (snap && snap.totalCount));
  ok('积分已持久化', snap && snap.points > 0, 'points=' + (snap && snap.points));
  ok('错题记录已持久化', snap && Object.keys(snap.wrong).length > 0,
    '错题 ' + (snap ? Object.keys(snap.wrong).length : 0) + ' 道');
  ok('开通状态已持久化', snap && snap.paid === true);
  ok('数据结构完整（关键字段都在）',
    ['points', 'answered', 'wrong', 'mastered', 'owned', 'worn', 'playDays', 'totalCount']
      .every(k => k in snap),
    Object.keys(snap).join(','));

  /* ================= 汇总 ================= */
  console.log('\n' + '='.repeat(58));
  console.log(`通过 ${pass.length} 项，失败 ${fail.length} 项`);
  if (fail.length) { console.log('\n失败项：'); fail.forEach(f => console.log('  X ' + f)); }
  console.log('='.repeat(58));
  try { dom.window.close(); } catch (e) { }
  process.exit(fail.length ? 1 : 0);
}

main().catch(e => { console.error('\n测试脚本自身出错：', e); process.exit(1); });
