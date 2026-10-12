# -*- coding: utf-8 -*-
"""追加生成激活码（可重复运行，不会与旧码重复）

用法：
    python tools/gen-codes.py              # 追加 50 个
    python tools/gen-codes.py --count 100  # 追加 100 个

做的事：
  1. 读取 js/data.js 里已有的激活码，避免重复
  2. 生成新码并写回 js/data.js 的 CONFIG.activationCodes
  3. 把新码追加到项目外层的「激活码清单.csv」（不会被 Vercel 部署公开）
"""
import argparse
import csv
import os
import re
import secrets
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # pinyin-game/
DATA_JS = os.path.join(ROOT, 'js', 'data.js')
CSV_PATH = os.path.join(os.path.dirname(ROOT), '激活码清单.csv')

ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'   # 去掉 0 O 1 I L 等易混字符
PREFIX = 'PY'
BODY_LEN = 6


def load_existing(src):
    m = re.search(r'activationCodes:\s*\[(.*?)\]', src, re.S)
    if not m:
        sys.exit('× 在 js/data.js 里找不到 activationCodes 数组，请先确认文件未被改动')
    return m, re.findall(r"'([^']+)'", m.group(1))


def build_block(codes):
    lines = []
    for i in range(0, len(codes), 5):
        lines.append('    ' + ', '.join("'%s'" % c for c in codes[i:i + 5]) + ',')
    return 'activationCodes: [\n' + '\n'.join(lines) + '\n  ]'


def new_codes(n, taken):
    out = []
    while len(out) < n:
        c = PREFIX + ''.join(secrets.choice(ALPHABET) for _ in range(BODY_LEN))
        if c in taken:
            continue
        taken.add(c)
        out.append(c)
    return out


def append_csv(codes):
    rows = []
    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, 'r', encoding='utf-8-sig', newline='') as f:
            rows = [r for r in csv.reader(f) if r and r[0] != '序号']
    start = 0
    for r in rows:
        try:
            start = max(start, int(r[0]))
        except (ValueError, IndexError):
            pass
    with open(CSV_PATH, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['序号', '激活码', '已售给（家长微信昵称）', '售出日期', '备注'])
        w.writerows(rows)
        for i, c in enumerate(codes, start + 1):
            w.writerow([i, c, '', '', ''])
    return start + 1, start + len(codes)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--count', type=int, default=50, help='本次新增多少个（默认 50）')
    args = ap.parse_args()
    if args.count <= 0:
        sys.exit('× --count 必须大于 0')

    with open(DATA_JS, 'r', encoding='utf-8-sig') as f:
        src = f.read()

    m, existing = load_existing(src)
    taken = set(existing)
    fresh = new_codes(args.count, taken)

    with open(DATA_JS, 'w', encoding='utf-8-sig', newline='') as f:
        f.write(src[:m.start()] + build_block(existing + fresh) + src[m.end():])

    lo, hi = append_csv(fresh)

    print('✔ 原有激活码 %d 个' % len(existing))
    print('✔ 本次新增 %d 个，编号 %d - %d' % (len(fresh), lo, hi))
    print('✔ 现在共 %d 个，已写回 js/data.js' % (len(existing) + len(fresh)))
    print('✔ 清单已更新：%s' % CSV_PATH)
    print('  新增的码：' + ' '.join(fresh))


if __name__ == '__main__':
    main()
