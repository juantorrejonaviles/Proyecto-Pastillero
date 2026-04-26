export let treatments = JSON.parse(localStorage.getItem('pastillero_treatments')) || [];
export let currentTreatmentId = localStorage.getItem('pastillero_current_treatment_id') || null;
export let pills = JSON.parse(localStorage.getItem('pastillero_pills')) || [];
export let history = JSON.parse(localStorage.getItem('pastillero_history')) || [];
export let selectedTreatmentId = null;

export function saveState() {
  localStorage.setItem('pastillero_treatments', JSON.stringify(treatments));
  localStorage.setItem('pastillero_current_treatment_id', currentTreatmentId || '');
  localStorage.setItem('pastillero_pills', JSON.stringify(pills));
  localStorage.setItem('pastillero_history', JSON.stringify(history));
}

// Setters for reassignments inside other modules
export function setTreatments(val) { treatments = val; }
export function setCurrentTreatmentId(val) { currentTreatmentId = val; }
export function setPills(val) { pills = val; }
export function setHistory(val) { history = val; }
export function setSelectedTreatmentId(val) { selectedTreatmentId = val; }

export function getDaysRemaining(pill) {
  if (!pill.endDate) return null; // Tratamiento indefinido
  const now = Date.now();
  const remaining = Math.ceil((pill.endDate - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}
