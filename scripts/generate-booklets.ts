/**
 * 復興探索手冊・印刷品產生器
 *
 * 依 src/lib/seed-data.ts 的題庫與 FINAL_PUZZLE_DATA 產出：
 *   printables/復興探索手冊_學生版.pdf   —— 紙本任務書（含現場觀察欄）
 *   printables/復興探索手冊_教師解答本.pdf —— 教師用解答與評分建議
 *   printables/campus-map.png           —— 印刷地圖（請先執行 scripts/render-map.py）
 *
 * 執行：npx tsx scripts/generate-booklets.ts
 * 字體：@expo-google-fonts/lxgw-wenkai-tc（霞鶩文楷），與遊戲介面的手寫字體一致。
 */
import PDFDocument from "pdfkit";
import { mkdirSync, existsSync, createWriteStream } from "node:fs";
import { resolve } from "node:path";
import { SEED_MISSIONS, FINAL_PUZZLE_DATA, type SeedMission } from "../src/lib/seed-data";

// ---------- 版面設定（A5 直式） ----------
const PAGE_W = 419.53;
const PAGE_H = 595.28;
const M = 36;
const CW = PAGE_W - M * 2;
const FOOTER_Y = PAGE_H - 30;

const INK = "#213155";
const BLUE = "#103FA0";
const GOLD = "#B98A00";
const YELLOW = "#F9CF00";
const GREEN = "#008250";
const RED = "#D21E14";
const LIGHT = "#EAF0FA";
const MUTED = "#5A6B8C";
const LINE = "#9AA9C4";

const FONT_R = resolve("node_modules/@expo-google-fonts/lxgw-wenkai-tc/400Regular/LXGWWenKaiTC_400Regular.ttf");
const FONT_B = resolve("node_modules/@expo-google-fonts/lxgw-wenkai-tc/700Bold/LXGWWenKaiTC_700Bold.ttf");
const MAP_PNG = resolve("printables/campus-map.png");

// ---------- 題型資料（與 src/lib/seed-data.ts 的 payload 對應） ----------
interface OptionItem { id: string; text: string }
interface EvidenceQuestion { id: string; label: string; prompt: string; options: OptionItem[] }
interface SlotItem { id: string; prefix: string; choices: string[]; desc: string }
interface PairItem { id: string; label?: string; text?: string; title?: string }
interface TimelineItem { id: string; eraTag: string; label: string }
interface ArchiveItem { period: string; heading: string; detail: string }
interface SafetyQuestion { prompt: string; options: OptionItem[] }
interface ScenarioItem { id: string; student: string; situation: string }
interface OfficeItem { id: string; label: string; note: string }
interface SynthPart { id: string; label: string; options: string[] }
interface SynthQuestion { id: string; label: string; prompt: string; options?: string[]; subParts?: SynthPart[] }

// ---------- 現場觀察題（紙本獨有） ----------
const OBSERVATIONS: Record<number, { task: string; ref: string }> = {
  1: { task: "記下校門口門牌上的號碼。", ref: "參考答案：262（敦化南路一段262號）" },
  2: { task: "用三個詞語描寫鐘樓的外觀，並簡單畫下它的輪廓。", ref: "開放題：以觀察描述的完成度評分（如：紅磚鐘塔、尖頂、鐘面）。" },
  3: { task: "找到成賢樓、勤學樓、慎思樓的樓名，抄下三棟樓的名稱。", ref: "參考答案：成賢樓、勤學樓、慎思樓" },
  4: { task: "在校史館附近找一找有沒有年份或數字（門牌、佈告、題字），抄下其中一個。", ref: "依現場為準；重點在尋找與記錄的過程。" },
  5: { task: "觀察校徽（旗桿區或校徽標誌），數一數上面有幾種不同的圖案構件。", ref: "參考答案：三角形、梅花、火炬與鴿形火焰、外圍圓形，約 4–5 種構件。" },
  6: { task: "挑一種植物，記錄葉片的形狀或顏色；只觀察、不觸摸、不採集。", ref: "開放題＋安全題：全程未採集、未跨越花圃即得分。" },
  7: { task: "抄下公告欄或辦公室門牌上的任一個處室名稱。", ref: "參考答案：教務處／學務處／總務處／輔導室 任一。" },
  8: { task: "在中庭長椅安靜坐一分鐘，寫下你聽到的三種聲音。", ref: "開放題：以安靜完成、寫出三種聲音為原則。" },
};

