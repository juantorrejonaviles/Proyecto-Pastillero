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

// --- Elementos Premium / Freemium ---
const premiumModal = document.getElementById('premium-modal');
const btnUpgradeNow = document.getElementById('btn-upgrade-now');
const btnPremiumClose = document.getElementById('btn-premium-close');
const btnExportPdf = document.getElementById('btn-export-pdf');
const inputSmsPhone = document.getElementById('sms-phone');
const smsLockOverlay = document.getElementById('sms-lock-overlay');
const premiumCardContainer = document.getElementById('premium-card-container');


export function showModal(title, msg, isAlert = false, confirmText = 'Sí, borrar') {
  return new Promise(resolve => {
    customModalTitle.innerText = title;
    customModalMsg.innerText = msg;
    customModal.classList.remove('hidden');
    
    if (isAlert) {
      btnModalCancel.style.display = 'none';
      btnModalOk.innerText = 'Entendido';
    } else {
      btnModalCancel.style.display = 'block';
      btnModalOk.innerText = confirmText;
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

// --- Lógica de Negocio Freemium ---
export function isPremium() {
  return localStorage.getItem('pastillero_is_premium') === 'true';
}

export function showPremiumPaywall() {
  if (premiumModal) {
    premiumModal.classList.remove('hidden');
  }
}

export function renderPremiumUI() {
  if (!premiumCardContainer) return;

  const premium = isPremium();
  if (premium) {
    // Modo Premium PRO
    premiumCardContainer.innerHTML = `
      <div class="premium-promo-title">💎 Plan Premium PRO Activo</div>
      <div class="premium-promo-desc">Disfrutas de tratamientos ilimitados, alertas SMS de respaldo y reportes PDF médicos activados.</div>
      <div style="font-weight: 800; color: #1e3a8a; font-size: 0.9rem;">Suscripción Activa (2,99€/mes)</div>
    `;
    
    // Desbloquear Alertas SMS
    if (smsLockOverlay) smsLockOverlay.style.display = 'none';
    if (inputSmsPhone) {
      inputSmsPhone.disabled = false;
      inputSmsPhone.value = localStorage.getItem('pastillero_sms_phone') || '';
    }

    // Desbloquear PDF Icono
    if (btnExportPdf) {
      const lockBadge = btnExportPdf.querySelector('.premium-lock-icon');
      if (lockBadge) lockBadge.remove();
    }
  } else {
    // Modo Gratis
    premiumCardContainer.innerHTML = `
      <div class="premium-promo-title">🌟 Plan Gratuito (Límite: 2 Planes)</div>
      <div class="premium-promo-desc">Registra hasta 2 tratamientos y conecta avisos por Telegram. Pásate a Premium PRO para tratamientos ilimitados, alertas SMS de respaldo y reportes PDF médicos.</div>
      <button type="button" id="btn-upgrade-promo" class="btn-primary" style="margin:0 auto; display:block; padding: 8px 20px;">Pasar a Premium PRO (2,99€)</button>
    `;
    
    const btnPromo = document.getElementById('btn-upgrade-promo');
    if (btnPromo) {
      btnPromo.addEventListener('click', showPremiumPaywall);
    }

    // Bloquear Alertas SMS
    if (smsLockOverlay) smsLockOverlay.style.display = 'flex';
    if (inputSmsPhone) {
      inputSmsPhone.disabled = true;
      inputSmsPhone.value = '';
    }
  }
}

// Cargar credenciales de Telegram si existen
inputTgUser.value = localStorage.getItem('pastillero_tg_user') || '';

// --- 4. Navegación Inferior (SPA) ---
export function navigateTo(targetId) {
  // Vibración háptica micro-sutil en transición de pantalla
  if (navigator.vibrate) {
    navigator.vibrate(15);
  }

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

function initOnboardingDate() {
  const startDateInput = document.getElementById('start-date');
  if (startDateInput) {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);
    startDateInput.value = localISOTime;
  }
}

if (btnNewTreatmentPlan) {
  btnNewTreatmentPlan.addEventListener('click', () => {
    onboardingModal.classList.remove('hidden');
    initOnboardingDate();
  });
}

if (btnWelcomeStart) {
  btnWelcomeStart.addEventListener('click', () => {
    onboardingModal.classList.remove('hidden');
    initOnboardingDate();
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

    // Failsafe de Negocio: Límite Freemium de 2 tratamientos
    if (treatments.length >= 2 && !isPremium()) {
      showPremiumPaywall();
      if (btnSubmit) btnSubmit.disabled = false;
      return;
    }

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
    
    if (isPremium() && inputSmsPhone) {
      localStorage.setItem('pastillero_sms_phone', inputSmsPhone.value.trim());
    }

    await showModal("Configuración", "Configuración de avisos guardada correctamente.", true);
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
  const mainPillColorInput = document.getElementById('pill-color');
  if (mainPillColorInput && typeof mainPillColorInput.syncCustomSelect === 'function') {
    mainPillColorInput.value = 'white';
    mainPillColorInput.syncCustomSelect();
  }
  navItems[0].click(); // Simular volver a Hoy
});

// Marcar como tomada manualmente desde la lista
async function takePill(pillId) {
  const pillIndex = pills.findIndex(p => p.id === pillId);
  if (pillIndex === -1) return;

  const pill = pills[pillIndex];

  // Failsafe médico: comprobar si ya se ha tomado esta misma medicina hace menos de 60 minutos
  const threshold = 60 * 60 * 1000; // 60 minutos en ms
  const now = Date.now();
  const lastTaken = history.find(h => h.name === pill.name && !h.name.includes('(tratamiento finalizado)'));
  
  if (lastTaken) {
    const timeDiff = now - lastTaken.takenAt;
    if (timeDiff < threshold) {
      const minutesAgo = Math.round(timeDiff / 60000);
      const isConfirmed = await showModal(
        "⚠️ Alerta de Seguridad",
        `Registraste una toma de "${pill.name}" hace solo ${minutesAgo} minutos.\n\nRegistrar otra toma tan pronto podría causar una sobredosis accidental.\n\n¿Estás seguro de que quieres registrar esta dosis?`,
        false,
        "Registrar toma"
      );
      if (!isConfirmed) {
        return; // Abortar registro
      }
    }
  }

  // Vibración háptica de éxito (si está disponible)
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

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
  if (editPillColor) {
    editPillColor.value = pill.color || 'white';
    if (typeof editPillColor.syncCustomSelect === 'function') {
      editPillColor.syncCustomSelect();
    }
  }
  
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
let alarmVibrationInterval = null;

function startAlarmHaptics() {
  if (!('vibrate' in navigator)) return;
  const pattern = [500, 250, 500, 250, 1000, 500]; // 3s de vibración intermitente
  navigator.vibrate(pattern);
  alarmVibrationInterval = setInterval(() => {
    navigator.vibrate(pattern);
  }, 4000); // Repetir el patrón cada 4 segundos (3s patrón + 1s pausa)
}

function stopAlarmHaptics() {
  if (alarmVibrationInterval) {
    clearInterval(alarmVibrationInterval);
    alarmVibrationInterval = null;
  }
  if ('vibrate' in navigator) {
    navigator.vibrate(0); // Detener vibraciones activas
  }
}

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
  
  // Iniciar el bucle de vibración prolongado continuo
  startAlarmHaptics();
}

btnTakePill.addEventListener('click', async () => {
  if(activeAlarmPill) {
    await takePill(activeAlarmPill.id);
  }
  alarmModal.classList.add('hidden');
  activeAlarmPill = null;
  stopAlarmHaptics();
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
  stopAlarmHaptics();
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



// AUTO-CATCH-UP AVISOS PASADOS (A petición del usuario para cerrar avisos acumulados)
const _now = Date.now();
let _modified = false;
pills.forEach(pill => {
  if (pill.nextTime <= _now) {
    const interval = pill.frequencyHours * 60 * 60 * 1000;
    if (interval > 0) {
      const missed = Math.ceil((_now - pill.nextTime) / interval);
      pill.nextTime += missed * interval;
      _modified = true;
    }
  }
});
if (_modified) {
  saveState();
}

// Arrancar cronómetro de comprobación cada segundo
setInterval(() => {
  checkAlarms();
  updateCountdowns();
}, 1000);

// --- 9. Selector de Color Personalizado (Pastillas y Cápsulas CSS) ---
const colorOptions = [
  { group: 'Pastilla redonda', value: 'white', label: 'Blanca', isCapsule: false, color: '#ffffff', bg: '#f1f5f9' },
  { group: 'Pastilla redonda', value: 'red', label: 'Roja', isCapsule: false, color: '#ef4444', bg: '#fee2e2' },
  { group: 'Pastilla redonda', value: 'blue', label: 'Azul', isCapsule: false, color: '#3b82f6', bg: '#eff6ff' },
  { group: 'Pastilla redonda', value: 'yellow', label: 'Amarilla', isCapsule: false, color: '#facc15', bg: '#fef08a' },
  { group: 'Pastilla redonda', value: 'green', label: 'Verde', isCapsule: false, color: '#22c55e', bg: '#dcfce7' },
  { group: 'Pastilla redonda', value: 'pink', label: 'Rosa', isCapsule: false, color: '#ec4899', bg: '#fce7f3' },
  { group: 'Cápsula bicolor', value: 'capsule-red-white', label: 'Cápsula Roja/Blanca', isCapsule: true, color: '#ef4444', bg: '#ffffff' },
  { group: 'Cápsula bicolor', value: 'capsule-blue-white', label: 'Cápsula Azul/Blanca', isCapsule: true, color: '#3b82f6', bg: '#ffffff' },
  { group: 'Cápsula bicolor', value: 'capsule-green-white', label: 'Cápsula Verde/Blanca', isCapsule: true, color: '#22c55e', bg: '#ffffff' },
  { group: 'Cápsula bicolor', value: 'capsule-yellow-white', label: 'Cápsula Amarilla/Blanca', isCapsule: true, color: '#facc15', bg: '#ffffff' },
  { group: 'Cápsula bicolor', value: 'capsule-red-yellow', label: 'Cápsula Roja/Amarilla', isCapsule: true, color: '#ef4444', bg: '#facc15' },
  { group: 'Cápsula bicolor', value: 'capsule-blue-yellow', label: 'Cápsula Azul/Amarilla', isCapsule: true, color: '#3b82f6', bg: '#facc15' }
];

function getOptionIconHTML(option) {
  if (option.isCapsule) {
    return `<span class="pill-icon-capsule" style="background: linear-gradient(90deg, ${option.color} 50%, ${option.bg} 50%); border: 1.5px solid ${option.color};"></span>`;
  } else {
    return `<span class="pill-icon-circle" style="background: ${option.color};"></span>`;
  }
}

function setupCustomSelect(inputId, triggerId, dropdownId) {
  const input = document.getElementById(inputId);
  const trigger = document.getElementById(triggerId);
  const dropdown = document.getElementById(dropdownId);
  
  if (!input || !trigger || !dropdown) return;
  
  const container = trigger.closest('.custom-select-container');
  if (!container) return;
  
  // Generar opciones en el dropdown
  let currentGroup = '';
  let dropdownHTML = '';
  
  colorOptions.forEach(opt => {
    if (opt.group !== currentGroup) {
      currentGroup = opt.group;
      dropdownHTML += `<div class="custom-select-group-label">${currentGroup}</div>`;
    }
    
    dropdownHTML += `
      <div class="custom-select-option" data-value="${opt.value}">
        ${getOptionIconHTML(opt)}
        <span>${opt.label}</span>
      </div>
    `;
  });
  
  dropdown.innerHTML = dropdownHTML;
  
  // Función para actualizar la opción seleccionada visualmente
  function updateSelection(val) {
    input.value = val;
    const selectedOpt = colorOptions.find(o => o.value === val) || colorOptions[0];
    
    // Actualizar contenido del trigger
    trigger.querySelector('.custom-select-trigger-text').innerHTML = `
      ${getOptionIconHTML(selectedOpt)}
      <span>${selectedOpt.label}</span>
    `;
    
    // Marcar como seleccionado en la lista
    dropdown.querySelectorAll('.custom-select-option').forEach(el => {
      if (el.dataset.value === val) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }
  
  // Valor inicial
  updateSelection(input.value || 'white');
  
  // Abrir / Cerrar dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Cerrar otros dropdowns abiertos
    document.querySelectorAll('.custom-select-container').forEach(c => {
      if (c !== container) c.classList.remove('active');
    });
    
    container.classList.toggle('active');
  });
  
  // Click en una opción
  dropdown.addEventListener('click', (e) => {
    const optionEl = e.target.closest('.custom-select-option');
    if (!optionEl) return;
    
    const val = optionEl.dataset.value;
    updateSelection(val);
    container.classList.remove('active');
    
    // Simular evento change en el input oculto
    input.dispatchEvent(new Event('change'));
  });
  
  // Escuchar cambios de valor en el hidden input (por ejemplo, al abrir el modal de edición)
  input.syncCustomSelect = function() {
    updateSelection(input.value);
  };
}

// Inicializar selectores personalizados
setupCustomSelect('pill-color', 'pill-color-trigger', 'pill-color-dropdown');
setupCustomSelect('edit-pill-color', 'edit-pill-color-trigger', 'edit-pill-color-dropdown');

// Cerrar dropdowns al pulsar fuera
document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select-container').forEach(c => {
    c.classList.remove('active');
  });
});

// --- Eventos del Modelo de Negocio Premium ---

// Cerrar Paywall
if (btnPremiumClose) {
  btnPremiumClose.addEventListener('click', () => {
    premiumModal.classList.add('hidden');
  });
}

// Abrir Paywall al pulsar en el overlay de SMS
if (smsLockOverlay) {
  smsLockOverlay.addEventListener('click', () => {
    showPremiumPaywall();
  });
}

// Abrir Paywall al pulsar en el botón PDF (o generar reporte si es Premium)
if (btnExportPdf) {
  btnExportPdf.addEventListener('click', async () => {
    if (!isPremium()) {
      showPremiumPaywall();
    } else {
      // Generar Reporte de Adherencia Premium
      if (history.length === 0) {
        await showModal("Historial Vacío", "No hay datos en el historial para generar un reporte PDF.", true);
        return;
      }
      
      let reportHtml = `
        <div style="font-family: Arial, sans-serif; padding: 2rem; color: #333; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #3b82f6; padding-bottom: 1rem; margin-bottom: 2rem;">
            <div>
              <h1 style="color:#1e3a8a; margin: 0 0 4px; font-size: 1.8rem;">INFORME DE ADHERENCIA MÉDICA</h1>
              <span style="color:#64748b; font-size:0.85rem; font-weight:bold; text-transform:uppercase;">Mi Pastillero Premium PRO</span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:1.5rem;">💎</div>
              <span style="font-size: 0.8rem; color:#64748b;">Generado: ${new Date().toLocaleDateString('es-ES')}</span>
            </div>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; margin-bottom: 2rem; border-left: 4px solid #3b82f6; font-size: 0.9rem; line-height:1.5;">
            <strong>Estimado Doctor/a:</strong><br>
            A continuación se detalla el registro exacto de las tomas y la adherencia del paciente asociadas a sus tratamientos activos para su revisión clínica.
          </div>
          
          <h3 style="color:#1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Resumen de Tratamientos Activos</h3>
          <ul style="padding-left:1.5rem; line-height:1.6; font-size: 0.95rem;">
            ${treatments.map(t => {
              const pillsList = pills.filter(p => p.treatmentId === t.id).map(p => p.name).join(', ') || 'Sin medicación añadida';
              return `<li><strong>${t.pathology.toUpperCase()}</strong> (Inicio: ${new Date(t.startDate).toLocaleDateString()}): ${pillsList}</li>`;
            }).join('')}
          </ul>
          
          <h3 style="color:#1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top:2rem;">Registro Cronológico del Historial</h3>
          <table style="width:100%; border-collapse: collapse; font-size:0.85rem; text-align:left; margin-top: 1rem;">
            <thead>
              <tr style="background:#f1f5f9; border-bottom:2px solid #cbd5e1;">
                <th style="padding:10px;">Fecha y Hora</th>
                <th style="padding:10px;">Medicamento</th>
                <th style="padding:10px;">Programado para</th>
                <th style="padding:10px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(h => {
                const status = h.name.includes('(tratamiento finalizado)') ? 'Finalizado' : 'Tomada a tiempo ✅';
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding:8px 10px;">${new Date(h.takenAt).toLocaleString()}</td>
                    <td style="padding:8px 10px; font-weight:bold;">${h.name}</td>
                    <td style="padding:8px 10px;">${h.scheduledFor ? new Date(h.scheduledFor).toLocaleTimeString() : 'N/A'}</td>
                    <td style="padding:8px 10px; color:#16a34a; font-weight:bold;">${status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div style="text-align:center; margin-top: 3rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; font-size: 0.8rem; color:#94a3b8;">
            Informe de adherencia generado por Mi Pastillero Premium PRO. Los datos presentados están seguros y encriptados localmente.
          </div>
        </div>
      `;
      
      // Abrir una ventana limpia y llamar al cuadro de impresión
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`<html><head><title>Informe de Adherencia</title></head><body onload="window.print();window.close();">${reportHtml}</body></html>`);
      printWindow.document.close();
    }
  });
}

// Simulación de Compra de Suscripción PRO
if (btnUpgradeNow) {
  btnUpgradeNow.addEventListener('click', async () => {
    btnUpgradeNow.disabled = true;
    btnUpgradeNow.innerHTML = `<span class="premium-spinner"></span>Procesando pago seguro...`;
    
    // Simular retraso de pasarela bancaria segura de 3 segundos
    setTimeout(async () => {
      localStorage.setItem('pastillero_is_premium', 'true');
      btnUpgradeNow.disabled = false;
      btnUpgradeNow.innerText = "Activar Suscripción PRO";
      premiumModal.classList.add('hidden');
      
      // Renderizar UI Premium
      renderPremiumUI();
      renderViews();
      
      if('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
      
      await showModal("💎 ¡Bienvenido a Premium PRO!", "Tu suscripción ha sido activada con éxito. Ya puedes registrar tratamientos ilimitados, usar alertas SMS y exportar informes médicos en PDF.", true);
    }, 3000);
  });
}

// Inicializar Vista y Premium
renderPremiumUI();
renderViews();
