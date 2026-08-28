const ROMAN_NUMERALS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** Converts a mastery level (1, 2, 3, ...) to its Roman numeral for display
 * alongside a mastery title, e.g. "Prodigy II". */
export function toRoman(num: number): string {
  let result = "";
  for (const [value, numeral] of ROMAN_NUMERALS) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}
