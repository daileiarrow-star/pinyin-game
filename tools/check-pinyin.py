# -*- coding: utf-8 -*-
"""
逐题核验题库的拼音是否正确 —— 用法：
    pip install pypinyin
    python tools/check-pinyin.py

原理：把 js/data.js 里的 QUESTIONS 导出成 JSON（借用本机 node），
      再用 pypinyin 计算每个题面汉字的「标准读音」，
      与题目里标定的正确选项逐一比对。
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..')

# ---------- 用 node 把 data.js 导出为 JSON ----------
NODE_SNIPPET = """
const fs=require('fs'),path=require('path');
const root=process.argv[process.argv.length-1];
const code=fs.readFileSync(path.join(root,'js','data.js'),'utf8');
const api=new Function(code+'\\n;return {KNOWLEDGE_POINTS,QUESTIONS};')();
process.stdout.write(JSON.stringify({kp:api.KNOWLEDGE_POINTS,q:api.QUESTIONS}));
"""
try:
    out = subprocess.run(['node', '-e', NODE_SNIPPET, os.path.abspath(ROOT)],
                         capture_output=True, text=True, encoding='utf-8', check=True)
except FileNotFoundError:
    print('未找到 node，请先安装 Node.js（或直接用浏览器打开 index.html 目测）')
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print('读取 data.js 失败：', e.stderr)
    sys.exit(1)

data = json.loads(out.stdout)
QS, KPS = data['q'], data['kp']

from pypinyin import pinyin, Style

# ---------- 合法音节表（覆盖 CJK 基本区全部汉字）----------
CJK = ''.join(chr(c) for c in range(0x4E00, 0x9FA6))
inv = set()
for ch in CJK:
    try:
        for g in pinyin(ch, style=Style.NORMAL, heteronym=True):
            for s in g:
                inv.add(s.strip())
    except Exception:
        pass

TM = {'ā':'a','á':'a','ǎ':'a','à':'a','ē':'e','é':'e','ě':'e','è':'e','ī':'i','í':'i','ǐ':'i','ì':'i',
      'ō':'o','ó':'o','ǒ':'o','ò':'o','ū':'u','ú':'u','ǔ':'u','ù':'u','ǖ':'v','ǘ':'v','ǚ':'v','ǜ':'v',
      'ü':'v','ń':'n','ň':'n'}

def strip_tone(s):
    return ''.join(TM.get(c, c) for c in s)

def split_syllables(s):
    s = strip_tone(s)
    if s in inv:
        return [s]
    memo = {}
    def go(i):
        if i == len(s):
            return []
        if i in memo:
            return memo[i]
        for L in (4, 3, 2, 1):
            seg = s[i:i + L]
            if seg in inv:
                rest = go(i + L)
                if rest is not None:
                    memo[i] = [seg] + rest
                    return memo[i]
        memo[i] = None
        return None
    return go(0)

def real_pinyin(text):
    return ''.join(g[0] for g in pinyin(text, style=Style.TONE, heteronym=False))

# 这两组知识点考的就是「标调位置 / ü 两点省略」，干扰项本身是刻意写错的拼写
RULE_KP = {'u_dots', 'mark_iu'}

errors, tone_warn, nonstd, style_warn = [], [], [], []

for q in QS:
    content, opts, ans, kid = q['content'], q['options'], q['answer'], q['knowledge']
    std = real_pinyin(content)
    chosen = opts[ans]
    tag = f"{q['id']} {content}"

    if chosen != std:
        if strip_tone(chosen) == strip_tone(std):
            tone_warn.append(f'{tag}: 选项 {chosen} 声调与标准 {std} 不一致')
        else:
            errors.append(f'{tag}: 选项 {chosen}  != 标准 {std}')

    for o in opts:
        syl = split_syllables(o)
        if syl is None:
            if kid not in RULE_KP:
                style_warn.append(f'{tag}: 选项 {o} 含非标准音节')
        elif len(syl) != len(content):
            style_warn.append(f'{tag}: 选项 {o} 音节数({len(syl)})与题面字数({len(content)})不符')

    if kid not in RULE_KP:
        for o in opts:
            if o != chosen and split_syllables(o) is None:
                nonstd.append(f'{tag}: 干扰项 {o} 非标准音节')

LINE = '=' * 58
print(LINE)
print(f'题库总量：{len(QS)} 题   知识点：{len(KPS)} 个')
print(LINE)

print(f'\n【错误 · 正确答案拼音不对】{len(errors)} 处')
for e in errors:
    print('  ✗', e)

print(f'\n【需注意 · 声调不一致】{len(tone_warn)} 处')
for e in tone_warn:
    print('  !', e)
if tone_warn:
    print('  （若这些题属于「轻声」知识点，则是设计预期：pypinyin 默认不给轻声标调）')

print(f'\n【需注意 · 干扰项含非标准音节】{len(nonstd)} 处')
for e in nonstd:
    print('  ·', e)

print(f'\n【需注意 · 选项音节数异常】{len(style_warn)} 处')
for e in style_warn[:20]:
    print('  ·', e)

print('\n结论：' + ('❌ 有正确答案错误，必须修复' if errors else '✅ 全部正确答案与标准读音一致'))
sys.exit(1 if errors else 0)
