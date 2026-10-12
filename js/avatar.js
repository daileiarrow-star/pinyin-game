/* =========================================================
   拼音小达人 — 全身像换装系统（插画风）
   ---------------------------------------------------------
   纯 SVG 手绘风：渐变皮肤、分层头发、腮红、高光、描边。
   男孩 / 女孩两套发型；初始穿搭为白 T 恤 + 短裤。
   穿上的装备会真的出现在全身像上。

   槽位（13 个）：
     hat 帽子 / eyes 眼镜墨镜 / ear 耳饰 / neck 项链围巾 /
     wrist 手表手环 / top 上衣 / cape 披风 / bottom 裤子裙子 /
     shoes 鞋 / back 背包翅膀 / hand 手持 / pet 宠物 / vehicle 载具

   每件装备画在「以 0,0 为中心」的局部坐标，
   由 Avatar.svg() 摆到身体对应锚点；衣柜格子用
   Avatar.itemIcon() 把同一份画放大居中展示。
   ========================================================= */

var AV = {
  skinLine: '#D9A87E', hairLine: '#2E2018',
  ink: '#22243A', line: '#C9C2E8',
  blush: '#FFA8B8', white: '#FFFFFF', brand: '#6C5CE7'
};

/* ---------- SVG 小工具 ---------- */
function _p(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '" ' + (extra || '') + '/>'; }
function _s(d, stroke, sw, extra) {
  return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (sw || 2) +
    '" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '/>';
}
function _c(cx, cy, r, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
function _e(cx, cy, rx, ry, fill, extra) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
function _r(x, y, w, h, rx, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '" ' + (extra || '') + '/>'; }
function _g(t, inner) { return '<g transform="' + t + '">' + inner + '</g>'; }
/* 任意属性的分组（如 filter=...） */
function _ga(attrs, inner) { return '<g ' + attrs + '>' + inner + '</g>'; }
function _bold(fill, line, w) { return 'stroke="' + line + '" stroke-width="' + (w || 2.2) + '" stroke-linejoin="round"'; }
function _star(cx, cy, r, fill, line, sw) {
  var pts = [];
  for (var i = 0; i < 10; i++) {
    var a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2) ? r * 0.44 : r;
    pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
  }
  return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"' + (line ? ' stroke="' + line + '" stroke-width="' + (sw || 1.6) + '" stroke-linejoin="round"' : '') + '/>';
}
function _heart(cx, cy, r, fill, line, sw) {
  return _p('M' + cx + ' ' + (cy + r * 0.85) + ' C' + (cx - r * 1.5) + ' ' + (cy - r * 0.2) + ' ' + (cx - r * 0.55) + ' ' + (cy - r * 1.15) + ' ' +
    cx + ' ' + (cy - r * 0.35) + ' C' + (cx + r * 0.55) + ' ' + (cy - r * 1.15) + ' ' + (cx + r * 1.5) + ' ' + (cy - r * 0.2) + ' ' + cx + ' ' + (cy + r * 0.85) + ' Z',
    fill, line ? _bold('', line, sw || 1.6) : '');
}

/* 一双鞋：fill 鞋面 / line 描边 / sole 鞋底 */
function _shoePair(fill, line, sole) {
  function one(x) {
    return _g('translate(' + x + ',0)',
      _p('M-9 -13 Q0 -15 9 -13 L10 3 Q17 5 18 11 Q19 16 13 16 L-9 16 Q-13 16 -13 11 Z', fill, _bold('', line, 2.3)) +
      _p('M-13 9 Q-2 12 18 10 Q19 15 13 16 L-9 16 Q-13 16 -13 11 Z', sole || line, '') +
      _s('M-7 -9 Q0 -11 8 -9', '#FFFFFF', 1.6, 'opacity=".7"'));
  }
  return one(-11.5) + one(11.5);
}

/* 渐变 id 前缀（同一页面上多个 SVG，必须各用各的 id） */
var __pv = 0;
function _uid() { __pv++; return 'av' + __pv + 'x'; }

/* ---------- 皮肤 / 头发 渐变 + 柔和阴影 ---------- */
function _defs(P, gender) {
  return '<defs>' +
    '<linearGradient id="' + P + 'sk" x1="0.15" y1="0" x2="0.5" y2="1">' +
    '<stop offset="0" stop-color="#FFEDD9"/><stop offset=".55" stop-color="#FBDDBD"/><stop offset="1" stop-color="#F3C298"/></linearGradient>' +
    '<linearGradient id="' + P + 'hr" x1="0.1" y1="0" x2="0.4" y2="1">' +
    '<stop offset="0" stop-color="' + (gender === 'girl' ? '#7A5240' : '#63483A') + '"/>' +
    '<stop offset="1" stop-color="#2B1D16"/></linearGradient>' +
    '<radialGradient id="' + P + 'bl"><stop offset="0" stop-color="#FFA3B4" stop-opacity=".75"/>' +
    '<stop offset="1" stop-color="#FFA3B4" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + P + 'gl"><stop offset="0" stop-color="#FFF6D8" stop-opacity=".9"/>' +
    '<stop offset="1" stop-color="#FFF6D8" stop-opacity="0"/></radialGradient>' +
    '<filter id="' + P + 'sf" x="-40%" y="-30%" width="180%" height="170%">' +
    '<feDropShadow dx="0" dy="2.6" stdDeviation="2.6" flood-color="#5B4FBF" flood-opacity=".18"/></filter>' +
    '</defs>';
}

/* ---------- 身体（插画风）---------- */
function _body(gender, P, worn) {
  var sk = 'url(#' + P + 'sk)', hz = 'url(#' + P + 'hr)';
  var sl = AV.skinLine, hl = AV.hairLine;
  var ink = AV.ink;
  var s = '';

  // 地面阴影
  s += _e(80, 245, 33, 5.5, 'rgba(108,92,231,.13)');

  // 腿（带膝盖阴影）
  function leg(x) {
    return _p('M' + x + ' 164 Q' + x + ' 196 ' + (x + 0.6) + ' 214 Q' + (x + 0.6) + ' 221 ' + (x + 7) + ' 221 Q' + (x + 13.4) + ' 221 ' + (x + 13.4) + ' 214 Q' + (x + 14) + ' 196 ' + (x + 14) + ' 164 Z',
      sk, _bold('', sl, 2));
  }
  s += leg(64) + leg(82);

  // 鞋 → 裤子 → 手臂+手 → 上衣
  s += _at('shoes', _part(worn, 'shoes'));
  s += _at('bottom', _part(worn, 'bottom'));
  s += _arm(-1, P) + _arm(1, P) + _at('top', _part(worn, 'top'));

  // 脖子
  s += _p('M73 66 L87 66 L87 84 Q80 90 73 84 Z', sk, _bold('', sl, 2));
  s += _p('M73 66 L87 66 L87 74 Q80 79 73 74 Z', 'rgba(190,140,100,.28)');

  // 耳（画在头后）
  s += _e(53, 58, 6.6, 8.2, sk, _bold('', sl, 2));
  s += _e(107, 58, 6.6, 8.2, sk, _bold('', sl, 2));

  // 后发
  s += _hairBack(gender, hz, hl);

  // 头
  s += _e(80, 48, 28.6, 29, sk, _bold('', sl, 2.3));
  // 额头高光
  s += _e(70, 32, 13, 8, 'url(#' + P + 'gl)');
  // 腮红
  s += _c(62.5, 57, 8.4, 'url(#' + P + 'bl)');
  s += _c(97.5, 57, 8.4, 'url(#' + P + 'bl)');

  // 眉毛
  s += _s('M62.5 39.5 Q69 36.2 74.5 39.5', hl, gender === 'girl' ? 1.9 : 2.4);
  s += _s('M85.5 39.5 Q91 36.2 97.5 39.5', hl, gender === 'girl' ? 1.9 : 2.4);

  // 眼睛（卡通大眼 + 高光）
  function eye(cx) {
    return _e(cx, 48.5, 5.4, 6.6, '#2B2F4A') +
      _c(cx + 1.7, 45.9, 2, '#FFFFFF') + _c(cx - 1.6, 50.6, 1.1, 'rgba(255,255,255,.55)');
  }
  s += eye(69) + eye(91);
  if (gender === 'girl') {
    s += _s('M62.8 42.6 Q69 38.6 75.6 42.4', hl, 2.1);
    s += _s('M84.4 42.4 Q91 38.6 97.2 42.6', hl, 2.1);
    s += _s('M62.6 52.4 Q60.4 55.6 62.2 58.6', hl, 1.3);
    s += _s('M97.4 52.4 Q99.6 55.6 97.8 58.6', hl, 1.3);
  }
  // 鼻子 + 嘴
  s += _s('M80 52.5 Q81.6 55 79.8 55.6', sl, 1.7);
  s += _p('M71.5 60.5 Q80 69.5 88.5 60.5 Q80 64.8 71.5 60.5 Z', '#E4657C');
  s += _p('M73.4 61.9 Q80 66.4 86.6 61.9 Q80 64.2 73.4 61.9 Z', '#fff', 'opacity=".92"');

  // 前发
  s += _hairFront(gender, hz, hl);

  // 耳饰 → 项链 → 手表
  var ear = _part(worn, 'ear'); if (ear) s += _at('ear', ear);
  var nk = _part(worn, 'neck'); if (nk) s += _at('neck', nk);
  var wr = _part(worn, 'wrist'); if (wr) s += _at('wrist', wr);

  // 眼镜 → 帽子 → 手持
  var ey = _part(worn, 'eyes'); if (ey) s += _at('eyes', ey);
  var ht = _part(worn, 'hat'); if (ht) s += _at('hat', ht);
  var hd = _part(worn, 'hand'); if (hd) s += _at('hand', hd);

  // 载具 → 宠物（最上层，站在小朋友旁边）
  var vh = _part(worn, 'vehicle'); if (vh) s += _at('vehicle', vh);
  var pt = _part(worn, 'pet'); if (pt) s += _at('pet', pt);

  return s;
}

