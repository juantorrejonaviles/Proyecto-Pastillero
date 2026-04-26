/**
 * Mi Pastillero - Lógica Principal (SPA y PWA)
 * v2.0 — Con edición/eliminación, duración, notificaciones web + Capacitor
 */

import { treatments, currentTreatmentId, pills, history, selectedTreatmentId, saveState, setTreatments, setCurrentTreatmentId, setPills, setHistory, setSelectedTreatmentId, getDaysRemaining } from './src/store.js';
import { requestNotificationPermission, sendWebNotification, initCapacitorNotifications, scheduleCapacitorNotification, cancelCapacitorNotification, scheduleAllCapacitorNotifications, sendTelegramNotification } from './src/notifications.js';

// --- 2. Elementos del DOM ---
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
const screenTitle = document.getElementById('screen-title');

const todayList = document.getElementById('today-pills-list');
const todayEmpty = document.getElementById('today-empty-state');
const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty-state');

const addForm = document.getElementById('add-pill-form');

const alarmModal = document.getElementById('alarm-modal');
const alarmPillName = document.getElementById('alarm-pill-name');
const btnTakePill = document.getElementById('btn-take-pill');
const btnSnoozePill = document.getElementById('btn-snooze-pill');

const btnSettings = document.getElementById('btn-settings');
const screenSettings = document.getElementById('screen-settings');
const inputTgUser = document.getElementById('telegram-user');
const btnSaveSettings = document.getElementById('btn-save-settings');

const btnExportHistory = document.getElementById('btn-export-history');
const btnDeleteSelected = document.getElementById('btn-delete-selected');
const btnDeleteAll = document.getElementById('btn-delete-all');

const btnWelcomeStart = document.getElementById('btn-to-onboarding-form');
const btnHomeHeader = document.getElementById('btn-home-header');
const btnTodayHeader = document.getElementById('btn-today-header');
const btnCancelAddPill = document.getElementById('btn-cancel-add');
const onboardingForm = document.getElementById('onboarding-form');

// --- Modal Diálogo Custom ---
const customModal = document.getElementById('custom-modal');
const customModalTitle = document.getElementById('custom-modal-title');
const customModalMsg = document.getElementById('custom-modal-msg');
const btnModalCancel = document.getElementById('btn-modal-cancel');
const btnModalOk = document.getElementById('btn-modal-ok');

// --- Modal de Edición ---
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-pill-form');
const editPillId = document.getElementById('edit-pill-id');
const editPillName = document.getElementById('edit-pill-name');
const editPillFrequency = document.getElementById('edit-pill-frequency');
const editPillDuration = document.getElementById('edit-pill-duration');
const editPillStock = document.getElementById('edit-pill-stock');
const editPillMinStock = document.getElementById('edit-pill-min-stock');
const editPillIndications = document.getElementById('edit-pill-indications');
const editPillCompartment = document.getElementById('edit-pill-compartment');
const editPillColor = document.getElementById('edit-pill-color');
const btnEditCancel = document.getElementById('btn-edit-cancel');

// --- Elementos Onboarding / Otros ---
const screenWelcome = document.getElementById('screen-welcome');
const onboardingModal = document.getElementById('onboarding-modal');
const btnCancelOnboarding = document.getElementById('btn-cancel-onboarding');
const btnNewTreatmentPlan = document.getElementById('btn-new-treatment-plan');
const screenActiveTreatments = document.getElementById('screen-active-treatments');
const treatmentsList = document.getElementById('treatments-list');
const treatmentsEmpty = document.getElementById('treatments-empty-state');


export function showModal(title, msg, isAlert = false) {
  return new Promise(resolve => {
    customModalTitle.innerText = title;
    customModalMsg.innerText = msg;
    customModal.classList.remove('hidden');
    
    if (isAlert) {
      btnModalCancel.style.display = 'none';
      btnModalOk.innerText = 'Entendido';
    } else {
      btnModalCancel.style.display = 'block';
      btnModalOk.innerText = 'Sí, borrar';
    }

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    function cleanup() {
      btnModalOk.removeEventListener('click', onOk);
      btnModalCancel.removeEventListener('click', onCancel);
      customModal.classList.add('hidden');
    }

    btnModalOk.addEventListener('click', onOk);
    if (!isAlert) {
      btnModalCancel.addEventListener('click', onCancel);
    }
  });
}

