export type MediaKind = "image" | "video";

export interface MatchableDish {
  id: string;
  name: string;
  categoryName?: string;
}

export interface MediaFileCandidate {
  id: string;
  filename: string;
  mimeType?: string;
}

export interface DishMatchResult {
  fileId: string;
  filename: string;
  cleanStem: string;
  mediaKind: MediaKind;
  matchedDishId: string | null;
  matchedDishName: string | null;
  confidence: "high" | "medium" | "low" | "none";
  score: number;
  matchReason: string;
}

const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "webm",
  "mov",
  "m4v",
  "avi",
  "mkv",
  "ogv",
]);

const NOISE_AFFIX_PATTERN =
  /^(?:img|image|photo|pic|dish|menu|item|food|vid|video|clip)[-_]+|[-_]+(?:final|edit|edited|cropped|copy|hd|v\d+|\d+)$|\(\d+\)$/gi;

const FILLER_WORDS = new Set([
  "special",
  "house",
  "signature",
  "fresh",
  "traditional",
  "authentic",
  "homemade",
  "classic",
  "with",
  "and",
  "the",
]);

export function detectMediaKind(filename: string, mimeType?: string): MediaKind {
  if (mimeType) {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("image/")) return "image";
  }
  const extMatch = /\.([a-z0-9]{2,5})$/i.exec(filename.trim());
  if (extMatch && VIDEO_EXTENSIONS.has(extMatch[1].toLowerCase())) {
    return "video";
  }
  return "image";
}

/**
 * Extracts a clean human stem from a filename like "firfir-tibs (1).jpg" or "frfrtbs.img"
 */
export function extractFilenameStem(filename: string): string {
  const base = filename.split(/[\\/]/).pop() || filename;
  // Strip known or generic file extension (.jpg, .png, .img, .mp4, etc.)
  const withoutExt = base.replace(/\.[a-z0-9]{2,5}$/i, "").trim();
  const cleaned = withoutExt
    .replace(/\(\d+\)/g, " ")
    .replace(NOISE_AFFIX_PATTERN, "")
    .replace(NOISE_AFFIX_PATTERN, "")
    .trim();
  return cleaned || withoutExt || base;
}

/**
 * Keeps Unicode letters & numbers (including Amharic/Ethiopic and Latin), lowercased, space-separated tokens.
 */
export function tokenizeNormalized(input: string): string[] {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Compact alphanumeric/letter string with no spaces or separators (e.g. "Firfir-Tibs" -> "firfirtibs")
 */
export function normalizeCompact(input: string): string {
  return tokenizeNormalized(input).join("");
}

/**
 * Builds a vowel-stripped consonant skeleton for Latin strings (e.g. "Firfir Tibs" -> "frfrtbs").
 * Returns empty string if input has fewer than 2 Latin consonants.
 */
export function consonantSkeleton(input: string, collapseAdjacent = false): string {
  const compact = normalizeCompact(input);
  // Keep initial character if entire string is vowels, otherwise strip a,e,i,o,u
  const stripped = compact.replace(/[aeiou]/gi, "");
  if (stripped.length < 2) return "";
  if (!collapseAdjacent) return stripped;
  return stripped.replace(/(.)\1+/g, "$1");
}

/**
 * Checks whether all characters of `needle` appear in `haystack` in order.
 */
function isOrderedSubsequence(needle: string, haystack: string): boolean {
  if (!needle || !haystack || needle.length > haystack.length) return false;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) {
      i++;
    }
  }
  return i === needle.length;
}

/**
 * Sørensen–Dice coefficient on character bigrams (0..1)
 */
function diceSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) {
    return a === b ? 1 : 0;
  }
  const bigramsA = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) {
    const bg = a.slice(i, i + 2);
    bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
  }
  let intersection = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const bg = b.slice(i, i + 2);
    const count = bigramsA.get(bg) || 0;
    if (count > 0) {
      intersection++;
      bigramsA.set(bg, count - 1);
    }
  }
  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}

