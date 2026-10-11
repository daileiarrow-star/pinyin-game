/* =========================================================
   拼音小达人 — 全身像换装系统
   ---------------------------------------------------------
   纯 SVG，男孩 / 女孩两套发型，全身像。
   初始穿搭：白 T 恤 + 短裤（跟真的一年级小朋友一样）。
   买到装备后穿上去，全身像立刻变化。

   每件装备画在自己的局部坐标（以 0,0 为中心），
   由 Avatar.svg() 摆到身体对应位置；衣柜格子里
   用 Avatar.itemIcon() 把同一份画放大居中展示。
   ========================================================= */

var AV = {
  skin: '#FFDCB8', skinLine: '#EBBE95',
  hair: '#4E3B30', hairLine: '#3B2C24',
  ink: '#22243A', line: '#D9D3F2',
  white: '#FFFFFF', brand: '#6C5CE7'
};

/* ---------- 局部坐标下的装备图形（都以 0,0 为中心）---------- */
var AV_ART = {

  /* ===== 上衣 ===== */
  top_white: function () {
    return '<g>' +
      '<path d="M-26 -24 L-12 -30 L12 -30 L26 -24 L30 -6 L20 -2 L20 28 L-20 28 L-20 -2 L-30 -6 Z" fill="#fff" stroke="#D9D3F2" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-12 -30 Q0 -22 12 -30" fill="none" stroke="#E4E0F5" stroke-width="2.5"/>' +
      '</g>';
  },
  top_stripe: function () {
    var s = '<path d="M-26 -24 L-12 -30 L12 -30 L26 -24 L30 -6 L20 -2 L20 28 L-20 28 L-20 -2 L-30 -6 Z" fill="#7EDDC0" stroke="#4FB89B" stroke-width="2.5" stroke-linejoin="round"/>';
    [-12, 0, 12].forEach(function (y) {
      s += '<rect x="-20" y="' + y + '" width="40" height="5" fill="#fff" opacity=".85"/>';
    });
    return '<g>' + s + '</g>';
  },
  top_hoodie: function () {
    return '<g>' +
      '<path d="M-27 -24 L-13 -32 L13 -32 L27 -24 L31 20 L20 24 L20 30 L-20 30 L-20 24 L-31 20 Z" fill="#FF8FA3" stroke="#E2647A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-14 -32 Q0 -16 14 -32 Q8 -24 0 -24 Q-8 -24 -14 -32 Z" fill="#FFB3C1" stroke="#E2647A" stroke-width="2"/>' +
      '<rect x="-11" y="12" width="22" height="12" rx="4" fill="#FFB3C1" stroke="#E2647A" stroke-width="1.6"/>' +
      '</g>';
  },
  top_dino: function () {
    var s = '<path d="M-26 -24 L-12 -30 L12 -30 L26 -24 L30 -6 L20 -2 L20 30 L-20 30 L-20 -2 L-30 -6 Z" fill="#7BC96F" stroke="#4E9E44" stroke-width="2.5" stroke-linejoin="round"/>';
    [-24, -12, 0].forEach(function (y) {
      s += '<path d="M' + (y - 4) + ' -28 L' + y + ' -36 L' + (y + 4) + ' -28 Z" fill="#F5A623" stroke="#D98E17" stroke-width="1.6"/>';
    });
    s += '<circle cx="-8" cy="6" r="2.6" fill="#2F6B27"/><circle cx="8" cy="6" r="2.6" fill="#2F6B27"/>';
    s += '<path d="M-4 18 Q0 22 4 18" fill="none" stroke="#2F6B27" stroke-width="2" stroke-linecap="round"/>';
    return '<g>' + s + '</g>';
  },
  top_star: function () {
    var s = '<path d="M-26 -24 L-12 -30 L12 -30 L26 -24 L30 -6 L20 -2 L20 28 L-20 28 L-20 -2 L-30 -6 Z" fill="#5B8DEF" stroke="#3F6FC4" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="-20" y="24" width="40" height="4" fill="#fff" opacity=".9"/>';
    s += '<path d="M0 -6 L3.5 1 L11 2 L5.5 7 L7 15 L0 11 L-7 15 L-5.5 7 L-11 2 L-3.5 1 Z" fill="#FFC93C" stroke="#E0A51F" stroke-width="1.6" stroke-linejoin="round"/>';
    return '<g>' + s + '</g>';
  },

  /* ===== 裤子 / 裙子 ===== */
  bot_short: function () {
    return '<g><path d="M-22 -18 L22 -18 L24 6 L16 20 L4 20 L0 2 L-4 20 L-16 20 L-24 6 Z" fill="#5B8DEF" stroke="#3F6FC4" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="-22" y="-18" width="44" height="6" rx="3" fill="#7FA9F5"/></g>';
  },
  bot_ball: function () {
    return '<g><path d="M-22 -18 L22 -18 L24 6 L16 20 L4 20 L0 2 L-4 20 L-16 20 L-24 6 Z" fill="#FF9F43" stroke="#E0821F" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="-22" y="-18" width="44" height="6" rx="3" fill="#FFC078"/>' +
      '<path d="M-14 6 L-10 18 M14 6 L10 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/></g>';
  },
  bot_jeans: function () {
    return '<g><path d="M-22 -18 L22 -18 L24 26 L10 26 L6 -2 L-6 -2 L-10 26 L-24 26 Z" fill="#4A7BD0" stroke="#33599C" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="-22" y="-18" width="44" height="6" rx="3" fill="#6D9AE8"/>' +
      '<circle cx="-10" cy="6" r="1.8" fill="#F5C542"/><circle cx="10" cy="6" r="1.8" fill="#F5C542"/></g>';
  },
  bot_skirt: function () {
    var s = '<path d="M-18 -16 L18 -16 L28 20 Q0 26 -28 20 Z" fill="#FF8FB1" stroke="#E2647A" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-18 -16 L18 -16 L20 -8 L-20 -8 Z" fill="#FFB3C9"/>';
    [-14, -5, 5, 14].forEach(function (x) {
      s += '<path d="M' + x + ' -6 L' + (x * 1.5) + ' 22" stroke="#E2647A" stroke-width="1.8" opacity=".55"/>';
    });
    return '<g>' + s + '</g>';
  },

  /* ===== 鞋 ===== */
  shoe_base: function () {
    return '<g>' + _shoe('#FFFFFF', '#D9D3F2') + '</g>';
  },
  shoe_sneak: function () {
    return '<g>' + _shoe('#FF6B81', '#E2647A') +
      '<path d="M-13 8 Q0 12 13 8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="-4" cy="3" r="2" fill="#fff" opacity=".9"/><circle cx="4" cy="3" r="2" fill="#fff" opacity=".9"/></g>';
  },
  shoe_boot: function () {
    function one(x, flip) {
      return '<g transform="translate(' + x + ',0)">' +
        '<path d="M-9 -14 L9 -14 L9 6 L14 12 Q14 17 8 17 L-9 17 Q-13 17 -13 12 Z" fill="#FFC93C" stroke="#E0A51F" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<rect x="-9" y="-14" width="18" height="5" rx="2.5" fill="#FFE08A"/></g>';
    }
    return '<g>' + one(-11) + one(11) + '</g>';
  },

  /* ===== 帽子 ===== */
  hat_cap: function () {
    return '<g><path d="M-26 -4 Q-26 -28 0 -28 Q26 -28 26 -4 Z" fill="#6C5CE7" stroke="#4E41B8" stroke-width="2.5"/>' +
      '<path d="M-30 -4 L30 -4 L36 2 Q36 6 30 6 L-30 6 Q-34 6 -34 2 Z" fill="#8577EE" stroke="#4E41B8" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<circle cx="0" cy="-16" r="3.4" fill="#fff" opacity=".9"/></g>';
  },
  hat_sun: function () {
    return '<g><ellipse cx="0" cy="-2" rx="34" ry="9" fill="#FFD166" stroke="#E0A51F" stroke-width="2.5"/>' +
      '<path d="M-20 -3 Q-20 -26 0 -26 Q20 -26 20 -3 Z" fill="#FFE29A" stroke="#E0A51F" stroke-width="2.5"/>' +
      '<path d="M-20 -8 Q0 -2 20 -8" fill="none" stroke="#E0A51F" stroke-width="2"/>' +
      '<circle cx="-12" cy="-14" r="3.2" fill="#FF8FB1"/><circle cx="12" cy="-14" r="3.2" fill="#FF8FB1"/></g>';
  },
  hat_crown: function () {
    return '<g><path d="M-22 -4 L-22 -22 L-11 -12 L0 -24 L11 -12 L22 -22 L22 -4 Z" fill="#FFC93C" stroke="#E0A51F" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<rect x="-22" y="-6" width="44" height="7" rx="3" fill="#FFD966" stroke="#E0A51F" stroke-width="2"/>' +
      '<circle cx="0" cy="-1" r="2.6" fill="#FF6B81"/></g>';
  },

  /* ===== 眼镜（画在眼睛位置）===== */
  eye_round: function () {
    function lens(x) {
      return '<g><circle cx="' + x + '" cy="0" r="9" fill="#EAF6FF" fill-opacity=".55" stroke="#4E41B8" stroke-width="2.6"/>' +
        '<path d="M' + (x - 6) + ' -6 Q' + x + ' -11 ' + (x + 6) + ' -6" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/></g>';
    }
    return '<g>' + lens(-12) + lens(12) + '<path d="M-3 0 L3 0" stroke="#4E41B8" stroke-width="2.6"/>' +
      '<path d="M-21 0 L-27 -3 M21 0 L27 -3" stroke="#4E41B8" stroke-width="2.4" stroke-linecap="round"/></g>';
  },
  eye_sun: function () {
    return '<g><path d="M-22 -7 L22 -7 L18 6 Q10 10 3 6 L0 3 L-3 6 Q-10 10 -18 6 Z" fill="#3B3F5C" stroke="#22243A" stroke-width="2"/>' +
      '<path d="M-18 -4 L-8 -4" stroke="#8E93B8" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M-25 -7 L25 -7" stroke="#22243A" stroke-width="3" stroke-linecap="round"/></g>';
  },
  eye_star: function () {
    function star(x) {
      return '<path d="M' + x + ' -10 L' + (x + 3) + ' -3 L' + (x + 10) + ' -2 L' + (x + 5) + ' 3 L' + (x + 6.5) + ' 10 L' + x + ' 6 L' + (x - 6.5) + ' 10 L' + (x - 5) + ' 3 L' + (x - 10) + ' -2 L' + (x - 3) + ' -3 Z" fill="#FFD166" stroke="#E0A51F" stroke-width="1.8" stroke-linejoin="round"/>';
    }
    return '<g>' + star(-12) + star(12) + '<path d="M-2 0 L2 0" stroke="#E0A51F" stroke-width="2.4"/></g>';
  },

  /* ===== 背包 / 背后装备 ===== */
  back_bag: function () {
    return '<g><rect x="-20" y="-18" width="40" height="36" rx="10" fill="#5B8DEF" stroke="#3F6FC4" stroke-width="2.5"/>' +
      '<rect x="-13" y="-6" width="26" height="14" rx="5" fill="#8FB4F7"/>' +
      '<path d="M-8 -18 Q0 -26 8 -18" fill="none" stroke="#3F6FC4" stroke-width="2.4"/></g>';
  },
  back_wing: function () {
    function wing(dir) {
      return '<g transform="scale(' + dir + ',1)">' +
        '<path d="M8 0 Q22 -22 38 -18 Q30 -8 32 0 Q24 6 8 4 Z" fill="#fff" stroke="#C9C4E8" stroke-width="2.5" stroke-linejoin="round"/>' +
        '<path d="M12 -2 Q22 -14 32 -13" stroke="#E4E0F5" stroke-width="2" fill="none"/></g>';
    }
    return '<g>' + wing(1) + wing(-1) + '</g>';
  },
  back_rocket: function () {
    return '<g><rect x="-11" y="-20" width="22" height="34" rx="10" fill="#E9EDF7" stroke="#B9C2DA" stroke-width="2.5"/>' +
      '<path d="M-11 -6 L-19 8 L-11 8 Z M11 -6 L19 8 L11 8 Z" fill="#FF6B81" stroke="#E2647A" stroke-width="2"/>' +
      '<path d="M0 -20 Q7 -28 0 -34 Q-7 -28 0 -20 Z" fill="#FF6B81" stroke="#E2647A" stroke-width="2"/>' +
      '<circle cx="0" cy="-6" r="4.5" fill="#8EC9FF" stroke="#5FA6E8" stroke-width="1.8"/>' +
      '<path d="M-5 15 Q0 26 5 15" fill="#FFC93C" stroke="#E0A51F" stroke-width="2"/></g>';
  },

  /* ===== 手持 ===== */
  hand_balloon: function () {
    return '<g><path d="M2 6 Q6 18 4 28" stroke="#B9C2DA" stroke-width="2" fill="none"/>' +
      '<ellipse cx="0" cy="-8" rx="13" ry="16" fill="#FF8FB1" stroke="#E2647A" stroke-width="2.5"/>' +
      '<path d="M-5 -14 Q-2 -18 2 -16" stroke="#fff" stroke-width="2.4" fill="none" opacity=".85" stroke-linecap="round"/>' +
      '<path d="M-3 7 L3 7 L0 11 Z" fill="#E2647A"/></g>';
  },
  hand_ball: function () {
    var s = '<circle cx="0" cy="0" r="15" fill="#fff" stroke="#3B3F5C" stroke-width="2.5"/>' +
      '<path d="M0 -5.5 L5.2 -1.7 L3.2 4.4 L-3.2 4.4 L-5.2 -1.7 Z" fill="#3B3F5C"/>' +
      '<path d="M0 -5.5 L0 -14 M5.2 -1.7 L13.3 -4.3 M3.2 4.4 L8.2 11.3 M-3.2 4.4 L-8.2 11.3 M-5.2 -1.7 L-13.3 -4.3" stroke="#3B3F5C" stroke-width="1.8"/>';
    return '<g>' + s + '</g>';
  },
  hand_gem: function () {
    return '<g><path d="M-12 -4 L-6 -14 L6 -14 L12 -4 L0 14 Z" fill="#8EC9FF" stroke="#5FA6E8" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M-12 -4 L12 -4 M-6 -14 L0 14 L6 -14" stroke="#fff" stroke-width="1.8" opacity=".85" fill="none"/></g>';
  },
  hand_wand: function () {
    return '<g><path d="M-2 26 L2 -8" stroke="#C9A227" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M0 -24 L4 -14 L14 -13 L7 -6 L9 4 L0 -1 L-9 4 L-7 -6 L-14 -13 L-4 -14 Z" fill="#FFD166" stroke="#E0A51F" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="10" cy="6" r="2.4" fill="#FFD166"/><circle cx="-10" cy="4" r="2" fill="#FFD166"/></g>';
  }
};