// Cargar credenciales de Telegram si existen
inputTgUser.value = localStorage.getItem('pastillero_tg_user') || '';

// --- 4. Navegación Inferior (SPA) ---
export function navigateTo(targetId) {
  // Asegurar que salimos de modo onboarding si navegamos
  document.body.classList.remove('onboarding-active');

  // Ocultar todas las pantallas y quitar activos de nav
  screens.forEach(s => s.classList.remove('active'));
  navItems.forEach(nav => nav.classList.remove('active'));

  // Activar pantalla destino
  const targetScreen = document.getElementById(targetId);
  if (targetScreen) targetScreen.classList.add('active');

  // Activar item de navegación si existe
  const navItem = Array.from(navItems).find(nav => nav.getAttribute('data-target') === targetId);
  if (navItem) navItem.classList.add('active');

  // Cambiar título header
  if(targetId === 'screen-today') screenTitle.innerText = "Medicación de hoy";
  if(targetId === 'screen-treatment-detail') screenTitle.innerText = "Detalle de tomas";
  if(targetId === 'screen-add') screenTitle.innerText = "Nuevo Medicamento";
  if(targetId === 'screen-history') screenTitle.innerText = "Historial";
  if(targetId === 'screen-active-treatments') screenTitle.innerText = "Mis Tratamientos";
  if(targetId === 'screen-settings') screenTitle.innerText = "Ajustes de Seguridad";
  if(targetId === 'screen-welcome') screenTitle.innerText = "Tu Pastillero";

  renderViews();
}
// 1. Mostrar onboarding si no está completado
function initOnboarding() {
  const isCompleted = localStorage.getItem('pastillero_onboarding_completed');
  if (!isCompleted) {
    document.body.classList.add('onboarding-active');
    screens.forEach(s => s.classList.remove('active'));
    if (screenWelcome) screenWelcome.classList.add('active');
  }
}

initOnboarding();

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const target = item.getAttribute('data-target');
    if (target) navigateTo(target);
  });
});

// --- 5. Eventos Globales y Onboarding ---
// --- 5. Eventos Globales y Onboarding ---
if (btnCancelOnboarding) {
  btnCancelOnboarding.addEventListener('click', () => {
    onboardingModal.classList.add('hidden');
  });
}

if (btnNewTreatmentPlan) {
  btnNewTreatmentPlan.addEventListener('click', () => {
    onboardingModal.classList.remove('hidden');
  });
}

if (btnWelcomeStart) {
  btnWelcomeStart.addEventListener('click', () => {
    onboardingModal.classList.remove('hidden');
  });
}

if (btnHomeHeader) {
  btnHomeHeader.addEventListener('click', () => {
    // Volver a la Portada (Welcome)
    navigateTo('screen-welcome');
  });
}

if (btnTodayHeader) {
  btnTodayHeader.addEventListener('click', () => {
    navigateTo('screen-today');
  });
}

const btnBackToHoy = document.getElementById('btn-back-to-hoy');
if (btnBackToHoy) {
  btnBackToHoy.addEventListener('click', () => {
    navigateTo('screen-today');
  });
}

if (btnCancelAddPill) {
  btnCancelAddPill.addEventListener('click', () => {
    navigateTo('screen-today');
  });
}

const btnAddMedDetail = document.getElementById('btn-add-med-detail');
if (btnAddMedDetail) {
  btnAddMedDetail.addEventListener('click', () => {
    if (selectedTreatmentId) {
      setCurrentTreatmentId(selectedTreatmentId);
      navigateTo('screen-add');
    }
  });
}

// Onboarding Form step 1 (creation of the treatment)
if (onboardingForm) {
  onboardingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = e.submitter;
    if (btnSubmit) btnSubmit.disabled = true; // Prevenir doble clic

    const startDate = document.getElementById('start-date').value;
    const pathology = document.getElementById('user-pathology').value.trim();
    
    // Verificar si ya existe un tratamiento con la misma patología
    const isDuplicate = treatments.some(t => t.pathology === pathology);
    if (isDuplicate) {
      await showModal("Plan Existente", `Ya tienes un plan de "${pathology}".`, true);
      if (btnSubmit) btnSubmit.disabled = false;
      return;
    }

    const newTreatment = {
      id: "t_" + Date.now(),
      startDate: startDate,
      pathology: pathology
    };
    
    treatments.push(newTreatment);
    setCurrentTreatmentId(newTreatment.id);
    saveState();
    
    // Marcar como completado en localStorage si es el primero
    localStorage.setItem('pastillero_onboarding_completed', 'true');

    await showModal("¡Tratamiento Registrado!", `Selecciona "${pathology}" en la lista de hoy para ir incorporando la medicación.`, true);
    if (btnSubmit) btnSubmit.disabled = false;
    onboardingForm.reset();
    onboardingModal.classList.add('hidden');
    navigateTo('screen-today');
  });
}