// ---------- 小工具 ----------
type Doc = PDFKit.PDFDocument;

function ensure(doc: Doc, need: number): void {
  if (doc.y + need > FOOTER_Y - 12) doc.addPage();
}

function para(
  doc: Doc,
  text: string,
  opts: { size?: number; font?: string; color?: string; gap?: number; width?: number; x?: number; lineGap?: number } = {}
): void {
  const { size = 10, font = "hand", color = INK, gap = 5, width = CW, x = M, lineGap = 2 } = opts;
  doc.font(font).fontSize(size);
  const h = doc.heightOfString(text, { width, lineGap });
  ensure(doc, h + gap);
  doc.fillColor(color).text(text, x, doc.y, { width, lineGap });
  doc.y += gap;
}

function heading(doc: Doc, text: string, color = BLUE): void {
  ensure(doc, 28);
  const y = doc.y + 2;
  doc.rect(M, y + 4, 5, 15).fill(YELLOW);
  doc.font("handb").fontSize(15).fillColor(color).text(text, M + 13, y, { width: CW - 13 });
  doc.y = y + 24;
}

function dotted(doc: Doc, x: number, y: number, w: number): void {
  doc.save().moveTo(x, y).lineTo(x + w, y).strokeColor(LINE).lineWidth(0.8).dash(1.5, { space: 3 }).stroke().undash().restore();
}

function writeLines(doc: Doc, count: number, gap = 17): void {
  for (let i = 0; i < count; i += 1) {
    ensure(doc, gap + 4);
    dotted(doc, M + 6, doc.y + gap, CW - 12);
    doc.y += gap + 4;
  }
}

function boxStart(doc: Doc, title: string, color: string): void {
  ensure(doc, 40);
  doc.font("handb").fontSize(11).fillColor(color).text(title, M + 8, doc.y + 6, { width: CW - 16 });
  doc.y += 24;
}

function fieldBox(doc: Doc, title: string, bodyLines: string[], writeLineCount: number, color = GREEN): void {
  // 先量測整個盒子高度，放不下就整盒搬到下一頁（避免書寫線被 pdfkit 拆頁留下空頁）
  doc.font("handb").fontSize(11);
  const titleH = 24;
  let bodyH = 0;
  for (const line of bodyLines) {
    doc.font("hand").fontSize(9.5);
    bodyH += doc.heightOfString(line, { width: CW - 16, lineGap: 2 }) + 3;
  }
  const totalH = titleH + bodyH + writeLineCount * 21 + 12;
  ensure(doc, totalH);
  const startY = doc.y;
  boxStart(doc, title, color);
  for (const line of bodyLines) para(doc, line, { size: 9.5, color: INK, gap: 3, x: M + 8, width: CW - 16 });
  writeLines(doc, writeLineCount);
  const endY = doc.y + 4;
  doc.roundedRect(M, startY, CW, endY - startY, 8).strokeColor(color).lineWidth(1).stroke();
  doc.y = endY + 6;
}

// ---------- 各題型渲染 ----------
function renderEvidenceGrid(doc: Doc, questions: EvidenceQuestion[]): void {
  for (const q of questions) {
    ensure(doc, 46);
    doc.font("handb").fontSize(10.5).fillColor(BLUE).text(`${q.label}｜`, M, doc.y, { continued: true, width: CW });
    doc.font("hand").fontSize(10).fillColor(INK).text(q.prompt, { width: CW, lineGap: 2 });
    doc.y += 2;
    for (const opt of q.options) {
      const tag = opt.id.slice(-1).toUpperCase();
      para(doc, `(${tag}) ${opt.text}`, { size: 9.5, gap: 3, x: M + 12, width: CW - 24 });
    }
    doc.y += 5;
  }
}

function renderLogicChoice(doc: Doc, slots: SlotItem[]): void {
  for (const s of slots) {
    ensure(doc, 50);
    doc.font("handb").fontSize(10.5).fillColor(INK).text(s.prefix, M, doc.y, { width: CW, lineGap: 2 });
    para(doc, s.desc, { size: 9, color: MUTED, gap: 2 });
    para(doc, `答案：＿＿＿＿　（選項：${s.choices.join("／")}）`, { size: 10, color: BLUE, gap: 6 });
  }
}