/* 单只鞋（base / sneak 共用） */
function _shoe(fill, line) {
  function one(x) {
    return '<g transform="translate(' + x + ',0)">' +
      '<path d="M-8 -12 L8 -12 L8 6 Q16 8 16 13 Q16 17 10 17 L-8 17 Q-12 17 -12 12 Z" fill="' + fill + '" stroke="' + line + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M-8 -12 L8 -12 L8 -7 L-8 -7 Z" fill="' + line + '" opacity=".25"/></g>';
  }
  return one(-11) + one(11);
}

/* ---------- 各槽位在身体上的落点（局部坐标，整体再向下平移 12px）---------- */
var AV_ANCHOR = {
  back:   [80, 120],   // 背包 / 翅膀，画在身体后面
  bottom: [80, 162],
  top:    [80, 120],
  shoes:  [80, 228],
  hat:    [80, 18],
  eyes:   [80, 47],
  hand:   [108, 152]
};
var AV_BASE = { top: 'top_white', bottom: 'bot_short', shoes: 'shoe_base' };

function _part(worn, slot) {
  var id = (worn && worn[slot]) || AV_BASE[slot];
  return AV_ART[id] ? AV_ART[id]() : '';
}
function _at(slot, inner) {
  var a = AV_ANCHOR[slot];
  return '<g transform="translate(' + a[0] + ',' + a[1] + ')">' + inner + '</g>';
}

