/* =========================================================
   拼音小达人 — 图文讲解引擎
   ---------------------------------------------------------
   每个知识点配一张示意图。全部用内联 SVG 现画，
   零图片文件、零请求、矢量化不糊。
   六种图：mouth 口型对比 / profile 舌位剖面 / air 送气
          tone 声调曲线 / mark 标调位置 / build 拼读 vs 整体认读
   ========================================================= */

var ILLUS_COLOR = {
  ink:'#22243A', sub:'#6B7089', brand:'#6C5CE7', brand2:'#A29BFE',
  sun:'#F5A623', mint:'#00C2A8', coral:'#FF6B81', sky:'#38B6FF',
  skin:'#FFDCB8', skinLine:'#EBBE95', panel:'#F7F6FF',
  tongue:'#FF8FA3', tongueLine:'#E2647A', tooth:'#FFFFFF', toothLine:'#D9D3F2',
  soft:'#FFE9C8', softLine:'#E8C98A', grid:'#ECEAF6', gridTxt:'#C3BEE0',
  ok:'#22C55E', bad:'#FF5A5F'
};

/* ---------- 极简 SVG 构造器 ---------- */
function _a(attrs) {
  var s = '';
  for (var k in attrs) s += ' ' + k + '="' + attrs[k] + '"';
  return s;
}
function el(tag, attrs) { return '<' + tag + _a(attrs) + '/>'; }
function wrap(tag, attrs, inner) {
  return '<' + tag + _a(attrs) + '>' + (inner || '') + '</' + tag + '>';
}
function txt(x, y, s, size, fill, anchor, weight) {
  return wrap('text', {
    x: x, y: y, 'font-size': size || 12, fill: fill || ILLUS_COLOR.sub,
    'text-anchor': anchor || 'middle', 'font-weight': weight || 600
  }, s);
}
function panel(x, y, w, h) {
  return el('rect', { x: x, y: y, width: w, height: h, rx: 18, fill: ILLUS_COLOR.panel });
}
function badge(x, y, label, fill) {
  return el('circle', { cx: x, cy: y, r: 15, fill: fill || ILLUS_COLOR.brand }) +
    wrap('text', {
      x: x, y: y + 6, 'font-size': 16, fill: '#fff',
      'text-anchor': 'middle', 'font-weight': 800
    }, label);
}
function arrow(x1, y1, x2, y2, color, w, dash) {
  var a = { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, 'stroke-width': w || 2.4, 'stroke-linecap': 'round' };
  if (dash) a['stroke-dasharray'] = dash;
  return el('line', a);
}
function headTri(x, y, dir, color) {
  // dir: 'r' 右 / 'u' 上 / 'd' 下
  var d = dir === 'r' ? 'M0 0 L-9 -5.5 L-9 5.5 Z'
        : dir === 'u' ? 'M0 0 L-5.5 9 L5.5 9 Z'
        : 'M0 0 L-5.5 -9 L5.5 -9 Z';
  return wrap('g', { transform: 'translate(' + x + ',' + y + ')', fill: color }, el('path', { d: d }));
}

/* =========================================================
   1) mouth —— 正面口型对比
   ========================================================= */
function illusMouth(spec) {
  var C = ILLUS_COLOR, s = '';
  var cx = [83, 237], W = 146, X = [10, 164];
  var items = [spec.a, spec.b];

  for (var i = 0; i < 2; i++) {
    var it = items[i] || {}, x = X[i], c = cx[i], shape = it.shape || 'round';
    s += panel(x, 8, W, 110);
    s += el('circle', { cx: c, cy: 56, r: 34, fill: C.skin, stroke: C.skinLine, 'stroke-width': 2 });
    s += el('circle', { cx: c - 13, cy: 48, r: 3.6, fill: '#3B3F5C' });
    s += el('circle', { cx: c + 13, cy: 48, r: 3.6, fill: '#3B3F5C' });
    var my = 74;
    if (shape === 'round') {
      s += el('circle', { cx: c, cy: my, r: 10.5, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 2 });
    } else if (shape === 'flat') {
      s += el('ellipse', { cx: c, cy: my, rx: 17, ry: 5.5, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 2 });
    } else if (shape === 'open') {
      s += el('ellipse', { cx: c, cy: my, rx: 11, ry: 13, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 2 });
    } else if (shape === 'slide') {
      s += el('circle', { cx: c - 17, cy: my, r: 9.5, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 2 });
      s += arrow(c - 4, my, c + 11, my, C.tongueLine, 2.4);
      s += headTri(c + 13, my, 'r', C.tongueLine);
      s += el('circle', { cx: c + 20, cy: my, r: 6, fill: '#FFB3C1', stroke: C.tongueLine, 'stroke-width': 2 });
    }
    s += badge(x + 24, 26, it.label || '', i === 0 ? C.brand : C.sky);
    s += txt(c, 140, it.note || '', 12.5, C.sub);
  }
  return s;
}

