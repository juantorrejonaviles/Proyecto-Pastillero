import { formatTime, navigateTo, showModal } from '../main.js';
import { treatments, currentTreatmentId, pills, history, selectedTreatmentId, saveState, setTreatments, setCurrentTreatmentId, setPills, setHistory, setSelectedTreatmentId, getDaysRemaining } from './store.js';
import { cancelCapacitorNotification } from './notifications.js';

// DOM Element placeholders (Queried dynamically to avoid importing everything)
// --- 7. Renderizado de Interfaz Dinámica ---
// Helper para generar icono de pastilla
export function generatePillIconHTML(color) {
  const colorMap = {
    white: '#ffffff', red: '#ef4444', blue: '#3b82f6', 
    yellow: '#facc15', green: '#22c55e', pink: '#ec4899',
    'capsule-red-white': '#ef4444', 'capsule-blue-white': '#3b82f6',
    'capsule-green-white': '#22c55e', 'capsule-yellow-white': '#facc15',
    'capsule-red-yellow': '#ef4444', 'capsule-blue-yellow': '#3b82f6'
  };
  const pillColor = colorMap[color] || '#ffffff';
  const bgColorMap = {
    white: '#f1f5f9', red: '#fee2e2', blue: '#eff6ff', 
    yellow: '#fef08a', green: '#dcfce7', pink: '#fce7f3',
    'capsule-red-white': '#ffffff', 'capsule-blue-white': '#ffffff',
    'capsule-green-white': '#ffffff', 'capsule-yellow-white': '#ffffff',
    'capsule-red-yellow': '#facc15', 'capsule-blue-yellow': '#facc15'
  };
  const bgPillColor = bgColorMap[color] || '#f1f5f9';
  const isCapsule = (color || '').startsWith('capsule-');

  if (isCapsule) {
    return `<div class="pill-icon-container-capsule" style="background: linear-gradient(90deg, ${pillColor} 50%, ${bgPillColor} 50%); border: 2px solid ${pillColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.15); display: inline-block; vertical-align: middle;"><div class="pill-icon-capsule-divider"></div></div>`;
  } else {
    return `<div class="pill-icon-container-circle" style="background: ${pillColor}; border: 2px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.15); margin-left: 6px; margin-right: 6px; display: inline-block; vertical-align: middle;"></div>`;
  }
}

// --- 7. Renderizado de Interfaz Dinámica ---
export function renderViews() {
  renderToday();
  renderHistory();
  renderActiveTreatments();
}

// Helper para obtener pastillas de hoy
export function getTodayPills() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + (24 * 60 * 60 * 1000);
  
  return pills.filter(p => {
    const isScheduledToday = p.nextTime >= startOfDay && p.nextTime < endOfDay;
    const takenToday = history.some(h => h.name === p.name && h.takenAt >= startOfDay && h.takenAt < endOfDay);
    return isScheduledToday || takenToday;
  }).map(p => ({
    ...p,
    takenToday: history.some(h => h.name === p.name && h.takenAt >= startOfDay && h.takenAt < endOfDay),
    time: formatTime(p.nextTime)
  }));
}