/* 手臂 + 手（先画左臂，右臂镜像；dir 仅用于手部装饰定位）
   ★ 上端是圆肩帽，整段收进上衣袖子轮廓内侧（肩角 x≈54→袖口 x≈50 那条线），
     手臂从袖口以下才露出来 —— 否则会在肩角外戳出尖楔形的皮肤 */
function _arm(dir, P) {
  var sk = 'url(#' + P + 'sk)';
  var left = _p('M59 96 C61.8 118 61.8 136 61.5 145 Q61 157 56.5 157 Q52.4 157 52.6 145 C50.5 136 49.6 124 51 114 C52 106 53 101 55.5 98 Q57 96.4 59 96 Z', sk, _bold('', AV.skinLine, 2)) +
    _c(56.8, 154.5, 6.8, sk, _bold('', AV.skinLine, 2)) +
    _s('M53.5 152 Q56.8 149.5 60 152', AV.skinLine, 1.4, 'opacity=".55"');
  if (dir < 0) return left;
  return _g('translate(160,0) scale(-1,1)', left);
}

/* ---------- 头发 ---------- */
function _hairBack(gender, hz, hl) {
  if (gender !== 'girl') return '';
  // 后脑长发
  var s = _p('M50 46 Q44 16 80 14 Q116 16 110 46 Q115 80 106 99 Q96 106 80 106 Q64 106 54 99 Q45 80 50 46 Z', hz, _bold('', hl, 2));
  // 双马尾（垂在肩前）
  s += _p('M57 54 Q40 60 33 84 Q28 108 40 116 Q52 122 55 100 Q57 74 63 62 Z', hz, _bold('', hl, 2));
  s += _p('M103 54 Q120 60 127 84 Q132 108 120 116 Q108 122 105 100 Q103 74 97 62 Z', hz, _bold('', hl, 2));
  // 马尾高光
  s += _s('M38 84 Q34 100 41 110', '#FFFFFF', 2.4, 'opacity=".18"');
  s += _s('M122 84 Q126 100 119 110', '#FFFFFF', 2.4, 'opacity=".18"');
  // 发圈蝴蝶结
  s += _c(44, 70, 6, '#FF8FB1', _bold('', '#E2647A', 1.8));
  s += _c(116, 70, 6, '#FF8FB1', _bold('', '#E2647A', 1.8));
  return s;
}
function _hairFront(gender, hz, hl) {
  if (gender === 'girl') {
    return _p('M51.5 47 Q48 16 80 15 Q112 16 108.5 47 Q104 33 96 39 Q90 26 76 33 Q63 39 51.5 47 Z', hz, _bold('', hl, 2)) +
      _s('M96 39 Q93 28 84 27', '#FFFFFF', 1.6, 'opacity=".22"') +
      // 刘海上的小发夹
      _p('M58 33 L67 29 L66 34 Z', '#FFC93C', _bold('', '#E0A51F', 1.4));
  }
  return _p('M51.5 46 Q48 16 80 15 Q112 16 108.5 46 Q102 34 94 37 Q88 25 73 31 Q60 36 51.5 46 Z', hz, _bold('', hl, 2)) +
    _s('M94 37 Q91 26 82 25', '#FFFFFF', 1.6, 'opacity=".22"') +
    _p('M80 15 Q88 24 84 30 Q79 34 76 27 Q74 20 80 15 Z', hz);
}

/* ---------- 装备图形库（全部 0,0 居中）---------- */
var AV_ART = {
/* __ART_BASE__ */
  /* ===== 默认穿搭：白 T 恤 + 短裤 + 白鞋 ===== */
  top_white: function () {
    return _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 26 Q0 30 -19 26 L-19 2 Q-22 -3 -30 -6 Z',
        '#FFFFFF', _bold('', '#CFC8EC', 2.4)) +
      _s('M-12 -28 Q0 -20 12 -28', '#DED9F3', 2.6) +
      _p('M-19 12 Q0 16 19 12 L19 26 Q0 30 -19 26 Z', '#F4F2FE', 'opacity=".9"');
  },
  /* 单只鞋（默认白鞋 / 运动鞋共用骨架）*/
  shoe_base: function () { return _shoePair('#FFFFFF', '#CFC8EC', '#EDEAFB'); },

  /* 默认短裤（牛仔蓝）*/
  bot_short: function () {
    return _p('M-21 -16 Q0 -19 21 -16 L23 4 Q17 7 14 12 L4 12 L0 1 L-4 12 L-14 12 Q-17 7 -23 4 Z',
        '#5B8DEF', _bold('', '#3F6FC4', 2.4)) +
      _r(-21, -16, 42, 6, 3, '#85ADF6') +
      _s('M-8 12 L-8 3', '#3F6FC4', 1.6, 'opacity=".5"') +
      _s('M8 12 L8 3', '#3F6FC4', 1.6, 'opacity=".5"');
  },

