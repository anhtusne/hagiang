/**
 * HÀ GIANG 4N3Đ TRIP COMPANION APP
 * Core logic for Check-ins, LocalStorage persistence, Confetti, Budget & Checklist.
 */

// Default Checklist items from itinerary
const DEFAULT_CHECKLIST = [
  { id: 'c1', text: 'CCCD + Bằng lái xe máy (gốc & bản mềm)' },
  { id: 'c2', text: 'Áo giữ nhiệt mỏng + Áo khoác gió ấm/chống nước' },
  { id: 'c3', text: '2–3 bộ đồ chụp ảnh (ưu tiên màu nổi, gọn nhẹ)' },
  { id: 'c4', text: 'Quần dài, giày thể thao có độ bám tốt' },
  { id: 'c5', text: 'Áo mưa bộ cao cấp + Túi chống nước điện thoại' },
  { id: 'c6', text: 'Sạc dự phòng (Powerbank) + Cáp sạc + Thẻ nhớ' },
  { id: 'c7', text: 'Kính râm, kem chống nắng, son dưỡng môi chống nẻ' },
  { id: 'c8', text: 'Thuốc cá nhân: Thuốc say xe, tiêu hóa, cảm sốt, urgo' },
  { id: 'c9', text: 'Găng tay lái xe, khăn rằn quàng cổ giữ ấm' },
  { id: 'c10', text: 'Balo/Túi duffel mềm dễ chằng dây xe máy (không dùng vali cứng)' }
];

// App State
let state = {
  checkins: {}, // spotId: boolean
  checklist: [], // array of objects
  numPeople: 2,
  theme: 'dark'
};

// DOM Elements
const doc = document;
const progressStats = doc.getElementById('progressStats');
const progressBarFill = doc.getElementById('progressBarFill');
const progressStatusText = doc.getElementById('progressStatusText');
const themeToggleBtn = doc.getElementById('themeToggleBtn');
const shareBtn = doc.getElementById('shareBtn');
const tabItems = doc.querySelectorAll('.tab-item');
const bottomNavBtns = doc.querySelectorAll('.bottom-nav-btn');
const daySections = doc.querySelectorAll('.day-section');
const checklistContainer = doc.getElementById('checklistContainer');
const checklistRatio = doc.getElementById('checklistRatio');
const checklistBarFill = doc.getElementById('checklistBarFill');
const customItemInput = doc.getElementById('customItemInput');
const btnAddCustomItem = doc.getElementById('btnAddCustomItem');
const btnRestoreChecklist = doc.getElementById('btnRestoreChecklist');
const numPeopleInput = doc.getElementById('numPeople');
const incPeopleBtn = doc.getElementById('incPeople');
const decPeopleBtn = doc.getElementById('decPeople');
const costPerPerson = doc.getElementById('costPerPerson');
const imageLightbox = doc.getElementById('imageLightbox');
const lightboxImg = doc.getElementById('lightboxImg');
const lightboxCaption = doc.getElementById('lightboxCaption');
const btnResetData = doc.getElementById('btnResetData');
const btnResetProgress = doc.getElementById('btnResetProgress');

// Total spots across all 4 days
const allSpotCards = doc.querySelectorAll('.spot-card');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  setupEventListeners();
  updateProgressUI();
  renderChecklist();
  updateBudgetUI();
  applyTheme(state.theme);
});

// Load Data from LocalStorage
function loadStoredData() {
  try {
    const savedCheckins = localStorage.getItem('hg_checkins_2026');
    if (savedCheckins) {
      state.checkins = JSON.parse(savedCheckins);
    }

    const savedChecklist = localStorage.getItem('hg_checklist_2026');
    if (savedChecklist) {
      state.checklist = JSON.parse(savedChecklist);
    } else {
      state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item, checked: false }));
    }

    const savedTheme = localStorage.getItem('hg_theme_2026');
    if (savedTheme) {
      state.theme = savedTheme;
    }

    const savedPeople = localStorage.getItem('hg_people_2026');
    if (savedPeople) {
      state.numPeople = parseInt(savedPeople, 10) || 2;
      numPeopleInput.value = state.numPeople;
    }
  } catch (e) {
    console.error('Error loading data from storage', e);
  }
}

