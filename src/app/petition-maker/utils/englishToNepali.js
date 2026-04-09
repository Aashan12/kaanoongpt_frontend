// English to Nepali transliteration mapping
const englishToNepaliMap = {
  // Vowels
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
  'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
  
  // Consonants
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
  't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ', 'n': 'ण',
  'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'w': 'व',
  's': 'स', 'sh': 'श', 'ss': 'ष', 'h': 'ह',
  'ks': 'क्ष', 'tr': 'त्र', 'gn': 'ज्ञ',
};

// English digits to Nepali numerals mapping
const englishToNepaliDigits = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

// Nepali numerals to English digits mapping (reverse)
const nepaliToEnglishDigits = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
};

// Convert Nepali numerals to English digits (for storage/processing)
export function convertDigitsToEnglish(text) {
  if (!text) return '';
  
  const textStr = String(text);
  let result = '';
  
  for (let i = 0; i < textStr.length; i++) {
    const char = textStr[i];
    result += nepaliToEnglishDigits[char] || char;
  }
  
  return result;
}

// Convert English digits to Nepali numerals (for display)
export function convertDigitsToNepali(text) {
  if (!text) return '';
  
  const textStr = String(text);
  let result = '';
  
  for (let i = 0; i < textStr.length; i++) {
    const char = textStr[i];
    result += englishToNepaliDigits[char] || char;
  }
  
  return result;
}

// Simple English to Nepali conversion using phonetic mapping
export function convertEnglishToNepali(englishText) {
  if (!englishText) return '';
  
  const text = englishText.toLowerCase().trim();
  let nepaliText = '';
  let i = 0;
  
  while (i < text.length) {
    let matched = false;
    
    // Try to match longer sequences first (2-3 characters)
    for (let len = 3; len >= 1; len--) {
      const substring = text.substring(i, i + len);
      if (englishToNepaliMap[substring]) {
        nepaliText += englishToNepaliMap[substring];
        i += len;
        matched = true;
        break;
      }
    }
    
    // If no match found, keep the character as is (for numbers, spaces, etc.)
    if (!matched) {
      nepaliText += text[i];
      i++;
    }
  }
  
  return nepaliText;
}

// Convert name to Nepali (capitalize first letter)
export function convertNameToNepali(englishName) {
  if (!englishName) return '';
  const nepaliText = convertEnglishToNepali(englishName);
  return nepaliText.charAt(0).toUpperCase() + nepaliText.slice(1);
}
