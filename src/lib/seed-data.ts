import type { PrintableResource, PuzzleType } from "@/types/game";

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
  hint3: string;
  explanation: string;
  materialTitle: string;
  materialUrl: string;
  fragmentName: string;
  fragmentPoem: string;
  fragmentSymbol: string;
  clueSummary: string;
  defaultUnlocked: boolean;
}

export const PRINTABLE_RESOURCES: PrintableResource[] = [
  {
    id: "student-handbook",
    title: "復興探索手冊・學生版",
    category: "列印素材",
    href: "/printables/復興探索手冊_學生版.pdf",
    format: "PDF",
    note: "A5 直式線索卡手冊：八張線索卡（題目資料只印在這裡）、作答欄、現場觀察欄、碎片收集頁與終章排列題。活動前影印，每組一本。",
  },
  {
    id: "teacher-key",
    title: "復興探索手冊・教師解答本",
    category: "教師用",
    href: "/printables/復興探索手冊_教師解答本.pdf",
    format: "PDF",
    note: "逐關解答、三階提示、評分建議與安全事項。請勿在活動前發給學生。",
  },
  {
    id: "campus-map",
    title: "校園示意圖（300dpi 印刷地圖）",
    category: "列印素材",
    href: "/printables/campus-map.png",
    format: "PNG",
    note: "含任務編號針腳的印刷地圖，可列印或投影；為示意圖，非精確平面圖。",
  },
];
/**
 * 困難模式題庫。
 *
 * 設計原則（詳見 HARD_MODE_DESIGN.md）：
 * 1. 每關都有一條可追溯的推理鏈，答案不能只靠關鍵字或記憶。
 * 2. 每關三階提示，提示 3 也只點出關鍵關係，不直接給完整答案。
 * 3. 未經官方資料支持的開放時間、精確座標、實際設備管線一律不寫成事實。
 */
