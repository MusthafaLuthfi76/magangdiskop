/**
 * status-dana-bersama.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mengelola tampilan, filter, pagination, dan edit-resubmit
 * untuk fitur "Status Pengajuan Dana Bersama".
 * ─────────────────────────────────────────────────────────────────────────────
 */

const DB_GAS_URL =
    typeof ANGGARAN_GAS_URL !== 'undefined'
        ? ANGGARAN_GAS_URL
        : 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec';

let dbAllData = [];
let dbDisplayData = [];
let dbCurrentPage = 1;
let dbPageSize = 10;
let dbStatusFilter = 'ALL';

let dbEditItem = null;
let dbEditNewFile = null;

// ── SVG Icons ─────────────────────────────────────────────
const DB_ICONS = {
    refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    link: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    file: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
};

/* ============================================================
   INJECT CSS  (idempoten — hanya inject sekali)
   ============================================================ */
(function injectDBStyles() {
    if (document.getElementById('db-edit-styles')) return;

    const css = `
    /* ── Modal Overlay ── */
    #db-edit-modal {
        display: none; position: fixed; inset: 0; z-index: 10000;
        background: rgba(10,15,30,.72); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        align-items: center; justify-content: center; padding: 16px; animation: dbFadeIn .22s ease;
    }
    #db-edit-modal.show { display: flex; }
    @keyframes dbFadeIn { from{opacity:0} to{opacity:1} }

    /* ── Modal Card ── */
    .db-modal-card {
        background: #fff; border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh;
        overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,.28);
        animation: dbSlideUp .26s cubic-bezier(.34,1.56,.64,1); position: relative;
    }
    @keyframes dbSlideUp { from { transform: translateY(40px) scale(.96); opacity:0; } to { transform: translateY(0) scale(1); opacity:1; } }

    /* ── Header ── */
    .db-modal-header { padding: 24px 28px 18px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 14px; }
    .db-modal-header-icon { width:44px; height:44px; border-radius:12px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; flex-shrink:0; color: #fff; }
    .db-modal-header-text h3 { font-size:17px; font-weight:700; color:#111827; margin:0 0 4px; }
    .db-modal-header-text p  { font-size:13px; color:#6b7280; margin:0; line-height:1.4; }
    .db-modal-close { margin-left:auto; background:#f3f4f6; border:none; border-radius:8px; width:32px; height:32px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:18px; flex-shrink:0; transition: background .15s, color .15s; }
    .db-modal-close:hover { background:#ede9fe; color:#6366f1; }

    /* ── Info bar ── */
    .db-edit-info { margin: 16px 28px 0; background: #f8faff; border: 1px solid #e0e8ff; border-radius: 12px; padding: 14px 16px; }
    .db-edit-info-row { display:flex; justify-content:space-between; gap:8px; font-size:13px; color:#374151; margin-bottom:6px; }
    .db-edit-info-row:last-child { margin-bottom:0; }
    .db-edit-info-label  { color:#6b7280; font-weight:500; flex-shrink:0; }
    .db-edit-info-value  { font-weight:600; text-align:right; color:#111827; }
    .db-edit-info-value.rejected { color:#dc2626; background:#fee2e2; border-radius:5px; padding:1px 8px; font-size:12px; }

    /* ── Bidang pills ── */
    .db-bidang-pill { display:inline-block; background:#ede9fe; color:#5b21b6; border:1px solid #c4b5fd; font-size:11px; font-weight:700; padding:1px 7px; border-radius:999px; white-space:nowrap; margin:1px; }

    /* ── Form ── */
    .db-modal-body { padding: 20px 28px; }
    .db-form-group { margin-bottom:18px; }
    .db-form-label { display:block; font-size:13.5px; font-weight:600; color:#374151; margin-bottom:7px; }
    .db-form-label .req { color:#dc2626; margin-left:2px; }
    .db-form-input { width:100%; padding:11px 14px; border:1.5px solid #d1d5db; border-radius:10px; font-size:14.5px; font-family:inherit; color:#111827; background:#fff; transition: border-color .18s, box-shadow .18s; box-sizing:border-box; }
    .db-form-input:focus { outline:none; border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.15); }
    .db-form-hint { font-size:12px; color:#9ca3af; margin-top:5px; }

    /* ── File upload ── */
    .db-file-area { border:2px dashed #d1d5db; border-radius:12px; padding:20px; text-align:center; cursor:pointer; transition: border-color .2s, background .2s; position:relative; background:#fafafa; }
    .db-file-area:hover { border-color:#6366f1; background:#f5f3ff; }
    .db-file-area.has-file { border-color:#059669; background:#f0fdf4; }
    .db-file-area input[type="file"] { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }
    .db-file-icon  { margin-bottom:8px; display:block; color:#9ca3af;}
    .db-file-text  { font-size:13.5px; font-weight:600; color:#374151; }
    .db-file-subtext { font-size:12px; color:#9ca3af; margin-top:4px; }
    .db-file-selected { display:none; font-size:13px; font-weight:600; color:#059669; margin-top:10px; background:#dcfce7; border-radius:8px; padding:8px 12px; text-align:left; word-break:break-all; }
    .db-file-selected.show { display:block; }
    .db-current-file { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; margin-bottom:12px; font-size:13px; color:#0369a1; }
    .db-current-file a { color:#0369a1; text-decoration:none; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:300px; display:inline-flex; align-items:center; gap:4px; }
    .db-current-file a:hover { text-decoration:underline; }

    /* ── Footer ── */
    .db-modal-footer { padding:16px 28px 24px; display:flex; gap:10px; justify-content:flex-end; border-top:1px solid #f0f0f0; }
    .db-btn { padding:10px 22px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; border:none; transition:all .17s; font-family:inherit; }
    .db-btn-cancel { background:#f3f4f6; color:#374151; }
    .db-btn-cancel:hover { background:#e5e7eb; }
    .db-btn-submit { background: linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; min-width:150px; }
    .db-btn-submit:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(99,102,241,.35); }
    .db-btn-submit:disabled { opacity:.6; cursor:not-allowed; transform:none; box-shadow:none; }

    /* ── Alert & Progress in modal ── */
    .db-modal-alert { display:none; padding:10px 14px; border-radius:9px; font-size:13px; font-weight:500; margin:0 28px 14px; }
    .db-modal-alert.show { display:block; }
    .db-modal-alert.success { background:#dcfce7; color:#166534; border:1px solid #bbf7d0; }
    .db-modal-alert.error   { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; }
    .db-modal-progress { display:none; margin:0 28px 14px; }
    .db-modal-progress.show { display:block; }
    .db-modal-progress-bar { height:5px; background:#f3f4f6; border-radius:99px; overflow:hidden; }
    .db-modal-progress-fill { height:100%; border-radius:99px; width:0%; background: linear-gradient(90deg,#6366f1,#4f46e5); transition: width .4s ease; }
    .db-modal-progress-label { font-size:12px; color:#6b7280; margin-top:5px; text-align:center; }

    /* ── Table Buttons & Styling ── */
    .btn-edit-db {
        display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
        background: linear-gradient(135deg,#ede9fe,#ddd6fe); border:1px solid #a78bfa; color:#5b21b6;
        border-radius:8px; font-size:12px; font-weight:600; cursor:pointer;
        font-family:inherit; transition:all .2s ease; white-space:nowrap; margin-top:8px; width: 100%; justify-content: center; box-sizing: border-box;
    }
    .btn-edit-db:hover { background: linear-gradient(135deg,#ddd6fe,#c4b5fd); transform:translateY(-1px); box-shadow:0 3px 10px rgba(167,139,250,.4); }
    .action-cell { vertical-align: top !important; padding: 12px 16px !important; }
    .btn-refresh {
        display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; color: #475569;
        border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-refresh:hover { background: #f1f5f9; border-color: #cbd5e1; }

    .db-bidang-pill-sm {
        display:inline-block; background:#fdf8f0; color:#92400e; border:1px solid #e8d5b0;
        font-size:11.5px; font-weight:700; padding:3px 10px; border-radius:999px; white-space:normal; margin:2px; line-height: 1.3; text-align: center;
    }

    /* ── Rejected row highlight ── */
    tr.row-rejected td { background: #fff8f8 !important; }
    tr.row-rejected:hover td { background: #fff0f0 !important; }

    /* ── Status badge ── */
    .status-badge { display: inline-flex; width: 100%; justify-content: center; box-sizing: border-box; }
    .status-badge.rejected, .status-badge.ditolak { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .status-badge.approved, .status-badge.disetujui { background: #dcfce7; color: #059669; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .status-badge.pending { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }

    @media (max-width:540px) {
        .db-modal-card { border-radius:16px 16px 0 0; max-height:92vh; margin-top:auto; }
        .db-modal-header,.db-modal-body,.db-modal-footer { padding-left:20px; padding-right:20px; }
        .db-edit-info,.db-modal-alert,.db-modal-progress { margin-left:20px; margin-right:20px; }
    }
    `;

    const style = document.createElement('style');
    style.id = 'db-edit-styles';
    style.textContent = css;
    document.head.appendChild(style);
})();

