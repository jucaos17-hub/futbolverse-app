import { getToday, getDateOffset } from '../utils/formatters.js';

export function renderDatePicker(currentDate, onChange) {
  const today = getToday();

  return `
    <div class="date-picker" id="date-picker">
      <button class="btn btn--secondary btn--sm" data-offset="-1" id="date-prev">← Ayer</button>
      <button class="btn ${currentDate === today ? 'btn--active' : 'btn--secondary'} btn--sm" data-offset="0" id="date-today">Hoy</button>
      <button class="btn btn--secondary btn--sm" data-offset="1" id="date-next">Mañana →</button>
      <input type="date" class="date-picker__input" id="date-input" value="${currentDate}" />
    </div>
  `;
}

export function attachDatePickerEvents(onChange) {
  const prevBtn = document.getElementById('date-prev');
  const todayBtn = document.getElementById('date-today');
  const nextBtn = document.getElementById('date-next');
  const dateInput = document.getElementById('date-input');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const current = dateInput.value;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      const newDate = d.toISOString().split('T')[0];
      dateInput.value = newDate;
      onChange(newDate);
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      const today = getToday();
      dateInput.value = today;
      onChange(today);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const current = dateInput.value;
      const d = new Date(current);
      d.setDate(d.getDate() + 1);
      const newDate = d.toISOString().split('T')[0];
      dateInput.value = newDate;
      onChange(newDate);
    });
  }

  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      onChange(e.target.value);
    });
  }
}