/* =========================================================
   2) air —— 送气对比（一张纸片就能看出来）
   ========================================================= */
function illusAir(spec) {
  var C = ILLUS_COLOR, s = '';
  var cx = [83, 237], W = 146, X = [10, 164];
  var items = [spec.a, spec.b];

  for (var i = 0; i < 2; i++) {
    var it = items[i] || {}, x = X[i], c = cx[i], puff = !!it.puff;
    s += panel(x, 8, W, 110);
    s += el('circle', { cx: c, cy: 46, r: 29, fill: C.skin, stroke: C.skinLine, 'stroke-width': 2 });
    s += el('circle', { cx: c - 11, cy: 40, r: 3.2, fill: '#3B3F5C' });
    s += el('circle', { cx: c + 11, cy: 40, r: 3.2, fill: '#3B3F5C' });
    s += el('circle', { cx: c, cy: 58, r: 5, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 1.6 });

    if (puff) {
      for (var k = 0; k < 3; k++) {
        s += wrap('path', {
          d: 'M' + (c - 6 + k * 6) + ' ' + (66 + k * 2) + ' q ' + (3 + k) + ' 8 ' + (1 + k) + ' 14',
          stroke: C.sky, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85
        }, '');
      }
    }
    var px = c - 14, py = 74;
    var rot = puff ? 'rotate(26 ' + (c) + ' ' + py + ')' : '';
    s += wrap('g', { transform: rot },
      el('rect', { x: px, y: py, width: 28, height: 32, rx: 3, fill: '#fff', stroke: '#CFC9F0', 'stroke-width': 2 }));
    s += badge(x + 24, 26, it.label || '', puff ? C.coral : C.brand);
    s += txt(c, 140, it.note || '', 12.5, C.sub);
  }
  return s;
}

/* =========================================================
   3) profile —— 侧面口腔剖面：舌头位置 + 气流出口
   ========================================================= */
