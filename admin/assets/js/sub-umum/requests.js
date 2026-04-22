// ============================================================
// requests.js — Kendaraan Dinas section (SPA)
// Admin Panel — Dinas Koperasi UKM
// v4: newest first, full edit, reject loading, beautiful detail
// Update: Hapus status "Selesai" (Mentok di Approved)
// ============================================================
(function () {
    'use strict';

    const API_URL = 'https://script.google.com/macros/s/AKfycbxsdAlN0gLea0f9iA9h5R8VTZJtIBK_JJxFwzP_TbP5lPNCq4oylR5rD6gPB5sshMjwlg/exec';
    const CACHE_DURATION = 5 * 60 * 1000;
    const CACHE_KEYS = { REQUESTS: 'kendaraan_requests', VIOLATIONS: 'kendaraan_violations', SCORES: 'kendaraan_scores' };

    let masterRequests = [], allRequests = [];
    let masterViolations = [], allViolations = [];
    let allScores = {}, scoreChart = null, violationChart = null;
    let currentApproveId = null;
    let currentEditViol = null;
    let violSource = 'approved';
    let selectedApprovedReq = null;
    let requestsCurrentPage = 1, violationsCurrentPage = 1;
    const itemsPerPage = 10;

    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        export: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        car: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"/><path d="M19 17h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/><rect x="5" y="9" width="14" height="8" rx="2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/><path d="M8 9V5h8v4"/></svg>`,
        user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/></svg>`,
        calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        fileText: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    };

    const OPT_BULAN = `<option value="">Pilih Bulan</option>
        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option>
        <option value="MARET">Maret</option><option value="APRIL">April</option>
        <option value="MEI">Mei</option><option value="JUNI">Juni</option>
        <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option>
        <option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>`;

    const OPT_UNIT = `<option value="">Pilih Unit</option>
        <option value="Sekretariat">Sekretariat</option>
        <option value="Bidang Koperasi">Bidang Koperasi</option>
        <option value="Bidang UKM">Bidang UKM</option>
        <option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
        <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
        <option value="Balai Layanan Usaha Terpadu KUMKM">Balai Layanan Usaha Terpadu KUMKM</option>`;

    const MONTHS_ID = ['', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
        'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

    // ── Cache ─────────────────────────────────────────────────
    function saveToCache(k, d) { try { localStorage.setItem(k, JSON.stringify({ data: d, timestamp: Date.now() })); } catch (e) { } }
    function getFromCache(k) { try { const c = localStorage.getItem(k); if (!c) return null; const p = JSON.parse(c); if (Date.now() - p.timestamp < CACHE_DURATION) return p.data; localStorage.removeItem(k); return null; } catch (e) { return null; } }
    function clearCache() { Object.values(CACHE_KEYS).forEach(k => localStorage.removeItem(k)); }
    function showCacheIndicator() { const el = document.getElementById('req-cache-indicator'); if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2000); } }

    // ── API (JSONP) ─────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'req_cb_' + Math.round(100000 * Math.random());
            window[cb] = data => { delete window[cb]; document.getElementById(cb)?.remove(); resolve(data); };
            const qs = new URLSearchParams({ ...params, callback: cb }).toString();
            const script = document.createElement('script');
            script.id = cb; script.src = `${API_URL}?${qs}`;
            const tid = setTimeout(() => { delete window[cb]; script.remove(); reject(new Error('Timeout')); }, 15000);
            script.onerror = () => { clearTimeout(tid); delete window[cb]; reject(new Error('Network error')); };
            document.body.appendChild(script);
        });
    }

    // ── Date helpers ──────────────────────────────────────────
    function normalizeDisplayDate(val) {
        if (!val) return '-';
        const s = String(val).trim();
        if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) return s;
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split('-');
            return `${parseInt(d)}-${parseInt(m)}-${y}`;
        }
        try {
            const dt = new Date(s);
            if (!isNaN(dt.getTime())) {
                return `${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()}`;
            }
        } catch (e) { }
        return s;
    }

    function storageToInputDate(str) {
        if (!str || str === '-') return '';
        const s = normalizeDisplayDate(str);
        const parts = s.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return '';
    }

    function inputDateToStorage(str) {
        if (!str) return '';
        const parts = str.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
        }
        return str;
    }

    function getIdOrderValue(rawId) {
        if (!rawId) return 0;
        const text = String(rawId).trim();
        if (!text) return 0;
        const tail = text.includes('|') ? text.split('|').pop() : text;
        const m = tail.match(/(\d+)(?!.*\d)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    // ── Parse urutan terbaru dari ID ─────────────────────────
    function getRequestTimestamp(req) {
        if (!req) return 0;
        const byId = getIdOrderValue(req.id);
        if (byId) return byId;

        // Fallback kompatibilitas lama: parse REQ-{timestamp}
        if (req.id && String(req.id).startsWith('REQ-')) {
            const ts = parseInt(String(req.id).replace('REQ-', ''), 10);
            if (!isNaN(ts)) return ts;
        }
        return 0;
    }

    // Sort array descending by timestamp (newest first)
    function sortNewestFirst(arr) {
        return arr.slice().sort((a, b) => getRequestTimestamp(b) - getRequestTimestamp(a));
    }

    // ── Helpers ───────────────────────────────────────────────
    function createStatusBadge(status) {
        const s = (status || '').toLowerCase();
        const base = 'display:inline-flex;align-items:center;justify-content:center;min-width:80px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;white-space:nowrap;';
        if (s === 'approved') return `<span style="${base}background:#dcfce7;color:#15803d;">Disetujui</span>`;
        if (s === 'rejected') return `<span style="${base}background:#fee2e2;color:#b91c1c;">Ditolak</span>`;
        return `<span style="${base}background:#fef9c3;color:#a16207;">Menunggu</span>`;
    }
    function formatTime(t) { if (!t) return '-'; if (typeof t === 'string' && t.includes('T')) return t.split('T')[1].substring(0, 5); return t; }
    function openModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
    function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

    function setCurrentMonth(elId) {
        const el = document.getElementById(elId);
        if (el && !el.value) el.value = MONTHS_ID[new Date().getMonth() + 1];
    }

    // ── Tab switch ────────────────────────────────────────────
    function reqSwitchTab(tabName, event) {
        document.querySelectorAll('#section-requests .tab').forEach(t => t.classList.remove('active'));
        if (event?.target) event.target.classList.add('active');
        document.querySelectorAll('#section-requests .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('req-tab-' + tabName); if (el) el.classList.add('active');
        if (tabName === 'requests') loadRequests();
        else if (tabName === 'violations') loadViolations();
        else if (tabName === 'scores') loadScores();
    }
    window.reqSwitchTab = reqSwitchTab;
    window.reqSwitchTabDD = (v) => {
        document.querySelectorAll('#section-requests .tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('req-tab-' + v); if (el) el.classList.add('active');
        if (v === 'requests') loadRequests(); else if (v === 'violations') loadViolations(); else if (v === 'scores') loadScores();
    };

    function updateStats() {
        const t = document.getElementById('req-stat-total');
        const a = document.getElementById('req-stat-approved');
        const p = document.getElementById('req-stat-pending');
        const r = document.getElementById('req-stat-rejected');
        if (t) t.textContent = masterRequests.length;
        if (a) a.textContent = masterRequests.filter(req => (req.status || '').toUpperCase() === 'APPROVED').length;
        if (p) p.textContent = masterRequests.filter(req => (req.status || '').toUpperCase() === 'PENDING').length;
        if (r) r.textContent = masterRequests.filter(req => (req.status || '').toUpperCase() === 'REJECTED').length;
    }

    function reqApplyFilter() {
        const status = (document.getElementById('req-filter-status')?.value || '').toUpperCase();
        const search = (document.getElementById('req-search-input')?.value || '').toLowerCase().trim();
        allRequests = masterRequests.filter(req => {
            if (status && (req.status || '').toUpperCase() !== status) return false;
            const h = `${req.nama_pegawai || ''} ${req.unit_eselon || ''}`.toLowerCase();
            return !search || h.includes(search);
        });
        requestsCurrentPage = 1;
        renderPaginatedRequests();
    }
    window.reqApplyFilter = reqApplyFilter;

    // ═══ TAB 1: PERMINTAAN ═══════════════════════════════════
    async function loadRequests(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = getFromCache(CACHE_KEYS.REQUESTS);
            if (cached) {
                // FIX: sort newest first
                masterRequests = sortNewestFirst(cached);
                allRequests = [...masterRequests]; requestsCurrentPage = 1;
                renderPaginatedRequests(); showCacheIndicator(); return;
            }
        }
        const tbody = document.getElementById('req-requests-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="loading"><div class="spinner"></div><p style="margin-top:12px;color:#64748b;">Memuat data...</p></td></tr>';
        try {
            const res = await callAPI({ action: 'getRequests' });
            const rawData = Array.isArray(res) ? res : [];
            saveToCache(CACHE_KEYS.REQUESTS, rawData);
            // FIX: sort newest first
            masterRequests = sortNewestFirst(rawData);
            allRequests = [...masterRequests]; requestsCurrentPage = 1;
            renderPaginatedRequests();
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data. <button onclick="reqLoadRequests(true)" class="btn btn-sm" style="margin-left:8px;">Coba Lagi</button></td></tr>`;
            if (window.showToast) showToast('Gagal memuat data: ' + e.message, 'error');
        }
    }
    window.reqLoadRequests = (f) => loadRequests(f);

    function renderPaginatedRequests() {
        const tbody = document.getElementById('req-requests-tbody');
        const cards = document.getElementById('req-requests-cards');
        const pgn = document.getElementById('req-requests-pagination');
        if (!tbody) return;
        updateStats();

        if (allRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada pengajuan</td></tr>';
            if (cards) cards.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b;">Data tidak ditemukan</div>';
            if (pgn) pgn.innerHTML = ''; return;
        }
        const totalPages = Math.ceil(allRequests.length / itemsPerPage);
        const start = (requestsCurrentPage - 1) * itemsPerPage;
        const items = allRequests.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map(req => {
            const isPending = (req.status || '').toLowerCase() === 'pending';
            const isApproved = (req.status || '').toLowerCase() === 'approved';
            const tglDisplay = normalizeDisplayDate(req.tanggal_penggunaan);
            const kendaraan = (req.nomorKendaraan && req.nomorKendaraan !== '-')
                ? `<span style="font-family:monospace;font-weight:600;">${req.nomorKendaraan}</span>`
                : `<span style="color:#94a3b8;font-size:12px;">Belum ditentukan</span>`;
            return `<tr>
                <td style="font-weight:500;">${req.nama_pegawai || '-'}</td>
                <td style="color:#64748b;font-size:13px;">${req.unit_eselon || '-'}</td>
                <td>${tglDisplay}</td>
                <td>${formatTime(req.waktu_penjemputan)} – ${formatTime(req.waktu_pengembalian)}</td>
                <td>${kendaraan}</td>
                <td style="min-width:110px;">
                    <div style="display:flex;align-items:center;justify-content:center;">
                    ${isPending ? `<div class="btn-icon-group" style="margin:0;">
                        <button onclick="reqOpenApprove('${req.id}')" class="btn-icon btn-icon-approve" title="Setujui">${ICONS.check}</button>
                        <button onclick="reqQuickReject('${req.id}', this)" class="btn-icon btn-icon-reject" title="Tolak">${ICONS.x}</button>
                    </div>` : createStatusBadge(req.status)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons"><div class="btn-icon-group">
                        <button onclick="reqViewDetail('${req.id}')" class="btn-icon btn-icon-view" title="Detail">${ICONS.eye}</button>
                        <button onclick="reqOpenEdit('${req.id}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                        <button onclick="reqDeleteRequest('${req.id}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </td>
            </tr>`;
        }).join('');

        if (cards) cards.innerHTML = items.map(req => {
            const isPending = (req.status || '').toLowerCase() === 'pending';
            const isApproved = (req.status || '').toLowerCase() === 'approved';
            const tglDisplay = normalizeDisplayDate(req.tanggal_penggunaan);
            const kendaraan = (req.nomorKendaraan && req.nomorKendaraan !== '-') ? req.nomorKendaraan : '-';
            return `<div class="requests-card">
                <div class="requests-card-header">
                    <div style="flex:1;">
                        <div class="requests-card-title">${req.nama_pegawai || '-'}</div>
                        <div class="requests-card-subtitle">${req.unit_eselon || '-'}</div>
                    </div>
                    ${isPending ? `<div class="btn-icon-group" style="margin:0;">
                        <button onclick="reqOpenApprove('${req.id}')" class="btn-icon btn-icon-approve" title="Setujui">${ICONS.check}</button>
                        <button onclick="reqQuickReject('${req.id}', this)" class="btn-icon btn-icon-reject" title="Tolak">${ICONS.x}</button>
                    </div>` : createStatusBadge(req.status)}
                </div>
                <div class="requests-card-body">
                    <div class="requests-card-row"><span class="requests-card-label">Tanggal</span><span class="requests-card-value">${tglDisplay}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Waktu</span><span class="requests-card-value">${formatTime(req.waktu_penjemputan)} – ${formatTime(req.waktu_pengembalian)}</span></div>
                    <div class="requests-card-row"><span class="requests-card-label">Kendaraan</span><span class="requests-card-value" style="font-weight:600;">${kendaraan}</span></div>
                </div>
                <div class="requests-card-footer">
                    <div class="action-buttons" style="justify-content:flex-end;"><div class="btn-icon-group">
                        <button onclick="reqViewDetail('${req.id}')" class="btn-icon btn-icon-view" title="Detail">${ICONS.eye}</button>
                        <button onclick="reqOpenEdit('${req.id}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                        <button onclick="reqDeleteRequest('${req.id}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </div>
            </div>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="reqChangeReqPage(${requestsCurrentPage - 1})" ${requestsCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${requestsCurrentPage} dari ${totalPages} (${allRequests.length} data)</span>
            <button onclick="reqChangeReqPage(${requestsCurrentPage + 1})" ${requestsCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }
    window.reqChangeReqPage = (page) => { const t = Math.ceil(allRequests.length / itemsPerPage); if (page < 1 || page > t) return; requestsCurrentPage = page; renderPaginatedRequests(); };

    // FIX: Beautiful detail modal
    window.reqViewDetail = (id) => {
        const req = masterRequests.find(r => String(r.id) === String(id)); if (!req) return;
        const el = document.getElementById('req-detail-body');
        const statusS = (req.status || 'pending').toLowerCase();

        const statusColor = statusS === 'approved' ? '#10b981' : statusS === 'rejected' ? '#ef4444' : '#f59e0b';
        const statusBg = statusS === 'approved' ? '#f0fdf4' : statusS === 'rejected' ? '#fff1f2' : '#fffbeb';
        const statusLabel = statusS === 'approved' ? 'Disetujui' : statusS === 'rejected' ? 'Ditolak' : 'Menunggu';

        const kendaraan = (req.nomorKendaraan && req.nomorKendaraan !== '-') ? req.nomorKendaraan : 'Belum Ditentukan';

        if (el) el.innerHTML = `
        <div class="req-detail-wrap">
            <div class="req-detail-status-banner" style="background:${statusBg};border-color:${statusColor};">
                <div class="req-detail-status-dot" style="background:${statusColor};"></div>
                <span style="font-weight:700;color:${statusColor};font-size:14px;">${statusLabel}</span>
                <span style="margin-left:auto;font-size:12px;color:#64748b;">${req.id || ''}</span>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Informasi Pegawai</div>
                <div class="req-detail-grid-2">
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.user}</div>
                        <div>
                            <div class="req-detail-field-label">Nama Pegawai</div>
                            <div class="req-detail-field-value">${req.nama_pegawai || '-'}</div>
                        </div>
                    </div>
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#f0fdf4;color:#10b981;">${ICONS.building}</div>
                        <div>
                            <div class="req-detail-field-label">Unit Eselon</div>
                            <div class="req-detail-field-value">${req.unit_eselon || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Jadwal Penggunaan</div>
                <div class="req-detail-grid-3">
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#fefce8;color:#ca8a04;">${ICONS.calendar}</div>
                        <div>
                            <div class="req-detail-field-label">Tanggal</div>
                            <div class="req-detail-field-value">${normalizeDisplayDate(req.tanggal_penggunaan)}</div>
                        </div>
                    </div>
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#fdf4ff;color:#a855f7;">${ICONS.clock}</div>
                        <div>
                            <div class="req-detail-field-label">Waktu Berangkat</div>
                            <div class="req-detail-field-value">${formatTime(req.waktu_penjemputan)}</div>
                        </div>
                    </div>
                    <div class="req-detail-field">
                        <div class="req-detail-field-icon" style="background:#fff7ed;color:#f97316;">${ICONS.clock}</div>
                        <div>
                            <div class="req-detail-field-label">Waktu Kembali</div>
                            <div class="req-detail-field-value">${formatTime(req.waktu_pengembalian)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Kendaraan</div>
                <div class="req-detail-vehicle-box" style="border-color:${kendaraan !== 'Belum Ditentukan' ? '#10b981' : '#e2e8f0'};background:${kendaraan !== 'Belum Ditentukan' ? '#f0fdf4' : '#f8fafc'};">
                    ${ICONS.car}
                    <span style="font-family:monospace;font-size:16px;font-weight:700;color:${kendaraan !== 'Belum Ditentukan' ? '#065f46' : '#94a3b8'};">${kendaraan}</span>
                </div>
            </div>

            <div class="req-detail-section">
                <div class="req-detail-section-title">Detail Keperluan</div>
                <div class="req-detail-field req-detail-field-block">
                    <div class="req-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.fileText}</div>
                    <div style="flex:1;">
                        <div class="req-detail-field-label">Keperluan / Tujuan</div>
                        <div class="req-detail-field-value">${req.tujuan || req.keterangan || '-'}</div>
                    </div>
                </div>
                <div class="req-detail-field req-detail-field-block" style="margin-top:12px;">
                    <div class="req-detail-field-icon" style="background:#fff1f2;color:#e11d48;">${ICONS.mapPin}</div>
                    <div style="flex:1;">
                        <div class="req-detail-field-label">Alamat Tujuan</div>
                        <div class="req-detail-field-value">${req.alamat || '-'}</div>
                    </div>
                </div>
            </div>
        </div>`;
        openModal('req-detailModal');
    };

    // ── Smart Vehicle Availability ────────────────────────────
    const ALL_VEHICLES = ['AB 1027 AV', 'AB 1869 UA', 'AB 1147 UH', 'AB 1340 UH', 'AB 1530 UH', 'AB 1067 IA'];

    // Konversi waktu "HH:MM" ke menit sejak tengah malam
    function timeToMinutes(t) {
        if (!t || t === '-') return -1;
        const s = String(t).trim();
        const parts = s.split(':');
        if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        return -1;
    }

    // Cek apakah dua slot waktu pada tanggal yang sama bentrok
    // Grace period: 30 menit setelah waktu_pengembalian existing
    function isTimeConflict(existStart, existEnd, newStart, newEnd) {
        const es = timeToMinutes(existStart);
        const ee = timeToMinutes(existEnd);
        const ns = timeToMinutes(newStart);
        const ne = timeToMinutes(newEnd);
        if (es < 0 || ee < 0 || ns < 0 || ne < 0) return false;
        // Kendaraan tersedia 30 menit setelah existing selesai
        const freeAt = ee + 30;
        // Konflik jika new mulai sebelum kendaraan bebas DAN new selesai setelah existing mulai
        return ns < freeAt && ne > es;
    }

    // Normalisasi tanggal ke format YYYY-MM-DD untuk perbandingan
    function normalizeDateForCompare(val) {
        if (!val) return '';
        const s = normalizeDisplayDate(val); // → D-M-YYYY
        const parts = s.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return '';
    }

    // Dapatkan status ketersediaan semua kendaraan untuk request tertentu
    function getVehicleAvailability(targetReqId) {
        const targetReq = masterRequests.find(r => String(r.id) === String(targetReqId));
        if (!targetReq) return ALL_VEHICLES.map(v => ({ plate: v, available: true, conflict: null }));

        const targetDate = normalizeDateForCompare(targetReq.tanggal_penggunaan);
        const targetStart = formatTime(targetReq.waktu_penjemputan);
        const targetEnd = formatTime(targetReq.waktu_pengembalian);

        return ALL_VEHICLES.map(plate => {
            // Cari semua pengajuan APPROVED yang menggunakan kendaraan ini pada tanggal sama
            // (kecuali request itu sendiri)
            const conflicts = masterRequests.filter(r => {
                if (String(r.id) === String(targetReqId)) return false;
                if ((r.nomorKendaraan || '') !== plate) return false;
                const rStatus = (r.status || '').toLowerCase();
                // Hanya cek yang statusnya approved
                if (rStatus !== 'approved') return false;
                const rDate = normalizeDateForCompare(r.tanggal_penggunaan);
                if (rDate !== targetDate) return false;
                return isTimeConflict(
                    formatTime(r.waktu_penjemputan),
                    formatTime(r.waktu_pengembalian),
                    targetStart, targetEnd
                );
            });

            if (conflicts.length === 0) {
                return { plate, available: true, conflict: null };
            }

            // Ada konflik — tampilkan info
            const c = conflicts[0];
            const freeAt = timeToMinutes(formatTime(c.waktu_pengembalian)) + 30;
            const freeHH = Math.floor(freeAt / 60).toString().padStart(2, '0');
            const freeMM = (freeAt % 60).toString().padStart(2, '0');
            return {
                plate,
                available: false,
                conflict: {
                    nama: c.nama_pegawai || '-',
                    unit: c.unit_eselon || '-',
                    start: formatTime(c.waktu_penjemputan),
                    end: formatTime(c.waktu_pengembalian),
                    freeAt: `${freeHH}:${freeMM}`
                }
            };
        });
    }

    window.reqOpenApprove = (id) => {
        currentApproveId = id;
        const req = masterRequests.find(r => String(r.id) === String(id));

        // Tampilkan info request di modal
        const infoEl = document.getElementById('req-approve-req-info');
        if (infoEl && req) {
            infoEl.innerHTML = `
                <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:13px;">
                    <div style="flex:1;min-width:140px;">
                        <div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Pemohon</div>
                        <div style="font-weight:600;color:#1e293b;">${req.nama_pegawai || '-'}</div>
                        <div style="color:#64748b;font-size:12px;">${req.unit_eselon || '-'}</div>
                    </div>
                    <div style="flex:1;min-width:140px;">
                        <div style="color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px;">Jadwal</div>
                        <div style="font-weight:600;color:#1e293b;">${normalizeDisplayDate(req.tanggal_penggunaan)}</div>
                        <div style="color:#64748b;font-size:12px;">${formatTime(req.waktu_penjemputan)} – ${formatTime(req.waktu_pengembalian)}</div>
                    </div>
                </div>`;
        }

        // Build smart vehicle options
        const availability = getVehicleAvailability(id);
        const listEl = document.getElementById('req-vehicle-smart-list');
        if (listEl) {
            listEl.innerHTML = availability.map(v => {
                if (v.available) {
                    return `<div class="req-veh-item req-veh-available" onclick="reqSelectVehicle('${v.plate}', this)">
                        <div class="req-veh-plate">${v.plate}</div>
                        <div class="req-veh-status req-veh-status-ok">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Tersedia
                        </div>
                    </div>`;
                } else {
                    const c = v.conflict;
                    return `<div class="req-veh-item req-veh-busy" title="Digunakan: ${c.nama} (${c.start}–${c.end}), bebas pukul ${c.freeAt}">
                        <div>
                            <div class="req-veh-plate" style="color:#94a3b8;">${v.plate}</div>
                            <div style="font-size:11px;color:#64748b;margin-top:2px;">Dipakai: <strong>${c.nama}</strong> · ${c.start}–${c.end}</div>
                            <div style="font-size:11px;color:#f97316;margin-top:1px;">⏱ Bebas mulai pukul ${c.freeAt}</div>
                        </div>
                        <div class="req-veh-status req-veh-status-busy">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Tidak Tersedia
                        </div>
                    </div>`;
                }
            }).join('');
        }

        // Reset selected
        document.getElementById('req-vehicle-hidden').value = '';
        const selDisplay = document.getElementById('req-vehicle-selected-display');
        if (selDisplay) selDisplay.style.display = 'none';

        openModal('req-approveModal');
    };

    window.reqSelectVehicle = (plate, el) => {
        document.querySelectorAll('.req-veh-item.req-veh-available').forEach(i => i.classList.remove('req-veh-selected'));
        el.classList.add('req-veh-selected');
        document.getElementById('req-vehicle-hidden').value = plate;
        const disp = document.getElementById('req-vehicle-selected-display');
        if (disp) {
            disp.style.display = 'flex';
            disp.querySelector('.req-veh-chosen-plate').textContent = plate;
        }
    };

    window.reqConfirmApprove = async () => {
        const v = document.getElementById('req-vehicle-hidden')?.value;
        if (!v) { if (window.showToast) showToast('Pilih nomor kendaraan terlebih dahulu', 'error'); return; }
        const btn = document.getElementById('req-confirm-approve-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyetujui...';
        try {
            const res = await callAPI({ action: 'updateRequest', id: currentApproveId, status: 'approved', nomorKendaraan: v });
            if (res.success) { if (window.showToast) showToast('Pengajuan disetujui: ' + v, 'success'); closeModal('req-approveModal'); clearCache(); await loadRequests(true); }
            else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    // FIX: reject dengan loading/buffering seperti delete
    window.reqQuickReject = (id, btnEl) => {
        showConfirmModal({
            icon: '❌',
            title: 'Tolak Pengajuan?',
            message: 'Pengajuan ini akan ditolak dan pemohon tidak dapat menggunakan kendaraan.',
            confirmText: 'Ya, Tolak',
            confirmClass: 'btn-warning',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await callAPI({ action: 'updateRequest', id, status: 'rejected' });
                if (res.success) { if (window.showToast) showToast('Pengajuan ditolak', 'success'); clearCache(); await loadRequests(true); }
                else {
                    if (window.showToast) showToast(res.message || 'Gagal', 'error');
                    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
                }
            } catch (e) {
                if (window.showToast) showToast('Gagal: ' + e.message, 'error');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
            }
        });
    };

    // FIX: Full edit — semua field bisa diedit
    window.reqOpenEdit = (id) => {
        const req = masterRequests.find(r => String(r.id) === String(id)); if (!req) return;
        document.getElementById('req-edit-id').value = id;
        document.getElementById('req-edit-nama').value = req.nama_pegawai || '';
        document.getElementById('req-edit-unit').value = req.unit_eselon || '';
        document.getElementById('req-edit-tanggal').value = storageToInputDate(req.tanggal_penggunaan);
        document.getElementById('req-edit-waktu-penjemputan').value = formatTime(req.waktu_penjemputan) === '-' ? '' : formatTime(req.waktu_penjemputan);
        document.getElementById('req-edit-waktu-pengembalian').value = formatTime(req.waktu_pengembalian) === '-' ? '' : formatTime(req.waktu_pengembalian);
        document.getElementById('req-edit-tujuan').value = req.tujuan || req.keterangan || '';
        document.getElementById('req-edit-alamat').value = req.alamat || '';
        document.getElementById('req-edit-nomor-kendaraan').value = req.nomorKendaraan || '';
        document.getElementById('req-edit-status').value = (req.status || 'pending').toLowerCase();
        openModal('req-editModal');
    };

    window.reqSubmitEdit = async () => {
        const btn = document.getElementById('req-submit-edit-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        const tanggalInput = document.getElementById('req-edit-tanggal').value;
        try {
            const res = await callAPI({
                action: 'updateRequest',
                id: document.getElementById('req-edit-id').value,
                nama_pegawai: document.getElementById('req-edit-nama').value,
                unit_eselon: document.getElementById('req-edit-unit').value,
                tanggal_penggunaan: tanggalInput ? inputDateToStorage(tanggalInput) : '',
                waktu_penjemputan: document.getElementById('req-edit-waktu-penjemputan').value,
                waktu_pengembalian: document.getElementById('req-edit-waktu-pengembalian').value,
                tujuan: document.getElementById('req-edit-tujuan').value,
                alamat: document.getElementById('req-edit-alamat').value,
                nomorKendaraan: document.getElementById('req-edit-nomor-kendaraan').value,
                status: document.getElementById('req-edit-status').value,
            });
            if (res.success) { if (window.showToast) showToast('Data berhasil diperbarui!', 'success'); closeModal('req-editModal'); clearCache(); await loadRequests(true); }
            else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Error: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    window.reqDeleteRequest = (id, btnEl) => {
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Pengajuan?',
            message: 'Pengajuan ini akan dihapus permanen. <span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>',
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const res = await callAPI({ action: 'deleteRequest', id });
                if (res.success) { if (window.showToast) showToast('Pengajuan berhasil dihapus', 'success'); clearCache(); await loadRequests(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal menghapus', 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
            } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
        });
    };

    // ═══ TAB 2: VIOLATIONS ═══════════════════════════════════
    async function loadViolations(forceRefresh = false) {
        setCurrentMonth('req-filter-bulan');
        if (!forceRefresh) {
            const cached = getFromCache(CACHE_KEYS.VIOLATIONS);
            if (cached) {
                // FIX: sort newest first
                masterViolations = sortViolationsNewestFirst(cached);
                window.reqFilterViolations(); showCacheIndicator(); return;
            }
        }
        const tbody = document.getElementById('req-violations-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div><p style="margin-top:12px;color:#64748b;">Memuat data...</p></td></tr>';
        try {
            const res = await callAPI({ action: 'getVehicleViolations' });
            const rawData = Array.isArray(res) ? res : [];
            saveToCache(CACHE_KEYS.VIOLATIONS, rawData);
            // FIX: sort newest first
            masterViolations = sortViolationsNewestFirst(rawData);
            window.reqFilterViolations();
        } catch (e) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">Gagal memuat data. <button onclick="reqLoadViolations(true)" class="btn btn-sm" style="margin-left:8px;">Coba Lagi</button></td></tr>`;
            if (window.showToast) showToast('Gagal memuat data pelanggaran', 'error');
        }
    }
    window.reqLoadViolations = (f) => loadViolations(f);

    // Sort violations: gunakan rowIdx dari ID (posisi baris di sheet = urutan input)
    // ID format: "KUNCI|BULAN|UNIT|rowIdx1based"
    function getViolRowIdx(v) {
        if (v.id && v.id.includes('|')) {
            const parts = v.id.split('|');
            const n = parseInt(parts[parts.length - 1]);
            if (!isNaN(n)) return n;
        }
        return 0;
    }
    function sortViolationsNewestFirst(arr) {
        return arr.slice().sort((a, b) => {
            const rowDiff = getViolRowIdx(b) - getViolRowIdx(a);
            if (rowDiff !== 0) return rowDiff;

            const idDiff = getIdOrderValue(b.id) - getIdOrderValue(a.id);
            if (idDiff !== 0) return idDiff;

            const ida = String(a.id || '');
            const idb = String(b.id || '');
            if (idb > ida) return 1;
            if (idb < ida) return -1;
            return 0;
        });
    }

    window.reqFilterViolations = () => {
        const b = document.getElementById('req-filter-bulan')?.value || '';
        const u = document.getElementById('req-filter-unit')?.value || '';
        const j = document.getElementById('req-filter-jenis')?.value || '';
        allViolations = masterViolations.filter(v =>
            (b === '' || v.bulan === b) && (u === '' || v.unit === u) && (j === '' || v.jenis === j));
        violationsCurrentPage = 1;
        renderPaginatedViolations();
    };

    function resolveViol(safeId) {
        try {
            const key = JSON.parse(decodeURIComponent(safeId));
            return allViolations.find(v => v.bulan === key.bulan && v.unit === key.unit && v.jenis === key.jenis && v.tanggal === key.tanggal)
                || masterViolations.find(v => v.bulan === key.bulan && v.unit === key.unit && v.jenis === key.jenis && v.tanggal === key.tanggal)
                || null;
        } catch (e) { return null; }
    }

    function renderPaginatedViolations() {
        const tbody = document.getElementById('req-violations-tbody');
        const cards = document.getElementById('req-violations-cards');
        const pgn = document.getElementById('req-violations-pagination');
        if (!tbody) return;
        if (allViolations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#94a3b8;">Tidak ada catatan pelanggaran</td></tr>';
            if (cards) cards.innerHTML = '<div style="text-align:center;padding:2rem;color:#64748b;">Data tidak ditemukan</div>';
            if (pgn) pgn.innerHTML = ''; return;
        }
        const totalPages = Math.ceil(allViolations.length / itemsPerPage);
        const start = (violationsCurrentPage - 1) * itemsPerPage;
        const items = allViolations.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map(v => {
            const safeId = encodeURIComponent(JSON.stringify({ id: v.id || '', bulan: v.bulan, unit: v.unit, jenis: v.jenis, tanggal: v.tanggal }));
            return `<tr>
                <td>${v.bulan || '—'}</td>
                <td>${v.unit || '—'}</td>
                <td>${normalizeDisplayDate(v.tanggal)}</td>
                <td><span style="font-size:12px;background:#f1f5f9;padding:2px 8px;border-radius:12px;">${v.jenis || '—'}</span></td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v.laporan || ''}">${v.laporan || '—'}</td>
                <td><div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="reqOpenEditViol('${safeId}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                    <button onclick="reqDeleteViol('${safeId}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                </div></div></td>
            </tr>`;
        }).join('');

        if (cards) cards.innerHTML = items.map(v => {
            const safeId = encodeURIComponent(JSON.stringify({ id: v.id || '', bulan: v.bulan, unit: v.unit, jenis: v.jenis, tanggal: v.tanggal }));
            return `<div class="violation-card">
                <div class="violation-card-header">
                    <div>
                        <div class="violation-card-title">${v.unit || '—'}</div>
                        <div class="violation-card-subtitle">Bulan ${v.bulan || '—'}</div>
                    </div>
                </div>
                <div class="violation-card-body">
                    <div class="violation-card-item"><div class="violation-card-label">Tanggal</div><div class="violation-card-value">${normalizeDisplayDate(v.tanggal)}</div></div>
                    <div class="violation-card-item"><div class="violation-card-label">Jenis</div><div class="violation-card-value">${v.jenis || '—'}</div></div>
                    <div class="violation-card-item" style="grid-column:1/-1"><div class="violation-card-label">Laporan</div><div class="violation-card-value">${v.laporan || '—'}</div></div>
                </div>
                <div class="violation-card-footer">
                    <div class="action-buttons" style="justify-content:flex-end;"><div class="btn-icon-group">
                        <button onclick="reqOpenEditViol('${safeId}')" class="btn-icon btn-icon-edit" title="Edit">${ICONS.edit}</button>
                        <button onclick="reqDeleteViol('${safeId}', this)" class="btn-icon btn-icon-delete" title="Hapus">${ICONS.trash}</button>
                    </div></div>
                </div>
            </div>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="reqChangeViolPage(${violationsCurrentPage - 1})" ${violationsCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${violationsCurrentPage} dari ${totalPages} (${allViolations.length} data)</span>
            <button onclick="reqChangeViolPage(${violationsCurrentPage + 1})" ${violationsCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }
    window.reqChangeViolPage = (page) => { const t = Math.ceil(allViolations.length / itemsPerPage); if (page < 1 || page > t) return; violationsCurrentPage = page; renderPaginatedViolations(); };

    // ── Tambah Violation ──────────────────────────────────────
    window.reqOpenAddViol = () => {
        selectedApprovedReq = null;
        ['req-viol-tanggal', 'req-viol-laporan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const selBulan = document.getElementById('req-viol-bulan'); if (selBulan) selBulan.value = '';
        const selUnit = document.getElementById('req-viol-unit'); if (selUnit) selUnit.value = '';
        const selJenis = document.getElementById('req-viol-jenis'); if (selJenis) selJenis.value = '';
        const srch = document.getElementById('req-approved-search'); if (srch) srch.value = '';
        const info = document.getElementById('req-selected-req-info'); if (info) info.style.display = 'none';
        if (!masterRequests.length) loadRequests().then(() => renderApprovedReqList());
        else renderApprovedReqList();
        reqSetViolSource('approved');
        openModal('req-addViolModal');
    };

    window.reqSetViolSource = (src) => {
        violSource = src;
        document.getElementById('req-vsrc-approved').style.display = src === 'approved' ? 'block' : 'none';
        document.getElementById('req-vsrc-manual').style.display = src === 'manual' ? 'block' : 'none';
        document.getElementById('req-vsrc-btn-approved').className = `btn btn-sm ${src === 'approved' ? 'btn-primary' : ''}`;
        document.getElementById('req-vsrc-btn-manual').className = `btn btn-sm ${src === 'manual' ? 'btn-primary' : ''}`;
        if (src === 'approved') renderApprovedReqList();
    };

    // FIX: Dropdown approved requests diurutkan newest first
    function renderApprovedReqList(filter = '') {
        const list = document.getElementById('req-approved-req-list'); if (!list) return;
        const approved = masterRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED');
        // Already sorted newest first since masterRequests is sorted
        const filtered = filter
            ? approved.filter(r => `${r.nama_pegawai} ${r.unit_eselon} ${r.nomorKendaraan || ''}`.toLowerCase().includes(filter.toLowerCase()))
            : approved;
        if (!filtered.length) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">Tidak ada pengajuan yang disetujui</div>';
            return;
        }
        list.innerHTML = filtered.map(r => `
            <div class="req-pick-item ${selectedApprovedReq?.id === r.id ? 'selected' : ''}" onclick="reqSelectApprovedReq('${r.id}')">
                <div class="req-pick-check">${selectedApprovedReq?.id === r.id ? '✓' : ''}</div>
                <div style="flex:1;min-width:0;">
                    <div class="req-pick-name">${r.nama_pegawai || '-'}</div>
                    <div class="req-pick-meta">${r.unit_eselon || '-'} · <span style="font-family:monospace;font-size:12px;background:#f1f5f9;padding:1px 6px;border-radius:3px;">${r.nomorKendaraan || '-'}</span></div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${normalizeDisplayDate(r.tanggal_penggunaan)} · ${formatTime(r.waktu_penjemputan)}–${formatTime(r.waktu_pengembalian)}</div>
                </div>
            </div>`).join('');
    }

    window.reqFilterApprovedReqs = () => {
        renderApprovedReqList(document.getElementById('req-approved-search')?.value || '');
    };

    window.reqSelectApprovedReq = (id) => {
        selectedApprovedReq = masterRequests.find(r => String(r.id) === String(id));
        renderApprovedReqList(document.getElementById('req-approved-search')?.value || '');
        const info = document.getElementById('req-selected-req-info');
        const detail = document.getElementById('req-selected-req-detail');
        if (selectedApprovedReq && info && detail) {
            info.style.display = 'block';
            detail.innerHTML = `<strong>${selectedApprovedReq.nama_pegawai}</strong> — ${selectedApprovedReq.unit_eselon} — <span style="font-family:monospace;font-size:12px;background:#f1f5f9;padding:2px 6px;border-radius:3px;">${selectedApprovedReq.nomorKendaraan || '-'}</span>`;
            const tglInput = document.getElementById('req-viol-tanggal');
            if (tglInput) tglInput.value = storageToInputDate(selectedApprovedReq.tanggal_penggunaan);
            const unitSel = document.getElementById('req-vsrc-unit-auto');
            if (unitSel) unitSel.textContent = selectedApprovedReq.unit_eselon || '-';
        }
    };

    window.reqSubmitViol = async () => {
        const btn = document.getElementById('req-submit-viol-btn'), orig = btn.innerHTML;
        const tglInput = document.getElementById('req-viol-tanggal')?.value || '';
        const laporan = document.getElementById('req-viol-laporan')?.value.trim() || '';
        const jenisEl = document.getElementById('req-viol-jenis');

        if (!jenisEl?.value) { if (window.showToast) showToast('Jenis pelanggaran harus dipilih', 'error'); return; }
        if (!tglInput) { if (window.showToast) showToast('Tanggal harus diisi', 'error'); return; }
        if (!laporan) { if (window.showToast) showToast('Laporan harus diisi', 'error'); return; }

        let bulan, unit;
        if (violSource === 'approved') {
            if (!selectedApprovedReq) { if (window.showToast) showToast('Pilih pengajuan yang disetujui', 'error'); return; }
            unit = selectedApprovedReq.unit_eselon;
            bulan = MONTHS_ID[new Date(tglInput).getMonth() + 1];
        } else {
            bulan = document.getElementById('req-viol-bulan')?.value || '';
            unit = document.getElementById('req-viol-unit')?.value || '';
            if (!bulan || !unit) { if (window.showToast) showToast('Bulan dan unit harus diisi', 'error'); return; }
        }

        const tanggalStorage = inputDateToStorage(tglInput);

        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const res = await callAPI({
                action: 'createVehicleViolation',
                jenis: jenisEl.value,
                bulan, unit,
                tanggal: tanggalStorage,
                laporan
            });
            if (res.success) {
                if (window.showToast) showToast('Catatan pelanggaran berhasil ditambahkan!', 'success');
                closeModal('req-addViolModal'); clearCache(); await loadViolations(true); await loadScores(true);
            } else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Gagal: ' + e, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    // ── Edit Violation ────────────────────────────────────────
    window.reqOpenEditViol = (safeId) => {
        const v = resolveViol(safeId);
        if (!v) { if (window.showToast) showToast('Data tidak ditemukan', 'error'); return; }
        currentEditViol = v;

        document.getElementById('req-ev-bulan').value = v.bulan || '';
        document.getElementById('req-ev-unit').value = v.unit || '';
        const jenisKode = (v.jenis === 'Kealpaan Membersihkan Mobil') ? 'KEBERSIHAN' : 'KUNCI';
        document.getElementById('req-ev-jenis').value = jenisKode;
        document.getElementById('req-ev-tanggal').value = storageToInputDate(v.tanggal || '');
        document.getElementById('req-ev-laporan').value = v.laporan || '';
        document.getElementById('req-ev-id').value = v.id || '';
        openModal('req-editViolModal');
    };

    window.reqSubmitEditViol = async () => {
        if (!currentEditViol) { if (window.showToast) showToast('Tidak ada data yang diedit', 'error'); return; }
        const bulanBaru = document.getElementById('req-ev-bulan')?.value || '';
        const unitBaru = document.getElementById('req-ev-unit')?.value || '';
        const jenisBaru = document.getElementById('req-ev-jenis')?.value || '';
        const tanggalInput = document.getElementById('req-ev-tanggal')?.value.trim() || '';
        const laporan = document.getElementById('req-ev-laporan')?.value.trim() || '';

        if (!bulanBaru || !unitBaru || !jenisBaru) { if (window.showToast) showToast('Bulan, unit, dan jenis harus diisi', 'error'); return; }
        if (!tanggalInput) { if (window.showToast) showToast('Tanggal harus diisi', 'error'); return; }
        if (!laporan) { if (window.showToast) showToast('Laporan harus diisi', 'error'); return; }

        const btn = document.getElementById('req-submit-ev-btn'), orig = btn.innerHTML;
        btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';
        try {
            const tanggalStorage = inputDateToStorage(tanggalInput);
            const jenisLamaKode = (currentEditViol.jenis === 'Kealpaan Membersihkan Mobil') ? 'KEBERSIHAN' : 'KUNCI';
            const pindah = (bulanBaru !== currentEditViol.bulan) || (unitBaru !== currentEditViol.unit) || (jenisBaru !== jenisLamaKode);

            const res = await callAPI({
                action: 'updateVehicleViolation',
                id: currentEditViol.id || '',
                jenis: jenisLamaKode,
                bulan: currentEditViol.bulan,
                unit: currentEditViol.unit,
                tanggal_lama: currentEditViol.tanggal,
                jenis_baru: jenisBaru,
                bulan_baru: bulanBaru,
                unit_baru: unitBaru,
                tanggal: tanggalStorage,
                laporan,
                pindah: pindah ? '1' : '0'
            });
            if (res.success) {
                if (window.showToast) showToast('Catatan berhasil diperbarui!', 'success');
                closeModal('req-editViolModal'); currentEditViol = null; clearCache();
                await loadViolations(true); await loadScores(true);
            } else if (window.showToast) showToast(res.message || 'Gagal', 'error');
        } catch (e) { if (window.showToast) showToast('Error: ' + e.message, 'error'); }
        finally { btn.disabled = false; btn.innerHTML = orig; }
    };

    window.reqDeleteViol = (safeId, btnEl) => {
        const v = resolveViol(safeId);
        if (!v) { if (window.showToast) showToast('Data tidak ditemukan', 'error'); return; }
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Catatan Pelanggaran?',
            message: `Unit: <strong>${v.unit}</strong><br>Bulan: <strong>${v.bulan}</strong><br>Tanggal: <strong>${normalizeDisplayDate(v.tanggal)}</strong><br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            const jenisKode = (v.jenis === 'Kealpaan Membersihkan Mobil') ? 'KEBERSIHAN' : 'KUNCI';
            try {
                const res = await callAPI({ action: 'deleteVehicleViolation', id: v.id || '', jenis: jenisKode, bulan: v.bulan, unit: v.unit, tanggal: v.tanggal });
                if (res.success) { if (window.showToast) showToast('Catatan berhasil dihapus', 'success'); clearCache(); await loadViolations(true); await loadScores(true); }
                else { if (window.showToast) showToast(res.message || 'Gagal', 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
            } catch (e) { if (window.showToast) showToast('Gagal: ' + e.message, 'error'); if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; } }
        });
    };

    window.reqExportViol = () => {
        const b = document.getElementById('req-filter-bulan')?.value || '';
        const u = document.getElementById('req-filter-unit')?.value || '';
        const j = document.getElementById('req-filter-jenis')?.value || '';
        showConfirmModal({
            icon: '📤',
            title: 'Export Catatan Pelanggaran?',
            message: 'Data catatan pelanggaran akan diexport ke sheet baru di spreadsheet.',
            confirmText: 'Ya, Export',
            confirmClass: 'btn-primary',
        }, async () => {
            if (window.showToast) showToast('Mengekspor data...', 'success');
            let jenisParam = '';
            if (j === 'Kealpaan Pengembalian Kunci') jenisParam = 'KUNCI';
            else if (j === 'Kealpaan Membersihkan Mobil') jenisParam = 'KEBERSIHAN';
            try {
                const res = await callAPI({ action: 'exportVehicleViolationsReport', bulan: b, unit: u, jenis: jenisParam });
                if (res.success) {
                    if (window.showToast) showToast(`Berhasil export ${res.recordCount} catatan!`, 'success');
                    if (res.url) {
                        showConfirmModal({
                            icon: '🔗',
                            title: 'Export Berhasil!',
                            message: 'Spreadsheet berhasil dibuat. Buka sekarang?',
                            confirmText: 'Buka Spreadsheet',
                            confirmClass: 'btn-primary',
                        }, () => window.open(res.url, '_blank'));
                    }
                } else if (window.showToast) showToast(res.message || 'Gagal', 'error');
            } catch (e) { if (window.showToast) showToast('Gagal export: ' + e, 'error'); }
        });
    };

    // ═══ TAB 3: SCORES ═══════════════════════════════════════
    async function loadScores(forceRefresh = false) {
        try {
            let bulan = document.getElementById('req-filter-score-bulan')?.value || '';
            const mode = document.getElementById('req-score-mode')?.value || 'KUNCI';
            if (!bulan) {
                bulan = MONTHS_ID[new Date().getMonth() + 1];
                const el = document.getElementById('req-filter-score-bulan'); if (el) el.value = bulan;
            }
            const ck = `${CACHE_KEYS.SCORES}_${bulan}_${mode}`;
            if (!forceRefresh && bulan) { const cached = getFromCache(ck); if (cached) { allScores = cached; renderScores(); showCacheIndicator(); return; } }
            const container = document.getElementById('req-scores-container');
            if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div><p style="margin-top:12px;">Memuat penilaian...</p></div>';
            const data = await callAPI({ action: 'getVehicleScores', bulan, jenis: mode });
            if (data.success) {
                allScores = { sanksi: data.sanksiPerPelanggaran, scores: data.scores };
                const sv = document.getElementById('req-sanksi-value'); if (sv) sv.textContent = `${data.sanksiPerPelanggaran} poin`;
                if (bulan) saveToCache(ck, allScores);
                renderScores();
            } else {
                if (container) container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p style="color:#ef4444;">Gagal memuat penilaian</p></div>';
            }
        } catch (e) {
            const container = document.getElementById('req-scores-container');
            if (container) container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><p style="color:#ef4444;">${e.message}</p></div>`;
        }
    }
    window.reqLoadScores = (f) => loadScores(f);

    function renderScores() {
        const bulan = document.getElementById('req-filter-score-bulan')?.value || '';
        const mode = document.getElementById('req-score-mode')?.value || 'KUNCI';
        const container = document.getElementById('req-scores-container'); if (!container) return;
        if (!bulan) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📊</div><p>Pilih bulan untuk melihat penilaian</p></div>'; if (scoreChart) scoreChart.destroy(); if (violationChart) violationChart.destroy(); return; }
        if (!allScores.scores) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><p style="color:#ef4444;">Data tidak tersedia</p></div>'; return; }
        const monthScores = allScores.scores.filter(s => s.bulan === bulan);
        if (!monthScores.length) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Tidak ada data untuk bulan ini</p></div>'; if (scoreChart) scoreChart.destroy(); if (violationChart) violationChart.destroy(); return; }
        renderCharts(monthScores, mode);
        const modeLabel = mode === 'KUNCI' ? 'Kealpaan Pengembalian Kunci' : 'Kealpaan Membersihkan Mobil';
        container.innerHTML = `<div style="margin-bottom:16px;padding:12px 16px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;border-left:3px solid #0f172a;">
            <p style="font-size:13px;font-weight:600;color:#1e293b;">Mode Penilaian: ${modeLabel}</p>
        </div>` + '<div class="scores-grid">' + monthScores.map(score => {
            const s = parseFloat(score.skorAkhir) || 0;
            const cls = s >= 4.5 ? 'score-good' : s >= 3 ? 'score-warning' : 'score-danger';
            return `<div class="score-card">
                <div class="score-header">
                    <div><div class="score-unit-name">${score.unit}</div><div class="score-month">Bulan ${score.bulan}</div></div>
                    <div class="score-value ${cls}">${s.toFixed(2)}</div>
                </div>
                <div class="score-details">
                    <div class="score-detail-item"><div class="score-detail-label">Skor Utuh</div><div class="score-detail-value">${parseFloat(score.skorUtuh || 0).toFixed(1)}</div></div>
                    <div class="score-detail-item"><div class="score-detail-label">Pelanggaran</div><div class="score-detail-value">${score.jumlahPelanggaran || 0}</div></div>
                    <div class="score-detail-item"><div class="score-detail-label">Sanksi</div><div class="score-detail-value" style="color:#ef4444;">-${parseFloat(score.jumlahSanksi || 0).toFixed(2)}</div></div>
                </div>
            </div>`;
        }).join('') + '</div>';
    }

    function renderCharts(monthScores, mode) {
        const units = monthScores.map(s => s.unit.length > 25 ? s.unit.substring(0, 22) + '...' : s.unit);
        const scores = monthScores.map(s => parseFloat(s.skorAkhir) || 0);
        const violations = monthScores.map(s => parseInt(s.jumlahPelanggaran) || 0);
        const modeLabel = mode === 'KUNCI' ? 'Pengembalian Kunci' : 'Membersihkan Mobil';
        const scCtx = document.getElementById('req-scoreChart'); if (!scCtx) return;
        const vlCtx = document.getElementById('req-violationChart'); if (!vlCtx) return;
        if (scoreChart) scoreChart.destroy();
        scoreChart = new Chart(scCtx.getContext('2d'), {
            type: 'bar', data: { labels: units, datasets: [{ label: 'Skor Akhir', data: scores, backgroundColor: scores.map(s => s >= 4.5 ? '#10b981' : s >= 3 ? '#f59e0b' : '#ef4444'), borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: `Mode: ${modeLabel}`, font: { size: 12, weight: 'normal' }, color: '#64748b' } }, scales: { y: { beginAtZero: true, max: 10, ticks: { stepSize: 1 } } } }
        });
        if (violationChart) violationChart.destroy();
        violationChart = new Chart(vlCtx.getContext('2d'), {
            type: 'bar', data: { labels: units, datasets: [{ label: 'Jumlah Pelanggaran', data: violations, backgroundColor: '#3b82f6', borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: `Mode: ${modeLabel}`, font: { size: 12, weight: 'normal' }, color: '#64748b' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }

    // ═══ Register & Render HTML ══════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['requests'] = function () {
        const section = document.getElementById('section-requests');
        if (!section) return;
        section.innerHTML = `
<style>
.btn-action-approve { background:#f0fdf4; color:#166534; border-color:#bbf7d0; }
.btn-action-approve:hover { background:#dcfce7; border-color:#86efac; }
.btn-action-reject  { background:#fff1f2; color:#9f1239; border-color:#fecdd3; }
.btn-action-reject:hover  { background:#ffe4e6; border-color:#fda4af; }
.btn-action-view    { background:#f8fafc; color:#475569; border-color:#e2e8f0; }
.btn-action-view:hover    { background:#f1f5f9; border-color:#cbd5e1; }
.btn-action-edit    { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
.btn-action-edit:hover    { background:#dbeafe; border-color:#93c5fd; }
.filter-container { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.section-page-header { margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid #f1f5f9; }
.section-page-title { font-size:22px; font-weight:700; color:#0f172a; margin-bottom:4px; }
.section-page-subtitle { font-size:14px; color:#64748b; }
.score-mode-switcher { display:flex; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; background:#f8fafc; }
.score-mode-btn { padding:7px 14px; font-size:13px; font-weight:500; color:#64748b; background:transparent; border:none; cursor:pointer; transition:all 0.15s; white-space:nowrap; border-right:1px solid #e2e8f0; display:flex; align-items:center; gap:5px; }
.score-mode-btn:last-child { border-right:none; }
.score-mode-btn:hover { background:#f1f5f9; }
.score-mode-btn.active { background:#0f172a; color:white; }
/* Status column — selalu rata tengah, tinggi baris konsisten */
#req-requests-tbody tr td:nth-child(6),
#section-requests table thead tr th:nth-child(6) { text-align:center; vertical-align:middle; }
#req-requests-tbody tr { vertical-align:middle; }
/* Approved request picker */
.req-pick-list { max-height:260px; overflow-y:auto; border:1px solid #e5e7eb; border-radius:6px; margin-bottom:12px; }
.req-pick-item { padding:11px 14px; cursor:pointer; border-bottom:1px solid #f1f5f9; display:flex; align-items:flex-start; gap:10px; transition:background 0.12s; }
.req-pick-item:last-child { border-bottom:none; }
.req-pick-item:hover { background:#eff6ff; }
.req-pick-item.selected { background:#d1fae5; }
.req-pick-check { width:18px; height:18px; border-radius:50%; border:2px solid #e5e7eb; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; font-weight:700; margin-top:2px; }
.req-pick-item.selected .req-pick-check { background:#10b981; border-color:#10b981; color:white; }
.req-pick-name { font-weight:600; font-size:13.5px; color:#1e293b; }
.req-pick-meta { font-size:12px; color:#64748b; margin-top:2px; }
.vsrc-toggle { display:flex; gap:8px; margin-bottom:14px; }

/* ── Beautiful Detail Styles ── */
.req-detail-wrap { display:flex; flex-direction:column; gap:20px; }
.req-detail-status-banner { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:10px; border:1.5px solid; }
.req-detail-status-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.req-detail-section { background:#f8fafc; border-radius:10px; padding:16px; border:1px solid #f1f5f9; }
.req-detail-section-title { font-size:11px; text-transform:uppercase; letter-spacing:0.07em; font-weight:700; color:#94a3b8; margin-bottom:14px; }
.req-detail-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.req-detail-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
@media(max-width:480px){
    .req-detail-grid-2 { grid-template-columns:1fr; }
    .req-detail-grid-3 { grid-template-columns:1fr 1fr; }
}
.req-detail-field { display:flex; align-items:flex-start; gap:10px; }
.req-detail-field-block { display:flex; align-items:flex-start; gap:10px; }
.req-detail-field-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.req-detail-field-label { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; }
.req-detail-field-value { font-size:14px; font-weight:600; color:#1e293b; line-height:1.4; }
.req-detail-vehicle-box { display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:10px; border:2px solid; }
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Pelayanan Kendaraan Dinas Operasional</h1>
        <p class="section-page-subtitle">Tinjau permintaan, kelola catatan pelanggaran, dan penilaian penggunaan kendaraan dinas</p>
    </div>

    <div class="tabs">
        <button class="tab active" onclick="reqSwitchTab('requests',event)">Permintaan</button>
        <button class="tab" onclick="reqSwitchTab('violations',event)">Catatan Pelanggaran</button>
        <button class="tab" onclick="reqSwitchTab('scores',event)">Penilaian</button>
    </div>
    <div class="tabs-dropdown">
        <select onchange="reqSwitchTabDD(this.value)">
            <option value="requests">Permintaan</option>
            <option value="violations">Catatan Pelanggaran</option>
            <option value="scores">Penilaian</option>
        </select>
    </div>

    <div id="req-tab-requests" class="tab-content active">
        <div class="stats-grid">
            <div class="stat-card" style="border-left:3px solid #64748b;"><div class="stat-label">Total Permintaan</div><div class="stat-value" id="req-stat-total">0</div></div>
            <div class="stat-card" style="border-left:3px solid #10b981;"><div class="stat-label">Disetujui</div><div class="stat-value" id="req-stat-approved">0</div></div>
            <div class="stat-card" style="border-left:3px solid #f59e0b;"><div class="stat-label">Menunggu</div><div class="stat-value" id="req-stat-pending">0</div></div>
            <div class="stat-card" style="border-left:3px solid #ef4444;"><div class="stat-label">Ditolak</div><div class="stat-value" id="req-stat-rejected">0</div></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Daftar Pengajuan Kendaraan Dinas</h2>
                <div class="filter-container">
                    <select class="select-input" id="req-filter-status" onchange="reqApplyFilter()">
                        <option value="">Semua Status</option>
                        <option value="PENDING">Menunggu</option>
                        <option value="APPROVED">Disetujui</option>
                        <option value="REJECTED">Ditolak</option>
                    </select>
                    <input type="text" class="search-input" placeholder="Cari Nama atau unit/bidang..." id="req-search-input" oninput="reqApplyFilter()">
                    <button onclick="reqLoadRequests(true)" class="btn btn-sm btn-action-view">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Nama</th><th>Unit / Bidang</th><th>Tanggal</th><th>Waktu</th><th>Kendaraan</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody id="req-requests-tbody"><tr><td colspan="7" class="loading"><div class="spinner"></div></td></tr></tbody>
                </table>
            </div>
            <div id="req-requests-cards"></div>
            <div class="pagination" id="req-requests-pagination"></div>
        </div>
    </div>

    <div id="req-tab-violations" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Catatan Pelanggaran Penggunaan Mobil Dinas</h2>
                <div class="filter-container">
                    <select class="select-input" id="req-filter-bulan" onchange="reqFilterViolations()">
                        <option value="">Semua Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option><option value="APRIL">April</option>
                        <option value="MEI">Mei</option><option value="JUNI">Juni</option><option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <select class="select-input" id="req-filter-unit" onchange="reqFilterViolations()">
                        <option value="">Semua Unit</option>
                        <option value="Sekretariat">Sekretariat</option><option value="Bidang Koperasi">Bidang Koperasi</option>
                        <option value="Bidang UKM">Bidang UKM</option><option value="Bidang Usaha Mikro">Bidang Usaha Mikro</option>
                        <option value="Bidang Kewirausahaan">Bidang Kewirausahaan</option>
                        <option value="Balai Layanan Usaha Terpadu KUMKM">BLUT KUMKM</option>
                    </select>
                    <select class="select-input" id="req-filter-jenis" onchange="reqFilterViolations()">
                        <option value="">Semua Jenis</option>
                        <option value="Kealpaan Pengembalian Kunci">Kunci</option>
                        <option value="Kealpaan Membersihkan Mobil">Kebersihan</option>
                    </select>
                    <button onclick="reqOpenAddViol()" class="btn btn-sm btn-action-edit">${ICONS.plus} Tambah</button>
                    <button onclick="reqLoadViolations(true)" class="btn btn-sm btn-action-view">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Bulan</th><th>Unit / Bidang</th><th>Tanggal</th><th>Jenis</th><th>Laporan</th><th>Aksi</th></tr></thead>
                    <tbody id="req-violations-tbody"><tr><td colspan="6" style="text-align:center;padding:20px;color:#94a3b8;">Memuat data...</td></tr></tbody>
                </table>
            </div>
            <div id="req-violations-cards"></div>
            <div class="pagination" id="req-violations-pagination"></div>
        </div>
    </div>

    <div id="req-tab-scores" class="tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Rekapitulasi Penilaian Kendaraan Dinas</h2>
                <div class="filter-container">
                    <div class="score-mode-switcher">
                        <button class="score-mode-btn active" id="req-mode-btn-kunci" onclick="reqSetScoreMode('KUNCI', this)">${ICONS.car} Pengembalian Kunci</button>
                        <button class="score-mode-btn" id="req-mode-btn-bersih" onclick="reqSetScoreMode('BERSIH', this)">${ICONS.car} Kebersihan Mobil</button>
                    </div>
                    <input type="hidden" id="req-score-mode" value="KUNCI">
                    <select class="select-input" id="req-filter-score-bulan" onchange="reqLoadScores(false)">
                        <option value="">Pilih Bulan</option>
                        <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option><option value="MARET">Maret</option><option value="APRIL">April</option>
                        <option value="MEI">Mei</option><option value="JUNI">Juni</option><option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                        <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option><option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                    </select>
                    <button onclick="reqLoadScores(true)" class="btn btn-sm btn-action-view">${ICONS.refresh} Refresh</button>
                </div>
            </div>
            <div class="card-content">
                <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9;">
                    <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600;margin-bottom:4px;">Sanksi per Pelanggaran</p>
                    <p style="font-size:22px;font-weight:700;color:#0f172a;" id="req-sanksi-value">0.1 poin</p>
                </div>
                <div class="charts-grid">
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:14px;font-weight:600;color:#374151;">Skor Akhir Per Unit</h3></div><div class="card-content"><div class="chart-container"><canvas id="req-scoreChart"></canvas></div></div></div>
                    <div class="card" style="margin:0;"><div class="card-header" style="padding:16px;"><h3 style="font-size:14px;font-weight:600;color:#374151;">Jumlah Pelanggaran Per Unit</h3></div><div class="card-content"><div class="chart-container"><canvas id="req-violationChart"></canvas></div></div></div>
                </div>
                <div id="req-scores-container"><div class="empty-state"><div class="empty-state-icon">📊</div><p>Pilih bulan untuk melihat penilaian</p></div></div>
            </div>
        </div>
    </div>
</div>

<div id="req-detailModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:560px;">
        <div class="modal-header" style="border-bottom:1px solid #f1f5f9;">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">${ICONS.car} Detail Pengajuan Kendaraan Dinas</h2>
        </div>
        <div class="modal-content" id="req-detail-body" style="padding:20px;"></div>
        <div class="modal-footer" style="border-top:1px solid #f1f5f9;">
            <button onclick="document.getElementById('req-detailModal').style.display='none'" class="btn" style="flex:1;">Tutup</button>
        </div>
    </div>
</div>

<div id="req-approveModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:520px;">
        <div class="modal-header">
            <h2 class="modal-title" style="display:flex;align-items:center;gap:8px;">${ICONS.car} Setujui & Pilih Kendaraan</h2>
        </div>
        <div class="modal-content" style="padding:20px;">

            <div style="background:#f8fafc;border:1px solid #f1f5f9;border-radius:10px;padding:14px;margin-bottom:18px;" id="req-approve-req-info"></div>

            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:10px;">
                Pilih Kendaraan
                <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#94a3b8;margin-left:6px;">— kendaraan merah tidak tersedia pada jam tersebut</span>
            </div>
            <div id="req-vehicle-smart-list" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;"></div>

            <div id="req-vehicle-selected-display" style="display:none;align-items:center;gap:10px;margin-top:14px;padding:12px 16px;background:#f0fdf4;border:1.5px solid #10b981;border-radius:10px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span style="font-size:13px;color:#064e3b;">Kendaraan dipilih:</span>
                <span class="req-veh-chosen-plate" style="font-family:monospace;font-weight:700;font-size:15px;color:#065f46;"></span>
            </div>

            <input type="hidden" id="req-vehicle-hidden">
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('req-approveModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="reqConfirmApprove()" class="btn btn-action-approve" style="flex:1;" id="req-confirm-approve-btn">${ICONS.check} Setujui</button>
        </div>
    </div>
</div>

<style>
.req-veh-item { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border:1.5px solid #e2e8f0; border-radius:10px; transition:all 0.15s; gap:12px; }
.req-veh-available { cursor:pointer; background:#fff; }
.req-veh-available:hover { border-color:#3b82f6; background:#eff6ff; }
.req-veh-available.req-veh-selected { border-color:#10b981; background:#f0fdf4; box-shadow:0 0 0 3px #bbf7d044; }
.req-veh-busy { background:#fafafa; cursor:not-allowed; opacity:0.85; }
.req-veh-plate { font-family:monospace; font-weight:700; font-size:15px; color:#1e293b; }
.req-veh-status { display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0; }
.req-veh-status-ok { background:#dcfce7; color:#15803d; }
.req-veh-status-busy { background:#fee2e2; color:#b91c1c; }
</style>

<div id="req-editModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:600px;">
        <div class="modal-header"><h2 class="modal-title">Edit Pengajuan Kendaraan Dinas</h2></div>
        <div class="modal-content">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                    <label class="input-label">Nama <span style="color:#ef4444;">*</span></label>
                    <input type="text" class="form-input" id="req-edit-nama" placeholder="Nama pegawai">
                </div>
                <div class="form-group">
                    <label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="req-edit-unit">${OPT_UNIT}</select>
                </div>
                <div class="form-group">
                    <label class="input-label">Tanggal Penggunaan <span style="color:#ef4444;">*</span></label>
                    <input type="date" class="form-input" id="req-edit-tanggal">
                </div>
                <div class="form-group">
                    <label class="input-label">Nomor Kendaraan</label>
                    <select class="form-input" id="req-edit-nomor-kendaraan">
                        <option value="">Pilih Nomor Kendaraan</option>
                        <option value="AB 1027 AV">AB 1027 AV</option><option value="AB 1869 UA">AB 1869 UA</option>
                        <option value="AB 1147 UH">AB 1147 UH</option><option value="AB 1340 UH">AB 1340 UH</option>
                        <option value="AB 1530 UH">AB 1530 UH</option><option value="AB 1067 IA">AB 1067 IA</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="input-label">Waktu Penjemputan</label>
                    <input type="time" class="form-input" id="req-edit-waktu-penjemputan">
                </div>
                <div class="form-group">
                    <label class="input-label">Waktu Pengembalian</label>
                    <input type="time" class="form-input" id="req-edit-waktu-pengembalian">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Keperluan / Tujuan</label>
                    <input type="text" class="form-input" id="req-edit-tujuan" placeholder="Keperluan atau tujuan">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Alamat Tujuan</label>
                    <input type="text" class="form-input" id="req-edit-alamat" placeholder="Alamat tujuan">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Status Pengajuan</label>
                    <select class="form-input" id="req-edit-status">
                        <option value="pending">Menunggu</option><option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </div>
            <input type="hidden" id="req-edit-id">
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('req-editModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="reqSubmitEdit()" class="btn btn-action-edit" style="flex:1;" id="req-submit-edit-btn">Simpan Perubahan</button>
        </div>
    </div>
</div>

<div id="req-addViolModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal" style="max-width:680px;">
        <div class="modal-header"><h2 class="modal-title">Tambah Catatan Pelanggaran</h2></div>
        <div class="modal-content">
            <div class="vsrc-toggle">
                <button class="btn btn-sm btn-primary" id="req-vsrc-btn-approved" onclick="reqSetViolSource('approved')">${ICONS.check} Dari Pengajuan Disetujui</button>
                <button class="btn btn-sm" id="req-vsrc-btn-manual" onclick="reqSetViolSource('manual')">${ICONS.plus} Input Manual</button>
            </div>
            <div id="req-vsrc-approved">
                <div class="alert alert-info" style="margin-bottom:10px;">Pilih pengajuan yang sudah disetujui sebagai dasar catatan. Data diurutkan dari terbaru.</div>
                <div class="form-group" style="margin-bottom:8px;">
                    <input type="text" class="form-input" id="req-approved-search" placeholder="Cari nama, unit, atau nomor kendaraan..." oninput="reqFilterApprovedReqs()">
                </div>
                <div class="req-pick-list" id="req-approved-req-list">
                    <div style="padding:20px;text-align:center;color:#64748b;font-size:13px;">Memuat data...</div>
                </div>
                <div id="req-selected-req-info" style="display:none;" class="info-box">
                    <p class="info-box-label">Pengajuan Dipilih</p>
                    <div id="req-selected-req-detail" style="font-size:13.5px;"></div>
                </div>
            </div>
            <div id="req-vsrc-manual" style="display:none;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    <div class="form-group">
                        <label class="input-label">Bulan <span style="color:#ef4444;">*</span></label>
                        <select class="form-input" id="req-viol-bulan">${OPT_BULAN}</select>
                    </div>
                    <div class="form-group">
                        <label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label>
                        <select class="form-input" id="req-viol-unit">${OPT_UNIT}</select>
                    </div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Jenis Pelanggaran <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="req-viol-jenis">
                        <option value="">Pilih Jenis</option>
                        <option value="KUNCI">Kealpaan Pengembalian Kunci Mobil</option>
                        <option value="KEBERSIHAN">Kealpaan Membersihkan Mobil</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="input-label">Tanggal Penggunaan <span style="color:#ef4444;">*</span></label>
                    <input type="date" class="form-input" id="req-viol-tanggal">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Laporan <span style="color:#ef4444;">*</span></label>
                    <textarea class="form-textarea" id="req-viol-laporan" placeholder="Deskripsikan pelanggaran..."></textarea>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('req-addViolModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="reqSubmitViol()" class="btn btn-primary" style="flex:1;" id="req-submit-viol-btn">💾 Simpan</button>
        </div>
    </div>
</div>

<div id="req-editViolModal" class="modal-overlay" onclick="if(event.target===this)this.style.display='none'">
    <div class="modal">
        <div class="modal-header"><h2 class="modal-title">Edit Catatan Pelanggaran</h2></div>
        <div class="modal-content">
            <div class="alert alert-info" style="margin-bottom:16px;font-size:13px;">Perubahan bulan, unit, atau jenis akan memindahkan catatan ke sheet/kolom yang sesuai.</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                    <label class="input-label">Bulan <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="req-ev-bulan">${OPT_BULAN}</select>
                </div>
                <div class="form-group">
                    <label class="input-label">Unit / Bidang <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="req-ev-unit">${OPT_UNIT}</select>
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Jenis Pelanggaran <span style="color:#ef4444;">*</span></label>
                    <select class="form-input" id="req-ev-jenis">
                        <option value="KUNCI">Kealpaan Pengembalian Kunci Mobil</option>
                        <option value="KEBERSIHAN">Kealpaan Membersihkan Mobil</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="input-label">Tanggal <span style="color:#ef4444;">*</span></label>
                    <input type="date" class="form-input" id="req-ev-tanggal">
                </div>
                <div class="form-group" style="grid-column:1/-1;">
                    <label class="input-label">Laporan <span style="color:#ef4444;">*</span></label>
                    <textarea class="form-textarea" id="req-ev-laporan" placeholder="Deskripsikan pelanggaran..."></textarea>
                </div>
            </div>
            <input type="hidden" id="req-ev-id">
        </div>
        <div class="modal-footer">
            <button onclick="document.getElementById('req-editViolModal').style.display='none'" class="btn" style="flex:1;">Batal</button>
            <button onclick="reqSubmitEditViol()" class="btn btn-action-edit" style="flex:1;" id="req-submit-ev-btn">Simpan Perubahan</button>
        </div>
    </div>
</div>`;

        window.reqSetScoreMode = function (mode, btnEl) {
            document.getElementById('req-score-mode').value = mode;
            document.querySelectorAll('.score-mode-btn').forEach(b => b.classList.remove('active'));
            btnEl.classList.add('active');
            loadScores(false);
        };

        loadRequests();
    };
})();