// ============================================
// GOOGLE APPS SCRIPT CONFIGURATION
// ============================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxbbyXZtHnLSDdTVyMVywu9ZOigH0VUpiInjjysi5sOBDhc1zmzTda1KYkorcpK8KQnTw/exec";

// ============================================
// KONFIGURASI WHATSAPP & HELPER
// ============================================
const WA_ADMIN_VOUCHER_BBM = '6289518014663';  // admin voucher BBM & kendaraan
const WA_ADMIN_RUANG_RAPAT = '6282136890388';  // admin ruang rapat
const WA_ADMIN_KEARSIPAN = '62895333318630'; // admin kearsipan

// --- TAMBAHAN NOMOR WA ---
const WA_ADMIN_PENGAJUAN_DANA = '6281703440545'; // Isi admin pengajuan dana
const WA_ADMIN_DANA_BERSAMA = '6281703440545'; // Isi admin dana lintas bidang
const WA_ADMIN_SPJ = '6281703440545'; // Isi admin SPJ
// -------------------------

const WA_BOX_MAP = {
    'alert-kendaraan': 'wa-box-kendaraan',
    'alert-ruangan': 'wa-box-ruangan',
    'alert-voucher': 'wa-box-voucher',
    'alert-spj': 'wa-box-spj',
    'alert-pengajuan-dana': 'wa-box-pengajuan-dana',
    'alert-arsip': 'wa-box-arsip',
    'alert-dana-bersama': 'wa-box-dana-bersama'
};

function waTimestamp() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const pad = n => String(n).padStart(2, '0');
    const wib = new Date(now.getTime() + 7 * 3600 * 1000);
    return `${days[now.getDay()]}, ${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()} pukul ${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())} WIB`;
}

function waRupiah(angka) {
    const num = parseInt(String(angka).replace(/\D/g, '')) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
}

function hideWABox(alertId) {
    const boxId = WA_BOX_MAP[alertId];
    if (!boxId) return;
    const box = document.getElementById(boxId);
    if (box) box.style.display = 'none';
}

function showWhatsAppButton(alertId, waMessage, adminNumber) {
    const alertEl = document.getElementById(alertId);
    if (!alertEl) return;

    const boxId = WA_BOX_MAP[alertId];
    if (!boxId) return;

    let box = document.getElementById(boxId);
    if (!box) {
        box = document.createElement('div');
        box.id = boxId;
    }

    if (alertEl.nextSibling !== box) {
        alertEl.insertAdjacentElement('afterend', box);
    }

    const safeNumber = adminNumber || '';
    const waUrl = `https://wa.me/${safeNumber}?text=${encodeURIComponent(waMessage)}`;

    box.style.cssText = `display: block; margin-top: 10px;`;
    box.innerHTML = `
<div style="display: flex; align-items: flex-start; gap: 14px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 16px 20px;">
    <div style="flex-shrink: 0; width: 44px; height: 44px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </div>
    <div style="flex: 1; min-width: 0;">
        <p style="margin: 0 0 3px; font-size: 14px; font-weight: 600; color: #166534;">Pengajuan berhasil terkirim ke sistem!</p>
        <p style="margin: 0 0 12px; font-size: 13px; color: #15803d; line-height: 1.5;">Klik tombol di bawah untuk mengirim notifikasi ke admin via WhatsApp. Pesan sudah terisi otomatis sesuai data pengajuan Anda.</p>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #25D366; color: #fff; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; transition: background 0.15s;" onmouseover="this.style.background='#1ebe5d'" onmouseout="this.style.background='#25D366'">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" style="flex-shrink: 0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Kirim Konfirmasi ke Admin via WhatsApp
        </a>
    </div>
</div>`;
}

// ============================================
// HELPER: JSONP request ke Google Apps Script
// ============================================
function apiGet(params, callback, errorCallback) {
    const cbName = 'gas_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    const url = `${GAS_URL}?${qs}&callback=${cbName}`;

    const script = document.createElement('script');
    const timeout = setTimeout(() => {
        delete window[cbName];
        if (script.parentNode) document.body.removeChild(script);
        if (errorCallback) errorCallback(new Error('Request timeout'));
    }, 15000);

    window[cbName] = function (data) {
        clearTimeout(timeout);
        delete window[cbName];
        if (script.parentNode) document.body.removeChild(script);
        callback(data);
    };

    script.src = url;
    script.onerror = function () {
        clearTimeout(timeout);
        delete window[cbName];
        if (errorCallback) errorCallback(new Error('Network error'));
    };
    document.body.appendChild(script);
}

// ============================================
// GLOBAL VARIABLES
// ============================================
let selectedFile = null;
let selectedArsipFile = null;
let arsipUploadMode = 'file';
let driveLinksCounter = 1;
let selectedPengajuanFile = null;
let selectedMonevFile = null;
let selectedBuktiFile = null;
let currentCalendarType = 'KENDARAAN';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let calendarData = {};
let allSchedules = [];
let allVouchers = [];
let currentVoucherFilter = 'ALL';

// ============================================
// LOCAL LOADERS
// ============================================
function showCalendarLoading() {
    const grid = document.getElementById('calendar-grid');
    if (grid) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto 12px;"></div>
                <div style="font-size: 13px; color: #64748b;">Memuat data kalender...</div>
            </div>
        `;
    }
}

function showDetailLoading() {
    const container = document.getElementById('detail-schedules-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <div class="spinner" style="margin: 0 auto 12px;"></div>
                <div style="font-size: 13px; color: #64748b;">Memuat detail jadwal...</div>
            </div>
        `;
    }
}

