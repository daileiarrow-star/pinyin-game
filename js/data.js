/* =========================================================
   拼音小达人 — 数据文件（配置 / 知识点 / 图文讲解 / 装扮）
   ---------------------------------------------------------
   全部为「预置静态数据」，运行时零 API 调用、零 Token 成本。
   题库在 js/questions.js，图解在 js/illus.js，形象在 js/avatar.js

   知识点：29 个，按「孩子真实会混的一对音」划分
   题目：29 × 8 = 232 道，全部为「最小对立对」题型
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
  audioBase: 'audio/'       // 预生成语音目录（没有该目录时自动降级到浏览器语音合成）
};

/* ---------- 29 个易错知识点 ----------
   tag 会直接显示在题卡上，必须唯一、必须能一眼看出在考什么
---------------------------------------------------- */
const KNOWLEDGE_POINTS = [
  /* ===== 声母：送气 / 不送气（4）===== */
  { id:'b_p', name:'b 和 p 不分', tag:'b / p', category:'声母', tip:'b 不送气，p 要送气' },
  { id:'d_t', name:'d 和 t 不分', tag:'d / t', category:'声母', tip:'d 不送气，t 要送气' },
  { id:'g_k', name:'g 和 k 不分', tag:'g / k', category:'声母', tip:'g 不送气，k 要送气' },
  { id:'j_q', name:'j 和 q 不分', tag:'j / q', category:'声母', tip:'j 不送气，q 要送气' },

  /* ===== 声母：平翘舌（3）===== */
  { id:'zh_z', name:'zh 和 z 不分', tag:'zh / z', category:'平翘舌', tip:'zh 翘舌，z 平舌' },
  { id:'ch_c', name:'ch 和 c 不分', tag:'ch / c', category:'平翘舌', tip:'ch 翘舌，c 平舌' },
  { id:'sh_s', name:'sh 和 s 不分', tag:'sh / s', category:'平翘舌', tip:'sh 翘舌，s 平舌' },

  /* ===== 声母：鼻音 / 唇齿（2）===== */
  { id:'n_l', name:'n 和 l 不分', tag:'n / l', category:'声母', tip:'n 是鼻音，l 是边音' },
  { id:'f_h', name:'f 和 h 不分', tag:'f / h', category:'声母', tip:'f 咬下唇，h 舌根出气' },

  /* ===== 韵母：单韵母与复韵母（4）★ 高频易错 ===== */
  { id:'o_ou', name:'o 和 ou 不分', tag:'o / ou', category:'韵母', tip:'o 不滑动，ou 要滑一下' },
  { id:'o_uo', name:'uo 丢掉了 u', tag:'uo / ou', category:'韵母', tip:'多 duō，不是 dōu' },
  { id:'ao_ou', name:'ao 和 ou 不分', tag:'ao / ou', category:'韵母', tip:'好 hǎo，不是 hǒu' },
  { id:'iu_ou', name:'iu 和 ou 不分', tag:'iu / ou', category:'韵母', tip:'流 liú，不是 lóu' },

  /* ===== 韵母：前后鼻音（3）★ 高频易错 ===== */
  { id:'an_ang', name:'an 和 ang 不分（没后鼻音）', tag:'an / ang', category:'前后鼻音', tip:'an 前鼻音，ang 后鼻音' },
  { id:'en_eng', name:'en 和 eng 不分（没后鼻音）', tag:'en / eng', category:'前后鼻音', tip:'en 前鼻音，eng 后鼻音' },
  { id:'in_ing', name:'in 和 ing 不分（没后鼻音）', tag:'in / ing', category:'前后鼻音', tip:'in 前鼻音，ing 后鼻音' },

  /* ===== 韵母：圆唇 / 不圆唇（1）===== */
  { id:'ie_ve', name:'ie 和 üe 不分', tag:'ie / üe', category:'韵母', tip:'ie 扁嘴，üe 圆嘴' },

  /* ===== 整体认读（4）===== */
  { id:'zhi_chi_shi', name:'整体认读 zhi chi shi', tag:'zhi/chi/shi', category:'整体认读', tip:'直接读，不要拼' },
  { id:'zi_ci_si',    name:'整体认读 zi ci si',   tag:'zi/ci/si',    category:'整体认读', tip:'直接读，不要拼' },
  { id:'yi_wu_yu',    name:'整体认读 yi wu yu',   tag:'yi/wu/yu',    category:'整体认读', tip:'i 找 y，u 找 w，ü 脱帽' },
  { id:'ye_yue_yuan', name:'整体认读 ye yue yuan', tag:'ye/yue/yuan', category:'整体认读', tip:'ie üe üan 见 y 变身' },

  /* ===== 声调（4）===== */
  { id:'tone_1_2', name:'一声 和 二声', tag:'1 声 / 2 声', category:'声调', tip:'一声平，二声扬' },
  { id:'tone_2_3', name:'二声 和 三声', tag:'2 声 / 3 声', category:'声调', tip:'二声上扬，三声拐弯' },
  { id:'tone_3_4', name:'三声 和 四声', tag:'3 声 / 4 声', category:'声调', tip:'三声拐弯，四声下坡' },
  { id:'neutral',  name:'轻声',        tag:'轻声',        category:'声调', tip:'又轻又短，一带而过' },

  /* ===== 标调规则（2）===== */
  { id:'mark_iu', name:'i u 并列标在后', tag:'iu/ui 标调', category:'标调', tip:'声调标在后面那个字母上' },
  { id:'u_dots',  name:'ü 上两点要省略', tag:'ü 省两点',   category:'标调', tip:'j q x y 后面的 ü 去掉两点' },

  /* ===== 语流音变：最容易被忽略的易错点（2）===== */
  { id:'tone_3sandhi', name:'两个三声连读（前一个变二声）', tag:'三声连读', category:'语流音变', tip:'你好 → ní hǎo' },
  { id:'yi_bu',        name:'「一」「不」的变调',           tag:'一 / 不 变调', category:'语流音变', tip:'一个 yí gè，一天 yì tiān' },

  /* ===== v4 新增：考纲里最常单独拎出来考的五类易错点（5）===== */
  { id:'apostrophe',     name:'隔音符号不能忘',       tag:"隔音符号 '",   category:'隔音符号', tip:"a o e 开头的音节跟在别人后面，中间要加 ' " },
  { id:'mark_rule',      name:'声调标在哪个字母上',   tag:'标调位置',     category:'标调',     tip:'有 a 标 a，没 a 找 o e，i u 并列标在后' },
  { id:'y_w_rule',       name:'i u ü 开头要加 y w',   tag:'y / w 起头',   category:'整体认读', tip:'i→yi，u→wu，ü→yu，不能只写 ī ū ǘ' },
  { id:'zhengti_judge',  name:'哪些是整体认读音节',   tag:'整体认读判断', category:'整体认读', tip:'zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan / yin yun ying 共 16 个' },
  { id:'comprehensive',  name:'最容易读错的字',       tag:'易错字音',     category:'综合',     tip:'这些字一读就错，不能靠猜，要单独记' }
];

