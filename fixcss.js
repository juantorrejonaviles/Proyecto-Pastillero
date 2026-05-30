const fs = require('fs');

let css = fs.readFileSync('style.css', 'utf8');

// Encuentra donde empiezan las medias queries y donde termina el modal
const idx = css.indexOf('.modal-text-center {');

let cleanCss = css.slice(0, idx);

const newRules = `
.modal-text-center {
  text-align: center;
  width: 90%;
  max-width: 330px;
  padding: 2rem 1.5rem;
}

.modal-msg-text {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.modal-cancel-text {
  flex: 1;
  padding: 10px;
  color: var(--text-secondary);
}

.modal-title {
  margin-bottom: 1.25rem;
  color: var(--text-primary);
}

/* --- Timeline (Cronograma de Hoy) --- */
#today-timeline, .timeline-container, #detail-timeline-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.timeline-item-wrapper {
  display: flex;
  gap: 1rem;
  position: relative;
  align-items: stretch;
}

.timeline-time-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 65px;
  position: relative;
}

/* Vertical line connecting the timeline dots */
.timeline-item-wrapper:not(:last-child) .timeline-time-badge::after {
  content: '';
  position: absolute;
  top: 24px;
  bottom: -24px;
  width: 2px;
  background-color: #e2e8f0;
  z-index: 0;
}

.timeline-time-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 4px solid #ffffff;
  box-shadow: 0 0 0 2px #cbd5e1;
  z-index: 1;
  margin-bottom: 6px;
}

.timeline-time-text {
  font-weight: 800;
  color: #334155;
  font-size: 0.95rem;
}

.timeline-card {
  flex: 1;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.timeline-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.timeline-card-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
}

.timeline-card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.timeline-compartment-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #f1f5f9;
  color: #475569;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid #e2e8f0;
}

.timeline-status-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.5);
}
`;

fs.writeFileSync('style.css', cleanCss + newRules);
