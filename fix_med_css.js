const fs = require('fs');
const cssFile = 'style.css';
let css = fs.readFileSync(cssFile, 'utf8');

const newCSS = `
/* --- Tarjetas de Medicación en Detalle --- */
.detail-med-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.detail-med-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.detail-card-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.detail-card-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.detail-stock-badge-container {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 4px 10px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail-stock-text {
  font-size: 0.85rem;
  font-weight: 700;
}

.detail-grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.detail-grid-container > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-grid-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #64748b;
}

.detail-grid-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

/* Make sure the vertical list has a nice gap */
.detail-meds-vertical-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}
`;

fs.writeFileSync(cssFile, css + '\\n' + newCSS);
console.log("Successfully appended new CSS rules.");
