import test from "node:test";
import assert from "node:assert/strict";
import { SEED_MISSIONS, type SeedMission } from "../src/lib/seed-data";
import { gradeMissionAnswer, normalizeAnswer } from "../src/lib/game-engine";

function missionByCode(code: string): SeedMission {
  const mission = SEED_MISSIONS.find((item) => item.code === code);
  assert.ok(mission, `${code} must exist`);
  return mission;
}

function grade(code: string, submission: unknown) {
  return gradeMissionAnswer(missionByCode(code), submission);
}

test("M01 requires both the three-column classification and the lock word", () => {
  const correct = missionByCode("M01").correctAnswer as {
    placement: Record<string, string>;
    lock: string;
  };

  assert.equal(grade("M01", { placement: correct.placement, lock: "時光的邀請" }).isCorrect, true);
  // 全形空格與空白不影響校驗
  assert.equal(grade("M01", { placement: correct.placement, lock: " 時光的邀請 " }).isCorrect, true);

  // 把「資料未載」誤判成「矛盾」是最常見的錯誤
  const trap = { ...correct.placement, k5: "contradicted" };
  const trapResult = grade("M01", { placement: trap, lock: "時光的邀請" });
  assert.equal(trapResult.isCorrect, false);
  assert.match(trapResult.feedback, /1 張/);

  // 分類正確但校驗字錯誤
  const lockWrong = grade("M01", { placement: correct.placement, lock: "時光邀請的" });
  assert.equal(lockWrong.isCorrect, false);
  assert.match(lockWrong.feedback, /校驗字/);

  // 未完成分類
  assert.equal(grade("M01", { placement: { k1: "confirmed" }, lock: "時光的邀請" }).isCorrect, false);
  assert.equal(grade("M01", { placement: correct.placement, lock: "" }).isCorrect, false);
});

test("M02 grades semantic slot choices and hides the motto in error feedback", () => {
  const correct = missionByCode("M02").correctAnswer as Record<string, string>;
  assert.equal(grade("M02", correct).isCorrect, true);

  // 把「安」當成「穩」，只換一個槽位
  const swapped = { ...correct, tone: "B" };
  const result = grade("M02", swapped);
  assert.equal(result.isCorrect, false);
  assert.doesNotMatch(result.feedback, /穩準高遠/);
  assert.match(result.feedback, /1 個槽位/);

  assert.equal(grade("M02", { tone: "A" }).isCorrect, false);
});

test("M03 reports remaining conflicts without revealing the solution", () => {
  const correct = missionByCode("M03").correctAnswer as Record<string, string>;
  assert.equal(grade("M03", correct).isCorrect, true);

  const swapped = { ...correct, b5: "r1", b6: "r2" };
  const result = grade("M03", swapped);
  assert.equal(result.isCorrect, false);
  assert.match(result.feedback, /尚有 2 組衝突/);
  assert.doesNotMatch(result.feedback, /校史館/);

  assert.equal(grade("M03", { b1: "r4" }).isCorrect, false);
});

test("M04 validates ordering and year conversion separately", () => {
  const payload = missionByCode("M04").puzzlePayload as {
    items: { id: string }[];
  };
  const correct = missionByCode("M04").correctAnswer as {
    order: string[];
    years: Record<string, string>;
  };
  const shuffledOrder = [...payload.items.map((item) => item.id)];

  assert.equal(grade("M04", { order: correct.order, years: correct.years }).isCorrect, true);
  // 民國年輸入也應被接受（元件會先換算，這裡直接送出西元）
  assert.equal(grade("M04", { order: correct.order, years: { ...correct.years } }).isCorrect, true);

  // 只排序不填年份
  const missingYears = grade("M04", { order: correct.order, years: {} });
  assert.equal(missingYears.isCorrect, false);
  assert.match(missingYears.feedback, /年份/);

  // 排序正確但年份錯一項
  const yearTypo = grade("M04", { order: correct.order, years: { ...correct.years, E: "1992" } });
  assert.equal(yearTypo.isCorrect, false);
  assert.match(yearTypo.feedback, /排序正確/);

  // 年份正確但排序錯誤
  const orderWrong = grade("M04", { order: shuffledOrder, years: correct.years });
  assert.equal(orderWrong.isCorrect, false);
  assert.match(orderWrong.feedback, /時間順序/);

  // 全形數字也能通過
  const fullWidth = grade("M04", {
    order: correct.order,
    years: Object.fromEntries(Object.entries(correct.years).map(([key, value]) => [key, value.replace(/\d/g, (d) => String.fromCharCode(d.charCodeAt(0) + 0xfee0))])),
  });
  assert.equal(fullWidth.isCorrect, true);
});

