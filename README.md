# 拼音小达人 · 一年级易错拼音强化练习

一个**纯静态 H5 网页**（微信里发链接就能玩），面向已学过拼音、但掌握不牢、有高频易错点的一年级小朋友。

- **零 Token 成本**：题目、讲解全部预置；语音是提前生成好的 mp3，运行时**不调用任何 AI API**
- **即时纠错闭环**：答错 → 弹出讲解 → 举一反三 → 原题重测
- **游戏化激励**：积分 + 装扮兑换 + 随机彩蛋
- **无需审核、无需服务器**：上传到 GitHub，用 Vercel 免费托管即可上线

---

## 目录结构

```
pinyin-game/
├── index.html              首页 / 练习页 / 结果页 / 报告页 / 衣柜页
├── css/style.css           全部样式（移动优先、儿童友好）
├── js/
│   ├── data.js             ★ 内容源：29 知识点 + 232 题 + 29 条讲解 + 装扮
│   └── app.js              全部逻辑（抽题、纠错、积分、彩蛋、报告、语音）
├── audio/
│   ├── q/<题目id>.mp3       232 条题面朗读
│   └── e/<知识点id>.mp3     29 条讲解朗读
├── assets/
│   └── (放你的收款码 qrcode.png)
├── tools/
│   ├── generate_audio.py   重新批量生成语音（需要时再跑）
│   ├── check-data.js       题库结构自检
│   └── check-pinyin.py     用 pypinyin 逐题核验答案拼音
└── README.md
```

内容规模：**29 个易错知识点 × 8 题 = 232 道题**，覆盖声母/韵母/整体认读/声调/标调规则/前后鼻音平翘舌。

---

## 一、先在本机看一眼（1 分钟，可选）

直接双击 `index.html`，用浏览器打开即可试玩。

> 小提示：直接双击打开时（`file://` 协议）语音可能不响，这是浏览器的安全限制。
> 想听到声音，在本文件夹里跑一条命令起个本地服务：
> ```bash
> npx serve .
> ```
> 然后浏览器打开提示的地址（一般是 http://localhost:3000）。

---

## 二、上传到 GitHub

### 第 1 步：先设好你的 Git 身份（只需一次）

在本项目文件夹里打开终端（文件夹地址栏输入 `cmd` 回车即可），执行：

```bash
git config user.name "你的GitHub用户名"
git config user.email "你的GitHub注册邮箱"
```

> 因为本地的 git 仓库和全部文件**已经提交好了**，你只需要换个身份信息，然后推送。

### 第 2 步：在 GitHub 上建一个空仓库

1. 打开 https://github.com/new
2. **Repository name** 填 `pinyin-game`
3. 选 **Public**（Private 也能部署到 Vercel 免费版，Public 最省事）
4. **不要**勾选 "Add a README file"、".gitignore"、"license" —— 保持完全空白
5. 点 **Create repository**

### 第 3 步：把本地项目推上去

创建完成后 GitHub 会显示一个以 `git remote add origin ...` 开头的命令块。
复制那行 `git remote add origin` 的地址（形如 `https://github.com/你的用户名/pinyin-game.git`），然后执行：

```bash
git remote add origin https://github.com/你的用户名/pinyin-game.git
git push -u origin main
```

推送时会弹出一个浏览器窗口让你登录 GitHub 授权（本机已装 Git Credential Manager，跟着点就行）。
如果它改成要你输入用户名/密码：**密码位置要填 Personal Access Token**，不是登录密码。
生成方式：GitHub 右上角头像 → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → 勾选 `repo` → 生成后复制那串字符当密码用。

> 推送成功后刷新 GitHub 页面，应该能看到 269 个文件（含 261 个语音文件）。

---

## 三、用 Vercel 部署上线

1. 打开 https://vercel.com/new
2. 用 GitHub 账号登录（如果还没登录）
3. 在 **Import Git Repository** 列表里找到 `pinyin-game`，点 **Import**
4. 配置页什么都不用改：
   - Framework Preset：**Other**
   - Build Command：**留空**
   - Output Directory：**留空**
5. 点 **Deploy**，等 30~60 秒

完成后 Vercel 会给你一个正式网址，形如：

```
https://pinyin-game-xxxx.vercel.app
```

**这就是可以发给家长群的链接了。** 手机微信里直接打开就能玩。

> 以后你在 GitHub 上改了任何文件，Vercel 会自动重新部署，不用再手动操作。

### 想要自己的域名？（可选）

1. 在阿里云/腾讯云买一个域名（约 ¥50/年，需实名认证）
2. Vercel 项目 → **Settings** → **Domains** → 填入你的域名 → Add
3. 按 Vercel 提示到域名服务商那里加两条 DNS 记录（一般是一条 A 记录 + 一条 CNAME）
4. 等几分钟生效

> ⚠️ 国内域名解析到 Vercel 后，微信内打开的速度取决于网络环境。如果发现加载慢，
> 可以考虑换成国内的静态托管（如腾讯云 COS + CDN），代码完全不用改。

---

## 四、上线前必须改的 3 个地方

打开 `js/data.js`，最上面就是配置区：

```js
const CONFIG = {
  brand: '拼音小达人',
  sessionLength: 20,                                  // 每轮题数
  freeDailyLimit: 10,                                 // 免费版每天几题
  activationCodes: ['PINYIN2026', 'PYDADA2026'],      // ★ 改成你自己的激活码
  qrImage: 'assets/qrcode.png',                       // ★ 你的收款码
  contact: '微信：your_wechat_id',                    // ★ 你的客服微信
};
```

