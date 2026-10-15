import { it } from "node:test";
import assert from "node:assert/strict";
import { reviewSchema, reviewPageSchema } from "../src/lib/reviews";

it("validates whole-star ratings and bounded public review fields", () => {
  const valid = { name: " Hana ", rating: 5, comment: " A lovely dish. " };
  assert.deepEqual(reviewSchema.parse(valid), { name: "Hana", rating: 5, comment: "A lovely dish." });
  for (const rating of [0, 6, 2.5, "5", null, Infinity]) {
    assert.equal(reviewSchema.safeParse({ ...valid, rating }).success, false);
  }
  assert.equal(reviewSchema.safeParse({ ...valid, name: " " }).success, false);
  assert.equal(reviewSchema.safeParse({ ...valid, comment: "a".repeat(1501) }).success, false);
});
it("rejects invalid review page numbers", () => {
  for (const page of ["-1", "0", "1.5", "infinity", "10001"]) assert.equal(reviewPageSchema.safeParse(page).success, false);
  assert.equal(reviewPageSchema.parse("2"), 2);
});
