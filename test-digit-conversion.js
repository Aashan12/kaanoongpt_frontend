// Test file to verify digit conversion
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

function convertDigitsToNepali(text) {
  if (!text) return '';
  
  const textStr = String(text);
  let result = '';
  
  for (let i = 0; i < textStr.length; i++) {
    const char = textStr[i];
    result += englishToNepaliDigits[char] || char;
  }
  
  return result;
}

// Test cases
console.log('Testing digit conversion:');
console.log('9898 ->', convertDigitsToNepali('9898'));
console.log('34 ->', convertDigitsToNepali('34'));
console.log('5 ->', convertDigitsToNepali('5'));
console.log('9818184797 ->', convertDigitsToNepali('9818184797'));
