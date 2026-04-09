import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Persistent cache across component instances
const globalCache = {};

// Mapping for English digits to Nepali numerals
const ENGLISH_TO_NEPALI_DIGITS = {
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

const convertDigitsToNepali = (text) => {
  let result = text;
  Object.entries(ENGLISH_TO_NEPALI_DIGITS).forEach(([eng, nep]) => {
    result = result.replace(new RegExp(eng, 'g'), nep);
  });
  return result;
};

export function useNepaliTranslation() {
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState({});
  const cacheRef = useRef(globalCache);
  const pendingTranslationsRef = useRef({});
  const debounceTimerRef = useRef(null);

  const isPurelyNumeric = useCallback((text) => {
    return /^[\d\s\-\+\(\)\.]+$/.test(text.trim());
  }, []);

  // Process batch translations in background
  const processBatchTranslation = useCallback(async () => {
    const textsToTranslate = Object.keys(pendingTranslationsRef.current);
    if (textsToTranslate.length === 0) return;

    // Clear pending queue
    const batch = { ...pendingTranslationsRef.current };
    pendingTranslationsRef.current = {};

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translation/batch-translate-to-nepali`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textsToTranslate)
      });

      if (!response.ok) {
        throw new Error('Batch translation failed');
      }

      const data = await response.json();
      
      // Update cache and state
      const newTranslations = {};
      textsToTranslate.forEach((text, index) => {
        const translated = data.translated[index];
        // Remove any numbering prefix from the translation
        const cleanedTranslated = translated.replace(/^[०-९\d]+[\.\)]\s*/, '');
        cacheRef.current[text] = cleanedTranslated;
        newTranslations[text] = cleanedTranslated;
      });

      setTranslations(prev => ({ ...prev, ...newTranslations }));
    } catch (error) {
      console.error('Batch translation error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced batch translation
  const queueTranslation = useCallback((englishText) => {
    if (!englishText) return englishText;
    
    const trimmed = String(englishText).trim();
    
    // Return cached if available
    if (cacheRef.current[trimmed]) {
      return cacheRef.current[trimmed];
    }

    // If purely numeric, convert immediately and cache
    if (isPurelyNumeric(trimmed)) {
      const nepaliText = convertDigitsToNepali(trimmed);
      cacheRef.current[trimmed] = nepaliText;
      setTranslations(prev => ({ ...prev, [trimmed]: nepaliText }));
      return nepaliText;
    }

    // Add to pending queue for text translation
    pendingTranslationsRef.current[trimmed] = true;

    // Debounce batch processing
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      processBatchTranslation();
    }, 500); // Wait 500ms for more inputs

    // Return English text immediately (will be replaced when translation completes)
    return trimmed;
  }, [isPurelyNumeric, processBatchTranslation]);

  // Get translated text (returns English if not yet translated)
  const getTranslation = useCallback((englishText) => {
    if (!englishText) return '';
    const trimmed = englishText.trim();
    const translated = translations[trimmed] || cacheRef.current[trimmed] || trimmed;
    
    // Remove any numbering prefix (e.g., "१. नाम" -> "नाम" or "1. Name" -> "Name")
    return translated.replace(/^[०-९\d]+[\.\)]\s*/, '');
  }, [translations]);

  const translateToNepali = useCallback(async (englishText) => {
    if (!englishText) return '';
    
    const trimmed = englishText.trim();
    
    // Check cache first
    if (cacheRef.current[trimmed]) {
      return cacheRef.current[trimmed];
    }

    // If purely numeric, just convert digits to Nepali numerals (no API call)
    if (isPurelyNumeric(trimmed)) {
      const nepaliText = convertDigitsToNepali(trimmed);
      cacheRef.current[trimmed] = nepaliText;
      return nepaliText;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translation/translate-to-nepali`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          source_language: 'english',
          target_language: 'nepali'
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const nepaliText = data.translated;
      
      // Remove any numbering prefix from the translation
      const cleanedText = nepaliText.replace(/^[०-९\d]+[\.\)]\s*/, '');
      
      // Cache the cleaned result
      cacheRef.current[trimmed] = cleanedText;

      return cleanedText;
    } catch (error) {
      console.error('Translation error:', error);
      return trimmed; // Fallback to original text
    } finally {
      setLoading(false);
    }
  }, [isPurelyNumeric]);

  const batchTranslate = useCallback(async (englishTexts) => {
    if (!englishTexts || englishTexts.length === 0) return [];

    // Check which ones need translation (not in cache, not purely numeric)
    const textsToTranslate = englishTexts.filter(text => {
      const trimmed = text.trim();
      return !isPurelyNumeric(trimmed) && !cacheRef.current[trimmed];
    });

    // Process purely numeric texts (no API call needed)
    const result = englishTexts.map(text => {
      const trimmed = text.trim();
      if (cacheRef.current[trimmed]) {
        return cacheRef.current[trimmed];
      }
      if (isPurelyNumeric(trimmed)) {
        const nepaliText = convertDigitsToNepali(trimmed);
        cacheRef.current[trimmed] = nepaliText;
        return nepaliText;
      }
      return null; // Will be filled from API
    });

    if (textsToTranslate.length === 0) {
      // All are cached or numeric
      return result.map(r => r !== null ? r : '');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translation/batch-translate-to-nepali`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(textsToTranslate)
      });

      if (!response.ok) {
        throw new Error('Batch translation failed');
      }

      const data = await response.json();
      
      // Cache all results (with numbering removed)
      textsToTranslate.forEach((text, index) => {
        const trimmed = text.trim();
        const translated = data.translated[index];
        // Remove any numbering prefix from the translation
        const cleanedTranslated = translated.replace(/^[०-९\d]+[\.\)]\s*/, '');
        cacheRef.current[trimmed] = cleanedTranslated;
      });

      // Fill in the results
      let apiIdx = 0;
      return result.map((cached, idx) => {
        if (cached !== null) return cached;
        const trimmed = englishTexts[idx].trim();
        if (cacheRef.current[trimmed]) {
          return cacheRef.current[trimmed];
        }
        return englishTexts[idx];
      });
    } catch (error) {
      console.error('Batch translation error:', error);
      return englishTexts; // Fallback to original texts
    } finally {
      setLoading(false);
    }
  }, [isPurelyNumeric]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { 
    translateToNepali, 
    batchTranslate, 
    queueTranslation, 
    getTranslation,
    loading 
  };
}
