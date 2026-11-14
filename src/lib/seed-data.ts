import type { PuzzleType } from "@/types/game";

export interface SeedMission {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  locationName: string;
  locationNote: string;
  mapX: number;
  mapY: number;
  storyBackground: string;
  safetyNotice: string;
  puzzleType: PuzzleType;
  promptText: string;
  puzzlePayload: Record<string, unknown>;
  correctAnswer: unknown;
  hint1: string;
  hint2: string;
  explanation: string;
  sourceTitle: string;
  sourceUrl: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  clueSummary: string;
  defaultUnlocked: boolean;
}

export interface OfficialSourceItem {
  title: string;
  category: string;
  url: string;
  note: string;
}

export const OFFICIAL_SOURCES: OfficialSourceItem[] = [
  {
    title: "校史沿革（民國35年創辦至今）",
    category: "學校歷史",
    url: "https://www.fhjh.tp.edu.tw/about-fuhsing/189",
    note: "臺北市私立復興實驗高級中學官方校史紀錄（含幼稚園、小學、中學、實驗高中及雙語部成立年份）。",
  },
  {
    title: "School History (Official English Archive)",
    category: "學校歷史",
    url: "https://www.fhjh.tp.edu.tw/en/node/106",
    note: "包含 1946 年創校、1960 年遷至敦化南路現址與校舍改建歷程。",
  },
  {
    title: "優質環境與校園建築特色",
    category: "校園環境與建築",
    url: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
    note: "成賢樓、勤學樓、慎思樓、校史館、國學館、鐘樓（鐘塔）、小花園、魚菜共生及「綠的延伸」設計理念。",
  },
  {
    title: "地理位置（臺北市大安區敦化南路一段262號）",
    category: "校園位置",
    url: "http://www.fhjh.tp.edu.tw/dispPageBox/mainCp.aspx?ddsPageID=MAINABOUTI",
    note: "官方校園地址、鄰近捷運站及林蔭大道周邊文教環境說明。",
  },
  {
    title: "校旗與校徽（民國82年修訂意涵）",
    category: "校徽與象徵",
    url: "https://www.fhjh.tp.edu.tw/about-fuhsing/183",
    note: "三角形、五瓣梅花、火炬與鴿形火焰、外圍圓形之官方設計說明。",
  },
  {
    title: "復興精神與復興理念（火炬精神・穩準高遠）",
    category: "教育理念",
    url: "https://www.fhjh.tp.edu.tw/about-fuhsing/182",
    note: "校訓「穩準高遠」、學生核心素養「做上品人、學真知識、展多元才、行大我事」與火炬精神全文。",
  },
  {
    title: "教務處業務介紹",
    category: "行政處室",
    url: "https://www.fhjh.tp.edu.tw/faculty-introduction/673",
    note: "課程規劃、教學設備、成績與註冊證明、數位學生證等官方業務職掌。",
  },
  {
    title: "學務處業務介紹",
    category: "行政處室",
    url: "https://www.fhjh.tp.edu.tw/faculty-introduction/710",
    note: "訓育社團、生活輔導、遺失物處理、防震防災演練、衛生環保與健康中心業務。",
  },
  {
    title: "總務處業務簡介",
    category: "行政處室",
    url: "https://www.fhjh.tp.edu.tw/administrative-unit/336",
    note: "校舍修繕維護、校園綠美化、校具採購及場地借用相關職掌。",
  },
  {
    title: "輔導室業務介紹",
    category: "行政處室",
    url: "https://www.fhjh.tp.edu.tw/faculty-introduction/604",
    note: "三級預防輔導網絡、特殊教育與資源教室、升學與生涯探索資訊服務。",
  },
  {
    title: "中學圖書館使用規則與館藏",
    category: "圖書資源",
    url: "https://www.fhjh.tp.edu.tw/faculty-introduction/3999",
    note: "採用「中文圖書分類法」編目及平日開放閱讀規範。",
  },
  {
    title: "有毒植物・保持距離（校園生態衛教）",
    category: "環境安全",
    url: "https://www.fhjh.tp.edu.tw/administrative-unit/252",
    note: "宣導以欣賞和愛護取代隨意採摘，維護校園自然生態平衡。",
  },
];