function renderMapMatching(doc: Doc, left: PairItem[], right: PairItem[], leftTitle: string, rightTitle: string): void {
  para(doc, `左欄（${leftTitle}）　　　　　　　　　　右欄（${rightTitle}）`, { size: 9.5, font: "handb", color: BLUE, gap: 5 });
  const colLeft = M + 2;
  const colRight = M + CW / 2 + 4;
  const halfW = CW / 2 - 10;
  let yCursor = doc.y;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i];
    const r = right[i];
    const tagL = String.fromCharCode(65 + i);
    const tagR = String(i + 1);
    if (l) {
      doc.font("hand").fontSize(9.5).fillColor(INK);
      const t = `${tagL}. ${l.label ?? l.text ?? ""}`;
      const h = doc.heightOfString(t, { width: halfW, lineGap: 2 });
      doc.text(t, colLeft, yCursor, { width: halfW, lineGap: 2 });
      if (r) {
        const t2 = `${tagR}. ${r.text ?? r.label ?? ""}`;
        const h2 = doc.heightOfString(t2, { width: halfW, lineGap: 2 });
        doc.text(t2, colRight, yCursor, { width: halfW, lineGap: 2 });
        yCursor += Math.max(h, h2) + 8;
      } else {
        yCursor += h + 8;
      }
      continue;
    }
    if (r) {
      const t2 = `${tagR}. ${r.text ?? r.label ?? ""}`;
      doc.font("hand").fontSize(9.5).fillColor(INK);
      const h2 = doc.heightOfString(t2, { width: halfW, lineGap: 2 });
      doc.text(t2, colRight, yCursor, { width: halfW, lineGap: 2 });
      yCursor += h2 + 8;
    }
  }
  doc.y = yCursor + 2;
  ensure(doc, 26);
  const pairs = left.map((_, i) => `${String.fromCharCode(65 + i)}→____`).join("　");
  para(doc, `配對欄：${pairs}`, { size: 10, color: BLUE, gap: 8 });
}

function renderTimelineSort(doc: Doc, items: TimelineItem[], archive: ArchiveItem[]): void {
  para(doc, "任務卡（卡片不標年份，順序打亂）：", { size: 10, font: "handb", color: BLUE, gap: 4 });
  items.forEach((item, i) => {
    para(doc, `卡片 ${i + 1}　【${item.eraTag}】${item.label}`, { size: 9.5, gap: 4, x: M + 6, width: CW - 12 });
  });
  doc.y += 3;
  para(doc, "校史檔案（證據）：", { size: 10, font: "handb", color: BLUE, gap: 4 });
  for (const a of archive) {
    para(doc, `${a.period}　${a.heading}——${a.detail}`, { size: 8.5, color: MUTED, gap: 3, x: M + 6, width: CW - 12 });
  }
  doc.y += 4;
  ensure(doc, 30);
  const blanks = Array.from({ length: 8 }, (_, i) => `${i + 1}→____`).join("　");
  para(doc, `由最早到最晚排序（填卡片編號）：\n${blanks}`, { size: 10, color: BLUE, gap: 8 });
}

function renderEco(doc: Doc, items: PairItem[], targets: PairItem[], safety: SafetyQuestion): void {
  renderMapMatching(doc, items, targets, "概念卡", "說明卡");
  doc.y += 2;
  para(doc, `安全情境題：${safety.prompt}`, { size: 9.5, font: "handb", gap: 4 });
  for (const opt of safety.options) {
    const tag = opt.id.replace("safe-", "");
    para(doc, `(${tag}) ${opt.text}`, { size: 9, gap: 3, x: M + 12, width: CW - 24 });
  }
  para(doc, "安全題答案：＿＿＿＿", { size: 10, color: BLUE, gap: 8 });
}

function renderOffice(doc: Doc, scenarios: ScenarioItem[], offices: OfficeItem[]): void {
  for (const sc of scenarios) {
    para(doc, `${sc.student}：${sc.situation}`, { size: 9.5, gap: 5, x: M + 4, width: CW - 8 });
  }
  doc.y += 2;
  for (const o of offices) {
    para(doc, `．${o.label}——${o.note}`, { size: 9, color: MUTED, gap: 3, x: M + 6, width: CW - 12 });
  }
  doc.y += 3;
  const pairs = scenarios.map((sc) => `${sc.student.replace("檔案 ", "")}→____`).join("　");
  para(doc, `配對欄（填處室名稱）：\n${pairs}`, { size: 10, color: BLUE, gap: 8 });
}