/* ---------- 29 条图文讲解（答错时弹出：图 + 口诀 + 例词 + 提醒）
   illus 字段驱动 js/illus.js 生成示意图，不再是一堆纯文字
---------------------------------------------------- */
const EXPLANATIONS = {
  b_p: {
    title:'b 和 p：用一张纸就能分清楚',
    illus:{ type:'air', a:{label:'b', puff:false, note:'不送气'}, b:{label:'p', puff:true, note:'送气'} },
    one:'b 和 p 的嘴形一模一样，区别只在「有没有气喷出来」。',
    key:'b 不送气，p 送气；拿张纸放在嘴前，读 p 纸会动。',
    pairs:[['八','bā'],['趴','pā'],['白','bái'],['拍','pāi']],
    warn:'把纸片放嘴前：读 b 纸不动，读 p 纸飘起来。'
  },
  d_t: {
    title:'d 和 t：一个轻轻，一个用力',
    illus:{ type:'air', a:{label:'d', puff:false, note:'不送气'}, b:{label:'t', puff:true, note:'送气'} },
    one:'舌尖都抵在上牙床，区别是 t 放开时有一股气冲出来。',
    key:'d 轻轻 ddd，t 用力 ttt。',
    pairs:[['大','dà'],['他','tā'],['弟','dì'],['踢','tī']],
    warn:'读 t 时把纸片放嘴前，纸片会动；读 d 不动。'
  },
  g_k: {
    title:'g 和 k：舌根的位置一样',
    illus:{ type:'air', a:{label:'g', puff:false, note:'不送气'}, b:{label:'k', puff:true, note:'送气'} },
    one:'g 和 k 都是舌根音，区别还是「送气」两个字。',
    key:'g 像鸽子轻轻叫，k 像蝌蚪用力游。',
    pairs:[['哥','gē'],['课','kè'],['高','gāo'],['考','kǎo']],
    warn:'千万不要用声调去猜，要靠「有没有气流」。'
  },
  j_q: {
    title:'j 和 q：又是一对送气兄弟',
    illus:{ type:'air', a:{label:'j', puff:false, note:'不送气'}, b:{label:'q', puff:true, note:'送气'} },
    one:'j 和 q 都是舌面音，拼写里带的 ü 都要去掉两点。',
    key:'j 不送气，q 送气；鸡 jī 和 七 qī，靠气流分。',
    pairs:[['鸡','jī'],['七','qī'],['家','jiā'],['桥','qiáo']],
    warn:'j、q 后面跟的 ü 都写成 u，读的时候还是 ü。'
  },

  zh_z: {
    title:'zh 和 z：舌头翘起来还是平平的',
    illus:{ type:'profile', a:{tongue:'flat', label:'z', note:'平舌'}, b:{tongue:'curl', label:'zh', note:'翘舌'} },
    one:'z 是平舌音，舌尖平伸顶住上齿背；zh 是翘舌音，舌尖要翘起来。',
    key:'z c s 平舌往前顶，zh ch sh 翘舌往后卷。',
    pairs:[['知','zhī'],['资','zī'],['站','zhàn'],['赞','zàn']],
    warn:'看镜子或摸下巴：读 zh 时舌尖会翘起来。'
  },
  ch_c: {
    title:'ch 和 c：翘舌 + 送气',
    illus:{ type:'profile', a:{tongue:'flat', label:'c', note:'平舌'}, b:{tongue:'curl', label:'ch', note:'翘舌'} },
    one:'ch 和 c 都要送气，区别只在舌头的平翘。',
    key:'两个都要喷气，就看舌头翘不翘。',
    pairs:[['吃','chī'],['刺','cì'],['春','chūn'],['丛','cóng']],
    warn:'「才 cái」不要读成 chái，「城 chéng」不要读成 céng。'
  },
  sh_s: {
    title:'sh 和 s：两个都不送气，只看舌头',
    illus:{ type:'profile', a:{tongue:'flat', label:'s', note:'平舌'}, b:{tongue:'curl', label:'sh', note:'翘舌'} },
    one:'sh 和 s 都是摩擦音，气流从缝隙里出来。',
    key:'sh 像狮子（翘舌），s 像丝瓜（平舌）。',
    pairs:[['是','shì'],['四','sì'],['山','shān'],['三','sān']],
    warn:'「三 sān」是平舌，「山 shān」是翘舌，读错意思就变了。'
  },
  n_l: {
    title:'n 和 l：捏住鼻子马上见分晓',
    illus:{ type:'profile', a:{air:'nose', label:'n', note:'鼻子出气'}, b:{air:'mouth', label:'l', note:'舌头两边出气'} },
    one:'n 的气从鼻子出来，l 的气从舌头两边出来。',
    key:'捏住鼻子：n 读不出，l 照样读。',
    pairs:[['牛','niú'],['流','liú'],['脑','nǎo'],['老','lǎo']],
    warn:'这是最快的自测法：捏鼻子读不出来的一定是 n。'
  },
  f_h: {
    title:'f 和 h：一个咬嘴唇，一个哈气',
    illus:{ type:'profile', a:{tongue:'lip', label:'f', note:'上齿咬下唇'}, b:{tongue:'back', label:'h', note:'舌根哈气'} },
    one:'f 要上齿轻咬下唇，h 是嘴巴张开用舌根哈气。',
    key:'f 像拐杖（咬唇），h 像椅子（哈气）。',
    pairs:[['飞','fēi'],['灰','huī'],['饭','fàn'],['换','huàn']],
    warn:'读 f 时对着手背，能感到气从唇齿缝里出来。'
  },

  o_ou: {
    title:'o 和 ou：嘴巴动不动是关键',
    illus:{ type:'mouth', a:{shape:'round', label:'o', note:'圆嘴不动'}, b:{shape:'slide', label:'ou', note:'圆嘴滑一下'} },
    one:'o 是单韵母，嘴巴一直圆着不动；ou 是复韵母，要先 o 再滑到 u。',
    key:'o 圆圆不滑动，ou 圆圆滑一下。',
    pairs:[['波','bō'],['兜','dōu'],['我','wǒ'],['豆','dòu']],
    warn:'「头」是 tóu，不是 tō；「波」是 bō，不是 bōu。'
  },
  o_uo: {
    title:'uo 不能把 u 丢掉',
    illus:{ type:'mouth', a:{shape:'slide', label:'uo', note:'先 u 再 o'}, b:{shape:'round', label:'ou', note:'少写了 u'} },
    one:'uo 是 u 和 o 两个字母，读的时候嘴巴先从圆圆的 u 滑到 o，中间的 u 千万不能丢。',
    key:'多 duō、托 tuō、说 shuō，前面的 u 一定要写出来。',
    pairs:[['多','duō'],['兜','dōu'],['说','shuō'],['收','shōu']],
    warn:'最常见的错：把「多 duō」写成 dōu、把「坐 zuò」写成 zòu。'
  },
  ao_ou: {
    title:'ao 和 ou：一个张嘴，一个是圆嘴',
    illus:{ type:'mouth', a:{shape:'open', label:'ao', note:'先张大口'}, b:{shape:'round', label:'ou', note:'一直圆圆'}, },
    one:'ao 从大张的 a 滑到 o，嘴巴由大变小；ou 一直保持圆嘴。',
    key:'ao 张嘴往后收，ou 圆嘴滑一下。',
    pairs:[['好','hǎo'],['后','hòu'],['高','gāo'],['口','kǒu']],
    warn:'「好 hǎo」不要读成 hǒu，「楼 lóu」不要读成 láo。'
  },
  iu_ou: {
    title:'iu 和 ou：前面有没有 i',
    illus:{ type:'mouth', a:{shape:'flat', label:'iu', note:'先扁嘴 i'}, b:{shape:'round', label:'ou', note:'直接圆嘴'} },
    one:'iu 前面有个 i，先把嘴咧开再收圆；ou 开头就是圆圆的。',
    key:'iu 前面有个 i，ou 前面光溜溜。',
    pairs:[['流','liú'],['楼','lóu'],['六','liù'],['漏','lòu']],
    warn:'「六 liù」不要读成 lòu，「丢 diū」不要读成 dōu。'
  },

  an_ang: {
    title:'有没有后鼻音：an 和 ang',
    illus:{ type:'profile', a:{tongue:'front', air:'nose', label:'an', note:'舌尖抵前'}, b:{tongue:'back', air:'nose', label:'ang', note:'舌根抬起'} },
    one:'an 是前鼻音，舌尖抵住上牙床，嘴巴张得小；ang 是后鼻音，舌根抬起，嘴巴张大、声音拖得长。',
    key:'前鼻舌尖抵，后鼻舌根起；前鼻短，后鼻长。',
    pairs:[['班','bān'],['帮','bāng'],['看','kàn'],['汤','tāng']],
    warn:'「上 shàng」「方 fāng」都带后鼻音，读完要把嘴张大一点。'
  },
  en_eng: {
    title:'有没有后鼻音：en 和 eng',
    illus:{ type:'profile', a:{tongue:'front', air:'nose', label:'en', note:'嘴扁、舌尖抵前'}, b:{tongue:'back', air:'nose', label:'eng', note:'嘴略开、舌根抬起'} },
    one:'en 是前鼻音，嘴扁扁的；eng 是后鼻音，舌根抬起、声音靠后。',
    key:'en 像摁门铃，eng 像灯发光。',
    pairs:[['门','mén'],['朋','péng'],['真','zhēn'],['争','zhēng']],
    warn:'「灯 dēng」「冷 lěng」都是后鼻音，别读成 dēn、lěn。'
  },
  in_ing: {
    title:'有没有后鼻音：in 和 ing',
    illus:{ type:'profile', a:{tongue:'front', air:'nose', label:'in', note:'声音靠前'}, b:{tongue:'back', air:'nose', label:'ing', note:'声音靠后、拖长'} },
    one:'in 是前鼻音，声音收在鼻腔前面；ing 是后鼻音，舌根抬起、声音长一点。',
    key:'in 像阴天，ing 像老鹰，鹰要飞得长一点。',
    pairs:[['音','yīn'],['英','yīng'],['心','xīn'],['星','xīng']],
    warn:'「京 jīng」「星 xīng」都要拖长音，读短了就变成前鼻音了。'
  },
  ie_ve: {
    title:'ie 和 üe：嘴唇圆不圆',
    illus:{ type:'mouth', a:{shape:'flat', label:'ie', note:'扁嘴'}, b:{shape:'round', label:'üe', note:'圆嘴'} },
    one:'ie 读的时候嘴唇是扁的，üe 读的时候嘴唇一定要圆起来，像吹口哨。',
    key:'ie 扁扁真客气，üe 圆圆像月亮。',
    pairs:[['写','xiě'],['雪','xuě'],['也','yě'],['月','yuè']],
    warn:'「月 yuè」要圆嘴；读成 yè 就变成「叶」了。'
  },

  zhi_chi_shi: {
    title:'整体认读：zhi chi shi 要一口读出来',
    illus:{ type:'build', wrong:['zh','i'], right:'zhi', note:'不要分开拼' },
    one:'zhi、chi、shi 是整体认读音节，看到就要整个读出来，不能拆成「zh-i」去拼。',
    key:'zhi chi shi，整体认读不分开。',
    pairs:[['知','zhī'],['吃','chī'],['是','shì'],['纸','zhǐ']],
    warn:'拆着拼会读成「知-衣」，那是错的。'
  },
  zi_ci_si: {
    title:'整体认读：zi ci si 也要一口读出来',
    illus:{ type:'build', wrong:['z','i'], right:'zi', note:'不要分开拼' },
    one:'zi、ci、si 同样是整体认读音节，中间不加任何东西。',
    key:'zi ci si，整体认读不分开。',
    pairs:[['字','zì'],['丝','sī'],['此','cǐ'],['紫','zǐ']],
    warn:'别读成「资-衣」，它们只有一个音。'
  },
  yi_wu_yu: {
    title:'整体认读：i u ü 找 y 和 w 帮忙',
    illus:{ type:'build', wrong:['i','u','ü'], right:'yi wu yu', note:'加 y/w，ü 要脱帽' },
    one:'i、u、ü 不能自己单独做音节：i 找 y 变 yi，u 找 w 变 wu，ü 找 y 变 yu 并且去掉两点。',
    key:'i 找 y，u 找 w，ü 见 y 就脱帽。',
    pairs:[['一','yī'],['五','wǔ'],['鱼','yú'],['雨','yǔ']],
    warn:'「鱼 yú」写的时候没有两点，「女 nǚ」的两点必须留着。'
  },
  ye_yue_yuan: {
    title:'整体认读：ie üe üan 见到 y 就变身',
    illus:{ type:'build', wrong:['ie','üe','üan'], right:'ye yue yuan', note:'i→y，ü→yu' },
    one:'ie 加 y 变 ye，üe 加 y 变 yue，üan 加 y 变 yuan，都要整个认读。',
    key:'ie üe üan，见到 y 就变身。',
    pairs:[['叶','yè'],['月','yuè'],['圆','yuán'],['远','yuǎn']],
    warn:'「月 yuè」不是 yüè，「圆 yuán」不是 yüán，两点要去掉。'
  },

  tone_1_2: {
    title:'一声 和 二声：平着走 还是 往上爬',
    illus:{ type:'tone', lines:[[1],[2]] },
    one:'一声又高又平，像拉长音「啊——」；二声从低往高升，像问问题「啊？」。',
    key:'一声平又平，二声往上扬。',
    pairs:[['妈','mā'],['麻','má'],['花','huā'],['华','huá']],
    warn:'「麻 má」要往上扬，「妈 mā」要一直平着。'
  },
  tone_2_3: {
    title:'二声 和 三声：爬坡 还是 拐弯',
    illus:{ type:'tone', lines:[[2],[3]] },
    one:'二声一路上升；三声先降下去、再升起来，中间拐一个弯。',
    key:'二声一直往上爬，三声先下再上拐个弯。',
    pairs:[['皮','pí'],['匹','pǐ'],['儿','ér'],['耳','ěr']],
    warn:'三声不能只往上，也不能只往下，一定要「沉下去再抬起来」。'
  },
  tone_3_4: {
    title:'三声 和 四声：小桥 还是 下坡',
    illus:{ type:'tone', lines:[[3],[4]] },
    one:'三声先降后升像小桥；四声从最高一路冲到最低，干脆利落。',
    key:'三声拐弯像小桥，四声下坡冲到底。',
    pairs:[['马','mǎ'],['骂','mà'],['土','tǔ'],['兔','tù']],
    warn:'「马 mǎ」和「骂 mà」只差一个调，读错了意思就完全反了。'
  },
  neutral: {
    title:'轻声：又轻又短，一带而过',
    illus:{ type:'tone', lines:[[1]], neutral:true },
    one:'轻声没有调号，读得又轻又短。常见在叠词第二个字和词尾的「子、头、们」。',
    key:'轻声轻又短，像条小尾巴。',
    pairs:[['妈妈','mā·ma'],['桌子','zhuō·zi'],['石头','shí·tou'],['眼睛','yǎn·jing']],
    warn:'「妈妈」写 māma，第二个 ma 不标调号。'
  },
  mark_iu: {
    title:'iu 和 ui 的声调标在后面',
    illus:{ type:'mark', word:'liu', on:2, result:'liù', note:'iu/ui 声调标在后一个字母' },
    one:'i 和 u 挨在一起的时候，声调永远标在后面那个字母上。',
    key:'i u 并列标在后，谁在后面标谁头。',
    pairs:[['六','liù'],['归','guī'],['秋','qiū'],['对','duì']],
    warn:'写成 lìu、gūi、dùi 都是错的。'
  },
  u_dots: {
    title:'ü 遇到 j q x y 要脱帽',
    illus:{ type:'mark', word:'jü', on:1, result:'ju', note:'j q x y 后面 ü 去掉两点', strip:true },
    one:'ü 碰到 j、q、x、y 时要把两点去掉，写成 u，但读起来还是 ü。遇到 n、l 时两点必须留着。',
    key:'j q x y 真淘气，见了 ü 眼就抹去；n l 后面要保留。',
    pairs:[['去','qù'],['需','xū'],['女','nǚ'],['绿','lǜ']],
    warn:'「女 nǚ」「绿 lǜ」的两点绝对不能丢。'
  },

  tone_3sandhi: {
    title:'两个三声连在一起，前一个要读成二声',
    illus:{ type:'tone', lines:[[3]], second:[2] },
    one:'两个三声字连读时，前一个三声要读成二声，这叫「三声变调」。注意：写拼音时还是标原来的三声。',
    key:'三声碰三声，前面变二声。',
    pairs:[['你好','ní hǎo'],['水果','shuí guǒ'],['小雨','xiáo yǔ'],['老虎','láo hǔ']],
    warn:'「你好」读 ní hǎo，但注音还要写 nǐ hǎo。'
  },
  yi_bu: {
    title:'「一」和「不」会变调',
    illus:{ type:'tone', lines:[[1]], labels:['一 yī'], second:[2], note:'后面是四声就读二声' },
    one:'「一」后面是第四声时读 yí（一个 yí gè）；后面是一、二、三声时读 yì（一天 yì tiān）。「不」后面是第四声时读 bú（不对 bú duì）。',
    key:'一不变调看后面：四声前读二声，其他读四声。',
    pairs:[['一个','yí gè'],['一天','yì tiān'],['不对','bú duì'],['第一','dì yī']],
    warn:'「第一 dì yī」里的一永远读 yī，因为它是序数词。'
  },

  /* ---------- v4 新增的 5 条讲解 ---------- */
  apostrophe: {
    title:'隔音符号：别把两个音节粘成一个',
    illus:{ type:'build', wrong:['xi','an'], right:"xī'ān", note:'两个音节中间要隔开' },
    one:"一个音节以 a、o、e 开头，而它前面还有别的音节时，中间要写一个隔音符号（'），不然会被当成一个音节读错。",
    key:'a、o、e 开头的音节跟在别人后面，中间别忘了加隔音符号。',
    pairs:[['西安',"xī'ān"],['方案',"fāng'àn"],['女儿',"nǚ'ér"],['海鸥',"hǎi'ōu"]],
    warn:"不写隔音符号，「西安 xī'ān」就变成「先 xiān」，「方案 fāng'àn」就变成「fāngàn」。"
  },
  mark_rule: {
    title:'声调标在哪个字母上',
    illus:{ type:'mark', word:'duo', on:2, result:'duō', note:'有 a 就标 a；没 a 先找 o、e' },
    one:'标调是有先后顺序的：先看有没有 a，有 a 就标在 a 上；没有 a 再看有没有 o、e，标在 o 或 e 上；i、u 挨在一起时标在后面那个字母上。',
    key:'有 a 别放过，没 a 找 o e，i u 并列标在后。',
    pairs:[['天','tiān'],['高','gāo'],['多','duō'],['说','shuō']],
    warn:'写成 tīan、dūo、shūo 都是把调号放错了字母。'
  },
  y_w_rule: {
    title:'i u ü 打头，要请 y 和 w 帮忙',
    illus:{ type:'build', wrong:['ī','ū','ǘ'], right:'yī wū yú', note:'i→y，u→w，ü→y 并去两点' },
    one:'i、u、ü 开头的音节不能光写字母：i 前面加 y，u 前面加 w，ü 前面加 y 并且去掉两点。',
    key:'i 前加 y，u 前加 w，ü 见 y 就脱帽。',
    pairs:[['衣','yī'],['乌','wū'],['鸭','yā'],['我','wǒ']],
    warn:'写成 ī、ū、ǘ，或者 iā、uō，都是错的。'
  },
  zhengti_judge: {
    title:'哪些是整体认读音节',
    illus:{ type:'build', wrong:['zhi','chi','shi','ri'], right:'整体认读 16 个', note:'看到就整个读，不要拼' },
    one:'整体认读音节一共 16 个：zhi chi shi ri、zi ci si、yi wu yu、ye yue yuan、yin yun ying。看到它们要整个读出来，不能拆开拼。',
    key:'zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan yin yun ying，一共 16 个。',
    pairs:[['知','zhī'],['日','rì'],['鱼','yú'],['英','yīng']],
    warn:'yan、wang、you、yao 都不是整体认读音节，要一个一个拼出来。'
  },
  comprehensive: {
    title:'最容易读错的字，单独记牢',
    illus:{ type:'build', wrong:['yìn','chù'], right:'yīn wèi chǔ lǐ', note:'这些字一读就错' },
    one:'有些字看着简单，其实一读就错：因为 yīn wèi、处理 chǔ lǐ、比较 bǐ jiào、友谊 yǒu yì、亚洲 yà zhōu、活泼 huó pō。',
    key:'这些字要一个一个记住，不能靠猜。',
    pairs:[['因为','yīn wèi'],['骨头','gǔ tou'],['萝卜','luó bo'],['附近','fù jìn']],
    warn:'「因为」读 yīn wèi（不是 yìn wéi），「比较」读 bǐ jiào（不是 bǐ jiǎo）。'
  }
};

