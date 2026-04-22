// ============================================================
// dashboard.js — Dashboard Rekapitulasi Nilai Kinerja
// Admin Panel SPA — Dinas Koperasi UKM
// ============================================================
(function () {
    'use strict';

    // ── Constants ───────────────────────────────────────────────
    const UNITS = [
        'Sekretariat', 'Bidang Koperasi', 'Bidang UKM',
        'Bidang Usaha Mikro', 'Bidang Kewirausahaan', 'Balai Layanan Usaha Terpadu KUMKM'
    ];
    const US = {
        'Sekretariat': 'Sekretariat',
        'Bidang Koperasi': 'Bid. Koperasi',
        'Bidang UKM': 'Bid. UKM',
        'Bidang Usaha Mikro': 'Bid. Usaha Mikro',
        'Bidang Kewirausahaan': 'Bid. Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM': 'Balai KUMKM'
    };
    const MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const MOS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const MODS = [
        { key: 'bbm', label: 'BBM', color: '#0ea5e9', max: 5 },
        { key: 'kendaraan', label: 'Kendaraan', color: '#f59e0b', max: 10 },
        { key: 'ruang', label: 'Ruang Rapat', color: '#8b5cf6', max: 5 },
        { key: 'kearsipan', label: 'Kearsipan', color: '#22c55e', max: 5 },
        { key: 'spj', label: 'SPJ Keuangan', color: '#10b981', max: 35 },
        { key: 'monev', label: 'Monev', color: '#ec4899', max: 40 },
    ];
    const TOTAL_MAX = 100;
    const UC = ['#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981', '#ec4899'];
    const MONTH_MAP = {
        'januari': 'JANUARI', 'februari': 'FEBRUARI', 'maret': 'MARET', 'april': 'APRIL',
        'mei': 'MEI', 'juni': 'JUNI', 'juli': 'JULI', 'agustus': 'AGUSTUS',
        'september': 'SEPTEMBER', 'oktober': 'OKTOBER', 'november': 'NOVEMBER', 'desember': 'DESEMBER'
    };

    // ── State ────────────────────────────────────────────────────
    var S = { bulan: '', scores: {}, allMonth: {}, loading: false };
    var MONEV_CACHE = null;
    var SPJ_CACHE = null;
    var C = {};
    var activeCat = 'bbm';
    var spjDataSource = 'none';

    // ── Helpers ──────────────────────────────────────────────────
    function fn(v) {
        if (v === null || v === undefined) return '—';
        var n = parseFloat(v);
        return isNaN(n) ? '—' : (n % 1 === 0 ? String(n) : n.toFixed(1));
    }
    function cap(s) { return s ? s[0] + s.slice(1).toLowerCase() : ''; }
    function kill(id) { if (C[id]) { C[id].destroy(); delete C[id]; } }
    function ok(r) { return r.status === 'fulfilled' && r.value && r.value.success; }
    function normalizeBulan(str) {
        if (!str) return '';
        var first = String(str).trim().toLowerCase().split(/[\s,\/\-]+/)[0];
        return MONTH_MAP[first] || String(str).trim().toUpperCase().split(/[\s,\/\-]+/)[0];
    }

    // ── Load All Data ────────────────────────────────────────────
    async function loadAll() {
        if (S.loading) return;
        S.loading = true;
        setRefreshLoading(true);
        S.bulan = document.getElementById('db-bulanSelect').value;
        var bL = cap(S.bulan);
        document.getElementById('db-sectionNote').textContent = bL;
        document.getElementById('db-stkNote').textContent = bL;

        try {
            var [roomR, vkR, vbR, bbmR, docsR, spjMonthlyR, spjRekapR, monevR] = await Promise.allSettled([
                apiGet(API_OP, { action: 'getRoomScores' }),
                apiGet(API_OP, { action: 'getVehicleScores', jenis: 'KUNCI' }),
                apiGet(API_OP, { action: 'getVehicleScores', jenis: 'BERSIH' }),
                apiGet(API_OP, { action: 'getBBMScores' }),
                apiGet(API_OP, { action: 'getDocuments' }),
                apiGet(API_SPJ, { action: 'getAllMonthlySheetData' }),
                apiGet(API_SPJ, { action: 'getAllSPJKeuangan' }),
                apiGet(API_MONEV, { action: 'getAllSheetData' }),
            ]);

            // ── Parse SPJ Cache ──────────────────────────────────
            SPJ_CACHE = null;
            spjDataSource = 'none';

            if (spjMonthlyR.status === 'fulfilled' && spjMonthlyR.value && spjMonthlyR.value.success && spjMonthlyR.value.rekap) {
                var rekap = spjMonthlyR.value.rekap;
                if (Object.keys(rekap).length > 0) {
                    SPJ_CACHE = { type: 'monthly', data: rekap };
                    spjDataSource = 'api-monthly';
                }
            }
            if (!SPJ_CACHE && spjRekapR.status === 'fulfilled' && spjRekapR.value && spjRekapR.value.success && spjRekapR.value.rekap) {
                var rekap2 = spjRekapR.value.rekap;
                if (Object.keys(rekap2).length > 0) {
                    SPJ_CACHE = { type: 'rekap', data: rekap2 };
                    spjDataSource = 'api-rekap';
                }
            }
            if (!SPJ_CACHE) {
                try {
                    var localRaw = localStorage.getItem('spj_keuangan_data');
                    if (localRaw) {
                        var localData = JSON.parse(localRaw);
                        if (Object.keys(localData).length > 0) {
                            SPJ_CACHE = { type: 'local', data: localData };
                            spjDataSource = 'local';
                        }
                    }
                } catch (e) { }
            }
            updateSPJStatusBar();

            // ── Parse Monev Cache ────────────────────────────────
            MONEV_CACHE = null;
            if (monevR.status === 'fulfilled' && monevR.value) {
                var val = monevR.value;
                if (val.status === 'success' && val.data && !Array.isArray(val.data))
                    MONEV_CACHE = { type: 'nested', data: val.data };
                else if ((val.success || val.status === 'success') && val.rekap)
                    MONEV_CACHE = { type: 'rekap', data: val.rekap };
                else if (Array.isArray(val.data))
                    MONEV_CACHE = { type: 'array', data: val.data };
                else if (Array.isArray(val))
                    MONEV_CACHE = { type: 'array', data: val };
                else if (val.success && val.data && typeof val.data === 'object')
                    MONEV_CACHE = { type: 'nested', data: val.data };
            }

            // ── Build scores bulan aktif ─────────────────────────
            var sc = {};
            UNITS.forEach(function (u) {
                sc[u] = { bbm: null, kendaraan: null, ruang: null, kearsipan: null, spj: null, monev: null };
            });
            fillOperasionalScores(sc, S.bulan, roomR, vkR, vbR, bbmR, docsR);
            fillSPJScores(sc, S.bulan);
            fillMonev(sc, S.bulan);
            S.scores = sc;

            // ── Build scores semua bulan (tren) ──────────────────
            var am = {};
            MONTHS.forEach(function (m) {
                am[m] = {};
                UNITS.forEach(function (u) {
                    am[m][u] = { bbm: null, kendaraan: null, ruang: null, kearsipan: null, spj: null, monev: null };
                });
            });
            MONTHS.forEach(function (m) {
                fillOperasionalScores(am[m], m, roomR, vkR, vbR, bbmR, docsR);
                fillSPJScores(am[m], m);
                fillMonev(am[m], m);
            });
            S.allMonth = am;

            render();
            if (window.showToast) showToast('Data berhasil dimuat', 'success');

        } catch (e) {
            console.error('[Dashboard]', e);
            if (window.showToast) showToast('Gagal memuat sebagian data', 'error');
            render();
        } finally {
            S.loading = false;
            setRefreshLoading(false);
        }
    }

    function updateSPJStatusBar() {
        var bar = document.getElementById('db-spjStatusBar');
        var msg = document.getElementById('db-spjStatusMsg');
        var srcLbl = document.getElementById('db-spjSourceLabel');
        if (!bar) return;
        if (spjDataSource === 'api-monthly') {
            bar.className = 'spj-status-bar success'; bar.style.display = 'flex';
            msg.textContent = '✅ Data SPJ Keuangan berhasil diambil langsung dari Google Spreadsheet (sheet bulanan).';
            srcLbl.textContent = 'Google Spreadsheet (Sheet Bulanan)'; srcLbl.style.color = '#065f46';
        } else if (spjDataSource === 'api-rekap') {
            bar.className = 'spj-status-bar success'; bar.style.display = 'flex';
            msg.textContent = '✅ Data SPJ Keuangan berhasil diambil dari Google Spreadsheet (sheet rekap).';
            srcLbl.textContent = 'Google Spreadsheet (Sheet Rekap)'; srcLbl.style.color = '#065f46';
        } else if (spjDataSource === 'local') {
            bar.className = 'spj-status-bar'; bar.style.display = 'flex';
            msg.textContent = '⚠️ API SPJ tidak tersedia. Menampilkan data dari penyimpanan lokal browser.';
            srcLbl.textContent = 'Penyimpanan Lokal Browser'; srcLbl.style.color = '#92400e';
        } else {
            bar.className = 'spj-status-bar error'; bar.style.display = 'flex';
            msg.textContent = '❌ Data SPJ Keuangan tidak tersedia. API tidak merespons dan tidak ada data lokal.';
            srcLbl.textContent = 'Tidak ada data'; srcLbl.style.color = '#991b1b';
        }
    }

    function fillOperasionalScores(sc, bulan, roomR, vkR, vbR, bbmR, docsR) {
        if (ok(roomR)) {
            (roomR.value.scores || []).forEach(function (s) {
                if (s.bulan === bulan && sc[s.unit]) sc[s.unit].ruang = s.skorAkhir;
            });
        }
        var km = {}, bm = {};
        if (ok(vkR)) (vkR.value.scores || []).forEach(function (s) { if (s.bulan === bulan) km[s.unit] = s.skorAkhir; });
        if (ok(vbR)) (vbR.value.scores || []).forEach(function (s) { if (s.bulan === bulan) bm[s.unit] = s.skorAkhir; });
        UNITS.forEach(function (u) {
            var k = km[u] !== undefined ? km[u] : null;
            var b = bm[u] !== undefined ? bm[u] : null;
            if (k !== null || b !== null) sc[u].kendaraan = (k || 0) + (b || 0);
        });
        if (ok(bbmR)) {
            (bbmR.value.scores || []).forEach(function (s) {
                if (s.bulan === bulan && sc[s.unit]) sc[s.unit].bbm = s.skorAkhir;
            });
        }
        var docsArray = [];
        if (docsR.status === 'fulfilled') {
            var dv = docsR.value;
            if (Array.isArray(dv)) docsArray = dv;
            else if (Array.isArray(dv && dv.data)) docsArray = dv.data;
        }
        if (docsArray.length > 0) {
            var dm = {};
            docsArray.forEach(function (d) {
                if (!d.nilai || d.nilai === '' || d.nilai === '-' || !d.unit) return;
                var nilaiNum = parseFloat(String(d.nilai).replace(',', '.'));
                if (isNaN(nilaiNum) || nilaiNum <= 0) return;
                if (normalizeBulan(d.bulan) !== bulan) return;
                var unitRaw = String(d.unit).trim();
                var matchedUnit = UNITS.find(function (u) { return u.trim() === unitRaw; })
                    || UNITS.find(function (u) { return u.trim().toLowerCase() === unitRaw.toLowerCase(); })
                    || UNITS.find(function (u) { return unitRaw.toLowerCase().includes(u.trim().toLowerCase()) || u.trim().toLowerCase().includes(unitRaw.toLowerCase()); });
                if (!matchedUnit) return;
                if (!dm[matchedUnit]) dm[matchedUnit] = [];
                dm[matchedUnit].push(nilaiNum);
            });
            UNITS.forEach(function (u) {
                if (dm[u] && dm[u].length > 0) {
                    var avg = dm[u].reduce(function (a, c) { return a + c; }, 0) / dm[u].length;
                    sc[u].kearsipan = +Math.min(5, avg).toFixed(2);
                }
            });
        }
    }

    function fillSPJScores(sc, bulan) {
        if (!SPJ_CACHE) return;
        var data = SPJ_CACHE.data;
        var bulanKey = Object.keys(data).find(function (k) { return k.toUpperCase() === bulan.toUpperCase(); });
        if (!bulanKey) return;
        var bulanData = data[bulanKey];
        UNITS.forEach(function (u) {
            var unitKey = Object.keys(bulanData).find(function (k) { return k.trim() === u.trim(); })
                || Object.keys(bulanData).find(function (k) { return k.trim().toLowerCase() === u.trim().toLowerCase(); });
            if (!unitKey) return;
            var unitData = bulanData[unitKey];
            var v = parseFloat(unitData.totalNilai !== undefined ? unitData.totalNilai
                : unitData.total !== undefined ? unitData.total
                    : unitData.nilai !== undefined ? unitData.nilai : null);
            if (!isNaN(v) && v >= 0) sc[u].spj = v;
        });
    }

    function fillMonev(sc, bulan) {
        if (MONEV_CACHE) {
            var type = MONEV_CACHE.type, data = MONEV_CACHE.data;
            if (type === 'nested' || type === 'rekap') {
                var bulanKey = Object.keys(data).find(function (k) { return normalizeBulan(k) === bulan; });
                var bulanData = bulanKey ? data[bulanKey] : {};
                UNITS.forEach(function (u) {
                    var unitKey = Object.keys(bulanData).find(function (k) { return k.trim() === u.trim(); })
                        || Object.keys(bulanData).find(function (k) { return k.trim().toLowerCase() === u.trim().toLowerCase(); });
                    var unitData = unitKey ? bulanData[unitKey] : null;
                    if (unitData !== null && unitData !== undefined) {
                        var raw = unitData.total !== undefined ? unitData.total
                            : unitData.totalNilai !== undefined ? unitData.totalNilai
                                : unitData.nilai !== undefined ? unitData.nilai : null;
                        if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[u].monev = v; }
                    }
                });
                return;
            }
            if (type === 'array') {
                var records = data.filter(function (d) { return normalizeBulan(d.bulan || d.month || d.periode || '') === bulan; });
                records.forEach(function (d) {
                    var unitRaw = String(d.unit || d.divisi || d.bidang || '').trim();
                    var matchedUnit = UNITS.find(function (u) { return u.trim() === unitRaw; })
                        || UNITS.find(function (u) { return u.trim().toLowerCase() === unitRaw.toLowerCase(); });
                    if (!matchedUnit) return;
                    var raw = d.total !== undefined ? d.total
                        : d.totalNilai !== undefined ? d.totalNilai
                            : d.nilai !== undefined ? d.nilai : null;
                    if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[matchedUnit].monev = v; }
                });
                return;
            }
        }
        // Fallback localStorage monev
        UNITS.forEach(function (u) {
            try {
                var keys = ['monev_' + bulan + '_' + u, 'monev_' + bulan.toLowerCase() + '_' + u, 'monev_' + cap(bulan) + '_' + u];
                for (var i = 0; i < keys.length; i++) {
                    var d = JSON.parse(localStorage.getItem(keys[i]) || 'null');
                    if (!d) continue;
                    var v = d.totalScore !== undefined ? d.totalScore
                        : d.total !== undefined ? d.total
                            : d.totalNilai !== undefined ? d.totalNilai : null;
                    if (v !== null && !isNaN(parseFloat(v))) { sc[u].monev = parseFloat(v); break; }
                }
            } catch (e) { }
        });
    }
    function dbSyncToPPOCache() {
        try {
            var bulan = S.bulan;
            if (!bulan || !S.scores) return;
 
            var PPO_CACHE_KEY = 'penilaian_orang_team_cache_v1';
            var MODS_KEYS = ['bbm', 'kendaraan', 'ruang', 'kearsipan', 'spj', 'monev'];
 
            var scores = {};
            Object.keys(S.scores).forEach(function(unit) {
                var d = S.scores[unit];
                if (!d) return;
 
                var total = 0, hasAny = false, entry = {};
                MODS_KEYS.forEach(function(k) {
                    var raw = d[k];
                    var v = (raw !== null && raw !== undefined) ? parseFloat(raw) : null;
                    var val = (!isNaN(v) && v !== null) ? +v.toFixed(2) : 0;
                    entry[k] = val;
                    if (!isNaN(v) && v !== null) { total += val; hasAny = true; }
                });
 
                if (hasAny) {
                    entry.total = +total.toFixed(2);
                    scores[unit] = entry;
                }
            });
 
            if (!Object.keys(scores).length) return;
 
            var existing = {};
            try { existing = JSON.parse(localStorage.getItem(PPO_CACHE_KEY) || '{}'); } catch(e) {}
            existing[bulan] = { scores: scores, timestamp: Date.now() };
            localStorage.setItem(PPO_CACHE_KEY, JSON.stringify(existing));
 
            console.log('[Dashboard→PPO] Cache synced:', bulan, '—', Object.keys(scores).length, 'unit');
        } catch(e) {
            console.warn('[Dashboard→PPO] Sync gagal:', e);
        }
    }

    // ── Render ────────────────────────────────────────────────────
    function render() {
        renderStats();
        renderTable();
        renderMobileCards(); // ← fix mobile
        renderPanel();
        dbSyncToPPOCache();
    }

    function renderStats() {
        var rows = mkRows();
        var wd = rows.filter(function (r) { return r.has; });
        var tots = wd.map(function (r) { return r.tot; });
        var avg = tots.length ? tots.reduce(function (a, c) { return a + c; }, 0) / tots.length : 0;
        var best = tots.length ? Math.max.apply(null, tots) : 0;
        var worst = tots.length ? Math.min.apply(null, tots) : 0;
        var bestU = (rows.find(function (r) { return r.tot === best; }) || {}).unit || '—';
        var el = document.getElementById('db-statsGrid');
        if (!el) return;
        el.innerHTML =
            '<div class="stat-card"><div class="stat-card-bar" style="background:#3b82f6"></div>'
            + '<div class="stat-label">Rata-rata Total Nilai</div>'
            + '<div class="stat-value">' + fn(avg) + '</div>'
            + '<div class="stat-footer">dari ' + TOTAL_MAX + ' poin · ' + ((avg / TOTAL_MAX) * 100).toFixed(0) + '%</div></div>'

            + '<div class="stat-card"><div class="stat-card-bar" style="background:#10b981"></div>'
            + '<div class="stat-label">Nilai Tertinggi</div>'
            + '<div class="stat-value" style="color:#059669">' + fn(best) + '</div>'
            + '<div class="stat-footer">' + (US[bestU] || bestU) + '</div></div>'

            + '<div class="stat-card"><div class="stat-card-bar" style="background:#ef4444"></div>'
            + '<div class="stat-label">Nilai Terendah</div>'
            + '<div class="stat-value" style="color:#dc2626">' + fn(worst) + '</div>'
            + '<div class="stat-footer">perlu perhatian</div></div>'

            + '<div class="stat-card"><div class="stat-card-bar" style="background:#8b5cf6"></div>'
            + '<div class="stat-label">Divisi Terdata</div>'
            + '<div class="stat-value">' + wd.length + '</div>'
            + '<div class="stat-footer">dari ' + UNITS.length + ' divisi</div></div>';
    }

    function renderTable() {
        var rows = mkRows();
        rows.sort(function (a, b) { if (a.has !== b.has) return a.has ? -1 : 1; return b.tot - a.tot; });
        var el = document.getElementById('db-rekapTbody');
        if (!el) return;
        if (rows.every(function (r) { return !r.has; })) {
            el.innerHTML = '<tr><td colspan="10" class="empty-state">📭 Belum ada data penilaian untuk bulan <strong>' + cap(S.bulan) + '</strong></td></tr>';
            return;
        }
        el.innerHTML = rows.map(function (r, i) {
            var pct = r.has ? (r.tot / TOTAL_MAX * 100) : 0;
            var progColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';

            function cell(key, max) {
                var v = r.vals[key];
                if (v === null) return '<td style="text-align:center"><span class="chip chip-none">—</span></td>';
                var p = v / max * 100;
                var cls = p >= 80 ? 'chip-great' : p >= 60 ? 'chip-good' : p >= 40 ? 'chip-fair' : 'chip-poor';
                return '<td style="text-align:center"><span class="chip ' + cls + '">' + fn(v) + '</span></td>';
            }

            var totalCls = !r.has ? 'total-none'
                : pct >= 80 ? 'total-great' : pct >= 60 ? 'total-good'
                    : pct >= 40 ? 'total-fair' : 'total-poor';

            return '<tr>'
                + '<td><span class="rank-badge">' + (i + 1) + '</span></td>'
                + '<td style="font-weight:600;min-width:170px">' + r.unit + '</td>'
                + cell('bbm', 5) + cell('kendaraan', 10) + cell('ruang', 5) + cell('kearsipan', 5) + cell('spj', 35) + cell('monev', 40)
                + '<td style="text-align:center"><span class="total-chip ' + totalCls + '">' + (r.has ? fn(r.tot) : '—') + '</span></td>'
                + '<td><div class="prog-wrap">'
                + '<div class="prog-bar"><div class="prog-fill" style="width:' + Math.min(pct, 100).toFixed(0) + '%;background:' + progColor + '"></div></div>'
                + '<span class="prog-label">' + (r.has ? pct.toFixed(0) + '%' : '—') + '</span>'
                + '</div></td>'
                + '</tr>';
        }).join('');
    }

    // ── Mobile Cards (pengganti tabel di HP) ──────────────────────
    function renderMobileCards() {
        var container = document.getElementById('db-rekapCards');
        if (!container) return;

        var rows = mkRows();
        rows.sort(function (a, b) {
            if (a.has !== b.has) return a.has ? -1 : 1;
            return b.tot - a.tot;
        });

        if (rows.every(function (r) { return !r.has; })) {
            container.innerHTML = '<div style="text-align:center;padding:32px;color:#94a3b8;font-size:14px">'
                + '📭 Belum ada data penilaian untuk bulan <strong>' + cap(S.bulan) + '</strong></div>';
            return;
        }

        container.innerHTML = rows.map(function (r, i) {
            var pct = r.has ? (r.tot / TOTAL_MAX * 100) : 0;
            var progColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
            var totalCls = !r.has ? 'total-none'
                : pct >= 80 ? 'total-great' : pct >= 60 ? 'total-good'
                    : pct >= 40 ? 'total-fair' : 'total-poor';

            var modRows = MODS.map(function (m) {
                var v = r.vals[m.key];
                var p = v !== null ? (v / m.max * 100) : 0;
                var cls = v === null ? 'chip-none'
                    : p >= 80 ? 'chip-great' : p >= 60 ? 'chip-good'
                        : p >= 40 ? 'chip-fair' : 'chip-poor';
                return '<div style="display:flex;justify-content:space-between;align-items:center;'
                    + 'padding:7px 0;border-bottom:1px solid #f1f5f9">'
                    + '<span style="font-size:13px;color:#64748b">' + m.label
                    + ' <span style="font-size:11px;color:#94a3b8">/' + m.max + '</span></span>'
                    + '<span class="chip ' + cls + '">' + (v !== null ? fn(v) : '—') + '</span>'
                    + '</div>';
            }).join('');

            var progBar = r.has
                ? '<div style="margin-top:10px">'
                + '<div class="prog-wrap">'
                + '<div class="prog-bar"><div class="prog-fill" style="width:' + pct.toFixed(0) + '%;background:' + progColor + '"></div></div>'
                + '<span class="prog-label">' + pct.toFixed(0) + '%</span>'
                + '</div></div>'
                : '';

            return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;'
                + 'padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)">'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">'
                + '<div style="display:flex;align-items:center;gap:8px">'
                + '<span class="rank-badge">' + (i + 1) + '</span>'
                + '<span style="font-weight:700;font-size:14px">' + r.unit + '</span>'
                + '</div>'
                + '<span class="total-chip ' + totalCls + '">' + (r.has ? fn(r.tot) : '—') + '</span>'
                + '</div>'
                + modRows
                + progBar
                + '</div>';
        }).join('');
    }

    // ── Charts ─────────────────────────────────────────────────────
    function renderPanel() {
        var panels = ['db-pTotal', 'db-pTrend', 'db-pCat', 'db-pProfil'];
        var active = panels.find(function (id) {
            var el = document.getElementById(id);
            return el && el.hasAttribute('data-active');
        }) || 'db-pTotal';
        if (active === 'db-pTotal') drawTotal();
        else if (active === 'db-pTrend') drawTrend();
        else if (active === 'db-pCat') drawCat();
        else if (active === 'db-pProfil') drawProfil();
    }

    window.dbGoTab = function (name, btn) {
        document.querySelectorAll('#section-dashboard .chart-tab').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var map = { total: 'db-pTotal', trend: 'db-pTrend', cat: 'db-pCat', profil: 'db-pProfil' };
        ['db-pTotal', 'db-pTrend', 'db-pCat', 'db-pProfil'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.removeAttribute('data-active'); }
        });
        var el = document.getElementById(map[name]);
        if (el) { el.style.display = ''; el.setAttribute('data-active', '1'); }
        if (name === 'total') drawTotal();
        else if (name === 'trend') drawTrend();
        else if (name === 'cat') drawCat();
        else if (name === 'profil') drawProfil();
    };

    function drawTotal() {
        kill('cStacked'); kill('cRadarMain');
        var labels = UNITS.map(function (u) { return US[u]; });
        var ds = MODS.map(function (m) {
            return {
                label: m.label,
                data: UNITS.map(function (u) { return +(S.scores[u] ? (S.scores[u][m.key] || 0) : 0); }),
                backgroundColor: m.color + 'bb',
                borderColor: m.color,
                borderWidth: 1,
                borderRadius: 3
            };
        });
        C.cStacked = new Chart(document.getElementById('db-cStacked'), {
            type: 'bar',
            data: { labels: labels, datasets: ds },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, padding: 10, boxWidth: 10 } },
                    tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.raw + ' poin'; } } }
                },
                scales: {
                    x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
                    y: {
                        stacked: true, max: TOTAL_MAX, grid: { color: '#f1f5f9' },
                        ticks: { font: { family: 'Inter', size: 11 } },
                        title: { display: true, text: 'Total Nilai (/100)', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        var rd = MODS.map(function (m) {
            var vs = UNITS.map(function (u) { return S.scores[u] ? S.scores[u][m.key] : null; }).filter(function (v) { return v !== null; });
            return vs.length ? +((vs.reduce(function (a, c) { return a + c; }, 0) / vs.length / m.max * 100).toFixed(1)) : 0;
        });
        C.cRadarMain = new Chart(document.getElementById('db-cRadarMain'), {
            type: 'radar',
            data: {
                labels: MODS.map(function (m) { return m.label; }),
                datasets: [{
                    label: 'Rata-rata %',
                    data: rd,
                    backgroundColor: 'rgba(15,23,42,.08)',
                    borderColor: '#0f172a',
                    borderWidth: 2,
                    pointBackgroundColor: MODS.map(function (m) { return m.color; }),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function (c) { return c.raw + '% dari maks.'; } } }
                },
                scales: {
                    r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, font: { family: 'Inter', size: 10 }, color: '#94a3b8' },
                        pointLabels: { font: { family: 'Inter', size: 11 } },
                        grid: { color: '#f1f5f9' }
                    }
                }
            }
        });
    }

    function drawTrend() {
        kill('cTrend');
        Object.keys(C).filter(function (k) { return k.startsWith('sm_'); }).forEach(function (k) { C[k].destroy(); delete C[k]; });

        var ds = UNITS.map(function (u, i) {
            return {
                label: US[u],
                data: MONTHS.map(function (m) {
                    var sc = S.allMonth[m] ? S.allMonth[m][u] : null;
                    if (!sc) return null;
                    var t = 0, h = false;
                    MODS.forEach(function (mo) { if (sc[mo.key] !== null && sc[mo.key] !== undefined) { t += sc[mo.key]; h = true; } });
                    return h ? +t.toFixed(2) : null;
                }),
                borderColor: UC[i],
                backgroundColor: UC[i] + '22',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: UC[i],
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: false,
                tension: .35,
                spanGaps: true
            };
        });

        C.cTrend = new Chart(document.getElementById('db-cTrend'), {
            type: 'line',
            data: { labels: MOS, datasets: ds },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, padding: 10, boxWidth: 10 } },
                    tooltip: { callbacks: { label: function (c) { return c.raw !== null ? c.dataset.label + ': ' + c.raw + '/' + TOTAL_MAX : '—'; } } }
                },
                scales: {
                    x: { grid: { color: '#f8fafc' }, ticks: { font: { family: 'Inter', size: 11 } } },
                    y: {
                        min: 0, max: TOTAL_MAX, grid: { color: '#f1f5f9' },
                        ticks: { font: { family: 'Inter', size: 11 } },
                        title: { display: true, text: 'Total (/100)', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        var grid = document.getElementById('db-trendSmall');
        grid.innerHTML = UNITS.map(function (u, i) {
            return '<div class="card">'
                + '<div class="card-header" style="padding:12px 18px">'
                + '<span class="card-title" style="color:' + UC[i] + ';font-size:14px">' + US[u] + '</span>'
                + '</div>'
                + '<div class="card-content" style="padding:14px">'
                + '<div class="chart-wrap h-230"><canvas id="db-sm_' + i + '"></canvas></div>'
                + '</div></div>';
        }).join('');

        UNITS.forEach(function (u, i) {
            var smDs = MODS.map(function (m) {
                return {
                    label: m.label,
                    data: MONTHS.map(function (mo) {
                        return +(S.allMonth[mo] && S.allMonth[mo][u] ? (S.allMonth[mo][u][m.key] || 0) : 0).toFixed(2);
                    }),
                    backgroundColor: m.color + 'aa',
                    borderColor: m.color,
                    borderWidth: 1,
                    borderRadius: 2
                };
            });
            C['sm_' + i] = new Chart(document.getElementById('db-sm_' + i), {
                type: 'bar',
                data: { labels: MOS, datasets: smDs },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.raw; } } }
                    },
                    scales: {
                        x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Inter', size: 9 } } },
                        y: { stacked: true, max: TOTAL_MAX, grid: { color: '#f1f5f9' }, ticks: { font: { family: 'Inter', size: 9 } } }
                    }
                }
            });
        });
    }

    function drawCat() {
        kill('cCat'); kill('cCat2');
        var mod = MODS.find(function (m) { return m.key === activeCat; });
        document.getElementById('db-catTitle').textContent = mod.label + ' — Semua Divisi, ' + cap(S.bulan);
        document.getElementById('db-catNote').textContent = 'Maks. ' + mod.max + ' poin per divisi';
        document.getElementById('db-catTitle2').textContent = mod.label + ' — Tren Lintas Bulan per Divisi';

        C.cCat = new Chart(document.getElementById('db-cCat'), {
            type: 'bar',
            data: {
                labels: UNITS.map(function (u) { return US[u]; }),
                datasets: [{
                    label: mod.label,
                    data: UNITS.map(function (u) {
                        return +(S.scores[u] && S.scores[u][activeCat] !== null ? S.scores[u][activeCat] : 0).toFixed(2);
                    }),
                    backgroundColor: UNITS.map(function (u) {
                        var v = S.scores[u] && S.scores[u][activeCat] ? S.scores[u][activeCat] : 0;
                        var p = v / mod.max * 100;
                        return p >= 80 ? '#10b981bb' : p >= 60 ? '#3b82f6bb' : p >= 40 ? '#f59e0bbb' : '#ef4444bb';
                    }),
                    borderColor: mod.color,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: function (c) { return c.raw + ' / ' + mod.max + ' poin (' + ((c.raw / mod.max * 100).toFixed(0)) + '%)'; } } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12 } } },
                    y: {
                        min: 0, max: mod.max, grid: { color: '#f1f5f9' },
                        ticks: { font: { family: 'Inter', size: 11 } },
                        title: { display: true, text: 'Nilai ' + mod.label + ' (/' + mod.max + ')', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });

        var ds2 = UNITS.map(function (u, i) {
            return {
                label: US[u],
                data: MONTHS.map(function (m) {
                    return +(S.allMonth[m] && S.allMonth[m][u] && S.allMonth[m][u][activeCat] ? S.allMonth[m][u][activeCat] : 0).toFixed(2);
                }),
                borderColor: UC[i],
                backgroundColor: UC[i] + '22',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: UC[i],
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: false,
                tension: .35,
                spanGaps: true
            };
        });

        C.cCat2 = new Chart(document.getElementById('db-cCat2'), {
            type: 'line',
            data: { labels: MOS, datasets: ds2 },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 11 }, padding: 8, boxWidth: 10 } },
                    tooltip: { callbacks: { label: function (c) { return c.dataset.label + ': ' + c.raw + '/' + mod.max; } } }
                },
                scales: {
                    x: { grid: { color: '#f8fafc' }, ticks: { font: { family: 'Inter', size: 11 } } },
                    y: {
                        min: 0, max: mod.max, grid: { color: '#f1f5f9' },
                        ticks: { font: { family: 'Inter', size: 11 } },
                        title: { display: true, text: '/' + mod.max, font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });
    }

    function drawProfil() {
        Object.keys(C).filter(function (k) { return k.startsWith('rd_'); }).forEach(function (k) { C[k].destroy(); delete C[k]; });

        var grid = document.getElementById('db-radarGrid');
        grid.innerHTML = UNITS.map(function (u, i) {
            return '<div class="card">'
                + '<div class="card-header" style="padding:12px 18px">'
                + '<span class="card-title" style="color:' + UC[i] + '">' + US[u] + '</span>'
                + '<span class="card-note">' + cap(S.bulan) + '</span>'
                + '</div>'
                + '<div class="card-content" style="padding:14px">'
                + '<div class="chart-wrap h-230"><canvas id="db-rd_' + i + '"></canvas></div>'
                + '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center">'
                + MODS.map(function (m) {
                    var v = S.scores[u] ? S.scores[u][m.key] : null;
                    return '<span style="font-size:10px;font-weight:600;color:' + m.color + '">'
                        + m.label + ': ' + (v !== null ? fn(v) : '—') + '/' + m.max + '</span>';
                }).join('<span style="color:#e5e7eb">|</span>')
                + '</div></div></div>';
        }).join('');

        UNITS.forEach(function (u, i) {
            var data = MODS.map(function (m) {
                var v = S.scores[u] ? S.scores[u][m.key] : null;
                return v !== null ? +((v / m.max) * 100).toFixed(1) : 0;
            });
            C['rd_' + i] = new Chart(document.getElementById('db-rd_' + i), {
                type: 'radar',
                data: {
                    labels: MODS.map(function (m) { return m.label; }),
                    datasets: [{
                        label: US[u],
                        data: data,
                        backgroundColor: UC[i] + '22',
                        borderColor: UC[i],
                        borderWidth: 2,
                        pointBackgroundColor: MODS.map(function (m) { return m.color; }),
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { callbacks: { label: function (c) { return c.raw + '%'; } } }
                    },
                    scales: {
                        r: {
                            min: 0, max: 100,
                            ticks: { stepSize: 50, font: { size: 9 }, color: '#94a3b8' },
                            pointLabels: { font: { family: 'Inter', size: 10 } },
                            grid: { color: '#f1f5f9' }
                        }
                    }
                }
            });
        });
    }

    function buildCatRow() {
        var wrap = document.getElementById('db-catRow');
        if (!wrap) return;
        MODS.forEach(function (m) {
            var b = document.createElement('button');
            b.className = 'cat-btn';
            b.textContent = m.label;
            if (m.key === activeCat) { b.style.background = m.color; b.style.color = '#fff'; }
            b.onclick = function () {
                activeCat = m.key;
                wrap.querySelectorAll('.cat-btn').forEach(function (bb) {
                    bb.style.background = '#f1f5f9';
                    bb.style.color = '#64748b';
                });
                b.style.background = m.color;
                b.style.color = '#fff';
                drawCat();
            };
            wrap.appendChild(b);
        });
    }

    function mkRows() {
        return UNITS.map(function (u) {
            var s = S.scores[u] || {};
            var tot = 0, has = false;
            var vals = {};
            MODS.forEach(function (m) {
                vals[m.key] = s[m.key] !== undefined ? s[m.key] : null;
                if (vals[m.key] !== null) { tot += vals[m.key]; has = true; }
            });
            return { unit: u, vals: vals, tot: tot, has: has };
        });
    }

    function setRefreshLoading(on) {
        var btn = document.getElementById('db-btnRefresh');
        if (!btn) return;
        btn.classList.toggle('loading', on);
        btn.disabled = on;
    }

    // ── Public global functions (dipanggil dari HTML onclick) ─────
    window.dbLoadAll = function () {
        S.bulan = document.getElementById('db-bulanSelect').value;
        loadAll();
    };

    window.dbOnBulanChange = function () {
        S.bulan = document.getElementById('db-bulanSelect').value;
        loadAll();
    };

    // ── Register init (lazy load) ─────────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits['dashboard'] = function () {
        var now = new Date();
        var selEl = document.getElementById('db-bulanSelect');
        if (selEl) selEl.value = MONTHS[now.getMonth()];
        S.bulan = MONTHS[now.getMonth()];
        var dateEl = document.getElementById('db-headerDate');
        if (dateEl) dateEl.textContent = now.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        buildCatRow();
        document.getElementById('db-pTotal').setAttribute('data-active', '1');
        loadAll();
    };

})();