function renderFinalSynthesis(doc: Doc, questions: SynthQuestion[]): void {
  for (const q of questions) {
    ensure(doc, 42);
    doc.font("handb").fontSize(10).fillColor(BLUE).text(`${q.label}｜`, M, doc.y, { continued: true, width: CW });
    doc.font("hand").fontSize(9.5).fillColor(INK).text(q.prompt, { width: CW, lineGap: 2 });
    doc.y += 2;
    if (q.options) {
      para(doc, `選項：${q.options.join("　")}`, { size: 9, gap: 3, x: M + 12, width: CW - 24 });
      para(doc, "答案：＿＿＿＿＿＿", { size: 10, color: BLUE, gap: 7 });
    }
    for (const part of q.subParts ?? []) {
      para(doc, `・${part.label}　選項：${part.options.join("　")}`, { size: 9, gap: 3, x: M + 12, width: CW - 24 });
      para(doc, "答案：＿＿＿＿＿＿", { size: 10, color: BLUE, gap: 6 });
    }
    doc.y += 2;
  }
}

// ---------- 頁尾 ----------
function stampFooters(doc: Doc, bookName: string): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    // pdfkit 會在文字超過下邊界時自動換頁；暫時放寬下邊界再畫頁尾
    const savedBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.font("hand").fontSize(8).fillColor(MUTED)
      .text(`${bookName}`, M, FOOTER_Y, { width: CW / 2, align: "left", lineBreak: false });
    doc.font("hand").fontSize(8).fillColor(MUTED)
      .text(`第 ${i + 1} 頁`, M + CW / 2, FOOTER_Y, { width: CW / 2, align: "right", lineBreak: false });
    doc.page.margins.bottom = savedBottom;
  }
}

