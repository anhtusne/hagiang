/**
 * HÀ GIANG 4N3Đ TRIP COMPANION APP
 * Core logic for Check-ins, LocalStorage persistence, Confetti, Budget & Checklist.
 */

// Default Checklist items from itinerary
const DEFAULT_CHECKLIST = [
  { id: 'c1', text: 'CCCD + Bằng lái xe máy (gốc & bản mềm)', checked: false },
  { id: 'c2', text: 'Áo giữ nhiệt mỏng + Áo khoác gió ấm/chống nước', checked: false },
  { id: 'c3', text: '2–3 bộ đồ chụp ảnh (ưu tiên màu nổi, gọn nhẹ)', checked: false },
  { id: 'c4', text: 'Quần dài, giày thể thao có độ bám tốt', checked: false },
  { id: 'c5', text: 'Áo mưa bộ cao cấp + Túi chống nước điện thoại', checked: false },
  { id: 'c6', text: 'Sạc dự phòng (Powerbank) + Cáp sạc + Thẻ nhớ', checked: false },
  { id: 'c7', text: 'Kính râm, kem chống nắng, son dưỡng môi chống nẻ', checked: false },
  { id: 'c8', text: 'Thuốc cá nhân: Thuốc say xe, tiêu hóa, cảm sốt, urgo', checked: false },
  { id: 'c9', text: 'Găng tay lái xe, khăn rằn quàng cổ giữ ấm', checked: false },
  { id: 'c10', text: 'Balo/Túi duffel mềm dễ chằng dây xe máy (không dùng vali cứng)', checked: false }
];

// App State
let state = {
  checkins: {}, // spotId: boolean
  checklist: [], // array of objects { id, text, checked }
  numPeople: 2,
  theme: 'dark'
};

// DOM Elements
const doc = document;
let progressStats;
let progressBarFill;
let progressStatusText;
let themeToggleBtn;
let tabItems;
let bottomNavBtns;
let daySections;
let checklistContainer;
let checklistRatio;
let checklistBarFill;
let customItemInput;
let btnAddCustomItem;
let btnRestoreChecklist;
let numPeopleInput;
let incPeopleBtn;
let decPeopleBtn;
let costPerPerson;
let imageLightbox;
let lightboxImg;
let lightboxCaption;
let btnResetData;
let btnResetProgress;
let toastContainer;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  loadStoredData();
  setupEventListeners();
  updateProgressUI();
  renderChecklist();
  updateBudgetUI();
  applyTheme(state.theme);
});

function initDOMElements() {
  progressStats = doc.getElementById('progressStats');
  progressBarFill = doc.getElementById('progressBarFill');
  progressStatusText = doc.getElementById('progressStatusText');
  themeToggleBtn = doc.getElementById('themeToggleBtn');
  tabItems = doc.querySelectorAll('.tab-item');
  bottomNavBtns = doc.querySelectorAll('.bottom-nav-btn');
  daySections = doc.querySelectorAll('.day-section');
  checklistContainer = doc.getElementById('checklistContainer');
  checklistRatio = doc.getElementById('checklistRatio');
  checklistBarFill = doc.getElementById('checklistBarFill');
  customItemInput = doc.getElementById('customItemInput');
  btnAddCustomItem = doc.getElementById('btnAddCustomItem');
  btnRestoreChecklist = doc.getElementById('btnRestoreChecklist');
  numPeopleInput = doc.getElementById('numPeople');
  incPeopleBtn = doc.getElementById('incPeople');
  decPeopleBtn = doc.getElementById('decPeople');
  costPerPerson = doc.getElementById('costPerPerson');
  imageLightbox = doc.getElementById('imageLightbox');
  lightboxImg = doc.getElementById('lightboxImg');
  lightboxCaption = doc.getElementById('lightboxCaption');
  btnResetData = doc.getElementById('btnResetData');
  btnResetProgress = doc.getElementById('btnResetProgress');
  toastContainer = doc.getElementById('toastContainer');
}

