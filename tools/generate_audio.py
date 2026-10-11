# -*- coding: utf-8 -*-
"""
批量生成 / 补生成全部语音（一次性，运行时零成本）

输出：
    audio/q/<题目id>.mp3      朗读题面汉字或词语
    audio/e/<知识点id>.mp3     朗读知识点讲解

用法：
    pip install edge-tts
    python tools/generate_audio.py

特点：
    · 已存在且大于 500 字节的文件会跳过，所以可以随时重跑「只补缺的」
    · 改了某道题的题面？删掉对应的 mp3 再跑一次即可
    · 想换音色，改下面的 VOICE
"""
import asyncio, json, os, re, subprocess, sys

try:
    import edge_tts
except ImportError:
    print('请先安装：pip install edge-tts')
    sys.exit(1)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..'))

VOICE = 'zh-CN-XiaoxiaoNeural'   # 可选：zh-CN-XiaoxiaoNeural / zh-CN-YunxiNeural / zh-CN-XiaoyiNeural
CONCURRENCY = 6
Q_RATE = '-20%'                  # 单字读慢一点，孩子听得清
E_RATE = '-8%'                   # 讲解语速

NODE_SNIPPET = """
const fs=require('fs'),path=require('path');
const root=process.argv[process.argv.length-1];
const code=fs.readFileSync(path.join(root,'js','data.js'),'utf8');
const api=new Function(code+'\\n;return {QUESTIONS};')();
process.stdout.write(JSON.stringify(api.QUESTIONS));
"""

KEEP = re.compile(r'[\u4e00-\u9fff\u3000-\u303f0-9a-zA-Z，。！？、：；（）《》—…·%,.!?;:()\[\]\-]')

def clean_for_tts(text):
    text = text.replace('\n', '，').replace('｜', '，').replace('|', '，')
    text = ''.join(ch for ch in text if KEEP.match(ch))
    text = re.sub(r'[，,]{2,}', '，', text)
    text = re.sub(r'[。！？]{2,}', '。', text)
    return text.strip('，。')

async def synth(text, out_path, rate, sem):
    async with sem:
        for attempt in range(3):
            try:
                await edge_tts.Communicate(text, VOICE, rate=rate).save(out_path)
                return True
            except Exception as e:
                if attempt == 2:
                    print(f'  ✗ 失败 {os.path.basename(out_path)}: {e}')
                    return False
                await asyncio.sleep(1.2 * (attempt + 1))

async def main():
    # 题库
    try:
        out = subprocess.run(['node', '-e', NODE_SNIPPET, ROOT],
                             capture_output=True, text=True, encoding='utf-8', check=True)
        questions = json.loads(out.stdout)
    except FileNotFoundError:
        print('未找到 node，请先安装 Node.js')
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print('读取 data.js 失败：', e.stderr)
        sys.exit(1)

    # 讲解文案（从 data.js 的 EXPLANATIONS 里解析）
    datajs = open(os.path.join(ROOT, 'js', 'data.js'), encoding='utf-8').read()
    m = re.search(r'const EXPLANATIONS = \{(.*?)\n\};', datajs, re.S)
    explanations = {}
    if m:
        for km in re.finditer(
                r"(\w+):\s*\{\s*title:\s*'([^']*)',\s*text:\s*'((?:[^'\\]|\\.)*)'\s*\}", m.group(1)):
            explanations[km.group(1)] = {
                'title': km.group(2),
                'text': km.group(3).replace('\\n', '\n').replace("\\'", "'"),
            }
    if not explanations:
        print('⚠️  没能解析出讲解文案，请检查 data.js 里 EXPLANATIONS 的写法')

    qdir = os.path.join(ROOT, 'audio', 'q')
    edir = os.path.join(ROOT, 'audio', 'e')
    os.makedirs(qdir, exist_ok=True)
    os.makedirs(edir, exist_ok=True)

    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []

    for q in questions:
        out = os.path.join(qdir, q['id'] + '.mp3')
        if os.path.exists(out) and os.path.getsize(out) > 500:
            continue
        tasks.append(synth(q['content'], out, Q_RATE, sem))

    for kid, ex in explanations.items():
        out = os.path.join(edir, kid + '.mp3')
        if os.path.exists(out) and os.path.getsize(out) > 500:
            continue
        tasks.append(synth(clean_for_tts(ex['title'] + '。' + ex['text']), out, E_RATE, sem))

    if not tasks:
        print('所有语音都已存在，无需生成。')
    else:
        print(f'待生成 {len(tasks)} 个文件，开始合成（音色 {VOICE}）…')
        results = await asyncio.gather(*tasks)
        print(f'完成：成功 {sum(1 for r in results if r)} / {len(results)}')

    total = 0
    for d in (qdir, edir):
        for f in os.listdir(d):
            total += os.path.getsize(os.path.join(d, f))
    print(f'音频总体积：{total / 1024 / 1024:.2f} MB')

if __name__ == '__main__':
    asyncio.run(main())
