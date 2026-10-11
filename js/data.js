/* =========================================================
   拼音小达人 — 数据文件
   ---------------------------------------------------------
   内容全部为「预置静态数据」，运行时零 API 调用、零 Token 成本。
   知识点：29 个（按"高频易错混淆对"划分，不按传统声母/韵母分类）
   题目：29 × 8 = 232 道（看汉字/词语 → 选正确注音）
   讲解：29 条（图文卡 + 语音，出错时即时弹出）
   ========================================================= */

/* ---------- 全局配置 ---------- */
const CONFIG = {
  brand: '拼音小达人',
  sessionLength: 20,        // 每轮练习题数
  freeDailyLimit: 10,       // 免费版每日题数上限
  // ⚠️ 上线前请务必改成你自己的激活码
  activationCodes: ['PINYIN2026', 'PYDADA2026'],
  qrImage: 'assets/qrcode.png',
  contact: '微信：your_wechat_id',
  audioBase: 'audio/'       // 预生成语音目录（没有该目录时会自动降级到浏览器语音合成）
};

/* ---------- 29 个易错知识点 ---------- */
const KNOWLEDGE_POINTS = [
  // ===== 声母混淆（9）=====
  { id: 'b_p',   name: 'b 和 p 不分',    tag: 'b / p',   category: '声母', tip: 'b 不送气，p 要送气' },
  { id: 'd_t',   name: 'd 和 t 不分',    tag: 'd / t',   category: '声母', tip: 'd 不送气，t 要送气' },
  { id: 'g_k',   name: 'g 和 k 不分',    tag: 'g / k',   category: '声母', tip: 'g 不送气，k 要送气' },
  { id: 'j_q',   name: 'j 和 q 不分',    tag: 'j / q',   category: '声母', tip: 'j 不送气，q 要送气' },
  { id: 'zh_z',  name: 'zh 和 z 不分',   tag: 'zh / z',  category: '声母', tip: 'zh 翘舌，z 平舌' },
  { id: 'ch_c',  name: 'ch 和 c 不分',   tag: 'ch / c',  category: '声母', tip: 'ch 翘舌，c 平舌' },
  { id: 'sh_s',  name: 'sh 和 s 不分',   tag: 'sh / s',  category: '声母', tip: 'sh 翘舌，s 平舌' },
  { id: 'n_l',   name: 'n 和 l 不分',    tag: 'n / l',   category: '声母', tip: 'n 是鼻音，l 是边音' },
  { id: 'f_h',   name: 'f 和 h 不分',    tag: 'f / h',   category: '声母', tip: 'f 上齿咬下唇，h 舌根出气' },

  // ===== 韵母混淆（8）=====
  { id: 'o_ou',  name: 'o 和 ou 不分',   tag: 'o / ou',  category: '韵母', tip: 'o 单韵母，ou 复韵母' },
  { id: 'o_uo',  name: 'o 和 uo 不分',   tag: 'o / uo',  category: '韵母', tip: 'uo 中间要加 u' },
  { id: 'an_ang',name: 'an 和 ang 不分', tag: 'an/ang',  category: '韵母', tip: 'an 前鼻音，ang 后鼻音' },
  { id: 'en_eng',name: 'en 和 eng 不分', tag: 'en/eng',  category: '韵母', tip: 'en 前鼻音，eng 后鼻音' },
  { id: 'in_ing',name: 'in 和 ing 不分', tag: 'in/ing',  category: '韵母', tip: 'in 前鼻音，ing 后鼻音' },
  { id: 'ie_ve', name: 'ie 和 üe 不分',  tag: 'ie / üe', category: '韵母', tip: 'ie 不圆唇，üe 要圆唇' },
  { id: 'ei_ui', name: 'ei 和 ui 不分',  tag: 'ei / ui', category: '韵母', tip: 'ei 先 e 后 i，ui 先 u 后 i' },
  { id: 'iu_ou', name: 'iu 和 ou 不分',  tag: 'iu / ou', category: '韵母', tip: 'iu 由 i 滑向 ou' },

  // ===== 整体认读（4）=====
  { id: 'zhi_chi_shi', name: 'zhi chi shi',  tag: 'zhi/chi/shi', category: '整体认读', tip: '直接读，不要拼' },
  { id: 'zi_ci_si',    name: 'zi ci si',     tag: 'zi/ci/si',    category: '整体认读', tip: '直接读，不要拼' },
  { id: 'yi_wu_yu',    name: 'yi wu yu',     tag: 'yi/wu/yu',    category: '整体认读', tip: 'i u ü 加 y/w 变身' },
  { id: 'ye_yue_yuan', name: 'ye yue yuan',  tag: 'ye/yue/yuan', category: '整体认读', tip: 'ie üe üan 加 y 变身' },

  // ===== 声调（4）=====
  { id: 'tone_1_2',    name: '一声 和 二声', tag: '1 / 2 声', category: '声调', tip: '一声平，二声扬' },
  { id: 'tone_2_3',    name: '二声 和 三声', tag: '2 / 3 声', category: '声调', tip: '二声上扬，三声拐弯' },
  { id: 'tone_3_4',    name: '三声 和 四声', tag: '3 / 4 声', category: '声调', tip: '三声拐弯，四声下坡' },
  { id: 'neutral',     name: '轻声',        tag: '轻声',     category: '声调', tip: '又轻又短，一带而过' },

  // ===== 标调规则（2）=====
  { id: 'mark_iu', name: 'i u 并列标在后', tag: 'i u 标调', category: '标调', tip: 'i u 并列，声调标在后面那个' },
  { id: 'u_dots',  name: 'ü 上两点要省略', tag: 'ü 省两点', category: '标调', tip: 'j q x 后面的 ü 去掉两点' },

  // ===== 其他（2）=====
  { id: 'nasal',  name: '前后鼻音综合',  tag: '前后鼻音', category: '其他', tip: '前鼻舌尖抵，后鼻舌根起' },
  { id: 'flat_c', name: '平翘舌综合',    tag: '平翘舌',   category: '其他', tip: 'z c s 平舌，zh ch sh 翘舌' }
];