// Ir a ajustes desde el engranaje superior
if (btnSettings) {
  btnSettings.addEventListener('click', () => {
    navigateTo('screen-settings');
  });
}

if (btnSaveSettings) {
  btnSaveSettings.addEventListener('click', async () => {
    const userVal = inputTgUser.value.trim();
    localStorage.setItem('pastillero_tg_user', userVal);
    await showModal("Configuración", "Configuración de Telegram guardada correctamente.", true);
    navigateTo('screen-today');
  });
}


// --- Toolbar del Historial ---
btnExportHistory.addEventListener('click', async () => {
  if (history.length === 0) {
    await showModal("Historial Vacío", "No hay datos en el historial para guardar.", true);
    return;
  }
  let txt = "HISTORIAL DE MEDICACIÓN\n======================\n\n";
  history.forEach(r => {
    txt += `- ${r.name.toUpperCase()}: Tomado el ${new Date(r.takenAt).toLocaleString('es-ES')}\n`;
  });
  
  const d = new Date();
  const dateStr = `${d.getDate()}-${d.getMonth()+1}-${d.getFullYear()}`;
  const fileName = `Historial_Pastillero_${dateStr}.txt`;
  
  try {
    if (window.showSaveFilePicker) {
      // Windows/Mac navegadores modernos: Fuerza nativamente la ventana Guardar Como
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'Archivo de Texto', accept: { 'text/plain': ['.txt'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(txt);
      await writable.close();
      await showModal("Guardado Exitoso", `El historial se ha guardado como ${fileName}`, true);
    } else {
      throw new Error("No support");
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      // Fallback a descarga tradicional, pero forzando 'application/octet-stream' para evitar que se ignoren extensiones
      const blob = new Blob([txt], { type: 'application/octet-stream' });
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 1000);
      await showModal("Descarga iniciada", `Revisa tu carpeta de Descargas para ver el archivo ${fileName}`, true);
    }
  }
});

btnDeleteSelected.addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('.history-checkbox:checked');
  if (checkboxes.length === 0) {
    await showModal("Sin Selección", "Selecciona al menos una toma marcando el círculo a la izquierda.", true);
    return;
  }
  
  const isConfirmed = await showModal("Confirmar Borrado", `¿Borrar los ${checkboxes.length} registros seleccionados de la lista?`);
  if (isConfirmed) {
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value);
    setHistory(history.filter(r => {
      const recordId = r.id ? r.id.toString() : r.takenAt.toString();
      return !idsToDelete.includes(recordId);
    }));
    saveState();
    renderViews();
  }
});

btnDeleteAll.addEventListener('click', async () => {
  if (history.length === 0) return;
  const isConfirmed = await showModal("¡ATENCIÓN!", "¿Estás seguro de que quieres BORRAR TODO el historial de golpe? Esta acción no tiene vuelta atrás.");
  if (isConfirmed) {
    setHistory([]);
    saveState();
    renderViews();
  }
});

// --- 4b. Gestión de Backup (JSON) ---
const btnExportBackup = document.getElementById('btn-export-backup');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const importFile = document.getElementById('import-file');

btnExportBackup.addEventListener('click', () => {
  const data = {
    pills: pills,
    history: history,
    telegramUser: localStorage.getItem('pastillero_tg_user') || '',
    exportDate: new Date().toISOString(),
    version: "2.0"
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Pastillero_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

btnImportTrigger.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      // Validación básica
      if (!data.pills || !data.history) {
        throw new Error("Formato de backup inválido.");
      }
      
      const confirm = await showModal("Confirmar Importación", "Se sobreescribirán todos tus datos actuales. ¿Deseas continuar?");
      if (confirm) {
        setPills(data.pills);
        setHistory(data.history);
        if (data.telegramUser) {
          localStorage.setItem('pastillero_tg_user', data.telegramUser);
          inputTgUser.value = data.telegramUser;
        }
        saveState();
        renderViews();
        await showModal("Éxito", "Datos importados correctamente.", true);
      }
    } catch (err) {
      await showModal("Error", "No se pudo leer el archivo de backup. Asegúrate de que sea un archivo .json válido.", true);
    }
    importFile.value = ''; // Limpiar
  };
  reader.readAsText(file);
});