// Load Data from LocalStorage
function loadStoredData() {
  try {
    const savedCheckins = localStorage.getItem('hg_checkins_2026');
    if (savedCheckins) {
      const parsed = JSON.parse(savedCheckins);
      if (typeof parsed === 'object' && parsed !== null) {
        state.checkins = parsed;
      }
    }

    const savedChecklist = localStorage.getItem('hg_checklist_2026');
    if (savedChecklist) {
      const parsedList = JSON.parse(savedChecklist);
      if (Array.isArray(parsedList) && parsedList.length > 0) {
        state.checklist = parsedList.map((item, idx) => {
          if (typeof item === 'string') {
            return { id: 'c_migrated_' + idx, text: item, checked: false };
          }
          return {
            id: item.id || ('c_idx_' + idx + '_' + Date.now()),
            text: item.text || item.title || item.name || '',
            checked: Boolean(item.checked)
          };
        }).filter(item => item.text && item.text.trim().length > 0);
      } else {
        state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item }));
      }
    } else {
      state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item }));
    }

    const savedTheme = localStorage.getItem('hg_theme_2026');
    if (savedTheme) {
      state.theme = savedTheme;
    }

    const savedPeople = localStorage.getItem('hg_people_2026');
    if (savedPeople && numPeopleInput) {
      state.numPeople = parseInt(savedPeople, 10) || 2;
      numPeopleInput.value = state.numPeople;
    }
  } catch (e) {
    console.error('Error loading data from storage', e);
    state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item }));
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const allSpotCards = doc.querySelectorAll('.spot-card');

  // Check-in button clicks
  allSpotCards.forEach(card => {
    const spotId = card.getAttribute('data-id');
    const checkinBtn = card.querySelector('.checkin-btn');
    const spotImg = card.querySelector('.spot-img');
    const spotName = card.querySelector('.spot-name')?.textContent || '';

    // Apply initial state
    if (state.checkins[spotId]) {
      card.classList.add('checked-in');
      if (checkinBtn) {
        const textSpan = checkinBtn.querySelector('.checkin-text');
        if (textSpan) textSpan.textContent = 'Đã check-in ✓';
      }
    }

    // Toggle check-in on button click
    if (checkinBtn) {
      checkinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCheckin(spotId, card, checkinBtn, spotName);
      });
    }

    // Lightbox zoom when clicking spot image
    if (spotImg) {
      spotImg.addEventListener('click', () => {
        openLightbox(spotImg.src, spotName);
      });
    }
  });

  // Top tabs click
  if (tabItems) {
    tabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        switchTab(target);
      });
    });
  }

  // Bottom navigation buttons
  if (bottomNavBtns) {
    bottomNavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        switchTab(target);
      });
    });
  }

  // Start trip button
  const btnStartTrip = doc.getElementById('btnStartTrip');
  if (btnStartTrip) {
    btnStartTrip.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('day1');
      const d1 = doc.getElementById('day1');
      if (d1) {
        window.scrollTo({ top: d1.offsetTop - 120, behavior: 'smooth' });
      }
    });
  }

  // Theme Toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(state.theme);
      localStorage.setItem('hg_theme_2026', state.theme);
    });
  }

  // Lightbox close
  doc.querySelectorAll('.lightbox-close, .lightbox-backdrop').forEach(el => {
    el.addEventListener('click', () => {
      if (imageLightbox) imageLightbox.classList.remove('active');
    });
  });

  // Budget counter handlers
  if (incPeopleBtn && numPeopleInput) {
    incPeopleBtn.addEventListener('click', () => {
      state.numPeople = Math.min(20, state.numPeople + 1);
      numPeopleInput.value = state.numPeople;
      updateBudgetUI();
    });
  }

  if (decPeopleBtn && numPeopleInput) {
    decPeopleBtn.addEventListener('click', () => {
      state.numPeople = Math.max(1, state.numPeople - 1);
      numPeopleInput.value = state.numPeople;
      updateBudgetUI();
    });
  }

  if (numPeopleInput) {
    numPeopleInput.addEventListener('change', () => {
      let val = parseInt(numPeopleInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 20) val = 20;
      state.numPeople = val;
      numPeopleInput.value = val;
      updateBudgetUI();
    });
  }

  // Checklist input & buttons
  if (btnAddCustomItem) {
    btnAddCustomItem.addEventListener('click', addCustomChecklistItem);
  }

  if (customItemInput) {
    customItemInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomChecklistItem();
      }
    });
  }

  if (btnRestoreChecklist) {
    btnRestoreChecklist.addEventListener('click', restoreDefaultChecklist);
  }

  // Reset checkins progress
  if (btnResetProgress) {
    btnResetProgress.addEventListener('click', () => {
      if (confirm('Đặt lại tất cả các điểm check-in về 0?')) {
        localStorage.removeItem('hg_checkins_2026');
        state.checkins = {};

        doc.querySelectorAll('.spot-card').forEach(card => {
          card.classList.remove('checked-in');
          const btn = card.querySelector('.checkin-btn');
          if (btn) {
            const span = btn.querySelector('.checkin-text');
            if (span) span.textContent = 'Check-in';
          }
        });

        updateProgressUI();
        showToast('Đã đặt lại toàn bộ điểm check-in về 0', 'fa-rotate-left');
      }
    });
  }

  // Reset all data
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ trạng thái check-in và danh sách hành lý không?')) {
        localStorage.removeItem('hg_checkins_2026');
        localStorage.removeItem('hg_checklist_2026');
        state.checkins = {};
        state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item }));

        doc.querySelectorAll('.spot-card').forEach(card => {
          card.classList.remove('checked-in');
          const btn = card.querySelector('.checkin-btn');
          if (btn) {
            const span = btn.querySelector('.checkin-text');
            if (span) span.textContent = 'Check-in';
          }
        });

        updateProgressUI();
        renderChecklist();
        showToast('Đã khôi phục cài đặt gốc!', 'fa-arrows-rotate');
      }
    });
  }
}

