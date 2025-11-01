// Medicine Match Service

import {
  MedicineMatch,
  PharmacyMedicineWithDetails,
} from "@/types/scanner-types";
import {
  calculateMatchConfidence,
  extractPotentialNames,
  getMatchType,
  normalizeText,
} from "@/utils/text-matching.utils";

class MedicineMatchService {
  /**
   * Find matching medicines from extracted OCR text
   */
  async findMatches(
    extractedText: string,
    medicines: PharmacyMedicineWithDetails[]
  ): Promise<MedicineMatch[]> {
    if (!extractedText || extractedText.trim().length === 0) {
      return [];
    }

    console.log("Finding medicine matches for text:", extractedText);

    // Extract potential medicine names from OCR text
    const potentialNames = extractPotentialNames(extractedText);

    // Also include the full text for matching
    const searchTerms = [extractedText, ...potentialNames];

    // Find matches for each search term
    const allMatches: MedicineMatch[] = [];

    for (const searchTerm of searchTerms) {
      for (const medicine of medicines) {
        // Match against medicine name
        const nameConfidence = calculateMatchConfidence(
          searchTerm,
          medicine.name
        );

        // Take the highest confidence score
        const confidence = Math.max(nameConfidence);

        // Only include matches with confidence >= 60%
        if (confidence >= 60) {
          allMatches.push({
            medicine,
            confidence,
            matchedText: medicine.name,
            matchType: getMatchType(confidence),
          });
        }
        console.log(allMatches, "allMatches");
      }
    }

    // Remove duplicates (same medicine matched multiple times)
    const uniqueMatches = this._removeDuplicates(allMatches);

    // Sort by confidence (highest first)
    uniqueMatches.sort((a, b) => b.confidence - a.confidence);

    // Return top 5 matches
    const topMatches = uniqueMatches.slice(0, 5);

    console.log(`Found ${topMatches.length} matches`);
    topMatches.forEach((match) => {
      console.log(
        `- ${match.medicine.name} (${match.confidence}% - ${match.matchType})`
      );
    });

    return topMatches;
  }

  /**
   * Search for a specific medicine by name
   */
  async searchByName(
    searchTerm: string,
    medicines: PharmacyMedicineWithDetails[]
  ): Promise<MedicineMatch[]> {
    const matches: MedicineMatch[] = [];

    const normalizedSearch = normalizeText(searchTerm);

    for (const medicine of medicines) {
      const confidence = calculateMatchConfidence(searchTerm, medicine.name);

      if (confidence >= 60) {
        matches.push({
          medicine,
          confidence,
          matchedText: medicine.name,
          matchType: getMatchType(confidence),
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  /**
   * Remove duplicate matches (keep highest confidence for each medicine)
   */
  private _removeDuplicates(matches: MedicineMatch[]): MedicineMatch[] {
    const medicineMap = new Map<string, MedicineMatch>();

    for (const match of matches) {
      const medicineId = match.medicine.id;
      const existing = medicineMap.get(medicineId);

      // Keep the match with higher confidence
      if (!existing || match.confidence > existing.confidence) {
        medicineMap.set(medicineId, match);
      }
    }

    return Array.from(medicineMap.values());
  }

  /**
   * Get confidence color for UI display
   */
  getConfidenceColor(confidence: number): string {
    if (confidence >= 90) return "text-green-600";
    if (confidence >= 70) return "text-yellow-600";
    return "text-orange-600";
  }

  /**
   * Get confidence badge variant
   */
  getConfidenceBadgeVariant(
    confidence: number
  ): "default" | "secondary" | "destructive" | "outline" {
    if (confidence >= 90) return "default";
    if (confidence >= 70) return "secondary";
    return "outline";
  }
}

// Export singleton instance
export const medicineMatchService = new MedicineMatchService();
