/**
 * OpenFoodFacts nie udostępnia tłumaczeń tagów w API.
 * Tagi są w formacie "en:no-gmos" i muszą być formatowane lokalnie.
 */

/**
 * Formatuje tag OpenFoodFacts do czytelnej nazwy
 * OpenFoodFacts zwraca tagi w formacie "en:no-gmos" - usuwamy prefiks i formatujemy
 * @param label Tag w formacie "en:no-gmos" lub "no-gmos"
 * @param locale Język docelowy ('en' lub 'pl') - obecnie nieużywany, OpenFoodFacts nie ma tłumaczeń
 * @returns Sformatowana nazwa etykiety
 */
export function formatLabel(label: string, locale: string = 'en'): string {
  if (!label) return '';

  // Usuń prefiks języka (en:, pl:, fr: itp.)
  let cleanLabel = label.replace(/^[a-z]{2}:/i, '');

  // Formatuj automatycznie:
  // - Zamień myślniki na spacje
  // - Kapitalizuj pierwsze litery słów
  return cleanLabel
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formatuje tag OpenFoodFacts do czytelnej nazwy (asynchroniczna wersja - dla kompatybilności)
 * @param label Tag w formacie "en:no-gmos" lub "no-gmos"
 * @param locale Język docelowy ('en' lub 'pl') - obecnie nieużywany
 * @returns Promise z sformatowaną nazwą etykiety
 */
export async function formatLabelAsync(label: string, locale: string = 'en'): Promise<string> {
  // Po prostu użyj synchronicznej wersji - OpenFoodFacts nie ma tłumaczeń w API
  return formatLabel(label, locale);
}

/**
 * Formatuje wiele etykiet na raz (synchroniczna wersja)
 */
export function formatLabels(labels: string[], locale: string = 'en'): string[] {
  return labels.map(label => formatLabel(label, locale));
}

/**
 * Formatuje wiele etykiet na raz (asynchroniczna wersja - dla kompatybilności)
 */
export async function formatLabelsAsync(labels: string[], locale: string = 'en'): Promise<string[]> {
  return formatLabels(labels, locale);
}

/**
 * Inicjalizuje cache tłumaczeń (obecnie niepotrzebne - OpenFoodFacts nie ma tłumaczeń)
 * Zachowane dla kompatybilności wstecznej
 */
export async function initializeLabelTranslations(): Promise<void> {
  // OpenFoodFacts nie udostępnia tłumaczeń w API, więc nie ma co inicjalizować
  // Funkcja pozostaje dla kompatybilności wstecznej
}

