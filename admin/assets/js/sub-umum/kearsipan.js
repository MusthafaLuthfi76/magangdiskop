// ============================================================
// kearsipan.js — Kearsipan Internal section (SPA)
// Admin Panel — Dinas Koperasi UKM
// UPDATE:
//   - Tab Rekapitulasi: ambil dari sheet REKAPITULASI DOKUMEN ARSIP
//   - Tab Rekap Triwulanan (baru)
//   - Submit assessment: tulis indikator per komponen ke rekap
//   - Dashboard: expose krsGetRekapKearsipan pakai getRekapArsip
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNQCq-3r2xBQvug2uzlgGzUSm9FGNnXgoZjJKLzmZpw-BltRPUoCP8gFw8Ke2SV1Z8Eg/exec';
    const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const MONTHS_UPPER = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

    const UNITS = [
        'Sekretariat', 'Bidang Koperasi', 'Bidang UKM',
        'Bidang Usaha Mikro', 'Bidang Kewirausahaan', 'Balai Layanan Usaha Terpadu KUMKM'
    ];
    const UNITS_SHORT = ['Sekretariat', 'Koperasi', 'UKM', 'Usaha Mikro', 'Kewirausahaan', 'BLUT'];

    const TRIWULAN = {
        'TW I': ['JANUARI', 'FEBRUARI', 'MARET'],
        'TW II': ['APRIL', 'MEI', 'JUNI'],
        'TW III': ['JULI', 'AGUSTUS', 'SEPTEMBER'],
        'TW IV': ['OKTOBER', 'NOVEMBER', 'DESEMBER']
    };

    let masterDocuments = [], allDocuments = [];
    let documentsCurrentPage = 1;
    const itemsPerPage = 10;
    let currentUser = {};

    // Rekap state — diisi dari sheet REKAPITULASI DOKUMEN ARSIP
    let rekapData = {};
    let rekapChart = null;

    // State Chart Triwulan
    let chartTwKrsIndikator = null;
    let chartTwKrsSanksi = null;

    // ── SVG Icons ─────────────────────────────────────────────
    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        eye: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        link: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
        check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        user: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        building: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M3 9h6"/><path d="M3 15h6"/><path d="M15 9h3"/><path d="M15 15h3"/></svg>`,
        calendar: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        fileText: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        chart: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    };

    // ══════════════════════════════════════════════════════════
    // JSONP FETCH
    // ══════════════════════════════════════════════════════════
    function jsonpFetch(baseUrl, params) {
        params = params || {};
        return new Promise(function (resolve, reject) {
            var cbName = '_krsJsonp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            var script = document.createElement('script');
            var timer = setTimeout(function () { cleanup(); reject(new Error('Timeout: server tidak merespons dalam 20 detik')); }, 20000);
            function cleanup() { clearTimeout(timer); delete window[cbName]; if (script.parentNode) script.parentNode.removeChild(script); }
            window[cbName] = function (data) { cleanup(); resolve(data); };
            var qs = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
            qs += (qs ? '&' : '') + 'callback=' + cbName;
            script.src = baseUrl + '?' + qs;
            script.onerror = function () { cleanup(); reject(new Error('Gagal memuat skrip dari Apps Script')); };
            document.head.appendChild(script);
        });
    }

    // ── Helpers ───────────────────────────────────────────────
    function normalizeMonth(str) {
        if (!str) return '';
        const s = str.trim().toLowerCase();
        return MONTHS_ID.find(m => m.toLowerCase() === s) || str;
    }
    function normalizeMonthUpper(str) {
        if (!str) return '';
        const s = str.trim().toLowerCase();
        const found = MONTHS_ID.find(m => m.toLowerCase() === s);
        return found ? found.toUpperCase() : str.trim().toUpperCase();
    }
    function parseFileUrls(raw) {
        if (!raw) return [];
        return raw.split(/[\n,]+/).map(s => s.trim()).filter(s => s.startsWith('http'));
    }
    function getLinkLabel(url, index) {
        const SKIP_WORDS = new Set(['edit', 'view', 'preview', 'pub', 'export', 'download', 'copy', 'present', 'htmlview']);
        try {
            const u = new URL(url);
            const parts = u.pathname.split('/').filter(Boolean);
            const host = u.hostname.toLowerCase();
            if (host.includes('docs.google.com')) {
                if (u.pathname.includes('/spreadsheets/')) return `Spreadsheet ${index + 1}`;
                if (u.pathname.includes('/document/')) return `Dokumen ${index + 1}`;
                if (u.pathname.includes('/presentation/')) return `Presentasi ${index + 1}`;
                if (u.pathname.includes('/forms/')) return `Formulir ${index + 1}`;
                return `Google Docs ${index + 1}`;
            }
            if (host.includes('drive.google.com')) return `Google Drive ${index + 1}`;
            const withExt = parts.find(p => /\.(pdf|docx?|xlsx?|pptx?|jpg|jpeg|png|zip|csv)$/i.test(p));
            if (withExt) {
                const ext = withExt.match(/\.([^.]+)$/)?.[1]?.toUpperCase() || '';
                const name = decodeURIComponent(withExt).replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
                return ext ? `${name} (${ext})` : name;
            }
            const meaningful = parts.reverse().find(p => p.length > 3 && p.length < 60 && !SKIP_WORDS.has(p.toLowerCase()));
            if (meaningful) return decodeURIComponent(meaningful).replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
        } catch (e) { }
        return `File ${index + 1}`;
    }
    function normalizeStatus(raw) {
        return String(raw || '').trim().toUpperCase() === 'ASSESSED' ? 'ASSESSED' : 'PENDING';
    }
    function toBool(val) {
        if (val === true || val === 'TRUE' || val === 'true' || val === 1 || val === '1') return true;
        if (val === false || val === 'FALSE' || val === 'false' || val === 0 || val === '0') return false;
        return val !== '';
    }
    function setCurrentMonth() {
        const el = document.getElementById('krs-bulan-filter');
        if (el && !el.value) el.value = MONTHS_ID[new Date().getMonth()];
    }

    // ══════════════════════════════════════════════════════════
    // TAB SWITCH
    // ══════════════════════════════════════════════════════════
    window.krsSwitchTab = function (tabName, event) {
        document.querySelectorAll('#section-kearsipan .krs-tab').forEach(t => t.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');
        document.querySelectorAll('#section-kearsipan .krs-tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('krs-tab-' + tabName);
        if (el) el.classList.add('active');
        if (tabName === 'rekap') loadRekap();
        else if (tabName === 'triwulan') krsRenderTriwulan();
    };
    window.krsSwitchTabDD = function (v) {
        document.querySelectorAll('#section-kearsipan .krs-tab-content').forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById('krs-tab-' + v);
        if (el) el.classList.add('active');
        if (v === 'rekap') loadRekap();
        else if (v === 'triwulan') krsRenderTriwulan();
    };

    // ══════════════════════════════════════════════════════════
    // LOAD DOCUMENTS
    // ══════════════════════════════════════════════════════════
    async function loadDocuments() {
        const tbody = document.getElementById('krs-docs-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;">
            <div class="spinner"></div><div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
        </td></tr>`;
        try {
            const result = await jsonpFetch(APPS_SCRIPT_URL, { action: 'getDocuments' });
            let documents = [];
            if (Array.isArray(result)) documents = result;
            else if (result && Array.isArray(result.data)) documents = result.data;
            else if (result && result.success === false) throw new Error(result.message || 'Server error');
            else if (result && result.error) throw new Error(result.error);

            masterDocuments = documents.slice().reverse().map(doc => ({
                ...doc,
                status: normalizeStatus(doc.status)
            }));
            applyFilters();
            loadStats();
        } catch (error) {
            console.error('[Kearsipan] loadDocuments error:', error);
            if (window.showToast) showToast('Gagal memuat data kearsipan: ' + error.message, 'error');
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#ef4444;">
                Gagal memuat data: ${error.message}
                <button onclick="krsLoadDocuments()" class="btn btn-sm" style="margin-left:8px;">Coba Lagi</button>
            </td></tr>`;
        }
    }
    window.krsLoadDocuments = loadDocuments;

    async function loadStats() {
        try {
            const curMonth = MONTHS_ID[new Date().getMonth()];
            const monthDocs = masterDocuments.filter(d => normalizeMonth(d.bulan).toLowerCase() === curMonth.toLowerCase());
            const pending = masterDocuments.filter(d => d.status !== 'ASSESSED').length;
            const assessed = masterDocuments.filter(d => d.status === 'ASSESSED');
            const sum = assessed.reduce((a, d) => a + (Math.round(parseFloat(String(d.nilai).replace(',', '.')) * 10) / 10 || 0), 0);
            const avg = assessed.length ? Math.round((sum / assessed.length) * 10) / 10 : 0;
            const el = id => document.getElementById(id);
            if (el('krs-avg-score')) el('krs-avg-score').textContent = avg.toFixed(1);
            if (el('krs-total-assessed')) el('krs-total-assessed').textContent = assessed.length;
            if (el('krs-this-month')) el('krs-this-month').textContent = monthDocs.length;
            if (el('krs-total-pending')) el('krs-total-pending').textContent = pending;
        } catch (e) { console.error('[Kearsipan] loadStats error:', e); }
    }

    // ── Filter Logic ──────────────────────────────────────────
    function applyFilters() {
        const bulan = document.getElementById('krs-bulan-filter')?.value || '';
        const status = document.getElementById('krs-status-filter')?.value || '';
        const search = (document.getElementById('krs-search-input')?.value || '').toLowerCase().trim();
        allDocuments = masterDocuments.filter(doc => {
            if (bulan && normalizeMonth(doc.bulan).toLowerCase() !== bulan.toLowerCase()) return false;
            if (status && doc.status !== status) return false;
            if (search) {
                const text = `${doc.nama_pengirim} ${doc.unit} ${doc.jenis_dokumen} ${doc.bulan}`.toLowerCase();
                if (!text.includes(search)) return false;
            }
            return true;
        });
        documentsCurrentPage = 1;
        renderPaginatedDocuments();
    }
    window.krsApplyFilters = applyFilters;

    // ── Render Table ──────────────────────────────────────────
    function renderPaginatedDocuments() {
        const tbody = document.getElementById('krs-docs-tbody');
        const cards = document.getElementById('krs-docs-cards');
        const pgn = document.getElementById('krs-docs-pagination');
        if (!tbody) return;

        if (allDocuments.length === 0) {
            const emptyMsg = masterDocuments.length === 0 ? `Tidak ada dokumen` : `Tidak ada dokumen yang sesuai filter`;
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">${emptyMsg}</td></tr>`;
            if (cards) cards.innerHTML = `<div style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">${emptyMsg}</div>`;
            if (pgn) pgn.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(allDocuments.length / itemsPerPage);
        const start = (documentsCurrentPage - 1) * itemsPerPage;
        const items = allDocuments.slice(start, start + itemsPerPage);

        tbody.innerHTML = items.map(doc => {
            const isPending = doc.status !== 'ASSESSED';
            const hasFiles = !!(doc.file_url && parseFileUrls(doc.file_url).length > 0);
            const nilaiDisplay = isPending ? '<span style="color:#94a3b8;">—</span>' : `<strong style="font-size:16px;color:#10b981;">${doc.nilai}</strong>`;
            const penilaiDisplay = isPending ? '<span style="color:#94a3b8;">—</span>' : `<span style="font-size:13px;color:#64748b;">${doc.penilai || 'Admin'}</span>`;
            const catatanDisplay = (!isPending && doc.catatan)
                ? `<span style="font-size:12px;color:#374151;" title="${doc.catatan}">${doc.catatan.length > 35 ? doc.catatan.slice(0, 35) + '…' : doc.catatan}</span>`
                : '<span style="color:#94a3b8;font-size:12px;">—</span>';
            return `<tr>
                <td style="font-size:13px;color:#64748b;white-space:nowrap;">${doc.timestamp || '-'}</td>
                <td><div style="font-weight:600;">${doc.nama_pengirim || '-'}</div><div style="font-size:12px;color:#64748b;margin-top:2px;">${doc.unit || '-'}</div></td>
                <td style="font-size:13px;">${doc.jenis_dokumen || '-'}</td>
                <td style="font-size:13px;white-space:nowrap;">${doc.bulan || '-'} ${doc.tahun || ''}</td>
                <td><span class="badge ${doc.status === 'ASSESSED' ? 'badge-assessed' : 'badge-pending'}">${doc.status === 'ASSESSED' ? 'Sudah Dinilai' : 'Pending'}</span></td>
                <td style="text-align:center;">${nilaiDisplay}</td>
                <td style="text-align:center;">${penilaiDisplay}</td>
                <td>${catatanDisplay}</td>
                <td><div class="action-buttons"><div class="btn-icon-group">
                    ${isPending
                    ? `${hasFiles ? `<button onclick="krsViewFiles('${doc.id}')" class="btn-icon btn-icon-file" title="Lihat File Lampiran">${ICONS.link}</button>` : ''}
                           <button onclick="krsOpenAssess('${doc.id}')" class="btn-icon btn-icon-approve" title="Nilai Dokumen">${ICONS.plus}</button>
                           <button onclick="krsConfirmDelete('${doc.id}',this)" class="btn-icon btn-icon-delete" title="Hapus Dokumen">${ICONS.trash}</button>`
                    : `<button onclick="krsViewAssess('${doc.id}')" class="btn-icon btn-icon-view" title="Lihat Detail">${ICONS.eye}</button>
                           <button onclick="krsEditAssess('${doc.id}')" class="btn-icon btn-icon-edit" title="Edit Penilaian">${ICONS.edit}</button>
                           <button onclick="krsConfirmDelete('${doc.id}',this)" class="btn-icon btn-icon-delete" title="Hapus Dokumen">${ICONS.trash}</button>`
                }
                </div></div></td>
            </tr>`;
        }).join('');

        if (cards) cards.innerHTML = items.map(doc => {
            const isPending = doc.status !== 'ASSESSED';
            const hasFiles = !!(doc.file_url && parseFileUrls(doc.file_url).length > 0);
            const scoreColor = isPending ? '#94a3b8' : (parseFloat(doc.nilai) >= 4.5 ? '#10b981' : parseFloat(doc.nilai) >= 3 ? '#f59e0b' : '#ef4444');
            return `<div class="krs-card">
                <div class="krs-card-top">
                    <div><div class="krs-card-name">${doc.nama_pengirim || '-'}</div><div class="krs-card-unit">${doc.unit || '-'}</div></div>
                    <span class="badge ${doc.status === 'ASSESSED' ? 'badge-assessed' : 'badge-pending'}">${doc.status === 'ASSESSED' ? 'Sudah Dinilai' : 'Pending'}</span>
                </div>
                <div class="krs-card-body">
                    <div><div class="krs-card-label">Jenis Dokumen</div><div class="krs-card-value">${doc.jenis_dokumen || '-'}</div></div>
                    <div><div class="krs-card-label">Periode</div><div class="krs-card-value">${doc.bulan || '-'} ${doc.tahun || ''}</div></div>
                    <div><div class="krs-card-label">Tanggal</div><div class="krs-card-value">${doc.timestamp || '-'}</div></div>
                    ${!isPending ? `<div><div class="krs-card-label">Penilai</div><div class="krs-card-value">${doc.penilai || 'Admin'}</div></div>` : ''}
                    ${!isPending && doc.catatan ? `<div style="grid-column:1/-1"><div class="krs-card-label">Catatan</div><div class="krs-card-value">${doc.catatan.length > 60 ? doc.catatan.slice(0, 60) + '…' : doc.catatan}</div></div>` : ''}
                </div>
                <div class="krs-card-footer">
                    <div>${isPending ? `<span style="font-size:12px;color:#94a3b8;">Belum dinilai</span>` : `<div class="krs-card-nilai" style="color:${scoreColor};">${doc.nilai}</div><div class="krs-card-nilai-label">dari 5.0</div>`}</div>
                    <div class="btn-icon-group" style="margin:0;">
                        ${isPending
                    ? `${hasFiles ? `<button onclick="krsViewFiles('${doc.id}')" class="btn-icon btn-icon-file">${ICONS.link}</button>` : ''}
                               <button onclick="krsOpenAssess('${doc.id}')" class="btn-icon btn-icon-approve">${ICONS.plus}</button>
                               <button onclick="krsConfirmDelete('${doc.id}',this)" class="btn-icon btn-icon-delete">${ICONS.trash}</button>`
                    : `<button onclick="krsViewAssess('${doc.id}')" class="btn-icon btn-icon-view">${ICONS.eye}</button>
                               <button onclick="krsEditAssess('${doc.id}')" class="btn-icon btn-icon-edit">${ICONS.edit}</button>
                               <button onclick="krsConfirmDelete('${doc.id}',this)" class="btn-icon btn-icon-delete">${ICONS.trash}</button>`
                }
                    </div>
                </div>
            </div>`;
        }).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="krsChangePage(${documentsCurrentPage - 1})" ${documentsCurrentPage === 1 ? 'disabled' : ''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${documentsCurrentPage} dari ${totalPages} (${allDocuments.length} data)</span>
            <button onclick="krsChangePage(${documentsCurrentPage + 1})" ${documentsCurrentPage === totalPages ? 'disabled' : ''}>Next &#8250;</button>`;
    }

    window.krsChangePage = (page) => {
        const t = Math.ceil(allDocuments.length / itemsPerPage);
        if (page < 1 || page > t) return;
        documentsCurrentPage = page;
        renderPaginatedDocuments();
    };

    // ══════════════════════════════════════════════════════════
    // DATA FETCHING: REKAPITULASI DOKUMEN ARSIP
    // ══════════════════════════════════════════════════════════
    async function _fetchRekapIfNeeded(force = false) {
        if (!force && Object.keys(rekapData).length > 0) return;
        try {
            const result = await jsonpFetch(APPS_SCRIPT_URL, { action: 'getRekapArsip' });
            if (result && result.success && result.rekap) {
                rekapData = result.rekap;
            } else if (result && result.success && result.scores && Array.isArray(result.scores)) {
                rekapData = {};
                result.scores.forEach(s => {
                    const b = (s.bulan || '').toUpperCase().trim();
                    if (!b) return;
                    if (!rekapData[b]) rekapData[b] = {};
                    rekapData[b][s.unit] = {
                        skorUtuh: s.skorUtuh || 5,
                        jumlahBuktiSalah: s.jumlahBuktiSalah || 0,
                        jumlahSuratTND: s.jumlahSuratTND || 0,
                        jumlahSanksi: s.jumlahSanksi || 0,
                        skorAkhir: s.skorAkhir || 0,
                    };
                });
            } else {
                rekapData = buildRekapFromDocuments(masterDocuments);
            }
        } catch (error) {
            console.error('[Kearsipan] fetchRekap error:', error);
            rekapData = buildRekapFromDocuments(masterDocuments);
        }
    }

    // ══════════════════════════════════════════════════════════
    // TAB REKAPITULASI BULANAN
    // ══════════════════════════════════════════════════════════
    async function loadRekap(force = false) {
        const bulan = document.getElementById('krs-rekap-bulan-filter')?.value || '';
        const container = document.getElementById('krs-rekap-container');
        if (!container) return;

        container.innerHTML = `<div style="text-align:center;padding:40px;"><div class="spinner"></div><div style="margin-top:12px;color:#94a3b8;">Memuat rekapitulasi dari sheet...</div></div>`;

        await _fetchRekapIfNeeded(force);
        renderRekap(bulan);
    }
    window.krsLoadRekap = () => loadRekap(true);

    /**
     * Fallback: hitung rekap dari dokumen lokal jika API gagal.
     */
    function buildRekapFromDocuments(docs) {
        const rekap = {};
        MONTHS_UPPER.forEach(bulan => {
            rekap[bulan] = {};
            UNITS.forEach(unit => {
                rekap[bulan][unit] = {
                    skorUtuh: 5,
                    jumlahBuktiSalah: 0,
                    jumlahSuratTND: 0,
                    jumlahSanksi: 0,
                    skorAkhir: 0,
                    count: 0
                };
            });
        });

        const assessed = docs.filter(d => d.status === 'ASSESSED');
        assessed.forEach(doc => {
            const bulanUpper = normalizeMonthUpper(doc.bulan);
            const unit = (doc.unit || '').trim();
            if (!bulanUpper || !unit) return;
            const matchedUnit = UNITS.find(u => u.trim().toLowerCase() === unit.toLowerCase())
                || UNITS.find(u => u.trim().toLowerCase().includes(unit.toLowerCase())
                    || unit.toLowerCase().includes(u.trim().toLowerCase()));
            if (!matchedUnit) return;
            if (!rekap[bulanUpper]) return;

            const r = rekap[bulanUpper][matchedUnit];
            r.count++;

            const buktiLengkap = toBool(doc.bukti_lengkap);
            const buktiBenar = toBool(doc.bukti_benar);
            const buktiTepatWaktu = toBool(doc.bukti_tepat_waktu);
            const hariTerlambat = parseInt(doc.hari_terlambat) || 0;

            let buktiSalah = 0;
            if (!buktiLengkap) buktiSalah += 1;
            if (!buktiBenar) buktiSalah += 1;
            if (!buktiTepatWaktu) buktiSalah += Math.max(1, hariTerlambat);
            r.jumlahBuktiSalah += buktiSalah;

            const suratSesuai = toBool(doc.surat_sesuai_tnd);
            const jumlahSuratSalah = parseInt(doc.jumlah_surat_salah) || 0;
            if (!suratSesuai) r.jumlahSuratTND += jumlahSuratSalah;
        });

        // Hitung sanksi & skor akhir
        Object.keys(rekap).forEach(bulan => {
            Object.keys(rekap[bulan]).forEach(unit => {
                const r = rekap[bulan][unit];
                const sanksi = (r.jumlahBuktiSalah * 0.1)
                    + (Math.floor(r.jumlahSuratTND / 3) * 0.1);
                r.jumlahSanksi = Math.round(sanksi * 10) / 10;
                r.skorAkhir = Math.max(0, Math.round((r.skorUtuh - r.jumlahSanksi) * 10) / 10);
            });
        });

        return rekap;
    }

    // ── Render Rekap ──────────────────────────────────────────
    function renderRekap(bulanFilter) {
        const container = document.getElementById('krs-rekap-container');
        if (!container) return;

        if (!bulanFilter) {
            renderRekapAllMonths();
            return;
        }

        const bulanUpper = bulanFilter.toUpperCase();
        const bulanData = rekapData[bulanUpper] || {};

        const rows = UNITS.map(unit => {
            const d = bulanData[unit] || {
                skorUtuh: 5, jumlahBuktiSalah: 0,
                jumlahSuratTND: 0, jumlahSanksi: 0, skorAkhir: 0
            };
            return { unit, data: d };
        });

        setTimeout(() => renderRekapChart(rows, bulanFilter), 50);

        const tableRows = rows.map((r, i) => {
            const skor = r.data.skorAkhir;
            const pct = (skor / 5) * 100;
            const chipCls = pct >= 90 ? 'krs-rekap-great'
                : pct >= 70 ? 'krs-rekap-good'
                    : pct >= 50 ? 'krs-rekap-fair' : 'krs-rekap-poor';
            const progColor = pct >= 90 ? '#10b981' : pct >= 70 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
            return `<tr>
                <td><span style="width:22px;height:22px;border-radius:50%;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:600;display:inline-flex;align-items:center;justify-content:center;">${i + 1}</span></td>
                <td style="font-weight:600;">${r.unit}</td>
                <td style="text-align:center;"><span style="font-size:13px;font-weight:600;color:#1e293b;">${r.data.skorUtuh || 5}</span></td>
                <td style="text-align:center;"><span style="font-size:13px;color:#64748b;">${r.data.jumlahBuktiSalah}</span></td>
                <td style="text-align:center;"><span style="font-size:13px;color:#64748b;">${r.data.jumlahSuratTND}</span></td>
                <td style="text-align:center;"><span style="font-size:13px;color:#ef4444;font-weight:600;">-${r.data.jumlahSanksi}</span></td>
                <td style="text-align:center;">
                    <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
                        <div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;min-width:60px;">
                            <div style="width:${Math.min(pct, 100).toFixed(0)}%;height:100%;background:${progColor};border-radius:3px;"></div>
                        </div>
                        <span class="krs-rekap-chip ${chipCls}">${skor.toFixed(1)}</span>
                    </div>
                </td>
            </tr>`;
        }).join('');

        container.innerHTML = `
            <div style="margin-bottom:20px;">
                <div class="card" style="margin-bottom:0;">
                    <div class="card-header"><span class="card-title">Grafik Skor Akhir — ${bulanFilter}</span><span class="card-note">Maks. 5 poin per unit · Sumber: Sheet Rekapitulasi</span></div>
                    <div class="card-content"><div style="position:relative;height:280px;"><canvas id="krs-rekap-chart"></canvas></div></div>
                </div>
            </div>
            <div class="card" style="margin-bottom:0;">
                <div class="card-header"><span class="card-title">Tabel Rekapitulasi — ${bulanFilter}</span></div>
                <div class="table-container">
                    <table>
                        <thead><tr>
                            <th>#</th>
                            <th>Unit / Bidang</th>
                            <th style="text-align:center;">Skor Utuh</th>
                            <th style="text-align:center;">Bukti Salah+Terlambat</th>
                            <th style="text-align:center;">Surat Tidak Sesuai TND</th>
                            <th style="text-align:center;">Jumlah Sanksi</th>
                            <th style="text-align:center;">Skor Akhir /5</th>
                        </tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:12px 16px;border-top:1px solid #f1f5f9;font-size:12px;">
                    <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:2px;background:#d1fae5;"></div>Sangat Baik ≥4.5</div>
                    <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:2px;background:#dbeafe;"></div>Baik ≥3.5</div>
                    <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:2px;background:#fef3c7;"></div>Cukup ≥2.5</div>
                    <div style="display:flex;align-items:center;gap:6px;"><div style="width:12px;height:12px;border-radius:2px;background:#fee2e2;"></div>Kurang &lt;2.5</div>
                    <div style="margin-left:auto;font-size:11px;color:#94a3b8;">Sumber: Sheet <code>REKAPITULASI DOKUMEN ARSIP</code></div>
                </div>
            </div>`;

        setTimeout(() => renderRekapChart(rows, bulanFilter), 50);
    }

    function renderRekapAllMonths() {
        const container = document.getElementById('krs-rekap-container');
        const bulanList = MONTHS_UPPER.filter(b => rekapData[b] && Object.keys(rekapData[b]).length > 0);

        if (bulanList.length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;">
                <div style="font-size:32px;margin-bottom:12px;">📊</div>
                <div>Pilih bulan untuk melihat rekapitulasi, atau data belum tersedia di sheet rekap.</div>
            </div>`;
            return;
        }

        const cards = bulanList.map(bulan => {
            const bData = rekapData[bulan] || {};
            const allScores = UNITS.map(u => (bData[u] || {}).skorAkhir || 0);
            const avg = (allScores.reduce((a, c) => a + c, 0) / allScores.length).toFixed(2);
            const bulanLabel = MONTHS_ID[MONTHS_UPPER.indexOf(bulan)] || bulan;
            const avgNum = parseFloat(avg);
            const avgColor = avgNum >= 4.5 ? '#10b981' : avgNum >= 3.5 ? '#3b82f6' : avgNum >= 2.5 ? '#f59e0b' : '#ef4444';
            return `<div class="card" style="cursor:pointer;" onclick="document.getElementById('krs-rekap-bulan-filter').value='${bulanLabel}';krsApplyRekapFilter()">
                <div class="card-header"><span class="card-title">${bulanLabel}</span><span class="card-note">${UNITS.length} unit</span></div>
                <div style="padding:16px;">
                    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Rata-rata Skor</div>
                    <div style="font-size:28px;font-weight:800;color:${avgColor};">${avg}</div>
                    <div style="font-size:12px;color:#64748b;margin-top:2px;">dari 5.0</div>
                </div>
            </div>`;
        }).join('');
        container.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;">${cards}</div>`;
    }

    window.krsApplyRekapFilter = function () {
        const bulan = document.getElementById('krs-rekap-bulan-filter')?.value || '';
        renderRekap(bulan);
    };

    function renderRekapChart(rows, bulanLabel) {
        const canvas = document.getElementById('krs-rekap-chart');
        if (!canvas) return;
        if (rekapChart) { rekapChart.destroy(); rekapChart = null; }

        const labels = rows.map(r => r.unit.length > 20 ? r.unit.slice(0, 18) + '…' : r.unit);
        const dataVals = rows.map(r => r.data ? (r.data.skorAkhir || 0) : 0);
        const colors = dataVals.map(v => {
            const pct = (v / 5) * 100;
            return pct >= 90 ? '#10b981bb' : pct >= 70 ? '#3b82f6bb' : pct >= 50 ? '#f59e0bbb' : '#ef4444bb';
        });
        const borderColors = dataVals.map(v => {
            const pct = (v / 5) * 100;
            return pct >= 90 ? '#10b981' : pct >= 70 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
        });

        if (typeof Chart === 'undefined') return;
        rekapChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Skor Akhir',
                    data: dataVals,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: c => `${c.raw} / 5 poin (${((c.raw / 5) * 100).toFixed(0)}%)` } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                    y: {
                        min: 0, max: 5, grid: { color: '#f1f5f9' },
                        ticks: { stepSize: 1, font: { family: 'Inter', size: 11 } },
                        title: { display: true, text: 'Skor Akhir (/5)', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });
    }

    // ══════════════════════════════════════════════════════════
    // TAB REKAP TRIWULAN (BARU)
    // ══════════════════════════════════════════════════════════

    function _calcKrsTWUnitScore(unit, months) {
        const vals = months
            .map(m => rekapData[m] && rekapData[m][unit] ? rekapData[m][unit].skorAkhir : null)
            .filter(v => v !== null && v !== undefined);
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
    }

    function _calcKrsTWUnitSanksi(unit, months) {
        const vals = months
            .map(m => rekapData[m] && rekapData[m][unit] ? rekapData[m][unit].jumlahSanksi : null)
            .filter(v => v !== null && v !== undefined);
        return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
    }

    async function krsRenderTriwulan() {
        const container = document.getElementById('krs-triwulan-content');
        if (!container) return;

        // Tampilkan loading ringan jika data rekap belum di-fetch
        if (Object.keys(rekapData).length === 0) {
            container.innerHTML = `<div style="text-align:center;padding:60px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat data triwulanan...</div></div>`;
            await _fetchRekapIfNeeded();
        }

        _krsRenderTriwulanUI(container);
    }
    window.krsRenderTriwulan = krsRenderTriwulan;
    window.krsRefreshTriwulan = async () => {
        rekapData = {}; // Clear memory for fresh fetch
        await krsRenderTriwulan();
    };

    function _krsRenderTriwulanUI(container) {
        const twKeys = Object.keys(TRIWULAN);
        const twColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
        const twBgs = ['#eff6ff', '#f0fdf4', '#fffbeb', '#fdf2f8'];

        const twSelectEl = document.getElementById('krs-tw-select');
        const twSelected = twSelectEl?.value || 'TW I';
        const twSelectedMonths = TRIWULAN[twSelected];

        // Build grid: per unit, nilai rata-rata tiap TW
        const grid = UNITS.map(unit => {
            const twData = twKeys.map(tw => _calcKrsTWUnitScore(unit, TRIWULAN[tw]));
            const allVals = twData.filter(v => v !== null);
            return { unit, twData, best: allVals.length ? Math.max(...allVals) : null, worst: allVals.length ? Math.min(...allVals) : null };
        });

        // Summary cards per TW
        const twSummaries = twKeys.map((tw, twIdx) => {
            const vals = grid.map(r => ({ unit: r.unit, val: r.twData[twIdx] })).filter(r => r.val !== null);
            vals.sort((a, b) => b.val - a.val);
            const avg = vals.length ? (vals.reduce((a, r) => a + r.val, 0) / vals.length).toFixed(2) : '—';
            return { tw, highest: vals[0] || null, lowest: vals[vals.length - 1] || null, avg, assessed: vals.length };
        });

        // Chart data untuk TW terpilih
        const chartSkorData = UNITS.map(u => _calcKrsTWUnitScore(u, twSelectedMonths) || 0);
        const chartViolData = UNITS.map(u => _calcKrsTWUnitSanksi(u, twSelectedMonths) || 0);

        // Summary cards HTML
        const summaryCards = twSummaries.map((s, i) => `
        <div style="background:${twBgs[i]};border:1.5px solid ${twColors[i]}33;border-radius:12px;padding:16px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${twColors[i]};margin-bottom:6px;">${s.tw}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:10px;">${TRIWULAN[s.tw][0].slice(0, 3)} – ${TRIWULAN[s.tw][2].slice(0, 3)}</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">🏆 TERTINGGI</div>
                    ${s.highest
                ? `<div style="font-size:12px;font-weight:700;color:#065f46;">${s.highest.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '')}</div>
                           <div style="font-size:18px;font-weight:800;color:${twColors[i]};">${s.highest.val}<span style="font-size:11px;color:#94a3b8;">/5</span></div>`
                : '<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                </div>
                <div style="background:white;border-radius:8px;padding:8px 10px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;font-weight:600;margin-bottom:2px;">📉 TERENDAH</div>
                    ${s.lowest && s.lowest !== s.highest
                ? `<div style="font-size:12px;font-weight:700;color:#991b1b;">${s.lowest.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '')}</div>
                           <div style="font-size:18px;font-weight:800;color:#ef4444;">${s.lowest.val}<span style="font-size:11px;color:#94a3b8;">/5</span></div>`
                : '<div style="color:#94a3b8;font-size:12px;">Belum ada data</div>'}
                </div>
                <div style="text-align:center;padding:6px;background:white;border-radius:8px;border:1px solid #e5e7eb;">
                    <div style="font-size:10px;color:#64748b;margin-bottom:2px;">Rata-rata</div>
                    <div style="font-size:16px;font-weight:700;color:${twColors[i]};">${s.avg}</div>
                    <div style="font-size:10px;color:#94a3b8;">${s.assessed} unit dinilai</div>
                </div>
            </div>
        </div>`).join('');

        // Tabel detail
        const twHeaderCells = twKeys.map((tw, i) => `<th style="text-align:center;background:${twBgs[i]};color:${twColors[i]};">${tw}<br><small style="opacity:.7;font-size:10px;">${TRIWULAN[tw][0].slice(0, 3)}-${TRIWULAN[tw][2].slice(0, 3)}</small></th>`).join('');
        const tableRows = grid.map(row => {
            const shortUnit = row.unit.replace('Balai Layanan Usaha Terpadu KUMKM', 'BLUT').replace('Bidang ', '');
            const twCells = row.twData.map((val, i) => {
                if (val === null) return `<td style="text-align:center;color:#94a3b8;font-size:12px;">—</td>`;
                const isBest = val === row.best && row.best !== null;
                const isWorst = val === row.worst && row.worst !== null && row.best !== row.worst;
                const color = val >= 4.5 ? '#065f46' : val >= 3 ? '#92400e' : '#991b1b';
                return `<td style="text-align:center;">
                    <div style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;">
                        <span style="font-weight:700;color:${color};font-size:15px;">${val}</span>
                        ${isBest ? '<span style="font-size:9px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:6px;font-weight:600;">BEST</span>' : ''}
                        ${isWorst ? '<span style="font-size:9px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:6px;font-weight:600;">LOW</span>' : ''}
                    </div>
                </td>`;
            }).join('');
            const filledVals = row.twData.filter(v => v !== null);
            const annualAvg = filledVals.length ? (filledVals.reduce((a, b) => a + b, 0) / filledVals.length).toFixed(2) : '—';
            const annualColor = parseFloat(annualAvg) >= 4.5 ? '#065f46' : parseFloat(annualAvg) >= 3 ? '#92400e' : '#991b1b';
            return `<tr>
                <td style="font-weight:600;font-size:13px;">${shortUnit}</td>
                ${twCells}
                <td style="text-align:center;"><strong style="font-size:15px;color:${annualColor};">${annualAvg}</strong></td>
            </tr>`;
        }).join('');

        container.innerHTML = `
        <!-- Summary cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
            ${summaryCards}
        </div>

        <!-- Chart section -->
        <div class="card" style="margin-bottom:20px;">
            <div class="card-header">
                <h3 class="card-title">📊 Chart Kearsipan per Triwulan</h3>
                <div style="display:flex;align-items:center;gap:8px;">
                    <label style="font-size:13px;color:#64748b;font-weight:600;">Pilih Triwulan:</label>
                    <select class="select-input" id="krs-tw-select" onchange="krsRenderTriwulan()" style="min-width:120px;">
                        ${twKeys.map(tw => `<option value="${tw}" ${tw === twSelected ? 'selected' : ''}>${tw} (${TRIWULAN[tw][0].slice(0, 3)}–${TRIWULAN[tw][2].slice(0, 3)})</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="card-content">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Skor Akhir Per Unit — ${twSelected}</div>
                        <div class="chart-container"><canvas id="krs-tw-scoreChart"></canvas></div>
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px;">Rata-rata Pengurangan/Sanksi — ${twSelected}</div>
                        <div class="chart-container"><canvas id="krs-tw-sanksiChart"></canvas></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Detail table -->
        <div class="card" style="margin-bottom:0;">
            <div class="card-header">
                <h3 class="card-title">📋 Rekap Nilai Kearsipan Per Triwulan — Semua Unit</h3>
                <span style="font-size:12px;color:#64748b;">Rata-rata skor akhir dari bulan yang sudah diisi</span>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr>
                            <th style="text-align:left;padding:10px 12px;background:#f8fafc;font-size:12px;color:#64748b;font-weight:700;min-width:140px;">Unit / Bidang</th>
                            ${twHeaderCells}
                            <th style="text-align:center;background:#1a2942;color:white;font-size:12px;padding:10px 12px;">Rata-rata<br>Tahunan</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <div style="padding:12px 16px;border-top:1px solid #f1f5f9;font-size:12px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">
                <span>🏆 <strong>BEST</strong> = skor terbaik unit dalam 4 TW</span>
                <span>📉 <strong>LOW</strong> = skor terendah unit</span>
                <span>≥4.5 = <span style="color:#065f46;font-weight:600;">Sangat Baik</span> · ≥3 = <span style="color:#92400e;font-weight:600;">Cukup</span> · &lt;3 = <span style="color:#991b1b;font-weight:600;">Kurang</span></span>
            </div>
        </div>`;

        // Render chart setelah DOM tersedia
        setTimeout(() => {
            if (chartTwKrsIndikator) { chartTwKrsIndikator.destroy(); chartTwKrsIndikator = null; }
            if (chartTwKrsSanksi) { chartTwKrsSanksi.destroy(); chartTwKrsSanksi = null; }
            const ctx1 = document.getElementById('krs-tw-scoreChart');
            const ctx2 = document.getElementById('krs-tw-sanksiChart');
            if (!ctx1 || !ctx2 || typeof Chart === 'undefined') return;

            chartTwKrsIndikator = new Chart(ctx1.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: UNITS_SHORT,
                    datasets: [{ label: 'Skor Akhir', data: chartSkorData, borderRadius: 6, backgroundColor: chartSkorData.map(v => v >= 4.5 ? '#10b981' : v >= 3 ? '#f59e0b' : v > 0 ? '#ef4444' : '#e2e8f0') }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Skor: ${ctx.parsed.y.toFixed(2)}/5` } } }, scales: { y: { beginAtZero: true, max: 5, ticks: { stepSize: 0.5 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
            });
            chartTwKrsSanksi = new Chart(ctx2.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: UNITS_SHORT,
                    datasets: [{ label: 'Rata-rata Sanksi', data: chartViolData, borderRadius: 6, backgroundColor: '#f43f5e' }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Rata-rata Sanksi: -${ctx.parsed.y.toFixed(2)}` } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 0.5 }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } } }
            });
        }, 80);
    }

    // ══════════════════════════════════════════════════════════
    // PUBLIC: getRekapKearsipan untuk Dashboard
    // Ambil dari sheet REKAPITULASI DOKUMEN ARSIP via getRekapArsip
    // ══════════════════════════════════════════════════════════
    window.krsGetRekapForDashboard = async function (bulan) {
        try {
            const result = await jsonpFetch(APPS_SCRIPT_URL, { action: 'getRekapArsip' });
            let data = {};

            if (result && result.success && result.rekap) {
                data = result.rekap;
            } else if (result && result.success && result.scores) {
                // Konversi array ke nested
                result.scores.forEach(s => {
                    const b = (s.bulan || '').toUpperCase().trim();
                    if (!data[b]) data[b] = {};
                    data[b][s.unit] = { skorAkhir: s.skorAkhir || 0 };
                });
            }

            const bulanUpper = bulan.toUpperCase();
            const bulanData = data[bulanUpper] || {};
            const scores = {};
            UNITS.forEach(u => {
                // Kembalikan 0 (bukan null) jika tidak ada data
                scores[u] = bulanData[u]?.skorAkhir ?? 0;
            });
            return scores;
        } catch (e) {
            console.error('[Kearsipan] getRekapForDashboard error:', e);
            return {};
        }
    };

    // Expose global untuk dashboard.js (dipakai di fillOperasionalScores)
    window.krsGetRekapKearsipan = async function () {
        try {
            const result = await jsonpFetch(APPS_SCRIPT_URL, { action: 'getRekapArsip' });
            if (result && result.success && result.rekap) return result.rekap;
            if (result && result.success && result.scores) {
                const rekap = {};
                result.scores.forEach(s => {
                    const b = (s.bulan || '').toUpperCase().trim();
                    if (!rekap[b]) rekap[b] = {};
                    rekap[b][s.unit] = { skorAkhir: s.skorAkhir || 0 };
                });
                return rekap;
            }
            return {};
        } catch (e) {
            return {};
        }
    };

    // ══════════════════════════════════════════════════════════
    // VIEW FILE LAMPIRAN
    // ══════════════════════════════════════════════════════════
    window.krsViewFiles = (docId) => {
        const doc = allDocuments.find(d => d.id === docId) || masterDocuments.find(d => d.id === docId);
        if (!doc) return;
        const urls = parseFileUrls(doc.file_url);
        if (urls.length === 0) { if (window.showToast) showToast('Tidak ada file lampiran', 'error'); return; }

        document.getElementById('krs-filesModal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'krs-filesModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:480px;">
            <div class="modal-header"><h2 class="modal-title">📎 File Lampiran Dokumen</h2></div>
            <div class="modal-content" style="display:flex;flex-direction:column;gap:12px;">
                <div class="info-box">
                    <p style="font-weight:600;margin:0 0 2px;">${doc.nama_pengirim || '-'} — ${doc.unit || '-'}</p>
                    <p style="font-size:13px;color:#64748b;margin:0;">${doc.jenis_dokumen || '-'} · ${doc.bulan || '-'} ${doc.tahun || ''}</p>
                </div>
                <div style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">${urls.length} File Tersedia</div>
                <div class="krs-file-list">
                    ${urls.map((url, i) => `
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="krs-file-item">
                        <div class="krs-file-icon">${ICONS.link}</div>
                        <div class="krs-file-info"><div class="krs-file-label">${getLinkLabel(url, i)}</div><div class="krs-file-url">${url.length > 55 ? url.slice(0, 55) + '…' : url}</div></div>
                        <div class="krs-file-arrow">›</div>
                    </a>`).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('krs-filesModal').remove()" class="btn" style="flex:1;">Tutup</button>
                <button onclick="document.getElementById('krs-filesModal').remove();krsOpenAssess('${docId}')" class="btn btn-success" style="flex:1;">${ICONS.plus} Nilai Sekarang</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ══════════════════════════════════════════════════════════
    // VIEW DETAIL MODAL
    // ══════════════════════════════════════════════════════════
    window.krsViewAssess = (docId) => {
        const doc = allDocuments.find(d => d.id === docId) || masterDocuments.find(d => d.id === docId);
        if (!doc) return;
        document.getElementById('krs-viewModal')?.remove();

        const bl = toBool(doc.bukti_lengkap);
        const bb = toBool(doc.bukti_benar);
        const btw = toBool(doc.bukti_tepat_waktu);

        const hari = parseInt(doc.hari_terlambat) || 0;

        const scoreBukti =
            (bl ? 1 : 0) +
            (bb ? 1 : 0) +
            (
                btw
                    ? 1
                    : Math.max(0, 1 - (0.1 * hari))
            );

        const scoreSrikandi =
            toBool(doc.sudah_srikandi)
                ? 1
                : 0;

        const sesuaiTND = toBool(doc.surat_sesuai_tnd);

        const jss = parseInt(doc.jumlah_surat_salah) || 0;

        const scoreSurat =
            sesuaiTND
                ? 1
                : Math.max(0, 1 - (0.1 * jss));

        const total =
            scoreBukti +
            scoreSrikandi +
            scoreSurat;
        const scoreColor = total >= 4.5 ? '#10b981' : total >= 3 ? '#f59e0b' : '#ef4444';
        const scoreBg = total >= 4.5 ? '#f0fdf4' : total >= 3 ? '#fffbeb' : '#fff1f2';
        const scoreBorder = total >= 4.5 ? '#86efac' : total >= 3 ? '#fde68a' : '#fecaca';

        const yesNo = (val) => toBool(val)
            ? `<span style="display:inline-flex;align-items:center;gap:4px;color:#10b981;font-weight:600;font-size:13px;">${ICONS.check} Ya</span>`
            : `<span style="display:inline-flex;align-items:center;gap:4px;color:#ef4444;font-weight:600;font-size:13px;">${ICONS.x} Tidak</span>`;

        const urls = parseFileUrls(doc.file_url);
        const fileSection = urls.length > 0 ? `
            <div class="krs-detail-section">
                <div class="krs-detail-section-title"><span style="color:#3b82f6;">${ICONS.fileText}</span> File Lampiran <span style="font-weight:400;color:#94a3b8;font-size:11px;">${urls.length} file</span></div>
                <div class="krs-file-list">
                    ${urls.map((url, i) => `
                    <a href="${url}" target="_blank" rel="noopener noreferrer" class="krs-file-item">
                        <div class="krs-file-icon">${ICONS.link}</div>
                        <div class="krs-file-info"><div class="krs-file-label">${getLinkLabel(url, i)}</div><div class="krs-file-url">${url.length > 55 ? url.slice(0, 55) + '…' : url}</div></div>
                        <div class="krs-file-arrow">›</div>
                    </a>`).join('')}
                </div>
            </div>` : '';

        const modal = document.createElement('div');
        modal.id = 'krs-viewModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:580px;">
            <div class="modal-header"><h2 class="modal-title">Detail Penilaian Kearsipan</h2></div>
            <div class="modal-content" style="display:flex;flex-direction:column;gap:14px;">
                <div class="krs-detail-section" style="flex-direction:row;align-items:flex-start;gap:14px;flex-wrap:wrap;">
                    <div style="flex:1;min-width:160px;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <div class="krs-detail-field-icon" style="background:#eff6ff;color:#3b82f6;">${ICONS.user}</div>
                            <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Pengirim</div>
                            <div style="font-size:14px;font-weight:700;color:#1e293b;">${doc.nama_pengirim || '-'}</div></div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <div class="krs-detail-field-icon" style="background:#f0fdf4;color:#10b981;">${ICONS.building}</div>
                            <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Unit / Bidang</div>
                            <div style="font-size:13px;font-weight:600;color:#1e293b;">${doc.unit || '-'}</div></div>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div class="krs-detail-field-icon" style="background:#fefce8;color:#ca8a04;">${ICONS.calendar}</div>
                            <div><div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Periode</div>
                            <div style="font-size:13px;font-weight:600;color:#1e293b;">${doc.bulan || '-'} ${doc.tahun || ''} · ${doc.jenis_dokumen || '-'}</div></div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:16px 24px;background:${scoreBg};border:2px solid ${scoreBorder};border-radius:12px;min-width:110px;">
                        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${scoreColor};margin-bottom:4px;">Skor</div>
                        <div style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${total.toFixed(1)}</div>
                        <div style="font-size:12px;color:#64748b;margin-top:4px;">dari 5.0</div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px;">oleh ${doc.penilai || 'Admin'}</div>
                    </div>
                </div>
                <div class="krs-detail-section">
                    <div class="krs-detail-section-title"><span style="color:#3b82f6;">📊</span> Rincian Penilaian</div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#eff6ff;color:#3b82f6;">1</span>Bukti Dukung</div>
                        <div class="krs-score-row-detail">
                            <div class="krs-score-sub-row"><span>Bukti lengkap</span>${yesNo(doc.bukti_lengkap)}</div>
                            <div class="krs-score-sub-row"><span>Sesuai ketentuan</span>${yesNo(doc.bukti_benar)}</div>
                            <div class="krs-score-sub-row"><span>Tepat waktu</span>${yesNo(doc.bukti_tepat_waktu)}${!btw && hari > 0 ? `<span style="font-size:12px;color:#64748b;margin-left:4px;">(${hari} hari)</span>` : ''}</div>
                        </div>
                        <div class="krs-score-chip" style="background:#eff6ff;color:#3b82f6;">${scoreBukti.toFixed(1)}</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fdf4ff;color:#8b5cf6;">2</span>Srikandi</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sudah di Srikandi</span>${yesNo(doc.sudah_srikandi)}</div></div>
                        <div class="krs-score-chip" style="background:#fdf4ff;color:#8b5cf6;">${scoreSrikandi.toFixed(1)}</div>
                    </div>
                    <div class="krs-score-row">
                        <div class="krs-score-row-label"><span class="krs-score-badge" style="background:#fffbeb;color:#f59e0b;">3</span>Surat Keluar</div>
                        <div class="krs-score-row-detail"><div class="krs-score-sub-row"><span>Sesuai TND</span>${yesNo(doc.surat_sesuai_tnd)}${!sesuaiTND && jss > 0 ? `<span style="font-size:12px;color:#64748b;margin-left:4px;">(${jss} surat)</span>` : ''}</div></div>
                        <div class="krs-score-chip" style="background:#fffbeb;color:#f59e0b;">${scoreSurat.toFixed(1)}</div>
                    </div>
                </div>
                ${doc.catatan ? `<div class="krs-detail-section"><div class="krs-detail-section-title"><span style="color:#3b82f6;">📝</span> Catatan</div><div style="font-size:13.5px;color:#374151;line-height:1.6;white-space:pre-line;">${doc.catatan}</div></div>` : ''}
                ${fileSection}
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('krs-viewModal').remove()" class="btn" style="flex:1;">Tutup</button>
                <button onclick="document.getElementById('krs-viewModal').remove();krsEditAssess('${docId}')" class="btn btn-primary" style="flex:1;">✏️ Edit Penilaian</button>
            </div>
        </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ══════════════════════════════════════════════════════════
    // ASSESSMENT MODAL (nilai / edit)
    // ══════════════════════════════════════════════════════════
    window.krsOpenAssess = (docId) => openAssessmentModal(docId, false);
    window.krsEditAssess = (docId) => openAssessmentModal(docId, true);

    function openAssessmentModal(docId, isEdit) {
        const doc = allDocuments.find(d => d.id === docId) || masterDocuments.find(d => d.id === docId);
        if (!doc) return;

        const existingData = (isEdit && doc.status === 'ASSESSED')
            ? {
                bukti_lengkap: toBool(doc.bukti_lengkap),
                bukti_benar: toBool(doc.bukti_benar),
                bukti_tepat_waktu: toBool(doc.bukti_tepat_waktu),
                hari_terlambat: parseInt(doc.hari_terlambat) || 0,
                sudah_srikandi: toBool(doc.sudah_srikandi),
                surat_sesuai_tnd: toBool(doc.surat_sesuai_tnd),
                jumlah_surat_salah: parseInt(doc.jumlah_surat_salah) || 0,
                catatan: doc.catatan || ''
            }
            : { bukti_lengkap: true, bukti_benar: true, bukti_tepat_waktu: true, hari_terlambat: 0, sudah_srikandi: true, surat_sesuai_tnd: true, jumlah_surat_salah: 0, catatan: '' };

        document.getElementById('krs-assessModal')?.remove();

        const urls = parseFileUrls(doc.file_url);
        const fileShortcut = urls.length > 0 ? `
            <div style="margin-bottom:16px;padding:10px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#1e40af;">${ICONS.link}<span>${urls.length} file lampiran tersedia</span></div>
                <button type="button" onclick="krsViewFiles('${docId}')" style="font-size:12px;font-weight:600;color:#2563eb;background:white;border:1px solid #bfdbfe;border-radius:6px;padding:4px 10px;cursor:pointer;white-space:nowrap;">Lihat File</button>
            </div>` : '';

        const modal = document.createElement('div');
        modal.id = 'krs-assessModal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';

        modal.innerHTML = `
        <div class="modal" style="max-width:600px;">
            <div class="modal-header"><h2 class="modal-title">${isEdit ? '✏️ Edit' : '✚ Nilai'} Dokumen Kearsipan</h2></div>
            <div class="modal-content">
                <div class="info-box" style="margin-bottom:16px;">
                    <p style="font-weight:600;margin:0 0 4px;">${doc.nama_pengirim} — ${doc.unit}</p>
                    <p style="font-size:13px;color:#64748b;margin:0;">${doc.jenis_dokumen} · ${doc.bulan} ${doc.tahun || ''}</p>
                </div>
                ${fileShortcut}
                <div class="alert alert-info" style="margin-bottom:20px;">
                    📋 <strong>Sistem Penilaian:</strong> Bukti Dukung (3 poin) + Srikandi (1 poin) + Surat Keluar (1 poin) = <strong>Total 5 poin</strong>
                    <br><span style="font-size:12px;color:#1e40af;">💾 Nilai akan disimpan ke sheet <strong>REKAPITULASI DOKUMEN ARSIP</strong></span>
                </div>
                <div class="score-section">
                    <div class="score-section-title">1️⃣ Bukti Dukung <span style="font-weight:400;color:#64748b;font-size:13px;">(maks 3 poin · masuk ke "Jumlah bukti dukung salah+terlambat")</span></div>
                    <div class="checkbox-container"><input type="checkbox" id="krs-bukti-lengkap" ${existingData.bukti_lengkap ? 'checked' : ''}><label for="krs-bukti-lengkap" style="cursor:pointer;font-size:14px;">Bukti dukung lengkap (+1 poin)</label></div>
                    <div class="checkbox-container"><input type="checkbox" id="krs-bukti-benar" ${existingData.bukti_benar ? 'checked' : ''}><label for="krs-bukti-benar" style="cursor:pointer;font-size:14px;">Bukti sesuai ketentuan (+1 poin)</label></div>
                    <div class="checkbox-container"><input type="checkbox" id="krs-bukti-tepat-waktu" ${existingData.bukti_tepat_waktu ? 'checked' : ''}><label for="krs-bukti-tepat-waktu" style="cursor:pointer;font-size:14px;">Tepat waktu (+1 poin)</label></div>
                    <div class="form-group" id="krs-terlambat-group" style="display:${existingData.bukti_tepat_waktu ? 'none' : 'block'};margin-left:26px;margin-top:4px;">
                        <label class="input-label">Hari terlambat <span style="color:#64748b;">(−0.1 per hari)</span></label>
                        <input type="number" class="form-input" id="krs-hari-terlambat" value="${existingData.hari_terlambat}" min="0" max="30" style="width:120px;">
                    </div>
                </div>
                <div class="score-section" style="border-left-color:#8b5cf6;">
                    <div class="score-section-title">2️⃣ Srikandi <span style="font-weight:400;color:#64748b;font-size:13px;">(1 poin · masuk ke "Sudah ada di Srikandi")</span></div>
                    <div class="checkbox-container"><input type="checkbox" id="krs-sudah-srikandi" ${existingData.sudah_srikandi ? 'checked' : ''}><label for="krs-sudah-srikandi" style="cursor:pointer;font-size:14px;">Sudah ada di Srikandi (+1 poin)</label></div>
                </div>
                <div class="score-section" style="border-left-color:#f59e0b;">
                    <div class="score-section-title">3️⃣ Surat Keluar sesuai TND <span style="font-weight:400;color:#64748b;font-size:13px;">(1 poin · masuk ke "Jumlah surat tidak sesuai TND")</span></div>
                    <div class="checkbox-container"><input type="checkbox" id="krs-surat-sesuai-tnd" ${existingData.surat_sesuai_tnd ? 'checked' : ''}><label for="krs-surat-sesuai-tnd" style="cursor:pointer;font-size:14px;">Semua surat sesuai TND (+1 poin)</label></div>
                    <div class="form-group" id="krs-surat-salah-group" style="display:${existingData.surat_sesuai_tnd ? 'none' : 'block'};margin-left:26px;margin-top:4px;">
                        <label class="input-label">Jumlah surat tidak sesuai TND <span style="color:#64748b;">(−0.1 per 3 surat)</span></label>
                        <input type="number" class="form-input" id="krs-jumlah-surat-salah" value="${existingData.jumlah_surat_salah}" min="0" style="width:120px;">
                    </div>
                </div>
                <div class="score-preview">
                    <div class="score-preview-title">TOTAL SKOR</div>
                    <div class="score-preview-value" id="krs-total-score">5.0</div>
                    <div class="score-breakdown">
                        <div class="score-item"><div class="score-item-label">Bukti Dukung</div><div class="score-item-value" id="krs-score-bukti">3.0</div></div>
                        <div class="score-item"><div class="score-item-label">Srikandi</div><div class="score-item-value" id="krs-score-srikandi">1.0</div></div>
                        <div class="score-item"><div class="score-item-label">Surat Keluar</div><div class="score-item-value" id="krs-score-surat">1.0</div></div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="input-label">Catatan Tambahan (Opsional)</label>
                    <textarea class="form-textarea" name="krs-catatan" rows="3" placeholder="Tambahkan catatan...">${existingData.catatan}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('krs-assessModal').remove()" class="btn" style="flex:1;">Batal</button>
                <button onclick="krsSubmitAssessment('${docId}', ${isEdit})" id="krs-submit-assess-btn" class="btn ${isEdit ? 'btn-warning' : 'btn-success'}" style="flex:1;">
                    ${isEdit ? '💾 Update Penilaian' : `${ICONS.plus} Simpan Penilaian`}
                </button>
            </div>
        </div>`;

        function updateScore() {

            const buktiLengkap = modal.querySelector('#krs-bukti-lengkap').checked;
            const buktiBenar = modal.querySelector('#krs-bukti-benar').checked;
            const tepatWaktu = modal.querySelector('#krs-bukti-tepat-waktu').checked;
            const hari = parseInt(modal.querySelector('#krs-hari-terlambat').value) || 0;

            const srikandi = modal.querySelector('#krs-sudah-srikandi').checked;

            const sesuai = modal.querySelector('#krs-surat-sesuai-tnd').checked;
            const jumlahSurat = parseInt(modal.querySelector('#krs-jumlah-surat-salah').value) || 0;

            // =========================
            // BUKTI DUKUNG
            // =========================
            let scoreBukti =
                (buktiLengkap ? 1 : 0) +
                (buktiBenar ? 1 : 0) +
                (
                    tepatWaktu
                        ? 1
                        : Math.max(0, 1 - (0.1 * hari))
                );

            // =========================
            // SRIKANDI
            // =========================
            let scoreSrikandi = srikandi ? 1 : 0;

            // =========================
            // SURAT
            // =========================
            let scoreSurat =
                sesuai
                    ? 1
                    : Math.max(0, 1 - (0.1 * jumlahSurat));

            // =========================
            // TOTAL
            // =========================
            let total =
                scoreBukti +
                scoreSrikandi +
                scoreSurat;

            total = Math.max(0, total);

            // =========================
            // TAMPILKAN
            // =========================
            modal.querySelector('#krs-score-bukti').textContent =
                scoreBukti.toFixed(1);

            modal.querySelector('#krs-score-srikandi').textContent =
                scoreSrikandi.toFixed(1);

            modal.querySelector('#krs-score-surat').textContent =
                scoreSurat.toFixed(1);

            modal.querySelector('#krs-total-score').textContent =
                total.toFixed(1);
        }

        modal.querySelector('#krs-bukti-tepat-waktu').addEventListener('change', e => {
            modal.querySelector('#krs-terlambat-group').style.display = e.target.checked ? 'none' : 'block';
            if (e.target.checked) modal.querySelector('#krs-hari-terlambat').value = 0;
            updateScore();
        });
        modal.querySelector('#krs-surat-sesuai-tnd').addEventListener('change', e => {
            modal.querySelector('#krs-surat-salah-group').style.display = e.target.checked ? 'none' : 'block';
            if (e.target.checked) modal.querySelector('#krs-jumlah-surat-salah').value = 0;
            updateScore();
        });
        ['#krs-bukti-lengkap', '#krs-bukti-benar', '#krs-sudah-srikandi'].forEach(sel => {
            modal.querySelector(sel).addEventListener('change', updateScore);
        });
        ['#krs-hari-terlambat', '#krs-jumlah-surat-salah'].forEach(sel => {
            modal.querySelector(sel).addEventListener('input', updateScore);
            modal.querySelector(sel).addEventListener('change', updateScore);
        });

        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        updateScore();
        document.body.appendChild(modal);
    }

    // ══════════════════════════════════════════════════════════
    // SUBMIT ASSESSMENT
    // Kirim semua indikator ke GAS, GAS yang menulis ke sheet rekap
    // ══════════════════════════════════════════════════════════
    window.krsSubmitAssessment = async (docId, isEdit) => {
        const modal = document.getElementById('krs-assessModal');
        if (!modal) return;

        const buktiLengkap = modal.querySelector('#krs-bukti-lengkap').checked;
        const buktiBenar = modal.querySelector('#krs-bukti-benar').checked;
        const buktiTepatWaktu = modal.querySelector('#krs-bukti-tepat-waktu').checked;
        const hariTerlambat = parseInt(modal.querySelector('#krs-hari-terlambat').value) || 0;
        const sudahSrikandi = modal.querySelector('#krs-sudah-srikandi').checked;
        const suratSesuaiTND = modal.querySelector('#krs-surat-sesuai-tnd').checked;
        const jumlahSuratSalah = suratSesuaiTND ? 0 : (parseInt(modal.querySelector('#krs-jumlah-surat-salah').value) || 0);
        const catatan = modal.querySelector('textarea[name="krs-catatan"]').value;
        const user = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() : {};

        const btn = document.getElementById('krs-submit-assess-btn');
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span> Menyimpan...';

        try {
            const result = await jsonpFetch(APPS_SCRIPT_URL, {
                action: isEdit ? 'updateDocumentAssessment' : 'createDocumentAssessment',
                doc_id: docId,
                bukti_lengkap: buktiLengkap,
                bukti_benar: buktiBenar,
                bukti_tepat_waktu: buktiTepatWaktu,
                hari_terlambat: hariTerlambat,
                sudah_srikandi: sudahSrikandi,
                surat_sesuai_tnd: suratSesuaiTND,
                jumlah_surat_salah: jumlahSuratSalah,
                catatan,
                penilai_nama: user.name || 'Admin',
            });

            if (result && result.success) {
                if (window.showToast) showToast(
                    `${isEdit ? 'Penilaian berhasil diupdate' : 'Penilaian berhasil disimpan'}! Skor: ${result.nilai || '—'}/5`,
                    'success'
                );
                modal.remove();
                await loadDocuments();
            } else {
                const msg = (result && result.message) ? result.message : 'Terjadi kesalahan tidak diketahui';
                if (window.showToast) showToast('Gagal: ' + msg, 'error');
                btn.disabled = false;
                btn.innerHTML = orig;
            }
        } catch (error) {
            console.error('[Kearsipan] submitAssessment error:', error);
            if (window.showToast) showToast('Error: ' + error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    };

    // ══════════════════════════════════════════════════════════
    // DELETE DOCUMENT
    // ══════════════════════════════════════════════════════════
    window.krsConfirmDelete = (docId, btnEl) => {
        const doc = allDocuments.find(d => d.id === docId) || masterDocuments.find(d => d.id === docId);
        if (!doc) return;
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Dokumen Kearsipan?',
            message: `Pengirim: <strong>${doc.nama_pengirim || '-'}</strong><br>Unit: <strong>${doc.unit || '-'}</strong><br>Jenis: <strong>${doc.jenis_dokumen || '-'}</strong> · ${doc.bulan || '-'} ${doc.tahun || ''}<br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: 'Ya, Hapus',
            confirmClass: 'btn-danger',
        }, async () => {
            const orig = btnEl ? btnEl.innerHTML : null;
            if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '<span class="spinner spinner-sm"></span>'; }
            try {
                const result = await jsonpFetch(APPS_SCRIPT_URL, { action: 'deleteDocumentAssessment', doc_id: docId });
                if (result && result.success) {
                    if (window.showToast) showToast('Dokumen berhasil dihapus', 'success');
                    await loadDocuments();
                } else {
                    const msg = (result && result.message) ? result.message : 'Terjadi kesalahan';
                    if (window.showToast) showToast('Gagal menghapus: ' + msg, 'error');
                    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
                }
            } catch (error) {
                console.error('[Kearsipan] deleteDoc error:', error);
                if (window.showToast) showToast('Error: ' + error.message, 'error');
                if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = orig; }
            }
        });
    };

    // ══════════════════════════════════════════════════════════
    // REGISTER SECTION & INJECT HTML
    // ══════════════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['kearsipan'] = function () {
        const section = document.getElementById('section-kearsipan');
        if (!section) return;

        section.innerHTML = `
<style>
.krs-tab-content { display:none; }
.krs-tab-content.active { display:block; }
.score-section { background:#f8fafc; padding:16px; border-radius:8px; margin-bottom:16px; border-left:4px solid #3b82f6; }
.score-section-title { font-weight:600; color:#1e293b; margin-bottom:12px; font-size:15px; }
.score-preview { background:white; padding:20px; border-radius:8px; margin-bottom:16px; border:2px solid #e5e7eb; }
.score-preview-title { font-size:13px; color:#64748b; margin-bottom:8px; text-align:center; text-transform:uppercase; letter-spacing:.05em; }
.score-preview-value { font-size:36px; font-weight:700; color:#0f172a; text-align:center; }
.score-breakdown { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:12px; }
.score-item { text-align:center; padding:12px; background:#f8fafc; border-radius:6px; }
.score-item-label { font-size:11px; color:#64748b; margin-bottom:4px; }
.score-item-value { font-size:20px; font-weight:700; color:#1e293b; }
.checkbox-container { display:flex; align-items:center; gap:10px; margin-bottom:10px; cursor:pointer; }
.checkbox-container input[type="checkbox"] { appearance:none; -webkit-appearance:none; width:18px; height:18px; border-radius:5px; border:2px solid #cbd5e1; background:#fff; cursor:pointer; flex-shrink:0; transition:background .15s,border-color .15s,box-shadow .15s; position:relative; }
.checkbox-container input[type="checkbox"]:checked { background:#3b82f6; border-color:#3b82f6; box-shadow:0 0 0 3px #dbeafe; }
.checkbox-container input[type="checkbox"]:checked::after { content:''; position:absolute; top:2px; left:5px; width:5px; height:9px; border:2px solid #fff; border-top:none; border-left:none; transform:rotate(45deg); }
.checkbox-container input[type="checkbox"]:hover:not(:checked) { border-color:#93c5fd; box-shadow:0 0 0 3px #eff6ff; }
.form-textarea { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:6px; font-size:14px; font-family:inherit; resize:vertical; outline:none; transition:border-color .15s; box-sizing:border-box; }
.form-textarea:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.1); }
.alert { padding:12px 16px; border-radius:6px; font-size:13px; }
.alert-info { background:#eff6ff; border-left:4px solid #3b82f6; color:#1e3a8a; }
.info-box { background:#f8fafc; border:1px solid #e5e7eb; border-radius:6px; padding:14px 16px; }
.badge-assessed { background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.badge-pending  { background:#fef9c3; color:#a16207; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.krs-rekap-chip { display:inline-block; padding:3px 10px; border-radius:20px; font-size:13px; font-weight:700; }
.krs-rekap-great { background:#d1fae5; color:#065f46; }
.krs-rekap-good  { background:#dbeafe; color:#1e40af; }
.krs-rekap-fair  { background:#fef3c7; color:#92400e; }
.krs-rekap-poor  { background:#fee2e2; color:#991b1b; }
.krs-rekap-none  { background:#f1f5f9; color:#94a3b8; }
.krs-detail-section { background:#f8fafc; border-radius:10px; padding:14px; border:1px solid #f1f5f9; display:flex; flex-direction:column; gap:8px; }
.krs-detail-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#94a3b8; margin-bottom:4px; display:flex; align-items:center; gap:6px; }
.krs-detail-field-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-score-row { display:flex; align-items:flex-start; gap:10px; padding:10px; background:white; border-radius:8px; border:1px solid #f1f5f9; }
.krs-score-row-label { display:flex; align-items:center; gap:6px; font-weight:600; font-size:13px; color:#1e293b; min-width:110px; flex-shrink:0; }
.krs-score-badge { width:20px; height:20px; border-radius:50%; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-score-row-detail { flex:1; display:flex; flex-direction:column; gap:4px; }
.krs-score-sub-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:#64748b; }
.krs-score-chip { font-size:16px; font-weight:800; padding:6px 12px; border-radius:8px; flex-shrink:0; }
.krs-file-list { display:flex; flex-direction:column; gap:6px; }
.krs-file-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:white; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:inherit; transition:border-color .15s, box-shadow .15s; }
.krs-file-item:hover { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.08); }
.krs-file-icon { width:32px; height:32px; border-radius:8px; background:#eff6ff; color:#3b82f6; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.krs-file-info { flex:1; min-width:0; }
.krs-file-label { font-size:13px; font-weight:600; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-transform:capitalize; }
.krs-file-url { font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.krs-file-arrow { font-size:18px; color:#cbd5e1; flex-shrink:0; }
.krs-file-item:hover .krs-file-arrow { color:#3b82f6; }
.btn-icon-file { background:#eff6ff; color:#3b82f6; border:1px solid #bfdbfe; }
.btn-icon-file:hover { background:#dbeafe; border-color:#93c5fd; }
.krs-cards { display:none; padding:12px; }
.krs-card { background:white; border:1px solid #e5e7eb; border-radius:12px; padding:14px 16px; margin-bottom:10px; box-shadow:0 1px 3px rgba(0,0,0,.05); }
.krs-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
.krs-card-name { font-weight:700; font-size:14px; color:#1e293b; }
.krs-card-unit { font-size:12px; color:#64748b; margin-top:2px; }
.krs-card-body { display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; font-size:12.5px; margin-bottom:12px; }
.krs-card-label { color:#94a3b8; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:1px; }
.krs-card-value { color:#374151; font-weight:500; }
.krs-card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid #f1f5f9; }
.krs-card-nilai { font-size:22px; font-weight:800; color:#10b981; }
.krs-card-nilai-label { font-size:11px; color:#64748b; }
@media (max-width: 768px) {
    .krs-table-wrap { display:none !important; }
    .krs-cards { display:block !important; }
    .score-breakdown { grid-template-columns:1fr 1fr 1fr; }
}
@media (max-width: 420px) {
    .score-breakdown { grid-template-columns:1fr; }
    .krs-card-body { grid-template-columns:1fr; }
}
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Penilaian Kearsipan Internal</h1>
        <p class="section-page-subtitle">Sistem penilaian 3 komponen: Bukti Dukung, Srikandi, Surat Keluar · Nilai tersimpan di sheet REKAPITULASI DOKUMEN ARSIP</p>
    </div>

    <div class="stats-grid">
        <div class="stat-card" style="border-left:4px solid #10b981;">
            <div class="stat-label">Nilai Rata-rata</div>
            <div class="stat-value" id="krs-avg-score">0</div>
            <div class="stat-footer">Dari dokumen dinilai</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #3b82f6;">
            <div class="stat-label">Total Dinilai</div>
            <div class="stat-value" id="krs-total-assessed">0</div>
            <div class="stat-footer">Dokumen</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #f59e0b;">
            <div class="stat-label">Bulan Ini</div>
            <div class="stat-value" id="krs-this-month">0</div>
            <div class="stat-footer">Pengumpulan</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #8b5cf6;">
            <div class="stat-label">Pending</div>
            <div class="stat-value" id="krs-total-pending">0</div>
            <div class="stat-footer">Menunggu penilaian</div>
        </div>
    </div>

    <div class="tabs">
        <button class="tab krs-tab active" onclick="krsSwitchTab('dokumen',event)">📄 Dokumen</button>
        <button class="tab krs-tab" onclick="krsSwitchTab('rekap',event)">📊 Rekap Bulanan</button>
        <button class="tab krs-tab" onclick="krsSwitchTab('triwulan',event)">📅 Rekap Triwulan</button>
    </div>
    <div class="tabs-dropdown">
        <select onchange="krsSwitchTabDD(this.value)">
            <option value="dokumen">📄 Dokumen</option>
            <option value="rekap">📊 Rekap Bulanan</option>
            <option value="triwulan">📅 Rekap Triwulan</option>
        </select>
    </div>

    <div id="krs-tab-dokumen" class="krs-tab-content active">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Dokumen Kearsipan</h2>
                <div class="filter-container">
                    <select class="select-input" id="krs-bulan-filter" onchange="krsApplyFilters()">
                        <option value="">Semua Bulan</option>
                        <option value="Januari">Januari</option><option value="Februari">Februari</option>
                        <option value="Maret">Maret</option><option value="April">April</option>
                        <option value="Mei">Mei</option><option value="Juni">Juni</option>
                        <option value="Juli">Juli</option><option value="Agustus">Agustus</option>
                        <option value="September">September</option><option value="Oktober">Oktober</option>
                        <option value="November">November</option><option value="Desember">Desember</option>
                    </select>
                    <select class="select-input" id="krs-status-filter" onchange="krsApplyFilters()">
                        <option value="">Semua Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="ASSESSED">Sudah Dinilai</option>
                    </select>
                    <input type="text" class="search-input" id="krs-search-input" placeholder="Cari nama / unit / jenis..." oninput="krsApplyFilters()">
                    <button onclick="krsLoadDocuments()" class="btn btn-sm" title="Refresh Data">↺ Refresh</button>
                </div>
            </div>
            <div class="table-container krs-table-wrap">
                <table>
                    <thead><tr>
                        <th>Tanggal</th>
                        <th>Pengirim / Unit</th>
                        <th>Jenis Dokumen</th>
                        <th>Periode</th>
                        <th>Status</th>
                        <th style="text-align:center;">Nilai</th>
                        <th style="text-align:center;">Penilai</th>
                        <th>Catatan</th>
                        <th>Aksi</th>
                    </tr></thead>
                    <tbody id="krs-docs-tbody">
                        <tr><td colspan="9" style="text-align:center;padding:40px;">
                            <div class="spinner"></div>
                            <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                        </td></tr>
                    </tbody>
                </table>
            </div>
            <div class="krs-cards" id="krs-docs-cards"></div>
            <div class="pagination" id="krs-docs-pagination"></div>
        </div>
    </div>

    <div id="krs-tab-rekap" class="krs-tab-content">
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Rekapitulasi Penilaian Kearsipan</h2>
                <div class="filter-container">
                    <select class="select-input" id="krs-rekap-bulan-filter" onchange="krsApplyRekapFilter()">
                        <option value="">Semua Bulan</option>
                        <option value="Januari">Januari</option><option value="Februari">Februari</option>
                        <option value="Maret">Maret</option><option value="April">April</option>
                        <option value="Mei">Mei</option><option value="Juni">Juni</option>
                        <option value="Juli">Juli</option><option value="Agustus">Agustus</option>
                        <option value="September">September</option><option value="Oktober">Oktober</option>
                        <option value="November">November</option><option value="Desember">Desember</option>
                    </select>
                    <button onclick="krsLoadRekap()" class="btn btn-sm">↺ Refresh dari Sheet</button>
                </div>
            </div>
            <div class="card-content">
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#065f46;">
                    <strong>📋 Sumber Data:</strong> Sheet <code style="background:#dcfce7;padding:1px 5px;border-radius:3px;">REKAPITULASI DOKUMEN ARSIP</code>
                    · Skor utuh = 5 · Sanksi bukti = 0.1×jumlah · Sanksi surat = 0.1×⌊jumlah÷3⌋
                </div>
                <div id="krs-rekap-container">
                    <div style="text-align:center;padding:40px;color:#94a3b8;">
                        <div style="font-size:32px;margin-bottom:12px;">📊</div>
                        <div>Pilih bulan untuk melihat rekapitulasi nilai kearsipan dari sheet rekap</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="krs-tab-triwulan" class="krs-tab-content">
        <div class="card" style="margin-bottom:16px;">
            <div class="card-header">
                <h2 class="card-title">📅 Rekap Nilai Kearsipan Triwulanan</h2>
                <button onclick="krsRefreshTriwulan()" class="btn btn-sm">${ICONS.refresh} Refresh</button>
            </div>
            <div class="card-content">
                <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:10px 14px;font-size:13px;color:#1e3a8a;">
                    📌 <strong>Kriteria:</strong> TW I = Jan–Mar · TW II = Apr–Jun · TW III = Jul–Sep · TW IV = Okt–Des.
                    Nilai triwulan = rata-rata skor akhir bulan yang sudah dinilai dari sheet Rekapitulasi.
                </div>
            </div>
        </div>
        <div id="krs-triwulan-content">
            <div style="text-align:center;padding:60px;color:#94a3b8;"><div class="spinner"></div><div style="margin-top:12px;">Memuat rekap triwulan...</div></div>
        </div>
    </div>

</div>`;

        currentUser = (window.AUTH && window.AUTH.getUser) ? window.AUTH.getUser() || {} : {};
        setCurrentMonth();
        loadDocuments().then(() => applyFilters());
    };

})();