/* ---------- 29 条知识点讲解（出错时弹出）---------- */
const EXPLANATIONS = {
  b_p: {
    title: 'b 和 p 的区别',
    text: 'b 不送气，读的时候把纸片放在嘴前，纸片不动。\n\np 要送气，读的时候纸片会被吹动，手上能感到一股气。\n\n🔑 口诀：b 像广播 bbb，p 像泼水 ppp；b 不送气，p 送气。\n\n📝 对比练习：八 bā — 趴 pā ｜ 白 bái — 拍 pāi ｜ 半 bàn — 判 pàn'
  },
  d_t: {
    title: 'd 和 t 的区别',
    text: 'd 不送气，舌尖抵住上牙床，一放开就出声，气流很弱。\n\nt 要送气，位置一样，但放开时有一股气流冲出来。\n\n🔑 口诀：d 像马蹄 ddd，t 像伞把 ttt；摸喉咙，d 不震、t 有气。\n\n📝 对比练习：大 dà — 他 tā ｜ 弟 dì — 踢 tī ｜ 多 duō — 拖 tuō'
  },
  g_k: {
    title: 'g 和 k 的区别',
    text: 'g 不送气，舌根抵住软腭，放开时气流很弱。\n\nk 要送气，位置一样，但有一股较强的气流冲出来。\n\n🔑 口诀：g 像鸽子 ggg，k 像蝌蚪 kkk；g 轻轻，k 用力。\n\n📝 对比练习：哥 gē — 科 kē ｜ 高 gāo — 考 kǎo ｜ 关 guān — 宽 kuān'
  },
  j_q: {
    title: 'j 和 q 的区别',
    text: 'j 不送气，舌面贴住硬腭前部，放开时气流很弱。\n\nq 要送气，位置一样，但放开时有明显气流冲出。\n\n🔑 口诀：j 像公鸡 jjj，q 像气球 qqq；j 不送气，q 送气。\n\n📝 对比练习：鸡 jī — 七 qī ｜ 家 jiā — 掐 qiā ｜ 九 jiǔ — 糗 qiǔ'
  },
  zh_z: {
    title: 'zh 和 z 的区别',
    text: 'zh 是翘舌音：舌尖翘起来，抵住上腭前部。\n\nz 是平舌音：舌尖平伸，抵住上齿背。\n\n🔑 口诀：zh 像小椅子 zh zh zh，z 像小写字 z z z；翘舌和平舌，位置差很多。\n\n📝 对比练习：知 zhī — 资 zī ｜ 中 zhōng — 宗 zōng ｜ 站 zhàn — 赞 zàn'
  },
  ch_c: {
    title: 'ch 和 c 的区别',
    text: 'ch 是翘舌音，舌尖翘起，而且要送气，气流较强。\n\nc 是平舌音，舌尖平伸，同样送气，但舌尖在前。\n\n🔑 口诀：ch 像吃饭 ch ch ch，c 像刺猬 c c c。\n\n📝 对比练习：吃 chī — 疵 cī ｜ 车 chē — 册 cè ｜ 池 chí — 词 cí'
  },
  sh_s: {
    title: 'sh 和 s 的区别',
    text: 'sh 是翘舌音：舌尖翘起，靠近上腭，气流从缝隙摩擦出来，不送气。\n\ns 是平舌音：舌尖平伸，靠近上齿背，气流从缝隙摩擦出来。\n\n🔑 口诀：sh 像狮子 sh sh sh，s 像丝瓜 s s s。\n\n📝 对比练习：师 shī — 思 sī ｜ 山 shān — 三 sān ｜ 手 shǒu — 叟 sǒu'
  },
  n_l: {
    title: 'n 和 l 的区别',
    text: 'n 是鼻音：舌尖抵住上牙床，气流从鼻腔出来，捏住鼻子就读不出来。\n\nl 是边音：舌尖抵住上牙床，气流从舌头两边出来，捏住鼻子照样能读。\n\n🔑 口诀：n 像门洞 n n n，l 像小棍 l l l；捏鼻子，n 读不出，l 没问题。\n\n📝 对比练习：牛 niú — 流 liú ｜ 脑 nǎo — 老 lǎo ｜ 农 nóng — 龙 lóng'
  },
  f_h: {
    title: 'f 和 h 的区别',
    text: 'f 是唇齿音：上齿轻轻咬住下唇，气流从唇齿缝里出来。\n\nh 是舌根音：嘴巴张开，舌根抬起，气流从喉咙里呼出来。\n\n🔑 口诀：f 像拐杖 fff（咬嘴唇），h 像椅子 hhh（哈气）。\n\n📝 对比练习：发 fā — 花 huā ｜ 飞 fēi — 灰 huī ｜ 房 fáng — 黄 huáng'
  },

  o_ou: {
    title: 'o 和 ou 的区别',
    text: 'o 是单韵母，读的时候嘴巴一直圆圆的，口型不变，声音短。\n\nou 是复韵母，读的时候嘴巴先从 o 滑到 u，口型会变，声音长一点。\n\n🔑 口诀：o 是圆圆小嘴巴，ou 是 o 加 u 滑一滑。\n\n📝 对比练习：波 bō — 兜 dōu ｜ 摸 mō — 谋 móu ｜ 婆 pó — 剖 pōu'
  },
  o_uo: {
    title: 'o 和 uo 的区别',
    text: 'o 是单韵母，前面不用加任何东西。\n\nuo 是两个字母合起来的，读的时候先 u 再 o，中间不能少掉 u。\n\n🔑 口诀：单韵母 o 就一个，uo 是 u 带 o 一起跑。\n\n📝 对比练习：多 duō ｜ 托 tuō ｜ 说 shuō ｜ 火 huǒ ｜ 错 cuò'
  },
  an_ang: {
    title: 'an 和 ang 的区别',
    text: 'an 是前鼻音：舌尖抵住上牙床，声音从前鼻腔出来，嘴巴不太张。\n\nang 是后鼻音：舌根抬起，嘴巴张大，声音从后鼻腔出来。\n\n🔑 口诀：an 像天安门（舌尖在前），ang 像昂起头（舌根在后）。\n\n📝 对比练习：班 bān — 帮 bāng ｜ 看 kàn — 抗 kàng ｜ 谈 tán — 糖 táng'
  },
  en_eng: {
    title: 'en 和 eng 的区别',
    text: 'en 是前鼻音：舌尖抵住上牙床，嘴巴扁扁的，声音在鼻子前面。\n\neng 是后鼻音：舌根抬起抵住软腭，嘴巴稍微张开，声音在鼻子后面。\n\n🔑 口诀：en 像摁门铃，eng 像灯发光。\n\n📝 对比练习：门 mén — 蒙 méng ｜ 真 zhēn — 争 zhēng ｜ 盆 pén — 朋 péng'
  },
  in_ing: {
    title: 'in 和 ing 的区别',
    text: 'in 是前鼻音：舌尖抵住上牙床，声音短，收在鼻腔前面。\n\ning 是后鼻音：舌根抬起，声音长一点，收在鼻腔后面。\n\n🔑 口诀：in 像阴天 in in in，ing 像老鹰 ing ing ing。\n\n📝 对比练习：音 yīn — 英 yīng ｜ 林 lín — 铃 líng ｜ 心 xīn — 星 xīng'
  },
  ie_ve: {
    title: 'ie 和 üe 的区别',
    text: 'ie 读的时候嘴唇是扁的、不圆的，从 i 滑到 e。\n\nüe 读的时候嘴唇一定要圆起来（像吹口哨），从 ü 滑到 e。\n\n🔑 口诀：ie 扁扁真客气，üe 圆圆像月亮；圆不圆嘴，一听就知道。\n\n📝 对比练习：写 xiě — 雪 xuě ｜ 节 jié — 决 jué ｜ 也 yě — 月 yuè'
  },
  ei_ui: {
    title: 'ei 和 ui 的区别',
    text: 'ei 读的时候前面是 e 重、后面 i 轻，嘴巴从 e 滑到 i。\n\nui 读的时候前面是 u 重、后面 i 轻，嘴巴从 u 滑到 i，嘴唇一开始是圆的。\n\n🔑 口诀：ei 先 e 后 i（咧嘴），ui 先 u 后 i（先圆嘴）。\n\n📝 对比练习：飞 fēi — 灰 huī ｜ 雷 léi — 类 lèi ｜ 北 běi — 被 bèi'
  },
  iu_ou: {
    title: 'iu 和 ou 的区别',
    text: 'iu 其实是 i + ou 合起来的，读的时候先发 i，再滑到 ou，中间那个 o 的音不能丢。\n\nou 直接从 o 滑到 u，前面没有 i。\n\n🔑 口诀：iu 前面有个 i，ou 前面光溜溜。\n\n📝 对比练习：流 liú — 楼 lóu ｜ 六 liù — 漏 lòu ｜ 酒 jiǔ — 走 zǒu'
  },

  zhi_chi_shi: {
    title: '整体认读：zhi chi shi',
    text: 'zhi、chi、shi 是「整体认读音节」，要整个记住，直接读出来。\n\n⚠️ 千万不要拆成「zh-i」「ch-i」「sh-i」去拼，那样是错的。\n\n🔑 口诀：zhi chi shi，整体认读不分开。\n\n📝 对比练习：知 zhī ｜ 吃 chī ｜ 诗 shī ｜ 纸 zhǐ ｜ 尺 chǐ ｜ 石 shí'
  },
  zi_ci_si: {
    title: '整体认读：zi ci si',
    text: 'zi、ci、si 也是整体认读音节，看到就要直接读出来。\n\n⚠️ 不要拼成「z-i」，直接读「zi」就对了。\n\n🔑 口诀：zi ci si，整体认读不分开。\n\n📝 对比练习：资 zī ｜ 疵 cī ｜ 丝 sī ｜ 紫 zǐ ｜ 此 cǐ ｜ 死 sǐ'
  },
  yi_wu_yu: {
    title: '整体认读：yi wu yu',
    text: 'i、u、ü 不能自己单独做一个音节，要请 y 或 w 来帮忙：\n\n· 小 i 加 y 变成 yi\n· 小 u 加 w 变成 wu\n· 小 ü 加 y 变成 yu（两点也一起去掉）\n\n🔑 口诀：i 找 y，u 找 w，ü 见 y 就脱帽。\n\n📝 对比练习：一 yī ｜ 五 wǔ ｜ 鱼 yú ｜ 雨 yǔ ｜ 屋 wū'
  },
  ye_yue_yuan: {
    title: '整体认读：ye yue yuan',
    text: 'ie、üe、üan 也不能自己单独成音节，要让 y 来帮忙：\n\n· ie 加 y 变成 ye（i 换成 y）\n· üe 加 y 变成 yue（ü 换成 yu）\n· üan 加 y 变成 yuan\n\n🔑 口诀：ie üe üan，见到 y 就变身。\n\n📝 对比练习：叶 yè ｜ 月 yuè ｜ 圆 yuán ｜ 远 yuǎn ｜ 云 yún ｜ 约 yuē'
  },

  tone_1_2: {
    title: '一声 和 二声',
    text: '一声（阴平）：声音又高又平，像拉长音——「啊——」，图上是一条平平的直线。\n\n二声（阳平）：声音从低往高升，像问问题——「啊？」，图上是一条上扬的斜线。\n\n🔑 口诀：一声平又平，二声往上扬。\n\n📝 对比练习：妈 mā — 麻 má ｜ 花 huā — 华 huá ｜ 天 tiān — 田 tián'
  },
  tone_2_3: {
    title: '二声 和 三声',
    text: '二声：声音一路上升，像爬坡，「á」。\n\n三声：声音先降下去、再升起来，中间拐一个弯，像小滑梯，「ǎ」。\n\n🔑 口诀：二声一直往上爬，三声先下再上拐个弯。\n\n📝 对比练习：皮 pí — 匹 pǐ ｜ 姨 yí — 椅 yǐ ｜ 鹅 é — 恶 ě'
  },
  tone_3_4: {
    title: '三声 和 四声',
    text: '三声：先降后升，拐个弯，读的时候声音要"沉下去再抬起来"。\n\n四声：从最高一路降到最低，像下坡冲刺，干脆利落。\n\n🔑 口诀：三声拐弯像小桥，四声下坡冲到底。\n\n📝 对比练习：马 mǎ — 骂 mà ｜ 好 hǎo — 号 hào ｜ 土 tǔ — 兔 tù'
  },
  neutral: {
    title: '轻声',
    text: '轻声没有固定的调号，读得又轻又短，一带而过。\n\n常见位置：叠词的第二个字（妈妈、爸爸）、词尾的字（桌子、石头）。\n\n🔑 口诀：轻声轻又短，像小尾巴；不标调号，轻轻读。\n\n📝 对比练习：妈妈 mā·ma ｜ 桌子 zhuō·zi ｜ 石头 shí·tou'
  },

  mark_iu: {
    title: 'i u 并列，声调标在后',
    text: '当 i 和 u 挨在一起（如 iu、ui）时，声调要标在后面那个字母上。\n\n· liu → 标在 u 上：liù\n· gui → 标在 i 上：guī\n\n⚠️ 常见错误：写成 lìu、gūi，都是错的。\n\n🔑 口诀：i u 并列标在后，谁在后面标谁头。\n\n📝 对比练习：六 liù ｜ 归 guī ｜ 秋 qiū ｜ 岁 suì ｜ 贵 guì'
  },
  u_dots: {
    title: 'ü 上两点什么时候省略',
    text: 'ü 遇到 j、q、x、y 的时候，两点要省略，写成 u，但读音还是 ü。\n\n· j + ü → ju（居）\n· q + ü → qu（去）\n· x + ü → xu（需）\n\n⚠️ 但 ü 遇到 n、l 的时候，两点不能省：女 nǚ、绿 lǜ、吕 lǚ。\n\n🔑 口诀：j q x y 真淘气，见了 ü 眼就抹去；n l 后面要保留。\n\n📝 对比练习：居 jū ｜ 去 qù ｜ 需 xū ｜ 女 nǚ ｜ 绿 lǜ'
  },

  nasal: {
    title: '前后鼻音综合',
    text: '前鼻音 an、en、in：舌尖抵住上牙床，嘴巴张得小，声音在"前面"。\n\n后鼻音 ang、eng、ing：舌根抬起，嘴巴张得大，声音在"后面"，拖得长一点。\n\n🔑 口诀：前鼻舌尖抵，后鼻舌根起；前鼻短，后鼻长。\n\n📝 对比练习：蓝 lán — 郎 láng ｜ 亲 qīn — 清 qīng ｜ 本 běn — 崩 bēng'
  },
  flat_c: {
    title: '平翘舌综合',
    text: '平舌音 z、c、s：舌尖平伸，抵住上齿背，位置在"前"。\n\n翘舌音 zh、ch、sh：舌尖翘起，抵住上腭前部，位置在"后"。\n\n🔑 口诀：z c s 平舌往前顶，zh ch sh 翘舌往后卷。\n\n📝 对比练习：做 zuò — 捉 zhuō ｜ 操 cāo — 超 chāo ｜ 赞 zàn — 站 zhàn'
  }
};

