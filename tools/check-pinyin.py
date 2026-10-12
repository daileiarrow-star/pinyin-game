# -*- coding: utf-8 -*-
"""
逐题核验题库 —— 用法：
    pip install pypinyin
    python tools/check-pinyin.py

核验五件事：
  1) 每道题标定的「正确选项」是否等于该字的真实读音（pypinyin 标准读音）
     · 变调/轻声类知识点（轻声、三声连读、一不变调）只比对声母韵母，
       声调允许不同 —— 因为考的就是变调。
  2) 4 个选项是否互不相同
  3) 干扰项是否真的「像」正确答案（同声母或同韵母）
     —— 这是本项目题库质量的核心，干扰项离得太远就失去练习意义。
  4) 填空题把补语填回空位后，是否还原成标准读音（▢ 在开头补声母，在中间补韵母+声调）
  5) 判断题/连线题/拼读积木的真值是否正确
     · 判断题：说「读对了」就必须真等于标准读音，说「读错了」就必须真的不等于
     · 连线题：每个字连到的拼音必须是它的真实读音
     · 拼读积木：字母块拼起来必须等于标准读音，干扰块不能也拼得出来
  6) classify 归类题：说「整体认读」的字，它的音节必须在 16 个整体认读音节里；
     说「不是整体认读」的，必须不在里面
  说明：比较时忽略空格与隔音符号的排版差异（「西安 xī'ān」与 pypinyin 的 xī ān 同音）
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
    """去调号 + 去空格 + 去隔音符号，用来比较「声母韵母骨架」"""
    return ''.join(TM.get(c, c) for c in s).replace(' ', '').replace("'", '').lower()


def norm(s):
    """原样比较时用的归一化：忽略空格与隔音符号的排版差异。
    （「西安 xī'ān」和 pypinyin 给出的 xī ān 是同一个读音，只是写法不同）"""
    return s.replace(' ', '').replace("'", '')


def real_pinyin(text):
    """题面的标准读音（带调号，无空格）"""
    return ''.join(g[0] for g in pinyin(text, style=Style.TONE, heteronym=False))


INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l',
            'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w']


def build_inventory():
    """用 pypinyin 扫一遍常用汉字，经验性地得到「合法音节表」（无声调）。
    比手写音节表更可靠：写错一个就少一个合法音节，这里不会。"""
    inv = set()
    for cp in range(0x4E00, 0x9FA6):
        try:
            for g in pinyin(chr(cp), style=Style.TONE, heteronym=True):
                for s in g:
                    inv.add(strip_tone(s))
        except Exception:
            continue
    return inv


SYLLABLES = build_inventory()

# 同源选择题索引：新题型复用选择题语音，可以借此拿到「已核验过的读音」当真值
CHOICE_BY_ID = {q['id']: q for q in QS if q.get('type') == 'choice'}


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


def fill_reconstruct(display, chosen):
    """把填空的候选块填回 ▢ 空位，还原出完整拼音。
    ▢ 在开头 → 补声母；▢ 在声母后面 → 补「韵母+声调」。
    例：('▢ā','b') -> 'bā' ；('b▢','ō') -> 'bō'"""
    if '▢' not in display:
        return ''
    head, _, tail = display.partition('▢')
    return head + chosen + tail
# yi/wu/yu 这一组本身就是「i u ü 加 y/w 变身」，选项之间天然不同声母也不同韵母
# f/h 这一组有个语言事实：f 不能跟 ui 拼（没有 fui），所以「飞 fēi / 灰 huī」
#   这类经典最小对立，韵母也一定不同 —— 属正常，不是题库质量问题
# y_w_rule 同理：干扰项就是「少写 y/w」的裸露形式（ī / iā / ǘn），
#   骨架本来就该不一样，否则就失去考点意义了
SIMILAR_EXEMPT = {'yi_wu_yu', 'f_h', 'y_w_rule'}

# 16 个整体认读音节（classify 题的判定依据）
ZHENGTI16 = {'zhi', 'chi', 'shi', 'ri', 'zi', 'ci', 'si', 'yi', 'wu', 'yu',
             'ye', 'yue', 'yuan', 'yin', 'yun', 'ying'}

errors, tonegap, dup, far = [], [], [], []
spelltrap = []          # 填空题里「填出来不是合法音节」的干扰块（故意的拼写陷阱）
seen_kp = {}

n_checked = 0
n_classify = 0
for q in QS:
    if q.get('type') not in ('choice', 'listen', 'fill', 'classify'):
        continue          # judge/match/spell 没有独立「正确选项」，其内容派生自已核验的选择题
    n_checked += 1
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

    # ---- 0) classify 归类题：真相不是「读音」而是「这个音节属不属于整体认读」 ----
    if q.get('type') == 'classify':
        n_classify += 1
        syl = strip_tone(std)
        want = '整体认读' if syl in ZHENGTI16 else '不是整体认读'
        if chosen != want:
            errors.append(f'{tag}: 答案选了「{chosen}」，但 {syl} {"是" if syl in ZHENGTI16 else "不是"}整体认读音节')
        continue

    # ---- 1) 正确选项核验 ----
    if kid in SANDHI_KP:
        if strip_tone(chosen) != strip_tone(std):
            errors.append(f'{tag}: 正确项 {chosen} 的声母韵母与标准 {std} 不符')
        elif norm(chosen) != norm(std):
            tonegap.append(f'{tag}: {chosen}（本调 {std}，变调/轻声，符合设计）')
    elif q.get('type') == 'fill':
        # 填空题：把补语填回空位，必须还原成标准读音
        got = fill_reconstruct(q.get('display', ''), chosen)
        if norm(got) != norm(std):
            errors.append(f'{tag}: 填空补出来是 {got}，标准读音是 {std}')
        # 干扰块填回去若是「不存在的音节」，那是故意的拼写陷阱（如 qǜ），
        # 不算错误，但要列出来让人确认确实是设计意图
        for o in opts:
            if o == chosen:
                continue
            cand = fill_reconstruct(q.get('display', ''), o)
            if strip_tone(cand) not in SYLLABLES:
                spelltrap.append(f'{tag}: 干扰块 {o} → {cand}（拼音里没有这个音节，属拼写陷阱）')
    else:
        if norm(chosen) != norm(std):
            errors.append(f'{tag}: 正确项 {chosen} != 标准读音 {std}')
        else:
            # ---- 2) 干扰项是否真的「像」 ----
            if kid not in SIMILAR_EXEMPT:
                for o in opts:
                    if o == chosen:
                        continue
                    if not similar(chosen, o):
                        far.append(f'{tag}: 干扰项 {o} 与正确项 {chosen} 不像（既不同声母也不同韵母）')


