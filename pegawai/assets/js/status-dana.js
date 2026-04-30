// ============================================
// STATUS PENGAJUAN DANA
// - Sorting tanggal terbaru di atas (robust)
// - Pagination 10 item per halaman
// - ★ Edit nominal & file untuk pengajuan REJECTED
// ============================================

const ANGGARAN_GAS_URL = "https://script.google.com/macros/s/AKfycbw8U7fNHneCo2Mi-nWdP-oeeRl8JYydgyMD_ghmepNt4onT8XPixOVF3GQFWqIsVRkb/exec";

let allDana = [];
let currentDanaFilter = 'ALL';
let danaCurrentPage = 1;
let danaPageSize = 10;
let danaDisplayData = [];

// ★ State untuk modal edit
let editDanaItem = null;
let editDanaNewFile = null;

// ── SVG Icons ─────────────────────────────────────────────
const DANA_ICONS = {
    refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    file: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
};

// ============================================
// INJECT STYLES
// ============================================
(function injectDanaStyles() {
    if (document.getElementById('dana-edit-styles')) return;
    const style = document.createElement('style');
    style.id = 'dana-edit-styles';
    style.textContent = `
    /* ── Modal Overlay ── */
    #dana-edit-modal {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(10, 15, 30, 0.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        align-items: center;
        justify-content: center;
        padding: 16px;
        animation: danaFadeIn 0.22s ease;
    }
    #dana-edit-modal.show { display: flex; }
    @keyframes danaFadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ── Modal Card ── */
    .dana-modal-card {
        background: #fff; border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh;
        overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,0.28);
        animation: danaSlideUp 0.26s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative;
    }
    @keyframes danaSlideUp { from { transform: translateY(40px) scale(0.96); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    /* ── Modal Header ── */
    .dana-modal-header { padding: 24px 28px 18px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 14px; }
    .dana-modal-header-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #dc2626, #ef4444); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
    .dana-modal-header-text h3 { font-size: 17px; font-weight: 700; color: #111827; margin: 0 0 4px; }
    .dana-modal-header-text p { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4; }
    .dana-modal-close { margin-left: auto; background: #f3f4f6; border: none; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; font-size: 18px; flex-shrink: 0; transition: background 0.15s, color 0.15s; }
    .dana-modal-close:hover { background: #fee2e2; color: #dc2626; }

    /* ── Info bar pengajuan ── */
    .dana-edit-info { margin: 16px 28px 0; background: #f8faff; border: 1px solid #e0e8ff; border-radius: 12px; padding: 14px 16px; }
    .dana-edit-info-row { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; color: #374151; margin-bottom: 6px; }
    .dana-edit-info-row:last-child { margin-bottom: 0; }
    .dana-edit-info-label { color: #6b7280; font-weight: 500; flex-shrink: 0; }
    .dana-edit-info-value { font-weight: 600; text-align: right; color: #111827; }
    .dana-edit-info-value.rejected { color: #dc2626; background: #fee2e2; border-radius: 5px; padding: 1px 8px; font-size: 12px; }

    /* ── Modal Body & Form ── */
    .dana-modal-body { padding: 20px 28px; }
    .dana-form-group { margin-bottom: 18px; }
    .dana-form-label { display: block; font-size: 13.5px; font-weight: 600; color: #374151; margin-bottom: 7px; }
    .dana-form-label span.req { color: #dc2626; margin-left: 2px; }
    .dana-form-input { width: 100%; padding: 11px 14px; border: 1.5px solid #d1d5db; border-radius: 10px; font-size: 14.5px; font-family: inherit; color: #111827; background: #fff; transition: border-color 0.18s, box-shadow 0.18s; box-sizing: border-box; }
    .dana-form-input:focus { outline: none; border-color: #c5a572; box-shadow: 0 0 0 3px rgba(197,165,114,0.18); }
    .dana-form-hint { font-size: 12px; color: #9ca3af; margin-top: 5px; }

    /* ── File upload area ── */
    .dana-file-area { border: 2px dashed #d1d5db; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; position: relative; background: #fafafa; }
    .dana-file-area:hover { border-color: #c5a572; background: #fdf8f0; }
    .dana-file-area.has-file { border-color: #059669; background: #f0fdf4; }
    .dana-file-area input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .dana-file-icon { margin-bottom: 8px; display: block; color: #9ca3af; }
    .dana-file-text { font-size: 13.5px; font-weight: 600; color: #374151; }
    .dana-file-subtext { font-size: 12px; color: #9ca3af; margin-top: 4px; }
    .dana-file-selected { display: none; font-size: 13px; font-weight: 600; color: #059669; margin-top: 10px; background: #dcfce7; border-radius: 8px; padding: 8px 12px; text-align: left; word-break: break-all; }
    .dana-file-selected.show { display: block; }

    .dana-current-file { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; margin-bottom: 12px; font-size: 13px; color: #0369a1; }
    .dana-current-file a { color: #0369a1; text-decoration: none; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; display: inline-flex; align-items: center; gap: 4px; }
    .dana-current-file a:hover { text-decoration: underline; }

    /* ── Modal Footer ── */
    .dana-modal-footer { padding: 16px 28px 24px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid #f0f0f0; }
    .dana-btn { padding: 10px 22px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.17s; font-family: inherit; }
    .dana-btn-cancel { background: #f3f4f6; color: #374151; }
    .dana-btn-cancel:hover { background: #e5e7eb; }
    .dana-btn-submit { background: linear-gradient(135deg, #c5a572, #a07840); color: #fff; min-width: 140px; }
    .dana-btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(160,120,64,0.3); }
    .dana-btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    /* ── Alert & Progress ── */
    .dana-modal-alert { display: none; padding: 10px 14px; border-radius: 9px; font-size: 13px; font-weight: 500; margin: 0 28px 14px; }
    .dana-modal-alert.show { display: block; }
    .dana-modal-alert.success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .dana-modal-alert.error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    .dana-modal-progress { display: none; margin: 0 28px 14px; }
    .dana-modal-progress.show { display: block; }
    .dana-modal-progress-bar { height: 5px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
    .dana-modal-progress-fill { height: 100%; background: linear-gradient(90deg, #c5a572, #a07840); border-radius: 99px; width: 0%; transition: width 0.4s ease; }
    .dana-modal-progress-label { font-size: 12px; color: #6b7280; margin-top: 5px; text-align: center; }

    /* ── Edit button in table ── */
    .btn-edit-dana {
        display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px;
        background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; color: #92400e;
        border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer;
        font-family: inherit; transition: all 0.2s ease; white-space: nowrap;
        margin-top: 8px; width: 100%; justify-content: center; box-sizing: border-box;
    }
    .btn-edit-dana:hover { background: linear-gradient(135deg, #fde68a, #fbbf24); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(245,158,11,0.3); }
    .btn-refresh {
        display: inline-flex; align-items: center; gap: 6px;
        background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;
        padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
        cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-refresh:hover { background: #f1f5f9; border-color: #cbd5e1; }

    /* ── Unit Pill in Table (agar seragam dengan Dana Bersama) ── */
    .dana-bidang-pill-sm {
        display:inline-block; background:#fdf8f0; color:#92400e;
        border:1px solid #e8d5b0; font-size:11.5px; font-weight:700;
        padding:3px 10px; border-radius:999px; white-space:normal; margin:2px;
        line-height: 1.3; text-align: center;
    }

    /* ── Table row highlight ── */
    tr.row-rejected td { background: #fff8f8 !important; }
    tr.row-rejected:hover td { background: #fff0f0 !important; }

    /* ── Status badge ── */
    .status-badge { display: inline-flex; width: 100%; justify-content: center; box-sizing: border-box; }
    .status-badge.rejected, .status-badge.ditolak { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .status-badge.approved, .status-badge.disetujui { background: #dcfce7; color: #059669; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .status-badge.pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }

    @media (max-width: 540px) {
        .dana-modal-card { border-radius: 16px 16px 0 0; max-height: 92vh; margin-top: auto; }
        .dana-modal-header, .dana-modal-body, .dana-modal-footer { padding-left: 20px; padding-right: 20px; }
        .dana-edit-info, .dana-modal-alert, .dana-modal-progress { margin-left: 20px; margin-right: 20px; }
    }
    `;
    document.head.appendChild(style);
})();