export const SEED_MISSIONS: SeedMission[] = [
  {
    id: 1,
    code: "M01",
    title: "不在場的證詞",
    subtitle: "三欄證據審查：可證實、矛盾、未載",
    locationName: "序章・匿名證詞檔案桌",
    locationNote: "文字推理關卡；不要求前往特定校內位置（示意位置：校門內側花圃旁）。",
    mapX: 300,
    mapY: 862,
    storyBackground:
      "檔案室收到七張匿名摘錄，每張都像校史，卻不保證都與官方來源相符。有人把「來源沒有說」誤當成「來源說它錯」，也有人把創辦與遷址混成同一件事。請把每張卡放進正確的證據欄，再用卡片背面的校驗字打開檔案鎖。",
    safetyNotice: "本關只需閱讀文字資料；不必前往任何校內位置，也不可把示意地圖當作實際路線。",
    puzzleType: "evidence-classify",
    promptText:
      "把七張證詞卡分到「可證實／與來源矛盾／資料未載」三個證據欄，每一欄至少一張；完成後讀取卡背的校驗字輸入檔案鎖。",
    puzzlePayload: {
      columns: [
        { id: "confirmed", label: "可證實", note: "官方頁面可逐字核對到" },
        { id: "contradicted", label: "與來源矛盾", note: "來源寫的是另一件事" },
        { id: "unrecorded", label: "資料未載", note: "來源根本沒提；未載不等於錯誤" },
      ],
      cards: [
        { id: "k1", order: 1, text: "學校於民國 35 年（1946）創辦幼稚園。", sourceKey: "校史沿革", token: "時" },
        { id: "k2", order: 2, text: "學校於民國 49 年（1960）遷至敦化南路現址。", sourceKey: "校史沿革", token: "光" },
        { id: "k3", order: 3, text: "學校現址為臺北市大安區敦化南路一段 262 號。", sourceKey: "地理位置", token: "的" },
        { id: "k4", order: 4, text: "官方環境介紹提及鐘樓與「綠的延伸」。", sourceKey: "優質環境", token: "邀" },
        {
          id: "k5",
          order: 5,
          text: "官方網站明載鐘樓前廣場每日 07:00–22:00 對外開放。",
          sourceKey: "查無此記載",
          token: "",
        },
        { id: "k6", order: 6, text: "官方環境介紹提及校舍採北高南低的配置。", sourceKey: "優質環境", token: "請" },
        { id: "k7", order: 7, text: "學校於民國 35 年（1946）創辦小學部。", sourceKey: "校史沿革", token: "" },
      ],
      sources: [
        {
          title: "校史沿革",
          url: "https://www.fhjh.tp.edu.tw/about-fuhsing/189",
          excerpt:
            "民國 35 年（1946）創辦復興幼稚園；民國 41 年（1952）增辦小學；民國 49 年（1960）遷至敦化南路現址；民國 57 年（1968）增設中學。",
        },
        {
          title: "地理位置",
          url: "http://www.fhjh.tp.edu.tw/dispPageBox/mainCp.aspx?ddsPageID=MAINABOUTI",
          excerpt: "校址為臺北市大安區敦化南路一段 262 號，鄰近林蔭大道與文教環境。",
        },
        {
          title: "優質環境",
          url: "https://www.fhjh.tp.edu.tw/about-fuhsing/911",
          excerpt:
            "校舍採北高南低的樓層配置以引入採光與氣流，並以「綠的延伸」串連鐘樓與小花園等空間。",
        },
      ],
      lockLabel: "檔案鎖（可證實卡片依卡號順序的校驗字；未載與矛盾卡不取字）",
      reasonPrompt: "用一句話說明「資料未載」和「與來源矛盾」的差別（不計分，供教師檢核）。",
    },
    correctAnswer: {
      placement: {
        k1: "confirmed",
        k2: "confirmed",
        k3: "confirmed",
        k4: "confirmed",
        k5: "unrecorded",
        k6: "confirmed",
        k7: "contradicted",
      },
      lock: "時光的邀請",
    },
    hint1:
      "先把「有明確官方頁面可逐字核對」的卡片圈起來，不要急著判斷剩下的卡片。",
    hint2:
      "有一張卡把「創辦幼稚園」與「創辦小學」寫成同一年；另一張卡的問題不是時段寫錯，而是來源根本沒有提供開放時段。",
    hint3:
      "逐一對照校史、地理位置、優質環境三個來源；只有一張卡該放進「資料未載」，也只有一張卡與校史記載的事件年份衝突。",
    explanation:
      "可證實的是校史記載的 1946 創辦幼稚園、1960 遷至敦化南路現址、民國 57 年增設中學，以及敦化南路一段 262 號的校址、鐘樓與「綠的延伸」、北高南低的配置。鐘樓廣場的每日開放時段沒有任何官方頁面記載，屬於「資料未載」；而「民國 35 年創辦小學部」與校史衝突——1946 年創辦的是幼稚園，小學部於 1952 年才增辦。關鍵就在於：沒有證據不等於證據證明它錯。",
    materialTitle: "學生手冊 M01・不在場的證詞",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "紅磚晨光",
    fragmentPoem: "林蔭掩映紅磚牆，故事從跨入校門的這一步悄悄甦醒。",
    fragmentSymbol: "compass",
    clueSummary: "線索 01：1946 創辦幼稚園、1960 遷至敦化南路一段 262 號現址；未載與矛盾是兩種不同的證據狀態。",
    defaultUnlocked: true,
  },
  {
    id: 2,
    code: "M02",
    title: "鐘樓的四行密令",
    subtitle: "語意選詩，讀出四字校訓",
    locationName: "左側鐘樓（鐘塔）前廣場（或數位圖文替代）",
    locationNote: "示意定位：校園左側紅磚鐘塔地標區",
    mapX: 85,
    mapY: 740,
    storyBackground:
      "黃銅字盤上留著四段殘詩與四段抄錄者自行加上的句子。每一組只有一行真正符合題目給的語意條件；先選對詩行，再依「情緒、方法、志向、時間視野」排列，讀出每行第一個字。",
    safetyNotice: "請於廣場開闊處抬頭觀察鐘塔造型，切勿攀爬花台或追逐推擠。",
    puzzleType: "acrostic-select",
    promptText:
      "四個語意槽位各只能放入一行詩。注意每一組都有一行看似正面，實際上把概念偷換成「停止思考、盲目抄寫、只會宣告、只看眼前」。",
    puzzlePayload: {
      slots: [
        { id: "tone", label: "情緒", requirement: "外界紛亂時仍能保持沉著，不是毫無感覺。" },
        { id: "method", label: "方法", requirement: "結論必須可被核對，不是只求速度。" },
        { id: "ambition", label: "志向", requirement: "對人格與理想的要求有高度，不是權力或地位。" },
        { id: "horizon", label: "時間視野", requirement: "眼光跨越眼前，不是單純距離遙遠。" },
      ],
      lines: [
        { id: "A", lead: "穩", text: "住心念，風聲再急也不改判斷。" },
        { id: "E", lead: "高", text: "舉理想，仍願意從眼前小事做起。" },
        { id: "B", lead: "安", text: "於現狀，從此不再追問。" },
        { id: "G", lead: "遠", text: "望未來，也記得從今天踏出第一步。" },
        { id: "D", lead: "勤", text: "於抄寫，不必理解每個字的意思。" },
        { id: "C", lead: "準", text: "確核對每項證據，讓結論經得起覆驗。" },
        { id: "H", lead: "深", text: "入資料，卻只關心眼前的分數。" },
        { id: "F", lead: "大", text: "聲宣告，便能證明志向遠大。" },
      ],
    },
    correctAnswer: { tone: "A", method: "C", ambition: "E", horizon: "G" },
    hint1:
      "四個類別不是詩句原本的排列順序；先標記每一行在描述哪一種能力，再回到槽位。",
    hint2:
      "每一組都有一行看似正面，實際上把概念偷換成「停止思考、盲目抄寫、只會宣告、只看眼前」。",
    hint3:
      "正確行的首字依序是「穩、準、高、遠」；對照官方校訓頁確認這四個字的意思。",
    explanation:
      "正確組合為 A（穩住心念）、C（準確核對）、E（高舉理想）、G（遠望未來），首字讀為校訓「穩準高遠」。B 停止追問、D 盲目抄寫、F 只靠宣告、H 只看眼前，都是把正面詞彙偷換成反面的行為。官方校訓頁面記載的鐘塔精神是「個性沉穩、讀書精準、志氣崇高、目標宏遠」。",
    materialTitle: "學生手冊 M02・鐘樓的四行密令",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "鐘聲餘韻",
    fragmentPoem: "鐘聲不催促步伐，而是提醒每顆心穩準高遠地前行。",
    fragmentSymbol: "bell",
    clueSummary: "線索 02：鐘塔精神凝為校訓「穩、準、高、遠」，每一字都對應一種可實踐的態度。",
    defaultUnlocked: true,
  },
  {
    id: 3,
    code: "M03",
    title: "六座空間的身分危機",
    subtitle: "6×6 邏輯矩陣：推導唯一配對",
    locationName: "校舍建築群戶外連結步道",
    locationNote: "示意定位：主要教學樓群與特色館舍意象區",
    mapX: 399,
    mapY: 122,
    storyBackground:
      "六個校園空間的名稱與六張任務卡被打散在檔案桌上。三棟「樓」與三個館舍分屬不同任務層次；請用五條線索逐步排除，推出唯一配對，不要只看名稱的字面熟悉度。",
    safetyNotice: "探索時請勿進入正在上課的教室，並保持走廊與樓梯間輕聲細語、不奔跑。",
    puzzleType: "logic-grid",
    promptText:
      "先在 6×6 矩陣標記「可能／排除」整理線索，再於下方完成六組配對。系統不會自動幫你填答案，也不會即時告訴你哪一格對錯。",
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
        { id: "r1", text: "任務 B：以閱讀、借閱與館藏編目支援學習。" },
        { id: "r2", text: "任務 A：保存學校發展歷程與文物。" },
        { id: "r3", text: "任務 F：名稱強調判斷前後的反思與思辨。" },
        { id: "r4", text: "任務 D：名稱強調學習成果所指向的人格期許。" },
        { id: "r5", text: "任務 C：以中華文化經典與人文素養為核心。" },
        { id: "r6", text: "任務 E：名稱強調持續投入學習的態度。" },
      ],
      clues: [
        "線索 1：三個「樓」都不是館藏空間；三個「館／圖書館」都不是主要教學樓。",
        "線索 2：保存校史文物的空間不是圖書館；兩者都可能保存資料，但任務不同。",
        "線索 3：以經典與人文素養為核心的空間不是校史館，也不是中學圖書館。",
        "線索 4：三個教學樓名稱中，「慎思」對應反思判斷，「勤學」對應學習過程，剩下的一個對應人格成果。",
        "線索 5：圖書館採用中文圖書分類法編目。",
      ],
    },
    correctAnswer: {
      b1: "r4",
      b2: "r6",
      b3: "r3",
      b4: "r5",
      b5: "r2",
      b6: "r1",
    },
    hint1: "先把名稱分成「樓」與「館舍／圖書館」兩組，先不要看任務卡。",
    hint2: "三個樓名可以由「成果、過程、思考方法」三個語意層次拆開。",
    hint3: "「校史」對應歷史文物，「國學」對應經典人文，「圖書館」對應閱讀借閱與分類編目。",
    explanation:
      "線索 1 把六個名稱切成兩個三元素集合；線索 4 解出三棟教學樓（成賢＝人格成果、勤學＝學習過程、慎思＝反思思辨）；線索 2、3、5 再把三個館舍唯一定位（校史館＝文物、國學館＝經典人文、中學圖書館＝閱讀借閱與中文圖書分類法編目）。判斷依據是主要功能，不是「都有書」這種表面相似。",
    materialTitle: "學生手冊 M03・六座空間的身分危機",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "紅瓦之名",
    fragmentPoem: "成賢、勤學而慎思，每一棟紅瓦灰牆都承載著期許。",
    fragmentSymbol: "building",
    clueSummary: "線索 03：校舍採北高南低採光設計，教學樓與館舍各有明確任務分工。",
    defaultUnlocked: true,
  },
  {
    id: 4,
    code: "M04",
    title: "被竄改的時間軸",
    subtitle: "民國／西元換算與區間約束",
    locationName: "校史館外廊（休館時以手冊線索卡 M04 替代）",
    locationNote: "示意定位：校史紀念與時間典藏展示區",
    mapX: 576,
    mapY: 492,
    storyBackground:
      "檔案盒裡的八張事件卡，日期欄都被刮除了，只留下部分檔案標記。有人把「創辦」寫成「遷址」，也有人把「增設中學」和「成立實驗高中」當成同一件事。請用民國年換算規則推理，把年份補回並依時間排序。",
    safetyNotice: "若校史館未開放，請直接使用手冊線索卡 M04 的校史檔案摘錄完成任務，切勿推門或打擾館務人員。",
    puzzleType: "timeline-years",
    promptText:
      "把八個事件由最早排到最晚，並在每張卡填入換算後的西元年份。只排序而不填年份，視為未完成。",
    puzzlePayload: {
      formula: "民國年 + 1911 = 西元年",
      items: [
        { id: "C", label: "遷至敦化南路現址", clue: "西元年份為整十數，且晚於增辦小學。" },
        { id: "F", label: "成立實驗高中", clue: "西元年份是 2006。" },
        { id: "A", label: "創辦幼稚園", clue: "西元年份在 1940–1950 之間。" },
        { id: "H", label: "成立高中雙語部", clue: "民國年份比成立國中雙語部大 2。" },
        { id: "B", label: "增辦小學", clue: "民國年份比創辦幼稚園大 6。" },
        { id: "E", label: "修訂現行校徽", clue: "民國年份是 82。" },
        { id: "D", label: "增設中學", clue: "民國年份比遷至現址大 8。" },
        { id: "G", label: "成立國中雙語部", clue: "民國年份比成立實驗高中大 2。" },
      ],
      museumFallbackArchive: [
        { period: "1946／民國35年", heading: "創辦復興幼稚園", detail: "於南陽街起步，由婦女界先進捐資興學。這是學校發展的起點。" },
        { period: "民國41年（1952）", heading: "增辦復興小學", detail: "復興幼稚園深獲好評後增辦小學，方志平女士任首任校長。" },
        { period: "1960／民國49年", heading: "遷至敦化南路現址", detail: "因校舍不敷使用，學校遷至敦化南路一段現址。" },
        { period: "民國57年（1968）", heading: "增設復興中學", detail: "配合九年國民教育政策增設中學部。" },
        { period: "民國82年（1993）", heading: "修訂現行校徽", detail: "現行校徽經全校師生票選、行政會議討論與董事會決議修訂，於本年定案。" },
        { period: "2006／民國95年", heading: "成立實驗高中", detail: "建立十二年一貫學制；加計幼兒園為十三年一貫。" },
        { period: "民國97年（2008）", heading: "成立國中雙語部", detail: "國中階段加入雙語教育。" },
        { period: "民國99年（2010）", heading: "成立高中雙語部", detail: "高中階段加入雙語教育。" },
      ],
    },
    correctAnswer: {
      order: ["A", "B", "C", "D", "E", "F", "G", "H"],
      years: {
        A: "1946",
        B: "1952",
        C: "1960",
        D: "1968",
        E: "1993",
        F: "2006",
        G: "2008",
        H: "2010",
      },
    },
    hint1: "先換算三個已知錨點：民國 82 年、民國 95 年、西元 2006 年。",
    hint2: "A 是民國 35 年；B 比 A 大 6；C 是遷址不是創辦；D 比 C 大 8。",
    hint3: "完整序列是 1946、1952、1960、1968、1993、2006、2008、2010；再核對每張卡的事件名稱。",
    explanation:
      "正確序列為：A 創辦幼稚園 1946（民國 35）、B 增辦小學 1952（民國 41）、C 遷至敦化南路現址 1960（民國 49）、D 增設中學 1968（民國 57）、E 修訂現行校徽 1993（民國 82）、F 成立實驗高中 2006（民國 95）、G 成立國中雙語部 2008（民國 97）、H 成立高中雙語部 2010（民國 99）。先鎖定錨點，再用民國年差推導其餘事件，最後才排序。",
    materialTitle: "學生手冊 M04・被竄改的時間軸",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "時光年輪",
    fragmentPoem: "從民國三十五年的幼苗開始，一圈圈刻出十三年一貫的年輪。",
    fragmentSymbol: "hourglass",
    clueSummary: "線索 04：創辦 1946、遷址 1960、實驗高中 2006；民國年 + 1911 = 西元年。",
    defaultUnlocked: true,
  },
  {
    id: 5,
    code: "M05",
    title: "徽章上的雙重密碼",
    subtitle: "構件配對，再讀索引字密文",
    locationName: "校徽檔案・文字推理",
    locationNote: "不需查看圖片或前往旗桿區；依據校方文字說明作答。",
    mapX: 83,
    mapY: 566,
    storyBackground:
      "校徽檔案被拆成六張構件卡與六張意涵卡。有人把「梅花」和「五片花瓣」當成同一件事，也有人把「火炬」與「鴿形火焰」混成一個象徵。先完成一對一配對，第二層密碼才會出現。",
    safetyNotice: "本關為文字配對與輸入，不需觸碰校旗、旗繩或任何校園設施。",
    puzzleType: "emblem-layers",
    promptText:
      "第一階段完成六組構件與意涵的配對；第二階段依「外形 → 植物 → 數量 → 器物 → 造型 → 邊界」的順序讀取意涵卡右下角的索引字，輸入第二層校驗詞。",
    puzzlePayload: {
      components: [
        { id: "tri", label: "三角形", layer: "外形", order: 1 },
        { id: "plum", label: "梅花", layer: "植物", order: 2 },
        { id: "petal", label: "五片花瓣", layer: "數量", order: 3 },
        { id: "torch", label: "火炬", layer: "器物", order: 4 },
        { id: "dove", label: "鴿形火焰", layer: "造型", order: 5 },
        { id: "circle", label: "外圍圓形", layer: "邊界", order: 6 },
      ],
      meanings: [
        { id: "m1", text: "以嚴冬中綻放的花卉，象徵堅忍毅力", indexChar: "興" },
        { id: "m2", text: "以完整閉合的外廓，寓意做人處事的分際與圓滿", indexChar: "光" },
        { id: "m3", text: "以向上收斂的輪廓，寄託對「人」向上向善的期許，並連結中、小、幼三位一體", indexChar: "復" },
        { id: "m4", text: "花瓣的數目，對應五育並重的教育面向", indexChar: "校" },
        { id: "m5", text: "以一種和平鳥的意象，呈現火焰的動勢", indexChar: "之" },
        { id: "m6", text: "勉勵學生成為照亮他人的存在", indexChar: "徽" },
      ],
      codeLabel: "第二層校驗詞（六個索引字，依外形→植物→數量→器物→造型→邊界排列）",
    },
    correctAnswer: {
      pairs: {
        tri: "m3",
        plum: "m1",
        petal: "m4",
        torch: "m6",
        dove: "m5",
        circle: "m2",
      },
      code: "復興校徽之光",
    },
    hint1: "先將六張構件卡分類為形狀、植物、數量、器物、造型、邊界，再讀意涵卡。",
    hint2: "梅花與五片花瓣不是同一件事；火炬本體與鴿形火焰也不是同一件事。",
    hint3:
      "配對依序是三角形／向上向善與三位一體、梅花／堅忍、五瓣／五育、火炬／照亮他人、鴿形火焰／和平、圓形／規矩圓滿。",
    explanation:
      "民國 82 年修訂的現行校徽有四層象徵：三角形狀像「人」，寓意向上向善與中、小、幼三位一體；梅花在嚴冬綻放，象徵堅忍；五片花瓣對應五育並重；火炬勉勵學生成為照亮他人的存在；火焰取鴿形，寓意和平；外圍圓形象徵做人處事守規矩、求圓滿。把六張意涵卡的索引字依構件層級排序，就是第二層校驗詞「復興校徽之光」。",
    materialTitle: "學生手冊 M05・徽章上的雙重密碼",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "火炬紋章",
    fragmentPoem: "梅花綻放五育芬芳，和平之鴿托起世上的光。",
    fragmentSymbol: "flame",
    clueSummary: "線索 05：校徽六個構件各自對應一種象徵，數量與造型都是獨立線索。",
    defaultUnlocked: true,
  },
  {
    id: 6,
    code: "M06",
    title: "綠色循環的缺頁",
    subtitle: "因果循環排序與證據邊界",
    locationName: "小花園開放步道（遠距觀察）",
    locationNote: "示意定位：校園中央植栽花園與生態景觀區",
    mapX: 455,
    mapY: 322,
    storyBackground:
      "小花園的解說牌缺了一頁，只剩下四張概念卡。它們描述的是魚菜共生的一般概念模型，不是校內某一處設備的實際管線圖。請排出合理循環，並回答三個必須分清「已知／可推論／未知」的追問。",
    safetyNotice: "觀察植物與魚菜共生區時請保持安全距離，切勿伸手撈水、觸碰設備或摘折枝葉。",
    puzzleType: "cycle-flow",
    promptText:
      "把四張概念卡排成合理循環，再用一句話回答三個追問。系統會檢查你的流程順序、概念判讀與證據邊界，不會替你決定答案。",
    puzzlePayload: {
      nodes: [
        { id: "n3", label: "植物吸收養分並生長" },
        { id: "n1", label: "魚類產生的養分來源" },
        { id: "n4", label: "經處理的水回到養殖系統" },
        { id: "n2", label: "水中養分被植物利用" },
      ],
      questions: [
        {
          id: "q1",
          label: "追問一",
          prompt: "若移除「植物利用水中養分」這個環節，哪一項關係會直接中斷？",
          placeholder: "例如：某個環節中斷，循環就……",
        },
        {
          id: "q2",
          label: "追問二",
          prompt: "「綠的延伸」是設計理念，還是某一個特定設備的名稱？",
          placeholder: "請寫出你的判斷",
        },
        {
          id: "q3",
          label: "追問三",
          prompt: "官方公開資料能否據此證明校內每一處植栽都接入魚菜共生系統？",
          placeholder: "請寫出你的判斷",
        },
      ],
      factBoundary:
        "事實邊界：魚菜共生循環為一般概念模型；本題的示意流程不代表校內設備的實際管線或運作參數。",
    },
    correctAnswer: {
      order: ["n1", "n2", "n3", "n4"],
      // 參考答案（教師解答本用；系統以 rules 的概念條件評分，不接受只靠模糊包含的答案）
      answers: {
        q1: "植物利用水中養分的環節中斷，概念循環無法依原路徑完成",
        q2: "設計理念",
        q3: "不能；公開資料不足以證明每一處植栽都接入同一系統",
      },
      rules: {
        q1: {
          requiredGroups: [["植物", "植栽"], ["中斷", "停止", "無法完成", "無法循環", "斷"]],
        },
        q2: {
          requiredGroups: [["設計理念", "設計概念", "理念", "概念"]],
          forbiddenTerms: ["設備名稱", "器材名稱", "機器名稱"],
        },
        q3: {
          requiredGroups: [["不能", "無法", "不可以", "不行", "不足以"]],
          forbiddenTerms: ["可以證明", "能證明", "可以推得", "一定能"],
        },
      },
    },
    hint1: "把四張卡分成「產生養分、利用養分、植物生長、回流水」四種角色。",
    hint2: "植物不是養分的來源；它是吸收與利用養分的環節。",
    hint3: "第二題答案是「設計理念」；第三題答案是「不能由公開資料推得」。",
    explanation:
      "概念循環為：魚類產生養分 → 水中養分被植物利用 → 植物吸收養分並生長 → 經處理的水回到養殖系統。移除「植物利用水中養分」後，整條循環無法依原路徑完成。「綠的延伸」是建築與校園的設計理念，不是特定設備名稱；官方介紹提到小花園與魚菜共生，也不等於所有植栽都接入同一套系統。",
    materialTitle: "學生手冊 M06・綠色循環的缺頁",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "綠蔭之息",
    fragmentPoem: "在城市的心臟留下一片林蔭，教會我們與自然並肩呼吸。",
    fragmentSymbol: "leaf",
    clueSummary: "線索 06：「綠的延伸」是設計理念；魚菜共生循環是一般概念模型，不等於校內實際管線。",
    defaultUnlocked: true,
  },
  {
    id: 7,
    code: "M07",
    title: "八份求助紀錄",
    subtitle: "受限配額：每處室恰好兩件",
    locationName: "數位行政檔案桌（不進入辦公室）",
    locationNote: "示意定位：校園行政服務中軸穿堂意象區",
    mapX: 576,
    mapY: 822,
    storyBackground:
      "四個處室各收到兩份主要待辦，但八份紀錄都附了一句「順便想問」的次要問題。請只依主要待辦分派；每個收件匣恰好兩件，配額是最後的交叉檢查，不是猜答案的捷徑。",
    safetyNotice: "本關卡完全透過檔案資料作答，請勿進入行政辦公室，亦勿打擾正在辦公的教職員與師長。",
    puzzleType: "office-quota",
    promptText:
      "把八份紀錄分別放進四個處室收件匣，每匣恰好兩件。系統會即時顯示件數，但不會告訴你分類對錯。",
    puzzlePayload: {
      records: [
        { id: "A", main: "補發遺失的數位學生證", aside: "想問場地借用" },
        { id: "B", main: "申請正式成績單", aside: "想問防災演練" },
        { id: "C", main: "報名聯課社團", aside: "想問場地借用" },
        { id: "D", main: "繳交拾獲的遺失物", aside: "想問成績單申請" },
        { id: "E", main: "報修教室照明", aside: "想問轉學學分" },
        { id: "F", main: "借用講座場地與設備", aside: "想問社團掛牌" },
        { id: "G", main: "諮詢多元入學與生涯方向", aside: "想問獎學金成績條件" },
        { id: "H", main: "為同學尋求心理支持", aside: "想問設備報修" },
      ],
      offices: [
        { id: "academic", label: "教務處", note: "課程、教學、成績與學籍相關業務", quota: 2 },
        { id: "student", label: "學務處", note: "訓育社團、生活輔導、防災與衛生相關業務", quota: 2 },
        { id: "general", label: "總務處", note: "校舍設備維護、營繕、場地與採購相關業務", quota: 2 },
        { id: "counseling", label: "輔導室", note: "心理支持、特殊教育資源與生涯探索相關業務", quota: 2 },
      ],
    },
    correctAnswer: {
      A: "academic",
      B: "academic",
      C: "student",
      D: "student",
      E: "general",
      F: "general",
      G: "counseling",
      H: "counseling",
    },
    hint1: "每列先劃掉「順便想問」的干擾資訊，只讀主要待辦。",
    hint2: "把主要待辦分成學籍成績、學生生活、硬體資源、個人支持四類。",
    hint3: "四類依序是教務、學務、總務、輔導，每一類剛好兩筆；再用配額檢查。",
    explanation:
      "依主要待辦的業務性質分派：數位學生證與成績單屬學籍／成績（教務處）；社團報名與遺失物屬學生生活（學務處）；照明報修與場地設備借用屬校務資源（總務處）；生涯諮詢與心理支持屬學生輔導（輔導室）。次要問題刻意指向其他處室，若被帶偏就會出現配額衝突。",
    materialTitle: "學生手冊 M07・八份求助紀錄",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
    fragmentName: "守護之燈",
    fragmentPoem: "每一個順暢的日常背後，都有無聲付出的雙手在發光。",
    fragmentSymbol: "shield",
    clueSummary: "線索 07：教務、學務、總務、輔導依主要職掌分工，每處室各兩件。",
    defaultUnlocked: true,
  },
  {
    id: 8,
    code: "M08",
    title: "時光回信：最後的校驗",
    subtitle: "跨關交叉校驗與終章口令",
    locationName: "總結檔案・安靜安全處",
    locationNote: "可在安全處整理線索；地圖節點不代表實際集合位置。",
    mapX: 300,
    mapY: 730,
    storyBackground:
      "七枚碎片已經安靜地排列在檔案盒裡。最後一頁要求你做兩件事：先用前面各關的官方資料交叉校驗四個容易混淆的答案，再從四句承諾的第一個動詞取得終章口令。四句承諾的重組與排序，會在之後的終章信紙上完成。",
    safetyNotice: "本關可於中庭長椅或安靜安全處彙整前七關線索完成，保持安靜不影響他人。",
    puzzleType: "final-crosscheck",
    promptText:
      "四個校驗欄都要用文字輸入，並各自回到不同的關卡來源查核；最後輸入終章口令。忽略全形／半形空格，但不忽略字詞順序。",
    puzzlePayload: {
      checks: [
        { id: "founded", label: "創辦年份（西元）", placeholder: "1946", keep: "不是遷址年份" },
        { id: "moved", label: "遷至敦化南路現址年份（西元）", placeholder: "1960", keep: "不是增設中學年份" },
        { id: "motto", label: "四字校訓", placeholder: "四個字", keep: "不是核心素養" },
        { id: "literacy", label: "四項核心素養的最後一句", placeholder: "四個字", keep: "不是校訓" },
      ],
      passphrase: {
        label: "終章口令",
        prompt: "把四句承諾的第一個動詞依序輸入：把責任…／把友誼…／把服務…／把愛…",
      },
      promises: [
        "把責任與榮譽給自己",
        "把友誼與溫暖給同學",
        "把服務與奉獻給社會",
        "把愛與關懷給世界",
      ],
    },
    correctAnswer: {
      founded: "1946",
      moved: "1960",
      motto: "穩準高遠",
      literacy: "行大我事",
      passphrase: "責任友誼服務愛",
    },
    hint1: "先按主題整理前面各關的線索：校史年份、校訓與核心素養、建築與校徽。",
    hint2: "題目刻意區分「創辦」與「遷址」、「校訓」與「核心素養」；回看相應關卡的來源，不要只靠記憶中的相似詞。",
    hint3: "校史年份是 1946 與 1960；校訓是穩準高遠；核心素養最後一句是行大我事。",
    explanation:
      "交叉校驗答案為：創辦 1946（民國 35）、遷至敦化南路現址 1960（民國 49）、校訓「穩準高遠」、核心素養最後一句「行大我事」。四句承諾的第一個動詞依序是責任、友誼、服務、愛，組成終章口令「責任友誼服務愛」。",
    materialTitle: "學生手冊 M08・時光回信：最後的校驗",
    materialUrl: "/printables/復興探索手冊_學生版.pdf",
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
  materialUrl: "/printables/復興探索手冊_學生版.pdf",
};