// ---------- 學生手冊 ----------
function buildStudentBooklet(): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A5",
    margins: { top: M, bottom: M, left: M, right: M },
    bufferPages: true,
    info: { Title: "復興探索手冊・學生版", Author: "復興檔案：時光的邀請" },
  });
  doc.registerFont("hand", FONT_R);
  doc.registerFont("handb", FONT_B);

  // 封面
  doc.rect(0, 0, PAGE_W, 210).fill(INK);
  doc.rect(0, 210, PAGE_W, 6).fill(YELLOW);
  doc.font("handb").fontSize(27).fillColor("#FFFFFF").text("復興檔案", M, 58, { width: CW, align: "center" });
  doc.font("handb").fontSize(27).fillColor(YELLOW).text("時光的邀請", M, 96, { width: CW, align: "center" });
  doc.font("hand").fontSize(12).fillColor("#DCE6F7").text("校園探索解謎・學生手冊", M, 146, { width: CW, align: "center" });
  doc.y = 246;
  para(doc, "這本手冊是你的探索檔案。依地圖走訪八個任務點，在紙上作答、完成現場觀察，再到系統輸入答案、解鎖記憶碎片。", { size: 10.5, gap: 16 });
  doc.font("hand").fontSize(11).fillColor(INK);
  for (const label of ["姓　　名", "班　　級", "小　　組", "探索日期"]) {
    doc.text(label, M + 4, doc.y, { width: 80, lineBreak: false });
    dotted(doc, M + 92, doc.y + 12, CW - 100);
    doc.y += 26;
  }
  doc.y = PAGE_H - 110;
  para(doc, "臺北市私立復興實驗高級中學", { size: 10, color: MUTED, gap: 2, x: M, width: CW });
  para(doc, "適用 7–9 年級・建議 2–4 人一組・全程約 50–60 分鐘", { size: 9, color: MUTED, gap: 0, x: M, width: CW });

  // 怎麼玩
  doc.addPage();
  heading(doc, "怎麼玩");
  const steps = [
    "① 依「校園地圖」前往任務點（黃色數字＝任務位置）。",
    "② 讀任務頁：在紙上作答推理題，並完成「現場觀察欄」。",
    "③ 把推理題答案輸入系統，解鎖該關的記憶碎片。",
    "④ 八枚碎片集齊後，回到教室完成「終章：時光的回信」。",
    "⑤ 移動時請收起手機；到定點再拿出來輸入答案。",
  ];
  for (const s of steps) para(doc, s, { size: 10.5, gap: 7 });
  doc.y += 4;
  heading(doc, "校園探索員安全與禮儀約定", GREEN);
  const rules = [
    "• 全程安靜探索，不奔跑、不攀爬、不跳躍。",
    "• 不進入正在上課的教室與行政管制區域。",
    "• 不打擾師長辦公，亦不拍攝其他同學。",
    "• 愛護花木與設備：只觀察、不觸摸、不採集。",
    "• 遇校史館休館時，改用系統內的「數位校史檔案」。",
  ];
  for (const r of rules) para(doc, r, { size: 10, gap: 6 });
  doc.y += 4;
  heading(doc, "評分方式", GOLD);
  para(doc, "系統計分 100 分（八關）＋ 現場觀察欄 20 分（由老師抽查或小組互評）＋ 終章排列 10 分。系統內每開啟一階提示，該關 −2 分（每關最多兩階）。觀察欄的重點是觀察過程，不比對標準答案。", { size: 10, gap: 6 });

  // 地圖
  doc.addPage();
  heading(doc, "校園地圖");
  if (existsSync(MAP_PNG)) {
    const mapW = 282;
    const mapH = (mapW * 990) / 640;
    ensure(doc, mapH + 40);
    doc.image(MAP_PNG, M + (CW - mapW) / 2, doc.y + 4, { width: mapW });
    doc.y += 4 + mapH;
  }
  para(doc, "※ 依參考位置繪製之校園示意圖，建築配置為大概位置，非精確平面圖；數字為任務點編號。", { size: 8.5, color: MUTED, gap: 4 });

  // 八個任務
  for (const m of SEED_MISSIONS) {
    doc.addPage();
    // 關卡標題
    doc.roundedRect(M, doc.y, 44, 20, 5).fill(YELLOW);
    doc.font("handb").fontSize(11).fillColor(INK).text(m.code, M, doc.y + 4, { width: 44, align: "center" });
    doc.font("handb").fontSize(16).fillColor(INK).text(m.title, M + 52, doc.y - 1, { width: CW - 52 });
    doc.y += 24;
    para(doc, `${m.subtitle}　｜　位置：${m.locationName}`, { size: 8.5, color: MUTED, gap: 8 });

    // 故事背景
    doc.font("hand").fontSize(9.5);
    const storyH =
      doc.heightOfString(m.storyBackground, { width: CW - 16, lineGap: 2 }) +
      doc.heightOfString(`安全提醒：${m.safetyNotice}`, { width: CW - 16, lineGap: 2 });
    boxedBlock(
      doc,
      "檔案故事背景",
      BLUE,
      () => {
        para(doc, m.storyBackground, { size: 9.5, gap: 3, x: M + 8, width: CW - 16 });
        para(doc, `安全提醒：${m.safetyNotice}`, { size: 8.5, color: GREEN, gap: 6, x: M + 8, width: CW - 16 });
      },
      storyH + 48
    );

    // 題目
    para(doc, m.promptText, { size: 9.5, font: "handb", gap: 6 });
    const payload = m.puzzlePayload as unknown as {
      questions?: EvidenceQuestion[];
      slots?: SlotItem[];
      leftItems?: PairItem[];
      rightItems?: PairItem[];
      items?: (TimelineItem | PairItem)[];
      museumFallbackArchive?: ArchiveItem[];
      targets?: PairItem[];
      safetyQuestion?: SafetyQuestion;
      scenarios?: ScenarioItem[];
      offices?: OfficeItem[];
    };
    switch (m.puzzleType) {
      case "evidence-grid":
        renderEvidenceGrid(doc, payload.questions ?? []);
        break;
      case "logic-choice":
        renderLogicChoice(doc, payload.slots ?? []);
        break;
      case "map-matching":
        renderMapMatching(
          doc,
          payload.leftItems ?? [],
          payload.rightItems ?? [],
          m.id === 5 ? "構件／特徵" : "樓舍／館舍",
          m.id === 5 ? "象徵說明" : "名稱線索"
        );
        break;
      case "timeline-sort":
        renderTimelineSort(doc, (payload.items ?? []) as TimelineItem[], payload.museumFallbackArchive ?? []);
        break;
      case "eco-matching":
        renderEco(doc, payload.items ?? [], payload.targets ?? [], payload.safetyQuestion as SafetyQuestion);
        break;
      case "office-matching":
        renderOffice(doc, payload.scenarios ?? [], payload.offices ?? []);
        break;
      case "final-synthesis":
        renderFinalSynthesis(doc, (payload.questions ?? []) as unknown as SynthQuestion[]);
        break;
    }

    // 現場觀察欄＋答案速記（同一個盒子，避免孤行）
    const obs = OBSERVATIONS[m.id];
    fieldBox(
      doc,
      "現場觀察欄（到現場完成）",
      [`任務：${obs.task}`, "□ 已將本關答案輸入系統　　本關答案速記：＿＿＿＿＿＿＿＿＿＿＿＿"],
      3,
      GREEN
    );
  }

  // 碎片收集頁
  doc.addPage();
  heading(doc, "記憶碎片收集頁");
  for (const m of SEED_MISSIONS) {
    ensure(doc, 52);
    const y = doc.y;
    doc.roundedRect(M, y, CW, 46, 6).strokeColor(LINE).lineWidth(0.8).stroke();
    doc.roundedRect(M + 8, y + 9, 28, 28, 5).strokeColor(GOLD).lineWidth(1).dash(2, { space: 2 }).stroke().undash();
    doc.font("handb").fontSize(10).fillColor(INK).text(`${m.code}　${m.fragmentName}`, M + 44, y + 8, { width: CW - 52 });
    doc.font("hand").fontSize(8.5).fillColor(MUTED).text(`「${m.fragmentPoem}」`, M + 44, y + 22, { width: CW - 52, lineGap: 1 });
    doc.y = y + 52;
  }
  para(doc, "（每完成一關，把碎片貼紙或老師的章記蓋在方格內）", { size: 9, color: MUTED, gap: 4 });

  // 終章
  doc.addPage();
  heading(doc, FINAL_PUZZLE_DATA.title, RED);
  para(doc, FINAL_PUZZLE_DATA.subtitle, { size: 10, color: MUTED, gap: 8 });
  para(doc, FINAL_PUZZLE_DATA.storyPrompt, { size: 10, gap: 8 });
  para(doc, FINAL_PUZZLE_DATA.openingLine, { size: 11, font: "handb", color: BLUE, gap: 6 });
  FINAL_PUZZLE_DATA.shuffledLines.forEach((line, i) => {
    para(doc, `紙條 ${i + 1}：「${line.text}」`, { size: 10, gap: 4, x: M + 8, width: CW - 16 });
  });
  doc.y += 2;
  para(doc, "把紙條排出正確順序：", { size: 10, font: "handb", gap: 4 });
  writeLines(doc, 4, 18);
  para(doc, FINAL_PUZZLE_DATA.closingLine, { size: 10.5, font: "handb", color: BLUE, gap: 8, x: M, width: CW });
  fieldBox(doc, "提示", [FINAL_PUZZLE_DATA.hint], 0, GOLD);

  // 答案速查表
  doc.addPage();
  heading(doc, "答案速查表（輸入系統用）");
  for (const m of SEED_MISSIONS) {
    ensure(doc, 30);
    const y = doc.y;
    doc.font("handb").fontSize(9.5).fillColor(INK).text(`${m.code}　${m.title}`, M, y, { width: 150, lineBreak: false });
    dotted(doc, M + 156, y + 11, CW - 200);
    doc.font("hand").fontSize(9).fillColor(MUTED).text("□ 已輸入", M + CW - 42, y, { width: 42, align: "right", lineBreak: false });
    doc.y = y + 22;
  }
  ensure(doc, 30);
  const y = doc.y;
  doc.font("handb").fontSize(9.5).fillColor(INK).text("終章　時光的回信", M, y, { width: 150, lineBreak: false });
  dotted(doc, M + 156, y + 11, CW - 200);
  doc.font("hand").fontSize(9).fillColor(MUTED).text("□ 已完成", M + CW - 42, y, { width: 42, align: "right", lineBreak: false });
  doc.y = y + 30;
  para(doc, "把這頁留到最後對照；輸入錯誤沒關係，可以再試——每一次嘗試都是推理的一部份。", { size: 9, color: MUTED, gap: 4 });

  stampFooters(doc, "復興探索手冊・學生版");
  return doc;
}

