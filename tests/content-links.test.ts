import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { FINAL_PUZZLE_DATA, PRINTABLE_RESOURCES, SEED_MISSIONS } from "../src/lib/seed-data";
import { TIME_LIMIT_SECONDS, remainingSeconds } from "../src/lib/game-engine";

test("探索限時為 60 分鐘，時間到只回報 0 而不會變成負數", () => {
  assert.equal(TIME_LIMIT_SECONDS, 60 * 60);
  assert.equal(remainingSeconds(0), 3600);
  assert.equal(remainingSeconds(59), 3541);
  assert.equal(remainingSeconds(3599), 1);
  assert.equal(remainingSeconds(3600), 0);
  assert.equal(remainingSeconds(4321), 0);
  assert.equal(remainingSeconds(-10), 3600);
});

test("列印素材清單的所有連結都指向實際存在的站內檔案", () => {
  assert.ok(PRINTABLE_RESOURCES.length >= 3);
  for (const resource of PRINTABLE_RESOURCES) {
    assert.match(resource.href, /^\/printables\//, resource.title);
    assert.ok(existsSync(`public${resource.href}`), `${resource.title} 的檔案必須存在：public${resource.href}`);
    assert.ok(resource.note.trim(), resource.title);
    assert.ok(resource.format.trim(), resource.title);
  }
});

test("每關與終章的資料連結都改指向列印素材，而不是外站網址", () => {
  const hrefs = new Set(PRINTABLE_RESOURCES.map((resource) => resource.href));
  for (const mission of SEED_MISSIONS) {
    assert.ok(hrefs.has(mission.materialUrl), `${mission.code} 應指向站內列印素材`);
    assert.doesNotMatch(mission.materialUrl, /^https?:/, mission.code);
    assert.match(mission.materialTitle, /學生手冊 M0[1-8]/);
  }
  assert.ok(hrefs.has(FINAL_PUZZLE_DATA.materialUrl));
});