test("M05 needs the pairs before the second-layer code counts", () => {
  const correct = missionByCode("M05").correctAnswer as {
    pairs: Record<string, string>;
    code: string;
  };
  assert.equal(grade("M05", correct).isCorrect, true);

  const badCode = grade("M05", { pairs: correct.pairs, code: "復興校徽" });
  assert.equal(badCode.isCorrect, false);
  assert.match(badCode.feedback, /第二層/);
  assert.doesNotMatch(badCode.feedback, /復興校徽之光/);

  const badPair = grade("M05", { pairs: { ...correct.pairs, plum: correct.pairs.petal }, code: correct.code });
  assert.equal(badPair.isCorrect, false);

  assert.equal(grade("M05", { pairs: {}, code: correct.code }).isCorrect, false);
});

test("M06 accepts equivalent short answers but rejects reversed claims", () => {
  const correct = missionByCode("M06").correctAnswer as {
    order: string[];
    answers: Record<string, unknown>;
  };
  const base = {
    q1: "植物利用養分的環節中斷，循環無法完成",
    q2: "是設計理念",
    q3: "不能，公開資料無法證明",
  };
  assert.equal(grade("M06", { order: correct.order, answers: base }).isCorrect, true);

  // 同義改寫仍應通過
  const paraphrase = {
    q1: "少了植栽吸收養分這段，整條循環就停止",
    q2: "設計概念",
    q3: "無法由官方資料推得",
  };
  assert.equal(grade("M06", { order: correct.order, answers: paraphrase }).isCorrect, true);

  // 把「綠的延伸」說成設備名稱 → 不通過
  const wrongConcept = grade("M06", {
    order: correct.order,
    answers: { ...base, q2: "它是某個魚菜共生設備名稱" },
  });
  assert.equal(wrongConcept.isCorrect, false);
  assert.doesNotMatch(wrongConcept.feedback, /設計理念/);

  // 說「可以證明每一處植栽都接入」→ 不通過
  const overclaim = grade("M06", {
    order: correct.order,
    answers: { ...base, q3: "可以證明每一處植栽都接入同一系統" },
  });
  assert.equal(overclaim.isCorrect, false);

  // 流程順序錯
  assert.equal(grade("M06", { order: [...correct.order].reverse(), answers: base }).isCorrect, false);
});

test("M07 checks the quota before the classification", () => {
  const correct = missionByCode("M07").correctAnswer as Record<string, string>;
  assert.equal(grade("M07", correct).isCorrect, true);

  // 三件放同一處室 → 先回報件數衝突
  const quotaBroken = { ...correct, G: "academic" };
  const quotaResult = grade("M07", quotaBroken);
  assert.equal(quotaResult.isCorrect, false);
  assert.match(quotaResult.feedback, /件數衝突/);

  // 配額正確但分類錯誤
  const misclassified = { ...correct, A: "student", C: "academic" };
  const misclassifiedResult = grade("M07", misclassified);
  assert.equal(misclassifiedResult.isCorrect, false);
  assert.match(misclassifiedResult.feedback, /配額符合/);

  assert.equal(grade("M07", { A: "academic" }).isCorrect, false);
});

test("M08 normalizes full-width text and ignores spaces in the passphrase", () => {
  const correct = missionByCode("M08").correctAnswer as Record<string, string>;
  assert.equal(grade("M08", correct).isCorrect, true);

  assert.equal(
    grade("M08", {
      ...correct,
      founded: "１９４６",
      passphrase: "責任 友誼 服務 愛",
    }).isCorrect,
    true
  );

  assert.equal(grade("M08", { ...correct, motto: "行大我事", literacy: "穩準高遠" }).isCorrect, false);
  assert.equal(grade("M08", { ...correct, passphrase: "愛服務友誼責任" }).isCorrect, false);
  assert.equal(grade("M08", { ...correct, founded: "" }).isCorrect, false);
});

test("normalizeAnswer unifies width, whitespace and punctuation", () => {
  assert.equal(normalizeAnswer(" 穩 準 高 遠 "), "穩準高遠");
  assert.equal(normalizeAnswer("１９４６"), "1946");
  assert.equal(normalizeAnswer("《時光的邀請》，"), "時光的邀請");
  assert.equal(normalizeAnswer(undefined), "");
});

test("no mission leaks its full answer inside failure feedback", () => {
  for (const mission of SEED_MISSIONS) {
    const result = gradeMissionAnswer(mission, null);
    assert.equal(result.isCorrect, false, mission.title);
    assert.ok(result.feedback.trim().length > 0, `${mission.title} must give feedback`);
    assert.doesNotMatch(result.feedback, /time|TODO|undefined/, mission.title);
  }
});
