const STORAGE_KEY = "dailyPriceRecords";

export function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

export function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
}
