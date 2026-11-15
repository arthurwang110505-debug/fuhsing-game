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
];

export const SEED_MISSIONS: SeedMission[] = [
  {
    id: 1,
    code: "M01",
    title: "檔案交叉驗證",
    subtitle: "把校史、校址與建築資料串成證據鏈",
    locationName: "序章・官方資料交叉驗證",
    locationNote: "文字推理關卡；不要求前往特定校內位置。",
    mapX: 399,
    mapY: 858,
    storyBackground:
      "第一封檔案沒有照片，只有數份互相交疊的校史與校園文字紀錄。年份同時使用民國與西元，建築段落則混合了方向、設計概念與地標。請交叉核對證據，分辨哪些結論真的能由來源推出，哪些只是看似合理的猜測。",
    safetyNotice: "本關只需閱讀文字資料；不必前往任何校內位置，也不可把示意地圖當作實際路線。",
    puzzleType: "evidence-grid",
    promptText:
      "完成四項獨立的來源交叉驗證。每題只有一個選項能同時符合官方資料；不要把推測當成來源已證實的事實。",
    puzzlePayload: {
      questions: [
        {
          id: "q1",
          label: "年份鏈",
          prompt: "哪一組民國／西元換算與事件配對完全一致？（注意：各組的換算式本身都可能正確，錯的是事件與年份的對應）",
          options: [
            { id: "q1a", text: "民國35年＝1946年創辦幼稚園；民國49年＝1960年遷至敦化南路現址" },
            { id: "q1b", text: "民國35年＝1946年創辦幼稚園；民國49年＝1959年遷至敦化南路現址" },
            { id: "q1c", text: "民國49年＝1960年創辦幼稚園；民國35年＝1946年遷至敦化南路現址" },
          ],
        },
        {
          id: "q2",
          label: "建築方位",
          prompt: "官方環境介紹對校園高低樓層配置的描述是哪一項？（三項句型一致，只有方位與詮釋的差別）",
          options: [
            { id: "q2a", text: "較高樓層配置在北側、較低樓層在南側，以引入採光與氣流" },
            { id: "q2b", text: "較高樓層配置在南側、較低樓層在北側，以引入採光與氣流" },
            { id: "q2c", text: "較高樓層配置在東側、較低樓層在西側，以引入採光與氣流" },
          ],
        },
        {
          id: "q3",
          label: "證據邊界",
          prompt: "只根據公開環境介紹，哪一項結論最嚴謹？（注意每項後半段是否超出資料能支持的範圍）",
          options: [
            { id: "q3a", text: "可證實鐘樓與「綠的延伸」的存在；但無法由此推得各任務點的精確座標" },
            { id: "q3b", text: "可證實鐘樓的存在；也能合理推定鐘樓前廣場全天開放供訪客集合" },
            { id: "q3c", text: "可證實「綠的延伸」；也能合理推定各教學樓的屋頂均為開放花園" },
          ],
        },
        {
          id: "q4",
          label: "校址判讀",
          prompt: "哪個摘要同時符合官方地理位置與環境介紹？（留意「起家的舊址」與「現址」是兩件事）",
          options: [
            { id: "q4a", text: "校址為臺北市大安區敦化南路一段262號；地理位置頁另提及鄰近林蔭大道" },
            { id: "q4b", text: "校址為臺北市大安區敦化南路一段262號；並可由此推得校地面積與操場精確座標" },
            { id: "q4c", text: "校址為臺北市大安區南陽街262號；該址自民國35年沿用至今未遷移" },
          ],
        },
      ],
    },
    correctAnswer: { q1: "q1a", q2: "q2a", q3: "q3a", q4: "q4a" },
    hint1:
      "先分清楚「創辦」、「增辦學制」與「遷校」是不同事件；民國年換算西元時，請使用同一套換算方式。",
    hint2:
      "遇到校園位置問題，分別核對地理位置頁與環境頁；若來源沒有列出座標、開放規則或樓頂用途，就不能自行補成已證實事實。",
    explanation:
      "交叉驗證的關鍵不只在記住資料，也在辨認證據的界線：官方校史記載民國35年（1946）創辦幼稚園、民國49年（1960）遷至敦化南路現址；環境介紹提及北高南低的樓層配置、鐘樓與「綠的延伸」；地理位置頁列出大安區敦化南路一段262號。這些文字不等同於精確路線、開放許可或地圖座標。",
    sourceTitle: "復興實中官網〈優質環境〉與〈地理位置〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
    fragmentName: "紅磚晨光",
    fragmentPoem: "林蔭掩映紅磚牆，故事從跨入校門的這一步悄悄甦醒。",
    fragmentSymbol: "compass",
    clueSummary: "線索 01：校園位於敦化南路一段262號；官方環境介紹提及紅磚校舍與鐘樓。",
    defaultUnlocked: true,
  },
  {
    id: 2,
    code: "M02",
    title: "鐘樓的故事",
    subtitle: "晨鐘暮鼓中的四字箴言",
    locationName: "左側鐘樓（鐘塔）前廣場",
    locationNote: "示意定位：校園左側紅磚鐘塔地標區",
    mapX: 85,
    mapY: 740,
    storyBackground:
      "仰望左側的紅磚鐘樓，那座在城市喧囂中依然守候校園節奏的建築，靜靜述說著「晨鐘暮鼓」的儀式感。信封夾頁裡藏著一張黃銅字盤，記錄著復興鐘塔所代表的四字校訓，等待你透過字義線索推敲出來。",
    safetyNotice: "請於廣場開闊處抬頭觀察鐘塔造型，切勿攀爬花台或追逐推擠。",
    puzzleType: "logic-choice",
    promptText:
      "以語意而非填空慣用詞推理四個校訓字。每個選項各用一次，從情境判斷哪個字最精確對應該句所描述的能力：",
    puzzlePayload: {
      slots: [
        {
          id: "s1",
          prefix: "比賽最後關頭全場鼓噪，隊長仍按原節奏完成關鍵部署，不受情緒牽動",
          choices: ["穩", "定", "安"],
          desc: "哪個字最能表達「在動盪中維持可靠」？注意三個字的語意重心並不相同。",
        },
        {
          id: "s2",
          prefix: "實驗報告的結論反覆核對來源與數據、通過驗證後才寫下",
          choices: ["準", "細", "勤"],
          desc: "哪個字最能表達「結果經得起檢驗」？",
        },
        {
          id: "s3",
          prefix: "即使現實資源有限，對志向與品格的自我要求也不降級",
          choices: ["高", "大", "宏"],
          desc: "哪個字最能表達「志向與品格的高度」？",
        },
        {
          id: "s4",
          prefix: "規畫學習藍圖時，把眼光放到十年後的自己，把根基留在當下",
          choices: ["遠", "廣", "深"],
          desc: "哪個字最能表達「跨越時間的視野」？",
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
      "不要只靠熟悉的成語猜字；先把四句描述分成情緒穩定、求知方法、志向高度、目標跨度四種語意。",
    hint2:
      "每個字只使用一次。比較「安定／安靜」、「準確／細緻」、「崇高／宏大」、「深遠／遼遠」各自表達的重點，再回看官方校訓。",
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
    mapX: 399,
    mapY: 122,
    storyBackground:
      "在寸土寸金的臺北東區，復興校園走出傳統單調的校舍配置：建築師把較高的樓層擺在北邊、較低的樓層擺在南邊，讓陽光與微風穿過高低錯落的連結步道與天橋。而每一棟樓舍與專門空間，也都有屬於自己的名字與使命。",
    safetyNotice: "探索時請勿進入正在上課的教室，並保持走廊與樓梯間輕聲細語、不奔跑。",
    puzzleType: "map-matching",
    promptText:
      "六組文字線索採一對一配對。三個相近的樓名各對應不同品格期許；不要把「特色館舍」、「歷史典藏」與「圖書分類」混為一談。",
    puzzlePayload: {
      leftItems: [
        { id: "b1", label: "成賢樓" },
        { id: "b2", label: "勤學樓" },
        { id: "b3", label: "慎思樓" },
        { id: "b4", label: "國學館" },
        { id: "b5", label: "校史館" },
        { id: "b6", label: "中學圖書館" },
      ],
      rightItems: [
        { id: "d1", text: "名稱指向學習的終點：成為怎樣的人，而不是學到多少技能" },
        { id: "d2", text: "名稱強調把心力持續投入學習過程的態度" },
        { id: "d3", text: "名稱提醒行動前後的思辨紀律：想清楚再做、做完回頭再想" },
        { id: "d4", text: "以中華文化經典閱讀與人文素養涵養為核心的專題館舍" },
        { id: "d5", text: "收藏學校發展歷程與文物，讓記憶得以被查證的空間" },
        { id: "d6", text: "閱讀與借閱服務的場所；館藏依一套官方分類法編目" },
      ],
    },
    correctAnswer: {
      b1: "d1", b2: "d2", b3: "d3", b4: "d4", b5: "d5", b6: "d6",
    },
    hint1:
      "先把六個名稱拆成三棟主要教學樓、兩個專門館舍與一個閱讀空間，再檢查每個描述中最具辨識度的詞。",
    hint2:
      "三棟樓名各自指向不同的學習品格；兩個「館」的任務領域不同；圖書館題還要留意它的編目制度。",
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
    mapX: 576,
    mapY: 492,
    storyBackground:
      "檔案盒中附有一座黃銅齒輪鎖，紀錄著復興如何從一所幼稚園一步步成長為包含幼兒園、小學、國中、高中與雙語部的實驗學府。無論校史館今天是否開放，你都能透過這份經過驗證的官方校史檔案，重組學校的誕生脈絡。",
    safetyNotice: "若校史館未開放，請直接使用畫面中的「數位校史檔案替代室」完成任務，切勿推門或打擾館務人員。",
    puzzleType: "timeline-sort",
    promptText:
      "把八個校史事件由最早排至最晚。卡片不標年份；請先展開檔案核對民國年與事件，不要只按教育階段名稱猜順序。",
    puzzlePayload: {
      items: [
        { id: "h6", eraTag: "識別標誌", label: "歷經全校票選、行政會議與董事會程序後，識別標誌改版定案" },
        { id: "h3", eraTag: "校址遷移", label: "因校舍不敷使用，遷入今日所在的敦化南路一段新校址" },
        { id: "h8", eraTag: "雙語擴展", label: "雙語教育進一步涵蓋高中階段" },
        { id: "h1", eraTag: "創校起點", label: "以「培育民族幼苗」為宗旨的第一個學段起步" },
        { id: "h5", eraTag: "高中階段", label: "成立實驗高中，邁向十二年一貫（含幼兒園十三年）學制" },
        { id: "h4", eraTag: "中學階段", label: "學制擴及中等教育階段，形成幼、小、中三階段體系" },
        { id: "h7", eraTag: "雙語擴展", label: "雙語教育首次納入國中階段" },
        { id: "h2", eraTag: "小學階段", label: "在既有基礎上增辦的第二個學段，設有首任校長" },
      ],
      museumFallbackArchive: [
        { period: "1946／民國35年", heading: "創辦復興幼稚園", detail: "於南陽街起步，由婦女界先進捐資興學。這是學校發展的起點。" },
        { period: "民國41年（1952）", heading: "增辦復興小學", detail: "復興幼稚園深獲好評後增辦小學，方志平女士任首任校長。" },
        { period: "1960／民國49年", heading: "遷至敦化南路現址", detail: "因校舍不敷使用，學校遷至敦化南路一段現址。" },
        { period: "民國57年（1968）", heading: "增設復興中學", detail: "配合九年國民教育政策增設中學部。" },
        { period: "民國82年（1993）", heading: "修訂現行校徽", detail: "現行校徽經全校師生票選、行政會議討論與董事會決議修訂，於本年定案（前一年完成草案）。" },
        { period: "2006／民國95年", heading: "成立實驗高中", detail: "建立十二年一貫學制；加計幼兒園為十三年一貫。" },
        { period: "民國97年（2008）", heading: "成立國中雙語部", detail: "國中階段加入雙語教育。" },
        { period: "民國99年（2010）", heading: "成立高中雙語部", detail: "高中階段加入雙語教育。" },
      ],
    },
    correctAnswer: ["h1", "h2", "h3", "h4", "h6", "h5", "h7", "h8"],
    hint1:
      "先從校史檔案找出每件事的民國年份；同一張卡片可能把學制變化寫得很像，但年份才是排序依據。",
    hint2:
      "民國年與西元年只差固定常數。注意校徽修訂發生在中學增設之後、實驗高中成立之前；最後兩張卡都屬於雙語部發展，但不是同一年。",
    explanation:
      "正確時間鏈為：民國35年創辦幼稚園、41年增辦小學、49年遷至敦化南路現址、57年增設中學、82年修訂現行校徽、95年成立實驗高中、97年成立國中雙語部、99年成立高中雙語部。",
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
    subtitle: "從文字證據拆解六層象徵",
    locationName: "校徽檔案・文字推理",
    locationNote: "不需查看圖片或前往旗桿區；依據校方文字說明作答。",
    mapX: 83,
    mapY: 566,
    storyBackground:
      "檔案室收到六張被拆散的校徽文字註解卡。有人把圖形構件、構件數量和象徵寓意混成一團；請只依據校方的文字紀錄，重新建立六條精確的對應關係。",
    safetyNotice: "本關為純文字配對，不需觸碰校旗、旗繩或任何校園設施。",
    puzzleType: "map-matching",
    promptText:
      "以下是校徽官方文字紀錄拆成的六張證據卡；不需要看圖，請把構件或特徵與最精確的象徵說明一對一配對。",
    puzzlePayload: {
      leftItems: [
        { id: "em1", label: "三角形" },
        { id: "em2", label: "梅花" },
        { id: "em3", label: "五片花瓣" },
        { id: "em4", label: "火炬" },
        { id: "em5", label: "鴿形火焰" },
        { id: "em6", label: "外圍圓形" },
      ],
      rightItems: [
        { id: "meaning1", text: "以向上收斂的輪廓，寄託對「人」向上向善的期許" },
        { id: "meaning2", text: "以嚴冬中綻放的花卉，象徵堅忍毅力" },
        { id: "meaning3", text: "花瓣的數目，對應一組並重的教育面向" },
        { id: "meaning4", text: "勉勵學生成為照亮他人的存在" },
        { id: "meaning5", text: "以一種和平鳥的意象，呈現火焰的動勢" },
        { id: "meaning6", text: "以完整閉合的外廓，寓意做人處事的分際與圓滿" },
      ],
    },
    correctAnswer: {
      em1: "meaning1", em2: "meaning2", em3: "meaning3",
      em4: "meaning4", em5: "meaning5", em6: "meaning6",
    },
    hint1:
      "先區分構件與構件特徵：梅花與花瓣數目是兩張不同的卡；火炬本體與火焰造型也不是同一層意思。",
    hint2:
      "六個意涵分別涉及人格發展、品格、五育、學生使命、和平與規矩／圓滿。每項只能配一次。",
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
    mapX: 455,
    mapY: 322,
    storyBackground:
      "踏出繁忙擁擠的臺北東區馬路，校園裡卻保有讓人沉靜呼吸的青翠中庭與小花園。建築設計師用「綠的延伸」概念把林蔭帶進校園，老師與同學也在這裡建立起生態循環的小天地。",
    safetyNotice: "觀察植物與魚菜共生區時請保持安全距離，切勿伸手撈水、觸碰設備或摘折枝葉。",
    puzzleType: "eco-matching",
    promptText:
      "先完成五組環境概念配對，再處理一個同時涉及安全、觀察與生態保護的情境判斷。配對時注意「設計理念」、「實體空間」、「循環系統」、「棲地營造」與「行為守則」是不同層次。",
    puzzlePayload: {
      items: [
        { id: "e1", title: "「綠的延伸」設計理念" },
        { id: "e2", title: "小花園" },
        { id: "e3", title: "魚菜共生" },
        { id: "e4", title: "生態多樣性與棲地" },
        { id: "e5", title: "多層次空間使用" },
      ],
      targets: [
        { id: "t1", text: "以設計概念把都會校園連回自然，讓綠意沿著空間不斷延伸" },
        { id: "t2", text: "校園中可近距離觀察植栽的開放綠地" },
        { id: "t3", text: "把水循環與動植物養殖結合的循環農法示範" },
        { id: "t4", text: "讓綠化同時支持昆蟲與鳥類棲息，形成可觀察的微型生態系" },
        { id: "t5", text: "在有限校地上立體化配置場館，提升空間使用效能" },
      ],
      safetyQuestion: {
        prompt: "同學要完成一份不採集樣本的生態觀察紀錄；途中發現不認識的植物，旁邊也有魚菜共生設備。哪個方案同時符合安全與生態倫理？",
        options: [
          { id: "safe-1", text: "留在開放步道以文字與素描記錄特徵；不採集、不觸碰設備，也不跨越花圃邊界" },
          { id: "safe-2", text: "只摘取一片葉子帶回比對種類；設備不動就不算干擾" },
          { id: "safe-3", text: "請同學踩進花圃幫忙採集樣本，自己留在步道上拍照紀錄" },
          { id: "safe-4", text: "不碰植物，但可自行打開魚菜共生的水循環蓋觀察流向" },
        ],
      },
    },
    correctAnswer: {
      pairs: { e1: "t1", e2: "t2", e3: "t3", e4: "t4", e5: "t5" },
      safety: "safe-1",
    },
    hint1:
      "五張卡分別談設計理念、實體場域、循環農法、棲地營造和空間策略；配對時別把「理念」誤當成某一個單獨花園。",
    hint2:
      "情境題同時檢查是否採集、委由他人代採、跨越界線或操作設備。只有安全位置上的非接觸觀察，才符合題目要求。",
    explanation:
      "復興實中以「綠的延伸」為建築發想，結合校園小花園與魚菜共生系統，將環境教育融入日常；並從生態多樣性的角度理解校園綠化——尊重生物棲地、保持觀察距離，不任意採摘或干擾，讓綠意成為可長期觀察的微型生態系。",
    sourceTitle: "復興實中官網〈優質環境〉",
    sourceUrl: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
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
    mapX: 576,
    mapY: 822,
    storyBackground:
      "每天鐘聲準時響起、社團充滿歡笑、教室設備穩定運作、同學遇到困惑也有人傾聽——這些日常背後，是一群默默守望的行政處室團隊。現在有八份情境紀錄需要歸檔；請根據每項主要待辦找出正確的求助窗口，不必前往任何辦公室。",
    safetyNotice: "本關卡完全透過情境資料作答，請勿進入行政辦公室、亦勿打擾正在辦公的教職員與師長。",
    puzzleType: "office-matching",
    promptText:
      "八個情境分別對應四個行政處室（每個處室恰有兩題）。每句都藏著兩條線索：先依「當務之急／主要待辦」鎖定真正要辦的事，再排除指向其他處室的干擾資訊。",
    puzzlePayload: {
      scenarios: [
        { id: "sc1", student: "檔案 A", situation: "想了解場地借用的收費方式；但當務之急是補發遺失的數位學生證。" },
        { id: "sc2", student: "檔案 B", situation: "想一併了解防災演練的應變規範；但主要待辦是申請一份正式成績單。" },
        { id: "sc3", student: "檔案 C", situation: "想借用場地辦社團成果展；但主要待辦是完成聯課社團的報名。" },
        { id: "sc4", student: "檔案 D", situation: "想了解正式成績單的申請方式；但主要待辦是把拾獲的遺失物送交窗口。" },
        { id: "sc5", student: "檔案 E", situation: "想詢問轉學學分的採認規定；但主要待辦是報修故障的教室照明。" },
        { id: "sc6", student: "檔案 F", situation: "想了解聯課社團的掛牌規定；但主要待辦是借用講座場地與相關設備。" },
        { id: "sc7", student: "檔案 G", situation: "想了解獎學金申請的成績條件；但主要待辦是諮詢多元入學途徑與生涯方向。" },
        { id: "sc8", student: "檔案 H", situation: "手上還有報修單要送交；但主要待辦是為情緒困擾的同學尋求心理支持。" },
      ],
      offices: [
        { id: "academic", label: "教務處", note: "課程、教學、成績與學籍相關業務" },
        { id: "student", label: "學務處", note: "訓育社團、生活輔導、防災與衛生相關業務" },
        { id: "general", label: "總務處", note: "校舍設備維護、營繕、場地與採購相關業務" },
        { id: "counseling", label: "輔導室", note: "心理支持、特殊教育資源與生涯探索相關業務" },
      ],
    },
    correctAnswer: {
      sc1: "academic", sc2: "academic",
      sc3: "student", sc4: "student",
      sc5: "general", sc6: "general",
      sc7: "counseling", sc8: "counseling",
    },
    hint1:
      "先為每個情境圈出「主要待辦」指向的唯一動詞：補發、成績單、報名、遺失物、報修、借場地、諮詢、心理支持。不要被另一句干擾事項帶偏。",
    hint2:
      "四個單位的職掌可分成學業學籍、學生生活安全、校舍資源、個人支持與生涯；每一類在本題各有兩個案例，且干擾線索刻意指向別類。",
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
    locationName: "總結檔案・安靜安全處",
    locationNote: "可在安全處整理線索；地圖節點不代表實際集合位置。",
    mapX: 300,
    mapY: 730,
    storyBackground:
      "七枚記憶碎片已經安靜地排列在你的探索檔案盒中，散發著暖金色的微光。現在，這封來自過去的信只剩下最後一道綜合檔案鎖——它考驗你能否把前七關看到的歷史、校徽、鐘塔精神與學生素養融會貫通。",
    safetyNotice: "本關可於中庭長椅或安靜安全處彙整前七關線索完成，保持安靜不影響他人。",
    puzzleType: "final-synthesis",
    promptText:
      "調用前七關的線索完成五個交叉驗證區，共九個答案欄。每區至少有一題需要辨析相近概念；全部答對才會解鎖最後碎片。",
    puzzlePayload: {
      questions: [
        {
          id: "q1",
          label: "驗證一｜創校年份",
          prompt: "創辦復興幼稚園的年份是民國＿＿年。",
          options: ["34", "35", "36", "41"],
        },
        {
          id: "q2",
          label: "驗證二｜校徽構件與象徵",
          prompt: "分別核對花卉、火焰造型與外圓所代表的意涵。",
          subParts: [
            { id: "flower", label: "象徵堅忍毅力的花卉", options: ["蘭花", "梅花", "櫻花"] },
            { id: "bird", label: "火炬火焰採用的和平鳥形", options: ["鴿子", "鳳凰", "海鷗"] },
            { id: "circle", label: "外圍圓形額外提醒的規範", options: ["不以規矩，不成方圓", "凡事只求速度", "以個人勝過群體"] },
          ],
        },
        {
          id: "q3",
          label: "驗證三｜校訓與素養",
          prompt: "校訓與四項核心素養是兩套不同表述，請勿把兩者混成同一句。",
          subParts: [
            { id: "motto", label: "鐘塔所代表的四字校訓", options: ["穩準高遠", "誠正勤樸", "溫良恭儉"] },
            { id: "literacy", label: "「展多元才」之後的核心素養", options: ["行大我事", "立天下志", "成棟樑才"] },
          ],
        },
        {
          id: "q4",
          label: "驗證四｜校址時間",
          prompt: "學校遷至敦化南路現址的年份是民國＿＿年，而不是創校或增設中學的年份。",
          options: ["41", "49", "57", "95"],
        },
        {
          id: "q5",
          label: "驗證五｜空間設計",
          prompt: "根據校園環境介紹，確認樓層配置與建築設計理念。",
          subParts: [
            { id: "orientation", label: "較高樓層／較低樓層的方向", options: ["北高南低", "南高北低", "東高西低"] },
            { id: "design", label: "引入自然綠意的設計概念", options: ["綠的延伸", "綠色方舟", "森林教室"] },
          ],
        },
      ],
    },
    correctAnswer: {
      q1: "35",
      q2_flower: "梅花", q2_bird: "鴿子", q2_circle: "不以規矩，不成方圓",
      q3_motto: "穩準高遠", q3_literacy: "行大我事",
      q4: "49",
      q5_orientation: "北高南低", q5_design: "綠的延伸",
    },
    hint1:
      "先把前面各關的線索按主題整理：校史年份、校徽構件、校訓／核心素養、建築方位與設計概念。",
    hint2:
      "注意題目刻意區分「創校」與「遷址」、「圖形構件」與「象徵意義」、「校訓」與「核心素養」。回看相應關卡來源，不要只靠記憶中的相似詞。",
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
    "八枚記憶碎片在你手中發亮，合成一枚完整的復興時光羅盤。信封最末頁的四句承諾被拆成八個片語。請先重組完整語句，再從各句承擔的責任與關懷範圍推導先後，不要只按名詞猜答案。",
  openingLine: "我們是復興的小火炬，是世上的光：",
  closingLine: "我們是光明之子！ We are the light of the world.",
  shuffledLines: [
    { id: "l3b", text: "與奉獻給社會" },
    { id: "l1a", text: "把責任" },
    { id: "l4b", text: "與關懷給世界" },
    { id: "l2a", text: "把友誼" },
    { id: "l3a", text: "把服務" },
    { id: "l1b", text: "與榮譽給自己" },
    { id: "l4a", text: "把愛" },
    { id: "l2b", text: "與溫暖給同學" },
  ],
  correctOrder: ["l1a", "l1b", "l2a", "l2b", "l3a", "l3b", "l4a", "l4b"],
  hint: "比較四句的責任對象與影響範圍：哪一項最直接由個人承擔？哪一項需要走出熟悉群體，影響範圍最廣？",
  endingStory: [
    "當最後一句火炬誓言歸位，舊信封上的金色蠟印緩緩展開——原來寄出這封《時光的邀請》的，並不是某一位神祕的陌生人，而是所有曾經在這座紅磚校園裡奔跑、讀書、演奏、種下樹苗，並在離開時將回憶留給下一代的復興人。",
    "從民國三十五年南陽街的一盞微光，到今日敦化南路林蔭旁的鐘樓與紅磚校舍；無論你是剛踏入七年級的新鮮人，或是即將邁向下一段旅程的八、九年級學長姐，此刻你在校園裡走過的每一步、安靜觀察過的每一處綠意、記住的每一個名字，都已經成為復興故事全新的一頁。",
    "請帶著「個性沉穩、讀書精準、志氣崇高、目標宏遠」的校訓，以及屬於復興小火炬的溫暖與勇氣，繼續照亮屬於你的世界。",
  ],
  sourceUrl: "http://www.fhjh.tp.edu.tw/dispPageBox/mainCp2.aspx?ddsPageID=MAINABOUTA",
};