function showVoucherLoading() {
    const tbody = document.getElementById('voucher-table-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #6b7280;">
            <div class="spinner" style="margin:0 auto 10px;"></div>
            <div style="font-size:13px;">Memuat data...</div>
        </td></tr>`;
    }
    const pgn = document.getElementById('voucher-pagination');
    if (pgn) pgn.innerHTML = '';
}

function showLoading() {
    document.getElementById('loading-overlay').classList.add('show');
}
function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

// ============================================
// HELPER: Animasi progress bar
// ============================================
function setProgress(progressId, loadingId, persen, labelText) {
    const bar = document.getElementById(progressId);
    const loading = document.getElementById(loadingId);
    if (bar) {
        bar.classList.add('show');
        bar.querySelector('.progress-fill').style.width = persen + '%';
    }
    if (loading && labelText !== undefined) {
        loading.textContent = labelText;
        loading.classList.add('show');
    }
}

function hideProgress(progressId, loadingId) {
    const bar = document.getElementById(progressId);
    const loading = document.getElementById(loadingId);
    if (bar) {
        bar.querySelector('.progress-fill').style.width = '0%';
        setTimeout(() => bar.classList.remove('show'), 300);
    }
    if (loading) {
        loading.classList.remove('show');
    }
}

// ============================================
// CORE: aktivasi section
// ============================================
function activateSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');
    const mobileSelect = document.getElementById('mobile-nav-select');
    if (mobileSelect) mobileSelect.value = sectionId;
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
}

// ============================================
// MOBILE NAVIGATION
// ============================================
function handleMobileNav(value) {
    if (!value) return;
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
    switch (value) {
        case 'home':
        case 'kendaraan':
        case 'ruangan':
        case 'voucher':
        case 'arsip':
        case 'pengajuan-dana':
        case 'spj':
        case 'transparansi-nilai':
            activateSection(value);
            break;
        case 'transparansi-ruang':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('ruang-rapat'); }, 150);
            break;
        case 'transparansi-kendaraan':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('kendaraan'); }, 150);
            break;
        case 'transparansi-bbm':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('bbm'); }, 150);
            break;
        case 'transparansi-dokumen':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('dokumen'); }, 150);
            break;
        case 'transparansi-spj':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('spj-keuangan'); }, 150);
            break;
        case 'transparansi-monev':
            activateSection('transparansi-nilai');
            setTimeout(() => { if (typeof loadNilaiData === 'function') loadNilaiData('monev'); }, 150);
            break;
        case 'status-kendaraan':
            showCalendar('KENDARAAN');
            break;
        case 'status-ruangan':
            showCalendar('RUANG_RAPAT');
            break;
        case 'status-voucher':
            showVoucherStatus();
            break;
        case 'status-dana':
            showDanaStatus();
            break;
        case 'status-dana-bersama':
            showDanaBersamaStatus();
            break;
        case 'pengajuan-dana-bersama':
            activateSection('pengajuan-dana-bersama');
            break;
        default:
            console.warn('handleMobileNav: nilai tidak dikenal →', value);
    }
    const mobileSelect = document.getElementById('mobile-nav-select');
    if (mobileSelect) setTimeout(() => { mobileSelect.value = value; }, 60);
}

function showSection(sectionId) {
    activateSection(sectionId);
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    try {
        if (typeof event !== 'undefined' && event && event.currentTarget
            && event.currentTarget.classList.contains('nav-tab')) {
            event.currentTarget.classList.add('active');
        } else if (typeof event !== 'undefined' && event && event.target
            && event.target.classList.contains('nav-tab')) {
            event.target.classList.add('active');
        }
    } catch (e) { }
}

function toggleDropdown(event, dropdownId) {
    event.stopPropagation();
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d.id !== dropdownId) d.classList.remove('show');
    });
    document.querySelectorAll('.nav-dropdown button').forEach(btn => {
        btn.classList.remove('active-dropdown');
    });
    const dropdown = document.getElementById(dropdownId);
    const button = event.target;
    if (!dropdown) return;
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
        button.classList.add('active-dropdown');
    }
}

document.addEventListener('click', function (event) {
    const dropdownButton = event.target.closest('.nav-dropdown');
    if (!dropdownButton) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
        document.querySelectorAll('.nav-dropdown button').forEach(btn => btn.classList.remove('active-dropdown'));
    }
});

// ============================================
// DATE/TIME VALIDATION HELPERS
// ============================================
function initDateValidation() {
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.addEventListener('change', function () { warnPastDate(this); });
        input.addEventListener('blur', function () { warnPastDate(this); });
    });
}

function getTodayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function warnPastDate(inputEl) {
    const val = inputEl.value;
    if (!val) return;
    const today = getTodayString();
    let warn = inputEl.parentNode.querySelector('.date-past-warning');
    if (val < today) {
        if (!warn) {
            warn = document.createElement('p');
            warn.className = 'date-past-warning';
            warn.style.cssText = 'color:#d97706;font-size:0.8125rem;margin-top:6px;font-weight:600;';
            inputEl.after(warn);
        }
        warn.textContent = '⚠️ Tanggal yang dipilih sudah lampau. Pastikan tanggal sudah benar.';
        inputEl.style.borderColor = '#f59e0b';
    } else {
        if (warn) warn.remove();
        inputEl.style.borderColor = '';
    }
}

function validateTimeRange(formEl, startName, endName) {
    const startInput = formEl.querySelector(`[name="${startName}"]`);
    const endInput = formEl.querySelector(`[name="${endName}"]`);
    if (!startInput || !endInput) return true;
    const startVal = startInput.value;
    const endVal = endInput.value;
    let warn = endInput.parentNode.querySelector('.time-range-warning');
    if (!startVal || !endVal) {
        if (warn) warn.remove();
        endInput.style.borderColor = '';
        startInput.style.borderColor = '';
        return true;
    }
    const toMinutes = t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const invalid = toMinutes(endVal) <= toMinutes(startVal);
    if (invalid) {
        if (!warn) {
            warn = document.createElement('p');
            warn.className = 'time-range-warning';
            warn.style.cssText = 'color:#dc2626;font-size:0.8125rem;margin-top:6px;font-weight:600;';
            endInput.after(warn);
        }
        warn.textContent = '⛔ Waktu selesai harus lebih dari waktu mulai.';
        endInput.style.borderColor = '#dc2626';
        startInput.style.borderColor = '#dc2626';
        endInput.focus();
        return false;
    } else {
        if (warn) warn.remove();
        endInput.style.borderColor = '';
        startInput.style.borderColor = '';
        return true;
    }
}

function initTimeValidationListeners() {
    [{ formId: 'form-kendaraan' }, { formId: 'form-ruangan' }].forEach(({ formId }) => {
        const form = document.getElementById(formId);
        if (!form) return;
        const startEl = form.querySelector('[name="waktu_mulai"]');
        const endEl = form.querySelector('[name="waktu_selesai"]');
        const revalidate = () => validateTimeRange(form, 'waktu_mulai', 'waktu_selesai');
        if (startEl) { startEl.addEventListener('change', revalidate); startEl.addEventListener('blur', revalidate); }
        if (endEl) { endEl.addEventListener('change', revalidate); endEl.addEventListener('blur', revalidate); }
    });
}

// ============================================
// CALENDAR FUNCTIONS
// ============================================
function showCalendar(type) {
    currentCalendarType = type;
    const dropdownContent = document.getElementById('status-dropdown');
    if (dropdownContent) dropdownContent.classList.remove('show');
    const titles = {
        'KENDARAAN': { title: 'Status Pengajuan Mobil', subtitle: 'Lihat semua status pengajuan kendaraan dinas' },
        'RUANG_RAPAT': { title: 'Status Pengajuan Ruang Rapat', subtitle: 'Lihat semua status penggunaan ruang rapat' }
    };
    document.getElementById('calendar-title').textContent = titles[type].title;
    document.getElementById('calendar-subtitle').textContent = titles[type].subtitle;
    activateSection('kalender');
    const mobileSelect = document.getElementById('mobile-nav-select');
    if (mobileSelect) mobileSelect.value = type === 'KENDARAAN' ? 'status-kendaraan' : 'status-ruangan';
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    showCalendarLoading();
    loadCalendarData();
}

function loadCalendarData() {
    apiGet(
        { action: 'getSchedule', type: currentCalendarType },
        function (data) {
            if (data.status === 'success') {
                calendarData = data.summary || {};
            } else {
                calendarData = {};
            }
            renderCalendar();
        },
        function (error) {
            console.error('❌ JSONP error:', error);
            calendarData = {};
            renderCalendar();
        }
    );
}

function renderCalendar() {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    document.getElementById('calendar-month-year').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const grid = document.getElementById('calendar-grid');

    grid.innerHTML = '';

    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (dateStr === todayStr) dayDiv.classList.add('today');
        const bookingCount = calendarData[dateStr] || 0;
        if (bookingCount > 0) dayDiv.classList.add('has-booking');
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);
        if (bookingCount > 0) {
            const label = document.createElement('div');
            label.className = 'calendar-day-label';
            label.textContent = `${bookingCount}`;
            dayDiv.appendChild(label);
            dayDiv.style.cursor = 'pointer';
            dayDiv.setAttribute('data-date', dateStr);
            dayDiv.addEventListener('click', function () { showScheduleDetail(this.getAttribute('data-date')); });
        } else {
            dayDiv.style.cursor = 'default';
        }
        grid.appendChild(dayDiv);
    }
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    showCalendarLoading();
    setTimeout(() => { renderCalendar(); }, 300);
}

function goToToday() {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    showCalendarLoading();
    setTimeout(() => { renderCalendar(); }, 300);
}

function refreshCalendar() {
    showCalendarLoading();
    loadCalendarData();
}

function showScheduleDetail(date) {
    activateSection('detail-jadwal');
    showDetailLoading();
    apiGet(
        { action: 'getSchedule', type: currentCalendarType, date: date },
        function (data) {
            if (data.status === 'success' && data.schedules && data.schedules.length > 0) {
                displayScheduleDetailPage(date, data.schedules);
            } else {
                alert('Tidak ada jadwal pada tanggal ini');
                backToCalendar();
            }
        },
        function (error) {
            console.error('❌ Error:', error);
            alert('Gagal memuat detail jadwal');
            backToCalendar();
        }
    );
}

function displayScheduleDetailPage(date, schedules) {
    allSchedules = schedules;
    const dateObj = new Date(date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const typeTitle = currentCalendarType === 'KENDARAAN' ? 'Jadwal Mobil' : 'Jadwal Ruang Rapat';
    document.getElementById('detail-title').textContent = `${typeTitle} - ${dateFormatted}`;
    document.getElementById('detail-subtitle').textContent = `${schedules.length} pengajuan ditemukan`;
    document.getElementById('search-schedule').value = '';
    renderScheduleList(schedules);
}

function formatTime(dateString) {
    if (!dateString) return '-';
    if (/^\d{2}:\d{2}$/.test(dateString)) return dateString + ' WIB';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} WIB`;
}

function formatTimeRange(startString, endString) {
    return `${formatTime(startString)} - ${formatTime(endString)}`;
}

function renderScheduleList(schedules) {
    const container = document.getElementById('detail-schedules-container');
    if (schedules.length === 0) {
        container.innerHTML = `
            <div class="schedule-cards-grid">
                <div class="no-schedule">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:40px;height:40px;margin:0 auto 12px;display:block;opacity:0.3;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Tidak ada jadwal yang cocok dengan pencarian
                </div>
            </div>`;
        return;
    }
    const statusCount = { approved: 0, pending: 0, rejected: 0 };
    schedules.forEach(s => {
        const st = (s.Status || '').toLowerCase();
        if (st === 'approved' || st === 'disetujui') statusCount.approved++;
        else if (st === 'pending' || st === 'menunggu') statusCount.pending++;
        else if (st === 'rejected' || st === 'ditolak') statusCount.rejected++;
    });
    const subtitleEl = document.getElementById('detail-subtitle');
    if (subtitleEl) {
        subtitleEl.innerHTML = `
            ${schedules.length} pengajuan &nbsp;·&nbsp;
            ${statusCount.approved > 0 ? `<span style="color:#059669;font-weight:700;">${statusCount.approved} disetujui</span>` : ''}
            ${statusCount.pending > 0 ? `${statusCount.approved > 0 ? ' &nbsp;·&nbsp; ' : ''}<span style="color:#d97706;font-weight:700;">${statusCount.pending} pending</span>` : ''}
            ${statusCount.rejected > 0 ? `${(statusCount.approved + statusCount.pending) > 0 ? ' &nbsp;·&nbsp; ' : ''}<span style="color:#dc2626;font-weight:700;">${statusCount.rejected} ditolak</span>` : ''}
        `;
    }
    const clockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    let cards = '';
    if (currentCalendarType === 'KENDARAAN') {
        schedules.forEach(schedule => {
            const statusRaw = (schedule.Status || '').toLowerCase();
            const nomorKend = schedule['Nomor Kendaraan'] ? `
                <div class="schedule-card-row">
                    <span class="schedule-card-label">No. Kend.</span>
                    <span class="schedule-card-value"><strong>${schedule['Nomor Kendaraan']}</strong></span>
                </div>` : '';
            cards += `
                <div class="schedule-card status-${statusRaw}" data-nama="${(schedule.Nama || '').toLowerCase()}">
                    <div class="schedule-card-strip"></div>
                    <div class="schedule-card-header">
                        <div class="schedule-card-name">${schedule.Nama}</div>
                        <span class="schedule-card-status ${statusRaw}">${schedule.Status}</span>
                    </div>
                    <div class="schedule-card-body">
                        <div class="schedule-card-time">${clockIcon}${formatTimeRange(schedule['Jam Mulai'], schedule['Jam Selesai'])}</div>
                        <div class="schedule-card-info">
                            <div class="schedule-card-row"><span class="schedule-card-label">Unit</span><span class="schedule-card-value"><span class="schedule-unit-badge">${schedule.Unit}</span></span></div>
                            ${nomorKend}
                            <div class="schedule-card-divider"></div>
                            <div class="schedule-card-row"><span class="schedule-card-label">Keperluan</span><span class="schedule-card-value">${schedule.Keperluan}</span></div>
                            <div class="schedule-card-row"><span class="schedule-card-label">Tujuan</span><span class="schedule-card-value">${schedule.Alamat}</span></div>
                        </div>
                    </div>
                </div>`;
        });
    } else if (currentCalendarType === 'RUANG_RAPAT') {
        schedules.forEach(schedule => {
            const statusRaw = (schedule.Status || '').toLowerCase();
            const namaRuang = schedule['Nama Ruang Rapat'] ? `
                <div class="schedule-card-row">
                    <span class="schedule-card-label">Ruang</span>
                    <span class="schedule-card-value"><strong>${schedule['Nama Ruang Rapat']}</strong></span>
                </div>` : '';
            cards += `
                <div class="schedule-card status-${statusRaw}" data-nama="${(schedule.Nama || '').toLowerCase()}">
                    <div class="schedule-card-strip"></div>
                    <div class="schedule-card-header">
                        <div class="schedule-card-name">${schedule.Kegiatan}</div>
                        <span class="schedule-card-status ${statusRaw}">${schedule.Status}</span>
                    </div>
                    <div class="schedule-card-body">
                        <div class="schedule-card-time">${clockIcon}${formatTimeRange(schedule['Jam Mulai'], schedule['Jam Selesai'])}</div>
                        <div class="schedule-card-info">
                            <div class="schedule-card-row"><span class="schedule-card-label">PJ</span><span class="schedule-card-value">${schedule.Nama}</span></div>
                            <div class="schedule-card-row"><span class="schedule-card-label">Unit</span><span class="schedule-card-value"><span class="schedule-unit-badge">${schedule.Unit}</span></span></div>
                            ${namaRuang}
                            <div class="schedule-card-divider"></div>
                            <div class="schedule-card-row"><span class="schedule-card-label">Peserta</span><span class="schedule-card-value"><strong>${schedule.Peserta}</strong> orang</span></div>
                        </div>
                    </div>
                </div>`;
        });
    }
    container.innerHTML = `<div class="schedule-cards-grid">${cards}</div>`;
}

function filterSchedules() {
    const searchTerm = document.getElementById('search-schedule').value.toLowerCase();
    if (searchTerm === '') {
        renderScheduleList(allSchedules);
    } else {
        renderScheduleList(allSchedules.filter(s => {
            const name = (s.Nama || '').toLowerCase();
            const unit = (s.Unit || '').toLowerCase();
            const keperluan = (s.Keperluan || s.Kegiatan || '').toLowerCase();
            return name.includes(searchTerm) || unit.includes(searchTerm) || keperluan.includes(searchTerm);
        }));
    }
}

function backToCalendar() {
    activateSection('kalender');
    document.getElementById('search-schedule').value = '';
}

// ============================================
// VOUCHER STATUS FUNCTIONS
// ============================================
function showVoucherStatus() {
    const dropdownContent = document.getElementById('status-dropdown');
    if (dropdownContent) dropdownContent.classList.remove('show');
    activateSection('status-voucher');
    const mobileSelect = document.getElementById('mobile-nav-select');
    if (mobileSelect) mobileSelect.value = 'status-voucher';
    showVoucherLoading();
    loadVoucherData();
}

let voucherCurrentPage = 1;
let voucherPageSize = 10;
let voucherDisplayData = [];

function changeVoucherPageSize(val) {
    voucherPageSize = parseInt(val) || 10;
    voucherCurrentPage = 1;
    renderVoucherTable(voucherDisplayData, 1);
}

function loadVoucherData() {
    apiGet(
        { action: 'getVouchers' },
        function (data) {
            allVouchers = data.status === 'success' ? (data.vouchers || []) : [];
            allVouchers = sortVouchersByDate(allVouchers);
            voucherCurrentPage = 1;
            voucherDisplayData = allVouchers;
            renderVoucherTable(voucherDisplayData, voucherCurrentPage);
        },
        function (error) {
            console.error('❌ JSONP error:', error);
            allVouchers = [];
            voucherDisplayData = [];
            renderVoucherTable([], 1);
        }
    );
}

function getVoucherTimestamp(voucher) {
    const keys = ['Timestamp', 'timestamp', 'Tanggal', 'tanggal', 'Date', 'date', 'TIMESTAMP', 'Waktu', 'waktu'];
    for (const k of keys) { if (voucher[k]) return voucher[k]; }
    for (const val of Object.values(voucher)) {
        if (val && typeof val === 'string' && !isNaN(Date.parse(val))) return val;
    }
    return null;
}

function parseVoucherDate(raw) {
    if (!raw) return new Date(0);
    if (raw instanceof Date) return raw;
    const d = new Date(raw);
    if (!isNaN(d)) return d;
    const m = String(raw).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) return new Date(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
    return new Date(0);
}

function sortVouchersByDate(vouchers) {
    return [...vouchers].sort((a, b) => {
        const dateA = parseVoucherDate(getVoucherTimestamp(a));
        const dateB = parseVoucherDate(getVoucherTimestamp(b));
        return dateB - dateA;
    });
}

function renderVoucherTable(vouchers, page) {
    page = page || 1;
    const tbody = document.getElementById('voucher-table-body');
    const total = vouchers.length;
    const totalPages = Math.max(1, Math.ceil(total / voucherPageSize));
    page = Math.min(page, totalPages);
    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#6b7280;">Tidak ada data voucher BBM</td></tr>`;
        renderVoucherPagination(0, 1, 1);
        return;
    }
    const start = (page - 1) * voucherPageSize;
    const slice = vouchers.slice(start, start + voucherPageSize);
    tbody.innerHTML = slice.map(voucher => {
        const statusClass = (voucher.Status || '').toLowerCase();
        const rawTs = getVoucherTimestamp(voucher);
        const timestamp = rawTs
            ? parseVoucherDate(rawTs).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : '-';
        return `<tr>
            <td style="vertical-align: middle;">${timestamp}</td>
            <td style="vertical-align: middle;">${voucher.Nama || '-'}</td>
            <td style="vertical-align: middle;">${voucher.Unit || '-'}</td>
            <td style="vertical-align: middle;"><strong>${voucher['Nomor Polisi'] || '-'}</strong></td>
            <td style="vertical-align: middle; text-align: center;">
                <span class="status-badge ${statusClass}">${voucher.Status || 'UNKNOWN'}</span>
            </td>
        </tr>`;
    }).join('');
    renderVoucherPagination(total, page, totalPages);
}