| 要改的 | 怎么改 |
|:---|:---|
| **激活码** | 把 `PINYIN2026` 换成只有你和客服知道的字符串（大写字母+数字） |
| **收款码** | 把微信/支付宝收款码图片存成 `assets/qrcode.png`（没有这个文件时会显示占位提示，不会报错） |
| **客服微信** | 把 `your_wechat_id` 换成你的微信号 |

**家长付款流程**：家长在页面里点「开通完整版」→ 扫码付 99 元 → 把截图发你 → 你把激活码发给他 →
他在弹窗里输入激活码 → 立即解锁无限练习。

> 更省事的方式：直接在你要发出去的链接后面加参数，例如
> `https://你的域名.vercel.app/?code=PINYIN2026`
> 家长打开这个链接会自动变成完整版（适合你一对一发给已付款的家长）。

---

## 五、以后怎么改内容

所有内容都在 `js/data.js`，改完存盘、推到 GitHub，Vercel 自动重新部署。

### 加一道题

在 `QUESTIONS` 里按格式加一行即可：

```js
{ id:'b_p-9', knowledge:'b_p', content:'爸', options:['bà','pà','dà','tà'], answer:0 },
```

- `id`：唯一就行（建议 `知识点id-序号`）
- `content`：题面，1~3 个汉字都可以（比如轻声那组用的是词语"妈妈"）
- `options`：4 个选项，**第一个位置随便放**，靠 `answer` 指定正确项的下标
- `answer`：正确选项在 `options` 里的下标（从 0 开始）
- 前端会自动打乱选项顺序，所以不用担心"答案总是在第一个"

### 改讲解文案

在 `EXPLANATIONS` 里找到对应知识点（比如 `b_p`），改 `title` 和 `text` 即可。
`text` 里用 `\n` 换行，`🔑` 是口诀、`📝` 是对比练习。

### 改完记得自检

```bash
node tools/check-data.js
```

会检查：题目数量、选项是否重复、答案下标是否越界、知识点是否有讲解、装扮字段是否完整。

### 重新生成语音（改了题面或讲解后）

```bash
pip install edge-tts
python tools/generate_audio.py
```

脚本只会补生成缺失的文件（已存在的会跳过）。想换音色，改脚本里的 `VOICE`：
`zh-CN-XiaoxiaoNeural`（温柔女声）/ `zh-CN-YunxiNeural`（清朗男声）/ `zh-CN-XiaoyiNeural`（活泼女声）。

---

## 六、语音是怎么工作的

两级降级，**永远不花钱**：

1. **优先**播放 `audio/q/<id>.mp3`（提前用 edge-tts 生成的真人级语音，微信里稳定）
2. 如果音频文件缺失或加载失败 → 自动降级到浏览器内置的语音合成（`speechSynthesis`）
3. 浏览器也不支持 → 提示"这个浏览器不支持朗读"，其余功能照常用

---

## 七、教学逻辑说明

### 抽题优先级（全在本地算，不调 AI）

```
第 1 优先：答错过的题（且对应知识点还没掌握）—— 错得越多越靠前
第 2 优先：从没做过的题
第 3 优先：已做过的复习题 —— 连续答对次数越少越靠前
        并且尽量不让连续两道题撞同一个知识点
```

### 答错后的闭环

```
答错 → 立刻弹出该知识点的图文讲解（可听语音）
     → 关闭讲解，插入一道「举一反三」同类题
     → 原题排到本轮最后，重新测一次
     → 重测答对额外 +15 分
```

### 积分规则

| 行为 | 积分 |
|:---|:---|
| 答对 1 题 | +10 |
| 连续答对 5 题 | 额外 +20 |
| 掌握 1 个知识点 | +50 |
| 看完讲解后重测答对 | 额外 +15 |

### 「掌握」怎么判定

某个知识点下的题，**至少答过 4 道，且其中至少 3 道已连续答对 2 次** → 判定为掌握。

### 彩蛋触发

- 累计掌握的知识点数每达到 **3 的倍数** 触发一次
- 连续练习天数每达到 **3 的倍数** 触发一次
- 彩蛋从「还没有的装扮」里随机掉一件，全收集齐了则改送 +100 积分

---

## 八、常见问题

**Q：点「听一听」没声音？**
A：① 先确认是在 http/https 下打开（双击本地文件不行）；② 手机音量/静音键；③ 检查 `audio/q/` 里有没有对应的 mp3。

**Q：微信里打开链接，提示"非官方网页"或加载慢？**
A：这是国内访问 Vercel 的常见现象，功能不受影响。要彻底解决就换国内静态托管（腾讯云 COS/CDN）。

**Q：想加"看图片选注音""连线题"怎么办？**
A：`js/app.js` 的 `renderQuestion()` 是按题型渲染的入口，加新题型时在这里分支即可；
数据结构上给 `QUESTIONS` 加一个 `type` 字段区分。现有架构已经留好了位置。

**Q：数据存在哪？换手机还在吗？**
A：目前存在浏览器 localStorage 里，**换设备/清缓存会丢**。
如果要跨设备同步，需要接后端（微信登录 + 云数据库），这是 V2 的事。

**Q：免费版和完整版的区别？**
A：免费版每天 `freeDailyLimit`（默认 10）道题；完整版不限次数。改这个数值就能调整策略。

---

## 九、上线检查清单

- [ ] `js/data.js` 里的 `activationCodes` 已改成自己的
- [ ] `assets/qrcode.png` 已放上自己的收款码
- [ ] `CONFIG.contact` 已改成自己的客服微信
- [ ] 手机微信里打开线上链接，完整走一遍：练习 → 答错 → 讲解 → 举一反三 → 重测
- [ ] 试一遍积分兑换装扮
- [ ] 用自己的激活码试一遍开通流程
- [ ] 在旧手机上（或让朋友）打开一次，确认语音和布局正常