/* __ART_HAT__ */
  /* ===== 帽子（帽檐贴着头顶：局部 y≈+8 是发际线）===== */
  hat_cap: function () {
    return _p('M-25 2 Q-25 -24 0 -24 Q25 -24 25 2 Z', '#6C5CE7', _bold('', '#4E41B8', 2.4)) +
      _p('M-25 2 Q-12 6 0 6 Q12 6 25 2 Q14 -4 0 -4 Q-14 -4 -25 2 Z', '#8577EE', _bold('', '#4E41B8', 2)) +
      _p('M14 -18 Q30 -12 30 2 Q30 6 26 6 Q28 -8 14 -18 Z', '#4E41B8') +
      _c(0, -14, 3.4, '#FFFFFF', 'opacity=".85"');
  },
  hat_bow: function () {
    return _s('M-24 4 Q0 -8 24 4', '#FF8FB1', 5, 'opacity=".95"') +
      _g('translate(0,-4)', _p('M-16 -8 Q-22 -16 -12 -15 Q-6 -14 -4 -6 Q-10 -2 -16 -8 Z', '#FF9EC4', _bold('', '#E2647A', 2)) +
        _p('M16 -8 Q22 -16 12 -15 Q6 -14 4 -6 Q10 -2 16 -8 Z', '#FF9EC4', _bold('', '#E2647A', 2)) +
        _c(0, -8, 4.4, '#FFB7D0', _bold('', '#E2647A', 1.8)));
  },
  hat_beanie: function () {
    return _p('M-24 6 Q-24 -22 0 -22 Q24 -22 24 6 Z', '#5B8DEF', _bold('', '#3F6FC4', 2.4)) +
      _r(-25, 0, 50, 9, 4.5, '#85ADF6', _bold('', '#3F6FC4', 2)) +
      _c(0, -24, 6.5, '#FFD166', _bold('', '#E0A51F', 2)) +
      _s('M-16 -12 Q0 -18 16 -12', '#FFFFFF', 1.8, 'opacity=".35"');
  },
  hat_sun: function () {
    return _p('M-20 -4 Q-20 -24 0 -24 Q20 -24 20 -4 Z', '#FFE29A', _bold('', '#E0A51F', 2.2)) +
      _e(0, 0, 36, 9, '#FFD166', _bold('', '#E0A51F', 2.4)) +
      _s('M-20 -10 Q0 -3 20 -10', '#E0A51F', 2, 'opacity=".6"') +
      _c(-11, -17, 3.6, '#FF8FB1', _bold('', '#E2647A', 1.5)) +
      _c(11, -17, 3.6, '#FF8FB1', _bold('', '#E2647A', 1.5));
  },
  hat_flower: function () {
    function fl(x, y, r, c) {
      var s = '';
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
        s += _c(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.78, c, _bold('', 'rgba(0,0,0,.12)', 1.2));
      }
      return s + _c(x, y, r * 0.62, '#FFE08A');
    }
    return _s('M-26 2 Q0 -10 26 2', '#7BC96F', 4.5) +
      fl(-24, -2, 5, '#FF9EC4') + fl(-8, -8, 5.6, '#FFD166') +
      fl(8, -8, 5.6, '#FF9EC4') + fl(24, -2, 5, '#FFD166');
  },
  hat_cowboy: function () {
    return _p('M-14 -20 Q-14 -30 0 -30 Q14 -30 14 -20 L14 -2 L-14 -2 Z', '#C98F5A', _bold('', '#9C6A3C', 2.2)) +
      _e(0, 0, 34, 8, '#D9A268', _bold('', '#9C6A3C', 2.4)) +
      _p('M-14 -14 Q0 -8 14 -14 L14 -9 Q0 -3 -14 -9 Z', '#A5713F', 'opacity=".85"');
  },
  hat_pirate: function () {
    return _p('M-30 2 Q-24 -22 0 -22 Q24 -22 30 2 Q14 -6 0 -6 Q-14 -6 -30 2 Z', '#2B2F4A', _bold('', '#191C30', 2.4)) +
      _p('M-30 2 Q0 14 30 2 Q14 8 0 8 Q-14 8 -30 2 Z', '#3B3F5C', _bold('', '#191C30', 2)) +
      _c(0, -14, 5.2, '#FFFFFF') + _c(-1.8, -14.5, 1.5, '#2B2F4A') + _c(1.8, -14.5, 1.5, '#2B2F4A') +
      _s('M-3 -10 Q0 -7 3 -10', '#2B2F4A', 1.6) + _s('M-4 -19 L4 -19', '#FFFFFF', 2.4);
  },
  hat_crown: function () {
    return _p('M-22 4 L-22 -16 L-11 -7 L0 -19 L11 -7 L22 -16 L22 4 Z', '#FFC93C', _bold('', '#E0A51F', 2.4)) +
      _r(-22, 2, 44, 7, 3, '#FFD966', _bold('', '#E0A51F', 2)) +
      _c(0, 5.5, 2.8, '#FF6B81') +
      _c(-22, -18, 2.2, '#8EC9FF') + _c(0, -21, 2.2, '#FF6B81') + _c(22, -18, 2.2, '#8EC9FF');
  },
  hat_wizard: function () {
    return _p('M-20 4 Q-4 -6 0 -36 Q4 -6 20 4 Q0 10 -20 4 Z', '#6C5CE7', _bold('', '#4E41B8', 2.4)) +
      _e(0, 6, 24, 5.5, '#8577EE', _bold('', '#4E41B8', 2.2)) +
      _star(2, -14, 6.5, '#FFD166', '#E0A51F', 1.6) +
      _c(-9, 1, 2, '#FFD166') + _c(11, -2, 1.7, '#8EC9FF');
  },

/* __ART_EYES__ */
  /* ===== 眼镜 / 墨镜（镜片中心在局部 ±11,0）===== */
  eye_round: function () {
    function lens(x) {
      return _c(x, 0, 9.4, 'rgba(214,240,255,.5)', _bold('', '#4E41B8', 2.6)) +
        _s('M' + (x - 5) + ' -4.5 Q' + x + ' -9.5 ' + (x + 5) + ' -4.5', '#FFFFFF', 2, 'opacity=".85"');
    }
    return lens(-11) + lens(11) +
      _s('M-2.4 0 L2.4 0', '#4E41B8', 2.6) +
      _s('M-20.4 -1 L-27 -4', '#4E41B8', 2.4) + _s('M20.4 -1 L27 -4', '#4E41B8', 2.4);
  },
  eye_sport: function () {
    return _p('M-24 -8 L24 -8 L20 8 Q11 12 3 7 L0 4 L-3 7 Q-11 12 -20 8 Z',
        'rgba(140,200,255,.42)', _bold('', '#2E7BC4', 2.6)) +
      _s('M-18 -4 L-8 -4', '#FFFFFF', 2.2, 'opacity=".8"') +
      _s('M-27 -8 L27 -8', '#2E7BC4', 3) +
      _s('M-24 -8 L-28 -3 M24 -8 L28 -3', '#2E7BC4', 2.4);
  },
  eye_sun: function () {
    return _p('M-22 -7 L22 -7 L18 6 Q10 10 3 6 L0 3 L-3 6 Q-10 10 -18 6 Z', '#3B3F5C', _bold('', '#191C30', 2.2)) +
      _s('M-18 -4 L-8 -4', '#8E93B8', 2.4) + _s('M8 -4 L18 -4', '#8E93B8', 2.4) +
      _s('M-25 -7 L25 -7', '#191C30', 3);
  },
  eye_pixel: function () {
    function px(x) {
      return _r(x - 9, -8, 18, 15, 3, '#22243A') +
        _r(x - 6, -5, 5, 4, 1, '#7BE0FF') + _r(x + 1, -5, 5, 4, 1, '#7BE0FF') +
        _r(x - 6, 2, 11, 3, 1, '#4FC3F7');
    }
    return px(-11) + px(11) + _r(-3, -3, 6, 5, 1, '#22243A');
  },
  eye_star: function () {
    return _star(-11, -1, 10.5, '#FFD166', '#E0A51F', 1.8) +
      _star(11, -1, 10.5, '#FFD166', '#E0A51F', 1.8) +
      _c(-11, -2, 2.2, '#FFF6D8') + _c(11, -2, 2.2, '#FFF6D8') +
      _s('M-2.5 -1 L2.5 -1', '#E0A51F', 2.4);
  },
  eye_heart: function () {
    return _heart(-11, 0, 10, '#FF7EA0', '#E2557D', 2) +
      _heart(11, 0, 10, '#FF7EA0', '#E2557D', 2) +
      _c(-13, -3, 2, '#FFD3DE') + _c(9, -3, 2, '#FFD3DE') +
      _s('M-2.5 0 L2.5 0', '#E2557D', 2.4);
  },
  eye_rainbow: function () {
    function lens(x, c) { return _c(x, 0, 9.2, c, _bold('', '#191C30', 2.2)); }
    return lens(-11, '#FF8FA3') + lens(11, '#7EDDC0') +
      _e(-11, -3, 4.5, 3, '#FFFFFF', 'opacity=".55"') + _e(11, -3, 4.5, 3, '#FFFFFF', 'opacity=".55"') +
      _s('M-2.4 0 L2.4 0', '#191C30', 2.6) + _s('M-25 -7 L25 -7', '#191C30', 3);
  },

/* __ART_EAR__ */
  /* ===== 耳饰（耳朵在局部 ±27）===== */
  ear_star: function () {
    return _star(-28, 3, 5, '#FFD166', '#E0A51F', 1.4) + _star(28, 3, 5, '#FFD166', '#E0A51F', 1.4);
  },
  ear_bell: function () {
    function one(x) {
      return _s('M' + x + ' -3 L' + x + ' 2', '#C9A227', 1.6) +
        _p('M' + (x - 5) + ' 2 Q' + x + ' -3 ' + (x + 5) + ' 2 L' + (x + 4) + ' 8 Q' + x + ' 10 ' + (x - 4) + ' 8 Z', '#FFD166', _bold('', '#C9A227', 1.8)) +
        _c(x, 10, 2, '#C9A227');
    }
    return one(-28) + one(28);
  },
  ear_heart: function () {
    return _heart(-28, 5, 5.5, '#FF7EA0', '#E2557D', 1.5) + _heart(28, 5, 5.5, '#FF7EA0', '#E2557D', 1.5);
  },
  ear_pearl: function () {
    return _c(-28, 4, 5, '#FFF6FA', _bold('', '#E7D3DE', 1.6)) +
      _c(28, 4, 5, '#FFF6FA', _bold('', '#E7D3DE', 1.6)) +
      _c(-29.5, 2.4, 1.7, '#FFFFFF') + _c(26.5, 2.4, 1.7, '#FFFFFF');
  },

