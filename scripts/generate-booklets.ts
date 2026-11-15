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
interface EvidenceCardItem { id: string; order: number; text: string; sourceKey: string; token?: string }
interface EvidenceColumnItem { id: string; label: string; note: string }
interface EvidenceSourceItem { title: string; url: string; excerpt: string }
interface AcrosticSlotItem { id: string; label: string; requirement: string }
interface AcrosticLineItem { id: string; lead: string; text: string }
interface GridLeftItem { id: string; label: string }
interface GridRightItem { id: string; text: string }
interface TimelineItem { id: string; label: string; clue: string }
interface ArchiveItem { period: string; heading: string; detail: string }
interface EmblemComponentItem { id: string; label: string; layer: string; order: number }
interface EmblemMeaningItem { id: string; text: string; indexChar?: string }
interface CycleNodeItem { id: string; label: string }
interface CycleQuestionItem { id: string; label: string; prompt: string; placeholder?: string }
interface OfficeRecordItem { id: string; main: string; aside: string }
interface OfficeItem { id: string; label: string; note: string; quota?: number }
interface CrosscheckItem { id: string; label: string; placeholder?: string; keep?: string }
interface PassphraseItem { label: string; prompt: string }

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
function letter(index: number): string {
  return String.fromCharCode(65 + index);
}

function renderEvidenceClassify(
  doc: Doc,
  columns: EvidenceColumnItem[],
  cards: EvidenceCardItem[],
  sources: EvidenceSourceItem[],
  lockLabel?: string
): void {
  para(doc, `三個證據欄：${columns.map((c) => c.label).join("｜")}`, { size: 10, font: "handb", color: BLUE, gap: 5 });
  for (const card of [...cards].sort((a, b) => a.order - b.order)) {
    para(doc, `證詞 ${card.order}：${card.text}`, { size: 9.5, gap: 4, x: M + 6, width: CW - 12 });
  }
  doc.y += 2;
  para(doc, "可證實　＿＿＿＿＿＿＿＿＿＿＿＿", { size: 9.5, color: BLUE, gap: 3 });
  para(doc, "與來源矛盾　＿＿＿＿＿＿＿＿＿＿", { size: 9.5, color: BLUE, gap: 3 });
  para(doc, "資料未載　＿＿＿＿＿＿＿＿＿＿＿", { size: 9.5, color: BLUE, gap: 5 });
  para(doc, lockLabel ?? "檔案鎖校驗字：＿＿＿＿＿＿", { size: 9.5, color: GOLD, gap: 4 });
  para(doc, "理由（一句話說明未載與矛盾的差別）：", { size: 9, color: MUTED, gap: 2 });
  writeLines(doc, 2);
  para(doc, "可核對的官方來源：", { size: 9.5, font: "handb", color: BLUE, gap: 3 });
  for (const source of sources) {
    para(doc, `・${source.title}：${source.excerpt}`, { size: 8, color: MUTED, gap: 2, x: M + 6, width: CW - 12 });
  }
  doc.y += 3;
}

function renderAcrostic(doc: Doc, slots: AcrosticSlotItem[], lines: AcrosticLineItem[]): void {
  for (const slot of slots) {
    para(doc, `【${slot.label}】${slot.requirement}`, { size: 9.5, font: "handb", gap: 2 });
    para(doc, "選擇詩行：＿＿＿＿（填入詩行代號）", { size: 9.5, color: BLUE, gap: 6, x: M + 8, width: CW - 16 });
  }
  doc.y += 2;
  para(doc, "四段殘詩（含抄錄者加入的干擾句）：", { size: 10, font: "handb", color: BLUE, gap: 4 });
  for (const line of lines) {
    para(doc, `${line.id}. ${line.lead}${line.text}`, { size: 9.5, gap: 3, x: M + 8, width: CW - 16 });
  }
  doc.y += 3;
  para(doc, "四字密令：＿＿　＿＿　＿＿　＿＿", { size: 11, color: GOLD, gap: 8 });
}