// --- 5. Helpers de Tiempo ---
function parseTimeInputToDate(timeStr) {
  const [hours, minutes] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Siempre asumimos que la hora introducida es para el día de hoy,
  // para que el cronograma y las tomas pendienets de hoy se vean correctamente.
  
  return d.getTime(); // Guardar Timestamp Absoluto
}

export function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateFull(timestamp) {
  const d = new Date(timestamp);
  const dateStr = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  
  // Capitalizar la primera letra del día
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  return `Día: ${capitalizedDate} a las ${timeStr}`;
}

// Formatear cuenta atrás legible
function formatCountdown(targetTimestamp) {
  const diff = targetTimestamp - Date.now();
  
  if (diff <= 0) {
    return { text: '¡Toca tomarla!', overdue: true };
  }
  
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  let text = '';
  if (hours > 0) text += `${hours}h `;
  if (minutes > 0 || hours > 0) text += `${minutes}min `;
  text += `${seconds}s`;
  
  return { text: `Próxima toma en ${text.trim()}`, overdue: false };
}

// Actualizar Header Día de Hoy
document.getElementById('current-date-text').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });


// --- 6. Lógica de Medicamentos ---

// Calcular días restantes de un tratamiento


addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('pill-name').value;
  const time = document.getElementById('pill-time').value;
  const frequency = parseInt(document.getElementById('pill-frequency').value);
  const durationInput = document.getElementById('pill-duration').value;
  const stockInput = document.getElementById('pill-stock').value;
  const minStockInput = document.getElementById('pill-min-stock').value;
  
  const indicationsInput = document.getElementById('pill-indications').value;
  const compartmentInput = document.getElementById('pill-compartment').value;
  const colorInput = document.getElementById('pill-color').value;

  const nextTimestamp = parseTimeInputToDate(time);

  const newPill = {
    id: Date.now().toString(),
    treatmentId: currentTreatmentId,
    name: name,
    frequencyHours: frequency,
    nextTime: nextTimestamp,
    createdAt: Date.now(),
    endDate: durationInput ? Date.now() + (parseInt(durationInput) * 24 * 60 * 60 * 1000) : null,
    stock: stockInput ? parseInt(stockInput) : null,
    minStock: minStockInput ? parseInt(minStockInput) : 0,
    indications: indicationsInput,
    compartment: compartmentInput ? parseInt(compartmentInput) : null,
    color: colorInput
  };

  pills.push(newPill);
  pills.sort((a, b) => a.nextTime - b.nextTime); // Ordenar por hora más próxima
  saveState();
  
  // Programar notificación Capacitor
  scheduleCapacitorNotification(newPill);
  
  // Limpiar formulario y volver a pantalla Hoy
  addForm.reset();
  navItems[0].click(); // Simular volver a Hoy
});

// Marcar como tomada manualmente desde la lista
function takePill(pillId) {
  // Vibración háptica de éxito (si está disponible)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  const pillIndex = pills.findIndex(p => p.id === pillId);
  if (pillIndex === -1) return;

  const pill = pills[pillIndex];
  
  // Guardar en historial
  const record = {
    id: Date.now().toString(),
    name: pill.name,
    takenAt: Date.now(),
    scheduledFor: pill.nextTime
  };
  history.unshift(record); // Añadir al principio

  // Gestión de Stock
  if (pill.stock !== null) {
    pill.stock = Math.max(0, pill.stock - 1);
  }

  // Reprogramar la medicación sumando las horas de frecuencia
  pill.nextTime = pill.nextTime + (pill.frequencyHours * 60 * 60 * 1000);
  
  // Programar siguiente notificación Capacitor
  scheduleCapacitorNotification(pill);
  
  pills.sort((a, b) => a.nextTime - b.nextTime);
  saveState();
  renderViews();
  animateSuccess();

  // ALERTA DE STOCK: Si al tomar queda poco stock, avisar con modal
  if (pill.stock !== null && pill.stock <= pill.minStock) {
    let msg = `Te quedan pocas unidades de ${pill.name} (${pill.stock}).`;
    if (pill.stock === 0) msg = `¡Se han agotado las existencias de ${pill.name}!`;
    showModal("⚠️ Stock Bajo", msg, true);
  }

  // Enviar aviso INVISIBLE por Telegram si está configurado
  sendTelegramNotification(pill.name, localStorage.getItem('pastillero_tg_user'));
}

