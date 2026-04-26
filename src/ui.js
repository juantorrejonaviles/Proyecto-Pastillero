import { formatTime, navigateTo, showModal } from '../main.js';
import { treatments, currentTreatmentId, pills, history, selectedTreatmentId, saveState, setTreatments, setCurrentTreatmentId, setPills, setHistory, setSelectedTreatmentId, getDaysRemaining } from './store.js';
import { cancelCapacitorNotification } from './notifications.js';

// DOM Element placeholders (Queried dynamically to avoid importing everything)
// --- 7. Renderizado de Interfaz Dinámica ---
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
      table.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">Sin medicación. Toca para añadir.</div>';
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

      // Generar el icono de pastilla
      let pillIconHTML;
      if (isCapsule) {
        pillIconHTML = `<div style="width: 36px; height: 18px; border-radius: 9px; background: linear-gradient(90deg, ${pillColor} 50%, ${bgPillColor} 50%); border: 2px solid ${pillColor}; flex-shrink: 0; position: relative;"><div style="position:absolute; left:50%; top:0; bottom:0; width:2px; background: rgba(0,0,0,0.15);"></div></div>`;
      } else {
        pillIconHTML = `<div style="width: 36px; height: 18px; border-radius: 9px; background: linear-gradient(90deg, ${pillColor} 50%, ${bgPillColor} 50%); border: 2px solid ${pillColor}; flex-shrink: 0; position: relative;"><div style="position:absolute; left:50%; top:0; bottom:0; width:2px; background: rgba(0,0,0,0.15);"></div></div>`;
      }

      const card = document.createElement('div');
      card.className = 'senior-medical-card';
      
      card.innerHTML = `
        <div class="senior-block">
          <div style="display:flex; align-items:center; gap: 12px;">
            ${pillIconHTML}
            <span class="senior-name">${pill.name}</span>
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
            ${pill.indications === 'food' ? `<span style="background: #E0F2FE; color: #0369a1; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 800; border: 1px solid #BAE6FD;">🍴 CON COMIDA</span>` : ''}
            ${pill.indications === 'fasting' ? `<span style="background: #F1F5F9; color: #475569; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 800; border: 1px solid #E2E8F0;">🌙 EN AYUNAS</span>` : ''}
          </div>

          <div style="display:flex; align-items:center; justify-content:center; gap: 1.5rem; background: #f8fafc; padding: 8px 12px; border-radius: 12px; border: 1px solid rgba(106,170,228,0.15); white-space: nowrap;">
            <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Hechas hoy <span style="font-size: 1.2rem; font-weight: 900; color: var(--success-color); margin-left: 4px;">${doneToday}</span></span>
            <span style="width: 1px; height: 20px; background: #cbd5e1;"></span>
            <span style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase;">Quedan hoy <span style="font-size: 1.2rem; font-weight: 900; color: ${remaining > 0 ? '#F59E0B' : 'var(--success-color)'}; margin-left: 4px;">${remaining}</span></span>
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
      dateHeader.style = "margin: 1.5rem 0 0.5rem; color: var(--text-primary); text-transform: capitalize; font-size: 1.1rem; font-weight:800;";
      dateHeader.textContent = dateStr;
      document.getElementById('history-list').appendChild(dateHeader);

      Object.keys(groups[dateStr]).forEach(treatmentName => {
        const treatmentHeader = document.createElement('h4');
        treatmentHeader.style = "margin: 0.5rem 0 0.75rem; color: var(--success-color); font-size: 0.95rem; border-bottom: 2px solid var(--border-color); padding-bottom: 4px; font-weight:700;";
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
              <div class="check-btn" style="background:var(--success-color); border-color:var(--success-color); color:white; cursor:default">
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
  medsContainer.style.display = "flex";
  medsContainer.style.flexDirection = "column";
  medsContainer.style.gap = "1rem";
  
  treatmentPills.forEach(pill => {
    const card = document.createElement('div');
    card.style = "background: #fff; border: 2px solid var(--border-color); border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 0.75rem;";
    
    // Mapeo de colores visual
    const colorMap = { white: '#ffffff', red: '#ef4444', blue: '#3b82f6', yellow: '#facc15', green: '#22c55e', pink: '#ec4899' };
    const pillColor = colorMap[pill.color] || '#ffffff';
    
    // Calculo de tiempo
    const daysLeft = getDaysRemaining(pill);
    const durationText = daysLeft !== null ? `En ${daysLeft} días finaliza` : 'Permanente';
    
    let stockHTML = '';
    if (pill.stock !== null) {
      const stockColor = pill.stock <= pill.minStock ? 'var(--danger-color)' : 'var(--success-color)';
      stockHTML = `<span style="color: ${stockColor}; font-weight: 700; font-size: 0.85rem; white-space: nowrap;">📦 Quedan ${pill.stock} ud.</span>`;
    }

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: ${pillColor}; border: 2px solid #cbd5e1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0;"></div>
        <h4 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 0; word-break: break-all; overflow-wrap: anywhere; flex: 1;">${pill.name}</h4>
      </div>
      ${stockHTML ? `<div style="padding: 4px 10px; background: #FEF2F2; border-radius: 8px; border: 1px solid #FEE2E2; white-space: nowrap;">${stockHTML}</div>` : ''}
      
      <div style="background: var(--bg-color); border-radius: 12px; padding: 1rem; margin-top: 0.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem;">
        <div>
          <span style="color: var(--text-secondary); display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pauta</span>
          <strong style="color: var(--text-primary); font-size: 1rem;">Cada ${pill.frequencyHours}h</strong>
        </div>
        <div>
          <span style="color: var(--text-secondary); display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Duración</span>
          <strong style="color: var(--text-primary); font-size: 1rem;">${durationText}</strong>
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
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
          <div style="display: flex; align-items: center; gap: 12px; background: #F8FAFC; padding: 8px 16px; border-radius: 30px; border: 1px solid #E2E8F0; width: fit-content;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${statusColor};"></div>
            <span style="font-size: 1.4rem; font-weight: 900; color: var(--text-primary);">${formatTime(event.time)}</span>
          </div>
          
          <div style="background: ${cardBg}; border: 3px solid ${borderColor}; border-radius: 20px; padding: 1.5rem; box-shadow: var(--shadow-md); min-width: 0; border-left: 8px solid ${statusColor}; margin-left: 4px;">
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.75rem; word-break: break-all; overflow-wrap: anywhere; line-height: 1.2;">
              ${event.pillName}
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
              ${event.compartment ? `
                <div style="background: #FFFBEB; color: #92400E; padding: 8px 16px; border-radius: 12px; font-weight: 900; font-size: 1rem; border: 2px solid #F59E0B; display: flex; align-items: center; gap: 8px; width: fit-content;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                    <path d="M8 4v16M16 4v16M2 12h20"></path>
                  </svg>
                  HUECO PASTILLERO Nº${event.compartment}
                </div>
              ` : ''}
              <div style="font-weight: 900; font-size: 1.1rem; color: ${statusColor}; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                ${event.isDone ? '✅' : '⏳'} ${statusText}
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
    
    // Calcular tiempo de finalización más lejano entre sus pastillas
    let maxRemaining = 0;
    treatmentPills.forEach(p => {
      const rem = getDaysRemaining(p);
      if (rem !== null && rem > maxRemaining) maxRemaining = rem;
    });

    card.innerHTML = `
      <div class="treatment-card-header">
        <div class="treatment-card-info">
          <h4>${treatment.pathology}</h4>
      </div>
    </div>
    <div class="treatment-card-meta">
      <span>Inicio: ${new Date(treatment.startDate).toLocaleDateString()}</span>
      <span>${maxRemaining > 0 ? `Finaliza en aprox. ${maxRemaining} días` : 'Tratamiento indefinido'}</span>
    </div>
    <div class="pills-summary-list" style="display:flex; flex-direction:column; gap:8px; margin-top: 1rem;">
      ${treatmentPills.map(p => `<span class="pill-summary-tag" style="background:#f1f5f9; padding:8px 12px; border-radius:10px; font-size:0.9rem; font-weight:700; color:var(--text-primary); border:1px solid var(--border-color); word-break:break-all; overflow-wrap:anywhere;">${p.name}</span>`).join('')}
    </div>
    <div style="margin-top: 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
      <button class="btn-add-to-treatment" style="margin-top:0; flex:1;" data-id="${treatment.id}">+ Añadir más</button>
      <button class="btn-text btn-delete-treatment" data-id="${treatment.id}" style="color: var(--danger-color); font-size: 0.8rem; padding: 0;">Eliminar plan</button>
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