function renderLogicGrid(
  doc: Doc,
  left: GridLeftItem[],
  right: GridRightItem[],
  clues: string[],
  gridTitle: string
): void {
  para(doc, "線索：", { size: 10, font: "handb", color: BLUE, gap: 3 });
  for (const clue of clues) {
    para(doc, `・${clue}`, { size: 8.5, gap: 2, x: M + 6, width: CW - 12 });
  }
  doc.y += 4;
  para(doc, `${gridTitle}：`, { size: 10, font: "handb", color: BLUE, gap: 4 });
  right.forEach((item, index) => {
    para(doc, `任務 ${letter(index)}：${item.text}`, { size: 8.5, gap: 2, x: M + 6, width: CW - 12 });
  });
  doc.y += 4;
  para(doc, `配對欄（${left.map((item) => item.label).join("、")}）：`, { size: 9.5, color: BLUE, gap: 3 });
  const blanks = left.map((item) => `${item.label}→____`).join("　");
  para(doc, blanks, { size: 9.5, gap: 8, x: M + 6, width: CW - 12 });
}

function renderTimelineYears(doc: Doc, items: TimelineItem[], archive: ArchiveItem[], formula?: string): void {
  para(doc, `換算規則：${formula ?? "民國年 + 1911 = 西元年"}`, { size: 9, color: MUTED, gap: 4 });
  items.forEach((item) => {
    para(doc, `事件 ${item.id}｜${item.label}（${item.clue}）　年份：＿＿＿＿`, { size: 9.5, gap: 4, x: M + 6, width: CW - 12 });
  });
  doc.y += 3;
  para(doc, "校史檔案（證據）：", { size: 10, font: "handb", color: BLUE, gap: 4 });
  for (const entry of archive) {
    para(doc, `${entry.period}　${entry.heading}——${entry.detail}`, { size: 8.5, color: MUTED, gap: 3, x: M + 6, width: CW - 12 });
  }
  doc.y += 4;
  para(doc, "由最早到最晚排序（填事件代號）：", { size: 9.5, color: BLUE, gap: 3 });
  para(doc, Array.from({ length: 8 }, (_, i) => `${i + 1}→____`).join("　"), { size: 9.5, gap: 8 });
}

function renderEmblem(
  doc: Doc,
  components: EmblemComponentItem[],
  meanings: EmblemMeaningItem[],
  codeLabel?: string
): void {
  para(doc, "第一階段：構件與意涵一對一配對", { size: 10, font: "handb", color: BLUE, gap: 3 });
  components.forEach((component, index) => {
    para(doc, `${component.label}（${component.layer}）→ ____`, { size: 9.5, gap: 3, x: M + 6, width: CW - 12 });
  });
  doc.y += 3;
  para(doc, "意涵卡：", { size: 9.5, font: "handb", color: BLUE, gap: 3 });
  meanings.forEach((meaning, index) => {
    para(doc, `${index + 1}. ${meaning.text}`, { size: 8.5, gap: 2, x: M + 6, width: CW - 12 });
  });
  doc.y += 3;
  para(doc, "第二階段：依外形→植物→數量→器物→造型→邊界讀取索引字", { size: 9.5, font: "handb", color: BLUE, gap: 3 });
  para(doc, `${codeLabel ?? "第二層校驗詞"}：＿＿＿＿＿＿`, { size: 10, color: GOLD, gap: 8 });
}

function renderCycle(doc: Doc, nodes: CycleNodeItem[], questions: CycleQuestionItem[], factBoundary?: string): void {
  para(doc, "概念卡（順序打亂，請排成循環）：", { size: 10, font: "handb", color: BLUE, gap: 3 });
  nodes.forEach((node) => para(doc, `・${node.label}`, { size: 9.5, gap: 2, x: M + 6, width: CW - 12 }));
  doc.y += 2;
  para(doc, "循環順序：____ → ____ → ____ → ____（最後接回第一張）", { size: 9.5, color: BLUE, gap: 6 });
  for (const question of questions) {
    para(doc, `${question.label}：${question.prompt}`, { size: 9.5, font: "handb", gap: 2 });
    writeLines(doc, 2);
  }
  if (factBoundary) para(doc, factBoundary, { size: 8, color: MUTED, gap: 6 });
}