// Eliminar un tratamiento
async function deletePill(pillId) {
  const pill = pills.find(p => p.id === pillId);
  if (!pill) return;

  const isConfirmed = await showModal(
    "Eliminar Tratamiento",
    `¿Quieres eliminar "${pill.name}" de tu lista de tratamientos?`
  );
  
  if (isConfirmed) {
    // Cancelar notificación Capacitor
    await cancelCapacitorNotification(pill);
    
    setPills(pills.filter(p => p.id !== pillId));
    saveState();
    renderViews();
  }
}

// Abrir modal de edición
function openEditModal(pillId) {
  const pill = pills.find(p => p.id === pillId);
  if (!pill) return;
  
  editPillId.value = pill.id;
  editPillName.value = pill.name;
  editPillFrequency.value = pill.frequencyHours;
  
  // Calcular días restantes si tiene fecha de fin
  const daysLeft = getDaysRemaining(pill);
  editPillDuration.value = daysLeft !== null ? daysLeft : '';
  
  editPillStock.value = pill.stock !== null ? pill.stock : '';
  editPillMinStock.value = pill.minStock !== null ? pill.minStock : '';
  
  if (editPillIndications) editPillIndications.value = pill.indications || 'none';
  if (editPillCompartment) editPillCompartment.value = pill.compartment || '';
  if (editPillColor) editPillColor.value = pill.color || 'white';
  
  editModal.classList.remove('hidden');
}

// Guardar edición
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const pillId = editPillId.value;
  const pillIndex = pills.findIndex(p => p.id === pillId);
  if (pillIndex === -1) return;
  
  const pill = pills[pillIndex];
  
  // Cancelar notificación antigua
  await cancelCapacitorNotification(pill);
  
  // Actualizar datos
  pill.name = editPillName.value.trim();
  pill.frequencyHours = parseInt(editPillFrequency.value);
  
  const newDuration = editPillDuration.value;
  pill.endDate = newDuration ? Date.now() + (parseInt(newDuration) * 24 * 60 * 60 * 1000) : null;
  
  const newStock = editPillStock.value;
  pill.stock = newStock !== '' ? parseInt(newStock) : null;
  const newMinStock = editPillMinStock.value;
  pill.minStock = newMinStock !== '' ? parseInt(newMinStock) : 0;

  pill.indications = editPillIndications ? editPillIndications.value : 'none';
  pill.compartment = editPillCompartment && editPillCompartment.value ? parseInt(editPillCompartment.value) : null;
  pill.color = editPillColor ? editPillColor.value : 'white';

  // Reprogramar notificación
  await scheduleCapacitorNotification(pill);
  
  pills.sort((a, b) => a.nextTime - b.nextTime);
  saveState();
  editModal.classList.add('hidden');
  renderViews();
  
  await showModal("Tratamiento Actualizado", `"${pill.name}" se ha actualizado correctamente.`, true);
});

// Cancelar edición
btnEditCancel.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// Hacer funciones accesibles para los botones dinámicos con delegación de eventos
todayList.addEventListener('click', (e) => {
  // Buscar botones usando closest para que el click en el SVG también funcione
  const editBtn = e.target.closest('.action-edit');
  const deleteBtn = e.target.closest('.action-delete');
  
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();
    const pillId = editBtn.dataset.pillId;
    if (pillId) openEditModal(pillId);
    return;
  }
  
  if (deleteBtn) {
    e.preventDefault();
    e.stopPropagation();
    const pillId = deleteBtn.dataset.pillId;
    if (pillId) deletePill(pillId);
    return;
  }
});

import { renderViews, getTodayPills, renderToday, renderHistory, renderTreatmentDetail, renderActiveTreatments, animateSuccess } from './src/ui.js';
// --- 8. Motor de Alarmas Background (Interval Tracker) ---
let activeAlarmPill = null;