// ============================================
// INJECT MODAL HTML
// ============================================
(function injectDanaModal() {
    if (document.getElementById('dana-edit-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'dana-edit-modal';
    modal.innerHTML = `
    <div class="dana-modal-card">
        <div class="dana-modal-header">
            <div class="dana-modal-header-icon">${DANA_ICONS.edit}</div>
            <div class="dana-modal-header-text">
                <h3>Edit Pengajuan Dana</h3>
                <p>Perbarui nominal dan/atau file pengajuan yang ditolak</p>
            </div>
            <button class="dana-modal-close" onclick="closeDanaEditModal()" title="Tutup">✕</button>
        </div>
        <div class="dana-edit-info" id="dana-edit-info-bar"></div>
        <div class="dana-modal-alert" id="dana-modal-alert"></div>
        <div class="dana-modal-progress" id="dana-modal-progress">
            <div class="dana-modal-progress-bar"><div class="dana-modal-progress-fill" id="dana-modal-progress-fill"></div></div>
            <div class="dana-modal-progress-label" id="dana-modal-progress-label">Memproses...</div>
        </div>
        <div class="dana-modal-body">
            <div class="dana-form-group">
                <label class="dana-form-label">Nominal Pengajuan (Rp) <span class="req">*</span></label>
                <input type="text" id="dana-edit-nominal-display" class="dana-form-input" placeholder="Contoh: 5.000.000" inputmode="numeric" autocomplete="off" oninput="formatDanaEditNominal(this)">
                <input type="hidden" id="dana-edit-nominal-raw">
                <div class="dana-form-hint">Masukkan nominal baru jika perlu diubah</div>
            </div>
            <div class="dana-form-group">
                <label class="dana-form-label">File Pengajuan Dana (PDF) <span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:6px;">— kosongkan jika tidak ganti file</span></label>
                <div class="dana-current-file" id="dana-current-file-row" style="display:none;">
                    <a id="dana-current-file-link" href="#" target="_blank" rel="noopener">${DANA_ICONS.link} Lihat File Saat Ini</a>
                </div>
                <div class="dana-file-area" id="dana-file-drop-area">
                    <input type="file" id="dana-edit-file-input" accept=".pdf" onchange="handleDanaEditFileChange(event)">
                    <span class="dana-file-icon">${DANA_ICONS.file}</span>
                    <div class="dana-file-text">Klik atau seret file PDF ke sini</div>
                    <div class="dana-file-subtext">Format: PDF | Maks. 10 MB</div>
                </div>
                <div class="dana-file-selected" id="dana-edit-file-info"></div>
            </div>
        </div>
        <div class="dana-modal-footer">
            <button class="dana-btn dana-btn-cancel" onclick="closeDanaEditModal()">Batal</button>
            <button class="dana-btn dana-btn-submit" id="dana-edit-submit-btn" onclick="submitDanaEdit()">Kirim Ulang Pengajuan</button>
        </div>
    </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDanaEditModal();
    });

    setTimeout(() => {
        const filterContainer = document.querySelector('#status-dana .search-filter');
        if (filterContainer) {
            let existingRefreshBtn = null;
            const buttons = filterContainer.querySelectorAll('button');
            buttons.forEach(b => { if (b.textContent.includes('Refresh')) existingRefreshBtn = b; });

            if (existingRefreshBtn) {
                existingRefreshBtn.className = 'btn-refresh';
                existingRefreshBtn.innerHTML = `${DANA_ICONS.refresh} Refresh`;
            } else {
                const btn = document.createElement('button');
                btn.className = 'btn-refresh';
                btn.innerHTML = `${DANA_ICONS.refresh} Refresh`;
                btn.onclick = () => { showLoadingDana(true); loadDanaData(); };
                filterContainer.appendChild(btn);
                filterContainer.style.display = 'flex';
                filterContainer.style.gap = '10px';
                filterContainer.style.flexWrap = 'wrap';
                filterContainer.style.alignItems = 'center';
            }
        }
    }, 500);
})();

// ============================================
// PAGE SIZE & HELPERS
// ============================================
function changeDanaPageSize(val) {
    danaPageSize = parseInt(val) || 10;
    danaCurrentPage = 1;
    renderDanaTable(danaDisplayData, 1);
}

function getDanaTimestamp(item) {
    const keys = ['timestamp', 'Timestamp', 'tanggal', 'Tanggal', 'createdAt', 'date', 'Date', 'TIMESTAMP', 'waktu'];
    for (const k of keys) { if (item[k]) return item[k]; }
    for (const val of Object.values(item)) { if (val && typeof val === 'string' && !isNaN(Date.parse(val))) return val; }
    return null;
}

function parseDanaDate(raw) {
    if (!raw) return new Date(0);
    if (raw instanceof Date) return raw;
    const d = new Date(raw);
    if (!isNaN(d)) return d;
    const m = String(raw).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) return new Date(m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'));
    return new Date(0);
}

function sortDanaByDate(data) {
    return [...data].sort((a, b) => parseDanaDate(getDanaTimestamp(b)) - parseDanaDate(getDanaTimestamp(a)));
}

function fetchJSONP(url) {
    return new Promise((resolve, reject) => {
        const cbName = 'jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const script = document.createElement('script');
        script.src = url + '&callback=' + cbName;
        const timer = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 15000);
        window[cbName] = function (data) { cleanup(); resolve(data); };
        function cleanup() {
            clearTimeout(timer); delete window[cbName];
            if (script.parentNode) script.parentNode.removeChild(script);
        }
        script.onerror = () => { cleanup(); reject(new Error('Script load error')); };
        document.head.appendChild(script);
    });
}

function showDanaStatus() {
    const dd = document.getElementById('status-dropdown');
    if (dd) dd.classList.remove('show');
    if (typeof showSection === 'function') {
        showSection('status-dana');
    } else {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        const t = document.getElementById('status-dana');
        if (t) t.classList.add('active');
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        const sel = document.getElementById('mobile-nav-select');
        if (sel) sel.value = 'status-dana';
    }
    showLoadingDana(true);
    loadDanaData();
}

function loadDanaData() {
    dbShowLoading(true);
    fetchJSONP(ANGGARAN_GAS_URL + '?action=getPengajuanDana')
        .then(data => {
            if (data && data.success === true) {
                allDana = sortDanaByDate(data.data || []);
            } else {
                showDanaError(data ? data.message : 'Gagal mengambil data');
                allDana = [];
            }
            danaCurrentPage = 1;
            danaDisplayData = allDana;
            renderDanaTable(danaDisplayData, 1);
            hideLoadingDana();
        })
        .catch(err => {
            console.error('Dana fetch error:', err);
            showDanaError('Tidak dapat terhubung ke server. Periksa koneksi internet.');
            allDana = []; danaDisplayData = [];
            renderDanaTable([], 1); hideLoadingDana();
        });
}

// ============================================
// RENDER TABEL
// ============================================
function renderDanaTable(data, page) {
    page = page || 1;
    const tbody = document.getElementById('dana-table-body');
    if (!tbody) return;

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / danaPageSize));
    page = Math.min(page, totalPages);

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">Tidak ada data pengajuan dana</td></tr>';
        renderDanaPagination(0, 1, 1);
        return;
    }

    const start = (page - 1) * danaPageSize;
    const slice = data.slice(start, start + danaPageSize);

    tbody.innerHTML = slice.map((item, idx) => {
        const status = (item.status || 'PENDING').toUpperCase();
        const statusClass = status.toLowerCase();
        const isRejected = status === 'REJECTED' || status === 'DITOLAK';
        const rowClass = isRejected ? 'row-rejected' : '';

        const rawTs = getDanaTimestamp(item);
        const timestamp = rawTs ? parseDanaDate(rawTs).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

        const nominal = item.nominalPengajuan
            ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.nominalPengajuan)
            : '-';

        const bulan = item.bulanPengajuan || '-';
        const sub = item.subKegiatan || '-';
        const subShow = sub.length > 50 ? sub.substring(0, 47) + '...' : sub;
        const globalIdx = start + idx;

        const editBtn = isRejected
            ? `<div style="margin-top:8px;"><button class="btn-edit-dana" onclick="openDanaEditModal(${globalIdx})" title="Edit dan kirim ulang pengajuan">${DANA_ICONS.edit} Edit &amp; Kirim Ulang</button></div>`
            : '';

        const fileCell = (item.linkFilePengajuanDana && item.linkFilePengajuanDana.trim() !== '')
            ? `<a href="${item.linkFilePengajuanDana}" target="_blank" rel="noopener" style="color:#6366f1;font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:4px;justify-content:center;width:100%;">${DANA_ICONS.link} Lihat</a>`
            : '<span style="color:#9ca3af;font-size:12px;">—</span>';

        // Jadikan Unit persis seperti design Pill
        const unitHtml = `<span class="dana-bidang-pill-sm">${item.unit || '-'}</span>`;

        // 8 KOLOM YANG BENAR:
        // 1. Tanggal | 2. Nama | 3. Sub Kegiatan | 4. Bulan | 5. Nominal | 6. Unit/Bidang | 7. File | 8. Status
        return `<tr class="${rowClass}">
            <td style="vertical-align:middle;font-size:13px;color:#475569;">${timestamp}</td>
            <td style="vertical-align:middle;font-weight:600;font-size:14px;">${item.nama || '-'}</td>
            <td style="vertical-align:middle;max-width:250px;white-space:normal;line-height:1.4;color:#333;" title="${sub}">${subShow}</td>
            <td style="vertical-align:middle;font-size:13px;">${bulan}</td>
            <td style="vertical-align:middle;text-align:right;font-weight:600;font-size:13.5px;">${nominal}</td>
            <td style="vertical-align:middle;text-align:center;">${unitHtml}</td>
            <td style="vertical-align:middle;text-align:center;">${fileCell}</td>
            <td class="action-cell" style="text-align:center;vertical-align:middle;padding:12px 16px;">
                <span class="status-badge ${statusClass}" style="display:inline-flex;width:100%;justify-content:center;box-sizing:border-box;">${status}</span>
                ${editBtn}
            </td>
        </tr>`;
    }).join('');

    renderDanaPagination(total, page, totalPages);
}

// ============================================
// PAGINATION
// ============================================
function renderDanaPagination(total, page, totalPages) {
    const container = document.getElementById('dana-pagination');
    if (!container) return;
    if (total === 0) { container.innerHTML = ''; return; }

    const start = (page - 1) * danaPageSize + 1;
    const end = Math.min(page * danaPageSize, total);
    const sizeOpts = [10, 25, 50, 100];

    let html = '<div class="pagination-size"><label>Tampilkan&nbsp;<select class="page-size-select" onchange="changeDanaPageSize(this.value)">';
    sizeOpts.forEach(n => { html += `<option value="${n}"${n === danaPageSize ? ' selected' : ''}>${n}</option>`; });
    html += `</select>&nbsp;data per halaman</label></div>`;
    html += `<div class="pagination-info">Menampilkan ${start}–${end} dari ${total} data</div>`;
    html += `<div class="pagination-controls">`;
    html += `<button class="page-btn" onclick="goToDanaPage(1)"${page === 1 ? ' disabled' : ''}>««</button>`;
    html += `<button class="page-btn" onclick="goToDanaPage(${page - 1})"${page === 1 ? ' disabled' : ''}>‹</button>`;

    const delta = 2;
    const from = Math.max(1, page - delta);
    const to = Math.min(totalPages, page + delta);
    if (from > 1) html += `<span class="page-ellipsis">…</span>`;
    for (let i = from; i <= to; i++) {
        html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="goToDanaPage(${i})">${i}</button>`;
    }
    if (to < totalPages) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn" onclick="goToDanaPage(${page + 1})"${page === totalPages ? ' disabled' : ''}>›</button>`;
    html += `<button class="page-btn" onclick="goToDanaPage(${totalPages})"${page === totalPages ? ' disabled' : ''}>»»</button>`;
    html += `</div>`;
    container.innerHTML = html;
}

function goToDanaPage(page) {
    danaCurrentPage = page;
    renderDanaTable(danaDisplayData, danaCurrentPage);
    const sec = document.getElementById('status-dana');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// SEARCH + FILTER
// ============================================
function filterDana() {
    const searchTerm = document.getElementById('search-dana').value.toLowerCase();
    let filtered = currentDanaFilter === 'ALL' ? allDana : allDana.filter(d => (d.status || 'PENDING').toUpperCase() === currentDanaFilter);
    if (searchTerm) {
        filtered = filtered.filter(d =>
            [d.nama, d.unit, d.subKegiatan, d.bulanPengajuan]
                .map(v => (v || '').toLowerCase()).join(' ')
                .includes(searchTerm)
        );
    }
    danaCurrentPage = 1;
    danaDisplayData = sortDanaByDate(filtered);
    renderDanaTable(danaDisplayData, 1);
}

function filterDanaByStatus(status, clickedBtn) {
    currentDanaFilter = status;
    document.querySelectorAll('#status-dana .filter-btn').forEach(b => b.classList.remove('active'));
    const btn = clickedBtn || (typeof event !== 'undefined' && event && event.target);
    if (btn && btn.classList) btn.classList.add('active');

    const searchTerm = document.getElementById('search-dana').value.toLowerCase();
    let filtered = status === 'ALL' ? allDana : allDana.filter(d => (d.status || 'PENDING').toUpperCase() === status);
    if (searchTerm) {
        filtered = filtered.filter(d =>
            [d.nama, d.unit, d.subKegiatan, d.bulanPengajuan]
                .map(v => (v || '').toLowerCase()).join(' ')
                .includes(searchTerm)
        );
    }
    danaCurrentPage = 1;
    danaDisplayData = sortDanaByDate(filtered);
    renderDanaTable(danaDisplayData, 1);
}

// ============================================
// ★ MODAL EDIT — OPEN
// ============================================
function openDanaEditModal(globalIdx) {
    const item = danaDisplayData[globalIdx];
    if (!item) return;
    editDanaItem = item;
    editDanaNewFile = null;

    const nominal = item.nominalPengajuan ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.nominalPengajuan) : '-';
    document.getElementById('dana-edit-info-bar').innerHTML = `
        <div class="dana-edit-info-row"><span class="dana-edit-info-label">Nama</span><span class="dana-edit-info-value">${item.nama || '-'}</span></div>
        <div class="dana-edit-info-row"><span class="dana-edit-info-label">Unit</span><span class="dana-edit-info-value">${item.unit || '-'}</span></div>
        <div class="dana-edit-info-row"><span class="dana-edit-info-label">Bulan</span><span class="dana-edit-info-value">${item.bulanPengajuan || '-'}</span></div>
        <div class="dana-edit-info-row"><span class="dana-edit-info-label">Nominal Saat Ini</span><span class="dana-edit-info-value">${nominal}</span></div>
        <div class="dana-edit-info-row"><span class="dana-edit-info-label">Status</span><span class="dana-edit-info-value rejected">✕ DITOLAK</span></div>
    `;

    const displayEl = document.getElementById('dana-edit-nominal-display');
    const rawEl = document.getElementById('dana-edit-nominal-raw');
    const nominalRaw = item.nominalPengajuan ? String(item.nominalPengajuan).replace(/\D/g, '') : '';
    rawEl.value = nominalRaw;
    displayEl.value = nominalRaw ? parseInt(nominalRaw, 10).toLocaleString('id-ID') : '';

    const fileRow = document.getElementById('dana-current-file-row');
    const fileLink = document.getElementById('dana-current-file-link');
    if (item.linkFilePengajuanDana && item.linkFilePengajuanDana.trim() !== '') {
        fileLink.href = item.linkFilePengajuanDana;
        fileLink.innerHTML = `${DANA_ICONS.link} Lihat File Saat Ini`;
        fileRow.style.display = 'flex';
    } else { fileRow.style.display = 'none'; }

    document.getElementById('dana-edit-file-input').value = '';
    const fileInfoEl = document.getElementById('dana-edit-file-info');
    fileInfoEl.textContent = ''; fileInfoEl.classList.remove('show');
    document.getElementById('dana-file-drop-area').classList.remove('has-file');

    hideDanaModalAlert(); hideDanaModalProgress();
    const submitBtn = document.getElementById('dana-edit-submit-btn');
    submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulang Pengajuan';

    const modal = document.getElementById('dana-edit-modal');
    modal.classList.add('show'); document.body.style.overflow = 'hidden';
}

function closeDanaEditModal() {
    const modal = document.getElementById('dana-edit-modal');
    modal.classList.remove('show'); document.body.style.overflow = '';
    editDanaItem = null; editDanaNewFile = null;
}

function formatDanaEditNominal(inputEl) {
    let raw = inputEl.value.replace(/\D/g, '');
    document.getElementById('dana-edit-nominal-raw').value = raw;
    inputEl.value = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
}

function handleDanaEditFileChange(event) {
    const file = event.target.files[0];
    const infoEl = document.getElementById('dana-edit-file-info');
    const dropArea = document.getElementById('dana-file-drop-area');

    editDanaNewFile = null; infoEl.textContent = ''; infoEl.classList.remove('show'); dropArea.classList.remove('has-file');
    if (!file) return;

    if (file.type !== 'application/pdf') { showDanaModalAlert('❌ Hanya file PDF yang diperbolehkan!', 'error'); event.target.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { showDanaModalAlert('❌ Ukuran file melebihi 10 MB. Pilih file yang lebih kecil.', 'error'); event.target.value = ''; return; }

    hideDanaModalAlert(); editDanaNewFile = file;
    const sizeStr = file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    infoEl.innerHTML = `✅ <strong>${file.name}</strong> &nbsp;(${sizeStr})`;
    infoEl.classList.add('show'); dropArea.classList.add('has-file');
}

async function submitDanaEdit() {
    if (!editDanaItem) return;
    const nominalRaw = document.getElementById('dana-edit-nominal-raw').value;
    if (!nominalRaw || parseInt(nominalRaw) <= 0) { showDanaModalAlert('❌ Nominal pengajuan harus diisi dengan angka yang valid.', 'error'); document.getElementById('dana-edit-nominal-display').focus(); return; }

    const submitBtn = document.getElementById('dana-edit-submit-btn');
    submitBtn.disabled = true; submitBtn.textContent = 'Memproses...';
    hideDanaModalAlert(); showDanaModalProgress(15, 'Mempersiapkan data...');

    try {
        const itemId = String(editDanaItem.id || '').trim();
        if (!itemId) throw new Error('ID pengajuan tidak ditemukan. Coba refresh halaman.');
        const fields = {
            action: 'resubmitPengajuanDana', id: itemId,
            nama: editDanaItem.nama || '', unit: editDanaItem.unit || '', sub_kegiatan: editDanaItem.subKegiatan || '',
            bulan_pengajuan: editDanaItem.bulanPengajuan || '', nominal_pengajuan: nominalRaw,
            existingFileUrl: editDanaItem.linkFilePengajuanDana || '', hasNewFile: 'false', fileName: '', fileData: '', mimeType: '',
        };

        if (editDanaNewFile) {
            showDanaModalProgress(35, 'Membaca file PDF...');
            const base64Data = await fileToBase64Dana(editDanaNewFile);
            fields.fileName = editDanaNewFile.name; fields.fileData = base64Data;
            fields.mimeType = editDanaNewFile.type || 'application/pdf'; fields.hasNewFile = 'true';
        }
        showDanaModalProgress(60, 'Mengirim ke sistem...');
        const body = Object.keys(fields).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(fields[k] ?? '')).join('&');
        const resp = await fetch(ANGGARAN_GAS_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, redirect: 'follow' });
        const text = await resp.text();
        let result;
        try { result = JSON.parse(text); } catch (e) { result = { status: 'success' }; }
        showDanaModalProgress(100, 'Selesai!');

        if (result?.status === 'success' || result?.success === true) {
            setTimeout(() => {
                hideDanaModalProgress(); showDanaModalAlert('✅ Pengajuan berhasil dikirim ulang!', 'success');
                submitBtn.textContent = '✓ Terkirim';
                setTimeout(() => { closeDanaEditModal(); showLoadingDana(true); loadDanaData(); }, 2500);
            }, 400);
        } else {
            hideDanaModalProgress(); showDanaModalAlert('❌ Gagal: ' + (result?.message || 'Terjadi kesalahan.'), 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulang Pengajuan';
        }
    } catch (err) {
        console.error('Dana edit error:', err); hideDanaModalProgress();
        showDanaModalAlert('❌ Terjadi kesalahan: ' + err.message, 'error');
        submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulang Pengajuan';
    }
}

function fileToBase64Dana(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }
function showDanaModalAlert(msg, type) { const el = document.getElementById('dana-modal-alert'); if (!el) return; el.textContent = msg; el.className = 'dana-modal-alert show ' + (type || 'error'); }
function hideDanaModalAlert() { const el = document.getElementById('dana-modal-alert'); if (el) { el.className = 'dana-modal-alert'; el.textContent = ''; } }
function showDanaModalProgress(pct, label) { const wrap = document.getElementById('dana-modal-progress'); const fill = document.getElementById('dana-modal-progress-fill'); const lbl = document.getElementById('dana-modal-progress-label'); if (wrap) wrap.classList.add('show'); if (fill) fill.style.width = pct + '%'; if (lbl) lbl.textContent = label || ''; }
function hideDanaModalProgress() { const wrap = document.getElementById('dana-modal-progress'); const fill = document.getElementById('dana-modal-progress-fill'); if (fill) fill.style.width = '0%'; if (wrap) setTimeout(() => wrap.classList.remove('show'), 300); }

function showLoadingDana(clearTable = false) {
    const tbody = document.getElementById('dana-table-body');
    if (tbody && clearTable) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">
                <div class="spinner" style="margin:0 auto 10px;"></div><div style="font-size:13px;">Memuat ulang data...</div>
            </td></tr>`;
    }
    const pg = document.getElementById('dana-pagination');
    if (pg && clearTable) pg.innerHTML = '';
}
function hideLoadingDana() { /* handled by renderDanaTable */ }
function showDanaError(message) {
    const tbody = document.getElementById('dana-table-body');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">
            ⚠️ ${message || 'Terjadi kesalahan'}<br><br><button class="btn btn-primary" onclick="loadDanaData()" style="font-size:0.875rem;padding:8px 16px;">Coba Lagi</button></td></tr>`;
}

console.log('status-dana.js loaded ✓');