/* __ART_NECK__ */
  /* ===== 项链 / 围巾（脖子底部，局部 0,0 在颈根）===== */
  neck_scarf: function () {
    return _p('M-17 -4 Q0 2 17 -4 L19 4 Q0 11 -19 4 Z', '#FF6B81', _bold('', '#E2557D', 2.2)) +
      _p('M4 4 L14 22 L4 26 L-2 8 Z', '#FF8FA3', _bold('', '#E2557D', 2)) +
      _s('M-12 -2 Q0 3 12 -2', '#FFD3DE', 1.6, 'opacity=".8"');
  },
  neck_heart: function () {
    return _s('M-14 -6 Q0 2 14 -6', '#C9A227', 2.2) +
      _heart(0, 8, 7.5, '#FF7EA0', '#E2557D', 1.8);
  },
  neck_pearl: function () {
    var s = _s('M-15 -6 Q0 3 15 -6', '#F3E3EA', 2);
    [-14, -10, -6, -2, 2, 6, 10, 14].forEach(function (x, i) {
      s += _c(x, -6 + Math.sin((i / 7) * Math.PI) * 8, 3.1, '#FFF6FA', _bold('', '#E7D3DE', 1.3));
    });
    return s;
  },
  neck_gold: function () {
    return _s('M-15 -6 Q0 4 15 -6', '#E8B93B', 4) +
      _s('M-15 -6 Q0 4 15 -6', '#FFF0B8', 1.4, 'opacity=".8"') +
      _c(0, 7, 4.6, '#FFD166', _bold('', '#C9A227', 1.8));
  },
  neck_gem: function () {
    return _s('M-15 -6 Q0 3 15 -6', '#C9A227', 2.2) +
      _p('M-8 4 L8 4 L11 10 L0 22 L-11 10 Z', '#8EC9FF', _bold('', '#5FA6E8', 2)) +
      _p('M-8 4 L0 22 L-11 10 Z', 'rgba(255,255,255,.4)') +
      _star(0, 11, 3.4, '#FFFFFF', '', 0);
  },

/* __ART_WRIST__ */
  /* ===== 手表 / 手环（手腕在局部 ±23, +7）===== */
  wrist_band: function () {
    function one(x) { return _r(x - 7, 1, 14, 11, 5, '#7EDDC0', _bold('', '#4FB89B', 2)); }
    return one(-23) + one(23);
  },
  wrist_kid: function () {
    function one(x) {
      return _r(x - 7, 1, 14, 11, 4, '#FF9F43', _bold('', '#E0821F', 1.8)) +
        _c(x, 6.5, 5.4, '#FFF6E5', _bold('', '#E0821F', 1.8)) +
        _s('M' + (x - 2) + ' 6.5 L' + x + ' 4 L' + (x + 2) + ' 6.5 L' + x + ' 9 Z', '#E0821F', 1.4);
    }
    return one(-23) + one(23);
  },
  wrist_sport: function () {
    function one(x) {
      return _r(x - 8, 0.5, 16, 12, 5, '#2B2F4A', _bold('', '#191C30', 1.8)) +
        _r(x - 4, 3, 8, 7, 3, '#7BE0FF') + _r(x - 2.5, 4.5, 3, 3, 1, '#FFFFFF');
    }
    return one(-23) + one(23);
  },
  wrist_gold: function () {
    function one(x) {
      return _s('M' + (x - 7) + ' 1 Q' + x + ' 4 ' + (x + 7) + ' 1', '#E8B93B', 4.5) +
        _r(x - 6, 3.5, 12, 7, 2.5, '#FFF6E5', _bold('', '#C9A227', 1.8)) +
        _c(x, 7, 1.6, '#FF6B81');
    }
    return one(-23) + one(23);
  },

/* __ART_TOP__ */
  /* ===== 上衣（肩线 y≈-28，衣摆 y≈+28）===== */
  top_tank: function () {
    return _p('M-20 -24 L-11 -28 L11 -28 L20 -24 L22 26 Q0 30 -22 26 Z', '#7EDDC0', _bold('', '#4FB89B', 2.4)) +
      _s('M-11 -28 Q0 -21 11 -28', '#4FB89B', 2.4) +
      _star(0, 4, 8, '#FFFFFF', '', 0);
  },
  top_stripe: function () {
    var s = _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 26 Q0 30 -19 26 L-19 2 Q-22 -3 -30 -6 Z',
      '#7EDDC0', _bold('', '#4FB89B', 2.4));
    [-14, -4, 6, 16].forEach(function (y) {
      s += _p('M-19.5 ' + y + ' L19.5 ' + y + ' L19.5 ' + (y + 5) + ' L-19.5 ' + (y + 5) + ' Z', '#FFFFFF', 'opacity=".88"');
    });
    return s + _s('M-12 -28 Q0 -20 12 -28', '#4FB89B', 2.6);
  },
  top_star: function () {
    return _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 26 Q0 30 -19 26 L-19 2 Q-22 -3 -30 -6 Z',
        '#5B8DEF', _bold('', '#3F6FC4', 2.4)) +
      _r(-19, 22, 38, 4.5, 2, '#FFFFFF', 'opacity=".92"') +
      _star(0, 2, 11, '#FFC93C', '#E0A51F', 1.8) +
      _s('M-12 -28 Q0 -20 12 -28', '#3F6FC4', 2.6);
  },
  top_sweater: function () {
    return _p('M-27 -21 Q-19 -28 -12 -28 L12 -28 Q19 -28 27 -21 L31 -4 Q23 -1 20 4 L20 27 Q0 31 -20 27 L-20 4 Q-23 -1 -31 -4 Z',
        '#FF9F6E', _bold('', '#E07B45', 2.4)) +
      _s('M-20 2 Q0 8 20 2', '#E07B45', 2) +
      _s('M-12 -28 Q0 -20 12 -28', '#FFD9BE', 3) +
      _s('M-14 10 L-14 24', '#FFC9A6', 2) + _s('M-6 12 L-6 26', '#FFC9A6', 2) +
      _s('M2 12 L2 26', '#FFC9A6', 2) + _s('M10 10 L10 24', '#FFC9A6', 2);
  },
  top_hoodie: function () {
    return _p('M-27 -22 Q-19 -29 -13 -29 L13 -29 Q19 -29 27 -22 L31 18 Q23 21 20 26 L20 30 Q0 34 -20 30 L-20 26 Q-23 21 -31 18 Z',
        '#FF8FA3', _bold('', '#E2647A', 2.4)) +
      _p('M-15 -29 Q0 -13 15 -29 Q9 -20 0 -20 Q-9 -20 -15 -29 Z', '#FFB3C1', _bold('', '#E2647A', 2)) +
      _s('M-6 -18 L-4 -8 M6 -18 L4 -8', '#E2647A', 2.2) + _c(-4, -7, 2, '#FFD166') + _c(4, -7, 2, '#FFD166') +
      _r(-11, 12, 22, 12, 5, '#FFB3C1', _bold('', '#E2647A', 1.8));
  },
  top_sailor: function () {
    return _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 26 Q0 30 -19 26 L-19 2 Q-22 -3 -30 -6 Z',
        '#FFFFFF', _bold('', '#C9C2E8', 2.4)) +
      _p('M-14 -28 L0 -8 L14 -28 Q18 -26 20 -22 L0 2 L-20 -22 Q-18 -26 -14 -28 Z', '#5B8DEF', _bold('', '#3F6FC4', 2)) +
      _s('M-7 -24 L0 -14 L7 -24', '#FFFFFF', 2) +
      _r(-19, 24, 38, 4, 2, '#5B8DEF') +
      _c(0, 12, 4.2, '#FF6B81', _bold('', '#E2557D', 1.6));
  },
  top_rain: function () {
    return _p('M-28 -20 Q-19 -29 -12 -29 L12 -29 Q19 -29 28 -20 L32 0 Q24 3 21 8 L21 28 Q0 32 -21 28 L-21 8 Q-24 3 -32 0 Z',
        'rgba(126,221,240,.62)', _bold('', '#3FA9CB', 2.4)) +
      _s('M-12 -29 Q0 -21 12 -29', '#3FA9CB', 2.6) +
      _s('M-18 -14 Q0 -8 18 -14', '#FFFFFF', 2.4, 'opacity=".7"') +
      _c(-8, 6, 2.6, '#FFFFFF', 'opacity=".55"') + _c(9, 14, 2, '#FFFFFF', 'opacity=".55"');
  },
  top_dino: function () {
    return _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 28 Q0 32 -19 28 L-19 2 Q-22 -3 -30 -6 Z',
        '#7BC96F', _bold('', '#4E9E44', 2.4)) +
      [-24, -13, -2].map(function (x) {
        return _p('M' + (x - 4) + ' -26 L' + x + ' -35 L' + (x + 4) + ' -26 Z', '#F5A623', _bold('', '#D98E17', 1.6));
      }).join('') +
      _c(-8, 8, 2.8, '#2F6B27') + _c(8, 8, 2.8, '#2F6B27') +
      _s('M-20 16 Q-14 22 -20 26', '#4E9E44', 2) +
      _s('M20 16 Q14 22 20 26', '#4E9E44', 2) +
      _s('M-4 20 Q0 24 4 20', '#2F6B27', 2);
  },
  top_super: function () {
    return _p('M-26 -22 Q-18 -28 -12 -28 L12 -28 Q18 -28 26 -22 L30 -6 Q22 -3 19 2 L19 27 Q0 31 -19 27 L-19 2 Q-22 -3 -30 -6 Z',
        '#3B6FE0', _bold('', '#2A52AC', 2.4)) +
      _p('M-14 -28 L0 -10 L14 -28 L19 -25 L2 0 L-2 0 L-19 -25 Z', '#E23B4E', _bold('', '#B92B3C', 2)) +
      _star(0, 12, 9, '#FFD166', '#E0A51F', 1.8) +
      _s('M-12 -28 Q0 -20 12 -28', '#2A52AC', 2.6);
  },