/* ============================================================
   INJECT MODAL HTML  (idempoten)
   ============================================================ */
(function injectDBModal() {
    if (document.getElementById('db-edit-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'db-edit-modal';
    modal.innerHTML = `
    <div class="db-modal-card">
        <div class="db-modal-header">
            <div class="db-modal-header-icon">${DB_ICONS.edit}</div>
            <div class="db-modal-header-text">
                <h3>Edit Pengajuan Dana Bersama</h3>
                <p>Perbarui nominal dan/atau file pengajuan yang ditolak</p>
            </div>
            <button class="db-modal-close" onclick="dbCloseModal()" title="Tutup">✕</button>
        </div>

        <div class="db-edit-info" id="db-edit-info-bar"></div>
        <div class="db-modal-alert" id="db-modal-alert"></div>

        <div class="db-modal-progress" id="db-modal-progress">
            <div class="db-modal-progress-bar"><div class="db-modal-progress-fill" id="db-modal-progress-fill"></div></div>
            <div class="db-modal-progress-label" id="db-modal-progress-label">Memproses...</div>
        </div>

        <div class="db-modal-body">
            <div class="db-form-group">
                <label class="db-form-label">Nominal Pengajuan (Rp) <span class="req">*</span></label>
                <input type="text" id="db-edit-nominal-display" class="db-form-input" placeholder="Contoh: 5.000.000" inputmode="numeric" autocomplete="off" oninput="dbFormatNominal(this)">
                <input type="hidden" id="db-edit-nominal-raw">
                <div class="db-form-hint">Masukkan nominal baru jika perlu diubah</div>
            </div>

            <div class="db-form-group">
                <label class="db-form-label">File Pengajuan Dana (PDF) <span style="font-size:11px;font-weight:400;color:#6b7280;margin-left:6px;">— kosongkan jika tidak ganti file</span></label>
                <div class="db-current-file" id="db-current-file-row" style="display:none;">
                    <a id="db-current-file-link" href="#" target="_blank" rel="noopener">${DB_ICONS.link} Lihat File Saat Ini</a>
                </div>
                <div class="db-file-area" id="db-file-drop-area">
                    <input type="file" id="db-edit-file-input" accept=".pdf" onchange="dbHandleFileChange(event)">
                    <span class="db-file-icon">${DB_ICONS.file}</span>
                    <div class="db-file-text">Klik atau seret file PDF ke sini</div>
                    <div class="db-file-subtext">Format: PDF | Maks. 10 MB</div>
                </div>
                <div class="db-file-selected" id="db-edit-file-info"></div>
            </div>
        </div>

        <div class="db-modal-footer">
            <button class="db-btn db-btn-cancel" onclick="dbCloseModal()">Batal</button>
            <button class="db-btn db-btn-submit" id="db-edit-submit-btn" onclick="dbSubmitEdit()">Kirim Ulang Pengajuan</button>
        </div>
    </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', function (e) { if (e.target === modal) dbCloseModal(); });

    setTimeout(() => {
        const filterContainer = document.querySelector('#status-dana-bersama .search-filter');
        if (filterContainer) {
            let existingRefreshBtn = null;
            const buttons = filterContainer.querySelectorAll('button');
            buttons.forEach(b => { if (b.textContent.includes('Refresh')) existingRefreshBtn = b; });

            if (existingRefreshBtn) {
                existingRefreshBtn.className = 'btn-refresh';
                existingRefreshBtn.innerHTML = `${DB_ICONS.refresh} Refresh`;
            } else {
                const btn = document.createElement('button');
                btn.className = 'btn-refresh';
                btn.innerHTML = `${DB_ICONS.refresh} Refresh`;
                btn.onclick = () => { dbShowLoading(true); loadDanaBersamaData(); };
                filterContainer.appendChild(btn);
                filterContainer.style.display = 'flex';
                filterContainer.style.gap = '10px';
                filterContainer.style.flexWrap = 'wrap';
                filterContainer.style.alignItems = 'center';
            }
        }
    }, 500);
})();

/* ============================================================
   JSONP HELPER
   ============================================================ */
function dbFetchJSONP(url) {
    return new Promise(function (resolve, reject) {
        const cbName = 'db_jsonp_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
        const script = document.createElement('script');
        script.src = url + '&callback=' + cbName;
        const timer = setTimeout(function () { cleanup(); reject(new Error('Request timeout')); }, 15000);
        window[cbName] = function (data) { cleanup(); resolve(data); };
        function cleanup() { clearTimeout(timer); delete window[cbName]; if (script.parentNode) script.parentNode.removeChild(script); }
        script.onerror = function () { cleanup(); reject(new Error('Network error')); };
        document.head.appendChild(script);
    });
}

/* ============================================================
   TIMESTAMP HELPERS
   ============================================================ */
function dbGetTimestamp(item) {
    const keys = ['timestamp', 'Timestamp', 'tanggal', 'createdAt', 'date'];
    for (const k of keys) { if (item[k]) return item[k]; }
    return null;
}
function dbParseDate(raw) {
    if (!raw) return new Date(0);
    if (raw instanceof Date) return raw;
    const d = new Date(raw);
    if (!isNaN(d)) return d;
    const m = String(raw).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (m) return new Date(m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0'));
    return new Date(0);
}
function dbSortByDate(arr) {
    return [...arr].sort(function (a, b) { return dbParseDate(dbGetTimestamp(b)) - dbParseDate(dbGetTimestamp(a)); });
}

/* ============================================================
   FORMAT HELPERS
   ============================================================ */
function dbFormatRupiah(value) {
    const n = parseFloat(String(value).replace(/\D/g, ''));
    if (isNaN(n)) return '-';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}
function dbFormatDate(raw) {
    const d = dbParseDate(raw);
    if (d.getTime() === 0) return '-';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function dbBuildBidangPills(bidangStr, pillClass) {
    const cls = pillClass || 'db-bidang-pill-sm';
    return (bidangStr || '').split(',').map(function (b) { return b.trim(); }).filter(Boolean)
        .map(function (b) { return '<span class="' + cls + '">' + b + '</span>'; }).join('');
}

/* ============================================================
   PAGE SIZE & NAVIGASI
   ============================================================ */
function dbChangePageSize(val) {
    dbPageSize = parseInt(val) || 10; dbCurrentPage = 1; dbRenderTable(dbDisplayData, 1);
}

function showDanaBersamaStatus() {
    const dd = document.getElementById('status-dropdown');
    if (dd) dd.classList.remove('show');
    if (typeof showSection === 'function') {
        showSection('status-dana-bersama');
    } else {
        document.querySelectorAll('.section').forEach(function (s) { s.classList.remove('active'); });
        const t = document.getElementById('status-dana-bersama');
        if (t) t.classList.add('active');
    }
    const ms = document.getElementById('mobile-nav-select');
    if (ms) ms.value = 'status-dana-bersama';

    dbShowLoading(true);
    loadDanaBersamaData();
}

/* ============================================================
   FETCH DATA
   ============================================================ */
function loadDanaBersamaData() {
    dbShowLoading(true);
    dbFetchJSONP(DB_GAS_URL + '?action=getPengajuanDanaBersama')
        .then(function (data) {
            if (data && data.success === true) { dbAllData = dbSortByDate(data.data || []); }
            else { dbShowError((data && data.message) || 'Gagal mengambil data'); dbAllData = []; }
            dbCurrentPage = 1; dbDisplayData = dbAllData.slice(); dbRenderTable(dbDisplayData, 1); dbHideLoading();
        })
        .catch(function (err) {
            console.error('[status-dana-bersama] fetch error:', err);
            dbShowError('Tidak dapat terhubung ke server. Periksa koneksi internet.');
            dbAllData = []; dbDisplayData = []; dbRenderTable([], 1); dbHideLoading();
        });
}

/* ============================================================
   RENDER TABLE (Telah diurutkan sesuai gambar)
   ============================================================ */
function dbRenderTable(data, page) {
    page = page || 1;
    const tbody = document.getElementById('dana-bersama-tbody');
    if (!tbody) return;

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / dbPageSize));
    page = Math.min(page, totalPages);

    if (total === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">Tidak ada data pengajuan dana bersama</td></tr>';
        dbRenderPagination(0, 1, 1);
        return;
    }

    const start = (page - 1) * dbPageSize;
    const slice = data.slice(start, start + dbPageSize);

    tbody.innerHTML = slice.map(function (item, idx) {
        const status = (item.status || 'PENDING').toUpperCase();
        const statusCls = status.toLowerCase();
        const isRejected = status === 'REJECTED' || status === 'DITOLAK';
        const rowCls = isRejected ? 'row-rejected' : '';
        const globalIdx = start + idx;

        const editBtn = isRejected
            ? `<div style="margin-top:8px;"><button class="btn-edit-db" onclick="dbOpenModal(${globalIdx})" title="Edit dan kirim ulang">${DB_ICONS.edit} Edit &amp; Kirim Ulang</button></div>`
            : '';

        const fileCell = (item.linkFilePengajuanDana && item.linkFilePengajuanDana.trim() !== '')
            ? `<a href="${item.linkFilePengajuanDana}" target="_blank" rel="noopener" style="color:#6366f1;font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:4px;justify-content:center;width:100%;">${DB_ICONS.link} Lihat</a>`
            : '<span style="color:#9ca3af;font-size:12px;">—</span>';

        const bidangHtml = dbBuildBidangPills(item.bidang);
        const sub = item.subKegiatan || '-';
        const subShow = sub.length > 50 ? sub.substring(0, 47) + '...' : sub;

        // Urutan: Tanggal | Nama | Sub Kegiatan | Bulan | Nominal | Bidang | File | Status
        return `<tr class="${rowCls}">
            <td style="vertical-align:middle;font-size:13px;color:#475569;">${dbFormatDate(dbGetTimestamp(item))}</td>
            <td style="vertical-align:middle;font-weight:600;font-size:14px;">${item.nama || '-'}</td>
            <td style="vertical-align:middle;max-width:250px;white-space:normal;line-height:1.4;color:#333;" title="${sub}">${subShow}</td>
            <td style="vertical-align:middle;font-size:13px;">${item.bulanPengajuan || '-'}</td>
            <td style="vertical-align:middle;text-align:right;font-weight:600;font-size:13.5px;">${dbFormatRupiah(item.nominalPengajuan)}</td>
            <td style="vertical-align:middle;"><div style="display:flex;flex-wrap:wrap;gap:2px;">${bidangHtml || '<span style="color:#9ca3af;font-size:12px;">—</span>'}</div></td>
            <td style="vertical-align:middle;text-align:center;">${fileCell}</td>
            <td class="action-cell" style="text-align:center;vertical-align:middle;padding:12px 16px;">
                <span class="status-badge ${statusCls}">${status}</span>
                ${editBtn}
            </td>
        </tr>`;
    }).join('');

    dbRenderPagination(total, page, totalPages);
}

/* ============================================================
   PAGINATION
   ============================================================ */
function dbRenderPagination(total, page, totalPages) {
    const container = document.getElementById('dana-bersama-pagination');
    if (!container) return;
    if (total === 0) { container.innerHTML = ''; return; }

    const start = (page - 1) * dbPageSize + 1;
    const end = Math.min(page * dbPageSize, total);
    const sizeOpts = [10, 25, 50, 100];

    let html = '<div class="pagination-size"><label>Tampilkan&nbsp;<select class="page-size-select" onchange="dbChangePageSize(this.value)">';
    sizeOpts.forEach(function (n) { html += `<option value="${n}"${n === dbPageSize ? ' selected' : ''}>${n}</option>`; });
    html += '</select>&nbsp;data per halaman</label></div>';
    html += `<div class="pagination-info">Menampilkan ${start}–${end} dari ${total} data</div>`;
    html += `<div class="pagination-controls">`;
    html += `<button class="page-btn" onclick="dbGoToPage(1)"${page === 1 ? ' disabled' : ''}>««</button>`;
    html += `<button class="page-btn" onclick="dbGoToPage(${page - 1})"${page === 1 ? ' disabled' : ''}>‹</button>`;

    const delta = 2;
    const from = Math.max(1, page - delta);
    const to = Math.min(totalPages, page + delta);
    if (from > 1) html += '<span class="page-ellipsis">…</span>';
    for (let i = from; i <= to; i++) { html += `<button class="page-btn${i === page ? ' active' : ''}" onclick="dbGoToPage(${i})">${i}</button>`; }
    if (to < totalPages) html += '<span class="page-ellipsis">…</span>';

    html += `<button class="page-btn" onclick="dbGoToPage(${page + 1})"${page === totalPages ? ' disabled' : ''}>›</button>`;
    html += `<button class="page-btn" onclick="dbGoToPage(${totalPages})"${page === totalPages ? ' disabled' : ''}>»»</button>`;
    html += '</div>';

    container.innerHTML = html;
}

function dbGoToPage(page) {
    dbCurrentPage = page;
    dbRenderTable(dbDisplayData, dbCurrentPage);
    const sec = document.getElementById('status-dana-bersama');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================================
   SEARCH + FILTER
   ============================================================ */
function filterDanaBersama() {
    const q = (document.getElementById('search-dana-bersama') || {}).value || '';
    const term = q.toLowerCase();
    const st = (document.getElementById('filter-status-dana-bersama') || {}).value || '';

    let filtered = dbAllData;
    if (st) filtered = filtered.filter(function (d) { return (d.status || 'PENDING').toUpperCase() === st; });
    if (term) {
        filtered = filtered.filter(function (d) {
            return [d.nama, d.subKegiatan, d.bulanPengajuan, d.bidang].map(function (v) { return (v || '').toLowerCase(); }).join(' ').includes(term);
        });
    }
    dbCurrentPage = 1; dbDisplayData = dbSortByDate(filtered); dbRenderTable(dbDisplayData, 1);
}

function filterDanaBersamaByStatus(status, btn) {
    dbStatusFilter = status;
    document.querySelectorAll('#status-dana-bersama .filter-btn').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    const q = (document.getElementById('search-dana-bersama') || {}).value || '';
    const term = q.toLowerCase();

    let filtered = status === 'ALL' ? dbAllData : dbAllData.filter(function (d) { return (d.status || 'PENDING').toUpperCase() === status; });
    if (term) {
        filtered = filtered.filter(function (d) {
            return [d.nama, d.subKegiatan, d.bulanPengajuan, d.bidang].map(function (v) { return (v || '').toLowerCase(); }).join(' ').includes(term);
        });
    }

    dbCurrentPage = 1; dbDisplayData = dbSortByDate(filtered); dbRenderTable(dbDisplayData, 1);
}

/* ============================================================
   MODAL — OPEN
   ============================================================ */
function dbOpenModal(globalIdx) {
    const item = dbDisplayData[globalIdx];
    if (!item) return;

    dbEditItem = item;
    dbEditNewFile = null;

    const bidangHtml = (item.bidang || '').split(',').map(function (b) { return b.trim(); }).filter(Boolean).map(function (b) { return '<span class="db-bidang-pill">' + b + '</span>'; }).join(' ');

    document.getElementById('db-edit-info-bar').innerHTML =
        '<div class="db-edit-info-row"><span class="db-edit-info-label">Nama</span><span class="db-edit-info-value">' + (item.nama || '-') + '</span></div>' +
        '<div class="db-edit-info-row"><span class="db-edit-info-label">Bulan</span><span class="db-edit-info-value">' + (item.bulanPengajuan || '-') + '</span></div>' +
        '<div class="db-edit-info-row"><span class="db-edit-info-label">Bidang</span><span class="db-edit-info-value">' + (bidangHtml || '-') + '</span></div>' +
        '<div class="db-edit-info-row"><span class="db-edit-info-label">Nominal Saat Ini</span><span class="db-edit-info-value">' + dbFormatRupiah(item.nominalPengajuan) + '</span></div>' +
        '<div class="db-edit-info-row"><span class="db-edit-info-label">Status</span><span class="db-edit-info-value rejected">✕ DITOLAK</span></div>';

    const rawNominal = item.nominalPengajuan ? String(item.nominalPengajuan).replace(/\D/g, '') : '';
    document.getElementById('db-edit-nominal-raw').value = rawNominal;
    document.getElementById('db-edit-nominal-display').value = rawNominal ? parseInt(rawNominal, 10).toLocaleString('id-ID') : '';

    const fileRow = document.getElementById('db-current-file-row');
    const fileLink = document.getElementById('db-current-file-link');
    if (item.linkFilePengajuanDana && item.linkFilePengajuanDana.trim() !== '') {
        fileLink.href = item.linkFilePengajuanDana;
        fileLink.innerHTML = `${DB_ICONS.link} Lihat File Saat Ini`;
        fileRow.style.display = 'flex';
    } else { fileRow.style.display = 'none'; }

    document.getElementById('db-edit-file-input').value = '';
    const fi = document.getElementById('db-edit-file-info');
    fi.textContent = ''; fi.classList.remove('show');
    document.getElementById('db-file-drop-area').classList.remove('has-file');

    dbHideModalAlert(); dbHideModalProgress();

    const btn = document.getElementById('db-edit-submit-btn');
    btn.disabled = false; btn.textContent = 'Kirim Ulang Pengajuan';

    const modal = document.getElementById('db-edit-modal');
    modal.classList.add('show'); document.body.style.overflow = 'hidden';
}

function dbCloseModal() {
    document.getElementById('db-edit-modal').classList.remove('show');
    document.body.style.overflow = '';
    dbEditItem = null; dbEditNewFile = null;
}

function dbFormatNominal(inputEl) {
    const raw = inputEl.value.replace(/\D/g, ''); document.getElementById('db-edit-nominal-raw').value = raw;
    inputEl.value = raw ? parseInt(raw, 10).toLocaleString('id-ID') : '';
}

function dbHandleFileChange(event) {
    const file = event.target.files[0];
    const infoEl = document.getElementById('db-edit-file-info');
    const dropArea = document.getElementById('db-file-drop-area');

    dbEditNewFile = null; infoEl.textContent = ''; infoEl.classList.remove('show'); dropArea.classList.remove('has-file');
    if (!file) return;
    if (file.type !== 'application/pdf') { dbShowModalAlert('❌ Hanya file PDF yang diperbolehkan!', 'error'); event.target.value = ''; return; }
    if (file.size > 10 * 1024 * 1024) { dbShowModalAlert('❌ Ukuran file melebihi 10 MB. Pilih file yang lebih kecil.', 'error'); event.target.value = ''; return; }

    dbHideModalAlert(); dbEditNewFile = file;
    const sizeStr = file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    infoEl.innerHTML = '✅ <strong>' + file.name + '</strong> &nbsp;(' + sizeStr + ')';
    infoEl.classList.add('show'); dropArea.classList.add('has-file');
}

/* ============================================================
   MODAL — SUBMIT EDIT
   ============================================================ */
async function dbSubmitEdit() {
    if (!dbEditItem) return;
    const nominalRaw = document.getElementById('db-edit-nominal-raw').value;
    if (!nominalRaw || parseInt(nominalRaw) <= 0) { dbShowModalAlert('❌ Nominal pengajuan harus diisi dengan angka yang valid.', 'error'); document.getElementById('db-edit-nominal-display').focus(); return; }

    const submitBtn = document.getElementById('db-edit-submit-btn');
    submitBtn.disabled = true; submitBtn.textContent = 'Memproses...';
    dbHideModalAlert(); dbShowModalProgress(15, 'Mempersiapkan data...');

    try {
        const itemId = String(dbEditItem.id || '').trim();
        if (!itemId) throw new Error('ID pengajuan tidak ditemukan. Coba refresh halaman.');

        const fields = {
            action: 'resubmitPengajuanDanaBersama',
            id: itemId,
            nama: dbEditItem.nama || '',
            sub_kegiatan: dbEditItem.subKegiatan || '',
            bulan_pengajuan: dbEditItem.bulanPengajuan || '',
            bidang: dbEditItem.bidang || '',
            nominal_pengajuan: nominalRaw,
            existingFileUrl: dbEditItem.linkFilePengajuanDana || '',
            hasNewFile: 'false', fileName: '', fileData: '', mimeType: '',
        };

        if (dbEditNewFile) {
            dbShowModalProgress(35, 'Membaca file PDF...');
            const base64Data = await dbFileToBase64(dbEditNewFile);
            fields.fileName = dbEditNewFile.name; fields.fileData = base64Data;
            fields.mimeType = dbEditNewFile.type || 'application/pdf'; fields.hasNewFile = 'true';
        }

        dbShowModalProgress(60, 'Mengirim ke sistem...');
        let result;
        if (typeof submitViaIframeFields === 'function') { result = await submitViaIframeFields(fields, 'iframe-db-edit'); }
        else { result = await dbPostFields(fields); }

        dbShowModalProgress(100, 'Selesai!');
        if (result && (result.status === 'success' || result.success === true)) {
            setTimeout(function () {
                dbHideModalProgress(); dbShowModalAlert('✅ Pengajuan berhasil dikirim ulang!', 'success');
                submitBtn.textContent = '✓ Terkirim';
                setTimeout(function () { dbCloseModal(); dbShowLoading(true); loadDanaBersamaData(); }, 2500);
            }, 400);
        } else {
            dbHideModalProgress(); dbShowModalAlert('❌ Gagal: ' + ((result && result.message) || 'Terjadi kesalahan di server.'), 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulang Pengajuan';
        }
    } catch (err) {
        dbHideModalProgress(); dbShowModalAlert('❌ Terjadi kesalahan: ' + err.message, 'error');
        submitBtn.disabled = false; submitBtn.textContent = 'Kirim Ulang Pengajuan';
    }
}

async function dbPostFields(fields) {
    const targetUrl = (typeof GAS_URL !== 'undefined') ? GAS_URL : DB_GAS_URL;
    const body = Object.keys(fields).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(fields[k] != null ? fields[k] : ''); }).join('&');
    const resp = await fetch(targetUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, redirect: 'follow' });
    const text = await resp.text();
    try { return JSON.parse(text); } catch (e) { return { status: 'success' }; }
}

function dbFileToBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader(); reader.onload = function () { resolve(reader.result.split(',')[1]); }; reader.onerror = reject; reader.readAsDataURL(file);
    });
}

function dbShowModalAlert(msg, type) { const el = document.getElementById('db-modal-alert'); if (!el) return; el.textContent = msg; el.className = 'db-modal-alert show ' + (type || 'error'); }
function dbHideModalAlert() { const el = document.getElementById('db-modal-alert'); if (el) { el.className = 'db-modal-alert'; el.textContent = ''; } }
function dbShowModalProgress(pct, label) { const wrap = document.getElementById('db-modal-progress'); const fill = document.getElementById('db-modal-progress-fill'); const lbl = document.getElementById('db-modal-progress-label'); if (wrap) wrap.classList.add('show'); if (fill) fill.style.width = pct + '%'; if (lbl) lbl.textContent = label || ''; }
function dbHideModalProgress() { const wrap = document.getElementById('db-modal-progress'); const fill = document.getElementById('db-modal-progress-fill'); if (fill) fill.style.width = '0%'; if (wrap) setTimeout(function () { wrap.classList.remove('show'); }, 300); }

function dbShowLoading(clearTable = false) {
    const tbody = document.getElementById('dana-bersama-tbody');
    if (tbody && clearTable) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">' +
            '<div class="spinner" style="margin:0 auto 10px;"></div><div style="font-size:13px;">Memuat ulang data...</div></td></tr>';
    }
    const pg = document.getElementById('dana-bersama-pagination');
    if (pg && clearTable) pg.innerHTML = '';
}
function dbHideLoading() { }
function dbShowError(message) {
    const tbody = document.getElementById('dana-bersama-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">⚠️ ' + (message || 'Terjadi kesalahan') + '<br><br><button class="btn btn-primary" onclick="loadDanaBersamaData()" style="font-size:.875rem;padding:8px 16px;">Coba Lagi</button></td></tr>';
}

console.log('status-dana-bersama.js loaded ✓');