export const SEED_MISSIONS: SeedMission[] = [
  {
    id: 1,
    code: "M01",
    title: "校園初識",
    subtitle: "紅磚與林蔭交會的起點",
    locationName: "校門口與敦化南路林蔭入口",
    locationNote: "示意定位：校園南側正門入口意象區（敦化南路一段262號）",
    mapX: 250,
    mapY: 535,
    storyBackground:
      "清晨的陽光穿過敦化南路的樹梢，灑在你的探索筆記本上。信封上的第一段文字寫道：「當你站在林蔭大道旁，望見溫暖的紅磚與灰牆校舍、左側高聳守望的鐘樓，以及微風裡飄揚的旗幟，你就站在復興記憶的起點。」請仔細觀察校園外觀，找出真正的復興實中。",
    safetyNotice: "請留在人行道或校門口安全區域安靜觀察，切勿奔跑或阻擋車輛與師生通行動線。",
    puzzleType: "image-recognition",
    promptText:
      "請觀察下列三張校園影像，哪一張真實呈現了復興實中「紅磚灰牆建築群、左側鐘樓、戶外階梯與綠意中庭」的外觀特色？",
    puzzlePayload: {
      options: [
        {
          id: "campus-a",
          label: "影像 A",
          caption: "遠離市區、以傳統單層木屋與碎石操場為主的山林校區",
          imageUrl: "/images/campus-decoy-mountain.png",
        },
        {
          id: "campus-b",
          label: "影像 B",
          caption: "紅磚與灰牆建築群、左側鐘樓、戶外連結階梯與綠蔭中庭",
          imageUrl: "/images/fuhsing-campus-hero.png",
        },
        {
          id: "campus-c",
          label: "影像 C",
          caption: "海濱白色鋼骨與曲面玻璃穹頂構成的弧形濱海校區",
          imageUrl: "/images/campus-decoy-futuristic.png",
        },
      ],
    },
    correctAnswer: "campus-b",
    hint1:
      "臺北市私立復興實驗高級中學坐落於繁華的大安區敦化南路林蔭大道旁，並非山林木屋或海濱玻璃穹頂建築。",
    hint2:
      "注意畫面左側是否有一座紅磚砌成的經典鐘樓，以及校舍之間互相串聯的戶外階梯、天橋與綠色植栽中庭。",
    explanation:
      "復興實中位於臺北市大安區敦化南路一段262號，校舍以穩重溫暖的紅磚與灰色石材搭配，左側立有象徵時間秩序的鐘樓，建築間以戶外樓梯與走廊相連，環抱著充滿林蔭綠意的中庭空間。",
    sourceTitle: "復興實中官網〈優質環境〉與〈地理位置〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
    fragmentName: "紅磚晨光",
    fragmentPoem: "林蔭掩映紅磚牆，故事從跨入校門的這一步悄悄甦醒。",
    fragmentSymbol: "compass",
    clueSummary: "線索 01：校園坐落敦化南路一段262號，以紅磚灰牆與左側鐘樓為鮮明地標。",
    defaultUnlocked: true,
  },
  {
    id: 2,
    code: "M02",
    title: "鐘樓的故事",
    subtitle: "晨鐘暮鼓中的四字箴言",
    locationName: "左側鐘樓（鐘塔）前廣場",
    locationNote: "示意定位：校園左側紅磚鐘塔地標區",
    mapX: 175,
    mapY: 365,
    storyBackground:
      "仰望左側的紅磚鐘樓，那座在城市喧囂中依然守候校園節奏的建築，靜靜述說著「晨鐘暮鼓」的儀式感。信封夾頁裡藏著一張黃銅字盤，記錄著復興鐘塔所代表的四字校訓，等待你透過字義線索推敲出來。",
    safetyNotice: "請於廣場開闊處抬頭觀察鐘塔造型，切勿攀爬花台或追逐推擠。",
    puzzleType: "logic-choice",
    promptText:
      "根據官方記載的「復興鐘塔精神」，請依序為下列四句敘述選出正確的關鍵字，拼出復興實中的四字校訓：",
    puzzlePayload: {
      slots: [
        {
          id: "s1",
          prefix: "個性沉",
          choices: ["穩", "靜", "安"],
          desc: "面對起伏與挑戰依然踏實冷靜",
        },
        {
          id: "s2",
          prefix: "讀書精",
          choices: ["細", "準", "勤"],
          desc: "求知治學力求確切深入、不敷衍",
        },
        {
          id: "s3",
          prefix: "志氣崇",
          choices: ["大", "高", "宏"],
          desc: "懷抱光明磊落的品格與理想",
        },
        {
          id: "s4",
          prefix: "目標宏",
          choices: ["遠", "廣", "深"],
          desc: "立足臺灣、放眼世界的長遠格局",
        },
      ],
    },
    correctAnswer: {
      s1: "穩",
      s2: "準",
      s3: "高",
      s4: "遠",
    },
    hint1:
      "這四個字正是復興實中的正式「校訓」，與學校期望學生具備的品格氣質息息相關。",
    hint2:
      "試著分別朗讀四個詞語：「個性沉＿」、「讀書精＿」、「志氣崇＿」、「目標宏＿」，每個空格都是最自然常見的雙字詞組合！",
    explanation:
      "復興鐘樓（鐘塔）不只是建築門面，更代表「晨鐘暮鼓」的時間紀律與學習儀式感。官方記載的復興鐘塔精神為「個性沉穩、讀書精準、志氣崇高、目標宏遠」，凝聚為校訓「穩、準、高、遠」。",
    sourceTitle: "復興實中官網〈復興精神〉與〈優質環境〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/182",
    fragmentName: "鐘聲餘韻",
    fragmentPoem: "鐘聲不催促步伐，而是提醒每顆心穩準高遠地前行。",
    fragmentSymbol: "bell",
    clueSummary: "線索 02：復興鐘塔精神與校訓為「穩、準、高、遠」。",
    defaultUnlocked: true,
  },
  {
    id: 3,
    code: "M03",
    title: "建築的名字",
    subtitle: "高低錯落的光影對話",
    locationName: "校舍建築群戶外連結步道",
    locationNote: "示意定位：主要教學樓群與特色館舍意象區",
    mapX: 745,
    mapY: 225,
    storyBackground:
      "在寸土寸金的臺北東區，復興校園走出傳統單調的校舍配置：建築師把較高的樓層擺在北邊、較低的樓層擺在南邊，讓陽光與微風穿過高低錯落的連結步道與天橋。而每一棟樓舍與專門空間，也都有屬於自己的名字與使命。",
    safetyNotice: "探索時請勿進入正在上課的教室，並保持走廊與樓梯間輕聲細語、不奔跑。",
    puzzleType: "map-matching",
    promptText:
      "請點選左側「真實存在於復興實中的建築／空間名稱」，並與右側「官方記載的功能與期許」完成正確配對：",
    puzzlePayload: {
      leftItems: [
        { id: "b1", label: "成賢樓・勤學樓・慎思樓" },
        { id: "b2", label: "國學館" },
        { id: "b3", label: "校史館" },
        { id: "b4", label: "中學圖書館" },
      ],
      rightItems: [
        {
          id: "d1",
          text: "學校主要教學大樓群，名稱蘊含品德修養、勤勉求學與審慎思考之期許",
        },
        {
          id: "d2",
          text: "推展中華文化經典與人文素養學習的特色館舍",
        },
        {
          id: "d3",
          text: "典藏創校以來歷史文物、影像與學校發展紀錄的記憶空間",
        },
        {
          id: "d4",
          text: "館藏依「中文圖書分類法」編目，提供師生閱讀與自習的知識殿堂",
        },
      ],
    },
    correctAnswer: {
      b1: "d1",
      b2: "d2",
      b3: "d3",
      b4: "d4",
    },
    hint1:
      "可以先從名稱中最直接的關鍵字下手：看到「史」便與歷史文物典藏相關；看到「圖書館」則與書籍分類和閱讀相關。",
    hint2:
      "「成賢、勤學、慎思」是復興校園著名的三棟主要教學大樓名稱；「國學」則象徵中華文化經典傳承。",
    explanation:
      "復興實中校舍設計尊重自然採光與氣流風向（北高南低的配置），並將「成賢樓、勤學樓、慎思樓」與「校史館、國學館、中學圖書館、大／小禮堂」等多元學習空間緊密串聯，讓有限的校地發揮最大教育價值。",
    sourceTitle: "復興實中官網〈優質環境〉與〈中學圖書館〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
    fragmentName: "紅瓦之名",
    fragmentPoem: "成賢、勤學而慎思，每一棟紅瓦灰牆都承載著期許。",
    fragmentSymbol: "building",
    clueSummary: "線索 03：校舍採北高南低採光設計，包含成賢樓、勤學樓、慎思樓與國學館等真實建築。",
    defaultUnlocked: true,
  },
  {
    id: 4,
    code: "M04",
    title: "校史時間膠囊",
    subtitle: "從光復初春走向十三年一貫",
    locationName: "校史館外廊（含閉館數位檔案替代站）",
    locationNote: "示意定位：校史紀念與時間典藏展示區",
    mapX: 590,
    mapY: 165,
    storyBackground:
      "檔案盒中附有一座黃銅齒輪鎖，紀錄著復興如何從一所幼稚園一步步成長為包含幼兒園、小學、國中、高中與雙語部的實驗學府。無論校史館今天是否開放，你都能透過這份經過驗證的官方校史檔案，重組學校的誕生脈絡。",
    safetyNotice: "若校史館未開放，請直接使用畫面中的「數位校史檔案替代室」完成任務，切勿推門或打擾館務人員。",
    puzzleType: "timeline-sort",
    promptText:
      "請將復興實中發展歷程中四個重要的學制里程碑，依照時間「由最早（第 1 位）到最晚（第 4 位）」排列正確：",
    puzzlePayload: {
      items: [
        {
          id: "h3",
          eraTag: "九年一貫成形",
          label: "增設「復興中學」，完成幼、小、中三位一體學制",
        },
        {
          id: "h1",
          eraTag: "創校起點",
          label: "婦女界先進林慎、廖溫音等女士捐資創辦「臺北市復興幼稚園」",
        },
        {
          id: "h4",
          eraTag: "十二年一貫",
          label: "正式成立「實驗高中」，定名為臺北市私立復興實驗高級中學",
        },
        {
          id: "h2",
          eraTag: "向下扎根延伸",
          label: "因辦學深獲好評，董事會增辦「復興小學」（首任校長方志平女士）",
        },
      ],
      museumFallbackArchive: [
        {
          period: "創辦之始・民國35年（1946年）",
          heading: "於南陽街舊址創辦「臺北市復興幼稚園」",
          detail:
            "民國34年台灣光復之初，婦女界先進林慎、廖溫音等女士本著培育民族幼苗、復興中華文化之宗旨捐資興學，於民國35年創辦復興幼稚園。",
        },
        {
          period: "小學階段・民國41年（1952年）",
          heading: "增辦「復興小學」並於民國49年遷至敦化南路現址",
          detail:
            "復興幼稚園深獲好評，董事會於民國41年增辦復興小學（方志平女士任首任校長）；民國49年因校舍不敷使用，遷校至敦化南路一段現址。",
        },
        {
          period: "中學誕生・民國57年（1968年）",
          heading: "增設「復興中學」完成幼小中三位一體",
          detail:
            "民國57年配合九年國民教育政策增設復興中學（中學部首任校長袁永貞女士），奠定九年一貫教育體系。",
        },
        {
          period: "高中與雙語・民國95～99年（2006–2010年）",
          heading: "成立實驗高中與雙語部",
          detail:
            "民國95年成立實驗高中，建構十二年（含幼兒園十三年）一貫學制；民國96年成立小學雙語部、97年國中雙語部、99年高中雙語部。",
        },
      ],
    },
    correctAnswer: ["h1", "h2", "h3", "h4"],
    hint1:
      "想一想一個孩子成長與學校擴展的自然軌跡：最先創辦的通常是最年幼的階段（幼稚園），之後才逐步銜接小學、中學與高中。",
    hint2:
      "依官方校史紀錄：民國35年創辦幼稚園 → 民國41年增辦小學 → 民國57年增設中學 → 民國95年成立實驗高中。",
    explanation:
      "復興於民國35年從「臺北市復興幼稚園」起步，定名「復興」蘊含復興民族與文化之深意；民國41年增辦復興小學、民國49年遷至現址、民國57年增設復興中學、民國95年成立實驗高中，並於民國96年起陸續開辦雙語部。",
    sourceTitle: "復興實中官網〈校史〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/189",
    fragmentName: "時光年輪",
    fragmentPoem: "從民國三十五年的幼苗開始，一圈圈刻出十三年一貫的年輪。",
    fragmentSymbol: "hourglass",
    clueSummary: "線索 04：學校創辦於民國35年（1946），經歷幼稚園、小學、中學至民國95年成立實驗高中。",
    defaultUnlocked: true,
  },
  {
    id: 5,
    code: "M05",
    title: "校徽密碼",
    subtitle: "幾何圖形裡的四重祝福",
    locationName: "升旗台與旗幟步道旁",
    locationNote: "示意定位：中庭北側旗桿與校旗展示區",
    mapX: 430,
    mapY: 245,
    storyBackground:
      "校園中庭微風拂過校旗，旗面上的校徽是民國82年經全校師生票選、行政會議討論與董事會決議修訂而成的樣子。看似簡潔的幾何圖形中，其實藏了四種教育期許，就像一組等待解開的圖騰密碼。",
    safetyNotice: "請在旗幟步道旁靜靜觀察校徽拆解圖，切勿拉扯旗繩或觸碰旗桿設施。",
    puzzleType: "symbol-decode",
    promptText:
      "點擊下方互動校徽的各個部位觀察細節，再將四個圖形符號與其官方象徵意義一一配對：",
    puzzlePayload: {
      symbols: [
        { id: "triangle", label: "三角形結構", color: "#D9B978" },
        { id: "plum", label: "五瓣梅花", color: "#F3F1EA" },
        { id: "torch", label: "火炬與鴿形火焰", color: "#E88B5A" },
        { id: "circle", label: "外圍圓形環", color: "#65C99A" },
      ],
      meanings: [
        {
          id: "m_tri",
          text: "代表「人」向上、向善發展，及中、小、幼三位一體的校園精神",
        },
        {
          id: "m_plum",
          text: "象徵堅忍毅力，五片花瓣代表德、智、體、群、美五育並重",
        },
        {
          id: "m_torch",
          text: "代表復興孩子是世上的光，火炬的火焰以鴿子形狀呈現象徵和平",
        },
        {
          id: "m_circle",
          text: "代表教育圓滿目標，也代表「沒有規矩不能成方圓」的規矩",
        },
      ],
    },
    correctAnswer: {
      triangle: "m_tri",
      plum: "m_plum",
      torch: "m_torch",
      circle: "m_circle",
    },
    hint1:
      "數一數梅花共有「五」片花瓣，正好對應學校最重視的「五育」；而火炬頂端的火焰線條就像一隻展翅的和平之鳥。",
    hint2:
      "三角形筆直指向上方、有三個頂點（三位一體）；外圍的圓形則呼應古語「沒有規矩不能成方圓」。",
    explanation:
      "民國82年修訂的現行校徽蘊含四重寓意：三角形象徵「人」向上向善與中、小、幼三位一體；梅花代表堅忍與五育並重；火炬象徵「復興孩子是世上的光」，鴿形火焰寓意和平；圓形則期勉學業與做人圓滿守規矩。",
    sourceTitle: "復興實中官網〈校旗與校徽〉與〈School Symbol〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/183",
    fragmentName: "火炬紋章",
    fragmentPoem: "梅花綻放五育芬芳，和平之鴿托起世上的光。",
    fragmentSymbol: "flame",
    clueSummary: "線索 05：校徽包含三角形、五瓣梅花（五育）、火炬與鴿形火焰（和平）、外圓（規矩圓滿）。",
    defaultUnlocked: true,
  },
  {
    id: 6,
    code: "M06",
    title: "綠色校園",
    subtitle: "東區林蔭中的生態呼吸",
    locationName: "小花園與中庭綠意步道",
    locationNote: "示意定位：校園中央植栽花園與生態景觀區",
    mapX: 485,
    mapY: 425,
    storyBackground:
      "踏出繁忙擁擠的臺北東區馬路，校園裡卻保有讓人沉靜呼吸的青翠中庭與小花園。建築設計師用「綠的延伸」概念把林蔭帶進校園，老師與同學也在這裡建立起生態循環的小天地。",
    safetyNotice: "觀察植物與魚菜共生區時請保持安全距離，切勿伸手撈水、觸碰設備或摘折枝葉。",
    puzzleType: "eco-matching",
    promptText:
      "請先完成左側三項校園綠色環境設計與右側說明的配對，再選出正確的校園生態安全守則：",
    puzzlePayload: {
      items: [
        { id: "e1", title: "「綠的延伸」建築設計" },
        { id: "e2", title: "小花園與「魚菜共生」系統" },
        { id: "e3", title: "「有毒植物保持距離」衛教觀念" },
      ],
      targets: [
        {
          id: "t1",
          text: "在都會街區中引進珍貴林蔭、採光與氣流，讓每個角落都能望見青翠綠意",
        },
        {
          id: "t2",
          text: "結合庭園植栽與水生植物生態循環，成為體驗生命與自然共生的學習場域",
        },
        {
          id: "t3",
          text: "抱持欣賞與愛護的心態保持距離，不隨意採摘或破壞生態平衡",
        },
      ],
      safetyQuestion: {
        prompt: "在探索小花園與綠意步道時，哪一項做法完全符合校園安全與生態愛護原則？",
        options: [
          {
            id: "safe-1",
            text: "沿著步道安靜觀察葉色與水生循環，不攀折花木、不跨入花圃或觸碰設備",
          },
          {
            id: "safe-2",
            text: "為了比對植物圖鑑，動手摘下兩片葉子帶回教室",
          },
          {
            id: "safe-3",
            text: "踩上花台邊緣快速跑過，尋找高處的樹梢葉片",
          },
        ],
      },
    },
    correctAnswer: {
      pairs: {
        e1: "t1",
        e2: "t2",
        e3: "t3",
      },
      safety: "safe-1",
    },
    hint1:
      "「綠的延伸」講的是整體建築如何把樹蔭與自然空氣引進校內；「魚菜共生」則屬於小花園中的生態循環實作。",
    hint2:
      "學校衛教提醒「路邊的野花不要採」，面對不熟悉的植物應該保持距離用眼睛欣賞，既保護自己也保護植物生命。",
    explanation:
      "復興實中以「綠的延伸」為建築發想，結合南、西、北側小花園與魚菜共生系統，將環境教育融入日常；同時透過衛教提醒學生尊重植物生態、保持安全距離，不任意採摘或破壞。",
    sourceTitle: "復興實中官網〈優質環境〉與〈有毒植物 保持距離〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/administrative-unit/252",
    fragmentName: "綠蔭之息",
    fragmentPoem: "在城市的心臟留下一片林蔭，教會我們與自然並肩呼吸。",
    fragmentSymbol: "leaf",
    clueSummary: "線索 06：以「綠的延伸」、小花園與魚菜共生實踐永續與人與自然和諧共生。",
    defaultUnlocked: true,
  },
  {
    id: 7,
    code: "M07",
    title: "校園幕後團隊",
    subtitle: "誰在守護每天的校園運轉？",
    locationName: "行政穿堂公告欄旁（遠距觀察）",
    locationNote: "示意定位：校園行政服務中軸穿堂意象區",
    mapX: 705,
    mapY: 430,
    storyBackground:
      "每天鐘聲準時響起、社團充滿歡笑、教室設備穩定運作、同學遇到困惑也有人傾聽——這些日常背後，是一群默默守望的行政處室團隊。現在有四位同學遇到不同狀況，請你在穿堂不打擾師長辦公的前提下，替他們找出對的求助窗口！",
    safetyNotice: "本關卡完全透過情境資料作答，請勿進入行政辦公室、亦勿打擾正在辦公的教職員與師長。",
    puzzleType: "office-matching",
    promptText:
      "請仔細閱讀四位同學的真實校園情境，分別配對到正確的官方行政處室：",
    puzzlePayload: {
      scenarios: [
        {
          id: "sc1",
          student: "七年級・林同學",
          situation:
            "「我的數位學生證遺失需要申請補發，同時想了解申請中英文成績單與在學證明書的流程，該找哪個處室？」",
        },
        {
          id: "sc2",
          student: "八年級・陳同學",
          situation:
            "「我想參加下學期的聯課社團活動、了解防震防災演練規範，以及將撿到的學生遺失物送交招領，應該找哪個處室？」",
        },
        {
          id: "sc3",
          student: "九年級・張同學",
          situation:
            "「班上課桌椅或教室照明燈具需要報修維護，以及社團想申請借用校園場地，這屬於哪個處室的業務？」",
        },
        {
          id: "sc4",
          student: "八年級・黃同學",
          situation:
            "「我想查閱多元入學與生涯探索訊息，或是為自己與同學尋求專業的心理諮詢與關懷支持，應該聯繫哪個單位？」",
        },
      ],
      offices: [
        {
          id: "academic",
          label: "教務處",
          note: "課程規劃・成績註冊・實驗設備",
        },
        {
          id: "student",
          label: "學務處",
          note: "訓育社團・生活輔導・防災衛生",
        },
        {
          id: "general",
          label: "總務處",
          note: "營繕修繕・環境綠化・場地採購",
        },
        {
          id: "counseling",
          label: "輔導室",
          note: "心理輔導・特教資源・生涯探索",
        },
      ],
    },
    correctAnswer: {
      sc1: "academic",
      sc2: "student",
      sc3: "general",
      sc4: "counseling",
    },
    hint1:
      "與「學籍、成績單、數位學生證補發、課程與實驗設備」相關的由教務處負責；與「社團、生活秩序、遺失物與防災安全」相關的則由學務處負責。",
    hint2:
      "校園空間與設備「修繕、採購、環境綠美化、場地借用」歸總務處；「心理關懷、資源教室與多元入學／生涯探索」則是輔導室的任務。",
    explanation:
      "認識行政處室能讓校園生活更安心從容：教務處守護學習與學籍、學務處陪伴品格與安全健康、總務處維護硬體設施與綠化空間、輔導室則在心理關懷與生涯發展上成為學生的後盾。",
    sourceTitle: "復興實中官網〈教務處〉、〈學務處〉、〈總務處〉、〈輔導室〉業務介紹",
    sourceUrl: "https://www.fhjh.tp.edu.tw/faculty-introduction/673",
    fragmentName: "守護之燈",
    fragmentPoem: "每一個順暢的日常背後，都有無聲付出的雙手在發光。",
    fragmentSymbol: "shield",
    clueSummary: "線索 07：教務、學務、總務、輔導四大行政單位分工協作，共同守護校園。",
    defaultUnlocked: true,
  },
  {
    id: 8,
    code: "M08",
    title: "時光的答案",
    subtitle: "七枚線索匯流的核心檔案",
    locationName: "中庭時光交會點",
    locationNote: "示意定位：串聯紅磚建築、鐘樓與花園的校園核心中庭",
    mapX: 465,
    mapY: 325,
    storyBackground:
      "七枚記憶碎片已經安靜地排列在你的探索檔案盒中，散發著暖金色的微光。現在，這封來自過去的信只剩下最後一道綜合檔案鎖——它考驗你能否把前七關看到的歷史、校徽、鐘塔精神與學生素養融會貫通。",
    safetyNotice: "本關可於中庭長椅或安靜安全處彙整前七關線索完成，保持安靜不影響他人。",
    puzzleType: "final-synthesis",
    promptText:
      "請調閱你前七關收集到的記憶線索，完成「復興檔案核心驗證表」的三組關鍵問題：",
    puzzlePayload: {
      questions: [
        {
          id: "q1",
          label: "驗證一｜創校年輪",
          prompt:
            "復興實中創辦於台灣光復隔年、民國＿＿年，從南陽街的「臺北市復興幼稚園」一路成長為十三年一貫的優質學府。",
          options: ["34", "35", "41", "57"],
        },
        {
          id: "q2",
          label: "驗證二｜校徽雙重意象",
          prompt:
            "現行校徽中，象徵「德、智、體、群、美五育並重與堅忍毅力」的是＿＿；火炬上方象徵和平的火焰形狀則是＿＿。",
          subParts: [
            { id: "flower", label: "五瓣花卉", options: ["蘭花", "梅花", "櫻花"] },
            { id: "bird", label: "和平火焰形狀", options: ["鴿子", "鳳凰", "海鷗"] },
          ],
        },
        {
          id: "q3",
          label: "驗證三｜復興精神與核心素養",
          prompt:
            "復興鐘塔代表校訓＿＿；而復興學生的四項學習核心素養則是「做上品人、學真知識、展多元才、＿＿」。",
          subParts: [
            { id: "motto", label: "四字校訓", options: ["穩準高遠", "誠正勤樸", "溫良恭儉"] },
            { id: "literacy", label: "第四項核心素養", options: ["行大我事", "立天下志", "成棟樑才"] },
          ],
        },
      ],
    },
    correctAnswer: {
      q1: "35",
      q2_flower: "梅花",
      q2_bird: "鴿子",
      q3_motto: "穩準高遠",
      q3_literacy: "行大我事",
    },
    hint1:
      "忘記細節沒關係！你可以直接展開畫面上方的「已收集線索檔案卡」，回顧 Mission 02、04、05 所得的年代與符號關鍵字。",
    hint2:
      "創校年份是民國35年；校徽花卉為五瓣梅花、和平火焰為鴿子；校訓為「穩準高遠」，第四項核心素養強調服務群體：「行大我事」。",
    explanation:
      "恭喜你串聯起八個維度的校園記憶！從民國35年創校至今，復興實中以「穩準高遠」為座右銘、以「做上品人、學真知識、展多元才、行大我事」培育每一位孩子，而你已取得最後一枚記憶碎片！",
    sourceTitle: "復興實中官網〈校史〉、〈校徽〉、〈復興精神〉、〈校長的話〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/181",
    fragmentName: "復興之光",
    fragmentPoem: "所有散落的片段此刻連成星圖，照見我們立足的校園。",
    fragmentSymbol: "star",
    clueSummary: "線索 08：八個故事匯成一句承諾——「做上品人、學真知識、展多元才、行大我事」。",
    defaultUnlocked: false,
  },
];