// Setup Event Listeners
function setupEventListeners() {
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
        checkinBtn.querySelector('.checkin-text').textContent = 'Đã check-in ✓';
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
  tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-target');
      switchTab(target);
    });
  });

  // Bottom navigation buttons
  bottomNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      switchTab(target);
    });
  });

  // Start trip button
  const btnStartTrip = doc.getElementById('btnStartTrip');
  if (btnStartTrip) {
    btnStartTrip.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('day1');
      window.scrollTo({ top: doc.getElementById('day1').offsetTop - 120, behavior: 'smooth' });
    });
  }

  // Theme Toggle
  themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    localStorage.setItem('hg_theme_2026', state.theme);
  });

  // Lightbox close
  doc.querySelectorAll('.lightbox-close, .lightbox-backdrop').forEach(el => {
    el.addEventListener('click', () => imageLightbox.classList.remove('active'));
  });

  // Budget counter handlers
  incPeopleBtn.addEventListener('click', () => {
    state.numPeople = Math.min(20, state.numPeople + 1);
    numPeopleInput.value = state.numPeople;
    updateBudgetUI();
  });

  decPeopleBtn.addEventListener('click', () => {
    state.numPeople = Math.max(1, state.numPeople - 1);
    numPeopleInput.value = state.numPeople;
    updateBudgetUI();
  });

  numPeopleInput.addEventListener('change', () => {
    let val = parseInt(numPeopleInput.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 20) val = 20;
    state.numPeople = val;
    numPeopleInput.value = val;
    updateBudgetUI();
  });

  // Checklist handlers
  btnAddCustomItem.addEventListener('click', addCustomChecklistItem);
  customItemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addCustomChecklistItem();
  });

  if (btnRestoreChecklist) {
    btnRestoreChecklist.addEventListener('click', restoreDefaultChecklist);
  }

  // Reset checkins progress
  const btnResetProgress = doc.getElementById('btnResetProgress');
  if (btnResetProgress) {
    btnResetProgress.addEventListener('click', () => {
      if (confirm('Đặt lại tất cả các điểm check-in về 0?')) {
        localStorage.removeItem('hg_checkins_2026');
        state.checkins = {};

        doc.querySelectorAll('.spot-card').forEach(card => {
          card.classList.remove('checked-in');
          const btn = card.querySelector('.checkin-btn');
          if (btn) btn.querySelector('.checkin-text').textContent = 'Check-in';
        });

        updateProgressUI();
      }
    });
  }

  // Reset all data if footer reset exists
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ trạng thái check-in và danh sách hành lý không?')) {
        localStorage.removeItem('hg_checkins_2026');
        localStorage.removeItem('hg_checklist_2026');
        state.checkins = {};
        state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item, checked: false }));

        doc.querySelectorAll('.spot-card').forEach(card => {
          card.classList.remove('checked-in');
          const btn = card.querySelector('.checkin-btn');
          if (btn) btn.querySelector('.checkin-text').textContent = 'Check-in';
        });

        updateProgressUI();
        renderChecklist();
      }
    });
  }
}

// Toggle Check-in Logic
function toggleCheckin(spotId, card, btn, spotName) {
  const isChecked = !!state.checkins[spotId];
  if (isChecked) {
    delete state.checkins[spotId];
    card.classList.remove('checked-in');
    btn.querySelector('.checkin-text').textContent = 'Check-in';
  } else {
    state.checkins[spotId] = true;
    card.classList.add('checked-in');
    btn.querySelector('.checkin-text').textContent = 'Đã check-in ✓';

    // Confetti effect
    triggerConfetti();
  }

  // Save to LocalStorage
  localStorage.setItem('hg_checkins_2026', JSON.stringify(state.checkins));
  updateProgressUI();
}