# ============================================================
#  第二遍：判断题 / 连线题 / 拼读积木
#  这三类题型没有 choices+answer，但同样有自己的「真值」：
#  判断题要判断标称读音是真是假、连线题要配对正确、积木要能拼出正确读音。
#  写错任何一处都会直接教错孩子，必须逐条核验。
# ============================================================
n_judge = n_match = n_spell = 0
for q in QS:
    t = q.get('type')
    if t not in ('judge', 'match', 'spell'):
        continue

    if t == 'judge':
        n_judge += 1
        content, given, ok_flag = q['content'], q.get('judgePinyin', ''), q.get('judgeOk')
        std = real_pinyin(content)
        kid = q['knowledge']
        tag = f"{q['id']} {content}"
        if kid in SANDHI_KP:
            # 变调/轻声类：pypinyin 给的是字典本调，做不了「标称读音对不对」的裁判，
            # 改用同源选择题里已核验过的读音作为真值：
            #   判断题说「读对了」→ 标称读音必须就是那个真值
            #   判断题说「读错了」→ 标称读音必须不等于真值
            src = CHOICE_BY_ID.get(q.get('audioId'))
            if strip_tone(given) != strip_tone(std):
                errors.append(f'{tag}: 判断题标称 {given} 的声母韵母与「{content}」不符（应为 {std} 一类）')
            if src is None:
                errors.append(f'{tag}: 判断题找不到同源选择题（audioId={q.get("audioId")}）')
            else:
                truth = src['options'][src['answer']]
                if ok_flag and norm(given) != norm(truth):
                    errors.append(f'{tag}: 说「读对了」，但标称 {given} 与正确读音 {truth} 不符')
                if (not ok_flag) and norm(given) == norm(truth):
                    errors.append(f'{tag}: 说「读错了」，但标称 {given} 其实就是正确读音 {truth}')
        elif ok_flag and norm(given) != norm(std):
            errors.append(f'{tag}: 判断题说「读对了」，但标称 {given} 与标准 {std} 不符')
        elif (not ok_flag) and norm(given) == norm(std):
            errors.append(f'{tag}: 判断题说「读错了」，但标称 {given} 其实就等于标准读音 {std}')

    elif t == 'match':
        n_match += 1
        for ch, py in q.get('pairs', []):
            std = real_pinyin(ch)
            if q['knowledge'] in SANDHI_KP:
                if strip_tone(py) != strip_tone(std):
                    errors.append(f"{q['id']}: 连线题把「{ch}」连到了 {py}，声母韵母与 {std} 不符")
            elif norm(py) != norm(std):
                errors.append(f"{q['id']}: 连线题把「{ch}」连到了 {py}，标准读音是 {std}")

    elif t == 'spell':
        n_spell += 1
        std = real_pinyin(q['content'])
        tag = f"{q['id']} {q['content']}"
        if norm(''.join(q.get('tiles', []))) != norm(std):
            errors.append(f"{tag}: 积木块拼出来是 {''.join(q.get('tiles', []))}，标准读音是 {std}")
        # 干扰块不能被拼成正确答案（否则会出现两个正确答案）
        if norm(''.join(q.get('extraTiles', []))) == norm(std):
            errors.append(f"{tag}: 干扰块也能拼出正确读音 {std}")
        # 每一块都必须真实出现在标准读音里，避免出现「拼不出来的块」
        if norm(''.join(q.get('tiles', []))) == norm(std):
            for blk in q.get('tiles', []):
                if blk not in std:
                    errors.append(f"{tag}: 字母块「{blk}」不在标准读音 {std} 里")
        if len(set(q.get('tiles', []))) != len(q.get('tiles', [])):
            errors.append(f'{tag}: 积木块有重复 {q.get("tiles")}')

LINE = '=' * 58
print(LINE)
print(f'题库总量：{len(QS)} 题   知识点：{len(KPS)} 个')
print(f'  有标准答案核验（选择/听音/填空）：{n_checked - n_classify} 题')
print(f'  整体认读归类核验（classify）：{n_classify} 题')
print(f'  真值核验（判断/连线/拼读积木）：{n_judge} / {n_match} / {n_spell} 题')
print(LINE)

print(f'\n【错误 · 拼音/真值写错】{len(errors)} 处')
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

print(f'\n【说明 · 填空题里的拼写陷阱（填出来不是合法音节，属设计意图）】{len(spelltrap)} 处')
for e in spelltrap[:10]:
    print('  ·', e)
if len(spelltrap) > 10:
    print(f'  · …共 {len(spelltrap)} 处')

bad = len(errors) + len(dup)
total = n_checked + n_judge + n_match + n_spell
print('\n结论：' + ('X 存在必须修复的错误' if bad else f'OK 全部 {total} 道题的正确读音 / 真值均与标准一致'))
sys.exit(1 if bad else 0)