// Toggle Check-in Logic
function toggleCheckin(spotId, card, btn, spotName) {
  const isChecked = !!state.checkins[spotId];
  const textSpan = btn.querySelector('.checkin-text');

  if (isChecked) {
    delete state.checkins[spotId];
    card.classList.remove('checked-in');
    if (textSpan) textSpan.textContent = 'Check-in';
  } else {
    state.checkins[spotId] = true;
    card.classList.add('checked-in');
    if (textSpan) textSpan.textContent = 'Đã check-in ✓';

    // Confetti effect
    triggerConfetti();
    showToast(`Đã check-in: ${spotName || 'Điểm đến'}`);
  }

  // Save to LocalStorage
  localStorage.setItem('hg_checkins_2026', JSON.stringify(state.checkins));
  updateProgressUI();
}

// Update Trip Progress UI
function updateProgressUI() {
  const allCards = doc.querySelectorAll('.spot-card');
  const total = allCards.length || 18;

  let checkedCount = 0;
  allCards.forEach(card => {
    const id = card.getAttribute('data-id');
    if (id && state.checkins[id]) {
      checkedCount++;
    }
  });

  const percentage = Math.round((checkedCount / total) * 100);

  if (progressStats) {
    progressStats.textContent = `${checkedCount}/${total} điểm (${percentage}%)`;
  }
  if (progressBarFill) {
    progressBarFill.style.width = `${percentage}%`;
  }

  // Motivational quote based on progress
  if (progressStatusText) {
    if (checkedCount === 0) {
      progressStatusText.textContent = 'Sẵn sàng nổ máy cho hành trình thanh xuân! 🛵';
    } else if (checkedCount < 5) {
      progressStatusText.textContent = 'Ngày đầu đầy hứng khởi! Cổng trời Quản Bạ & Thẩm Mã chào đón bạn! 🌄';
    } else if (checkedCount < 10) {
      progressStatusText.textContent = 'Tự hào địa đầu Tổ quốc Lũng Cú & vẻ đẹp yên bình Lô Lô Chải! 🇻🇳';
    } else if (checkedCount < 15) {
      progressStatusText.textContent = 'Mã Pì Lèng ngoạn mục & Hẻm Tu Sản xanh ngắt lay động lòng người! 🌊';
    } else if (checkedCount < total) {
      progressStatusText.textContent = 'Sắp về đích trọn vẹn cung Hà Giang Loop rồi! Cố lên bạn ơi! 🏆';
    } else {
      progressStatusText.textContent = '🎊 XUẤT SẮC! Bạn đã chinh phục trọn vẹn toàn bộ các điểm đến Hà Giang! 🌟';
      triggerGrandCelebration();
    }
  }
}