/* __ART_CAPE__ */
  /* ===== 披风（从肩后垂下，画在身体后面）===== */
  cape_rain: function () {
    return _p('M-24 -18 Q0 -30 24 -18 L34 66 Q0 78 -34 66 Z', 'rgba(180,225,245,.55)', _bold('', '#8FCBE8', 2.4)) +
      _s('M-18 -10 Q0 -16 18 -10', '#FFFFFF', 2.4, 'opacity=".7"') +
      _c(-12, 20, 3, '#FFFFFF', 'opacity=".5"') + _c(10, 38, 2.6, '#FFFFFF', 'opacity=".5"');
  },
  cape_red: function () {
    return _p('M-24 -18 Q0 -30 24 -18 L30 70 Q0 80 -30 70 Z', '#E8455A', _bold('', '#B92B3C', 2.4)) +
      _p('M-24 -18 Q0 -26 24 -18 L25 -6 Q0 -14 -25 -6 Z', '#F06B7C') +
      _s('M-16 20 Q0 26 16 20', '#FFFFFF', 2.2, 'opacity=".28"');
  },
  cape_hero: function () {
    return _p('M-26 -18 Q0 -32 26 -18 Q40 30 34 74 Q0 86 -34 74 Q-40 30 -26 -18 Z', '#FFB020', _bold('', '#E08E0B', 2.4)) +
      _p('M-26 -18 Q0 -28 26 -18 L27 -4 Q0 -14 -27 -4 Z', '#FFD066') +
      _star(0, 30, 15, '#FFFFFF', '#E08E0B', 2);
  },
  cape_butterfly: function () {
    function w(dir) {
      return _g('scale(' + dir + ',1)',
        _p('M8 -14 Q40 -34 46 -6 Q50 14 30 20 Q40 34 24 40 Q8 44 8 24 Z', '#B08CF0', _bold('', '#8A64D0', 2.4)) +
        _c(28, -6, 5, '#FFFFFF', 'opacity=".55"') + _c(26, 24, 4, '#FFFFFF', 'opacity=".55"'));
    }
    return w(1) + w(-1) + _p('M-8 -20 Q0 -28 8 -20 L6 30 Q0 34 -6 30 Z', '#9A78E0', _bold('', '#7A56C4', 2.2));
  },
  cape_star: function () {
    return _p('M-26 -18 Q0 -32 26 -18 L32 72 Q0 84 -32 72 Z', '#2B2F6B', _bold('', '#191C44', 2.4)) +
      _star(-14, 8, 6, '#FFE08A', '', 0) + _star(10, 26, 5, '#FFFFFF', '', 0) +
      _star(-6, 46, 4.4, '#8EC9FF', '', 0) + _star(16, 56, 3.6, '#FFE08A', '', 0) +
      _p('M-26 -18 Q0 -28 26 -18 L27 -6 Q0 -16 -27 -6 Z', '#3B3F8C');
  },

/* __ART_BOTTOM__ */
  /* ===== 裤子 / 裙子（腰线 y≈-17，裤脚 y≈+16，裙摆更低）===== */
  bot_ball: function () {
    return _p('M-21 -16 Q0 -19 21 -16 L23 4 Q17 7 14 12 L4 12 L0 1 L-4 12 L-14 12 Q-17 7 -23 4 Z',
        '#FF9F43', _bold('', '#E0821F', 2.4)) +
      _r(-21, -16, 42, 6, 3, '#FFC078') +
      _s('M-13 6 L-9 18 M13 6 L9 18', '#FFFFFF', 2.4, 'opacity=".9"');
  },
  bot_sport: function () {
    return _p('M-21 -16 Q0 -19 21 -16 L23 4 Q17 7 14 12 L4 12 L0 1 L-4 12 L-14 12 Q-17 7 -23 4 Z',
        '#5B8DEF', _bold('', '#3F6FC4', 2.4)) +
      _r(-21, -16, 42, 6, 3, '#85ADF6') +
      _r(-19, 8, 14, 4, 2, '#FFFFFF', 'opacity=".9"') + _r(5, 8, 14, 4, 2, '#FFFFFF', 'opacity=".9"');
  },
  bot_jeans: function () {
    return _p('M-22 -16 Q0 -19 22 -16 L24 26 L10 26 L6 -2 L-6 -2 L-10 26 L-24 26 Z',
        '#4A7BD0', _bold('', '#33599C', 2.4)) +
      _r(-22, -16, 44, 6, 3, '#6D9AE8') +
      _c(-11, 6, 2, '#F5C542') + _c(11, 6, 2, '#F5C542') +
      _s('M-20 20 L-11 20', '#33599C', 1.8, 'opacity=".7"');
  },
  bot_skirt: function () {
    return _p('M-18 -15 Q0 -18 18 -15 L28 20 Q0 27 -28 20 Z', '#FF8FB1', _bold('', '#E2647A', 2.4)) +
      _p('M-18 -15 Q0 -18 18 -15 L20 -6 Q0 -10 -20 -6 Z', '#FFB3C9') +
      [-14, -5, 5, 14].map(function (x) {
        return _s('M' + x + ' -4 L' + (x * 1.5) + ' 23', '#E2647A', 1.8, 'opacity=".5"');
      }).join('');
  },
  bot_pleat: function () {
    return _p('M-19 -15 Q0 -18 19 -15 L27 22 Q0 28 -27 22 Z', '#5B8DEF', _bold('', '#3F6FC4', 2.4)) +
      [-16, -8, 0, 8, 16].map(function (x) {
        return _p('M' + x + ' -6 L' + (x * 1.35) + ' 25 L' + (x * 1.35 + 4) + ' 25 L' + (x + 3) + ' -6 Z', '#3F6FC4', 'opacity=".35"');
      }).join('') +
      _r(-19, -15, 38, 6, 3, '#85ADF6');
  },
  bot_overall: function () {
    return _p('M-22 -10 Q0 -13 22 -10 L24 26 L10 26 L6 -2 L-6 -2 L-10 26 L-24 26 Z',
        '#4E9E44', _bold('', '#37762F', 2.4)) +
      _r(-14, -26, 8, 18, 3, '#4E9E44', _bold('', '#37762F', 2)) +
      _r(6, -26, 8, 18, 3, '#4E9E44', _bold('', '#37762F', 2)) +
      _c(-10, -10, 2.4, '#FFD166') + _c(10, -10, 2.4, '#FFD166') +
      _c(-8, 10, 3.4, '#FF9EC4', _bold('', '#E2647A', 1.4)) + _c(8, 10, 3.4, '#FF9EC4', _bold('', '#E2647A', 1.4));
  },
  bot_tutu: function () {
    return _p('M-16 -14 Q0 -17 16 -14 L16 -4 Q0 -7 -16 -4 Z', '#FF9EC4', _bold('', '#E2647A', 2.2)) +
      _p('M-16 -6 Q-40 4 -34 20 Q-16 30 0 30 Q16 30 34 20 Q40 4 16 -6 Q0 -10 -16 -6 Z',
        'rgba(255,183,208,.85)', _bold('', '#E2647A', 2.4)) +
      _s('M-22 4 Q0 12 22 4', '#FFFFFF', 2.2, 'opacity=".55"') +
      _s('M-18 16 Q0 22 18 16', '#FFFFFF', 2, 'opacity=".4"');
  },

