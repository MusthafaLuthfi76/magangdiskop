// ============================================================
// spj-pengumpulan.js — Pengumpulan SPJ section (SPA)
// Admin Panel — Dinas Koperasi UKM
// v6: Desain dirapikan, konsisten dengan pengajuan-dana.js
//     Status: TEPAT_WAKTU | TERLAMBAT | IZIN
//     Admin bisa override TERLAMBAT → TEPAT_WAKTU (izin)
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw8U7fNHneCo2Mi-nWdP-oeeRl8JYydgyMD_ghmepNt4onT8XPixOVF3GQFWqIsVRkb/exec';
    const CACHE_KEY       = 'spj_pengumpulan_cache_v6';
    const IZIN_KEY        = 'spj_izin_terlambat_v6';
    const CACHE_DURATION  = 5 * 60 * 1000;
    const ITEMS_PER_PAGE  = 10;
    const BATAS_TANGGAL   = 25;

    let allData        = [];
    let groupedData    = [];
    let filteredGroups = [];
    let currentPage    = 1;
    let izinSet        = new Set();

    const BULAN_MAP = {
        'januari':'JANUARI','februari':'FEBRUARI','maret':'MARET','april':'APRIL',
        'mei':'MEI','juni':'JUNI','juli':'JULI','agustus':'AGUSTUS',
        'september':'SEPTEMBER','oktober':'OKTOBER','november':'NOVEMBER','desember':'DESEMBER'
    };

    const ICONS = {
        refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        check:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x:       `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        history: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        shield:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        clock:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        eye:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    };

    // ── Izin Persistence ──────────────────────────────────────
    function loadIzinSet() {
        try {
            const raw = localStorage.getItem(IZIN_KEY);
            izinSet = raw ? new Set(JSON.parse(raw)) : new Set();
        } catch { izinSet = new Set(); }
    }
    function saveIzinSet() {
        try { localStorage.setItem(IZIN_KEY, JSON.stringify([...izinSet])); } catch {}
    }

    // ── Cache ─────────────────────────────────────────────────
    function getCachedData() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) return data;
            localStorage.removeItem(CACHE_KEY);
            return null;
        } catch { return null; }
    }
    function setCachedData(data) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch {}
    }
    window.spjpClearCache = function () { localStorage.removeItem(CACHE_KEY); };

    // ── Format Helpers ────────────────────────────────────────
    function formatTimestamp(ts) {
        if (!ts) return '-';
        try {
            const d = new Date(ts);
            if (isNaN(d.getTime())) return String(ts);
            const p = n => n.toString().padStart(2, '0');
            return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
        } catch { return String(ts); }
    }
    const fmtRupiah = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
    const fmtNum    = n => new Intl.NumberFormat('id-ID').format(n || 0);

    // ── Status Logic ──────────────────────────────────────────
    function getEntryWaktuStatus(entry, groupKey) {
        if (izinSet.has(groupKey)) return 'TEPAT_WAKTU';
        if (!entry.timestamp) return 'TEPAT_WAKTU';
        const d = new Date(entry.timestamp);
        if (isNaN(d.getTime())) return 'TEPAT_WAKTU';
        return d.getDate() > BATAS_TANGGAL ? 'TERLAMBAT' : 'TEPAT_WAKTU';
    }

    function getGroupWaktuStatus(g) {
        if (izinSet.has(g.key)) return 'IZIN';
        const latest = g.entries[0];
        if (!latest || !latest.timestamp) return 'TEPAT_WAKTU';
        const d = new Date(latest.timestamp);
        if (isNaN(d.getTime())) return 'TEPAT_WAKTU';
        return d.getDate() > BATAS_TANGGAL ? 'TERLAMBAT' : 'TEPAT_WAKTU';
    }

    // ── Status Badge HTML ─────────────────────────────────────
    function getStatusBadge(status) {
        if (status === 'TERLAMBAT') return `<span class="badge badge-rejected">${ICONS.clock} Terlambat</span>`;
        if (status === 'IZIN')      return `<span class="badge" style="background:#f5f3ff;color:#7c3aed;border:1px solid #c4b5fd;">${ICONS.shield} Izin Terlambat</span>`;
        return                              `<span class="badge badge-approved">${ICONS.check} Tepat Waktu</span>`;
    }

    // ── API (JSONP) ───────────────────────────────────────────
    function callAPI(params) {
        return new Promise((resolve, reject) => {
            const cb = 'jsonp_spjp_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
            window[cb] = data => { cleanup(); resolve(data); };
            const s = document.createElement('script');
            s.src = `${APPS_SCRIPT_URL}?${new URLSearchParams({ ...params, callback: cb })}`;
            const t = setTimeout(() => { cleanup(); reject(new Error('Timeout')); }, 15000);
            function cleanup() { clearTimeout(t); s.parentNode?.removeChild(s); delete window[cb]; }
            s.onerror = () => { cleanup(); reject(new Error('Network error')); };
            document.body.appendChild(s);
        });
    }

    // ── Grouping ──────────────────────────────────────────────
    function buildGroups(flatData) {
        const map = new Map();
        const sorted = [...flatData].sort((a, b) =>
            (new Date(b.timestamp).getTime()||0) - (new Date(a.timestamp).getTime()||0)
        );
        sorted.forEach(item => {
            const k = [
                (item.unit||'').trim(),
                (item.subKegiatan||'').trim(),
                (item.bulanSPJ||'').toUpperCase().trim()
            ].join('||');
            if (!map.has(k)) {
                map.set(k, {
                    key: k,
                    unit: (item.unit||'').trim(),
                    subKegiatan: (item.subKegiatan||'').trim(),
                    bulanSPJ: (item.bulanSPJ||'').toUpperCase().trim(),
                    nama: item.nama || '-',
                    entries: [],
                    totalNominal: 0,
                    nominalTepatWaktu: 0,
                    nominalTerlambat: 0,
                    latestTimestamp: null,
                    latestId: null,
                });
            }
            const g = map.get(k);
            g.entries.push(item);
        });

        const groups = [];
        map.forEach(g => {
            const latest = g.entries[0];
            g.latestTimestamp = latest.timestamp;
            g.latestId        = latest.id;
            g.nama            = latest.nama || '-';
            _recomputeGroup(g);
            groups.push(g);
        });

        groups.sort((a, b) =>
            (new Date(b.latestTimestamp).getTime()||0) - (new Date(a.latestTimestamp).getTime()||0)
        );
        return groups;
    }

    function _recomputeGroup(g) {
        g.nominalTepatWaktu = 0;
        g.nominalTerlambat  = 0;
        g.entries.forEach(entry => {
            const ws  = getEntryWaktuStatus(entry, g.key);
            const nom = parseFloat(entry.nominalSPJMasuk) || 0;
            if (ws === 'TEPAT_WAKTU') g.nominalTepatWaktu += nom;
            else g.nominalTerlambat += nom;
        });
        g.totalNominal = g.nominalTepatWaktu + g.nominalTerlambat;
    }

    function recomputeAllNominals() {
        groupedData.forEach(g => _recomputeGroup(g));
    }

    // ── Encode / Decode group key ─────────────────────────────
    function encodeGK(key) { return btoa(encodeURIComponent(key)).replace(/=/g,'_'); }
    function decodeGK(enc) { return decodeURIComponent(atob(enc.replace(/_/g,'='))); }
    function getGroupByGK(enc) {
        const key = decodeGK(enc);
        return groupedData.find(g => g.key === key) || null;
    }

    // ── Load Data ─────────────────────────────────────────────
    window.spjpLoadData = async function (forceRefresh = false) {
        loadIzinSet();
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                allData = cached;
                groupedData = buildGroups(allData);
                filteredGroups = [...groupedData];
                currentPage = 1;
                renderTable();
                updateStats();
                return;
            }
        }
        setLoadingState();
        try {
            const result = await callAPI({ action: 'getPenyampaianSPJ' });
            if (result && result.success) {
                allData = result.data || [];
                setCachedData(allData);
                groupedData = buildGroups(allData);
                filteredGroups = [...groupedData];
                currentPage = 1;
                renderTable();
                updateStats();
            } else {
                showError('Gagal memuat data: ' + (result?.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Gagal menghubungi server: ' + err.message);
        }
    };

    function setLoadingState() {
        const tbody = document.getElementById('spjp-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;">
            <div class="spinner"></div>
            <div style="margin-top:12px;color:#94a3b8;font-size:14px;">Memuat data...</div>
        </td></tr>`;
        const pgn = document.getElementById('spjp-pagination');
        if (pgn) pgn.innerHTML = '';
    }

    function showError(msg) {
        const tbody = document.getElementById('spjp-data-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#ef4444;">${msg}
            <br><button onclick="spjpLoadData(true)" class="btn btn-sm" style="margin-top:12px;">Coba Lagi</button>
        </td></tr>`;
    }

    // ── Filter ────────────────────────────────────────────────
    window.spjpFilterData = function () {
        filteredGroups = _buildFilteredList();
        currentPage = 1;
        renderTable();
        updateStats();
    };

    function _buildFilteredList() {
        const bulan  = (document.getElementById('spjp-filter-bulan')?.value || '').toUpperCase();
        const unit   =  document.getElementById('spjp-filter-unit')?.value || '';
        const waktu  =  document.getElementById('spjp-filter-waktu')?.value || '';
        const search = (document.getElementById('spjp-search')?.value || '').toLowerCase();

        return groupedData.filter(g => {
            const ws = getGroupWaktuStatus(g);
            if (bulan  && g.bulanSPJ !== bulan)  return false;
            if (unit   && g.unit !== unit)        return false;
            if (waktu) {
                if (waktu === 'tepat'    && ws !== 'TEPAT_WAKTU') return false;
                if (waktu === 'terlambat'&& ws !== 'TERLAMBAT')   return false;
                if (waktu === 'izin'     && ws !== 'IZIN')        return false;
            }
            if (search &&
                !(g.nama||'').toLowerCase().includes(search) &&
                !(g.subKegiatan||'').toLowerCase().includes(search) &&
                !(g.unit||'').toLowerCase().includes(search)) return false;
            return true;
        });
    }

    // ── Render Table ──────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('spjp-data-tbody');
        const pgn   = document.getElementById('spjp-pagination');

        if (!filteredGroups.length) {
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;">
                Tidak ada data yang sesuai filter.</td></tr>`;
            if (pgn) pgn.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const items = filteredGroups.slice(start, start + ITEMS_PER_PAGE);

        if (tbody) tbody.innerHTML = items.map(g => renderRow(g)).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="spjpChangePage(${currentPage-1})" ${currentPage===1?'disabled':''}>&#8249; Prev</button>
            <span class="pagination-info">Halaman ${currentPage} / ${totalPages} (${filteredGroups.length} grup)</span>
            <button onclick="spjpChangePage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Next &#8250;</button>`;
    }

    function renderRow(g) {
        const gk  = encodeGK(g.key);
        const ws  = getGroupWaktuStatus(g);
        const cnt = g.entries.length;

        const countBadge = cnt > 1
            ? `<span style="display:inline-flex;align-items:center;background:#eff6ff;color:#3b82f6;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;margin-left:6px;border:1px solid #bfdbfe;vertical-align:middle;">${cnt}×</span>`
            : '';

        // Tombol izin/cabut konsisten dengan btn-icon-group
        let izinBtn = '';
        if (ws === 'TERLAMBAT') {
            izinBtn = `<button onclick="spjpBeriIzin('${gk}')" class="btn-icon btn-icon-approve" title="Beri Izin Terlambat">${ICONS.shield}</button>`;
        } else if (ws === 'IZIN') {
            izinBtn = `<button onclick="spjpCabutIzin('${gk}')" class="btn-icon btn-icon-reject" title="Cabut Izin Terlambat">${ICONS.x}</button>`;
        }

        return `<tr>
            <td style="font-size:.82rem;color:#64748b;white-space:nowrap;">${formatTimestamp(g.latestTimestamp)}</td>
            <td style="font-weight:500;">${g.nama||'-'}</td>
            <td>${g.unit||'-'}</td>
            <td style="min-width:180px;">${g.subKegiatan||'-'} ${countBadge}</td>
            <td>${g.bulanSPJ||'-'}</td>
            <td>
                <div style="display:flex;flex-direction:column;gap:3px;min-width:200px;">
                    <div style="display:flex;align-items:center;gap:5px;font-size:12px;">
                        <span style="width:7px;height:7px;border-radius:50%;background:#10b981;flex-shrink:0;display:inline-block;"></span>
                        <span style="color:#64748b;min-width:38px;">Tepat</span>
                        <span style="font-weight:600;color:#0f172a;">${fmtRupiah(g.nominalTepatWaktu)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;font-size:12px;">
                        <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;flex-shrink:0;display:inline-block;"></span>
                        <span style="color:#64748b;min-width:38px;">Lambat</span>
                        <span style="font-weight:600;color:#0f172a;">${fmtRupiah(g.nominalTerlambat)}</span>
                    </div>
                    <div style="font-size:11px;color:#94a3b8;padding-top:3px;border-top:1px dashed #e2e8f0;margin-top:2px;">
                        Total: <strong>${fmtRupiah(g.totalNominal)}</strong>
                    </div>
                </div>
            </td>
            <td style="text-align:center;vertical-align:middle;">${getStatusBadge(ws)}</td>
            <td>
                <div class="action-buttons"><div class="btn-icon-group">
                    <button onclick="spjpOpenHistoryModal('${gk}')" class="btn-icon btn-icon-view" title="Riwayat (${cnt})">${ICONS.history}</button>
                    ${izinBtn}
                    <button onclick="spjpDeleteGroup('${gk}')" class="btn-icon btn-icon-delete" title="Hapus semua entry">${ICONS.trash}</button>
                </div></div>
            </td>
        </tr>`;
    }

    window.spjpChangePage = function (page) {
        const total = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
        if (page < 1 || page > total) return;
        currentPage = page;
        renderTable();
    };

    // ── Stats ─────────────────────────────────────────────────
    function updateStats() {
        const now = new Date();
        const curMonth = BULAN_MAP[now.toLocaleString('id-ID',{month:'long'}).toLowerCase()] || '';
        const grupsIni  = groupedData.filter(g => g.bulanSPJ === curMonth);

        const tepat     = filteredGroups.filter(g => getGroupWaktuStatus(g) === 'TEPAT_WAKTU').length;
        const terlambat = filteredGroups.filter(g => getGroupWaktuStatus(g) === 'TERLAMBAT').length;
        const izin      = filteredGroups.filter(g => getGroupWaktuStatus(g) === 'IZIN').length;
        const nomTepat  = filteredGroups.reduce((s,g) => s + g.nominalTepatWaktu, 0);
        const nomLambat = filteredGroups.reduce((s,g) => s + g.nominalTerlambat, 0);

        const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
        set('spjp-total-grup',      groupedData.length);
        set('spjp-bulan-ini-count', grupsIni.length);
        set('spjp-bulan-ini-label', `${curMonth} ${now.getFullYear()}`);
        set('spjp-stat-tepat',      tepat);
        set('spjp-stat-terlambat',  terlambat);
        set('spjp-stat-izin',       izin);
        set('spjp-nom-tepat',       fmtRupiah(nomTepat));
        set('spjp-nom-lambat',      fmtRupiah(nomLambat));
        set('spjp-nom-total',       fmtRupiah(nomTepat + nomLambat));
    }

    // ── Beri / Cabut Izin ─────────────────────────────────────
    window.spjpBeriIzin = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        showConfirmModal({
            icon: '🛡️',
            title: 'Beri Izin Terlambat?',
            message: `<strong>${g.nama}</strong><br>${g.subKegiatan} · ${g.bulanSPJ}
                <br><br>Grup ini akan dianggap <strong style="color:#10b981;">Tepat Waktu</strong> meskipun submit setelah tanggal ${BATAS_TANGGAL}.
                <br>Seluruh nominal akan dipindahkan ke kolom <em>Tepat Waktu</em>.`,
            confirmText: 'Ya, Beri Izin',
            confirmClass: 'btn-primary',
        }, () => {
            izinSet.add(g.key);
            saveIzinSet();
            recomputeAllNominals();
            filteredGroups = _buildFilteredList();
            renderTable();
            updateStats();
            if (window.showToast) showToast('Izin terlambat diberikan', 'success');
        });
    };

    window.spjpCabutIzin = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        showConfirmModal({
            icon: '🔒',
            title: 'Cabut Izin Terlambat?',
            message: `<strong>${g.nama}</strong><br>${g.subKegiatan} · ${g.bulanSPJ}
                <br><br>Status akan kembali ke <strong style="color:#ef4444;">Terlambat</strong> dan nominal akan dipindahkan ke kolom terlambat.`,
            confirmText: 'Ya, Cabut Izin',
            confirmClass: 'btn-warning',
        }, () => {
            izinSet.delete(g.key);
            saveIzinSet();
            recomputeAllNominals();
            filteredGroups = _buildFilteredList();
            renderTable();
            updateStats();
            if (window.showToast) showToast('Izin terlambat dicabut', 'success');
        });
    };

    // ── Delete Group ──────────────────────────────────────────
    window.spjpDeleteGroup = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        const cnt = g.entries.length;
        showConfirmModal({
            icon: '🗑️',
            title: 'Hapus Semua Entry Grup Ini?',
            message: `<strong>${g.subKegiatan}</strong><br>${g.unit} · ${g.bulanSPJ}
                <br><br>Akan menghapus <strong>${cnt} entry</strong> (Total: ${fmtRupiah(g.totalNominal)}).
                <br><br><span style="color:#ef4444;font-weight:600;">Tindakan ini tidak dapat dibatalkan.</span>`,
            confirmText: `Hapus ${cnt} Entry`,
            confirmClass: 'btn-danger',
        }, async () => {
            try {
                for (const entry of g.entries) {
                    await callAPI({ action: 'deletePenyampaianSPJ', id: entry.id });
                }
                izinSet.delete(g.key);
                saveIzinSet();
                if (window.showToast) showToast(`${cnt} entry berhasil dihapus`, 'success');
                window.spjpClearCache();
                await window.spjpLoadData(true);
            } catch (err) {
                if (window.showToast) showToast('Gagal: ' + err.message, 'error');
            }
        });
    };

    // ── History Modal ─────────────────────────────────────────
    window.spjpOpenHistoryModal = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        const ex = document.getElementById('spjp-history-modal');
        if (ex) ex.remove();

        const ws      = getGroupWaktuStatus(g);
        const hasIzin = izinSet.has(g.key);
        const cntTepat  = g.entries.filter(e => getEntryWaktuStatus(e, g.key) === 'TEPAT_WAKTU').length;
        const cntLambat = g.entries.filter(e => getEntryWaktuStatus(e, g.key) === 'TERLAMBAT').length;

        const entryRows = g.entries.map((entry, i) => {
            const ews      = getEntryWaktuStatus(entry, g.key);
            const nom      = parseFloat(entry.nominalSPJMasuk) || 0;
            const isLatest = i === 0;
            const d        = new Date(entry.timestamp);
            const tgl      = isNaN(d.getTime()) ? '-' : d.getDate();
            const overBatas = !isNaN(d.getTime()) && tgl > BATAS_TANGGAL;

            return `<div style="background:#fff;border:1.5px solid ${isLatest ? '#bfdbfe' : '#f1f5f9'};border-radius:12px;overflow:hidden;${isLatest ? 'background:#f8fbff;' : ''}">
                <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid #f1f5f9;gap:8px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                        <div style="width:28px;height:28px;border-radius:50%;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${g.entries.length - i}</div>
                        <div style="min-width:0;">
                            <div style="font-size:13px;font-weight:600;color:#1e293b;">
                                ${formatTimestamp(entry.timestamp)}
                                ${isLatest ? '<span style="display:inline-block;background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;margin-left:6px;">Terbaru</span>' : ''}
                            </div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                                Tgl submit: <strong>${tgl}</strong>
                                ${overBatas && !hasIzin ? '<span style="color:#dc2626;margin-left:4px;">· melewati batas tgl 25</span>' : ''}
                                ${hasIzin ? '<span style="color:#7c3aed;margin-left:4px;">· diberi izin admin</span>' : ''}
                            </div>
                        </div>
                    </div>
                    ${getStatusBadge(ews)}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 14px;">
                    <div>
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;">Nominal</div>
                        <div style="font-size:15px;font-weight:600;color:#1e293b;margin-top:2px;">${fmtRupiah(nom)}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;">Masuk ke Kolom</div>
                        <div style="font-size:13px;font-weight:600;margin-top:2px;color:${ews === 'TEPAT_WAKTU' ? '#059669' : '#dc2626'};">
                            ${ews === 'TEPAT_WAKTU' ? '✅ Tepat Waktu' : '⏰ Terlambat'}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;">Nama</div>
                        <div style="font-size:13px;font-weight:600;color:#1e293b;margin-top:2px;">${entry.nama||'-'}</div>
                    </div>
                    <div>
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;">ID Entry</div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${entry.id||'-'}</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Tombol izin di footer modal
        let izinFooterBtn = '';
        if (ws === 'TERLAMBAT') {
            izinFooterBtn = `<button onclick="spjpBeriIzin('${gk}');document.getElementById('spjp-history-modal').remove();"
                class="btn btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;">
                ${ICONS.shield} Beri Izin Terlambat</button>`;
        } else if (ws === 'IZIN') {
            izinFooterBtn = `<button onclick="spjpCabutIzin('${gk}');document.getElementById('spjp-history-modal').remove();"
                class="btn" style="flex:1;background:#fee2e2;color:#dc2626;border:none;display:flex;align-items:center;justify-content:center;gap:6px;">
                ${ICONS.x} Cabut Izin</button>`;
        }

        const modal = document.createElement('div');
        modal.id = 'spjp-history-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
        <div class="modal" style="max-width:640px;width:100%;">
            <div class="modal-header">
                <h2 class="modal-title">Riwayat Pengumpulan SPJ</h2>
                <p style="font-size:13px;color:#64748b;margin-top:4px;">${g.subKegiatan||'-'} · ${g.unit}</p>
            </div>
            <div class="modal-content" style="padding:0;overflow:hidden;">

                <!-- Strip info atas -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #f1f5f9;">
                    <div style="padding:14px 16px;border-right:1px solid #f1f5f9;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">Bulan SPJ</div>
                        <div style="font-size:14px;font-weight:700;color:#1e293b;">${g.bulanSPJ}</div>
                    </div>
                    <div style="padding:14px 16px;border-right:1px solid #f1f5f9;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">Total Entry</div>
                        <div style="font-size:14px;font-weight:700;color:#1e293b;">${g.entries.length}×</div>
                    </div>
                    <div style="padding:14px 16px;border-right:1px solid #f1f5f9;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">Status Grup</div>
                        <div style="margin-top:2px;">${getStatusBadge(ws)}</div>
                    </div>
                    <div style="padding:14px 16px;background:#fffbeb;">
                        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;">Batas Tgl</div>
                        <div style="font-size:14px;font-weight:700;color:#1e293b;">≤ ${BATAS_TANGGAL}${hasIzin ? ' <span style="color:#7c3aed;font-size:11px;">(izin)</span>' : ''}</div>
                    </div>
                </div>

                <!-- Nominal breakdown -->
                <div style="display:grid;grid-template-columns:1fr 1fr;margin:16px 16px 0;border-radius:12px;overflow:hidden;border:1.5px solid #e2e8f0;">
                    <div style="padding:16px;background:#ecfdf5;border-right:1px solid #e2e8f0;">
                        <div style="font-size:12px;font-weight:700;color:#059669;margin-bottom:6px;">✅ Total Nominal Tepat Waktu</div>
                        <div style="font-size:20px;font-weight:800;color:#0f172a;">${fmtRupiah(g.nominalTepatWaktu)}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:3px;">${cntTepat} entry</div>
                    </div>
                    <div style="padding:16px;background:#fef2f2;">
                        <div style="font-size:12px;font-weight:700;color:#dc2626;margin-bottom:6px;">⏰ Total Nominal Terlambat</div>
                        <div style="font-size:20px;font-weight:800;color:#0f172a;">${fmtRupiah(g.nominalTerlambat)}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:3px;">${cntLambat} entry</div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px 14px;font-size:13px;color:#475569;border-bottom:1px solid #f1f5f9;margin:0 16px;">
                    <span>Grand Total Keseluruhan</span>
                    <strong style="font-size:15px;">${fmtRupiah(g.totalNominal)}</strong>
                </div>

                <!-- Timeline entries -->
                <div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding:16px;">
                    ${entryRows}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('spjp-history-modal').remove()" class="btn" style="flex:1;">Tutup</button>
                ${izinFooterBtn}
            </div>
        </div>`;

        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ═══════════════════════════════════════════════════════════
    // HTML INJECT & SECTION INIT
    // ═══════════════════════════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['spj-pengumpulan'] = function () {
        const section = document.getElementById('section-spj-pengumpulan');
        if (!section) return;

        section.innerHTML = `
<style>
/* ── Layout & Spacing ─── */
#section-spj-pengumpulan .container { max-width:1200px; margin:0 auto; }

/* ── Stat Cards Grid ─── */
.spjp-stats-overview {
    display:grid; 
    grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); 
    gap:16px;
    margin-bottom:24px;
}
.spjp-stat-item {
    background:#fff;
    border:1px solid #e2e8f0;
    border-radius:12px;
    padding:20px;
    transition:all .2s;
}
.spjp-stat-item:hover {
    box-shadow:0 4px 12px rgba(0,0,0,0.08);
    border-color:#cbd5e1;
}
.spjp-stat-item.stat-tepat { border-left:5px solid #10b981; }
.spjp-stat-item.stat-terlambat { border-left:5px solid #ef4444; }
.spjp-stat-item.stat-izin { border-left:5px solid #7c3aed; }
.spjp-stat-item.stat-bulan { border-left:5px solid #3b82f6; }
.spjp-stat-item.stat-total { border-left:5px solid #64748b; }
.spjp-stat-label {
    font-size:12px;
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.03em;
    color:#64748b;
    margin-bottom:8px;
}
.spjp-stat-value {
    font-size:28px;
    font-weight:800;
    color:#0f172a;
    margin-bottom:4px;
}
.spjp-stat-footer {
    font-size:12px;
    color:#94a3b8;
}
.spjp-stat-clickable {
    cursor:pointer;
}
.spjp-stat-clickable:hover {
    background:#f8fafc;
}

/* ── Nominal Cards ─── */
.spjp-nom-summary {
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));
    gap:16px;
    margin-bottom:24px;
}
.spjp-nom-card {
    background:#fff;
    border:1px solid #e2e8f0;
    border-radius:12px;
    padding:24px;
    position:relative;
    overflow:hidden;
    transition:all .2s;
}
.spjp-nom-card::before {
    content:'';
    position:absolute;
    top:0;
    left:0;
    right:0;
    height:4px;
    background:linear-gradient(90deg, #10b981, #34d399);
}
.spjp-nom-card.lambat::before {
    background:linear-gradient(90deg, #ef4444, #f87171);
}
.spjp-nom-card.total::before {
    background:linear-gradient(90deg, #3b82f6, #60a5fa);
}
.spjp-nom-card:hover {
    box-shadow:0 4px 12px rgba(0,0,0,0.08);
    border-color:#cbd5e1;
}
.spjp-nom-label {
    font-size:11px;
    font-weight:700;
    text-transform:uppercase;
    letter-spacing:.05em;
    margin-bottom:6px;
}
.spjp-nom-card.tepat .spjp-nom-label { color:#059669; }
.spjp-nom-card.lambat .spjp-nom-label { color:#dc2626; }
.spjp-nom-card.total .spjp-nom-label { color:#1e40af; }
.spjp-nom-value {
    font-size:24px;
    font-weight:800;
    color:#0f172a;
    margin-bottom:6px;
}
.spjp-nom-sub {
    font-size:12px;
    color:#94a3b8;
}

/* ── Kolom tabel ─── */
#spjp-data-tbody tr td:nth-child(7) { text-align:center; vertical-align:middle; }
#spjp-data-tbody tr { vertical-align:middle; }

/* ── Stat klik filter ─── */
.spjp-stat-clickable { cursor:pointer; transition:box-shadow .15s, transform .1s; }
.spjp-stat-clickable:hover { box-shadow:0 0 0 2px #bfdbfe; transform:translateY(-1px); }
</style>

<div class="container">

    <!-- Page header -->
    <div class="section-page-header">
        <h1 class="section-page-title">Pengumpulan SPJ Keuangan</h1>
        <p class="section-page-subtitle">Rekap ketepatan waktu penyampaian SPJ — batas tanggal <strong>${BATAS_TANGGAL}</strong> tiap bulan</p>
    </div>

    <!-- Stat cards utama (4 grid) -->
    <div class="spjp-stats-overview">
        <div class="spjp-stat-item stat-total">
            <div class="spjp-stat-label">📊 Total Grup SPJ</div>
            <div class="spjp-stat-value" id="spjp-total-grup">0</div>
            <div class="spjp-stat-footer">Sub kegiatan unik</div>
        </div>
        <div class="spjp-stat-item stat-bulan">
            <div class="spjp-stat-label">📅 Bulan Ini</div>
            <div class="spjp-stat-value" id="spjp-bulan-ini-count">0</div>
            <div class="spjp-stat-footer" id="spjp-bulan-ini-label">—</div>
        </div>
        <div class="spjp-stat-item stat-tepat spjp-stat-clickable"
            onclick="document.getElementById('spjp-filter-waktu').value='tepat';spjpFilterData();"
            title="Klik untuk filter">
            <div class="spjp-stat-label">✅ Tepat Waktu</div>
            <div class="spjp-stat-value" id="spjp-stat-tepat" style="color:#059669;">0</div>
            <div class="spjp-stat-footer">Klik untuk filter</div>
        </div>
        <div class="spjp-stat-item stat-terlambat spjp-stat-clickable"
            onclick="document.getElementById('spjp-filter-waktu').value='terlambat';spjpFilterData();"
            title="Klik untuk filter">
            <div class="spjp-stat-label">⏰ Terlambat</div>
            <div class="spjp-stat-value" id="spjp-stat-terlambat" style="color:#dc2626;">0</div>
            <div class="spjp-stat-footer">Klik untuk filter</div>
        </div>
        <div class="spjp-stat-item stat-izin spjp-stat-clickable"
            onclick="document.getElementById('spjp-filter-waktu').value='izin';spjpFilterData();"
            title="Klik untuk filter">
            <div class="spjp-stat-label">🛡️ Izin Terlambat</div>
            <div class="spjp-stat-value" id="spjp-stat-izin" style="color:#7c3aed;">0</div>
            <div class="spjp-stat-footer">Klik untuk filter</div>
        </div>
    </div>

    <!-- Nominal summary cards -->
    <div class="spjp-nom-summary">
        <div class="spjp-nom-card tepat">
            <div class="spjp-nom-label">✅ Total Nominal Tepat Waktu</div>
            <div class="spjp-nom-value" id="spjp-nom-tepat">Rp 0</div>
            <div class="spjp-nom-sub">dari data yang sudah difilter</div>
        </div>
        <div class="spjp-nom-card lambat">
            <div class="spjp-nom-label">⏰ Total Nominal Terlambat</div>
            <div class="spjp-nom-value" id="spjp-nom-lambat">Rp 0</div>
            <div class="spjp-nom-sub">dari data yang sudah difilter</div>
        </div>
        <div class="spjp-nom-card total">
            <div class="spjp-nom-label">💰 Total Keseluruhan</div>
            <div class="spjp-nom-value" id="spjp-nom-total">Rp 0</div>
            <div class="spjp-nom-sub">nominal tepat + terlambat</div>
        </div>
    </div>

    <!-- Tabel card -->
    <div class="card">
        <div class="card-header">
            <h2 class="card-title">Daftar Pengumpulan SPJ</h2>
            <div class="filter-container">
                <select class="select-input" id="spjp-filter-bulan" onchange="spjpFilterData()">
                    <option value="">Semua Bulan</option>
                    <option value="JANUARI">Januari</option><option value="FEBRUARI">Februari</option>
                    <option value="MARET">Maret</option><option value="APRIL">April</option>
                    <option value="MEI">Mei</option><option value="JUNI">Juni</option>
                    <option value="JULI">Juli</option><option value="AGUSTUS">Agustus</option>
                    <option value="SEPTEMBER">September</option><option value="OKTOBER">Oktober</option>
                    <option value="NOVEMBER">November</option><option value="DESEMBER">Desember</option>
                </select>
                <select class="select-input" id="spjp-filter-unit" onchange="spjpFilterData()">
                    <option value="">Semua Unit</option>
                    <option value="Sekretariat">Sekretariat</option>
                    <option value="Balai Layanan Usaha Terpadu KUMKM">BLUT KUMKM</option>
                    <option value="Bidang Kewirausahaan">Bid. Kewirausahaan</option>
                    <option value="Bidang Koperasi">Bid. Koperasi</option>
                    <option value="Bidang UKM">Bid. UKM</option>
                    <option value="Bidang Usaha Mikro">Bid. Usaha Mikro</option>
                </select>
                <select class="select-input" id="spjp-filter-waktu" onchange="spjpFilterData()">
                    <option value="">Semua Ketepatan</option>
                    <option value="tepat">✅ Tepat Waktu</option>
                    <option value="terlambat">⏰ Terlambat</option>
                    <option value="izin">🛡️ Izin Terlambat</option>
                </select>
                <input type="text" class="search-input" id="spjp-search"
                    placeholder="Cari nama / sub kegiatan / unit..." oninput="spjpFilterData()">
                <button onclick="spjpLoadData(true)" class="btn btn-sm" title="Refresh Data">
                    ${ICONS.refresh} Refresh
                </button>
            </div>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Terakhir Submit</th>
                        <th>Nama</th>
                        <th>Unit / Bidang</th>
                        <th>Sub Kegiatan</th>
                        <th>Bulan</th>
                        <th>Nominal</th>
                        <th style="text-align:center;min-width:130px;">Ketepatan Waktu</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody id="spjp-data-tbody">
                    <tr><td colspan="8" style="text-align:center;padding:48px;">
                        <div class="spinner"></div>
                        <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                    </td></tr>
                </tbody>
            </table>
        </div>

        <div class="pagination" id="spjp-pagination"></div>
    </div>

</div>`;

        // Set filter bulan ke bulan ini
        const curMonthName = new Date().toLocaleString('id-ID',{month:'long'}).toUpperCase();
        const fMonth = document.getElementById('spjp-filter-bulan');
        if (fMonth) fMonth.value = curMonthName;

        window.spjpLoadData(false).then(() => window.spjpFilterData());
    };

})();