function headProfile(cx, cy, opt) {
  var C = ILLUS_COLOR, s = '';
  var tongue = opt.tongue || 'flat', air = opt.air || 'mouth';
  var g = 'translate(' + cx + ',' + cy + ')';
  var inner = '';

  // ---- 头（侧面，朝右）：只保留必要元素，小尺寸下才看得清 ----
  inner += el('circle', { cx: 0, cy: -2, r: 32, fill: C.skin, stroke: C.skinLine, 'stroke-width': 2 });
  inner += el('path', { d: 'M20 -12 L35 -1 L20 6 Z', fill: C.skin, stroke: C.skinLine, 'stroke-width': 2 });
  inner += el('circle', { cx: -27, cy: 0, r: 7, fill: C.skin, stroke: C.skinLine, 'stroke-width': 1.6 });
  inner += el('circle', { cx: -4, cy: -19, r: 2.8, fill: '#3B3F5C' });
  // 上腭弧线
  inner += wrap('path', { d: 'M21 9 Q9 -5 -11 4', stroke: '#CFC9F0', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, '');

  // 舌头（先画白色描边做分离，再画彩色本体）
  var T = {
    flat:  { d: 'M24 16 L4 18 L-10 17', dot: [22, 16] },            // 平舌：舌尖放平
    curl:  { d: 'M24 17 L10 17 L4 7 L-2 5', dot: [3, 6] },          // 翘舌：舌尖卷起
    front: { d: 'M24 17 L14 14 L12 6', dot: [12, 5] },              // 前鼻音：舌尖抵上齿龈
    back:  { d: 'M24 18 L6 18 Q-7 17 -11 5', dot: [-11, 4] },       // 后鼻音：舌根抬起
    lip:   null
  };
  var t = T[tongue];

  if (tongue === 'lip') {
    // f：上齿轻咬下唇
    inner += el('rect', { x: 15, y: 0, width: 13, height: 8, rx: 2, fill: '#fff', stroke: C.toothLine, 'stroke-width': 1.6 });
    inner += el('ellipse', { cx: 26, cy: 14, rx: 9, ry: 5, fill: C.tongue, stroke: C.tongueLine, 'stroke-width': 1.8 });
    inner += el('circle', { cx: 21, cy: 7, r: 2.8, fill: C.sky });
  } else if (t) {
    inner += wrap('path', { d: t.d, stroke: '#FFFFFF', 'stroke-width': 13, fill: 'none', 'stroke-linecap': 'round', opacity: .9 }, '');
    inner += wrap('path', { d: t.d, stroke: C.tongue, 'stroke-width': 8.5, fill: 'none', 'stroke-linecap': 'round' }, '');
    inner += el('circle', { cx: t.dot[0], cy: t.dot[1], r: 4, fill: C.coral, stroke: '#fff', 'stroke-width': 1.6 });
  }

  // 气流出口
  if (air === 'nose') {
    inner += wrap('path', {
      d: 'M-2 -4 Q6 -17 24 -17', stroke: C.sky, 'stroke-width': 2.6, fill: 'none',
      'stroke-dasharray': '5 4', 'stroke-linecap': 'round'
    }, '');
    inner += wrap('g', { transform: 'translate(26,-17)' }, headTri(0, 0, 'r', C.sky));
  } else {
    inner += wrap('g', { transform: 'translate(35,14)' },
      arrow(0, 0, 11, 0, C.sky, 2.6) + headTri(13, 0, 'r', C.sky));
  }
  return wrap('g', { transform: g }, inner);
}

function illusProfile(spec) {
  var C = ILLUS_COLOR, s = '';
  var cx = [83, 237], X = [10, 164];
  var items = [spec.a, spec.b];
  for (var i = 0; i < 2; i++) {
    var it = items[i] || {}, x = X[i], c = cx[i];
    s += panel(x, 8, 146, 110);
    s += headProfile(c - 12, 60, it);
    s += badge(x + 24, 26, it.label || '', i === 0 ? C.brand : C.sky);
    s += txt(c, 140, it.note || '', 12.5, C.sub);
  }
  return s;
}

/* =========================================================
   4) tone —— 声调曲线（五度标记法）
   ========================================================= */
var TONE_Y = { 5: 26, 4: 47, 3: 68, 2: 89, 1: 110 };
var TONE_COLOR = { 1: '#38B6FF', 2: '#22C55E', 3: '#F5A623', 4: '#FF5A5F', 0: '#A29BFE' };
var TONE_NAME = { 1: '一声 ˉ 又高又平', 2: '二声 ˊ 从低往高升', 3: '三声 ˇ 先降再升', 4: '四声 ˋ 从高冲到低', 0: '轻声 又轻又短' };
var TONE_SYM = { 1: 'ˉ', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 0: '' };

function tonePath(t) {
  var X0 = 56, X1 = 276;
  if (t === 1) return 'M' + X0 + ' ' + TONE_Y[5] + ' L' + X1 + ' ' + TONE_Y[5];
  if (t === 2) return 'M' + X0 + ' ' + TONE_Y[2] + ' L' + X1 + ' ' + TONE_Y[5];
  if (t === 3) return 'M' + X0 + ' ' + TONE_Y[2] + ' L136 ' + TONE_Y[1] + ' L' + X1 + ' ' + TONE_Y[4];
  if (t === 4) return 'M' + X0 + ' ' + TONE_Y[5] + ' L' + X1 + ' ' + TONE_Y[1];
  return 'M186 ' + TONE_Y[1] + ' L266 ' + TONE_Y[1];
}

function illusTone(spec) {
  var C = ILLUS_COLOR, s = '', i;
  var X0 = 56, X1 = 276;
  for (i = 5; i >= 1; i--) {
    s += arrow(X0, TONE_Y[i], X1, TONE_Y[i], C.grid, 1.4);
    s += txt(48, TONE_Y[i] + 4, String(i), 10, C.gridTxt, 'end', 600);
  }
  s += txt(X0, 18, '高', 11, C.gridTxt, 'middle', 700);
  s += txt(X0, 126, '低', 11, C.gridTxt, 'middle', 700);

  var legend = [], k;
  if (spec.second && spec.second.length) {
    s += wrap('path', {
      d: tonePath(spec.lines[0][0]), stroke: C.brand2, 'stroke-width': 6,
      fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '9 7'
    }, '');
    s += wrap('path', {
      d: tonePath(spec.second[0]), stroke: C.brand, 'stroke-width': 6.5,
      fill: 'none', 'stroke-linecap': 'round'
    }, '');
    legend = [
      ['本调 ' + TONE_SYM[spec.lines[0][0]] + '（写的时候这样标）', C.brand2, true],
      ['实际读成 ' + TONE_SYM[spec.second[0]] + '（读的时候这样读）', C.brand, false]
    ];
  } else {
    var tones = spec.lines || [];
    for (k = 0; k < tones.length; k++) {
      var tn = Array.isArray(tones[k]) ? tones[k][0] : tones[k];
      s += wrap('path', {
        d: tonePath(tn), stroke: TONE_COLOR[tn], 'stroke-width': 6.5,
        fill: 'none', 'stroke-linecap': 'round'
      }, '');
      legend.push([TONE_NAME[tn], TONE_COLOR[tn], false]);
    }
    if (spec.neutral) {
      s += wrap('path', {
        d: tonePath(0), stroke: TONE_COLOR[0], 'stroke-width': 6.5,
        fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '7 6'
      }, '');
      legend.push(['轻声 · 又轻又短，一带而过', TONE_COLOR[0], true]);
    }
  }
  for (k = 0; k < legend.length; k++) {
    var y = 144 + k * 20;
    s += el('rect', { x: 56, y: y - 9, width: 16, height: 5, rx: 2.5, fill: legend[k][1], opacity: legend[k][2] ? 0.5 : 1 });
    s += txt(80, y, legend[k][0], 12.5, C.sub, 'start', 700);
  }
  return s;
}

/* =========================================================
   5) mark —— 声调标在哪个字母上 / 两点要不要留
   ========================================================= */
var TONE_CH = {
  'ā': 'ˉ', 'ē': 'ˉ', 'ī': 'ˉ', 'ō': 'ˉ', 'ū': 'ˉ', 'ǖ': 'ˉ',
  'á': 'ˊ', 'é': 'ˊ', 'í': 'ˊ', 'ó': 'ˊ', 'ú': 'ˊ', 'ǘ': 'ˊ',
  'ǎ': 'ˇ', 'ě': 'ˇ', 'ǐ': 'ˇ', 'ǒ': 'ˇ', 'ǔ': 'ˇ', 'ǚ': 'ˇ',
  'à': 'ˋ', 'è': 'ˋ', 'ì': 'ˋ', 'ò': 'ˋ', 'ù': 'ˋ', 'ǜ': 'ˋ'
};
function toneMarkOf(word) {
  for (var i = 0; i < word.length; i++) if (TONE_CH[word[i]]) return { mark: TONE_CH[word[i]], at: i };
  return null;
}
/* 用真实笔画画调号（字符 ˇ ˋ 太小，看不清） */
function toneMarkShape(sym, x, y, color, w) {
  var d = {
    'ˉ': 'M' + (x - 13) + ' ' + y + ' L' + (x + 13) + ' ' + y,
    'ˊ': 'M' + (x - 13) + ' ' + (y + 9) + ' L' + (x + 13) + ' ' + (y - 9),
    'ˇ': 'M' + (x - 13) + ' ' + (y - 9) + ' L' + x + ' ' + (y + 7) + ' L' + (x + 13) + ' ' + (y - 9),
    'ˋ': 'M' + (x - 13) + ' ' + (y - 9) + ' L' + (x + 13) + ' ' + (y + 9)
  }[sym];
  if (!d) return '';
  return wrap('path', { d: d, stroke: color, 'stroke-width': w || 5.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, '');
}

function illusMark(spec) {
  var C = ILLUS_COLOR, s = '';
  var letters = String(spec.word || '').split('');
  var n = letters.length, w = 56, h = 62, gap = 12;
  var total = n * w + (n - 1) * gap, x0 = (320 - total) / 2, y0 = 40;
  var on = typeof spec.on === 'number' ? spec.on : n - 1;
  var tm = toneMarkOf(String(spec.result || ''));

  for (var i = 0; i < n; i++) {
    var bx = x0 + i * (w + gap), hit = (i === on);
    s += el('rect', {
      x: bx, y: y0, width: w, height: h, rx: 14,
      fill: hit ? '#F6F4FF' : '#fff', stroke: hit ? C.brand : C.grid,
      'stroke-width': hit ? 3 : 2
    });
    s += txt(bx + w / 2, y0 + 42, letters[i], 34, hit ? C.brand : C.sub, 'middle', 800);
    if (hit) {
      if (spec.strip) {
        s += el('circle', { cx: bx + w / 2 - 9, cy: y0 - 12, r: 4, fill: C.coral });
        s += el('circle', { cx: bx + w / 2 + 9, cy: y0 - 12, r: 4, fill: C.coral });
        s += arrow(bx + w / 2 - 17, y0 - 22, bx + w / 2 + 17, y0 - 2, C.bad, 3);
      } else if (tm) {
        s += toneMarkShape(tm.mark, bx + w / 2, y0 - 12, C.brand, 5.5);
        s += headTri(bx + w / 2, y0 + 4, 'd', C.brand);
      }
    }
  }
  var note = spec.note || '';
  s += txt(160, 124, note, 12.5, C.sub);
  if (spec.result) {
    s += el('circle', { cx: 74, cy: 152, r: 11, fill: C.ok });
    s += wrap('path', { d: 'M68.5 152 L72.5 156 L80 148', stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, '');
    s += txt(96, 159, '正确写法  ' + spec.result, 20, C.ink, 'start', 800);
  }
  return s;
}

/* =========================================================
   6) build —— 「这样拼是错的」 vs 「整个读出来」
   ========================================================= */
function illusBuild(spec) {
  var C = ILLUS_COLOR, s = '', i;
  var parts = spec.wrong || [];
  var n = parts.length, bw = 48, bh = 52, gap = 12, plus = 18;
  var total = n * bw + (n - 1) * (gap + plus);
  var x0 = (320 - total) / 2, y0 = 36;
  var cur = x0;

  s += txt(160, 18, '不要这样分开拼', 13, C.bad, 'middle', 800);
  for (i = 0; i < n; i++) {
    s += el('rect', { x: cur, y: y0, width: bw, height: bh, rx: 12, fill: '#FFF1F2', stroke: '#FFC9CE', 'stroke-width': 2 });
    s += txt(cur + bw / 2, y0 + 36, parts[i], 26, C.coral, 'middle', 800);
    cur += bw;
    if (i < n - 1) {
      s += txt(cur + plus / 2 + gap / 2, y0 + 36, '+', 20, C.gridTxt, 'middle', 800);
      cur += gap + plus;
    }
  }
  var cross = cur + 26;
  s += el('circle', { cx: Math.min(cross, 300), cy: y0 + bh / 2, r: 14, fill: C.bad });
  s += wrap('path', {
    d: 'M' + (Math.min(cross, 300) - 6) + ' ' + (y0 + bh / 2 - 6) + ' L' + (Math.min(cross, 300) + 6) + ' ' + (y0 + bh / 2 + 6) +
       ' M' + (Math.min(cross, 300) + 6) + ' ' + (y0 + bh / 2 - 6) + ' L' + (Math.min(cross, 300) - 6) + ' ' + (y0 + bh / 2 + 6),
    stroke: '#fff', 'stroke-width': 3.4, 'stroke-linecap': 'round'
  }, '');

  s += arrow(160, 92, 160, 104, C.gridTxt, 2.4, '5 4');
  s += headTri(160, 108, 'd', C.gridTxt);
  s += txt(160, 126, '要整个读出来', 13, C.mint, 'middle', 800);

  var rw = String(spec.right || '').length * 17 + 44;
  s += el('rect', { x: 160 - rw / 2, y: 134, width: rw, height: 32, rx: 16, fill: '#E9FBF7', stroke: '#B8EFE4', 'stroke-width': 2 });
  s += txt(160, 156, spec.right || '', 21, '#0F9E88', 'middle', 800);
  return s;
}

/* ---------- 总入口 ---------- */
function renderIllustration(spec) {
  if (!spec || !spec.type) return '';
  var body = '';
  try {
    if (spec.type === 'mouth') body = illusMouth(spec);
    else if (spec.type === 'air') body = illusAir(spec);
    else if (spec.type === 'profile') body = illusProfile(spec);
    else if (spec.type === 'tone') body = illusTone(spec);
    else if (spec.type === 'mark') body = illusMark(spec);
    else if (spec.type === 'build') body = illusBuild(spec);
  } catch (e) {
    // 图解生成失败不能让孩子看到空白：记日志 + 返回空串，由页面降级为纯文字讲解
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[图解生成失败] type=' + spec.type, e);
    }
    return '';
  }
  if (!body) return '';
  return '<svg class="illus" viewBox="0 0 320 168" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="知识点示意图">' +
    body + '</svg>';
}