function checkAlarms() {
  const now = Date.now();
  
  // Primero: Auto-eliminar tratamientos expirados
  const expiredPills = pills.filter(p => p.endDate && p.endDate <= now);
  if (expiredPills.length > 0) {
    expiredPills.forEach(async (pill) => {
      // Guardar en historial como completado
      history.unshift({
        id: Date.now().toString(),
        name: `${pill.name} (tratamiento finalizado)`,
        takenAt: now,
        scheduledFor: pill.nextTime
      });
      await cancelCapacitorNotification(pill);
    });
    setPills(pills.filter(p => !(p.endDate && p.endDate <= now)));
    saveState();
    renderViews();
  }
  
  // Segundo: Buscar la primera pastilla que ya haya superado su tiempo
  const duePill = pills.find(p => p.nextTime <= now);
  
  // Condición: Si está en el modal escondido
  if (duePill && alarmModal.classList.contains('hidden')) {
    triggerAlarm(duePill);
  }
}

function triggerAlarm(pill) {
  activeAlarmPill = pill;
  alarmPillName.innerText = pill.name;
  alarmModal.classList.remove('hidden');
  
  // Enviar notificación web (funciona en segundo plano del navegador)
  sendWebNotification(pill.name);
  
  // Intento de Audio si el usuario ha interactuado con el DOM antes
  try {
     const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); 
     audio.play().catch(e=>console.log("Audio play require interacción previa"));
  } catch(e) {}
  
  if('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 500]);
}

btnTakePill.addEventListener('click', () => {
  if(activeAlarmPill) {
    takePill(activeAlarmPill.id);
  }
  alarmModal.classList.add('hidden');
  activeAlarmPill = null;
});

btnSnoozePill.addEventListener('click', async () => {
  if(activeAlarmPill) {
    // Retrasar 10 minutos (600,000 ms)
    activeAlarmPill.nextTime += 10 * 60 * 1000;
    
    // Reprogramar notificación Capacitor
    await scheduleCapacitorNotification(activeAlarmPill);
    
    saveState();
    renderViews();
  }
  alarmModal.classList.add('hidden');
  activeAlarmPill = null;
});

// Actualizar solo los textos de cuenta atrás (ligero, sin re-renderizar DOM)
function updateCountdowns() {
  pills.forEach(pill => {
    const el = document.querySelector(`[data-countdown-id="${pill.id}"]`);
    if (!el) return;
    const countdown = formatCountdown(pill.nextTime);
    el.textContent = countdown.text;
    if (countdown.overdue) {
      el.classList.add('countdown-overdue');
    } else {
      el.classList.remove('countdown-overdue');
    }
  });
}

// --- Eventos Historial ---
document.getElementById('btn-export-history')?.addEventListener('click', () => {
  if (history.length === 0) return showCustomModal("El historial está vacío.", true);
  const exportTxt = "HISTORIAL MÉDICO - MI PASTILLERO\n\n" + history.map(h => `${new Date(h.takenAt).toLocaleString('es-ES')} - ${h.name}`).join('\n');
  const blob = new Blob([exportTxt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Historial_Pastillero.txt';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-delete-selected')?.addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('.history-checkbox:checked');
  if(checkboxes.length === 0) return showCustomModal("Selecciona al menos un registro para borrar.", true);
  
  const confirmed = await showCustomModal("¿Seguro que deseas borrar los registros seleccionados?");
  if(!confirmed) return;
  
  const idsToRemove = Array.from(checkboxes).map(cb => cb.value);
  setHistory(history.filter(h => !idsToRemove.includes((h.id || h.takenAt).toString())));
  saveState();
  renderViews();
});

document.getElementById('btn-delete-all')?.addEventListener('click', async () => {
  if (history.length === 0) return showCustomModal("El historial ya está vacío.", true);
  const confirmed = await showCustomModal("¿Estás seguro de querer BORRAR TODO el historial? Esta acción no se puede deshacer.");
  if(!confirmed) return;
  setHistory([]);
  saveState();
  renderViews();
});

// Arrancar cronómetro de comprobación cada segundo
setInterval(() => {
  checkAlarms();
  updateCountdowns();
}, 1000);

// Inicializar Vista
renderViews();
