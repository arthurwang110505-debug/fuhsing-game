import assert from "node:assert/strict";
import { test } from "node:test";

import { ANSWER_SHEETS, findMissingFields, getAnswerSheet } from "../src/lib/answer-sheets";
import { SEED_MISSIONS } from "../src/lib/seed-data";
import { gradeMissionAnswer } from "../src/lib/game-engine";

/**
 * 紙本線索卡 → 系統作答表 的一致性測試。
 *
 * 網站已不顯示題目資料，學生只能靠手冊線索卡作答；因此作答表必須：
 * 1. 每一關都存在，且欄位代號唯一；
 * 2. 依正解填寫作答表後，能組出「全對」的送審物件（代表欄位與評分器對得上）；
 * 3. 空表一定被判為未完成（不能靠空白送審過關）。
 */

function correctValues(missionId: number): Record<string, string> {
  const mission = SEED_MISSIONS.find((item) => item.id === missionId);
  assert.ok(mission, `找不到任務 ${missionId}`);
  const answer = mission.correctAnswer as Record<string, unknown>;
  const values: Record<string, string> = {};

  switch (mission.puzzleType) {
    case "evidence-classify": {
      const { placement, lock } = answer as { placement: Record<string, string>; lock: string };
      for (const [cardId, column] of Object.entries(placement)) values[`place_${cardId}`] = column;
      values.lock = lock;
      break;
    }
    case "acrostic-select":
    case "logic-grid":
    case "office-quota": {
      for (const [key, value] of Object.entries(answer)) values[key] = String(value);
      break;
    }
    case "timeline-years": {
      const { order, years } = answer as { order: string[]; years: Record<string, string> };
      order.forEach((id, index) => {
        values[`rank_${id}`] = String(index + 1);
        values[`year_${id}`] = years[id];
      });
      break;
    }
    case "emblem-layers": {
      const { pairs, code } = answer as { pairs: Record<string, string>; code: string };
      for (const [componentId, meaningId] of Object.entries(pairs)) values[componentId] = meaningId;
      values.code = code;
      break;
    }
    case "cycle-flow": {
      const { order, answers } = answer as { order: string[]; answers: Record<string, string> };
      order.forEach((nodeId, index) => {
        values[`step_${index + 1}`] = nodeId;
      });
      for (const [questionId, text] of Object.entries(answers)) values[questionId] = text;
      break;
    }
    case "final-crosscheck": {
      for (const [key, value] of Object.entries(answer)) {
        if (typeof value === "string") values[key] = value;
      }
      break;
    }
    default:
      throw new Error(`未處理的題型：${mission.puzzleType}`);
  }

  return values;
}

test("每關都有作答表，代號與正解欄位對得上", () => {
  assert.equal(ANSWER_SHEETS.length, SEED_MISSIONS.length);
  for (const mission of SEED_MISSIONS) {
    const sheet = getAnswerSheet(mission.id);
    assert.ok(sheet, `${mission.code} 缺少作答表`);
    assert.equal(sheet.code, mission.code);
    assert.ok(sheet.cardTitle.includes(mission.code), `${mission.code} 線索卡標題要含關卡代號`);
    assert.ok(sheet.supplies.length >= 2, `${mission.code} 要列出紙本提供哪些線索`);
    assert.ok(sheet.fields.length > 0, `${mission.code} 至少要有一個作答欄`);
    const ids = sheet.fields.map((field) => field.id);
    assert.equal(new Set(ids).size, ids.length, `${mission.code} 作答欄 id 不可重複`);
    for (const field of sheet.fields) {
      assert.ok(field.label.trim().length > 0, `${mission.code} 作答欄要有名稱`);
      if (field.kind === "select") {
        assert.ok((field.options ?? []).length > 0, `${mission.code}／${field.label} 下拉選單要有選項`);
      }
    }
  }
});

test("依正解填寫作答表可通過評分（紙本答案 → 系統答案）", () => {
  for (const mission of SEED_MISSIONS) {
    const sheet = getAnswerSheet(mission.id);
    assert.ok(sheet);
    const values = correctValues(mission.id);
    assert.deepEqual(findMissingFields(sheet, values), [], `${mission.code} 正解不應有缺漏欄位`);
    const graded = gradeMissionAnswer(mission, sheet.build(values));
    assert.equal(graded.isCorrect, true, `${mission.code} 作答表組出的答案應判為正確：${graded.feedback}`);
  }
});

test("空白作答表不會過關", () => {
  for (const mission of SEED_MISSIONS) {
    const sheet = getAnswerSheet(mission.id);
    assert.ok(sheet);
    const missing = findMissingFields(sheet, {});
    assert.ok(missing.length > 0, `${mission.code} 空表應偵測到未填欄位`);
    assert.equal(gradeMissionAnswer(mission, sheet.build({})).isCorrect, false, `${mission.code} 空表不可過關`);
  }
});