/* ---------- 232 道题（每知识点 8 题）----------
   字段：id / content（题面汉字或词语）/ options（4 个选项，第一个为正确项时就 answer:0）
        answer（正确项在 options 中的下标，前端会打乱顺序）/ knowledge（知识点 id）
------------------------------------------------- */
const QUESTIONS = [
  /* ===== b_p ===== */
  { id:'b_p-1', knowledge:'b_p', content:'八', options:['bā','pā','dā','tā'], answer:0 },
  { id:'b_p-2', knowledge:'b_p', content:'爬', options:['bá','pá','má','fá'], answer:1 },
  { id:'b_p-3', knowledge:'b_p', content:'白', options:['bái','pái','mái','tái'], answer:0 },
  { id:'b_p-4', knowledge:'b_p', content:'拍', options:['bāi','pāi','māi','tāi'], answer:1 },
  { id:'b_p-5', knowledge:'b_p', content:'半', options:['bàn','pàn','màn','fàn'], answer:0 },
  { id:'b_p-6', knowledge:'b_p', content:'盘', options:['bán','pán','mán','fán'], answer:1 },
  { id:'b_p-7', knowledge:'b_p', content:'布', options:['bù','pù','mù','fù'], answer:0 },
  { id:'b_p-8', knowledge:'b_p', content:'跑', options:['bǎo','pǎo','mǎo','dǎo'], answer:1 },

  /* ===== d_t ===== */
  { id:'d_t-1', knowledge:'d_t', content:'大', options:['dà','tà','nà','là'], answer:0 },
  { id:'d_t-2', knowledge:'d_t', content:'他', options:['dā','tā','nā','lā'], answer:1 },
  { id:'d_t-3', knowledge:'d_t', content:'弟', options:['dì','tì','nì','lì'], answer:0 },
  { id:'d_t-4', knowledge:'d_t', content:'踢', options:['dī','tī','nī','lī'], answer:1 },
  { id:'d_t-5', knowledge:'d_t', content:'多', options:['duō','tuō','nuō','luō'], answer:0 },
  { id:'d_t-6', knowledge:'d_t', content:'拖', options:['duō','tuō','nuō','luō'], answer:1 },
  { id:'d_t-7', knowledge:'d_t', content:'堵', options:['dǔ','tǔ','nǔ','lǔ'], answer:0 },
  { id:'d_t-8', knowledge:'d_t', content:'甜', options:['dián','tián','nián','lián'], answer:1 },

  /* ===== g_k ===== */
  { id:'g_k-1', knowledge:'g_k', content:'哥', options:['gē','kē','hē','dē'], answer:0 },
  { id:'g_k-2', knowledge:'g_k', content:'课', options:['gè','kè','hè','dè'], answer:1 },
  { id:'g_k-3', knowledge:'g_k', content:'高', options:['gāo','kāo','hāo','dāo'], answer:0 },
  { id:'g_k-4', knowledge:'g_k', content:'考', options:['gǎo','kǎo','hǎo','dǎo'], answer:1 },
  { id:'g_k-5', knowledge:'g_k', content:'国', options:['guó','kuó','huó','duó'], answer:0 },
  { id:'g_k-6', knowledge:'g_k', content:'苦', options:['gǔ','kǔ','hǔ','dǔ'], answer:1 },
  { id:'g_k-7', knowledge:'g_k', content:'关', options:['guān','kuān','huān','duān'], answer:0 },
  { id:'g_k-8', knowledge:'g_k', content:'宽', options:['guān','kuān','huān','duān'], answer:1 },

  /* ===== j_q ===== */
  { id:'j_q-1', knowledge:'j_q', content:'鸡', options:['jī','qī','xī','zhī'], answer:0 },
  { id:'j_q-2', knowledge:'j_q', content:'七', options:['jī','qī','xī','chī'], answer:1 },
  { id:'j_q-3', knowledge:'j_q', content:'家', options:['jiā','qiā','xiā','zhā'], answer:0 },
  { id:'j_q-4', knowledge:'j_q', content:'桥', options:['jiáo','qiáo','xiáo','zháo'], answer:1 },
  { id:'j_q-5', knowledge:'j_q', content:'姐', options:['jiě','qiě','xiě','zhě'], answer:0 },
  { id:'j_q-6', knowledge:'j_q', content:'去', options:['jù','qù','xù','zhù'], answer:1 },
  { id:'j_q-7', knowledge:'j_q', content:'九', options:['jiǔ','qiǔ','xiǔ','zhǔ'], answer:0 },
  { id:'j_q-8', knowledge:'j_q', content:'秋', options:['jiū','qiū','xiū','zhū'], answer:1 },

  /* ===== zh_z ===== */
  { id:'zh_z-1', knowledge:'zh_z', content:'知', options:['zhī','zī','chī','cī'], answer:0 },
  { id:'zh_z-2', knowledge:'zh_z', content:'字', options:['zhì','zì','chì','cì'], answer:1 },
  { id:'zh_z-3', knowledge:'zh_z', content:'中', options:['zhōng','zōng','chōng','cōng'], answer:0 },
  { id:'zh_z-4', knowledge:'zh_z', content:'走', options:['zhǒu','zǒu','chǒu','cǒu'], answer:1 },
  { id:'zh_z-5', knowledge:'zh_z', content:'站', options:['zhàn','zàn','chàn','càn'], answer:0 },
  { id:'zh_z-6', knowledge:'zh_z', content:'早', options:['zhǎo','zǎo','chǎo','cǎo'], answer:1 },
  { id:'zh_z-7', knowledge:'zh_z', content:'桌', options:['zhuō','zuō','chuō','cuō'], answer:0 },
  { id:'zh_z-8', knowledge:'zh_z', content:'坐', options:['zhuò','zuò','chuò','cuò'], answer:1 },

  /* ===== ch_c ===== */
  { id:'ch_c-1', knowledge:'ch_c', content:'池', options:['chí','cí','zhí','zhū'], answer:0 },
  { id:'ch_c-2', knowledge:'ch_c', content:'寸', options:['cùn','chùn','cūn','chūn'], answer:0 },
  { id:'ch_c-3', knowledge:'ch_c', content:'层', options:['chéng','céng','zēng','zhēng'], answer:1 },
  { id:'ch_c-4', knowledge:'ch_c', content:'城', options:['chéng','céng','zēng','zhēng'], answer:0 },
  { id:'ch_c-5', knowledge:'ch_c', content:'才', options:['chái','cái','zhái','zái'], answer:1 },
  { id:'ch_c-6', knowledge:'ch_c', content:'虫', options:['cóng','chóng','zōng','zhōng'], answer:1 },
  { id:'ch_c-7', knowledge:'ch_c', content:'从', options:['cóng','chóng','zōng','zhōng'], answer:0 },
  { id:'ch_c-8', knowledge:'ch_c', content:'刺', options:['chì','cì','zhì','zì'], answer:1 },

  /* ===== sh_s ===== */
  { id:'sh_s-1', knowledge:'sh_s', content:'是', options:['shì','sì','zhì','zì'], answer:0 },
  { id:'sh_s-2', knowledge:'sh_s', content:'四', options:['shì','sì','chì','cì'], answer:1 },
  { id:'sh_s-3', knowledge:'sh_s', content:'山', options:['shān','sān','shā','sā'], answer:0 },
  { id:'sh_s-4', knowledge:'sh_s', content:'三', options:['shān','sān','shā','sā'], answer:1 },
  { id:'sh_s-5', knowledge:'sh_s', content:'书', options:['shū','sū','shōu','sōu'], answer:0 },
  { id:'sh_s-6', knowledge:'sh_s', content:'苏', options:['shū','sū','shōu','sōu'], answer:1 },
  { id:'sh_s-7', knowledge:'sh_s', content:'手', options:['shǒu','sǒu','shǎo','sǎo'], answer:0 },
  { id:'sh_s-8', knowledge:'sh_s', content:'森', options:['shēn','sēn','shēng','sēng'], answer:1 },

  /* ===== n_l ===== */
  { id:'n_l-1', knowledge:'n_l', content:'牛', options:['niú','liú','niǔ','liǔ'], answer:0 },
  { id:'n_l-2', knowledge:'n_l', content:'蓝', options:['nán','lán','nàn','làn'], answer:1 },
  { id:'n_l-3', knowledge:'n_l', content:'老', options:['nǎo','lǎo','nào','lào'], answer:1 },
  { id:'n_l-4', knowledge:'n_l', content:'脑', options:['nǎo','lǎo','náo','láo'], answer:0 },
  { id:'n_l-5', knowledge:'n_l', content:'龙', options:['nóng','lóng','nòng','lòng'], answer:1 },
  { id:'n_l-6', knowledge:'n_l', content:'农', options:['nóng','lóng','nòng','lòng'], answer:0 },
  { id:'n_l-7', knowledge:'n_l', content:'路', options:['nù','lù','nǔ','lǔ'], answer:1 },
  { id:'n_l-8', knowledge:'n_l', content:'拿', options:['ná','lá','nà','là'], answer:0 },

  /* ===== f_h ===== */
  { id:'f_h-1', knowledge:'f_h', content:'发', options:['fā','huā','fá','huá'], answer:0 },
  { id:'f_h-2', knowledge:'f_h', content:'花', options:['fā','huā','fá','huá'], answer:1 },
  { id:'f_h-3', knowledge:'f_h', content:'飞', options:['fēi','huī','fěi','huǐ'], answer:0 },
  { id:'f_h-4', knowledge:'f_h', content:'灰', options:['fēi','huī','fěi','huǐ'], answer:1 },
  { id:'f_h-5', knowledge:'f_h', content:'饭', options:['fàn','huàn','fán','huán'], answer:0 },
  { id:'f_h-6', knowledge:'f_h', content:'换', options:['fàn','huàn','fán','huán'], answer:1 },
  { id:'f_h-7', knowledge:'f_h', content:'房', options:['fáng','huáng','fāng','huāng'], answer:0 },
  { id:'f_h-8', knowledge:'f_h', content:'黄', options:['fáng','huáng','fāng','huāng'], answer:1 },

  /* ===== o_ou ===== */
  { id:'o_ou-1', knowledge:'o_ou', content:'波', options:['bō','bāo','bēi','bān'], answer:0 },
  { id:'o_ou-2', knowledge:'o_ou', content:'婆', options:['pó','páo','péi','pán'], answer:0 },
  { id:'o_ou-3', knowledge:'o_ou', content:'摸', options:['mō','māo','mēi','mán'], answer:0 },
  { id:'o_ou-4', knowledge:'o_ou', content:'头', options:['tóu','táo','téng','tán'], answer:0 },
  { id:'o_ou-5', knowledge:'o_ou', content:'口', options:['kǒu','kǎo','kěn','kǎn'], answer:0 },
  { id:'o_ou-6', knowledge:'o_ou', content:'沟', options:['gōu','gāo','gāi','gān'], answer:0 },
  { id:'o_ou-7', knowledge:'o_ou', content:'豆', options:['dòu','dào','dēng','dàn'], answer:0 },
  { id:'o_ou-8', knowledge:'o_ou', content:'偷', options:['tōu','tāo','tán','tái'], answer:0 },

  /* ===== o_uo ===== */
  { id:'o_uo-1', knowledge:'o_uo', content:'多', options:['duō','dōu','diū','dēi'], answer:0 },
  { id:'o_uo-2', knowledge:'o_uo', content:'托', options:['tuō','tōu','táo','tán'], answer:0 },
  { id:'o_uo-3', knowledge:'o_uo', content:'说', options:['shuō','shōu','shāo','shēi'], answer:0 },
  { id:'o_uo-4', knowledge:'o_uo', content:'火', options:['huǒ','hǒu','hǎo','hǎi'], answer:0 },
  { id:'o_uo-5', knowledge:'o_uo', content:'座', options:['zuò','zòu','zǎo','zài'], answer:0 },
  { id:'o_uo-6', knowledge:'o_uo', content:'果', options:['guǒ','gǒu','gǎo','gāi'], answer:0 },
  { id:'o_uo-7', knowledge:'o_uo', content:'错', options:['cuò','còu','cāo','cài'], answer:0 },
  { id:'o_uo-8', knowledge:'o_uo', content:'罗', options:['luó','lóu','láo','lái'], answer:0 },

  /* ===== an_ang ===== */
  { id:'an_ang-1', knowledge:'an_ang', content:'班', options:['bān','bāng','bāo','bāi'], answer:0 },
  { id:'an_ang-2', knowledge:'an_ang', content:'帮', options:['bān','bāng','bāo','bāi'], answer:1 },
  { id:'an_ang-3', knowledge:'an_ang', content:'看', options:['kàn','kàng','kào','kāi'], answer:0 },
  { id:'an_ang-4', knowledge:'an_ang', content:'上', options:['shàn','shàng','shào','shài'], answer:1 },
  { id:'an_ang-5', knowledge:'an_ang', content:'方', options:['fān','fāng','fēn','fēng'], answer:1 },
  { id:'an_ang-6', knowledge:'an_ang', content:'旁', options:['pán','páng','pén','péng'], answer:1 },
  { id:'an_ang-7', knowledge:'an_ang', content:'谈', options:['tán','táng','táo','tái'], answer:0 },
  { id:'an_ang-8', knowledge:'an_ang', content:'汤', options:['tān','tāng','tāo','tāi'], answer:1 },

  /* ===== en_eng ===== */
  { id:'en_eng-1', knowledge:'en_eng', content:'门', options:['mén','méng','máo','mái'], answer:0 },
  { id:'en_eng-2', knowledge:'en_eng', content:'真', options:['zhēn','zhēng','zhāo','zhāi'], answer:0 },
  { id:'en_eng-3', knowledge:'en_eng', content:'人', options:['rén','réng','rú','ráo'], answer:0 },
  { id:'en_eng-4', knowledge:'en_eng', content:'争', options:['zhēn','zhēng','zhāo','zhāi'], answer:1 },
  { id:'en_eng-5', knowledge:'en_eng', content:'盆', options:['pén','péng','páo','pái'], answer:0 },
  { id:'en_eng-6', knowledge:'en_eng', content:'朋', options:['pén','péng','páo','pái'], answer:1 },
  { id:'en_eng-7', knowledge:'en_eng', content:'跟', options:['gēn','gēng','gāo','gāi'], answer:0 },
  { id:'en_eng-8', knowledge:'en_eng', content:'蹦', options:['bèn','bèng','bào','bài'], answer:1 },

  /* ===== in_ing ===== */
  { id:'in_ing-1', knowledge:'in_ing', content:'音', options:['yīn','yīng','yāo','yā'], answer:0 },
  { id:'in_ing-2', knowledge:'in_ing', content:'英', options:['yīn','yīng','yāo','yā'], answer:1 },
  { id:'in_ing-3', knowledge:'in_ing', content:'林', options:['lín','líng','láo','lái'], answer:0 },
  { id:'in_ing-4', knowledge:'in_ing', content:'铃', options:['lín','líng','láo','lái'], answer:1 },
  { id:'in_ing-5', knowledge:'in_ing', content:'心', options:['xīn','xīng','xiāo','xià'], answer:0 },
  { id:'in_ing-6', knowledge:'in_ing', content:'星', options:['xīn','xīng','xiāo','xià'], answer:1 },
  { id:'in_ing-7', knowledge:'in_ing', content:'今', options:['jīn','jīng','jiāo','jiā'], answer:0 },
  { id:'in_ing-8', knowledge:'in_ing', content:'京', options:['jīn','jīng','jiāo','jiā'], answer:1 },

  /* ===== ie_ve ===== */
  { id:'ie_ve-1', knowledge:'ie_ve', content:'月', options:['yuè','yè','yào','yòu'], answer:0 },
  { id:'ie_ve-2', knowledge:'ie_ve', content:'雪', options:['xuě','xiě','xiǎo','xià'], answer:0 },
  { id:'ie_ve-3', knowledge:'ie_ve', content:'学', options:['xué','xié','xiě','xiè'], answer:0 },
  { id:'ie_ve-4', knowledge:'ie_ve', content:'节', options:['jié','jué','jiē','juē'], answer:0 },
  { id:'ie_ve-5', knowledge:'ie_ve', content:'缺', options:['quē','qiē','qiě','qiè'], answer:0 },
  { id:'ie_ve-6', knowledge:'ie_ve', content:'写', options:['xuě','xiě','xuè','xiè'], answer:1 },
  { id:'ie_ve-7', knowledge:'ie_ve', content:'也', options:['yuè','yě','yào','yóu'], answer:1 },
  { id:'ie_ve-8', knowledge:'ie_ve', content:'决', options:['jié','jué','jiē','juē'], answer:1 },

  /* ===== ei_ui ===== */
  { id:'ei_ui-1', knowledge:'ei_ui', content:'飞', options:['fēi','fú','fān','fǒu'], answer:0 },
  { id:'ei_ui-2', knowledge:'ei_ui', content:'妹', options:['mèi','mù','mǎi','mǔ'], answer:0 },
  { id:'ei_ui-3', knowledge:'ei_ui', content:'北', options:['běi','bù','bǎo','bèi'], answer:0 },
  { id:'ei_ui-4', knowledge:'ei_ui', content:'水', options:['shuǐ','shéi','shuō','shǎo'], answer:0 },
  { id:'ei_ui-5', knowledge:'ei_ui', content:'对', options:['duì','děi','dào','dòu'], answer:0 },
  { id:'ei_ui-6', knowledge:'ei_ui', content:'雷', options:['léi','lóu','lán','lèi'], answer:0 },
  { id:'ei_ui-7', knowledge:'ei_ui', content:'会', options:['huì','hēi','hǎo','hòu'], answer:0 },
  { id:'ei_ui-8', knowledge:'ei_ui', content:'黑', options:['hēi','huī','hǎn','hēng'], answer:0 },

  /* ===== iu_ou ===== */
  { id:'iu_ou-1', knowledge:'iu_ou', content:'流', options:['liú','lóu','lín','lán'], answer:0 },
  { id:'iu_ou-2', knowledge:'iu_ou', content:'楼', options:['liú','lóu','lín','lán'], answer:1 },
  { id:'iu_ou-3', knowledge:'iu_ou', content:'酒', options:['jiǔ','jiǎo','jià','jù'], answer:0 },
  { id:'iu_ou-4', knowledge:'iu_ou', content:'六', options:['liù','lù','lòu','là'], answer:0 },
  { id:'iu_ou-5', knowledge:'iu_ou', content:'丢', options:['diū','dōu','dà','dài'], answer:0 },
  { id:'iu_ou-6', knowledge:'iu_ou', content:'后', options:['hòu','hū','hǎo','hǎi'], answer:0 },
  { id:'iu_ou-7', knowledge:'iu_ou', content:'球', options:['qiú','qiāo','què','qù'], answer:0 },
  { id:'iu_ou-8', knowledge:'iu_ou', content:'收', options:['shōu','shū','shǎo','shuì'], answer:0 },

  /* ===== zhi_chi_shi ===== */
  { id:'zhi_chi_shi-1', knowledge:'zhi_chi_shi', content:'纸', options:['zhǐ','zǐ','chǐ','cǐ'], answer:0 },
  { id:'zhi_chi_shi-2', knowledge:'zhi_chi_shi', content:'尺', options:['zhǐ','chǐ','zǐ','cǐ'], answer:1 },
  { id:'zhi_chi_shi-3', knowledge:'zhi_chi_shi', content:'诗', options:['shī','sī','chī','cī'], answer:0 },
  { id:'zhi_chi_shi-4', knowledge:'zhi_chi_shi', content:'吃', options:['zhī','chī','zī','cī'], answer:1 },
  { id:'zhi_chi_shi-5', knowledge:'zhi_chi_shi', content:'车', options:['chē','zhē','shē','chā'], answer:0 },
  { id:'zhi_chi_shi-6', knowledge:'zhi_chi_shi', content:'石', options:['shí','sì','zhí','zì'], answer:0 },
  { id:'zhi_chi_shi-7', knowledge:'zhi_chi_shi', content:'枝', options:['zhī','zī','chī','cī'], answer:0 },
  { id:'zhi_chi_shi-8', knowledge:'zhi_chi_shi', content:'湿', options:['shī','sī','zhī','zī'], answer:0 },

  /* ===== zi_ci_si ===== */
  { id:'zi_ci_si-1', knowledge:'zi_ci_si', content:'紫', options:['zǐ','zhǐ','cǐ','chǐ'], answer:0 },
  { id:'zi_ci_si-2', knowledge:'zi_ci_si', content:'丝', options:['sī','shī','cī','chī'], answer:0 },
  { id:'zi_ci_si-3', knowledge:'zi_ci_si', content:'此', options:['zǐ','zhǐ','cǐ','chǐ'], answer:2 },
  { id:'zi_ci_si-4', knowledge:'zi_ci_si', content:'死', options:['sǐ','shǐ','cǐ','chǐ'], answer:0 },
  { id:'zi_ci_si-5', knowledge:'zi_ci_si', content:'籽', options:['zǐ','zhǐ','zì','zhì'], answer:0 },
  { id:'zi_ci_si-6', knowledge:'zi_ci_si', content:'姿', options:['zī','zhī','cī','chī'], answer:0 },
  { id:'zi_ci_si-7', knowledge:'zi_ci_si', content:'次', options:['zhì','zì','chì','cì'], answer:3 },
  { id:'zi_ci_si-8', knowledge:'zi_ci_si', content:'寺', options:['shì','sì','chì','cì'], answer:1 },

  /* ===== yi_wu_yu ===== */
  { id:'yi_wu_yu-1', knowledge:'yi_wu_yu', content:'一', options:['yī','wū','yú','yǔ'], answer:0 },
  { id:'yi_wu_yu-2', knowledge:'yi_wu_yu', content:'五', options:['wū','wǔ','yǔ','yù'], answer:1 },
  { id:'yi_wu_yu-3', knowledge:'yi_wu_yu', content:'鱼', options:['yī','wū','yú','wǔ'], answer:2 },
  { id:'yi_wu_yu-4', knowledge:'yi_wu_yu', content:'玉', options:['yī','wū','yú','yù'], answer:3 },
  { id:'yi_wu_yu-5', knowledge:'yi_wu_yu', content:'雨', options:['yī','yǔ','wǔ','yù'], answer:1 },
  { id:'yi_wu_yu-6', knowledge:'yi_wu_yu', content:'屋', options:['yī','wū','yǔ','wù'], answer:1 },
  { id:'yi_wu_yu-7', knowledge:'yi_wu_yu', content:'衣', options:['yī','wū','yú','wǔ'], answer:0 },
  { id:'yi_wu_yu-8', knowledge:'yi_wu_yu', content:'无', options:['yī','wú','yǔ','wù'], answer:1 },

  /* ===== ye_yue_yuan ===== */
  { id:'ye_yue_yuan-1', knowledge:'ye_yue_yuan', content:'叶', options:['yè','yuè','yán','yáo'], answer:0 },
  { id:'ye_yue_yuan-2', knowledge:'ye_yue_yuan', content:'越', options:['yè','yuè','yán','yáo'], answer:1 },
  { id:'ye_yue_yuan-3', knowledge:'ye_yue_yuan', content:'圆', options:['yuán','yán','yuǎn','yún'], answer:0 },
  { id:'ye_yue_yuan-4', knowledge:'ye_yue_yuan', content:'远', options:['yuán','yán','yuǎn','yún'], answer:2 },
  { id:'ye_yue_yuan-5', knowledge:'ye_yue_yuan', content:'云', options:['yún','yíng','yín','yìng'], answer:0 },
  { id:'ye_yue_yuan-6', knowledge:'ye_yue_yuan', content:'夜', options:['yè','yuè','yào','yòu'], answer:0 },
  { id:'ye_yue_yuan-7', knowledge:'ye_yue_yuan', content:'员', options:['yuán','yún','yán','yuàn'], answer:0 },
  { id:'ye_yue_yuan-8', knowledge:'ye_yue_yuan', content:'约', options:['yuē','yē','yōu','yāo'], answer:0 },

  /* ===== tone_1_2 ===== */
  { id:'tone_1_2-1', knowledge:'tone_1_2', content:'妈', options:['mā','má','mǎ','mà'], answer:0 },
  { id:'tone_1_2-2', knowledge:'tone_1_2', content:'麻', options:['mā','má','mǎ','mà'], answer:1 },
  { id:'tone_1_2-3', knowledge:'tone_1_2', content:'花', options:['huā','huá','huǎ','huà'], answer:0 },
  { id:'tone_1_2-4', knowledge:'tone_1_2', content:'华', options:['huā','huá','huǎ','huà'], answer:1 },
  { id:'tone_1_2-5', knowledge:'tone_1_2', content:'天', options:['tiān','tián','tiǎn','tiàn'], answer:0 },
  { id:'tone_1_2-6', knowledge:'tone_1_2', content:'田', options:['tiān','tián','tiǎn','tiàn'], answer:1 },
  { id:'tone_1_2-7', knowledge:'tone_1_2', content:'舒', options:['shū','shú','shǔ','shù'], answer:0 },
  { id:'tone_1_2-8', knowledge:'tone_1_2', content:'熟', options:['shū','shú','shǔ','shù'], answer:1 },

  /* ===== tone_2_3 ===== */
  { id:'tone_2_3-1', knowledge:'tone_2_3', content:'皮', options:['pí','pǐ','pì','pī'], answer:0 },
  { id:'tone_2_3-2', knowledge:'tone_2_3', content:'匹', options:['pí','pǐ','pì','pī'], answer:1 },
  { id:'tone_2_3-3', knowledge:'tone_2_3', content:'姨', options:['yí','yǐ','yì','yī'], answer:0 },
  { id:'tone_2_3-4', knowledge:'tone_2_3', content:'椅', options:['yí','yǐ','yì','yī'], answer:1 },
  { id:'tone_2_3-5', knowledge:'tone_2_3', content:'鹅', options:['é','ě','è','ē'], answer:0 },
  { id:'tone_2_3-6', knowledge:'tone_2_3', content:'耳', options:['ér','ěr','èr','ēr'], answer:1 },
  { id:'tone_2_3-7', knowledge:'tone_2_3', content:'儿', options:['ér','ěr','èr','ēr'], answer:0 },
  { id:'tone_2_3-8', knowledge:'tone_2_3', content:'语', options:['yú','yǔ','yù','yū'], answer:1 },

  /* ===== tone_3_4 ===== */
  { id:'tone_3_4-1', knowledge:'tone_3_4', content:'马', options:['mā','má','mǎ','mà'], answer:2 },
  { id:'tone_3_4-2', knowledge:'tone_3_4', content:'骂', options:['mā','má','mǎ','mà'], answer:3 },
  { id:'tone_3_4-3', knowledge:'tone_3_4', content:'好', options:['hāo','háo','hǎo','hào'], answer:2 },
  { id:'tone_3_4-4', knowledge:'tone_3_4', content:'号', options:['hāo','háo','hǎo','hào'], answer:3 },
  { id:'tone_3_4-5', knowledge:'tone_3_4', content:'草', options:['cāo','cáo','cǎo','cào'], answer:2 },
  { id:'tone_3_4-6', knowledge:'tone_3_4', content:'土', options:['tū','tú','tǔ','tù'], answer:2 },
  { id:'tone_3_4-7', knowledge:'tone_3_4', content:'兔', options:['tū','tú','tǔ','tù'], answer:3 },
  { id:'tone_3_4-8', knowledge:'tone_3_4', content:'小', options:['xiāo','xiáo','xiǎo','xiào'], answer:2 },

  /* ===== neutral（轻声，词语题）===== */
  { id:'neutral-1', knowledge:'neutral', content:'妈妈', options:['māma','māmā','màma','mǎma'], answer:0 },
  { id:'neutral-2', knowledge:'neutral', content:'桌子', options:['zhuōzi','zhuōzǐ','zhuózi','zhuōzì'], answer:0 },
  { id:'neutral-3', knowledge:'neutral', content:'石头', options:['shítou','shítóu','shītou','shítòu'], answer:0 },
  { id:'neutral-4', knowledge:'neutral', content:'爸爸', options:['bàba','bàbà','bāba','pàba'], answer:0 },
  { id:'neutral-5', knowledge:'neutral', content:'眼睛', options:['yǎnjing','yǎnjīng','yǎnjìng','yánjing'], answer:0 },
  { id:'neutral-6', knowledge:'neutral', content:'衣服', options:['yīfu','yīfú','yīfù','yífu'], answer:0 },
  { id:'neutral-7', knowledge:'neutral', content:'朋友', options:['péngyou','péngyǒu','péngyòu','pēngyou'], answer:0 },
  { id:'neutral-8', knowledge:'neutral', content:'谢谢', options:['xièxie','xièxiè','xiěxie','xiēxie'], answer:0 },

  /* ===== mark_iu（i u 并列标在后）===== */
  { id:'mark_iu-1', knowledge:'mark_iu', content:'归', options:['guī','gūi','gúi','gùi'], answer:0 },
  { id:'mark_iu-2', knowledge:'mark_iu', content:'六', options:['liù','lìu','lǜ','lù'], answer:0 },
  { id:'mark_iu-3', knowledge:'mark_iu', content:'秋', options:['qiū','qīu','qiú','qiǔ'], answer:0 },
  { id:'mark_iu-4', knowledge:'mark_iu', content:'追', options:['zhuī','zhūi','zhuí','zhuì'], answer:0 },
  { id:'mark_iu-5', knowledge:'mark_iu', content:'亏', options:['kuī','kūi','kuí','kuì'], answer:0 },
  { id:'mark_iu-6', knowledge:'mark_iu', content:'龟', options:['guī','gūi','guí','guì'], answer:0 },
  { id:'mark_iu-7', knowledge:'mark_iu', content:'岁', options:['suì','sùi','suí','suǐ'], answer:0 },
  { id:'mark_iu-8', knowledge:'mark_iu', content:'贵', options:['guì','gùi','guí','guǐ'], answer:0 },

  /* ===== u_dots（ü 上两点省略）===== */
  { id:'u_dots-1', knowledge:'u_dots', content:'居', options:['jū','jǖ','jú','jù'], answer:0 },
  { id:'u_dots-2', knowledge:'u_dots', content:'娶', options:['qū','qǖ','qú','qǔ'], answer:3 },
  { id:'u_dots-3', knowledge:'u_dots', content:'需', options:['xū','xǖ','xú','xǔ'], answer:0 },
  { id:'u_dots-4', knowledge:'u_dots', content:'女', options:['nǚ','nǔ','nú','nù'], answer:0 },
  { id:'u_dots-5', knowledge:'u_dots', content:'绿', options:['lǜ','lù','lú','lǔ'], answer:0 },
  { id:'u_dots-6', knowledge:'u_dots', content:'吕', options:['lǚ','lǔ','lú','lù'], answer:0 },
  { id:'u_dots-7', knowledge:'u_dots', content:'举', options:['jǔ','jǚ','jú','jù'], answer:0 },
  { id:'u_dots-8', knowledge:'u_dots', content:'区', options:['qū','qǖ','qú','qǔ'], answer:0 },

  /* ===== nasal（前后鼻音综合）===== */
  { id:'nasal-1', knowledge:'nasal', content:'蓝', options:['lán','láng','láo','lái'], answer:0 },
  { id:'nasal-2', knowledge:'nasal', content:'郎', options:['lán','láng','láo','lái'], answer:1 },
  { id:'nasal-3', knowledge:'nasal', content:'亲', options:['qīn','qīng','qiāo','qià'], answer:0 },
  { id:'nasal-4', knowledge:'nasal', content:'清', options:['qīn','qīng','qiāo','qià'], answer:1 },
  { id:'nasal-5', knowledge:'nasal', content:'春', options:['chūn','chōng','chuō','chāo'], answer:0 },
  { id:'nasal-6', knowledge:'nasal', content:'银', options:['yín','yíng','yáo','yòu'], answer:0 },
  { id:'nasal-7', knowledge:'nasal', content:'赢', options:['yín','yíng','yáo','yòu'], answer:1 },
  { id:'nasal-8', knowledge:'nasal', content:'本', options:['běn','běng','bǎo','bèi'], answer:0 },

  /* ===== flat_c（平翘舌综合）===== */
  { id:'flat_c-1', knowledge:'flat_c', content:'做', options:['zuò','zhuó','zhòu','zòu'], answer:0 },
  { id:'flat_c-2', knowledge:'flat_c', content:'捉', options:['zuō','zhuō','zōu','zhōu'], answer:1 },
  { id:'flat_c-3', knowledge:'flat_c', content:'操', options:['cāo','chāo','cáo','cháo'], answer:0 },
  { id:'flat_c-4', knowledge:'flat_c', content:'超', options:['cāo','chāo','cáo','cháo'], answer:1 },
  { id:'flat_c-5', knowledge:'flat_c', content:'生', options:['sēng','shēng','sēn','shēn'], answer:1 },
  { id:'flat_c-6', knowledge:'flat_c', content:'僧', options:['sēng','shēng','sēn','shēn'], answer:0 },
  { id:'flat_c-7', knowledge:'flat_c', content:'赞', options:['zàn','zhàn','zǎn','zhǎn'], answer:0 },
  { id:'flat_c-8', knowledge:'flat_c', content:'吵', options:['cǎo','chǎo','zǎo','zhǎo'], answer:1 }
];