/**
 * Normalized Levenshtein similarity (0..1)
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return 1 - prev[b.length] / maxLen;
}

/**
 * Generates candidate name variants for a dish (e.g., bilingual "ፉል / Special Ful" -> ["ፉል / Special Ful", "ፉል", "Special Ful", "Ful"])
 */
function getDishNameVariants(dishName: string): { text: string; weight: number }[] {
  const variants: { text: string; weight: number }[] = [{ text: dishName, weight: 1.0 }];

  // Split bilingual or slash/pipe/parenthesis separated names
  const parts = dishName
    .split(/[\/|()]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);

  for (const part of parts) {
    if (part !== dishName) {
      variants.push({ text: part, weight: 0.98 });
    }
    const tokens = tokenizeNormalized(part);
    const coreTokens = tokens.filter((t) => !FILLER_WORDS.has(t));
    if (coreTokens.length > 0 && coreTokens.length < tokens.length) {
      variants.push({ text: coreTokens.join(" "), weight: 0.94 });
    }
  }

  const fullTokens = tokenizeNormalized(dishName);
  const fullCore = fullTokens.filter((t) => !FILLER_WORDS.has(t));
  if (fullCore.length > 0 && fullCore.length < fullTokens.length) {
    variants.push({ text: fullCore.join(" "), weight: 0.94 });
  }

  return variants;
}

export function scoreFilenameAgainstDish(
  filename: string,
  dishName: string
): { score: number; reason: string } {
  const stem = extractFilenameStem(filename);
  const fileCompact = normalizeCompact(stem);
  const fileTokens = tokenizeNormalized(stem);
  const fileSkel = consonantSkeleton(stem, false);
  const fileSkelCollapsed = consonantSkeleton(stem, true);

  if (!fileCompact) {
    return { score: 0, reason: "Empty filename" };
  }

  let bestScore = 0;
  let bestReason = "No match";

  const updateBest = (score: number, reason: string) => {
    if (score > bestScore) {
      bestScore = score;
      bestReason = reason;
    }
  };

  for (const variant of getDishNameVariants(dishName)) {
    const dishCompact = normalizeCompact(variant.text);
    const dishTokens = tokenizeNormalized(variant.text);
    const dishSkel = consonantSkeleton(variant.text, false);
    const dishSkelCollapsed = consonantSkeleton(variant.text, true);

    if (!dishCompact) continue;

    // 1. Exact compact match (e.g., "firfirtibs" or "firfir-tibs" === "Firfir Tibs")
    if (fileCompact === dishCompact) {
      updateBest(1.0 * variant.weight, "Exact name match");
      continue;
    }

    // 2. Exact consonant skeleton match (e.g., "frfrtbs" === "Firfir Tibs")
    if (fileSkel.length >= 3 && dishSkel.length >= 3) {
      if (fileSkel === dishSkel) {
        updateBest(0.95 * variant.weight, "Consonant / shorthand match");
      } else if (
        fileSkelCollapsed.length >= 3 &&
        fileSkelCollapsed === dishSkelCollapsed
      ) {
        updateBest(0.92 * variant.weight, "Consonant shorthand match");
      }
    }

    // 3. Ordered consonant subsequence (e.g. "frftbs" inside "frfrtbs")
    if (
      fileSkel.length >= 4 &&
      dishSkel.length >= 4 &&
      isOrderedSubsequence(fileSkel, dishSkel)
    ) {
      const ratio = fileSkel.length / dishSkel.length;
      if (ratio >= 0.65) {
        updateBest((0.78 + ratio * 0.14) * variant.weight, "Abbreviation match");
      }
    }

    // 4. Substring containment (e.g. "firfirtibs_large" or "tibs" in "Firfir Tibs")
    if (fileCompact.length >= 4 && dishCompact.length >= 4) {
      if (dishCompact.includes(fileCompact) || fileCompact.includes(dishCompact)) {
        const shorter = Math.min(fileCompact.length, dishCompact.length);
        const longer = Math.max(fileCompact.length, dishCompact.length);
        const coverage = shorter / longer;
        if (coverage >= 0.5) {
          updateBest((0.75 + coverage * 0.2) * variant.weight, "Partial name match");
        }
      }
    }

    // 5. Token-level overlap (e.g. "tibs-firfir" vs "Firfir Tibs")
    if (fileTokens.length > 0 && dishTokens.length > 0) {
      let matchedTokens = 0;
      for (const ft of fileTokens) {
        if (
          dishTokens.some(
            (dt) =>
              dt === ft ||
              (ft.length >= 3 && dt.length >= 3 && consonantSkeleton(ft) === consonantSkeleton(dt)) ||
              (ft.length >= 4 && (dt.startsWith(ft) || ft.startsWith(dt)))
          )
        ) {
          matchedTokens++;
        }
      }
      if (matchedTokens > 0) {
        const tokenPrecision = matchedTokens / fileTokens.length;
        const tokenRecall = matchedTokens / dishTokens.length;
        const f1 = (2 * tokenPrecision * tokenRecall) / (tokenPrecision + tokenRecall);
        if (f1 >= 0.5) {
          updateBest((0.68 + f1 * 0.26) * variant.weight, "Word match");
        }
      }
    }

    // 6. Fuzzy similarity (Dice bigrams + Levenshtein on both full string and consonant skeleton)
    const compactDice = diceSimilarity(fileCompact, dishCompact);
    const compactLev = levenshteinSimilarity(fileCompact, dishCompact);
    const fuzzyCompact = Math.max(compactDice, compactLev);
    if (fuzzyCompact >= 0.62) {
      updateBest(fuzzyCompact * 0.9 * variant.weight, "Fuzzy spelling match");
    }

    if (fileSkel.length >= 3 && dishSkel.length >= 3) {
      const skelLev = levenshteinSimilarity(fileSkel, dishSkel);
      if (skelLev >= 0.72) {
        updateBest(skelLev * 0.88 * variant.weight, "Fuzzy shorthand match");
      }
    }
  }

  return {
    score: Math.round(bestScore * 1000) / 1000,
    reason: bestReason,
  };
}