/* ---------- 头发（女孩的辫子画在头后面，刘海画在头前面）---------- */
function _hairBack(gender) {
  if (gender !== 'girl') return '';
  return '<g>' +
    '<ellipse cx="46" cy="56" rx="11" ry="15" fill="' + AV.hair + '" stroke="' + AV.hairLine + '" stroke-width="2"/>' +
    '<ellipse cx="114" cy="56" rx="11" ry="15" fill="' + AV.hair + '" stroke="' + AV.hairLine + '" stroke-width="2"/>' +
    '<circle cx="51" cy="42" r="4.2" fill="#FF8FB1" stroke="#E2647A" stroke-width="1.6"/>' +
    '<circle cx="109" cy="42" r="4.2" fill="#FF8FB1" stroke="#E2647A" stroke-width="1.6"/>' +
    '</g>';
}
function _hairFront(gender) {
  if (gender === 'girl') {
    return '<path d="M50 46 Q50 17 80 17 Q110 17 110 46 Q104 35 96 41 Q89 30 77 35 Q63 40 50 46 Z" fill="' + AV.hair + '" stroke="' + AV.hairLine + '" stroke-width="2" stroke-linejoin="round"/>';
  }
  return '<path d="M50 45 Q50 17 80 17 Q110 17 110 45 Q103 37 94 39 Q88 29 75 33 Q61 37 50 45 Z" fill="' + AV.hair + '" stroke="' + AV.hairLine + '" stroke-width="2" stroke-linejoin="round"/>';
}

