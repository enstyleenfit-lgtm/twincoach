import type { ExerciseMaster } from "@/lib/exerciseMaster";

const NAME_PREFIX = 200;
const KEYWORD_PREFIX = 160;
const EQUIP_PREFIX = 140;
const PART_PREFIX = 130;
const CATEGORY_PREFIX = 110;
const NAME_SUB = 90;
const KEYWORD_SUB = 75;
const EQUIP_SUB = 65;
const PART_SUB = 55;
const CATEGORY_SUB = 45;

function scoreField(
  value: string,
  query: string,
  prefixWeight: number,
  subWeight: number
): number {
  if (!value || !query) return 0;
  if (value.startsWith(query)) return prefixWeight;
  if (value.includes(query)) return subWeight;
  const vl = value.toLowerCase();
  const ql = query.toLowerCase();
  if (vl.startsWith(ql)) return prefixWeight - 5;
  if (vl.includes(ql)) return subWeight - 5;
  return 0;
}

/**
 * 種目名・searchKeywords・器具・部位・カテゴリからスコアを付与。
 * 前方一致を部分一致より高くし、種目名を最優先。
 */
export function scoreExerciseMaster(master: ExerciseMaster, rawQuery: string): number {
  const query = rawQuery.trim();
  if (!query) return 0;

  let max = 0;
  max = Math.max(max, scoreField(master.name, query, NAME_PREFIX, NAME_SUB));

  for (const kw of master.searchKeywords) {
    max = Math.max(max, scoreField(kw, query, KEYWORD_PREFIX, KEYWORD_SUB));
  }

  max = Math.max(max, scoreField(master.equipment, query, EQUIP_PREFIX, EQUIP_SUB));
  max = Math.max(max, scoreField(master.bodyPart, query, PART_PREFIX, PART_SUB));
  max = Math.max(max, scoreField(master.category, query, CATEGORY_PREFIX, CATEGORY_SUB));

  return max;
}

/**
 * 1文字以上でヒット。前方一致優先（スコア）、同点は sortOrder。
 */
export function searchExercises(
  masters: ExerciseMaster[],
  rawQuery: string,
  limit = 14
): ExerciseMaster[] {
  const q = rawQuery.trim();
  if (q.length < 1) return [];

  return masters
    .map((m) => ({ m, s: scoreExerciseMaster(m, q) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.m.sortOrder - b.m.sortOrder || a.m.name.localeCompare(b.m.name, "ja"))
    .slice(0, limit)
    .map((x) => x.m);
}
