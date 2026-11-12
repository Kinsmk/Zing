/**
 * Unicode - Support Unicode pour Zinga
 * 
 * Ce module fournit des utilitaires pour gérer les caractères Unicode
 * dans le lexer et le parser.
 */

/**
 * Catégories de caractères Unicode
 */
export enum UnicodeCategory {
  LETTER = 'LETTER',
  DIGIT = 'DIGIT',
  WHITESPACE = 'WHITESPACE',
  PUNCTUATION = 'PUNCTUATION',
  SYMBOL = 'SYMBOL',
  OTHER = 'OTHER',
}

/**
 * Informations sur un caractère Unicode
 */
export interface UnicodeCharInfo {
  char: string;
  code: number;
  name: string;
  category: UnicodeCategory;
  isLetter: boolean;
  isDigit: boolean;
  isWhitespace: boolean;
  isIdentifierStart: boolean;
  isIdentifierChar: boolean;
}

/**
 * Plages de caractères Unicode
 */
const UNICODE_RANGES = {
  // Lettres
  LETTERS: [
    [0x0041, 0x005A], // A-Z
    [0x0061, 0x007A], // a-z
    [0x00C0, 0x00D6], // Latin-1 Supplement (A-Grave à Ö)
    [0x00D8, 0x00F6], // Latin-1 Supplement (Ø à ö)
    [0x00F8, 0x017F], // Latin-1 Supplement (ø à ſ)
    [0x0180, 0x024F], // Latin Extended-B
    [0x0250, 0x02AF], // IPA Extensions
    [0x0300, 0x036F], // Combining Diacritical Marks
    [0x0370, 0x03FF], // Greek and Coptic
    [0x0400, 0x04FF], // Cyrillic
    [0x0500, 0x052F], // Cyrillic Supplement
    [0x0530, 0x058F], // Armenian
    [0x0590, 0x05FF], // Hebrew
    [0x0600, 0x06FF], // Arabic
    [0x0700, 0x074F], // Syriac
    [0x0780, 0x07BF], // Thaana
    [0x0900, 0x097F], // Devanagari
    [0x0980, 0x09FF], // Bengali
    [0x0A00, 0x0A7F], // Gurmukhi
    [0x0A80, 0x0AFF], // Gujarati
    [0x0B00, 0x0B7F], // Oriya
    [0x0B80, 0x0BFF], // Tamil
    [0x0C00, 0x0C7F], // Telugu
    [0x0C80, 0x0CFF], // Kannada
    [0x0D00, 0x0D7F], // Malayalam
    [0x0D80, 0x0DFF], // Sinhala
    [0x0E00, 0x0E7F], // Thai
    [0x0E80, 0x0EFF], // Lao
    [0x0F00, 0x0FFF], // Tibetan
    [0x1000, 0x109F], // Myanmar
    [0x10A0, 0x10FF], // Georgian
    [0x1100, 0x11FF], // Hangul Jamo
    [0x1200, 0x137F], // Ethiopic
    [0x13A0, 0x13FF], // Cherokee
    [0x1400, 0x167F], // Unified Canadian Aboriginal Syllabics
    [0x1680, 0x169F], // Ogham
    [0x16A0, 0x16FF], // Runic
    [0x1700, 0x171F], // Tagalog
    [0x1720, 0x173F], // Hanunoo
    [0x1740, 0x175F], // Buhid
    [0x1760, 0x177F], // Tagbanwa
    [0x1780, 0x17FF], // Khmer
    [0x1800, 0x18AF], // Mongolian
    [0x1E00, 0x1EFF], // Latin Extended Additional
    [0x1F00, 0x1FFF], // Greek Extended
    [0x2000, 0x206F], // General Punctuation
    [0x2070, 0x209F], // Superscripts and Subscripts
    [0x20A0, 0x20CF], // Currency Symbols
    [0x20D0, 0x20FF], // Combining Diacritical Marks for Symbols
    [0x2100, 0x214F], // Letterlike Symbols
    [0x2150, 0x218F], // Number Forms
    [0x2190, 0x21FF], // Arrows
    [0x2200, 0x22FF], // Mathematical Operators
    [0x2300, 0x23FF], // Miscellaneous Technical
    [0x2400, 0x243F], // Control Pictures
    [0x2440, 0x245F], // Optical Character Recognition
    [0x2460, 0x24FF], // Enclosed Alphanumerics
    [0x2500, 0x257F], // Box Drawing
    [0x2580, 0x259F], // Block Elements
    [0x25A0, 0x25FF], // Geometric Shapes
    [0x2600, 0x26FF], // Miscellaneous Symbols
    [0x2700, 0x27BF], // Dingbats
    [0x27C0, 0x27EF], // Miscellaneous Mathematical Symbols-A
    [0x27F0, 0x27FF], // Supplemental Arrows-A
    [0x2800, 0x28FF], // Braille Patterns
    [0x2900, 0x297F], // Supplemental Arrows-B
    [0x2980, 0x29FF], // Miscellaneous Mathematical Symbols-B
    [0x2A00, 0x2AFF], // Supplemental Mathematical Operators
    [0x2B00, 0x2BFF], // Miscellaneous Symbols and Arrows
    [0x3000, 0x303F], // CJK Symbols and Punctuation
    [0x3040, 0x309F], // Hiragana
    [0x30A0, 0x30FF], // Katakana
    [0x3100, 0x312F], // Bopomofo
    [0x3130, 0x318F], // Hangul Compatibility Jamo
    [0x3190, 0x319F], // Kanbun
    [0x31A0, 0x31BF], // Bopomofo Extended
    [0x3200, 0x32FF], // Enclosed CJK Letters and Months
    [0x3300, 0x33FF], // CJK Compatibility
    [0x3400, 0x4DBF], // CJK Unified Ideographs Extension A
    [0x4DC0, 0x4DFF], // Yijing Hexagram Symbols
    [0x4E00, 0x9FFF], // CJK Unified Ideographs
    [0xA000, 0xA48F], // Yi Syllables
    [0xA490, 0xA4CF], // Yi Radicals
    [0xAC00, 0xD7AF], // Hangul Syllables
    [0xD800, 0xDB7F], // High Surrogates
    [0xDB80, 0xDBFF], // High Private Use Surrogates
    [0xDC00, 0xDFFF], // Low Surrogates
    [0xE000, 0xF8FF], // Private Use Area
    [0xF900, 0xFAFF], // CJK Compatibility Ideographs
    [0xFB00, 0xFB4F], // Alphabetic Presentation Forms
    [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
    [0xFE00, 0xFE0F], // Variation Selectors
    [0xFE20, 0xFE2F], // Combining Half Marks
    [0xFE30, 0xFE4F], // CJK Compatibility Forms
    [0xFE50, 0xFE6F], // Small Form Variants
    [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
    [0xFF00, 0xFFEF], // Halfwidth and Fullwidth Forms
    [0xFFF0, 0xFFFF], // Specials
  ],

  // Chiffres
  DIGITS: [
    [0x0030, 0x0039], // 0-9
    [0x0660, 0x0669], // Chiffres arabes
    [0x06F0, 0x06F9], // Chiffres arabes étendus
    [0x0966, 0x096F], // Chiffres devanagari
    [0x09E6, 0x09EF], // Chiffres bengali
    [0x0A66, 0x0A6F], // Chiffres gurmukhi
    [0x0AE6, 0x0AEF], // Chiffres gujarati
    [0x0B66, 0x0B6F], // Chiffres oriya
    [0x0BE6, 0x0BEF], // Chiffres tamouls
    [0x0C66, 0x0C6F], // Chiffres telugu
    [0x0CE6, 0x0CEF], // Chiffres kannada
    [0x0D66, 0x0D6F], // Chiffres malayalam
    [0x0DE6, 0x0DEF], // Chiffres sinhala
    [0x0E50, 0x0E59], // Chiffres thaï
    [0x0ED0, 0x0ED9], // Chiffres laotiens
    [0x0F20, 0x0F29], // Chiffres tibétains
    [0x1040, 0x1049], // Chiffres myanmars
    [0x1090, 0x1099], // Chiffres myanmars shan
    [0x17E0, 0x17E9], // Chiffres khmers
    [0x1810, 0x1819], // Chiffres mongols
    [0x1946, 0x194F], // Chiffres limbu
    [0x19D0, 0x19D9], // Chiffres newa
    [0x1A80, 0x1A89], // Chiffres tai tham hora
    [0x1A90, 0x1A99], // Chiffres tai tham tham
    [0x1B50, 0x1B59], // Chiffres balinais
    [0x1BB0, 0x1BB9], // Chiffres sundanais
    [0x1C40, 0x1C49], // Chiffres lepccha
    [0x1C50, 0x1C59], // Chiffres ol chiki
    [0x2160, 0x2188], // Chiffres romains
    [0x2460, 0x249B], // Chiffres en cercles
    [0x24EA, 0x24FF], // Chiffres en doubles cercles
    [0x2776, 0x2793], // Chiffres en parenthèses
    [0x2CFD, 0x2CFD], // Symbole copte
    [0x3021, 0x3029], // Chiffres en cercles chinois
    [0x3030, 0x3039], // Chiffres en cercles chinois alternatifs
    [0x3192, 0x3195], // Chiffres en cercles kanbun
    [0x3220, 0x3229], // Chiffres en cercles chinois
    [0x3248, 0x324F], // Chiffres en cercles
    [0x3251, 0x325F], // Chiffres en cercles
    [0x3280, 0x3289], // Chiffres en cercles
    [0x32B1, 0x32BF], // Chiffres en cercles
    [0xA620, 0xA629], // Chiffres vah
    [0xA6E6, 0xA6EF], // Chiffres bamum
    [0xA8D0, 0xA8D9], // Chiffres sahidiques
    [0xA900, 0xA909], // Chiffres kayah li
    [0xA9D0, 0xA9D9], // Chiffres javanais
    [0xA9F0, 0xA9F9], // Chiffres myanmars tai laing
    [0xAA50, 0xAA59], // Chiffres cham
    [0xABF0, 0xABF9], // Chiffres meetei mayek
    [0xFF10, 0xFF19], // Chiffres pleines largeurs
  ],

  // Espaces blancs
  WHITESPACES: [
    0x0009, // Tabulation
    0x000A, // Nouvelle ligne
    0x000B, // Tabulation verticale
    0x000C, // Saut de page
    0x000D, // Retour chariot
    0x0020, // Espace
    0x0085, // Suivant ligne
    0x00A0, // Espace insécable
    0x1680, // Espace ogham
    0x2000, // Espace énquadré
    0x2001, // Espace ém
    0x2002, // Espace en
    0x2003, // Espace ém
    0x2004, // Espace trois per em
    0x2005, // Espace quatre per em
    0x2006, // Espace six per em
    0x2007, // Espace figure
    0x2008, // Espace ponctuation
    0x2009, // Espace fine
    0x200A, // Espace fine
    0x2028, // Séparateur de ligne
    0x2029, // Séparateur de paragraphe
    0x202F, // Espace insécable étroit
    0x205F, // Espace moyen mathématique
    0x3000, // Espace idéographique
  ],
};

/**
 * Vérifier si un caractère est une lettre Unicode
 */
export function isUnicodeLetter(char: string): boolean {
  const code = char.charCodeAt(0);
  
  for (const [start, end] of UNICODE_RANGES.LETTERS) {
    if (code >= start && code <= end) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifier si un caractère est un chiffre Unicode
 */
export function isUnicodeDigit(char: string): boolean {
  const code = char.charCodeAt(0);
  
  for (const [start, end] of UNICODE_RANGES.DIGITS) {
    if (code >= start && code <= end) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifier si un caractère est un espace blanc Unicode
 */
export function isUnicodeWhitespace(char: string): boolean {
  const code = char.charCodeAt(0);
  return UNICODE_RANGES.WHITESPACES.includes(code);
}

/**
 * Vérifier si un caractère peut commencer un identifiant
 */
export function isUnicodeIdentifierStart(char: string): boolean {
  return isUnicodeLetter(char) || char === '_' || char === '$';
}

/**
 * Vérifier si un caractère peut faire partie d'un identifiant
 */
export function isUnicodeIdentifierChar(char: string): boolean {
  return isUnicodeIdentifierStart(char) || isUnicodeDigit(char);
}

/**
 * Obtenir les informations sur un caractère Unicode
 */
export function getUnicodeCharInfo(char: string): UnicodeCharInfo {
  const code = char.charCodeAt(0);
  
  let category = UnicodeCategory.OTHER;
  let name = getUnicodeCharName(code);
  
  if (isUnicodeLetter(char)) {
    category = UnicodeCategory.LETTER;
  } else if (isUnicodeDigit(char)) {
    category = UnicodeCategory.DIGIT;
  } else if (isUnicodeWhitespace(char)) {
    category = UnicodeCategory.WHITESPACE;
  } else if (/[\p{P}\p{S}]/u.test(char)) {
    category = UnicodeCategory.PUNCTUATION;
  } else if (/[\p{Sm}\p{So}]/u.test(char)) {
    category = UnicodeCategory.SYMBOL;
  }
  
  return {
    char,
    code,
    name,
    category,
    isLetter: category === UnicodeCategory.LETTER,
    isDigit: category === UnicodeCategory.DIGIT,
    isWhitespace: category === UnicodeCategory.WHITESPACE,
    isIdentifierStart: isUnicodeIdentifierStart(char),
    isIdentifierChar: isUnicodeIdentifierChar(char),
  };
}

/**
 * Obtenir le nom d'un caractère Unicode
 */
function getUnicodeCharName(code: number): string {
  // Noms connus
  const knownNames: Record<number, string> = {
    0x000A: 'LINE FEED',
    0x000D: 'CARRIAGE RETURN',
    0x0020: 'SPACE',
    0x0009: 'CHARACTER TABULATION',
    0x0022: 'QUOTATION MARK',
    0x0027: 'APOSTROPHE',
    0x0028: 'LEFT PARENTHESIS',
    0x0029: 'RIGHT PARENTHESIS',
    0x002C: 'COMMA',
    0x002E: 'FULL STOP',
    0x003A: 'COLON',
    0x003B: 'SEMICOLON',
    0x007B: 'LEFT CURLY BRACKET',
    0x007D: 'RIGHT CURLY BRACKET',
    0x005B: 'LEFT SQUARE BRACKET',
    0x005D: 'RIGHT SQUARE BRACKET',
  };
  
  return knownNames[code] || `UNKNOWN CHARACTER (U+${code.toString(16).toUpperCase().padStart(4, '0')})`;
}

/**
 * Normaliser un identifiant Unicode (NFC)
 */
export function normalizeUnicodeIdentifier(identifier: string): string {
  return identifier.normalize('NFC');
}

/**
 * Vérifier si une chaîne est un identifiant Unicode valide
 */
export function isValidUnicodeIdentifier(identifier: string): boolean {
  if (identifier.length === 0) return false;
  
  const firstChar = identifier[0];
  if (!isUnicodeIdentifierStart(firstChar)) return false;
  
  for (let i = 1; i < identifier.length; i++) {
    if (!isUnicodeIdentifierChar(identifier[i])) return false;
  }
  
  return true;
}