function fieldBoxStart(doc: Doc, title: string, color: string): void {
  ensure(doc, 34);
  const y = doc.y;
  doc.font("handb").fontSize(10.5).fillColor(color).text(title, M + 8, y + 7, { width: CW - 16 });
  doc.y = y + 26;
}

/** 量測內文後畫出外框的盒子（標題＋段落）；放不下整盒換頁 */
function boxedBlock(
  doc: Doc,
  title: string,
  color: string,
  draw: () => void,
  estimatedHeight: number
): void {
  ensure(doc, estimatedHeight);
  const startY = doc.y;
  fieldBoxStart(doc, title, color);
  draw();
  const endY = doc.y + 4;
  doc.roundedRect(M, startY, CW, endY - startY, 8).strokeColor(color).lineWidth(1).stroke();
  doc.y = endY + 6;
}

// ---------- 教師解答本 ----------
function buildTeacherGuide(): PDFKit.PDFDocument {
  const doc = new PDFDocument({
    size: "A5",
    margins: { top: M, bottom: M, left: M, right: M },
    bufferPages: true,
    info: { Title: "復興探索手冊・教師解答本", Author: "復興檔案：時光的邀請" },
  });
  doc.registerFont("hand", FONT_R);
  doc.registerFont("handb", FONT_B);

  // 封面
  doc.rect(0, 0, PAGE_W, 190).fill("#7A1F14");
  doc.rect(0, 190, PAGE_W, 6).fill(YELLOW);
  doc.font("handb").fontSize(24).fillColor("#FFFFFF").text("復興探索手冊", M, 56, { width: CW, align: "center" });
  doc.font("handb").fontSize(18).fillColor(YELLOW).text("教師解答本", M, 96, { width: CW, align: "center" });
  doc.font("hand").fontSize(11).fillColor("#F3DEDA").text("校園探索解謎・7–9 年級", M, 136, { width: CW, align: "center" });
  doc.y = 230;
  para(doc, "本解答本包含八關推理題答案、現場觀察題參考答案、評分建議與安全事項。請勿在活動前發給學生。", { size: 10.5, gap: 14 });

  heading(doc, "課程建議");
  for (const s of [
    "・建議 2–4 人一組，每組一本學生手冊；手機每組至少一台可輸入答案即可。",
    "・節奏建議：集合說明 5 分鐘、戶外探索 30–40 分鐘、終章與檢討 10–15 分鐘。",
    "・移動時收起手機，到定點才拿出來驗證——把時間留給觀察與討論。",
    "・若班級無行動裝置：可全紙本進行，改由老師在教室電腦統一輸入答案。",
  ]) para(doc, s, { size: 10, gap: 6 });

  heading(doc, "評分建議", GOLD);
  para(doc, "系統計分 100 分（八關各關卡分數以系統為準）＋ 現場觀察欄 20 分（每關 2.5 分，以完成度評分）＋ 終章排列 10 分。學生每開啟一階系統提示，該關 −2 分（每關最多兩階，未完成關卡的提示不扣分）。開放式觀察題沒有標準答案，重視觀察與記錄的過程。", { size: 10, gap: 8 });

  heading(doc, "安全事項", GREEN);
  for (const s of [
    "・全程安靜、不奔跑攀爬；不進入上課中的教室與行政管制區。",
    "・小花園與植栽區：只觀察、不觸摸、不採集、不跨越花圃。",
    "・校史館休館時改用系統內數位校史檔案，不推門打擾館務。",
    "・各關卡的詳細安全提醒印在對應任務頁，出發前請再宣導一次。",
  ]) para(doc, s, { size: 10, gap: 6 });

  // 逐關解答
  for (const m of SEED_MISSIONS) {
    doc.addPage();
    doc.roundedRect(M, doc.y, 44, 20, 5).fill(RED);
    doc.font("handb").fontSize(11).fillColor("#FFFFFF").text(m.code, M, doc.y + 4, { width: 44, align: "center" });
    doc.font("handb").fontSize(15).fillColor(INK).text(m.title, M + 52, doc.y - 1, { width: CW - 52 });
    doc.y += 24;

    heading(doc, "解答");
    const ans = m.correctAnswer as Record<string, string> | string[];
    switch (m.puzzleType) {
      case "evidence-grid": {
        const qLabels = ["q1", "q2", "q3", "q4"];
        for (const q of qLabels) para(doc, `${q.toUpperCase()}：${(ans as Record<string, string>)[q]}`, { size: 10, gap: 4 });
        break;
      }
      case "logic-choice":
        for (const [k, v] of Object.entries(ans as Record<string, string>)) para(doc, `${k}：${v}`, { size: 10, gap: 4 });
        break;
      case "map-matching":
        for (const [k, v] of Object.entries(ans as Record<string, string>)) para(doc, `${k} → ${v}`, { size: 10, gap: 4 });
        break;
      case "timeline-sort":
        para(doc, `由早到晚：${(ans as unknown as string[]).join(" → ")}`, { size: 10, gap: 4 });
        para(doc, "（h1 幼稚園 → h2 小學 → h3 遷址 → h4 中學 → h6 校徽 → h5 實驗高中 → h7 國中雙語 → h8 高中雙語）", { size: 8.5, color: MUTED, gap: 4 });
        break;
      case "eco-matching": {
        const a = ans as unknown as { pairs: Record<string, string>; safety: string };
        for (const [k, v] of Object.entries(a.pairs)) para(doc, `${k} → ${v}`, { size: 10, gap: 4 });
        para(doc, `安全題：${a.safety}`, { size: 10, gap: 4, font: "handb" });
        break;
      }
      case "office-matching": {
        const labels: Record<string, string> = { academic: "教務處", student: "學務處", general: "總務處", counseling: "輔導室" };
        for (const [k, v] of Object.entries(ans as Record<string, string>)) para(doc, `${k} → ${labels[v] ?? v}`, { size: 10, gap: 4 });
        break;
      }
      case "final-synthesis":
        for (const [k, v] of Object.entries(ans as Record<string, string>)) para(doc, `${k}：${v}`, { size: 10, gap: 4 });
        break;
    }

    heading(doc, "現場觀察欄參考答案", GREEN);
    para(doc, OBSERVATIONS[m.id].ref, { size: 9.5, gap: 4 });
    para(doc, `觀察任務：${OBSERVATIONS[m.id].task}`, { size: 8.5, color: MUTED, gap: 8 });

    heading(doc, "解題提示（可口頭提示學生）", GOLD);
    para(doc, `提示一：${m.hint1}`, { size: 9.5, gap: 4 });
    para(doc, `提示二：${m.hint2}`, { size: 9.5, gap: 8 });

    heading(doc, "關卡重點");
    para(doc, m.explanation, { size: 9.5, gap: 3 });
    para(doc, `資料來源：${m.sourceTitle}`, { size: 8.5, color: MUTED, gap: 1 });
    para(doc, m.sourceUrl, { size: 8, color: MUTED, gap: 1 });
    para(doc, `線索卡（碎片）：${m.clueSummary}`, { size: 8.5, color: MUTED, gap: 1 });
  }

  // 終章解答
  doc.addPage();
  heading(doc, "終章解答：時光的回信", RED);
  para(doc, `正確順序：${FINAL_PUZZLE_DATA.correctOrder.join(" → ")}`, { size: 10, font: "handb", gap: 6 });
  const lines = new Map(FINAL_PUZZLE_DATA.shuffledLines.map((l) => [l.id, l.text]));
  const solved = [
    `${lines.get("l1a")}${lines.get("l1b")}`,
    `${lines.get("l2a")}${lines.get("l2b")}`,
    `${lines.get("l3a")}${lines.get("l3b")}`,
    `${lines.get("l4a")}${lines.get("l4b")}`,
  ];
  for (const s of solved) para(doc, `・${s}`, { size: 11, gap: 5 });
  doc.y += 4;
  para(doc, FINAL_PUZZLE_DATA.openingLine, { size: 10.5, font: "handb", color: BLUE, gap: 3 });
  para(doc, FINAL_PUZZLE_DATA.closingLine, { size: 10.5, font: "handb", color: BLUE, gap: 8 });
  fieldBox(doc, "評分重點", [
    "四句順序正確 6 分；能說明排序理由（個人→同學→社會→世界的關懷範圍）4 分。",
    "終章可全班一起在教室大螢幕完成，搭配系統的結局動畫效果最好。",
  ], 0, GOLD);

  stampFooters(doc, "復興探索手冊・教師解答本");
  return doc;
}

// ---------- 主程式 ----------
function renderToFile(file: string, doc: PDFKit.PDFDocument): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const stream = createWriteStream(file);
    stream.on("finish", () => resolvePromise());
    stream.on("error", rejectPromise);
    doc.pipe(stream);
    doc.end();
  });
}

async function run(): Promise<void> {
  mkdirSync("printables", { recursive: true });
  await renderToFile("printables/復興探索手冊_學生版.pdf", buildStudentBooklet());
  console.log("已產生 printables/復興探索手冊_學生版.pdf");
  await renderToFile("printables/復興探索手冊_教師解答本.pdf", buildTeacherGuide());
  console.log("已產生 printables/復興探索手冊_教師解答本.pdf");
}

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
