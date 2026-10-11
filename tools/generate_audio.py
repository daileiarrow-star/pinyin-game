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
const read=f=>fs.readFileSync(path.join(root,'js',f),'utf8');
const code=read('data.js')+'\\n'+read('questions.js');
const api=new Function(code+'\\n;return {QUESTIONS,EXPLANATIONS,explainSpeech};')();
const out={q:[],e:[]};
api.QUESTIONS.forEach(q=>out.q.push({id:q.id,text:q.content}));
Object.keys(api.EXPLANATIONS).forEach(kid=>out.e.push({id:kid,text:api.explainSpeech(kid)}));
process.stdout.write(JSON.stringify(out));
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
    # 题库 + 讲解朗读稿（与 app.js 的 explainSpeech 完全同源）
    try:
        out = subprocess.run(['node', '-e', NODE_SNIPPET, ROOT],
                             capture_output=True, text=True, encoding='utf-8', check=True)
        payload = json.loads(out.stdout)
    except FileNotFoundError:
        print('未找到 node，请先安装 Node.js')
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print('读取题库失败：', e.stderr)
        sys.exit(1)

    questions = payload['q']
    explanations = {x['id']: x['text'] for x in payload['e']}
    if not explanations:
        print('⚠️  没有拿到讲解朗读稿，请检查 data.js 里 explainSpeech()')

    qdir = os.path.join(ROOT, 'audio', 'q')
    edir = os.path.join(ROOT, 'audio', 'e')
    os.makedirs(qdir, exist_ok=True)
    os.makedirs(edir, exist_ok=True)

    force = '--force' in sys.argv

    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = []

    for q in questions:
        out = os.path.join(qdir, q['id'] + '.mp3')
        if not force and os.path.exists(out) and os.path.getsize(out) > 500:
            continue
        tasks.append(synth(clean_for_tts(q['text']), out, Q_RATE, sem))

    for kid, text in explanations.items():
        out = os.path.join(edir, kid + '.mp3')
        if not force and os.path.exists(out) and os.path.getsize(out) > 500:
            continue
        tasks.append(synth(clean_for_tts(text), out, E_RATE, sem))

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