function renderVoucherPagination(total, page, totalPages) {
    const container = document.getElementById('voucher-pagination');
    if (!container) return;
    if (total === 0) { container.innerHTML = ''; return; }
    const start = (page - 1) * voucherPageSize + 1;
    const end = Math.min(page * voucherPageSize, total);
    const sizeOptions = [10, 25, 50, 100];
    let html = `<div class="pagination-size"><label>Tampilkan&nbsp;<select class="page-size-select" onchange="changeVoucherPageSize(this.value)">${sizeOptions.map(n => `<option value="${n}"${n === voucherPageSize ? ' selected' : ''}>${n}</option>`).join('')}</select>&nbsp;data per halaman</label></div>`;
    html += `<div class="pagination-info">Menampilkan ${start}–${end} dari ${total} data</div>`;
    html += `<div class="pagination-controls">`;
    html += `<button class="page-btn" onclick="goToVoucherPage(1)" ${page === 1 ? 'disabled' : ''}>««</button>`;
    html += `<button class="page-btn" onclick="goToVoucherPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>‹</button>`;
    const delta = 2;
    const from = Math.max(1, page - delta);
    const to = Math.min(totalPages, page + delta);
    if (from > 1) html += `<span class="page-ellipsis">…</span>`;
    for (let i = from; i <= to; i++) {
        html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="goToVoucherPage(${i})">${i}</button>`;
    }
    if (to < totalPages) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="goToVoucherPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>›</button>`;
    html += `<button class="page-btn" onclick="goToVoucherPage(${totalPages})" ${page === totalPages ? 'disabled' : ''}>»»</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

function goToVoucherPage(page) {
    voucherCurrentPage = page;
    renderVoucherTable(voucherDisplayData, voucherCurrentPage);
    const tbl = document.getElementById('status-voucher');
    if (tbl) tbl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterVouchers() {
    const searchTerm = document.getElementById('search-voucher').value.toLowerCase();
    const filtered = allVouchers.filter(v => {
        const hay = ((v.Nama || '') + ' ' + (v['Nomor Polisi'] || '') + ' ' + (v.Unit || '')).toLowerCase();
        return hay.includes(searchTerm);
    });
    const byStatus = currentVoucherFilter === 'ALL'
        ? filtered
        : filtered.filter(v => v.Status === currentVoucherFilter);
    voucherCurrentPage = 1;
    voucherDisplayData = sortVouchersByDate(byStatus);
    renderVoucherTable(voucherDisplayData, 1);
}

function filterVoucherByStatus(status) {
    currentVoucherFilter = status;
    const searchTerm = document.getElementById('search-voucher').value.toLowerCase();
    let filtered = allVouchers;
    if (status !== 'ALL') filtered = filtered.filter(v => v.Status === status);
    if (searchTerm) {
        filtered = filtered.filter(v => {
            const hay = ((v.Nama || '') + ' ' + (v['Nomor Polisi'] || '') + ' ' + (v.Unit || '')).toLowerCase();
            return hay.includes(searchTerm);
        });
    }
    voucherCurrentPage = 1;
    voucherDisplayData = sortVouchersByDate(filtered);
    renderVoucherTable(voucherDisplayData, 1);
}

// ============================================
// FILE HANDLING (non-arsip)
// ============================================
function handleFileSelect(event) {
    const file = event.target.files[0];
    const fileInfo = document.getElementById('file-info');
    if (!file) { selectedFile = null; fileInfo.classList.remove('show'); return; }
    if (file.type !== 'application/pdf') { alert('❌ Hanya file PDF yang diperbolehkan!'); event.target.value = ''; selectedFile = null; fileInfo.classList.remove('show'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('❌ Ukuran file maksimal 10MB!'); event.target.value = ''; selectedFile = null; fileInfo.classList.remove('show'); return; }
    selectedFile = file;
    fileInfo.innerHTML = `✅ ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.classList.add('show');
}

function handlePengajuanFileSelect(event) {
    const file = event.target.files[0];
    const fileInfo = document.getElementById('file-pengajuan-info');
    if (!file) { selectedPengajuanFile = null; fileInfo.classList.remove('show'); return; }
    if (file.type !== 'application/pdf') { alert('❌ Hanya file PDF yang diperbolehkan!'); event.target.value = ''; selectedPengajuanFile = null; fileInfo.classList.remove('show'); return; }
    if (file.size > 10 * 1024 * 1024) { alert('❌ Ukuran file maksimal 10MB!'); event.target.value = ''; selectedPengajuanFile = null; fileInfo.classList.remove('show'); return; }
    selectedPengajuanFile = file;
    fileInfo.innerHTML = `✅ ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.classList.add('show');
}

// ============================================
// ARSIP: Single File Select Handler
// ============================================
function handleArsipFileSelect(event) {
    const file = event.target.files[0];
    const infoEl = document.getElementById('arsip-file-info');
    selectedArsipFile = null;
    if (infoEl) { infoEl.textContent = ''; infoEl.className = 'arsip-file-info'; }
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
        alert('❌ Ukuran file melebihi batas 10 MB. Silakan pilih file yang lebih kecil.');
        event.target.value = '';
        return;
    }
    selectedArsipFile = file;
    if (infoEl) {
        infoEl.innerHTML = `✅ <strong>${file.name}</strong> &nbsp;(${formatFileSize(file.size)})`;
        infoEl.className = 'arsip-file-info show';
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// SHARED: submit via hidden iframe (tanpa file)
// ============================================
function submitViaIframe(formData, iframeId, callback) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GAS_URL;
    form.target = iframeId;
    form.style.display = 'none';
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) continue;
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
    }
    let iframe = document.getElementById(iframeId);
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.name = iframeId;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
        callback(true);
        if (form.parentNode) document.body.removeChild(form);
    }, 2000);
}

async function submitViaIframeFields(fields, _iframeId) {
    const body = Object.keys(fields)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(fields[k] ?? ''))
        .join('&');

    const resp = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        redirect: 'follow'
    });

    const text = await resp.text();
    console.log('[submitViaIframeFields] raw response:', text.slice(0, 300));
    try { return JSON.parse(text); }
    catch (e) { return { status: 'success' }; }
}

// ============================================
// 1. KENDARAAN SUBMISSION
// ============================================
function submitKendaraan(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateTimeRange(form, 'waktu_mulai', 'waktu_selesai')) return;

    hideWABox('alert-kendaraan');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const tanggal = form.querySelector('[name="tanggal"]').value;
    const mulai = form.querySelector('[name="waktu_mulai"]').value;
    const selesai = form.querySelector('[name="waktu_selesai"]').value;
    const keperluan = form.querySelector('[name="keperluan"]').value;
    const alamat = form.querySelector('[name="alamat"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PENGAJUAN KENDARAAN DINAS
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Tanggal Pakai: ${tanggal}
- Waktu: ${mulai} - ${selesai}
- Keperluan: ${keperluan}
- Alamat: ${alamat}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'KENDARAAN');

    const submitBtn = document.getElementById('submit-kendaraan');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-kendaraan', 'loading-kendaraan', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-kendaraan', function (success) {
        setProgress('progress-kendaraan', 'loading-kendaraan', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-kendaraan', 'loading-kendaraan');
            if (success) {
                showAlert('alert-kendaraan', '✓ Pengajuan kendaraan dinas berhasil dikirim!');
                showWhatsAppButton('alert-kendaraan', waMsg, WA_ADMIN_VOUCHER_BBM);
                form.reset();
            } else {
                showAlert('alert-kendaraan', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================
// 2. RUANG RAPAT SUBMISSION
// ============================================
function submitRuang(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateTimeRange(form, 'waktu_mulai', 'waktu_selesai')) return;

    hideWABox('alert-ruangan');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const tanggal = form.querySelector('[name="tanggal"]').value;
    const mulai = form.querySelector('[name="waktu_mulai"]').value;
    const selesai = form.querySelector('[name="waktu_selesai"]').value;
    const kegiatan = form.querySelector('[name="nama_kegiatan"]').value;
    const peserta = form.querySelector('[name="jumlah_peserta"]').value;
    const difabelEl = form.querySelector('[name="difabel"]:checked');
    const difabel = difabelEl ? difabelEl.value : 'Tidak Tahu';
    const khusus = form.querySelector('[name="permintaan_khusus"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PERMINTAAN RUANG RAPAT
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Tanggal: ${tanggal}
- Waktu: ${mulai} - ${selesai}
- Kegiatan: ${kegiatan}
- Peserta: ${peserta} orang
- Peserta Difabel: ${difabel}
- Permintaan Khusus: ${khusus || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'RUANG_RAPAT');

    const submitBtn = document.getElementById('submit-ruangan');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-ruangan', 'loading-ruangan', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-ruangan', function (success) {
        setProgress('progress-ruangan', 'loading-ruangan', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-ruangan', 'loading-ruangan');
            if (success) {
                showAlert('alert-ruangan', '✓ Pengajuan ruang rapat berhasil dikirim!');
                showWhatsAppButton('alert-ruangan', waMsg, WA_ADMIN_RUANG_RAPAT);
                form.reset();
            } else {
                showAlert('alert-ruangan', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================
// 3. VOUCHER BBM SUBMISSION
// ============================================
function submitVoucher(event) {
    event.preventDefault();
    const form = event.target;

    hideWABox('alert-voucher');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const nopol = form.querySelector('[name="nomor_polisi"]').value;
    const jenis = form.querySelector('[name="jenis_voucher"]').value;
    const nominal = document.getElementById('nominal_diajukan').value;
    const alamat = form.querySelector('[name="alamat_tujuan"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PERMINTAAN VOUCHER BBM
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- No. Kendaraan: ${nopol}
- Jenis Voucher: ${jenis}
- Nominal Diajukan: ${waRupiah(nominal)}
- Alamat Tujuan: ${alamat}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'VOUCHER_BBM');

    const submitBtn = document.getElementById('submit-voucher');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-voucher', 'loading-voucher', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-voucher', function (success) {
        setProgress('progress-voucher', 'loading-voucher', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-voucher', 'loading-voucher');
            if (success) {
                showAlert('alert-voucher', '✓ Permintaan voucher BBM berhasil dikirim!');
                showWhatsAppButton('alert-voucher', waMsg, WA_ADMIN_VOUCHER_BBM);
                form.reset();
            } else {
                showAlert('alert-voucher', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================
// 4. ARSIP SUBMISSION
// ============================================
async function submitDokumen(event) {
    event.preventDefault();
    const formElement = event.target;
    const submitBtn = document.getElementById('submit-arsip');

    hideWABox('alert-arsip');

    if (arsipUploadMode === 'file') {
        if (!selectedArsipFile) { alert('❌ Silakan pilih file terlebih dahulu!'); return; }
    } else {
        if (getDriveLinks().length === 0) { alert('❌ Silakan isi minimal satu link Google Drive!'); return; }
    }

    const nama = formElement.querySelector('[name="nama"]').value;
    const unit = formElement.querySelector('[name="unit"]').value;
    const bulan = formElement.querySelector('[name="bulan"]').value;
    const tahun = formElement.querySelector('[name="tahun"]').value;
    const jenisDok = formElement.querySelector('[name="jenis_dokumen"]').value;
    const keterangan = formElement.querySelector('[name="keterangan"]')?.value || '';
    const ts = waTimestamp();

    let waMsg;
    if (arsipUploadMode === 'drive') {
        const links = getDriveLinks();
        const linksText = links.map((l, i) => `${i + 1}. ${l}`).join('\n');
        waMsg =
            `- UPLOAD DOKUMEN ARSIP (LINK DRIVE)
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Jenis Dokumen: ${jenisDok}
- Bulan/Tahun: ${bulan} / ${tahun}
- Link Drive (${links.length}):
${linksText}
- Keterangan: ${keterangan || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;
    } else {
        waMsg =
            `- UPLOAD DOKUMEN ARSIP
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Jenis Dokumen: ${jenisDok}
- Bulan/Tahun: ${bulan} / ${tahun}
- File: ${selectedArsipFile ? selectedArsipFile.name : '-'}
- Keterangan: ${keterangan || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = arsipUploadMode === 'file' ? 'Mengunggah...' : 'Mengirim...';
    setProgress('progress-arsip', 'loading-arsip', 15, 'Mempersiapkan data...');

    const baseFields = {
        action: 'uploadDokumen',
        nama, unit, bulan, tahun,
        jenis_dokumen: jenisDok,
        keterangan,
        upload_mode: arsipUploadMode
    };

    try {
        let fields;
        if (arsipUploadMode === 'drive') {
            const links = getDriveLinks();
            fields = { ...baseFields, drive_links: JSON.stringify(links) };
            setProgress('progress-arsip', 'loading-arsip', 50, 'Mengirim link Drive...');
        } else {
            setProgress('progress-arsip', 'loading-arsip', 30, `Membaca file: ${selectedArsipFile.name}`);
            const base64Data = await fileToBase64(selectedArsipFile);
            setProgress('progress-arsip', 'loading-arsip', 65, 'Mengunggah ke Google Drive...');
            fields = {
                ...baseFields,
                fileName: selectedArsipFile.name,
                fileData: base64Data,
                mimeType: selectedArsipFile.type || 'application/octet-stream',
            };
        }

        setProgress('progress-arsip', 'loading-arsip', 80, 'Menyimpan ke sistem...');
        const result = await submitViaIframeFields(fields, 'iframe-arsip');

        setProgress('progress-arsip', 'loading-arsip', 100, 'Selesai!');
        setTimeout(() => hideProgress('progress-arsip', 'loading-arsip'), 600);

        const ok = result?.status === 'success' || result?.success === true;
        if (ok) {
            const msg = arsipUploadMode === 'file'
                ? '✓ Dokumen berhasil diunggah ke Google Drive!'
                : '✓ Link Google Drive berhasil dikirim!';
            showAlert('alert-arsip', msg, 'success');
            showWhatsAppButton('alert-arsip', waMsg, WA_ADMIN_KEARSIPAN);

            formElement.reset();
            selectedArsipFile = null;
            const infoEl = document.getElementById('arsip-file-info');
            if (infoEl) { infoEl.textContent = ''; infoEl.className = 'arsip-file-info'; }
            driveLinksCounter = 1;
            const dlContainer = document.getElementById('drive-links-container');
            if (dlContainer) {
                dlContainer.innerHTML = `<div class="drive-link-row" id="drive-row-1" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                    <input type="url" class="form-control drive-link-input" placeholder="https://drive.google.com/file/d/..." style="flex:1;">
                    <button type="button" class="btn btn-sm" onclick="removeDriveLink('drive-row-1')" style="display:none;color:#dc2626;border-color:#fca5a5;flex-shrink:0;">✕</button>
                </div>`;
            }
        } else {
            showAlert('alert-arsip', '✗ ' + (result?.message || 'Gagal menyimpan dokumen'), 'error');
        }

    } catch (error) {
        console.error('❌ submitDokumen error:', error);
        hideProgress('progress-arsip', 'loading-arsip');
        showAlert('alert-arsip', '✗ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Dokumen';
    }
}

// ============================================
// ARSIP: Drive Link UI
// ============================================
function setArsipUploadMode(mode) {
    arsipUploadMode = mode;
    document.getElementById('arsip-mode-file').style.display = mode === 'file' ? '' : 'none';
    document.getElementById('arsip-mode-drive').style.display = mode === 'drive' ? '' : 'none';
    document.getElementById('tab-file').classList.toggle('active', mode === 'file');
    document.getElementById('tab-drive').classList.toggle('active', mode === 'drive');
}
function addDriveLink() {
    driveLinksCounter++;
    const container = document.getElementById('drive-links-container');
    const rowId = `drive-row-${driveLinksCounter}`;
    const row = document.createElement('div');
    row.className = 'drive-link-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="url" class="form-control drive-link-input" placeholder="https://drive.google.com/file/d/..." style="flex:1;">
        <button type="button" class="btn btn-sm" onclick="removeDriveLink('${rowId}')" style="color:#dc2626; border-color:#fca5a5; flex-shrink:0;">✕</button>
    `;
    container.appendChild(row);
    updateDriveLinkRemoveButtons();
}
function removeDriveLink(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
    updateDriveLinkRemoveButtons();
}
function updateDriveLinkRemoveButtons() {
    const rows = document.querySelectorAll('#drive-links-container .drive-link-row');
    rows.forEach((row) => {
        const removeBtn = row.querySelector('button');
        if (removeBtn) removeBtn.style.display = rows.length > 1 ? '' : 'none';
    });
}
function getDriveLinks() {
    return Array.from(document.querySelectorAll('#drive-links-container .drive-link-input'))
        .map(el => el.value.trim())
        .filter(v => v !== '');
}


// ============================================
// 5. PENGAJUAN DANA SUBMISSION
// ============================================
async function submitPengajuanDana(event) {
    event.preventDefault();
    hideWABox('alert-pengajuan-dana');

    const displayEl = document.getElementById('display-nominal-pengajuan');
    const hiddenEl = document.getElementById('nominal_pengajuan');
    if (displayEl && hiddenEl) {
        const raw = displayEl.value.replace(/\D/g, '');
        if (raw) hiddenEl.value = raw;
    }

    const nominalRaw = hiddenEl ? hiddenEl.value : '';
    if (!nominalRaw || parseInt(nominalRaw) <= 0) {
        alert('❌ Nominal pengajuan harus diisi dengan angka yang valid.');
        if (displayEl) displayEl.focus();
        return;
    }

    if (!selectedPengajuanFile) {
        alert('❌ Silakan pilih file pengajuan dana PDF terlebih dahulu!');
        return;
    }

    const formElement = event.target;
    const nama = formElement.querySelector('[name="nama"]').value;
    const unit = formElement.querySelector('[name="unit"]').value;
    const subKegiatan = formElement.querySelector('[name="sub_kegiatan"]').value;
    const bulan = formElement.querySelector('[name="bulan_pengajuan"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PENGAJUAN DANA BARU
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Sub Kegiatan: ${subKegiatan}
- Bulan Pengajuan: ${bulan}
- Nominal: ${waRupiah(nominalRaw)}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const submitBtn = document.getElementById('submit-pengajuan-dana');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengunggah Pengajuan...';
    setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 20, 'Membaca file...');

    try {
        const base64Data = await fileToBase64(selectedPengajuanFile);
        setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 50, 'Mengunggah ke sistem...');

        const fields = {
            action: 'uploadPengajuanDana',
            nama: nama,
            unit: unit,
            sub_kegiatan: subKegiatan,
            bulan_pengajuan: bulan,
            nominal_pengajuan: nominalRaw,
            fileName: selectedPengajuanFile.name,
            fileData: base64Data,
            mimeType: selectedPengajuanFile.type
        };

        setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 75, 'Menyimpan file...');
        const result = await submitViaIframeFields(fields, 'iframe-pengajuan-dana');

        setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 100, 'Selesai!');
        setTimeout(() => hideProgress('progress-pengajuan-dana', 'loading-pengajuan-dana'), 600);

        const ok = result?.status === 'success' || result?.success === true;
        if (ok) {
            showAlert('alert-pengajuan-dana', '✓ Pengajuan dana berhasil dikirim! File tersimpan di sistem.', 'success');
            showWhatsAppButton('alert-pengajuan-dana', waMsg, WA_ADMIN_PENGAJUAN_DANA);
            formElement.reset();
            selectedPengajuanFile = null;
            const fileInfo = document.getElementById('file-pengajuan-info');
            if (fileInfo) fileInfo.classList.remove('show');
        } else {
            showAlert('alert-pengajuan-dana', '✗ ' + (result?.message || 'Gagal mengirim pengajuan'), 'error');
        }

    } catch (error) {
        console.error('❌ submitPengajuanDana error:', error);
        hideProgress('progress-pengajuan-dana', 'loading-pengajuan-dana');
        showAlert('alert-pengajuan-dana', '✗ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan Dana';
    }
}