// Update Trip Progress UI
function updateProgressUI() {
  const allCards = doc.querySelectorAll('.spot-card');
  const total = allCards.length || 18;
  
  // Only count checkins that correspond to existing cards
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
  tabItems.forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-target') === targetId);
  });

  // Update bottom nav
  bottomNavBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
  });

  // Toggle sections
  daySections.forEach(sec => {
    if (sec.id === targetId) {
      sec.classList.add('active-section');
    } else {
      sec.classList.remove('active-section');
    }
  });

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
  if (!checklistContainer) return;
  checklistContainer.innerHTML = '';

  let checkedCount = 0;

  if (state.checklist.length === 0) {
    checklistContainer.innerHTML = `
      <div style="text-align:center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">
        <i class="fa-regular fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px; display:block;"></i>
        Chưa có đồ dùng nào trong danh sách. Hãy thêm món đồ hoặc nhấn Khôi phục bên dưới!
      </div>
    `;
    if (checklistRatio) checklistRatio.textContent = '0/0 món (0%)';
    if (checklistBarFill) checklistBarFill.style.width = '0%';
    return;
  }

  state.checklist.forEach((item, index) => {
    if (item.checked) checkedCount++;

    const div = doc.createElement('div');
    div.className = `checklist-item ${item.checked ? 'checked' : ''}`;
    div.innerHTML = `
      <div class="check-box">
        ${item.checked ? '<i class="fa-solid fa-check"></i>' : ''}
      </div>
      <span class="item-text">${item.text}</span>
      <button class="delete-item-btn" title="Xóa món này" aria-label="Xóa ${item.text}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    // Click item to toggle checked state
    div.addEventListener('click', (e) => {
      // If delete button clicked, ignore item toggle
      if (e.target.closest('.delete-item-btn')) return;
      item.checked = !item.checked;
      localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
      renderChecklist();
    });

    // Delete button click
    const delBtn = div.querySelector('.delete-item-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteChecklistItem(index);
      });
    }

    checklistContainer.appendChild(div);
  });

  // Update stats
  const total = state.checklist.length;
  const pct = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
  if (checklistRatio) checklistRatio.textContent = `${checkedCount}/${total} món (${pct}%)`;
  if (checklistBarFill) checklistBarFill.style.width = `${pct}%`;
}

function deleteChecklistItem(index) {
  const removed = state.checklist.splice(index, 1);
  localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
  renderChecklist();
}

function restoreDefaultChecklist() {
  if (confirm('Khôi phục danh sách đồ dùng chuẩn ban đầu?')) {
    state.checklist = DEFAULT_CHECKLIST.map(item => ({ ...item, checked: false }));
    localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
    renderChecklist();
  }
}

function addCustomChecklistItem() {
  const text = customItemInput.value.trim();
  if (!text) return;

  state.checklist.push({
    id: 'c_custom_' + Date.now(),
    text: text,
    checked: false
  });

  localStorage.setItem('hg_checklist_2026', JSON.stringify(state.checklist));
  customItemInput.value = '';
  renderChecklist();
}

// Budget Calculation
function updateBudgetUI() {
  localStorage.setItem('hg_people_2026', state.numPeople);

  // Base cost estimate per person:
  // Xe khách khứ hồi: 850k
  // Thuê xe máy (chia 2 nếu đi đôi): ~400k/người
  // Xăng xe: ~110k/người
  // Vé tham quan trọn bộ: ~200k/người
  // Homestay 3 đêm: ~700k/người
  // Ăn uống 4 ngày: ~800k/người
  // Tổng cơ bản ~ 3.060.000 đ

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
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun" style="color:#f59e0b"></i>';
  } else {
    doc.documentElement.removeAttribute('data-theme');
    themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
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