// Tab Switching
function switchTab(targetId) {
  // Update top sticky tabs
  if (tabItems) {
    tabItems.forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-target') === targetId);
    });
  }

  // Update bottom nav
  if (bottomNavBtns) {
    bottomNavBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
    });
  }

  // Toggle sections
  if (daySections) {
    daySections.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active-section');
      } else {
        sec.classList.remove('active-section');
      }
    });
  }

  // Scroll smoothly to top of active section
  const targetSection = doc.getElementById(targetId);
  if (targetSection) {
    const offset = 125;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = targetSection.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

// Checklist Functions
function renderChecklist() {
  const container = doc.getElementById('checklistContainer');
  const ratioEl = doc.getElementById('checklistRatio');
  const barEl = doc.getElementById('checklistBarFill');
  if (!container) return;

  container.innerHTML = '';
  let checkedCount = 0;

  if (!state.checklist || state.checklist.length === 0) {
    container.innerHTML = `
      <div class="checklist-empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <p>Chưa có món đồ nào trong danh sách hành lý.</p>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyRestore">
          <i class="fa-solid fa-arrow-rotate-left"></i> Khôi phục danh sách chuẩn
        </button>
      </div>
    `;
    const btnEmptyRestore = doc.getElementById('btnEmptyRestore');
    if (btnEmptyRestore) {
      btnEmptyRestore.addEventListener('click', restoreDefaultChecklist);
    }
    if (ratioEl) ratioEl.textContent = '0/0 món (0%)';
    if (barEl) barEl.style.width = '0%';
    return;
  }

  state.checklist.forEach(item => {
    if (item.checked) checkedCount++;

    const itemEl = doc.createElement('div');
    itemEl.className = `checklist-item ${item.checked ? 'checked' : ''}`;
    itemEl.setAttribute('data-id', item.id);
    itemEl.innerHTML = `
      <div class="check-box" aria-hidden="true">
        ${item.checked ? '<i class="fa-solid fa-check"></i>' : ''}
      </div>
      <span class="item-text">${escapeHtml(item.text)}</span>
      <button type="button" class="delete-item-btn" title="Xóa món này" aria-label="Xóa ${escapeHtml(item.text)}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    // Click item row (checkbox or text) to toggle
    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.delete-item-btn')) return;
      toggleChecklistItem(item.id);
    });

    // Delete item
    const delBtn = itemEl.querySelector('.delete-item-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChecklistItem(item.id);
      });
    }

    container.appendChild(itemEl);
  });

  // Update stats
  const total = state.checklist.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  if (ratioEl) ratioEl.textContent = `${checkedCount}/${total} món (${pct}%)`;
  if (barEl) barEl.style.width = `${pct}%`;
}

function toggleChecklistItem(id) {
  const item = state.checklist.find(i => i.id === id);
  if (item) {
    item.checked = !item.checked;
    localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
    renderChecklist();
  }
}

function deleteChecklistItem(id) {
  const index = state.checklist.findIndex(item => item.id === id);
  if (index !== -1) {
    const [deleted] = state.checklist.splice(index, 1);
    localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
    renderChecklist();
    if (deleted) {
      showToast(`Đã xóa: "${deleted.text}"`, 'fa-trash-can');
    }
  }
}

function restoreDefaultChecklist() {
  state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item, checked: false }));
  localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
  renderChecklist();
  showToast('Đã khôi phục danh sách đồ dùng mặc định!', 'fa-arrow-rotate-left');
}

function addCustomChecklistItem() {
  const input = doc.getElementById('customItemInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  const newItem = {
    id: 'c_custom_' + Date.now(),
    text: text,
    checked: false
  };

  state.checklist.push(newItem);
  localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
  input.value = '';
  renderChecklist();
  showToast(`Đã thêm: "${text}"`, 'fa-plus');
}

// Escape HTML helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Toast notification helper
function showToast(message, icon = 'fa-check') {
  const container = doc.getElementById('toastContainer');
  if (!container) return;

  const toast = doc.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Budget Calculation
function updateBudgetUI() {
  localStorage.setItem('hg_people_2026', state.numPeople);

  const estimatedCostPerPerson = 3050000;
  const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(estimatedCostPerPerson);

  if (costPerPerson) {
    costPerPerson.textContent = formatted.replace('₫', 'đ');
  }
}

// Apply Theme
function applyTheme(theme) {
  if (theme === 'light') {
    doc.documentElement.setAttribute('data-theme', 'light');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>';
  } else {
    doc.documentElement.removeAttribute('data-theme');
    if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// Lightbox
function openLightbox(imgSrc, caption) {
  if (lightboxImg && imageLightbox) {
    lightboxImg.src = imgSrc;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    imageLightbox.classList.add('active');
  }
}

// Confetti Celebration
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#38bdf8', '#f59e0b', '#f43f5e']
    });
  }
}

function triggerGrandCelebration() {
  if (typeof confetti === 'function') {
    const end = Date.now() + 2 * 1000;
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }
}