/* __ART_SHOES__ */
  /* ===== 鞋（锚点 y=228，鞋底贴地）===== */
  shoe_sandal: function () {
    function one(x) {
      return _g('translate(' + x + ',0)',
        _p('M-8 -8 Q0 -10 8 -8 L9 4 Q16 6 17 11 Q18 15 12 15 L-8 15 Q-12 15 -12 10 Z', '#FFD1A3', _bold('', '#D9A05B', 2.2)) +
        _s('M-6 -6 Q0 0 6 -6', '#D9A05B', 2) + _s('M-4 1 Q0 5 4 1', '#D9A05B', 1.8));
    }
    return one(-11.5) + one(11.5);
  },
  shoe_sneak: function () {
    function one(x) {
      return _g('translate(' + x + ',0)',
        _p('M-9 -12 Q0 -14 9 -12 L10 3 Q17 5 18 11 Q19 16 13 16 L-9 16 Q-13 16 -13 11 Z', '#FF6B81', _bold('', '#E2557D', 2.3)) +
        _p('M-9 -12 Q0 -14 9 -12 L9 -7 Q0 -9 -9 -7 Z', '#FF9EB0') +
        _s('M-13 10 Q0 13 18 10', '#FFFFFF', 2.6) +
        _c(-4, 3, 2, '#FFFFFF', 'opacity=".9"') + _c(4, 3, 2, '#FFFFFF', 'opacity=".9"'));
    }
    return one(-11.5) + one(11.5);
  },
  shoe_oxford: function () {
    function one(x) {
      return _g('translate(' + x + ',0)',
        _p('M-9 -11 Q0 -13 9 -11 L10 3 Q17 5 18 11 Q19 15 13 15 L-9 15 Q-13 15 -13 10 Z', '#7A4E2D', _bold('', '#5B3A20', 2.3)) +
        _p('M-9 -11 Q0 -13 9 -11 L9 -6 Q0 -8 -9 -6 Z', '#96613A') +
        _s('M-2 -8 L4 2', '#5B3A20', 1.8) + _c(1, -3, 1.8, '#F5C542'));
    }
    return one(-11.5) + one(11.5);
  },
  shoe_boot: function () {
    function one(x) {
      return _g('translate(' + x + ',0)',
        _p('M-9 -15 L9 -15 L9 5 L16 10 Q17 15 11 15 L-9 15 Q-13 15 -13 10 Z', '#FFC93C', _bold('', '#E0A51F', 2.3)) +
        _r(-9, -15, 18, 5.5, 2.5, '#FFE08A') +
        _s('M-5 -7 L5 -7', '#E0A51F', 1.8, 'opacity=".6"'));
    }
    return one(-11.5) + one(11.5);
  },
  shoe_light: function () {
    function one(x) {
      return _g('translate(' + x + ',0)',
        _p('M-9 -12 Q0 -14 9 -12 L10 3 Q17 5 18 11 Q19 16 13 16 L-9 16 Q-13 16 -13 11 Z', '#E9EDF7', _bold('', '#AEB8D6', 2.3)) +
        _p('M-13 11 Q0 14 18 11 Q19 16 13 16 L-9 16 Q-13 16 -13 11 Z', '#7BE0FF', _bold('', '#4FC3F7', 1.6)) +
        _s('M-6 -8 Q0 -10 6 -8', '#4FC3F7', 2) + _c(4, 2, 2.4, '#7BE0FF'));
    }
    return one(-11.5) + one(11.5);
  },

/* __ART_BACK__ */
  /* ===== 背包 / 背部装备（画在身体后面）===== */
  back_bag: function () {
    return _r(-20, -18, 40, 36, 11, '#5B8DEF', _bold('', '#3F6FC4', 2.5)) +
      _r(-13, -6, 26, 14, 6, '#8FB4F7') +
      _s('M-8 -18 Q0 -27 8 -18', '#3F6FC4', 2.4) +
      _c(0, 1, 3, '#FFD166', _bold('', '#E0A51F', 1.4));
  },
  back_shell: function () {
    return _p('M-24 14 Q-26 -18 0 -22 Q26 -18 24 14 Q0 22 -24 14 Z', '#7BC96F', _bold('', '#4E9E44', 2.5)) +
      _s('M0 -22 L0 14', '#4E9E44', 2) +
      _s('M-24 4 Q0 -2 24 4', '#4E9E44', 2) +
      _s('M-17 -12 Q0 -6 17 -12', '#4E9E44', 2) +
      _c(-10, -2, 3, '#A5DB9B', 'opacity=".7"');
  },
  back_butterfly: function () {
    function w(dir) {
      return _g('scale(' + dir + ',1)',
        _p('M8 -6 Q34 -30 44 -12 Q50 4 30 8 Q44 14 34 26 Q24 34 8 20 Z', '#FF9EC4', _bold('', '#E2647A', 2.3)) +
        _c(30, -12, 5, '#FFFFFF', 'opacity=".6"') + _c(26, 14, 4, '#FFFFFF', 'opacity=".6"'));
    }
    return w(1) + w(-1);
  },
  back_wing: function () {
    function w(dir) {
      return _g('scale(' + dir + ',1)',
        _p('M8 -2 Q26 -34 48 -26 Q38 -12 40 -2 Q30 8 8 6 Z', '#FFFFFF', _bold('', '#C9C4E8', 2.4)) +
        _s('M14 -6 Q28 -22 40 -20', '#E4E0F5', 2));
    }
    return w(1) + w(-1);
  },
  back_rocket: function () {
    return _r(-11, -20, 22, 34, 11, '#E9EDF7', _bold('', '#AEB8D6', 2.4)) +
      _p('M-11 -6 L-20 9 L-11 9 Z M11 -6 L20 9 L11 9 Z', '#FF6B81', _bold('', '#E2557D', 2)) +
      _p('M0 -20 Q8 -30 0 -37 Q-8 -30 0 -20 Z', '#FF6B81', _bold('', '#E2557D', 2)) +
      _c(0, -6, 5, '#8EC9FF', _bold('', '#5FA6E8', 1.8)) +
      _p('M-6 14 Q0 28 6 14 Q0 20 -6 14 Z', '#FFC93C', _bold('', '#E0A51F', 1.8));
  },
  back_jet: function () {
    return _r(-14, -16, 28, 30, 9, '#3B3F5C', _bold('', '#191C30', 2.4)) +
      _r(-9, -10, 18, 10, 4, '#7BE0FF') +
      _p('M-14 6 L-22 18 L-14 14 Z M14 6 L22 18 L14 14 Z', '#FF9F43', _bold('', '#E0821F', 2)) +
      _p('M-7 14 Q0 30 7 14 Q0 20 -7 14 Z', '#FFD166', _bold('', '#E0A51F', 1.8)) +
      _s('M-4 -22 L4 -22', '#FFD166', 3);
  },