// Renderiza la pantalla "Hoy" en formato "Tratamiento de Hoy" con contadores
export function renderToday() {
  const container = document.getElementById('today-pills-list');
  const emptyState = document.getElementById('today-empty-state');
  
  // Actualizar la fecha del informe en la cabecera
  if (document.getElementById('screen-title')) document.getElementById('screen-title').innerText = "Medicación de hoy";
  const dateLabel = document.getElementById('current-date-text');

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  if (dateLabel) dateLabel.textContent = dateFormatted;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + (24 * 60 * 60 * 1000);

  if (treatments.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (container) container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (!container) return;
  container.innerHTML = '';

  // Agrupar pastillas por tratamiento
  treatments.forEach(treatment => {
    const treatmentPills = pills.filter(p => p.treatmentId === treatment.id);

    // Crear sección de tratamiento
    const section = document.createElement('div');
    section.className = 'report-treatment-section';
    section.addEventListener('click', () => {
      setSelectedTreatmentId(treatment.id);
      navigateTo('screen-treatment-detail');
    });
    
    section.innerHTML = `
      <div class="report-treatment-title">${treatment.pathology}</div>
      <div class="report-pills-table"></div>
    `;
    
    const table = section.querySelector('.report-pills-table');

    if (treatmentPills.length === 0) {
      table.innerHTML = '<div class="report-empty-text">Sin medicación. Toca para añadir.</div>';
    }

    treatmentPills.forEach(pill => {
      // Contar tomas completadas hoy
      const doneToday = history.filter(h => 
        h.name === pill.name && 
        h.takenAt >= startOfDay && 
        h.takenAt < endOfDay
      ).length;

      // Proyectar tomas restantes
      let remaining = 0;
      let estimatedTime = pill.nextTime;
      while (estimatedTime < endOfDay) {
        remaining++;
        estimatedTime += (pill.frequencyHours * 60 * 60 * 1000);
        if (remaining > 50) break; 
      }

      const pillIconHTML = generatePillIconHTML(pill.color);

      const card = document.createElement('div');
      card.className = 'senior-medical-card';
      
      card.innerHTML = `
        <div class="senior-block">
          <div class="detail-card-row" style="align-items: center; margin-bottom: 0.5rem;">
            ${pillIconHTML}
            <span class="senior-name" style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-left: 8px;">${pill.name}</span>
          </div>

          ${pill.compartment ? `
            <div class="senior-compartment-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <path d="M8 4v16M16 4v16M2 12h20"></path>
              </svg>
              HUECO PASTILLERO Nº${pill.compartment}
            </div>
          ` : ''}

          <div style="display:flex; flex-wrap: wrap; gap: 8px;">
            ${pill.indications === 'food' ? `<span class="badge-indications-food">🍴 CON COMIDA</span>` : ''}
            ${pill.indications === 'fasting' ? `<span class="badge-indications-fasting">🌙 EN AYUNAS</span>` : ''}
          </div>

          <div class="senior-pill-compliance-tray">
            <span class="senior-tray-label">Hechas hoy <span class="senior-tray-value" style="color: var(--success-color);">${doneToday}</span></span>
            <span class="senior-tray-divider"></span>
            <span class="senior-tray-label">Quedan hoy <span class="senior-tray-value" style="color: ${remaining > 0 ? '#F59E0B' : 'var(--success-color)'};">${remaining}</span></span>
          </div>
        </div>
      `;
      table.appendChild(card);
    });

    container.appendChild(section);
  });

  // Mostrar consejo de salud diario
  const healthTips = [
    "Recuerda beber un vaso entero de agua con tu medicación para proteger tu estómago.",
    "Toma los medicamentos siempre a la misma hora para ayudar a crear una rutina segura.",
    "No te acuestes inmediatamente después de tomar las pastillas. Espera al menos 15 minutos.",
    "Si olvidas una dosis, no tomes el doble en la siguiente. Simplemente sigue tu horario habitual.",
    "Anota cualquier síntoma raro tras iniciar un tratamiento para comentárselo a tu médico.",
    "Evita partir o triturar las pastillas a menos que el médico o farmacéutico te lo haya indicado."
  ];
  const tipEl = document.getElementById('health-tip-text');
  const tipContainer = document.getElementById('health-tip-container');
  if (tipEl && tipContainer) {
    if (treatments.length === 0) {
      tipContainer.classList.add('hidden'); // Ocultar si no hay tratamientos
    } else {
      tipContainer.classList.remove('hidden');
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      tipEl.textContent = healthTips[dayOfYear % healthTips.length];
    }
  }
}

// 2. Render Historial
export function renderHistory() {
  document.getElementById('history-list').innerHTML = ''; // Clear previous elements
  if (history.length === 0) {
    document.getElementById('history-empty-state').classList.remove('hidden');
  } else {
    document.getElementById('history-empty-state').classList.add('hidden');
    const sortedHistory = [...history].sort((a, b) => b.takenAt - a.takenAt);
    
    // Estructura: groups[fecha][tratamiento] = [records]
    const groups = {};
    
    sortedHistory.forEach(record => {
      const date = new Date(record.takenAt);
      const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const pill = pills.find(p => p.name === record.name);
      let treatmentName = "Otros";
      if (pill) {
        const treatment = treatments.find(t => t.id === pill.treatmentId);
        if (treatment) treatmentName = treatment.pathology;
      }
      
      if (!groups[dateStr]) groups[dateStr] = {};
      if (!groups[dateStr][treatmentName]) groups[dateStr][treatmentName] = [];
      
      groups[dateStr][treatmentName].push(record);
    });

    Object.keys(groups).forEach(dateStr => {
      const dateHeader = document.createElement('h3');
      dateHeader.className = 'history-date-header';
      dateHeader.textContent = dateStr;
      document.getElementById('history-list').appendChild(dateHeader);

      Object.keys(groups[dateStr]).forEach(treatmentName => {
        const treatmentHeader = document.createElement('h4');
        treatmentHeader.className = 'history-treatment-header';
        treatmentHeader.textContent = treatmentName;
        document.getElementById('history-list').appendChild(treatmentHeader);

        groups[dateStr][treatmentName].forEach(record => {
          const wrapperEl = document.createElement('div');
          wrapperEl.className = 'history-item-container';
          const recordId = record.id || record.takenAt;
          
          wrapperEl.innerHTML = `
            <div class="pill-item history-pill-item taken">
              <input type="checkbox" class="history-checkbox" value="${recordId}">
              <div class="pill-info">
                <h4>${record.name}</h4>
                <p>Hora: ${new Date(record.takenAt).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
              <div class="check-btn history-check-taken">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
            </div>
          `;
          document.getElementById('history-list').appendChild(wrapperEl);
        });
      });
    });
  }

  // Render Tratamientos Activos
  renderActiveTreatments();
  if (selectedTreatmentId) renderTreatmentDetail(selectedTreatmentId);
}

// Renderiza el desglose de tomas de un tratamiento específico con diseño expandido
export function renderTreatmentDetail(treatmentId) {
  const medsContainer = document.getElementById('detail-meds-list');
  const timelineContainer = document.getElementById('detail-timeline-list');
  const titleLabel = document.getElementById('detail-treatment-name');
  
  if (!medsContainer || !timelineContainer) return;

  const treatment = treatments.find(t => t.id === treatmentId);
  if (!treatment) return;

  if (titleLabel) titleLabel.textContent = treatment.pathology.toUpperCase();
  
  // Limpiar contenedores
  medsContainer.innerHTML = '';
  timelineContainer.innerHTML = '';

  const treatmentPills = pills.filter(p => p.treatmentId === treatmentId);
  if (treatmentPills.length === 0) {
    timelineContainer.innerHTML = '<p class="empty-state">No hay medicamentos.</p>';
    return;
  }

  // 1. Listado de Medicamentos incluido (Grandes Tarjetas Expandidas)
  medsContainer.classList.add('detail-meds-vertical-list');
  
  treatmentPills.forEach(pill => {
    const card = document.createElement('div');
    card.className = 'timeline-card';
    card.style = 'background: #ffffff; border: 3px solid #e2e8f0; border-left: 8px solid #3B82F6; margin-bottom: 1rem;';
    
    // Mapeo de colores visual
    const colorMap = {
      white: '#ffffff', red: '#ef4444', blue: '#3b82f6', 
      yellow: '#facc15', green: '#22c55e', pink: '#ec4899',
      'capsule-red-white': '#ef4444', 'capsule-blue-white': '#3b82f6',
      'capsule-green-white': '#22c55e', 'capsule-yellow-white': '#facc15',
      'capsule-red-yellow': '#ef4444', 'capsule-blue-yellow': '#3b82f6'
    };
    const pillColor = colorMap[pill.color] || '#ffffff';
    const bgColorMap = {
      white: '#f1f5f9', red: '#fee2e2', blue: '#eff6ff', 
      yellow: '#fef08a', green: '#dcfce7', pink: '#fce7f3',
      'capsule-red-white': '#ffffff', 'capsule-blue-white': '#ffffff',
      'capsule-green-white': '#ffffff', 'capsule-yellow-white': '#ffffff',
      'capsule-red-yellow': '#facc15', 'capsule-blue-yellow': '#facc15'
    };
    const bgPillColor = bgColorMap[pill.color] || '#f1f5f9';
    const isCapsule = (pill.color || '').startsWith('capsule-');

    let pillIconHTML;
    if (isCapsule) {
      pillIconHTML = `<div class="pill-icon-container-capsule" style="background: linear-gradient(90deg, ${pillColor} 50%, ${bgPillColor} 50%); border: 2px solid ${pillColor}; flex-shrink: 0; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div class="pill-icon-capsule-divider"></div></div>`;
    } else {
      pillIconHTML = `<div class="pill-icon-detail-circle" style="background: ${pillColor}; border: 2px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-left: 2px; margin-right: 2px;"></div>`;
    }
    
    // Calculo de tiempo
    const daysLeft = getDaysRemaining(pill);
    const durationText = daysLeft !== null ? `En ${daysLeft} días finaliza` : 'Permanente';
    
    let stockHTML = '';
    if (pill.stock !== null) {
      const stockColor = pill.stock <= pill.minStock ? 'var(--danger-color)' : 'var(--success-color)';
      stockHTML = `<span class="detail-stock-text" style="color: ${stockColor};">📦 Quedan ${pill.stock} ud.</span>`;
    }

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div class="timeline-card-title" style="margin-bottom: 0;">
            ${pill.name}
          </div>
          ${pillIconHTML}
        </div>
        
        ${stockHTML ? `<div style="margin-bottom: 1rem;">${stockHTML}</div>` : ''}
        
        <div class="detail-grid-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 8px;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Pauta</span>
            <strong style="color: #0f172a; font-size: 0.95rem;">Cada ${pill.frequencyHours}h</strong>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Duración</span>
            <strong style="color: #0f172a; font-size: 0.95rem;">${durationText}</strong>
          </div>
        </div>
    `;
    medsContainer.appendChild(card);
  });

  // 2. Cronograma de Hoy (Generar eventos de todo el día de forma visualmente holgada)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + (24 * 60 * 60 * 1000);

  const timelineEvents = [];

  treatmentPills.forEach(pill => {
    // Obtener tomas de este pill hoy de historial
    const dosesDone = history.filter(h => 
      h.name === pill.name && 
      h.takenAt >= startOfDay && 
      h.takenAt < endOfDay &&
      !h.name.includes('(tratamiento finalizado)')
    ).sort((a, b) => a.takenAt - b.takenAt);

    // Añadir realizadas al timeline
    dosesDone.forEach(h => {
      timelineEvents.push({
        time: h.takenAt,
        pillName: pill.name,
        compartment: pill.compartment,
        status: '✅ TOMADA',
        isDone: true
      });
    });

    // Añadir pendientes proyectadas estrictamente hasta las 24:00 de hoy
    let estimatedTime = pill.nextTime;
    let pendingCount = 0;
    while (estimatedTime < endOfDay) {
      timelineEvents.push({
        time: estimatedTime,
        pillName: pill.name,
        compartment: pill.compartment,
        status: '⏳ PENDIENTE',
        isDone: false
      });
      estimatedTime += (pill.frequencyHours * 60 * 60 * 1000);
      pendingCount++;
      if (pendingCount > 50) break; // salvaguarda
    }
  });

  // Ordenar cronológicamente
  timelineEvents.sort((a, b) => a.time - b.time);

  if (timelineEvents.length === 0) {
    timelineContainer.innerHTML = '<p class="empty-state">Sin tomas programadas para lo que queda de día.</p>';
  } else {
    timelineEvents.forEach((event, index) => {
      const row = document.createElement('div');
      
      const isPast = event.time < Date.now() && !event.isDone; 
      const cardBg = event.isDone ? '#F0FDF4' : (isPast ? '#FEF2F2' : '#FFFFFF');
      const borderColor = event.isDone ? '#86EFAC' : (isPast ? '#FCA5A5' : '#E2E8F0');
      const statusColor = event.isDone ? '#166534' : (isPast ? '#991B1B' : '#B45309');
      const statusText = event.isDone ? '✅ TOMADA' : (isPast ? '⚠️ ATRASADA' : '⏳ PENDIENTE');
      const textColor = event.isDone ? '#15803d' : 'var(--text-primary)';
      
      // Aplicar línea conector excepto al último elemento
      const borderBottom = index < timelineEvents.length - 1 ? 'border-bottom: 2px dashed #CBD5E1;' : '';

      row.innerHTML = `
        <div class="timeline-item-wrapper">
          <div class="timeline-card" style="background: ${cardBg}; border: 3px solid ${borderColor}; border-left: 8px solid #3B82F6;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <div class="timeline-card-title" style="margin-bottom: 0;">
                ${event.pillName}
              </div>
              <span class="timeline-time-text" style="color: #16A34A; font-size: 1.1rem;">${formatTime(event.time)}</span>
            </div>
            
            <div class="timeline-card-actions">
              ${event.compartment ? `
                <div class="timeline-compartment-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <path d="M8 4v16M16 4v16M2 12h20"></path>
                  </svg>
                  HUECO PASTILLERO Nº${event.compartment}
                </div>
              ` : ''}
              <div class="timeline-status-text" style="color: #DC2626;">
                ${statusText}
              </div>
            </div>
          </div>
        </div>
      `;
      timelineContainer.appendChild(row);
    });
  }
}

export function renderActiveTreatments() {
  if (document.getElementById('screen-title')) document.getElementById('screen-title').innerText = "Mis Tratamientos";
  document.getElementById('treatments-list').innerHTML = '';
  if (treatments.length === 0) {
    document.getElementById('treatments-empty-state').classList.remove('hidden');
    return;
  }
  
  document.getElementById('treatments-empty-state').classList.add('hidden');
  treatments.forEach(treatment => {
    const treatmentPills = pills.filter(p => p.treatmentId === treatment.id);
    const card = document.createElement('div');
    card.className = `treatment-card ${treatment.id === currentTreatmentId ? 'active-border' : ''}`;
    
    // Formatear Fecha y Hora de Inicio
    let formattedStart = 'No definida';
    if (treatment.startDate) {
      let startD;
      if (treatment.startDate.includes('T')) {
        // Caso nuevo con hora capturada
        startD = new Date(treatment.startDate);
      } else {
        // Caso antiguo: intentar extraer el timestamp de creación del ID
        const idParts = treatment.id.split('_');
        if (idParts.length > 1 && !isNaN(idParts[1])) {
          startD = new Date(parseInt(idParts[1]));
        } else {
          startD = new Date(treatment.startDate);
        }
      }
      formattedStart = startD.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    }

    // Calcular fin del tratamiento a partir del final de sus medicamentos
    let maxEndDate = null;
    let hasIndefinite = false;
    let hasTimedPills = false;
    
    treatmentPills.forEach(p => {
      if (p.endDate === null) {
        hasIndefinite = true;
      } else {
        hasTimedPills = true;
        if (maxEndDate === null || p.endDate > maxEndDate) {
          maxEndDate = p.endDate;
        }
      }
    });

    let formattedEnd = 'Sin medicamentos';
    if (treatmentPills.length > 0) {
      if (hasIndefinite) {
        formattedEnd = 'Permanente';
      } else if (hasTimedPills && maxEndDate !== null) {
        const endD = new Date(maxEndDate);
        formattedEnd = endD.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
      }
    }

    card.innerHTML = `
      <div class="treatment-card-header">
        <div class="treatment-card-title-wrapper">
          <span class="treatment-card-icon">📋</span>
          <h4 class="treatment-card-title">${treatment.pathology}</h4>
        </div>
      </div>
      
      <div class="treatment-card-meta-list">
        <div class="meta-item">
          <span class="meta-label">INICIO DEL PLAN:</span>
          <span class="meta-value">${formattedStart}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">FIN ESTIMADO:</span>
          <span class="meta-value">${formattedEnd}</span>
        </div>
      </div>

      <div class="treatment-meds-section">
        <div class="meds-section-title">MEDICAMENTOS EN ESTE PLAN</div>
        <div class="treatment-summary-list">
          ${treatmentPills.length > 0 
            ? treatmentPills.map(p => `<span class="pill-summary-tag">${generatePillIconHTML(p.color)} <span style="margin-left:4px;">${p.name}</span></span>`).join('') 
            : `<span class="pill-summary-empty">Ningún medicamento añadido aún</span>`}
        </div>
      </div>

      <div class="treatment-action-row">
        <button class="btn-add-to-treatment" data-id="${treatment.id}">
          <span>+ Añadir medicamento</span>
        </button>
        <button class="btn-text btn-delete-treatment treatment-delete-btn" data-id="${treatment.id}">
          <span>Eliminar plan</span>
        </button>
      </div>
    `;
  
  // Evento para ver detalle
  card.addEventListener('click', () => {
    setSelectedTreatmentId(treatment.id);
    navigateTo('screen-treatment-detail');
  });

  // Evento para añadir medicamento
  card.querySelector('.btn-add-to-treatment').addEventListener('click', (e) => {
    e.stopPropagation(); // Evitar navegar al detalle
    setCurrentTreatmentId(treatment.id);
    navigateTo('screen-add');
  });

  // Evento para borrar tratamiento
    card.querySelector('.btn-delete-treatment').addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirm = await showModal("Eliminar Tratamiento", `¿Estás seguro de que quieres borrar todo el tratamiento de "${treatment.pathology}"? Se borrarán también sus medicinas.`, false);
      if (confirm) {
        setTreatments(treatments.filter(t => t.id !== treatment.id));
        setPills(pills.filter(p => p.treatmentId !== treatment.id));
        if (currentTreatmentId === treatment.id) setCurrentTreatmentId(treatments.length > 0 ? treatments[0].id : null);
        saveState();
        renderViews();
      }
    });

    document.getElementById('treatments-list').appendChild(card);
  });
}

// Micro-Animación simpática al tomar pastilla
export function animateSuccess() {
  if('vibrate' in navigator) navigator.vibrate(50);
}

