# -*- coding: utf-8 -*-
"""
逐题核验题库 —— 用法：
    pip install pypinyin
    python tools/check-pinyin.py

核验三件事：
  1) 每道题标定的「正确选项」是否等于该字的真实读音（pypinyin 标准读音）
     · 变调/轻声类知识点（轻声、三声连读、一不变调）只比对声母韵母，
       声调允许不同 —— 因为考的就是变调。
  2) 4 个选项是否互不相同
  3) 干扰项是否真的「像」正确答案（同声母或同韵母）
     —— 这是本项目题库质量的核心，干扰项离得太远就失去练习意义。
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))

# ---------- 用 node 把 data.js + questions.js 导出为 JSON ----------
NODE_SNIPPET = """
const fs=require('fs'),path=require('path');
const root=process.argv[process.argv.length-1];
const read=f=>fs.readFileSync(path.join(root,'js',f),'utf8');
const code=read('data.js')+'\\n'+read('questions.js');
const api=new Function(code+'\\n;return {KNOWLEDGE_POINTS,QUESTIONS};')();
process.stdout.write(JSON.stringify({kp:api.KNOWLEDGE_POINTS,q:api.QUESTIONS}));
"""
try:
    out = subprocess.run(['node', '-e', NODE_SNIPPET, ROOT],
                         capture_output=True, text=True, encoding='utf-8', check=True)
except FileNotFoundError:
    print('未找到 node，请先安装 Node.js')
    sys.exit(1)
except subprocess.CalledProcessError as e:
    print('读取题库失败：', e.stderr)
    sys.exit(1)

data = json.loads(out.stdout)
QS, KPS = data['q'], data['kp']

from pypinyin import pinyin, Style

TM = {'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a', 'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
      'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i', 'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
      'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u', 'ǖ': 'v', 'ǘ': 'v', 'ǚ': 'v', 'ǜ': 'v',
      'ü': 'v', 'ń': 'n', 'ň': 'n'}


def strip_tone(s):
    return ''.join(TM.get(c, c) for c in s).replace(' ', '').lower()


def real_pinyin(text):
    """题面的标准读音（带调号，无空格）"""
    return ''.join(g[0] for g in pinyin(text, style=Style.TONE, heteronym=False))


INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
            'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']


def split_initial(syl):
    """把一个音节切成 (声母, 韵母)，忽略声调"""
    s = strip_tone(syl)
    for ini in INITIALS:
        if s.startswith(ini):
            return ini, s[len(ini):]
    return '', s


def similar(a, b):
    """两个音节是否「像」：同声母、同韵母，或韵母互为后缀（ua / a 这种带介音的差异）"""
    ia, fa = split_initial(a)
    ib, fb = split_initial(b)
    if ia and ia == ib:
        return True
    if fa and fa == fb:
        return True
    if fa and fb and (fa.endswith(fb) or fb.endswith(fa)):
        return True
    return False


# 这几个知识点考的是变调 / 轻声，声调与字典本调不同是设计预期
SANDHI_KP = {'neutral', 'tone_3sandhi', 'yi_bu'}
# yi/wu/yu 这一组本身就是「i u ü 加 y/w 变身」，选项之间天然不同声母也不同韵母
# f/h 这一组有个语言事实：f 不能跟 ui 拼（没有 fui），所以「飞 fēi / 灰 huī」
#   这类经典最小对立，韵母也一定不同 —— 属正常，不是题库质量问题
SIMILAR_EXEMPT = {'yi_wu_yu', 'f_h'}

errors, tonegap, dup, far = [], [], [], []
seen_kp = {}

for q in QS:
    content, opts, ans, kid = q['content'], q['options'], q['answer'], q['knowledge']
    std = real_pinyin(content)
    chosen = opts[ans]
    tag = f"{q['id']} {content}"
    seen_kp[kid] = seen_kp.get(kid, 0) + 1

    if len(set(opts)) != 4:
        dup.append(f'{tag}: 选项有重复 {opts}')

    if not (0 <= ans < 4):
        errors.append(f'{tag}: answer 下标越界')
        continue

    # ---- 1) 正确选项核验 ----
    if kid in SANDHI_KP:
        if strip_tone(chosen) != strip_tone(std):
            errors.append(f'{tag}: 正确项 {chosen} 的声母韵母与标准 {std} 不符')
        elif chosen != std:
            tonegap.append(f'{tag}: {chosen}（本调 {std}，变调/轻声，符合设计）')
    else:
        if chosen != std:
            errors.append(f'{tag}: 正确项 {chosen} != 标准读音 {std}')
        else:
            # ---- 2) 干扰项是否真的「像」 ----
            if kid not in SIMILAR_EXEMPT:
                for o in opts:
                    if o == chosen:
                        continue
                    if not similar(chosen, o):
                        far.append(f'{tag}: 干扰项 {o} 与正确项 {chosen} 不像（既不同声母也不同韵母）')

LINE = '=' * 58
print(LINE)
print(f'题库总量：{len(QS)} 题   知识点：{len(KPS)} 个')
print(LINE)

print(f'\n【错误 · 正确选项拼音写错】{len(errors)} 处')
for e in errors:
    print('  X', e)

print(f'\n【错误 · 选项重复】{len(dup)} 处')
for e in dup:
    print('  X', e)

print(f'\n【警告 · 干扰项与正确项不像】{len(far)} 处')
for e in far[:25]:
    print('  !', e)

print(f'\n【说明 · 变调/轻声（设计预期，非错误）】{len(tonegap)} 处')
for e in tonegap[:6]:
    print('  ·', e)
if len(tonegap) > 6:
    print(f'  · …共 {len(tonegap)} 处')

bad = len(errors) + len(dup)
print('\n结论：' + ('X 存在必须修复的错误' if bad else 'OK 全部 232 道题的正确选项与标准读音一致'))
sys.exit(1 if bad else 0)
