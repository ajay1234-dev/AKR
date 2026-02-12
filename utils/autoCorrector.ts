// Common spelling corrections for automotive/mechanic context
const CORRECTION_DICTIONARY: Record<string, string> = {
  // Common misspellings
  engne: "engine",
  chenge: "change",
  lubricant: "lubricant",
  brake: "brake",
  tyre: "tire",
  wiper: "wiper",
  filter: "filter",
  battery: "battery",
  alternator: "alternator",
  starter: "starter",
  compressor: "compressor",
  radiator: "radiator",
  clutch: "clutch",
  transmission: "transmission",
  suspension: "suspension",
  alignment: "alignment",
  balancing: "balancing",
  servicing: "servicing",
  repair: "repair",
  replacement: "replacement",
  installation: "installation",
  checking: "checking",
  inspection: "inspection",
  diagnosis: "diagnosis",
  troubleshooting: "troubleshooting",

  // Quantity words
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",

  // Units
  litre: "liter",
  litres: "liters",
  kilogram: "kg",
  kilograms: "kgs",
  piece: "pcs",
  pieces: "pcs",
  set: "set",
  sets: "sets",

  // Common phrases
  "oil change": "oil change",
  "engine oil": "engine oil",
  "brake pad": "brake pad",
  "air filter": "air filter",
  "oil filter": "oil filter",
  "fuel filter": "fuel filter",
  "spark plug": "spark plug",
  "wiper blade": "wiper blade",
  "tyre pressure": "tire pressure",
  "wheel alignment": "wheel alignment",
  "wheel balancing": "wheel balancing",
};

// Words that should be capitalized (proper nouns, brands, etc.)
const CAPITALIZE_WORDS = new Set([
  "BMW",
  "Mercedes",
  "Audi",
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Volkswagen",
  "Hyundai",
  "Nissan",
  "Maruti",
  "Tata",
  "Mahindra",
  "Suzuki",
  "Renault",
  "Skoda",
  "Volkswagen",
  "Jeep",
  "Kia",
]);

export class TextAutoCorrector {
  static correctText(text: string): string {
    if (!text || text.trim() === "") return text;

    let correctedText = text.trim();

    // Apply dictionary corrections
    Object.keys(CORRECTION_DICTIONARY).forEach((misspelled) => {
      const corrected = CORRECTION_DICTIONARY[misspelled];
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${misspelled}\\b`, "gi");
      correctedText = correctedText.replace(regex, corrected);
    });

    // Normalize spacing
    correctedText = correctedText.replace(/\s+/g, " ");

    // Capitalize first letter of sentences
    correctedText = correctedText.replace(/(^\w|\.\s+\w)/g, (match) =>
      match.toUpperCase()
    );

    // Capitalize proper nouns
    CAPITALIZE_WORDS.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      correctedText = correctedText.replace(regex, word);
    });

    // Clean up common punctuation issues
    correctedText = correctedText
      .replace(/\s+([,.!?;:])/g, "$1") // Remove space before punctuation
      .replace(/([,.!?;:])\s*/g, "$1 ") // Ensure space after punctuation
      .replace(/\s+/g, " ") // Normalize multiple spaces
      .trim();

    return correctedText;
  }

  static extractQuantity(text: string): {
    quantity: number;
    remainingText: string;
  } {
    const quantityPatterns = [
      /(\d+)\s*(?:liter|litre|l|kg|kilogram|piece|pcs|set)/i,
      /(one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:liter|litre|l|kg|kilogram|piece|pcs|set)/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = text.match(pattern);
      if (match) {
        let quantity = 1;
        if (match[1]) {
          // Convert word numbers to digits
          const wordToNum: Record<string, number> = {
            one: 1,
            two: 2,
            three: 3,
            four: 4,
            five: 5,
            six: 6,
            seven: 7,
            eight: 8,
            nine: 9,
            ten: 10,
          };

          quantity =
            wordToNum[match[1].toLowerCase()] || parseInt(match[1]) || 1;
        }

        // Remove the matched part from text
        const remainingText = text.replace(pattern, "").trim();
        return { quantity, remainingText };
      }
    }

    return { quantity: 1, remainingText: text };
  }

  static extractUnit(text: string): { unit: string; remainingText: string } {
    const unitPatterns: Record<string, RegExp> = {
      liter: /(?:\d+\s*)?(liter|litre|l)\b/i,
      kg: /(?:\d+\s*)?(kg|kilogram|kilograms)\b/i,
      pcs: /(?:\d+\s*)?(piece|pieces|pcs|pc)\b/i,
      set: /(?:\d+\s*)?(set|sets)\b/i,
    };

    for (const [unit, pattern] of Object.entries(unitPatterns)) {
      const match = text.match(pattern);
      if (match) {
        const remainingText = text.replace(pattern, "").trim();
        return { unit, remainingText };
      }
    }

    return { unit: "pcs", remainingText: text };
  }

  static parseItemInput(text: string): {
    itemName: string;
    quantity: number;
    unit: string;
  } {
    // First extract quantity
    const { quantity, remainingText: afterQuantity } =
      this.extractQuantity(text);

    // Then extract unit
    const { unit, remainingText: afterUnit } = this.extractUnit(afterQuantity);

    // What's left is the item name
    let itemName = afterUnit.trim();

    // Apply auto-correction to item name
    itemName = this.correctText(itemName);

    return {
      itemName: itemName || "Unknown Item",
      quantity,
      unit,
    };
  }
}

// Export a simple function for easy usage
export const autoCorrectText = (text: string): string => {
  return TextAutoCorrector.correctText(text);
};

export const parseVoiceItem = (
  text: string
): {
  itemName: string;
  quantity: number;
  unit: string;
} => {
  return TextAutoCorrector.parseItemInput(text);
};