// ============================================
// 6. PENGAJUAN DANA LINTAS BIDANG SUBMISSION
// ============================================
async function submitDanaBersama(event) {
    event.preventDefault();
    hideWABox('alert-dana-bersama');

    var subKegiatan = (document.getElementById('db-sub-kegiatan-val') || {}).value || '';
    subKegiatan = subKegiatan.trim();
    if (!subKegiatan) {
        alert('❌ Sub Kegiatan harus dipilih dari daftar yang tersedia!');
        var acInput = document.getElementById('db-ac-input');
        if (acInput) acInput.focus();
        return;
    }

    if (selectedBidangSet.size === 0) {
        alert('❌ Pilih minimal satu bidang yang terlibat!');
        return;
    }

    if (!selectedDanaBersamaFile) {
        alert('❌ Silakan pilih file PDF pengajuan dana terlebih dahulu!');
        return;
    }

    const form = event.target;
    const nama = form.querySelector('[name="nama"]').value;
    const bidang = Array.from(selectedBidangSet).join(', ');
    const bulan = form.querySelector('[name="bulan_pengajuan"]').value;

    const nominalEl = document.getElementById('nominal_dana_bersama_hidden');
    const nominalRaw = nominalEl ? nominalEl.value : '';
    if (!nominalRaw || parseInt(nominalRaw) <= 0) {
        alert('❌ Nominal pengajuan harus diisi dengan angka yang valid.');
        const dispEl = document.getElementById('display-nominal-dana-bersama');
        if (dispEl) dispEl.focus();
        return;
    }

    const ts = waTimestamp();
    const waMsg = `- PENGAJUAN DANA LINTAS BIDANG
--------------------
- Pemohon: ${nama}
- Bidang Terlibat: ${bidang}
- Sub Kegiatan: ${subKegiatan}
- Bulan Pengajuan: ${bulan}
- Nominal: ${waRupiah(nominalRaw)}
- File: ${selectedDanaBersamaFile.name}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan kolaboratif ini.`;

    const submitBtn = document.getElementById('submit-dana-bersama');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengunggah...';
    setProgress('progress-dana-bersama', 'loading-dana-bersama', 20, 'Membaca file...');

    try {
        const base64Data = await fileToBase64(selectedDanaBersamaFile);
        setProgress('progress-dana-bersama', 'loading-dana-bersama', 55, 'Mengunggah ke sistem...');

        const fields = {
            action: 'uploadDanaBersama',
            nama: nama,
            sub_kegiatan: subKegiatan,
            bulan_pengajuan: bulan,
            nominal_pengajuan: nominalRaw,
            bidang: bidang,
            fileName: selectedDanaBersamaFile.name,
            fileData: base64Data,
            mimeType: selectedDanaBersamaFile.type || 'application/pdf'
        };

        setProgress('progress-dana-bersama', 'loading-dana-bersama', 80, 'Menyimpan data...');
        const result = await submitViaIframeFields(fields, 'iframe-dana-bersama');

        setProgress('progress-dana-bersama', 'loading-dana-bersama', 100, 'Selesai!');
        setTimeout(() => hideProgress('progress-dana-bersama', 'loading-dana-bersama'), 600);

        const ok = result?.status === 'success' || result?.success === true;
        if (ok) {
            showAlert('alert-dana-bersama', '✓ Pengajuan Dana Lintas Bidang berhasil dikirim!', 'success');
            showWhatsAppButton('alert-dana-bersama', waMsg, WA_ADMIN_DANA_BERSAMA);
            resetDanaBersamaForm();
        } else {
            showAlert('alert-dana-bersama', '✗ ' + (result?.message || 'Gagal mengirim pengajuan.'), 'error');
        }
    } catch (error) {
        console.error('submitDanaBersama error:', error);
        hideProgress('progress-dana-bersama', 'loading-dana-bersama');
        showAlert('alert-dana-bersama', '✗ ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan Dana Lintas Bidang';
    }
}

// ============================================
// 7. SPJ SUBMISSION
// ============================================
function submitSPJ(event) {
    event.preventDefault();
    hideWABox('alert-spj');

    const form = event.target;
    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const subKegiatan = form.querySelector('[name="sub_kegiatan"]').value;
    const bulan = form.querySelector('[name="bulan"]').value;
    const nominal = document.getElementById('nominal_spj').value;
    const ts = waTimestamp();

    const waMsg = `- PENYAMPAIAN SPJ BARU
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Sub Kegiatan: ${subKegiatan}
- Bulan SPJ: ${bulan}
- Nominal SPJ: ${waRupiah(nominal)}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'SPJ');

    const submitBtn = document.getElementById('submit-spj');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim SPJ...';
    setProgress('progress-spj', 'loading-spj', 30, 'Mengirim SPJ ke sistem...');

    submitViaIframe(formData, 'iframe-spj', function (success) {
        setProgress('progress-spj', 'loading-spj', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-spj', 'loading-spj');
            if (success) {
                showAlert('alert-spj', '✓ SPJ berhasil dikirim!', 'success');
                showWhatsAppButton('alert-spj', waMsg, WA_ADMIN_SPJ);
                form.reset();
            } else {
                showAlert('alert-spj', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim SPJ';
        }, 500);
    });
}

// ============================================
// ALERT HELPER
// ============================================
function showAlert(alertId, message, type = 'success') {
    const alert = document.getElementById(alertId);
    if (!alert) return;
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    setTimeout(() => alert.classList.remove('show'), 5000);
}

// ============================================
// LEGACY fallback
// ============================================
function sendToGoogleScript(formData, callback) {
    submitViaIframe(formData, 'hidden-iframe', callback);
}

// ============================================
// TABLE SCROLL WRAPPER (mobile)
// ============================================
function wrapTablesForMobile() {
    document.querySelectorAll('.table-compact').forEach(function (container) {
        if (container.querySelector('.table-scroll-wrapper')) return;
        const table = container.querySelector('table');
        if (!table) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll-wrapper';
        wrapper.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;border-radius:0 0 12px 12px;';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
}

function initTableScrollObserver() {
    const targets = [
        document.getElementById('nilai-content'),
        document.getElementById('summary-container'),
    ].filter(Boolean);
    if (!targets.length || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(function () {
        clearTimeout(observer._timer);
        observer._timer = setTimeout(wrapTablesForMobile, 80);
    });
    targets.forEach(function (t) { observer.observe(t, { childList: true, subtree: true }); });
}

// ============================================
// DOMContentLoaded
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initDateValidation();
    initTimeValidationListeners();
    wrapTablesForMobile();
    initTableScrollObserver();
});