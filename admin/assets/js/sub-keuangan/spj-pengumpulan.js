// ============================================================
// spj-pengumpulan.js — Pengumpulan SPJ section (SPA)
// Admin Panel — Dinas Koperasi UKM
// v5: status = TEPAT_WAKTU | TERLAMBAT (auto dari tanggal submit)
//     Admin bisa override TERLAMBAT → TEPAT_WAKTU (izin)
//     Riwayat: breakdown nominal tepat waktu vs terlambat
// ============================================================
(function () {
    'use strict';

    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec';
    const CACHE_KEY       = 'spj_pengumpulan_cache_v5';
    const IZIN_KEY        = 'spj_izin_terlambat_v5';
    const CACHE_DURATION  = 5 * 60 * 1000;
    const ITEMS_PER_PAGE  = 10;
    const BATAS_TANGGAL   = 25;

    let allData        = [];
    let groupedData    = [];
    let filteredGroups = [];
    let currentPage    = 1;

    // Set of group keys yang diberi izin terlambat oleh admin (simpan lokal)
    let izinSet = new Set();

    const BULAN_MAP = {
        'januari':'JANUARI','februari':'FEBRUARI','maret':'MARET','april':'APRIL',
        'mei':'MEI','juni':'JUNI','juli':'JULI','agustus':'AGUSTUS',
        'september':'SEPTEMBER','oktober':'OKTOBER','november':'NOVEMBER','desember':'DESEMBER'
    };

    const ICONS = {
        refresh:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        check:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
        x:        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
        trash:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
        save:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
        history:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        shield:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
        pencil:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        clock:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
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

    // ── Format ────────────────────────────────────────────────
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

    // ── Logika Ketepatan Waktu ────────────────────────────────
    /**
     * Status per ENTRY berdasarkan tanggal submit.
     * Jika grup punya izin → semua entry dianggap TEPAT_WAKTU.
     */
    function getEntryWaktuStatus(entry, groupKey) {
        if (izinSet.has(groupKey)) return 'TEPAT_WAKTU';
        if (!entry.timestamp) return 'TEPAT_WAKTU';
        const d = new Date(entry.timestamp);
        if (isNaN(d.getTime())) return 'TEPAT_WAKTU';
        return d.getDate() > BATAS_TANGGAL ? 'TERLAMBAT' : 'TEPAT_WAKTU';
    }

    /**
     * Status GRUP = ditentukan dari entry terbaru.
     * IZIN     = grup sudah diberi izin admin
     * TERLAMBAT = entry terbaru submit > tgl 25
     * TEPAT_WAKTU = entry terbaru submit ≤ tgl 25
     */
    function getGroupWaktuStatus(g) {
        if (izinSet.has(g.key)) return 'IZIN';
        const latest = g.entries[0];
        if (!latest || !latest.timestamp) return 'TEPAT_WAKTU';
        const d = new Date(latest.timestamp);
        if (isNaN(d.getTime())) return 'TEPAT_WAKTU';
        return d.getDate() > BATAS_TANGGAL ? 'TERLAMBAT' : 'TEPAT_WAKTU';
    }

    function getWaktuBadgeProps(status) {
        if (status === 'TERLAMBAT') return { label:'Terlambat',      color:'#dc2626', bg:'#fef2f2', border:'#fca5a5', icon: ICONS.clock  };
        if (status === 'IZIN')      return { label:'Izin Terlambat', color:'#7c3aed', bg:'#f5f3ff', border:'#c4b5fd', icon: ICONS.shield };
        return                             { label:'Tepat Waktu',    color:'#059669', bg:'#ecfdf5', border:'#6ee7b7', icon: ICONS.check  };
    }

    // ── API ───────────────────────────────────────────────────
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
            g.totalNominal += parseFloat(item.nominalSPJMasuk) || 0;
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

    // ── Load Data ─────────────────────────────────────────────
    window.spjpLoadData = async function (forceRefresh = false) {
        loadIzinSet();
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                allData = cached;
                groupedData = buildGroups(allData);
                filteredGroups = [...groupedData];
                currentPage = 1; renderTable(); updateStats(); return;
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
                currentPage = 1; renderTable(); updateStats();
            } else {
                showError('Gagal memuat data: ' + (result?.message || 'Unknown error'));
            }
        } catch (err) {
            showError('Gagal menghubungi server: ' + err.message);
        }
    };

    function setLoadingState() {
        const html = `<div style="text-align:center;padding:48px 20px;">
            <div class="spinner"></div>
            <div style="margin-top:12px;color:#94a3b8;font-size:14px;">Memuat data...</div>
        </div>`;
        const tbody = document.getElementById('spjp-data-tbody');
        const ml    = document.getElementById('spjp-mobile-list');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="padding:0;">${html}</td></tr>`;
        if (ml)    ml.innerHTML = html;
        const pgn = document.getElementById('spjp-pagination');
        if (pgn) pgn.innerHTML = '';
    }

    function showError(msg) {
        const html = `<div style="text-align:center;padding:40px;color:#ef4444;">
            ${msg}<br>
            <button onclick="spjpLoadData(true)" class="btn btn-sm" style="margin-top:12px;">Coba Lagi</button>
        </div>`;
        const tbody = document.getElementById('spjp-data-tbody');
        const ml    = document.getElementById('spjp-mobile-list');
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="padding:0;">${html}</td></tr>`;
        if (ml)    ml.innerHTML = html;
    }

    // ── Filter ────────────────────────────────────────────────
    window.spjpFilterData = function () {
        filteredGroups = _buildFilteredList();
        currentPage = 1; renderTable(); updateStats();
    };

    function _buildFilteredList() {
        const bulan  = (document.getElementById('spjp-filter-bulan')?.value || '').toUpperCase();
        const unit   =  document.getElementById('spjp-filter-unit')?.value || '';
        const waktu  =  document.getElementById('spjp-filter-waktu')?.value || '';
        const search = (document.getElementById('spjp-search-nama')?.value || '').toLowerCase();

        return groupedData.filter(g => {
            const ws = getGroupWaktuStatus(g);
            if (!bulan  || g.bulanSPJ === bulan) {} else return false;
            if (!unit   || g.unit === unit) {} else return false;
            if (!waktu  || (waktu==='tepat'&&ws==='TEPAT_WAKTU') || (waktu==='terlambat'&&ws==='TERLAMBAT') || (waktu==='izin'&&ws==='IZIN')) {} else return false;
            if (!search
                || (g.nama||'').toLowerCase().includes(search)
                || (g.subKegiatan||'').toLowerCase().includes(search)
                || (g.unit||'').toLowerCase().includes(search)) {} else return false;
            return true;
        });
    }

    // ── Render ────────────────────────────────────────────────
    function renderTable() {
        const tbody = document.getElementById('spjp-data-tbody');
        const ml    = document.getElementById('spjp-mobile-list');
        const pgn   = document.getElementById('spjp-pagination');

        if (filteredGroups.length === 0) {
            const empty = `<div style="text-align:center;padding:48px;color:#94a3b8;font-size:14px;">
                Tidak ada data yang sesuai filter.</div>`;
            if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="padding:0;">${empty}</td></tr>`;
            if (ml)    ml.innerHTML = empty;
            if (pgn)   pgn.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const items = filteredGroups.slice(start, start + ITEMS_PER_PAGE);

        if (tbody) tbody.innerHTML = items.map(g => renderDesktopRow(g)).join('');
        if (ml)    ml.innerHTML    = items.map(g => renderMobileCard(g)).join('');

        if (pgn) pgn.innerHTML = `
            <button onclick="spjpChangePage(${currentPage-1})" ${currentPage===1?'disabled':''}>&#8249; Prev</button>
            <span class="pagination-info">Hal. ${currentPage} / ${totalPages}
                <span style="color:#94a3b8;">(${filteredGroups.length} grup)</span>
            </span>
            <button onclick="spjpChangePage(${currentPage+1})" ${currentPage===totalPages?'disabled':''}>Next &#8250;</button>`;
    }

    function renderDesktopRow(g) {
        const gk  = encodeGK(g.key);
        const ws  = getGroupWaktuStatus(g);
        const bp  = getWaktuBadgeProps(ws);
        const cnt = g.entries.length;

        const countBadge = cnt > 1 ? `<span class="spjp-entry-count">${cnt}x</span>` : '';

        const izinBtn = ws === 'TERLAMBAT'
            ? `<button onclick="spjpBeriIzin('${gk}')" class="spjp-izin-btn">${ICONS.shield} Beri Izin</button>`
            : ws === 'IZIN'
                ? `<button onclick="spjpCabutIzin('${gk}')" class="spjp-cabut-btn">${ICONS.x} Cabut Izin</button>`
                : '';

        return `<tr>
            <td style="font-size:.82rem;color:#64748b;white-space:nowrap;">${formatTimestamp(g.latestTimestamp)}</td>
            <td style="font-weight:600;min-width:120px;">${g.nama||'-'}</td>
            <td><span class="spjp-unit-tag">${g.unit||'-'}</span></td>
            <td style="min-width:160px;">${g.subKegiatan||'-'} ${countBadge}</td>
            <td><span class="spjp-bulan-tag">${g.bulanSPJ||'-'}</span></td>
            <td>
                <div class="spjp-nom-block">
                    <div class="spjp-nom-row">
                        <span class="spjp-nom-dot" style="background:#059669;"></span>
                        <span class="spjp-nom-lbl">Tepat</span>
                        <span class="spjp-nom-val">${fmtRupiah(g.nominalTepatWaktu)}</span>
                    </div>
                    <div class="spjp-nom-row">
                        <span class="spjp-nom-dot" style="background:#dc2626;"></span>
                        <span class="spjp-nom-lbl">Lambat</span>
                        <span class="spjp-nom-val">${fmtRupiah(g.nominalTerlambat)}</span>
                    </div>
                    <div class="spjp-nom-total">Total: <strong>${fmtRupiah(g.totalNominal)}</strong></div>
                </div>
            </td>
            <td style="text-align:center;vertical-align:middle;">
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                    <span class="spjp-status-pill" style="color:${bp.color};background:${bp.bg};border-color:${bp.border};">
                        ${bp.icon}${bp.label}
                    </span>
                    ${izinBtn}
                </div>
            </td>
            <td>
                <div class="btn-icon-group">
                    <button onclick="spjpOpenHistoryModal('${gk}')" class="btn-icon btn-icon-view" title="Riwayat (${cnt})">${ICONS.history}</button>
                    <button onclick="spjpDeleteGroup('${gk}')"      class="btn-icon btn-icon-delete" title="Hapus semua">${ICONS.trash}</button>
                </div>
            </td>
        </tr>`;
    }

    function renderMobileCard(g) {
        const gk  = encodeGK(g.key);
        const ws  = getGroupWaktuStatus(g);
        const bp  = getWaktuBadgeProps(ws);
        const cnt = g.entries.length;

        const izinBtn = ws === 'TERLAMBAT'
            ? `<button onclick="spjpBeriIzin('${gk}')" class="spjp-mc-btn spjp-mc-btn-izin">${ICONS.shield} Beri Izin</button>`
            : ws === 'IZIN'
                ? `<button onclick="spjpCabutIzin('${gk}')" class="spjp-mc-btn spjp-mc-btn-cabut">${ICONS.x} Cabut Izin</button>`
                : '';

        return `<div class="spjp-mobile-card">
            <div class="spjp-mc-head">
                <div class="spjp-mc-head-left">
                    <div class="spjp-mc-nama">${g.nama||'-'}</div>
                    <div class="spjp-mc-ts">${formatTimestamp(g.latestTimestamp)}</div>
                </div>
                <span class="spjp-status-pill" style="color:${bp.color};background:${bp.bg};border-color:${bp.border};flex-shrink:0;font-size:11px;">
                    ${bp.icon}${bp.label}
                </span>
            </div>

            <div class="spjp-mc-subkeg">
                ${g.subKegiatan||'-'}
                ${cnt > 1 ? `<span class="spjp-entry-count">${cnt}x</span>` : ''}
            </div>

            <div class="spjp-mc-tags">
                <span class="spjp-unit-tag">${g.unit||'-'}</span>
                <span class="spjp-bulan-tag">${g.bulanSPJ||'-'}</span>
            </div>

            <!-- Nominal breakdown 2 kolom -->
            <div class="spjp-mc-nom-box">
                <div class="spjp-mc-nom-col spjp-mc-nom-tepat">
                    <div class="spjp-mc-nom-lbl">✅ Tepat Waktu</div>
                    <div class="spjp-mc-nom-val">${fmtRupiah(g.nominalTepatWaktu)}</div>
                </div>
                <div class="spjp-mc-nom-col spjp-mc-nom-lambat">
                    <div class="spjp-mc-nom-lbl">⏰ Terlambat</div>
                    <div class="spjp-mc-nom-val">${fmtRupiah(g.nominalTerlambat)}</div>
                </div>
                <div class="spjp-mc-nom-footer">
                    Total: <strong>${fmtRupiah(g.totalNominal)}</strong>
                </div>
            </div>

            <div class="spjp-mc-actions">
                <button onclick="spjpOpenHistoryModal('${gk}')" class="spjp-mc-btn spjp-mc-btn-hist">
                    ${ICONS.history} Riwayat
                </button>
                ${izinBtn}
                <button onclick="spjpDeleteGroup('${gk}')" class="spjp-mc-btn spjp-mc-btn-del">
                    ${ICONS.trash} Hapus
                </button>
            </div>
        </div>`;
    }

    // ── Encode / Decode ───────────────────────────────────────
    function encodeGK(key) { return btoa(encodeURIComponent(key)).replace(/=/g,'_'); }
    function decodeGK(enc) { return decodeURIComponent(atob(enc.replace(/_/g,'='))); }
    function getGroupByGK(enc) {
        const key = decodeGK(enc);
        return groupedData.find(g => g.key === key) || null;
    }

    window.spjpChangePage = function (page) {
        const total = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
        if (page < 1 || page > total) return;
        currentPage = page; renderTable();
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
        set('spjp-total-grup',       groupedData.length);
        set('spjp-bulan-ini-count',  grupsIni.length);
        set('spjp-bulan-ini-label',  `${curMonth} ${now.getFullYear()}`);
        set('spjp-stat-tepat',       tepat);
        set('spjp-stat-terlambat',   terlambat);
        set('spjp-stat-izin',        izin);
        set('spjp-nom-tepat',        fmtRupiah(nomTepat));
        set('spjp-nom-lambat',       fmtRupiah(nomLambat));
        set('spjp-nom-total',        fmtRupiah(nomTepat + nomLambat));
    }

    // ── Beri / Cabut Izin ─────────────────────────────────────
    window.spjpBeriIzin = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        showConfirmModal({
            icon: '🛡️',
            title: 'Beri Izin Terlambat?',
            message: `<strong>${g.nama}</strong><br>${g.subKegiatan} · ${g.bulanSPJ}
                <br><br>Grup ini akan dianggap <strong style="color:#059669;">Tepat Waktu</strong> meskipun submit setelah tanggal ${BATAS_TANGGAL}.
                <br>Seluruh nominal akan dipindahkan ke kolom <em>Tepat Waktu</em>.`,
            confirmText: 'Ya, Beri Izin',
            confirmClass: 'btn-primary',
        }, () => {
            izinSet.add(g.key);
            saveIzinSet();
            recomputeAllNominals();
            filteredGroups = _buildFilteredList();
            renderTable(); updateStats();
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
                <br><br>Status akan kembali ke <strong style="color:#dc2626;">Terlambat</strong> dan nominal akan dipindahkan ke kolom terlambat.`,
            confirmText: 'Ya, Cabut Izin',
            confirmClass: 'btn-warning',
        }, () => {
            izinSet.delete(g.key);
            saveIzinSet();
            recomputeAllNominals();
            filteredGroups = _buildFilteredList();
            renderTable(); updateStats();
            if (window.showToast) showToast('Izin terlambat dicabut', 'success');
        });
    };

    // ── Delete Group ──────────────────────────────────────────
    window.spjpDeleteGroup = function (gk) {
        const g = getGroupByGK(gk);
        if (!g) return;
        const cnt = g.entries.length;
        showConfirmModal({
            icon: '🗑️', title: 'Hapus Semua Entry Grup Ini?',
            message: `<strong>${g.subKegiatan}</strong><br>${g.unit} · ${g.bulanSPJ}
                <br><br>Akan menghapus <strong>${cnt} entry</strong> (Total: ${fmtRupiah(g.totalNominal)}).
                <br><br><span style="color:#ef4444;font-weight:600;">Tidak dapat dibatalkan.</span>`,
            confirmText: `Hapus ${cnt} Entry`, confirmClass: 'btn-danger',
        }, async () => {
            try {
                for (const entry of g.entries) {
                    await callAPI({ action: 'deletePenyampaianSPJ', id: entry.id });
                }
                izinSet.delete(g.key); saveIzinSet();
                if (window.showToast) showToast(`${cnt} entry dihapus`, 'success');
                window.spjpClearCache(); await window.spjpLoadData(true);
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
        const overallBp = getWaktuBadgeProps(ws);
        const modal   = document.createElement('div');
        modal.id = 'spjp-history-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';

        const cntTepat   = g.entries.filter(e => getEntryWaktuStatus(e, g.key) === 'TEPAT_WAKTU').length;
        const cntLambat  = g.entries.filter(e => getEntryWaktuStatus(e, g.key) === 'TERLAMBAT').length;

        const entryRows = g.entries.map((entry, i) => {
            const ews    = getEntryWaktuStatus(entry, g.key);
            const ebp    = getWaktuBadgeProps(ews);
            const nom    = parseFloat(entry.nominalSPJMasuk) || 0;
            const isLatest = i === 0;
            const d      = new Date(entry.timestamp);
            const tgl    = isNaN(d.getTime()) ? '-' : d.getDate();
            const overBatas = !isNaN(d.getTime()) && tgl > BATAS_TANGGAL;

            return `<div class="spjp-hist-entry ${isLatest ? 'spjp-hist-latest' : ''}">
                <div class="spjp-hist-head">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                        <div class="spjp-hist-num">${g.entries.length - i}</div>
                        <div style="min-width:0;">
                            <div style="font-size:13px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                                ${formatTimestamp(entry.timestamp)}
                                ${isLatest ? '<span class="spjp-latest-badge">Terbaru</span>' : ''}
                            </div>
                            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
                                Tgl submit: <strong>${tgl}</strong>
                                ${overBatas && !hasIzin ? '<span style="color:#dc2626;margin-left:4px;">melewati batas tgl 25</span>' : ''}
                                ${hasIzin ? '<span style="color:#7c3aed;margin-left:4px;">✓ diberi izin admin</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <span class="spjp-status-pill" style="color:${ebp.color};background:${ebp.bg};border-color:${ebp.border};font-size:11px;flex-shrink:0;">
                        ${ebp.icon}${ebp.label}
                    </span>
                </div>
                <div class="spjp-hist-body">
                    <div class="spjp-hist-field">
                        <div class="spjp-hist-lbl">Nominal</div>
                        <div class="spjp-hist-val" style="font-size:15px;">${fmtRupiah(nom)}</div>
                    </div>
                    <div class="spjp-hist-field">
                        <div class="spjp-hist-lbl">Masuk ke kolom</div>
                        <div class="spjp-hist-val" style="color:${ebp.color};">
                            ${ews === 'TEPAT_WAKTU' ? '✅ Tepat Waktu' : '⏰ Terlambat'}
                        </div>
                    </div>
                    <div class="spjp-hist-field">
                        <div class="spjp-hist-lbl">Nama</div>
                        <div class="spjp-hist-val">${entry.nama||'-'}</div>
                    </div>
                    <div class="spjp-hist-field">
                        <div class="spjp-hist-lbl">ID Entry</div>
                        <div class="spjp-hist-val" style="font-size:11px;color:#94a3b8;">${entry.id}</div>
                    </div>
                </div>
            </div>`;
        }).join('');

        modal.innerHTML = `
        <div class="modal" style="max-width:640px;width:100%;">
            <div class="modal-header">
                <h2 class="modal-title">Riwayat Pengumpulan SPJ</h2>
                <p style="font-size:13px;color:#64748b;margin-top:4px;">${g.subKegiatan||'-'} · ${g.unit}</p>
            </div>
            <div class="modal-content" style="padding:0;overflow:hidden;">

                <!-- Summary strip -->
                <div class="spjp-hist-strip">
                    <div class="spjp-hstrip-item">
                        <div class="spjp-hstrip-lbl">Bulan SPJ</div>
                        <div class="spjp-hstrip-val">${g.bulanSPJ}</div>
                    </div>
                    <div class="spjp-hstrip-item">
                        <div class="spjp-hstrip-lbl">Total Entry</div>
                        <div class="spjp-hstrip-val">${g.entries.length}×</div>
                    </div>
                    <div class="spjp-hstrip-item">
                        <div class="spjp-hstrip-lbl">Status Grup</div>
                        <div>
                            <span class="spjp-status-pill" style="color:${overallBp.color};background:${overallBp.bg};border-color:${overallBp.border};font-size:11px;">
                                ${overallBp.icon}${overallBp.label}
                            </span>
                        </div>
                    </div>
                    <div class="spjp-hstrip-item" style="background:#fffbeb;">
                        <div class="spjp-hstrip-lbl">Batas Tgl</div>
                        <div class="spjp-hstrip-val">≤ ${BATAS_TANGGAL}${hasIzin ? ' <span style="color:#7c3aed;font-size:11px;">(izin aktif)</span>' : ''}</div>
                    </div>
                </div>

                <!-- Nominal breakdown — 2 kotak besar -->
                <div class="spjp-hist-nom-grid">
                    <div class="spjp-hist-nom-card spjp-hist-nom-tepat">
                        <div class="spjp-hist-nom-lbl">✅ Total Nominal Tepat Waktu</div>
                        <div class="spjp-hist-nom-val">${fmtRupiah(g.nominalTepatWaktu)}</div>
                        <div class="spjp-hist-nom-sub">${cntTepat} entry</div>
                    </div>
                    <div class="spjp-hist-nom-card spjp-hist-nom-lambat">
                        <div class="spjp-hist-nom-lbl">⏰ Total Nominal Terlambat</div>
                        <div class="spjp-hist-nom-val">${fmtRupiah(g.nominalTerlambat)}</div>
                        <div class="spjp-hist-nom-sub">${cntLambat} entry</div>
                    </div>
                </div>
                <div class="spjp-hist-total-row">
                    <span style="color:#64748b;">Grand Total Keseluruhan</span>
                    <strong style="font-size:15px;">${fmtRupiah(g.totalNominal)}</strong>
                </div>

                <!-- Timeline -->
                <div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding:16px;">
                    ${entryRows}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="document.getElementById('spjp-history-modal').remove()" class="btn" style="flex:1;">Tutup</button>
                ${ws === 'TERLAMBAT' ? `
                <button onclick="spjpBeriIzin('${gk}');document.getElementById('spjp-history-modal').remove();"
                    class="btn btn-primary" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;">
                    ${ICONS.shield} Beri Izin Terlambat
                </button>` : ws === 'IZIN' ? `
                <button onclick="spjpCabutIzin('${gk}');document.getElementById('spjp-history-modal').remove();"
                    class="btn" style="flex:1;background:#fee2e2;color:#dc2626;border:none;display:flex;align-items:center;justify-content:center;gap:6px;">
                    ${ICONS.x} Cabut Izin Terlambat
                </button>` : ''}
            </div>
        </div>`;

        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    };

    // ═══ HTML Injection ══════════════════════════════════════
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['spj-pengumpulan'] = function () {
        const section = document.getElementById('section-spj-pengumpulan');
        if (!section) return;

        section.innerHTML = `
<style>
/* ═══════════════════════════════════════════════════
   SPJ PENGUMPULAN v5
   Status: Tepat Waktu / Terlambat / Izin Terlambat
   ═══════════════════════════════════════════════════ */

/* ── Pill status ── */
.spjp-status-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 20px; border: 1px solid;
    font-size: 12px; font-weight: 700; white-space: nowrap;
}

/* ── Entry count badge ── */
.spjp-entry-count {
    display: inline-flex; align-items: center;
    background: #eff6ff; color: #3b82f6;
    font-size: 10px; font-weight: 700;
    padding: 1px 7px; border-radius: 20px; margin-left: 6px;
    border: 1px solid #bfdbfe; vertical-align: middle;
}

/* ── Unit / bulan tags ── */
.spjp-unit-tag {
    display: inline-block; background: #f1f5f9; color: #475569;
    font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 6px;
    border: 1px solid #e2e8f0;
    max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.spjp-bulan-tag {
    display: inline-block; background: #eff6ff; color: #2563eb;
    font-size: 11px; font-weight: 700; padding: 2px 9px; border-radius: 20px;
    border: 1px solid #bfdbfe;
}

/* ── Nominal block (desktop table) ── */
.spjp-nom-block { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
.spjp-nom-row   { display: flex; align-items: center; gap: 5px; font-size: 12px; }
.spjp-nom-dot   { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.spjp-nom-lbl   { color: #64748b; min-width: 38px; font-weight: 500; }
.spjp-nom-val   { font-weight: 700; color: #0f172a; }
.spjp-nom-total { font-size: 11px; color: #94a3b8; padding-top: 4px; border-top: 1px dashed #e2e8f0; margin-top: 2px; }

/* ── Izin / Cabut buttons (desktop) ── */
.spjp-izin-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 8px;
    border: 1px solid #93c5fd; background: #eff6ff; color: #1d4ed8;
    font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit;
    transition: background .15s;
}
.spjp-izin-btn:hover { background: #dbeafe; }
.spjp-cabut-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 8px;
    border: 1px solid #fca5a5; background: #fee2e2; color: #dc2626;
    font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: inherit;
    transition: background .15s;
}
.spjp-cabut-btn:hover { background: #fecaca; }

/* ─── Responsive: tabel / cards ─── */
.spjp-table-wrap  { display: block; }
.spjp-mobile-wrap { display: none;  }
@media (max-width: 768px) {
    .spjp-table-wrap  { display: none !important; }
    .spjp-mobile-wrap { display: block !important; }
}

/* ─── Mobile card ─── */
.spjp-mobile-card {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
    padding: 16px; margin-bottom: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.spjp-mc-head {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 10px; margin-bottom: 10px;
}
.spjp-mc-head-left { flex: 1; min-width: 0; }
.spjp-mc-nama  { font-size: 15px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spjp-mc-ts    { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.spjp-mc-subkeg{ font-size: 13px; color: #334155; margin-bottom: 8px; line-height: 1.4; }
.spjp-mc-tags  { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }

/* Nominal 2 kolom + footer */
.spjp-mc-nom-box {
    border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 12px;
}
.spjp-mc-nom-col {
    display: grid; grid-template-columns: 1fr 1fr;
}
/* use a wrapper instead */
.spjp-mc-nom-box > .spjp-mc-nom-row-wrap {
    display: grid; grid-template-columns: 1fr 1fr;
}
/* simpler approach */
.spjp-mc-nom-box {
    display: grid; grid-template-columns: 1fr 1fr;
}
.spjp-mc-nom-col { padding: 12px 14px; }
.spjp-mc-nom-tepat  { background: #ecfdf5; border-right: 1px solid #e2e8f0; }
.spjp-mc-nom-lambat { background: #fef2f2; }
.spjp-mc-nom-lbl    { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 5px; }
.spjp-mc-nom-tepat .spjp-mc-nom-lbl  { color: #059669; }
.spjp-mc-nom-lambat .spjp-mc-nom-lbl { color: #dc2626; }
.spjp-mc-nom-val    { font-size: 14px; font-weight: 800; color: #0f172a; }
.spjp-mc-nom-footer {
    grid-column: 1 / -1;
    background: #f8fafc; padding: 8px 14px;
    border-top: 1px solid #e2e8f0;
    font-size: 12px; color: #475569; text-align: right;
}

/* Actions */
.spjp-mc-actions { display: flex; gap: 6px; flex-wrap: wrap; padding-top: 10px; border-top: 1px solid #f1f5f9; }
.spjp-mc-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 7px 12px; border-radius: 9px; border: 1px solid #e2e8f0;
    background: #f8fafc; color: #475569; font-size: 12px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap; transition: all .15s;
}
.spjp-mc-btn-hist  { color: #0ea5e9; border-color: #bae6fd; background: #f0f9ff; }
.spjp-mc-btn-hist:hover { background: #e0f2fe; }
.spjp-mc-btn-izin  { color: #1d4ed8; border-color: #93c5fd; background: #eff6ff; }
.spjp-mc-btn-izin:hover { background: #dbeafe; }
.spjp-mc-btn-cabut { color: #dc2626; border-color: #fca5a5; background: #fee2e2; }
.spjp-mc-btn-cabut:hover { background: #fecaca; }
.spjp-mc-btn-del   { color: #dc2626; border-color: #fca5a5; }
.spjp-mc-btn-del:hover { background: #fee2e2; }

/* ─── Filter grid ─── */
.spjp-filter-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
}
@media (max-width: 600px) { .spjp-filter-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 400px) { .spjp-filter-grid { grid-template-columns: 1fr; } }

/* ─── Stats ketepatan ─── */
.spjp-kstat-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px;
}
@media (max-width: 480px) { .spjp-kstat-grid { grid-template-columns: 1fr 1fr; } }
.spjp-kstat {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px;
    padding: 14px 16px; cursor: pointer; transition: all .15s;
}
.spjp-kstat:hover { box-shadow: 0 2px 10px rgba(0,0,0,.08); }
.spjp-kstat-val { font-size: 28px; font-weight: 800; line-height: 1; }
.spjp-kstat-lbl { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }

/* ─── Nominal summary bar ─── */
.spjp-nom-summary {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;
}
@media (max-width: 480px) { .spjp-nom-summary { grid-template-columns: 1fr; } }
.spjp-nom-sum-card {
    border-radius: 12px; padding: 14px 16px;
}
.spjp-nom-sum-card.tepat  { background: #ecfdf5; border: 1.5px solid #6ee7b7; }
.spjp-nom-sum-card.lambat { background: #fef2f2; border: 1.5px solid #fca5a5; }
.spjp-nom-sum-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
.spjp-nom-sum-card.tepat  .spjp-nom-sum-lbl { color: #059669; }
.spjp-nom-sum-card.lambat .spjp-nom-sum-lbl { color: #dc2626; }
.spjp-nom-sum-val { font-size: 20px; font-weight: 800; color: #0f172a; }
.spjp-nom-sum-sub { font-size: 11px; color: #64748b; margin-top: 3px; }

/* ─── History modal ─── */
.spjp-hist-strip {
    display: grid; grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid #f1f5f9;
}
@media (max-width: 520px) { .spjp-hist-strip { grid-template-columns: 1fr 1fr; } }
.spjp-hstrip-item {
    padding: 14px 16px; border-right: 1px solid #f1f5f9;
}
.spjp-hstrip-item:last-child { border-right: none; }
.spjp-hstrip-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; margin-bottom: 4px; }
.spjp-hstrip-val { font-size: 14px; font-weight: 700; color: #1e293b; }

.spjp-hist-nom-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    margin: 16px 16px 0; border-radius: 12px; overflow: hidden;
    border: 1.5px solid #e2e8f0;
}
@media (max-width: 420px) { .spjp-hist-nom-grid { grid-template-columns: 1fr; } }
.spjp-hist-nom-card { padding: 16px; }
.spjp-hist-nom-tepat  { background: #ecfdf5; border-right: 1px solid #e2e8f0; }
.spjp-hist-nom-lambat { background: #fef2f2; }
.spjp-hist-nom-lbl { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
.spjp-hist-nom-tepat  .spjp-hist-nom-lbl { color: #059669; }
.spjp-hist-nom-lambat .spjp-hist-nom-lbl { color: #dc2626; }
.spjp-hist-nom-val { font-size: 20px; font-weight: 800; color: #0f172a; }
.spjp-hist-nom-sub { font-size: 11px; color: #64748b; margin-top: 3px; }

.spjp-hist-total-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 16px 14px; font-size: 13px; color: #475569;
    border-bottom: 1px solid #f1f5f9; margin: 0 16px;
}

/* Timeline entry */
.spjp-hist-entry {
    background: #fff; border: 1.5px solid #f1f5f9; border-radius: 12px; overflow: hidden;
}
.spjp-hist-latest { border-color: #bfdbfe; background: #f8fbff; }
.spjp-hist-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-bottom: 1px solid #f1f5f9; gap: 8px; flex-wrap: wrap;
}
.spjp-hist-num {
    width: 28px; height: 28px; border-radius: 50%; background: #f1f5f9; color: #64748b;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.spjp-latest-badge {
    display: inline-block; background: #dbeafe; color: #1d4ed8;
    font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px; margin-left: 6px;
}
.spjp-hist-body {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 14px;
}
@media (max-width: 400px) { .spjp-hist-body { grid-template-columns: 1fr; } }
.spjp-hist-field { display: flex; flex-direction: column; gap: 2px; }
.spjp-hist-lbl   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.spjp-hist-val   { font-size: 13px; font-weight: 600; color: #1e293b; }

/* Table overrides */
#spjp-data-tbody tr td { vertical-align: middle; }
#spjp-data-tbody tr td:nth-child(7) { text-align: center; }
</style>

<div class="container">
    <div class="section-page-header">
        <h1 class="section-page-title">Pengumpulan SPJ Keuangan</h1>
        <p class="section-page-subtitle">Rekap ketepatan waktu penyampaian SPJ — batas tanggal <strong>${BATAS_TANGGAL}</strong> tiap bulan</p>
    </div>

    <!-- Main stats -->
    <div class="stats-grid" style="margin-bottom:14px;">
        <div class="stat-card" style="border-left:4px solid #10b981;">
            <div class="stat-label">Total Grup SPJ</div>
            <div class="stat-value" id="spjp-total-grup">0</div>
            <div class="stat-footer">Sub kegiatan unik</div>
        </div>
        <div class="stat-card" style="border-left:4px solid #3b82f6;">
            <div class="stat-label">Bulan Ini</div>
            <div class="stat-value" id="spjp-bulan-ini-count">0</div>
            <div class="stat-footer" id="spjp-bulan-ini-label">—</div>
        </div>
    </div>

    <!-- Ketepatan stat cards -->
    <div class="spjp-kstat-grid">
        <div class="spjp-kstat" style="border-color:#6ee7b7;" onclick="document.getElementById('spjp-filter-waktu').value='tepat';spjpFilterData();">
            <div class="spjp-kstat-val" style="color:#059669;" id="spjp-stat-tepat">0</div>
            <div class="spjp-kstat-lbl">✅ Tepat Waktu</div>
        </div>
        <div class="spjp-kstat" style="border-color:#fca5a5;" onclick="document.getElementById('spjp-filter-waktu').value='terlambat';spjpFilterData();">
            <div class="spjp-kstat-val" style="color:#dc2626;" id="spjp-stat-terlambat">0</div>
            <div class="spjp-kstat-lbl">⏰ Terlambat</div>
        </div>
        <div class="spjp-kstat" style="border-color:#c4b5fd;" onclick="document.getElementById('spjp-filter-waktu').value='izin';spjpFilterData();">
            <div class="spjp-kstat-val" style="color:#7c3aed;" id="spjp-stat-izin">0</div>
            <div class="spjp-kstat-lbl">🛡️ Izin Terlambat</div>
        </div>
    </div>

    <!-- Nominal summary -->
    <div class="spjp-nom-summary">
        <div class="spjp-nom-sum-card tepat">
            <div class="spjp-nom-sum-lbl">Total Nominal Tepat Waktu</div>
            <div class="spjp-nom-sum-val" id="spjp-nom-tepat">Rp 0</div>
            <div class="spjp-nom-sum-sub">dari data filtered</div>
        </div>
        <div class="spjp-nom-sum-card lambat">
            <div class="spjp-nom-sum-lbl">Total Nominal Terlambat</div>
            <div class="spjp-nom-sum-val" id="spjp-nom-lambat">Rp 0</div>
            <div class="spjp-nom-sum-sub">dari data filtered</div>
        </div>
    </div>

    <!-- Tabel card -->
    <div class="card">
        <div class="card-header" style="flex-direction:column;align-items:stretch;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
                <h2 class="card-title">Daftar Pengumpulan SPJ</h2>
                <button onclick="spjpLoadData(true)" class="btn btn-sm" style="display:flex;align-items:center;gap:6px;">
                    ${ICONS.refresh} Refresh
                </button>
            </div>
            <div class="spjp-filter-grid">
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
            </div>
            <input type="text" class="search-input" id="spjp-search-nama"
                style="width:100%;box-sizing:border-box;"
                placeholder="🔍 Cari nama / sub kegiatan / unit..."
                oninput="spjpFilterData()">
        </div>

        <!-- Desktop table -->
        <div class="table-container spjp-table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Terakhir Submit</th>
                        <th>Nama</th>
                        <th>Unit / Bidang</th>
                        <th>Sub Kegiatan</th>
                        <th>Bulan</th>
                        <th>Nominal</th>
                        <th style="text-align:center;min-width:140px;">Ketepatan Waktu</th>
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

        <!-- Mobile cards -->
        <div class="spjp-mobile-wrap" style="padding:12px;">
            <div id="spjp-mobile-list">
                <div style="text-align:center;padding:48px;">
                    <div class="spinner"></div>
                    <div style="margin-top:12px;color:#94a3b8;">Memuat data...</div>
                </div>
            </div>
        </div>

        <div class="pagination" id="spjp-pagination"></div>
    </div>
</div>`;

        // Default filter ke bulan ini
        const curMonthName = new Date().toLocaleString('id-ID',{month:'long'}).toUpperCase();
        const fMonth = document.getElementById('spjp-filter-bulan');
        if (fMonth) fMonth.value = curMonthName;

        window.spjpLoadData(false).then(() => window.spjpFilterData());
    };
})();