/**
 * Matches a batch of uploaded media files (images & videos) against a list of menu dishes.
 */
export function matchMediaFilesToDishes(
  files: MediaFileCandidate[],
  dishes: MatchableDish[],
  minThreshold = 0.45
): DishMatchResult[] {
  return files.map((file) => {
    const mediaKind = detectMediaKind(file.filename, file.mimeType);
    const cleanStem = extractFilenameStem(file.filename);

    let bestDish: MatchableDish | null = null;
    let bestScore = 0;
    let bestReason = "No close match found";

    for (const dish of dishes) {
      if (!dish.name || !dish.name.trim()) continue;
      const { score, reason } = scoreFilenameAgainstDish(file.filename, dish.name);
      if (score > bestScore) {
        bestScore = score;
        bestDish = dish;
        bestReason = reason;
      }
    }

    if (!bestDish || bestScore < minThreshold) {
      return {
        fileId: file.id,
        filename: file.filename,
        cleanStem,
        mediaKind,
        matchedDishId: null,
        matchedDishName: null,
        confidence: "none",
        score: bestScore,
        matchReason: "Unmatched — select dish manually",
      };
    }

    const confidence: DishMatchResult["confidence"] =
      bestScore >= 0.82 ? "high" : bestScore >= 0.62 ? "medium" : "low";

    return {
      fileId: file.id,
      filename: file.filename,
      cleanStem,
      mediaKind,
      matchedDishId: bestDish.id,
      matchedDishName: bestDish.name,
      confidence,
      score: bestScore,
      matchReason: bestReason,
    };
  });
}
