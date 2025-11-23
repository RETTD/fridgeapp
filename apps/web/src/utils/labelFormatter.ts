/**
 * Cache dla tłumaczeń z OpenFoodFacts API
 */
let labelTranslationsCache: Record<string, { en: string; pl: string }> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 godziny

/**
 * Pobiera tłumaczenia tagów z OpenFoodFacts API
 */
async function fetchLabelTranslations(): Promise<Record<string, { en: string; pl: string }>> {
  try {
    // Użyj AbortController dla timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sekund timeout
    
    const response = await fetch('https://world.openfoodfacts.org/api/v2/taxonomy/labels.json', {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const translations: Record<string, { en: string; pl: string }> = {};
    
    // Przetwarzaj dane z API - obsługuj różne struktury
    if (data.labels && typeof data.labels === 'object') {
      Object.entries(data.labels).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          let enName: string = '';
          let plName: string = '';
          
          // Różne możliwe struktury danych z API
          if (value.name) {
            if (typeof value.name === 'object') {
              // Struktura z obiektem name zawierającym tłumaczenia
              enName = value.name.en || value.name.en_US || value.name.en_GB || 
                      (Array.isArray(value.name) ? value.name[0] : Object.values(value.name)[0]) || key;
              plName = value.name.pl || value.name.pl_PL || value.name.en || enName || key;
            } else {
              // Struktura z prostym stringiem name
              enName = String(value.name);
              plName = String(value.name);
            }
          } else {
            // Struktura bez pola name - sprawdź bezpośrednio w value
            enName = value.en || value.en_US || value.en_GB || key;
            plName = value.pl || value.pl_PL || value.en || enName || key;
          }
          
          // Fallback: użyj klucza
          if (!enName) {
            enName = key;
            plName = key;
          }
          
          // Usuń prefiks języka z klucza jeśli istnieje (en:, pl: itp.)
          const cleanKey = key.replace(/^[a-z]{2}:/i, '').toLowerCase();
          
          translations[cleanKey] = {
            en: String(enName),
            pl: String(plName),
          };
        }
      });
    }
    
    return translations;
  } catch (error: any) {
    // Ignoruj błędy timeout i inne - użyjemy fallback translations
    if (error.name !== 'AbortError') {
      console.warn('Failed to fetch label translations from OpenFoodFacts:', error.message || error);
    }
    return {};
  }
}

/**
 * Pobiera tłumaczenia tagów (z cache lub z API)
 */
async function getLabelTranslations(): Promise<Record<string, { en: string; pl: string }>> {
  const now = Date.now();
  
  // Jeśli cache jest aktualny, użyj go
  if (labelTranslationsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return labelTranslationsCache;
  }
  
  // Pobierz nowe tłumaczenia z OpenFoodFacts API
  const translations = await fetchLabelTranslations();
  
  // Użyj tylko tłumaczeń z API
  labelTranslationsCache = translations;
  
  cacheTimestamp = now;
  return labelTranslationsCache;
}

/**
 * Formatuje tag OpenFoodFacts do czytelnej nazwy (synchroniczna wersja z fallback)
 * @param label Tag w formacie "en:no-gmos" lub "no-gmos"
 * @param locale Język docelowy ('en' lub 'pl')
 * @returns Sformatowana nazwa etykiety
 */
export function formatLabel(label: string, locale: string = 'en'): string {
  if (!label) return '';

  // Usuń prefiks języka (en:, pl:, fr: itp.)
  let cleanLabel = label.replace(/^[a-z]{2}:/i, '');

  // Sprawdź czy mamy tłumaczenie w cache z OpenFoodFacts API
  const translation = labelTranslationsCache?.[cleanLabel.toLowerCase()];
  if (translation) {
    return locale === 'pl' ? translation.pl : translation.en;
  }

  // Jeśli nie ma tłumaczenia, sformatuj automatycznie:
  // - Zamień myślniki na spacje
  // - Kapitalizuj pierwsze litery słów
  return cleanLabel
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formatuje tag OpenFoodFacts do czytelnej nazwy (asynchroniczna wersja z API)
 * @param label Tag w formacie "en:no-gmos" lub "no-gmos"
 * @param locale Język docelowy ('en' lub 'pl')
 * @returns Promise z sformatowaną nazwą etykiety
 */
export async function formatLabelAsync(label: string, locale: string = 'en'): Promise<string> {
  if (!label) return '';

  // Usuń prefiks języka (en:, pl:, fr: itp.)
  let cleanLabel = label.replace(/^[a-z]{2}:/i, '');

  // Pobierz tłumaczenia (z cache lub API)
  const translations = await getLabelTranslations();
  
  // Sprawdź czy mamy tłumaczenie
  const translation = translations[cleanLabel.toLowerCase()];
  if (translation) {
    return locale === 'pl' ? translation.pl : translation.en;
  }

  // Jeśli nie ma tłumaczenia, sformatuj automatycznie:
  // - Zamień myślniki na spacje
  // - Kapitalizuj pierwsze litery słów
  return cleanLabel
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formatuje wiele etykiet na raz (synchroniczna wersja)
 */
export function formatLabels(labels: string[], locale: string = 'en'): string[] {
  return labels.map(label => formatLabel(label, locale));
}

/**
 * Formatuje wiele etykiet na raz (asynchroniczna wersja z API)
 */
export async function formatLabelsAsync(labels: string[], locale: string = 'en'): Promise<string[]> {
  const translations = await getLabelTranslations();
  return labels.map(label => {
    const cleanLabel = label.replace(/^[a-z]{2}:/i, '').toLowerCase();
    const translation = translations[cleanLabel];
    
    if (translation) {
      return locale === 'pl' ? translation.pl : translation.en;
    }
    
    // Fallback do automatycznego formatowania jeśli nie ma tłumaczenia z API
    return cleanLabel
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });
}

/**
 * Inicjalizuje cache tłumaczeń (wywołaj przy starcie aplikacji)
 */
export async function initializeLabelTranslations(): Promise<void> {
  try {
    await getLabelTranslations();
  } catch (error) {
    console.warn('Failed to initialize label translations:', error);
  }
}