var Avatar = {

  /* 全身像：gender 'boy' | 'girl'，worn = {hat,eyes,top,bottom,shoes,back,hand} */
  svg: function (gender, worn, opts) {
    opts = opts || {};
    var C = AV;
    var s = '';

    // 地面阴影
    s += '<ellipse cx="80" cy="246" rx="34" ry="6" fill="#E4DFFF"/>';

    // 背后装备
    s += _at('back', _part(worn, 'back'));

    // 腿
    s += '<rect x="64" y="182" width="13" height="42" rx="6" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';
    s += '<rect x="83" y="182" width="13" height="42" rx="6" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';

    // 鞋 → 裤子 → 上衣
    s += _at('shoes', _part(worn, 'shoes'));
    s += _at('bottom', _part(worn, 'bottom'));
    s += _at('top', _part(worn, 'top'));

    // 手臂 + 手
    s += '<rect x="47" y="100" width="11" height="48" rx="5.5" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';
    s += '<rect x="102" y="100" width="11" height="48" rx="5.5" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';
    s += '<circle cx="52.5" cy="152" r="7" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';
    s += '<circle cx="107.5" cy="152" r="7" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';

    // 脖子 → 后发 → 头 → 前发 → 脸
    s += '<rect x="73" y="72" width="14" height="18" rx="6" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2"/>';
    s += _hairBack(gender);
    s += '<circle cx="80" cy="48" r="29" fill="' + C.skin + '" stroke="' + C.skinLine + '" stroke-width="2.4"/>';
    s += '<circle cx="62" cy="56" r="4.6" fill="#FFB3C1" opacity=".55"/>';
    s += '<circle cx="98" cy="56" r="4.6" fill="#FFB3C1" opacity=".55"/>';
    s += '<circle cx="69" cy="47" r="3.4" fill="#3B3F5C"/>';
    s += '<circle cx="91" cy="47" r="3.4" fill="#3B3F5C"/>';
    if (gender === 'girl') {
      s += '<path d="M64 42 Q69 39 74 42 M86 42 Q91 39 96 42" stroke="#3B3F5C" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    }
    s += '<path d="M71 57 Q80 65 89 57" stroke="#3B3F5C" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    s += _hairFront(gender);

    // 眼镜 → 帽子 → 手持
    var eyesArt = _part(worn, 'eyes');
    if (eyesArt) s += _at('eyes', eyesArt);
    var hatArt = _part(worn, 'hat');
    if (hatArt) s += _at('hat', hatArt);
    var handArt = _part(worn, 'hand');
    if (handArt) s += _at('hand', handArt);

    var cls = opts.cls || 'avatar-svg';
    return '<svg class="' + cls + '" viewBox="0 0 160 262" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="小朋友全身像">' +
      '<g transform="translate(0,12)">' + s + '</g></svg>';
  },

  /* 衣柜格子里的装备小图（同一份画放大居中） */
  itemIcon: function (id) {
    var art = AV_ART[id];
    if (!art) return '';
    return '<svg class="wd-icon" viewBox="-42 -42 84 84" xmlns="http://www.w3.org/2000/svg">' + art() + '</svg>';
  }
};