function renderOfficeQuota(doc: Doc, records: OfficeRecordItem[], offices: OfficeItem[]): void {
  for (const record of records) {
    para(doc, `檔案 ${record.id}｜主要待辦：${record.main}（順便想問：${record.aside}）`, {
      size: 9,
      gap: 3,
      x: M + 4,
      width: CW - 8,
    });
  }
  doc.y += 2;
  for (const office of offices) {
    para(doc, `．${office.label}（配額 ${office.quota ?? 2} 件）——${office.note}`, { size: 8.5, color: MUTED, gap: 2, x: M + 6, width: CW - 12 });
  }
  doc.y += 3;
  para(doc, "配對欄（填處室名稱，每處室兩件）：", { size: 9.5, color: BLUE, gap: 3 });
  para(doc, records.map((record) => `${record.id}→____`).join("　"), { size: 9.5, gap: 8 });
}

function renderFinalCrosscheck(
  doc: Doc,
  checks: CrosscheckItem[],
  passphrase?: PassphraseItem,
  promises: string[] = []
): void {
  checks.forEach((check, index) => {
    para(doc, `${index + 1}. ${check.label}：＿＿＿＿＿＿（${check.keep ?? ""}）`, { size: 9.5, gap: 5 });
  });
  doc.y += 2;
  para(doc, passphrase?.label ?? "終章口令", { size: 10, font: "handb", color: GOLD, gap: 2 });
  para(doc, passphrase?.prompt ?? "", { size: 9, color: MUTED, gap: 3 });
  para(doc, promises.map((promise) => `${promise.slice(0, 3)}……`).join("　"), { size: 8.5, color: MUTED, gap: 4 });
  para(doc, "終章口令：＿＿＿＿＿＿＿＿", { size: 10.5, color: GOLD, gap: 8 });
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
  para(doc, "適用 7–9 年級・建議 2–4 人一組・困難模式全程約 60 分鐘", { size: 9, color: MUTED, gap: 0, x: M, width: CW });

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
  para(doc, "系統計分 100 分（八關＋終章）＋ 現場觀察欄 20 分（由老師抽查或小組互評）。系統內每開啟一階提示，該關 −1 分（每關最多三階）。觀察欄的重點是觀察過程，不比對標準答案。", { size: 10, gap: 6 });

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
      columns?: EvidenceColumnItem[];
      cards?: EvidenceCardItem[];
      sources?: EvidenceSourceItem[];
      lockLabel?: string;
      slots?: AcrosticSlotItem[];
      lines?: AcrosticLineItem[];
      leftItems?: GridLeftItem[];
      rightItems?: GridRightItem[];
      clues?: string[];
      formula?: string;
      items?: TimelineItem[];
      museumFallbackArchive?: ArchiveItem[];
      components?: EmblemComponentItem[];
      meanings?: EmblemMeaningItem[];
      codeLabel?: string;
      nodes?: CycleNodeItem[];
      questions?: CycleQuestionItem[];
      factBoundary?: string;
      records?: OfficeRecordItem[];
      offices?: OfficeItem[];
      checks?: CrosscheckItem[];
      passphrase?: PassphraseItem;
      promises?: string[];
    };
    switch (m.puzzleType) {
      case "evidence-classify":
        renderEvidenceClassify(doc, payload.columns ?? [], payload.cards ?? [], payload.sources ?? [], payload.lockLabel);
        break;
      case "acrostic-select":
        renderAcrostic(doc, payload.slots ?? [], payload.lines ?? []);
        break;
      case "logic-grid":
        renderLogicGrid(doc, payload.leftItems ?? [], payload.rightItems ?? [], payload.clues ?? [], "六座空間與任務卡");
        break;
      case "timeline-years":
        renderTimelineYears(doc, payload.items ?? [], payload.museumFallbackArchive ?? [], payload.formula);
        break;
      case "emblem-layers":
        renderEmblem(doc, payload.components ?? [], payload.meanings ?? [], payload.codeLabel);
        break;
      case "cycle-flow":
        renderCycle(doc, payload.nodes ?? [], payload.questions ?? [], payload.factBoundary);
        break;
      case "office-quota":
        renderOfficeQuota(doc, payload.records ?? [], payload.offices ?? []);
        break;
      case "final-crosscheck":
        renderFinalCrosscheck(doc, payload.checks ?? [], payload.passphrase, payload.promises ?? []);
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
    "・節奏建議（合計約 60 分鐘）：集合說明 5 分、M01 7 分、M02 6 分、M03 8 分、M04 8 分、M05 7 分、M06 7 分、M07 8 分、M08 9 分、終章與檢討 5 分。",
    "・移動時收起手機，到定點才拿出來驗證——把時間留給觀察與討論。",
    "・若班級無行動裝置：可全紙本進行，改由老師在教室電腦統一輸入答案。",
  ]) para(doc, s, { size: 10, gap: 6 });

  heading(doc, "評分建議", GOLD);
  para(doc, "系統計分 100 分（八關各 10 分、終章 10 分、全破加成 10 分）＋ 現場觀察欄 20 分（每關 2.5 分，以完成度評分）。學生每開啟一階系統提示，該關 −1 分（每關最多三階，未完成關卡的提示不扣分）。開放式觀察題沒有標準答案，重視觀察與記錄的過程。", { size: 10, gap: 8 });

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
    const keyPayload = m.puzzlePayload as unknown as {
      columns?: EvidenceColumnItem[];
      cards?: EvidenceCardItem[];
      slots?: AcrosticSlotItem[];
      lines?: AcrosticLineItem[];
      leftItems?: GridLeftItem[];
      rightItems?: GridRightItem[];
      items?: TimelineItem[];
      components?: EmblemComponentItem[];
      meanings?: EmblemMeaningItem[];
      nodes?: CycleNodeItem[];
      records?: OfficeRecordItem[];
      offices?: OfficeItem[];
      checks?: CrosscheckItem[];
    };
    const ans = m.correctAnswer as unknown;
    switch (m.puzzleType) {
      case "evidence-classify": {
        const a = ans as { placement: Record<string, string>; lock: string };
        const columnLabel = new Map((keyPayload.columns ?? []).map((column) => [column.id, column.label]));
        for (const card of [...(keyPayload.cards ?? [])].sort((x, y) => x.order - y.order)) {
          para(doc, `證詞 ${card.order} → ${columnLabel.get(a.placement[card.id]) ?? a.placement[card.id]}`, { size: 9.5, gap: 3 });
        }
        para(doc, `檔案鎖校驗字：${a.lock}`, { size: 10, font: "handb", color: GOLD, gap: 4 });
        break;
      }
      case "acrostic-select": {
        const a = ans as Record<string, string>;
        const lines = new Map((keyPayload.lines ?? []).map((line) => [line.id, line]));
        let motto = "";
        for (const slot of keyPayload.slots ?? []) {
          const line = lines.get(a[slot.id]);
          if (line) motto += line.lead;
          para(doc, `${slot.label} → ${a[slot.id]}（${line ? `${line.lead}${line.text}` : ""}）`, { size: 9.5, gap: 3 });
        }
        para(doc, `四字密令：${motto}`, { size: 10, font: "handb", color: GOLD, gap: 4 });
        break;
      }
      case "logic-grid": {
        const a = ans as Record<string, string>;
        const right = new Map((keyPayload.rightItems ?? []).map((item) => [item.id, item.text]));
        for (const left of keyPayload.leftItems ?? []) {
          para(doc, `${left.label} → ${right.get(a[left.id]) ?? a[left.id]}`, { size: 9.5, gap: 3 });
        }
        break;
      }
      case "timeline-years": {
        const a = ans as { order: string[]; years: Record<string, string> };
        const labels = new Map((keyPayload.items ?? []).map((item) => [item.id, item.label]));
        para(doc, "由早到晚：", { size: 10, font: "handb", color: GOLD, gap: 3 });
        a.order.forEach((id, index) => {
          para(doc, `${index + 1}. ${id}｜${labels.get(id) ?? ""}｜${a.years[id]}`, { size: 9.5, gap: 3, x: M + 6, width: CW - 12 });
        });
        break;
      }
      case "emblem-layers": {
        const a = ans as { pairs: Record<string, string>; code: string };
        const components = new Map((keyPayload.components ?? []).map((component) => [component.id, component.label]));
        const meanings = new Map((keyPayload.meanings ?? []).map((meaning) => [meaning.id, meaning.text]));
        for (const [componentId, meaningId] of Object.entries(a.pairs)) {
          para(doc, `${components.get(componentId) ?? componentId} → ${meanings.get(meaningId) ?? meaningId}`, { size: 9, gap: 3 });
        }
        para(doc, `第二層校驗詞：${a.code}`, { size: 10, font: "handb", color: GOLD, gap: 4 });
        break;
      }
      case "cycle-flow": {
        const a = ans as { order: string[]; answers: Record<string, unknown> };
        const nodes = new Map((keyPayload.nodes ?? []).map((node) => [node.id, node.label]));
        para(doc, `循環順序：${a.order.map((id) => nodes.get(id) ?? id).join(" → ")} → 接回第一步`, { size: 9.5, gap: 4 });
        para(doc, "追問一：植物利用養分的環節中斷，概念循環無法依原路徑完成。", { size: 9.5, gap: 3 });
        para(doc, "追問二：「綠的延伸」是設計理念，不是特定設備名稱。", { size: 9.5, gap: 3 });
        para(doc, "追問三：不能；公開介紹提到小花園與魚菜共生，不等於所有植栽都接入同一系統。", { size: 9.5, gap: 4 });
        break;
      }
      case "office-quota": {
        const a = ans as Record<string, string>;
        const offices = new Map((keyPayload.offices ?? []).map((office) => [office.id, office.label]));
        for (const record of keyPayload.records ?? []) {
          para(doc, `檔案 ${record.id}｜${record.main} → ${offices.get(a[record.id]) ?? a[record.id]}`, { size: 9.5, gap: 3 });
        }
        break;
      }
      case "final-crosscheck": {
        const a = ans as Record<string, string>;
        const labels = new Map((keyPayload.checks ?? []).map((check) => [check.id, check.label]));
        para(doc, `${labels.get("founded") ?? "創辦年份"}：${a.founded}`, { size: 9.5, gap: 3 });
        para(doc, `${labels.get("moved") ?? "遷址年份"}：${a.moved}`, { size: 9.5, gap: 3 });
        para(doc, `${labels.get("motto") ?? "校訓"}：${a.motto}`, { size: 9.5, gap: 3 });
        para(doc, `${labels.get("literacy") ?? "核心素養"}：${a.literacy}`, { size: 9.5, gap: 3 });
        para(doc, `終章口令：${a.passphrase}`, { size: 10, font: "handb", color: GOLD, gap: 4 });
        break;
      }
    }

    heading(doc, "現場觀察欄參考答案", GREEN);
    para(doc, OBSERVATIONS[m.id].ref, { size: 9.5, gap: 4 });
    para(doc, `觀察任務：${OBSERVATIONS[m.id].task}`, { size: 8.5, color: MUTED, gap: 8 });

    heading(doc, "解題提示（可口頭提示學生）", GOLD);
    para(doc, `提示一（觀察方向，−1 分）：${m.hint1}`, { size: 9.5, gap: 3 });
    para(doc, `提示二（推理策略，−1 分）：${m.hint2}`, { size: 9.5, gap: 3 });
    para(doc, `提示三（關鍵關係，−1 分）：${m.hint3}`, { size: 9.5, gap: 8 });

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