/* __ART_HAND__ */
  /* ===== 手持（右手位置，局部 0,0 在手心）===== */
  hand_icescream: function () {
    return _p('M-9 -2 L9 -2 L0 24 Z', '#E8B96B', _bold('', '#C99A4B', 2)) +
      _s('M-5 4 L5 4 M-3 11 L3 11', '#C99A4B', 1.4) +
      _p('M-10 -2 Q-12 -22 0 -24 Q12 -22 10 -2 Z', '#FFB7D0', _bold('', '#E2557D', 2)) +
      _p('M-10 -2 Q-6 -10 0 -8 Q6 -10 10 -2 Q0 2 -10 -2 Z', '#FFD3E2') +
      _c(-3, -18, 2.6, '#FFF6FA', 'opacity=".9"') + _c(4, -14, 2, '#FFF6FA', 'opacity=".9"');
  },
  hand_balloon: function () {
    return _s('M2 8 Q7 20 5 30', '#B9C2DA', 2) +
      _e(0, -10, 13.5, 16.5, '#FF8FB1', _bold('', '#E2557D', 2.4)) +
      _e(-4.5, -17, 4.5, 6.5, '#FFFFFF', 'opacity=".45"') +
      _p('M-3 6 L3 6 L0 11 Z', '#E2557D');
  },
  hand_flower: function () {
    return _s('M0 24 L0 -4', '#4E9E44', 2.6) +
      _s('M0 8 Q-10 4 -12 -4', '#4E9E44', 2) +
      _s('M0 14 Q10 10 12 2', '#4E9E44', 2) +
      _g('translate(0,-12)',
        [-90, -18, 54, 126, 198].map(function (d) {
          var a = d * Math.PI / 180;
          return _c(Math.cos(a) * 8, Math.sin(a) * 8, 5.6, '#FF9EC4', _bold('', '#E2647A', 1.4));
        }).join('') + _c(0, 0, 4.6, '#FFD166', _bold('', '#E0A51F', 1.4)));
  },
  hand_umbrella: function () {
    return _s('M0 -26 L0 16 Q0 24 -6 24', '#B08CF0', 2.4) +
      _p('M-24 -6 Q0 -34 24 -6 Q12 -12 0 -6 Q-12 -12 -24 -6 Z', '#B08CF0', _bold('', '#8A64D0', 2.2)) +
      _s('M-24 -6 Q0 -34 24 -6', '#8A64D0', 2) +
      [-16, 0, 16].map(function (x) { return _s('M' + x + ' -22 Q' + x + ' -14 ' + x + ' -8', '#FFFFFF', 1.6, 'opacity=".45"'); }).join('');
  },
  hand_ball: function () {
    return _c(0, 0, 15.5, '#FFFFFF', _bold('', '#2B2F4A', 2.4)) +
      _p('M0 -6 L5.7 -1.9 L3.5 4.8 L-3.5 4.8 L-5.7 -1.9 Z', '#2B2F4A') +
      _s('M0 -6 L0 -15.5 M5.7 -1.9 L14.7 -4.8 M3.5 4.8 L9 12.3 M-3.5 4.8 L-9 12.3 M-5.7 -1.9 L-14.7 -4.8', '#2B2F4A', 1.9) +
      _e(-5, -8, 4, 2.6, '#FFFFFF', 'opacity=".5"');
  },
  hand_sword: function () {
    return _s('M-2 22 L2 -14', '#9AA3BC', 5) +
      _s('M-2 22 L2 -14', '#E9EDF7', 2) +
      _s('M-9 -12 L9 -12', '#C9A227', 4) +
      _c(0, 22, 4.4, '#FFD166', _bold('', '#C9A227', 1.8)) +
      _star(0, -22, 8, '#FFD166', '#E0A51F', 1.6);
  },
  hand_wand: function () {
    return _s('M-2 26 L2 -10', '#C9A227', 4.2) +
      _star(0, -19, 10, '#FFD166', '#E0A51F', 2) +
      _c(12, -4, 2.6, '#FFD166') + _c(-11, -8, 2.2, '#8EC9FF') + _c(8, 6, 1.8, '#FF9EC4');
  },

/* __ART_PET__ */
  /* ===== 宠物（站在小朋友右边，局部 0,0 是脚底）===== */
  pet_rabbit: function () {
    return _e(0, 0, 15, 4, 'rgba(108,92,231,.12)') +
      _e(-5, -9, 4.5, 7, '#FFFFFF', _bold('', '#D9C8D8', 1.8)) + _e(5, -9, 4.5, 7, '#FFFFFF', _bold('', '#D9C8D8', 1.8)) +
      _e(-5, -19, 3, 8, '#FFD3E2') + _e(5, -19, 3, 8, '#FFD3E2') +
      _e(0, -14, 12, 10.5, '#FFFFFF', _bold('', '#D9C8D8', 2)) +
      _c(-4.4, -15, 1.7, '#2B2F4A') + _c(4.4, -15, 1.7, '#2B2F4A') +
      _s('M-2 -11.5 Q0 -9.5 2 -11.5', '#E2557D', 1.6) +
      _c(0, -12.6, 1.3, '#FF9EC4') +
      _e(0, -2, 9, 7, '#FFFFFF', _bold('', '#D9C8D8', 2));
  },
  pet_cat: function () {
    return _e(0, 0, 15, 4, 'rgba(108,92,231,.12)') +
      _p('M-11 -4 Q-18 -10 -15 -18 Q-9 -14 -8 -8 Z', '#F5B36B', _bold('', '#C98F5A', 1.8)) +
      _p('M11 -4 Q18 -10 15 -18 Q9 -14 8 -8 Z', '#F5B36B', _bold('', '#C98F5A', 1.8)) +
      _e(0, -13, 11, 9.5, '#F5B36B', _bold('', '#C98F5A', 2)) +
      _c(-4, -14, 1.6, '#2B2F4A') + _c(4, -14, 1.6, '#2B2F4A') +
      _s('M-2 -10.5 L0 -9 L2 -10.5', '#C98F5A', 1.5) +
      _s('M-7 -11 Q-9 -9.5 -7 -8.5 M7 -11 Q9 -9.5 7 -8.5', '#C98F5A', 1.3) +
      _e(0, -2, 9.5, 7, '#F5B36B', _bold('', '#C98F5A', 2)) +
      _s('M4 -24 Q8 -28 11 -24', '#C98F5A', 1.6);
  },
  pet_dog: function () {
    return _e(0, 0, 16, 4, 'rgba(108,92,231,.12)') +
      _e(-10, -16, 4, 8, '#B08CF0', _bold('', '#8A64D0', 1.8)) +
      _e(10, -16, 4, 8, '#B08CF0', _bold('', '#8A64D0', 1.8)) +
      _e(0, -12, 11.5, 10, '#C9B4F5', _bold('', '#8A64D0', 2)) +
      _e(0, -7, 6.5, 5, '#FFF6FA') +
      _c(-4.4, -13.5, 1.7, '#2B2F4A') + _c(4.4, -13.5, 1.7, '#2B2F4A') +
      _c(0, -9, 2.4, '#2B2F4A') +
      _s('M-2.5 -6.5 Q0 -4.5 2.5 -6.5', '#2B2F4A', 1.5) +
      _e(0, -2, 9.5, 7, '#C9B4F5', _bold('', '#8A64D0', 2)) +
      _s('M9 -20 Q15 -18 13 -12', '#8A64D0', 1.8);
  },
  pet_dino: function () {
    return _e(0, 0, 16, 4, 'rgba(108,92,231,.12)') +
      _p('M-12 -2 Q-16 -12 -10 -18 Q0 -26 10 -18 Q16 -12 12 -2 Q0 2 -12 -2 Z', '#7BC96F', _bold('', '#4E9E44', 2)) +
      [-8, -1, 6].map(function (x) {
        return _p('M' + (x - 2.4) + ' -19 L' + x + ' -25 L' + (x + 2.4) + ' -19 Z', '#F5A623', _bold('', '#D98E17', 1.3));
      }).join('') +
      _c(-4, -13, 1.7, '#2B2F4A') + _c(4, -13, 1.7, '#2B2F4A') +
      _s('M-2 -9 Q0 -7 2 -9', '#2F6B27', 1.5) +
      _p('M12 -14 Q20 -12 18 -4', '#7BC96F', _bold('', '#4E9E44', 1.8)) +
      _e(0, -1, 9, 4, '#A5DB9B');
  },
  pet_panda: function () {
    return _e(0, 0, 16, 4, 'rgba(108,92,231,.12)') +
      _c(-9, -20, 4.4, '#2B2F4A') + _c(9, -20, 4.4, '#2B2F4A') +
      _e(0, -13, 11.5, 10, '#FFFFFF', _bold('', '#C9C2CC', 2)) +
      _e(-4.6, -14.5, 3.4, 4, '#2B2F4A') + _e(4.6, -14.5, 3.4, 4, '#2B2F4A') +
      _c(-4.2, -14.2, 1.3, '#FFFFFF') + _c(5, -14.2, 1.3, '#FFFFFF') +
      _c(0, -9.5, 2.2, '#2B2F4A') +
      _s('M-2.5 -7.5 Q0 -5.5 2.5 -7.5', '#2B2F4A', 1.5) +
      _e(0, -2, 9.5, 7, '#FFFFFF', _bold('', '#C9C2CC', 2)) +
      _e(0, -2, 3.4, 2.4, '#2B2F4A');
  },
  pet_unicorn: function () {
    return _e(0, 0, 17, 4, 'rgba(108,92,231,.12)') +
      _p('M-13 -6 Q-20 -16 -14 -22 Q-8 -16 -7 -10 Z', '#FFF6FA', _bold('', '#E0D0E8', 1.8)) +
      _e(0, -14, 12, 10, '#FFF6FA', _bold('', '#E0D0E8', 2)) +
      _p('M-2 -24 L2 -24 L0 -32 Z', '#FFD166', _bold('', '#E0A51F', 1.6)) +
      _p('M4 -23 Q12 -30 16 -24 Q10 -22 8 -18 Z', '#FF9EC4', _bold('', '#E2647A', 1.6)) +
      _c(-4.4, -15, 1.7, '#5B4FBF') + _c(4.4, -15, 1.7, '#5B4FBF') +
      _s('M-2 -11 L0 -9.5 L2 -11', '#C9A0C9', 1.4) +
      _e(0, -2, 10, 7, '#FFF6FA', _bold('', '#E0D0E8', 2)) +
      _s('M-12 -4 Q-18 4 -12 10', '#FF9EC4', 2) +
      _star(-14, -24, 3.6, '#FFD166', '', 0);
  },

