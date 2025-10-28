// Text Matching Utilities

/**
 * Normalize text for comparison
 * - Convert to lowercase
 * - Remove special characters
 * - Remove extra whitespace
 * - Trim
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * Calculate match confidence between extracted text and medicine name
 * Returns a score from 0-100
 */
export function calculateMatchConfidence(
  extractedText: string,
  medicineName: string
): number {
  // Normalize both strings
  const normalized1 = normalizeText(extractedText);
  const normalized2 = normalizeText(medicineName);

  // Check exact match
  if (normalized1 === normalized2) return 100;

  // Check if medicine name is contained in extracted text
  if (normalized1.includes(normalized2)) {
    // Higher confidence if it's a word boundary match
    const regex = new RegExp(`\\b${normalized2}\\b`);
    if (regex.test(normalized1)) {
      return 95;
    }
    return 85;
  }

  // Check if extracted text is contained in medicine name
  if (normalized2.includes(normalized1)) {
    return 80;
  }

  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  // Avoid division by zero
  if (maxLength === 0) return 0;

  // Calculate similarity percentage
  const similarity = (1 - distance / maxLength) * 100;

  // Only return positive scores
  return Math.max(0, Math.round(similarity));
}

/**
 * Extract potential medicine names from OCR text
 * Splits text into words and filters out common noise
 */
export function extractPotentialNames(ocrText: string): string[] {
  // Common words to filter out
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "tablet",
    "tablets",
    "capsule",
    "capsules",
    "syrup",
    "injection",
    "mg",
    "ml",
    "gm",
    "pack",
    "strip",
    "bottle",
  ]);

  // Split into words and filter
  const words = ocrText
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => {
      // Remove special characters
      const cleaned = word.replace(/[^a-z0-9]/g, "");
      // Keep words that are at least 3 characters and not stop words
      return cleaned.length >= 3 && !stopWords.has(cleaned);
    });

  // Also include multi-word combinations (2-3 words)
  const combinations: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    combinations.push(`${words[i]} ${words[i + 1]}`);
    if (i < words.length - 2) {
      combinations.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
  }

  return [...words, ...combinations];
}

/**
 * Determine match type based on confidence score
 */
export function getMatchType(confidence: number): "exact" | "fuzzy" | "partial" {
  if (confidence >= 95) return "exact";
  if (confidence >= 70) return "fuzzy";
  return "partial";
}

/**
 * Clean OCR text by removing common OCR artifacts
 */
export function cleanOCRText(text: string): string {
  return (
    text
      // Remove common OCR artifacts
      .replace(/[|\\\/]/g, "")
      // Fix common OCR mistakes
      .replace(/0/g, "O") // Zero to O in medicine names
      .replace(/1/g, "I") // One to I in some contexts
      // Remove extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}