/* ---------- 讲解的朗读稿（应用与语音生成脚本共用同一份，保证不一致听）---------- */
function explainSpeech(kid) {
  var ex = EXPLANATIONS[kid];
  if (!ex) return '';
  var parts = [ex.title, ex.one, '口诀：' + ex.key];
  if (ex.pairs && ex.pairs.length) {
    parts.push('对比一下：' + ex.pairs.map(function (p) { return p[0] + '，读' + p[1]; }).join('；'));
  }
  if (ex.warn) parts.push(ex.warn);
  return parts.join('。');
}

/* ---------- 79 件装扮（积分兑换 + 彩蛋掉落）
   slot：hat 帽子 / eyes 眼镜墨镜 / ear 耳饰 / neck 项链围巾 / wrist 手表手环 /
         top 上衣 / cape 披风 / bottom 裤子裙子 / shoes 鞋 / back 背包翅膀 /
         hand 手持 / pet 宠物 / vehicle 载具
   每件装备的图形画在 js/avatar.js 里（同一套 SVG，穿戴后会真的出现在全身像上）
--------------------------------------------------- */
const OUTFITS = [
  // 帽子
  { id:'hat_cap',    name:'棒球帽',     slot:'hat',    cost:100 },
  { id:'hat_bow',    name:'蝴蝶结发箍', slot:'hat',    cost:150 },
  { id:'hat_beanie', name:'毛线帽',     slot:'hat',    cost:200 },
  { id:'hat_sun',    name:'遮阳帽',     slot:'hat',    cost:240 },
  { id:'hat_flower', name:'花环',       slot:'hat',    cost:300 },
  { id:'hat_cowboy', name:'牛仔帽',     slot:'hat',    cost:380 },
  { id:'hat_pirate', name:'海盗帽',     slot:'hat',    cost:460 },
  { id:'hat_crown',  name:'小皇冠',     slot:'hat',    cost:560 },
  { id:'hat_wizard', name:'巫师尖帽',   slot:'hat',    cost:700 },
  // 眼镜 / 墨镜
  { id:'eye_round',  name:'圆框眼镜',   slot:'eyes',   cost:150 },
  { id:'eye_sport',  name:'运动护目镜', slot:'eyes',   cost:260 },
  { id:'eye_sun',    name:'酷酷墨镜',   slot:'eyes',   cost:320 },
  { id:'eye_pixel',  name:'像素眼镜',   slot:'eyes',   cost:360 },
  { id:'eye_star',   name:'星星墨镜',   slot:'eyes',   cost:460 },
  { id:'eye_heart',  name:'爱心墨镜',   slot:'eyes',   cost:520 },
  { id:'eye_rainbow',name:'彩虹墨镜',   slot:'eyes',   cost:620 },
  // 耳饰
  { id:'ear_star',   name:'星星耳钉',   slot:'ear',    cost:120 },
  { id:'ear_bell',   name:'小铃铛耳环', slot:'ear',    cost:180 },
  { id:'ear_heart',  name:'爱心耳坠',   slot:'ear',    cost:260 },
  { id:'ear_pearl',  name:'珍珠耳坠',   slot:'ear',    cost:340 },
  // 项链 / 围巾
  { id:'neck_scarf', name:'小红围巾',   slot:'neck',   cost:180 },
  { id:'neck_heart', name:'爱心吊坠',   slot:'neck',   cost:260 },
  { id:'neck_pearl', name:'珍珠项链',   slot:'neck',   cost:360 },
  { id:'neck_gold',  name:'金链子',     slot:'neck',   cost:520 },
  { id:'neck_gem',   name:'宝石项链',   slot:'neck',   cost:680 },
  // 手表 / 手环
  { id:'wrist_band', name:'运动手环',   slot:'wrist',  cost:160 },
  { id:'wrist_kid',  name:'卡通小手表', slot:'wrist',  cost:260 },
  { id:'wrist_sport',name:'运动手表',   slot:'wrist',  cost:380 },
  { id:'wrist_gold', name:'金手表',     slot:'wrist',  cost:620 },
  // 上衣
  { id:'top_tank',   name:'清爽背心',   slot:'top',    cost:180 },
  { id:'top_stripe', name:'条纹T恤',    slot:'top',    cost:220 },
  { id:'top_star',   name:'星星运动衣', slot:'top',    cost:300 },
  { id:'top_sweater',name:'针织毛衣',   slot:'top',    cost:380 },
  { id:'top_hoodie', name:'连帽卫衣',   slot:'top',    cost:420 },
  { id:'top_sailor', name:'水手服',     slot:'top',    cost:480 },
  { id:'top_rain',   name:'透明雨衣',   slot:'top',    cost:540 },
  { id:'top_dino',   name:'恐龙卫衣',   slot:'top',    cost:660 },
  { id:'top_super',  name:'超人紧身衣', slot:'top',    cost:780 },
  // 披风
  { id:'cape_rain',  name:'小雨披',     slot:'cape',   cost:260 },
  { id:'cape_red',   name:'小红披风',   slot:'cape',   cost:360 },
  { id:'cape_hero',  name:'英雄披风',   slot:'cape',   cost:640 },
  { id:'cape_butterfly', name:'蝴蝶斗篷', slot:'cape', cost:760 },
  { id:'cape_star',  name:'星空斗篷',   slot:'cape',   cost:880 },
  // 裤子 / 裙子
  { id:'bot_sport',  name:'运动短裤',   slot:'bottom', cost:200 },
  { id:'bot_ball',   name:'篮球短裤',   slot:'bottom', cost:220 },
  { id:'bot_skirt',  name:'小纱裙',     slot:'bottom', cost:300 },
  { id:'bot_jeans',  name:'牛仔长裤',   slot:'bottom', cost:320 },
  { id:'bot_pleat',  name:'百褶裙',     slot:'bottom', cost:340 },
  { id:'bot_overall',name:'背带裤',     slot:'bottom', cost:420 },
  { id:'bot_tutu',   name:'蓬蓬裙',     slot:'bottom', cost:460 },
  // 鞋
  { id:'shoe_sandal',name:'小凉鞋',     slot:'shoes',  cost:170 },
  { id:'shoe_sneak', name:'运动鞋',     slot:'shoes',  cost:240 },
  { id:'shoe_oxford',name:'小皮鞋',     slot:'shoes',  cost:300 },
  { id:'shoe_boot',  name:'小雨靴',     slot:'shoes',  cost:340 },
  { id:'shoe_light', name:'发光鞋',     slot:'shoes',  cost:560 },
  // 背包 / 背部
  { id:'back_bag',   name:'小书包',     slot:'back',   cost:300 },
  { id:'back_shell', name:'小龟壳',     slot:'back',   cost:400 },
  { id:'back_butterfly', name:'蝴蝶翅膀', slot:'back', cost:620 },
  { id:'back_wing',  name:'天使翅膀',   slot:'back',   cost:700 },
  { id:'back_rocket',name:'火箭背包',   slot:'back',   cost:880 },
  { id:'back_jet',   name:'喷气背包',   slot:'back',   cost:980 },
  // 手持
  { id:'hand_icescream', name:'冰淇淋', slot:'hand',   cost:200 },
  { id:'hand_balloon',   name:'小气球', slot:'hand',   cost:250 },
  { id:'hand_flower',    name:'小花束', slot:'hand',   cost:280 },
  { id:'hand_umbrella',  name:'小雨伞', slot:'hand',   cost:320 },
  { id:'hand_ball',      name:'小足球', slot:'hand',   cost:380 },
  { id:'hand_sword',     name:'玩具剑', slot:'hand',   cost:520 },
  { id:'hand_wand',      name:'魔法棒', slot:'hand',   cost:620 },
  // 宠物
  { id:'pet_rabbit', name:'小兔子',     slot:'pet',    cost:420 },
  { id:'pet_cat',    name:'小猫咪',     slot:'pet',    cost:480 },
  { id:'pet_dog',    name:'小狗狗',     slot:'pet',    cost:480 },
  { id:'pet_dino',   name:'小恐龙',     slot:'pet',    cost:700 },
  { id:'pet_panda',  name:'小熊猫',     slot:'pet',    cost:780 },
  { id:'pet_unicorn',name:'独角兽',     slot:'pet',    cost:900 },
  // 载具
  { id:'veh_bike',   name:'小自行车',   slot:'vehicle',cost:520 },
  { id:'veh_boat',   name:'小帆船',     slot:'vehicle',cost:560 },
  { id:'veh_car',    name:'小汽车',     slot:'vehicle',cost:640 },
  { id:'veh_plane',  name:'小飞机',     slot:'vehicle',cost:760 },
  { id:'veh_rocket', name:'小火箭',     slot:'vehicle',cost:980 }
];

const OUTFIT_MAP = {};
OUTFITS.forEach(function (o) { OUTFIT_MAP[o.id] = o; });

/* 默认穿搭（没买任何东西时小朋友就是这个样子：白T恤 + 短裤） */
const BASE_TOP = 'top_white';
const BASE_BOTTOM = 'bot_short';

/* ---------- 彩蛋奖励池（装扮集齐后的小惊喜）---------- */
const EGG_BONUS = ['🍭','🍬','🌟','🎈','🧁','🍀','🎪','🐣','🦄','🎠'];

/* ---------- 便捷索引 ---------- */
const KP_MAP = {};
KNOWLEDGE_POINTS.forEach(function (kp) { KP_MAP[kp.id] = kp; });