export const FINAL_PUZZLE_DATA = {
  title: "終章：時光的回信",
  subtitle: "集結八枚記憶碎片・啟動復興火炬之誓",
  storyPrompt:
    "八枚記憶碎片在你手中發亮，合成一枚完整的復興時光羅盤。信封最末頁顯現出一首被時光拆散的四句承諾——正是「復興火炬精神」的核心段落。請依照由「自己 → 同學 → 社會 → 世界」的關懷順序，將這段話重新排好，寄出給未來校園的回信！",
  openingLine: "我們是復興的小火炬，是世上的光：",
  closingLine: "我們是光明之子！ We are the light of the world.",
  shuffledLines: [
    { id: "l3", text: "把服務與奉獻給社會" },
    { id: "l1", text: "把責任與榮譽給自己" },
    { id: "l4", text: "把愛與關懷給世界" },
    { id: "l2", text: "把友誼與溫暖給同學" },
  ],
  correctOrder: ["l1", "l2", "l3", "l4"],
  hint: "試著感受關懷的同心圓：從對「自己」負起責任開始，接著溫暖身邊的「同學」，走入並奉獻給「社會」，最後把愛擴展到整個「世界」。",
  endingStory: [
    "當最後一句火炬誓言歸位，舊信封上的金色蠟印緩緩展開——原來寄出這封《時光的邀請》的，並不是某一位神祕的陌生人，而是所有曾經在這座紅磚校園裡奔跑、讀書、演奏、種下樹苗，並在離開時將回憶留給下一代的復興人。",
    "從民國三十五年南陽街的一盞微光，到今日敦化南路林蔭旁的鐘樓與紅磚校舍；無論你是剛踏入七年級的新鮮人，或是即將邁向下一段旅程的八、九年級學長姐，此刻你在校園裡走過的每一步、安靜觀察過的每一處綠意、記住的每一個名字，都已經成為復興故事全新的一頁。",
    "請帶著「個性沉穩、讀書精準、志氣崇高、目標宏遠」的校訓，以及屬於復興小火炬的溫暖與勇氣，繼續照亮屬於你的世界。",
  ],
  sourceUrl: "http://www.fhjh.tp.edu.tw/dispPageBox/mainCp2.aspx?ddsPageID=MAINABOUTA",
};