/* ---------- 装扮（积分兑换 + 彩蛋随机掉落）----------
   slot：hat 帽子 / eyes 眼镜 / top 上衣 / bottom 裤子 / acc 配饰 / prop 手持物
   每个槽位同时只能穿戴一件
--------------------------------------------------- */
const OUTFITS = [
  // 帽子
  { id:'hat_cap',    name:'棒球帽',     slot:'hat',    emoji:'🧢', cost:100 },
  { id:'hat_sun',    name:'太阳帽',     slot:'hat',    emoji:'👒', cost:200 },
  { id:'hat_crown',  name:'小皇冠',     slot:'hat',    emoji:'👑', cost:500 },
  // 眼镜
  { id:'eye_star',   name:'星星小眼镜', slot:'eyes',   emoji:'👓', cost:150 },
  { id:'eye_goggle', name:'运动护目镜', slot:'eyes',   emoji:'🥽', cost:250 },
  { id:'eye_sun',    name:'酷酷墨镜',   slot:'eyes',   emoji:'🕶️', cost:300 },
  // 上衣
  { id:'top_tee',    name:'夏日T恤',    slot:'top',    emoji:'👕', cost:200 },
  { id:'top_cloud',  name:'云雾冲锋衣', slot:'top',    emoji:'🧥', cost:400 },
  // 裤子
  { id:'bot_ball',   name:'篮球短裤',   slot:'bottom', emoji:'🩳', cost:250 },
  { id:'bot_jeans',  name:'牛仔长裤',   slot:'bottom', emoji:'👖', cost:350 },
  // 配饰
  { id:'acc_bow',    name:'蝴蝶结',     slot:'acc',    emoji:'🎀', cost:200 },
  { id:'acc_scarf',  name:'小红围巾',   slot:'acc',    emoji:'🧣', cost:250 },
  { id:'acc_bag',    name:'小书包',     slot:'acc',    emoji:'🎒', cost:300 },
  // 手持物 / 收藏
  { id:'prop_ball',  name:'小足球',     slot:'prop',   emoji:'⚽', cost:350 },
  { id:'prop_gem',   name:'闪亮宝石',   slot:'prop',   emoji:'💎', cost:400 },
  { id:'prop_card',  name:'奥特曼卡片', slot:'prop',   emoji:'🃏', cost:600 },
  { id:'prop_pet',   name:'小宠物狗',   slot:'prop',   emoji:'🐶', cost:800 }
];

/* ---------- 彩蛋奖励池（随机掉落的"小惊喜"）---------- */
const EGG_BONUS = ['🍭','🍬','🌟','🎈','🧁','🍀','🎪','🐣','🦄','🎠'];

/* ---------- 便捷索引 ---------- */
const KP_MAP = {};
KNOWLEDGE_POINTS.forEach(function (kp) { KP_MAP[kp.id] = kp; });

const OUTFIT_MAP = {};
OUTFITS.forEach(function (o) { OUTFIT_MAP[o.id] = o; });