/* __ART_VEH__ */
  /* ===== 载具（停在小朋友左边，局部 0,0 是地面）===== */
  veh_bike: function () {
    return _c(-11, -11, 9, 'none', _bold('', '#3B3F5C', 2.6)) +
      _c(12, -11, 9, 'none', _bold('', '#3B3F5C', 2.6)) +
      _s('M-11 -11 L-2 -22 L10 -22 M-11 -11 L4 -11 L12 -11 M-2 -22 L4 -11', '#E23B4E', 2.4) +
      _s('M10 -22 L13 -24', '#3B3F5C', 2.4) +
      _r(-6, -26, 9, 4, 2, '#5B8DEF');
  },
  veh_boat: function () {
    return _e(0, 0, 20, 3.4, 'rgba(90,170,230,.35)') +
      _p('M-18 -4 L18 -4 L12 3 L-12 3 Z', '#E23B4E', _bold('', '#B92B3C', 2.2)) +
      _s('M0 -5 L0 -26', '#7A4E2D', 2.2) +
      _p('M1 -25 Q14 -18 2 -8 Z', '#FFFFFF', _bold('', '#C9C2E8', 1.8)) +
      _p('M-1 -22 Q-10 -16 -1 -9 Z', '#FFD166');
  },
  veh_car: function () {
    return _e(0, 0, 24, 3.6, 'rgba(108,92,231,.13)') +
      _p('M-22 -6 Q-22 -12 -15 -13 L-10 -20 Q-6 -23 0 -23 L8 -23 Q13 -23 15 -19 L18 -13 Q23 -12 23 -6 L23 -3 Q12 0 0 0 Q-12 0 -23 -3 Z',
        '#E23B4E', _bold('', '#B92B3C', 2.4)) +
      _p('M-9 -19 L-5 -13 L-14 -13 Z M-3 -19 L-3 -13 L7 -13 L4 -19 Z', '#BEE3FF') +
      _c(-13, -2, 4.4, '#2B2F4A') + _c(13, -2, 4.4, '#2B2F4A') +
      _c(-13, -2, 1.8, '#B9C2DA') + _c(13, -2, 1.8, '#B9C2DA') +
      _c(20, -17, 2.4, '#FFD166');
  },
  veh_plane: function () {
    return _e(0, -2, 22, 3.4, 'rgba(108,92,231,.1)') +
      _p('M-20 -14 Q0 -22 20 -14 Q22 -10 18 -8 L-18 -8 Q-22 -10 -20 -14 Z', '#5B8DEF', _bold('', '#3F6FC4', 2.2)) +
      _p('M-4 -12 L-12 -2 L-2 -2 Z', '#3F6FC4') +
      _p('M6 -12 L14 -2 L4 -2 Z', '#3F6FC4') +
      _p('M-20 -14 L-27 -8 L-20 -9 Z M20 -14 L27 -8 L20 -9 Z', '#E23B4E', _bold('', '#B92B3C', 1.8)) +
      _c(-10, -14, 3.2, '#BEE3FF') + _c(-1, -15, 3.2, '#BEE3FF') +
      _c(22, -16, 2.2, '#FFD166');
  },
  veh_rocket: function () {
    return _e(0, 0, 12, 3.4, 'rgba(255,150,80,.28)') +
      _p('M-9 -4 Q-9 -30 0 -34 Q9 -30 9 -4 Q0 -1 -9 -4 Z', '#E9EDF7', _bold('', '#AEB8D6', 2.2)) +
      _p('M-9 -10 L-17 0 L-9 -2 Z M9 -10 L17 0 L9 -2 Z', '#E23B4E', _bold('', '#B92B3C', 1.8)) +
      _c(0, -22, 4.6, '#8EC9FF', _bold('', '#5FA6E8', 1.8)) +
      _p('M-5 -3 Q0 6 5 -3 Q0 1 -5 -3 Z', '#FFC93C', _bold('', '#E0A51F', 1.6));
  },

};

/* ---------- 各槽位锚点（局部坐标；整体再向下平移 12px）---------- */
var AV_ANCHOR = {
  back:    [80, 120],
  cape:    [80, 116],
  bottom:  [80, 162],
  top:     [80, 120],
  shoes:   [80, 228],
  hat:     [80, 18],
  eyes:    [80, 47],
  ear:     [80, 58],
  neck:    [80, 84],
  wrist:   [80, 148],
  hand:    [108, 152],
  pet:     [130, 228],
  vehicle: [32, 236]
};
var AV_BASE = { top: 'top_white', bottom: 'bot_short', shoes: 'shoe_base' };

/* 宽度较大的装备，衣柜图标要放大取景框 */
var AV_WIDE = { pet: 1, vehicle: 1, back: 1, hand: 1 };

function _part(worn, slot) {
  var id = (worn && worn[slot]) || AV_BASE[slot];
  var art = id && AV_ART[id];
  return art ? art() : '';
}
function _at(slot, inner) {
  if (!inner) return '';
  var a = AV_ANCHOR[slot];
  return _g('translate(' + a[0] + ',' + a[1] + ')', inner);
}

var Avatar = {

  /* 全身像：gender 'boy' | 'girl'，worn = {hat,eyes,ear,neck,wrist,top,cape,bottom,shoes,back,hand,pet,vehicle} */
  svg: function (gender, worn, opts) {
    opts = opts || {};
    var P = _uid();
    var s = _defs(P, gender) +
      _ga('filter="url(#' + P + 'sf)"',
        _at('back', _part(worn, 'back')) +
        _at('cape', _part(worn, 'cape')) +
        _body(gender, P, worn));
    return '<svg class="' + (opts.cls || 'avatar-svg') + '" viewBox="0 0 160 262" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="小朋友全身像">' +
      _g('translate(0,10)', s) + '</svg>';
  },

  /* 衣柜格子里的小图 */
  itemIcon: function (id, slot) {
    var art = AV_ART[id];
    if (!art) return '';
    if (!slot && typeof OUTFIT_MAP !== 'undefined' && OUTFIT_MAP[id]) slot = OUTFIT_MAP[id].slot;
    var box = AV_WIDE[slot] ? 132 : 92;
    var h = box / 2;
    return '<svg class="wd-icon" viewBox="' + (-h) + ' ' + (-h) + ' ' + box + ' ' + box + '" xmlns="http://www.w3.org/2000/svg">' + art() + '</svg>';
  }
};
