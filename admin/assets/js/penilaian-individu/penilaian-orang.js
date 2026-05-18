// ============================================================
// penilaian-orang.js — Penilaian Per Orang (TRIWULAN) v6.3
// Admin Panel — Dinas Koperasi UKM
//
// PERUBAHAN v6.3:
//  - Tambah tombol DELETE di setiap baris tabel (toolbar)
//  - Konfirmasi delete lewat showConfirmModal atau confirm()
//  - Skor tim diambil dari integration v2.3 (identik dashboard:
//    BBM + Kendaraan + Ruang + Kearsipan + SPJ + Monev)
//  - Formula skor tim × 60% (maks 60 poin) sudah benar
//  - Indikator loading skor tim per bulan di modal
//  - Refresh skor tim: reset cache lalu fetch ulang
// ============================================================
(function () {
    'use strict';

    var SECTION_ID = 'penilaian-orang';
    var DATA_KEY   = 'penilaian_orang_tw_v1';

    // Bersihkan cache lama saat script load
    (function clearOldCaches() {
        try {
            localStorage.removeItem('penilaian_orang_team_cache_v1');
            localStorage.removeItem('penilaian_orang_diklat_cache_v1');
        } catch (e) {}
    })();

    function getGasUrl() {
        return (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.url)
            ? window.PPO_GAS_CONFIG.url : '';
    }
    function getOperasionalUrl() {
        return (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.urlOperasional)
            ? window.PPO_GAS_CONFIG.urlOperasional : '';
    }

    // ── Triwulan definitions ──────────────────────────────────────
    var TRIWULAN_DEF = {
        'TW I'  : { label: 'Triwulan I',   months: ['JANUARI',  'FEBRUARI', 'MARET'],
                    short: 'Jan–Mar', index: 1 },
        'TW II' : { label: 'Triwulan II',  months: ['APRIL',    'MEI',      'JUNI'],
                    short: 'Apr–Jun', index: 2 },
        'TW III': { label: 'Triwulan III', months: ['JULI',     'AGUSTUS',  'SEPTEMBER'],
                    short: 'Jul–Sep', index: 3 },
        'TW IV' : { label: 'Triwulan IV',  months: ['OKTOBER',  'NOVEMBER', 'DESEMBER'],
                    short: 'Okt–Des', index: 4 }
    };
    var TW_KEYS = ['TW I', 'TW II', 'TW III', 'TW IV'];

    function currentTW() {
        var m = new Date().getMonth();
        if (m <= 2) return 'TW I';
        if (m <= 5) return 'TW II';
        if (m <= 8) return 'TW III';
        return 'TW IV';
    }

    var UNITS = [
        'Sekretariat','Bidang Koperasi','Bidang UKM',
        'Bidang Usaha Mikro','Bidang Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM'
    ];

    var AKHLAK = [
        { key:'pelayanan',   label:'Berorientasi Pelayanan',
          desc:'Memahami & memenuhi kebutuhan masyarakat; ramah, cekatan, solutif; melakukan perbaikan tiada henti.' },
        { key:'akuntabel',   label:'Akuntabel',
          desc:'Jujur, bertanggung jawab, cermat, disiplin, berintegritas; efisien gunakan BMN; tidak menyalahgunakan wewenang.' },
        { key:'kompeten',    label:'Kompeten',
          desc:'Mengembangkan kompetensi diri; membantu orang lain belajar; melaksanakan tugas dengan kualitas terbaik.' },
        { key:'harmonis',    label:'Harmonis',
          desc:'Menghargai setiap orang apapun latar belakangnya; suka menolong; membangun lingkungan kerja kondusif.' },
        { key:'loyal',       label:'Loyal',
          desc:'Setia pada Pancasila & UUD 1945, NKRI & pemerintahan yang sah; menjaga nama baik instansi; menjaga rahasia jabatan.' },
        { key:'adaptif',     label:'Adaptif',
          desc:'Cepat menyesuaikan diri; terus berinovasi & kreatif; bertindak proaktif.' },
        { key:'kolaboratif', label:'Kolaboratif',
          desc:'Memberi kesempatan kontribusi; terbuka bekerja sama; menggerakkan pemanfaatan sumber daya bersama.' }
    ];

    var ROLE_TO_GID = {
        penilai_sekretariat : 'sekretariat',
        penilai_ketua       : 'agus',
        penilai_koperasi    : 'koperasi',
        penilai_ukm         : 'ukm',
        penilai_usaha_mikro : 'usaha-mikro',
        penilai_kewirausahaan: 'kewirausahaan',
        penilai_blut        : 'blut',
    };

    var GROUPS = [
        {
            id:'agus', evaluator:'Agus Mulyono, S.P., M.T.', unitLabel:'Lintas Unit',
            people:[
                { name:'Ritaningrum, S.Sos., M.M.',                       unit:'Sekretariat' },
                { name:'Hellen Phornica, S.T.P., M.Si.',                  unit:'Bidang UKM' },
                { name:'Veronica Setioningtyas Prativi, S.Si., M.Si.',     unit:'Bidang Usaha Mikro' },
                { name:'Wisnu Hermawan, S.P., M.T.',                       unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Ir. Setyo Hastuti, M.P.',                          unit:'Bidang Koperasi' },
                { name:'Hana Fais Prabowo, S.T.P., M.Si.',                unit:'Bidang Kewirausahaan' }
            ]
        },
        {
            id:'sekretariat', evaluator:'Ritaningrum, S.Sos., M.M.', unitLabel:'Sekretariat',
            people:[
                { name:'Fuji Ippa Wati, S.E.',                            unit:'Sekretariat' },
                { name:'Winarto, S.E.',                                    unit:'Sekretariat' },
                { name:'Ice Norawati, S.E., Akt.',                         unit:'Sekretariat' },
                { name:'Marselina Widaranti, S.T., M.T.',                  unit:'Sekretariat' },
                { name:'Hana Kurniawati',                                  unit:'Sekretariat' },
                { name:'Raden Bambang Bagus Tri Hantoro, S.M.',            unit:'Sekretariat' },
                { name:'Heru Wiranto, SIP',                                unit:'Sekretariat' },
                { name:'Septia Yudha Rennaningtyas, S.M.B.',               unit:'Sekretariat' },
                { name:'Dias Hartanto, S.M.',                              unit:'Sekretariat' },
                { name:'Anas Margono, S.Kom.',                             unit:'Sekretariat' },
                { name:'Joko Sambudi Raharjo',                             unit:'Sekretariat' },
                { name:'Luvianingsih, A.Md.',                              unit:'Sekretariat' },
                { name:'Hesti Ratnasari, A.Md.',                           unit:'Sekretariat' },
                { name:'Rana Salsabila Putri',                             unit:'Sekretariat' },
                { name:'Bob Prabowo, S.E.',                                unit:'Sekretariat' },
                { name:'Windu Wahyu Suryaningsih, S.E.',                   unit:'Sekretariat' },
                { name:'Dhaniar Fitria Widyaningtyas, S.E.',               unit:'Sekretariat' },
                { name:'Nita Arum Sari, A.Md.Sek.',                       unit:'Sekretariat' }
            ]
        },
        {
            id:'koperasi', evaluator:'Ir. Setyo Hastuti, M.P.', unitLabel:'Bidang Koperasi',
            people:[
                { name:'Purnama Setiawan, S.T.',                           unit:'Bidang Koperasi' },
                { name:'Fikri Muttaqin, S.A.B.',                           unit:'Bidang Koperasi' },
                { name:'Rembranto Gusani Putro, S.A.B.',                   unit:'Bidang Koperasi' },
                { name:'Faris Rizki Rahardian, S.H.',                      unit:'Bidang Koperasi' },
                { name:'Anindya Putri Kusumaningrum, S.H.',                unit:'Bidang Koperasi' },
                { name:'Firdha Ikhsania Fadilla, S.H.',                    unit:'Bidang Koperasi' },
                { name:'Laura Nindya Khalista, S.H.',                      unit:'Bidang Koperasi' }
            ]
        },
        {
            id:'ukm', evaluator:'Hellen Phornica, S.T.P., M.Si.', unitLabel:'Bidang UKM',
            people:[
                { name:'Perpetua Windhy Harmonie, S.E., M.E.',             unit:'Bidang UKM' },
                { name:'Yogie Krisnawangi Saifullah, S.A.B.',              unit:'Bidang UKM' },
                { name:'Ali Najmudin, S.A.B.',                             unit:'Bidang UKM' },
                { name:'Edi Susila',                                        unit:'Bidang UKM' },
                { name:'Asyifa Dicha Firani, S.T.',                        unit:'Bidang UKM' },
                { name:'Deni Wijayanto, S.Kom.',                           unit:'Bidang UKM' }
            ]
        },
        {
            id:'usaha-mikro', evaluator:'Veronica Setioningtyas Prativi, S.Si., M.Si.', unitLabel:'Bidang Usaha Mikro',
            people:[
                { name:'Alexius Widhi Nur Pambudi, S.E., M.Sc.',           unit:'Bidang Usaha Mikro' },
                { name:'Rizki Octaviani, S.T.',                            unit:'Bidang Usaha Mikro' },
                { name:'Desi Kurniawati, S.H., M.Acc.',                    unit:'Bidang Usaha Mikro' },
                { name:'Asrindha Patriandina, S.STP.',                     unit:'Bidang Usaha Mikro' },
                { name:'Bernadheta Gezia Arine, S.E.',                     unit:'Bidang Usaha Mikro' },
                { name:'Gita Putri Andikawati, S.E.',                      unit:'Bidang Usaha Mikro' }
            ]
        },
        {
            id:'kewirausahaan', evaluator:'Hana Fais Prabowo, S.T.P., M.Si.', unitLabel:'Bidang Kewirausahaan',
            people:[
                { name:'Ratna Listiyani, S.Si.',                           unit:'Bidang Kewirausahaan' },
                { name:'Muhammad Daud Ramadhan, S.H.',                     unit:'Bidang Kewirausahaan' },
                { name:'Nanda Kesuma Devi, S.I.A.',                        unit:'Bidang Kewirausahaan' },
                { name:'Rosalia Kurnia Handari, S.T.P.',                   unit:'Bidang Kewirausahaan' },
                { name:'Pancais Meysir Kusdanarko, S.E.',                  unit:'Bidang Kewirausahaan' },
                { name:'Annisa Sulcha Afifah, S.Kom.',                     unit:'Bidang Kewirausahaan' },
                { name:'Endah Febriasih, S.A.B.',                          unit:'Bidang Kewirausahaan' }
            ]
        },
        {
            id:'blut', evaluator:'Wisnu Hermawan, S.P., M.T.', unitLabel:'Balai Layanan Usaha Terpadu KUMKM',
            people:[
                { name:'Aribowo, S.Pi., M.Eng.',                           unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Kuntarta, S.Sos., M.AP',                           unit:'Balai Layanan Usaha Terpadu KUMKM' },
                { name:'Hana Budi Setyowati, S.T.',                        unit:'Balai Layanan Usaha Terpadu KUMKM' }
            ]
        }
    ];

    // ── STATE ─────────────────────────────────────────────────────
    var state = {
        tw: currentTW(),
        search: '', groupFilter: '', statusFilter: '',
        records: {},
        teamScoresByMonth: {},
        teamScoresByTW: {},
        diklatScores: {},
        diklatLoaded: false,
        currentUser: null, loading: false
    };
    var chartTwPPO = null;

    // ══════════════════════════════════════════════════════════
    // STORAGE
    // ══════════════════════════════════════════════════════════
    function loadRecords() {
        try { state.records = JSON.parse(localStorage.getItem(DATA_KEY) || '{}'); }
        catch (e) { state.records = {}; }
    }
    function saveRecords() {
        try { localStorage.setItem(DATA_KEY, JSON.stringify(state.records)); }
        catch (e) { console.warn('[PPO-TW] localStorage penuh'); }
    }
    function getRec(personPid) {
        return (state.records[state.tw] || {})[personPid] || null;
    }
    function setRec(personPid, rec) {
        if (!state.records[state.tw]) state.records[state.tw] = {};
        state.records[state.tw][personPid] = rec;
        saveRecords();
    }
    function delRec(personPid) {
        if (state.records[state.tw] && state.records[state.tw][personPid]) {
            delete state.records[state.tw][personPid];
            saveRecords();
        }
    }
    function getCurrentYearString() { return String(new Date().getFullYear()); }

    // ── DIKLAT ────────────────────────────────────────────────────
    function fetchDiklatScores() {
        if (window.diklatGetMasterData) {
            var md = window.diklatGetMasterData();
            if (md && md.length > 0) {
                console.log('[PPO-TW] Diklat: diklatGetMasterData(), jumlah:', md.length);
                return Promise.resolve(_buildDiklatMap(md));
            }
        }
        var urlOp = getOperasionalUrl();
        if (!urlOp) {
            console.warn('[PPO-TW] Diklat: URL operasional kosong');
            return Promise.resolve({});
        }
        console.log('[PPO-TW] Diklat: fetch dari GAS:', urlOp);
        return new Promise(function (resolve) {
            var cb = '__ppoDiklat_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done = false, script = document.createElement('script');
            var timer = setTimeout(function () {
                if (done) return; cleanup();
                console.warn('[PPO-TW] Diklat fetch timeout');
                resolve({});
            }, 15000);
            function cleanup() {
                done = true; clearTimeout(timer);
                try { delete window[cb]; } catch(e){}
                if (script.parentNode) script.parentNode.removeChild(script);
            }
            window[cb] = function (data) {
                cleanup();
                console.log('[PPO-TW] Diklat response:', data && data.status, 'count:', data && data.diklat && data.diklat.length);
                if (data && data.status === 'success' && Array.isArray(data.diklat)) {
                    resolve(_buildDiklatMap(data.diklat));
                } else {
                    resolve({});
                }
            };
            script.onerror = function () { if (done) return; cleanup(); resolve({}); };
            script.src = urlOp + '?action=getDiklat&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    function _buildDiklatMap(diklatList) {
        var KEYS = ['triwulan1','triwulan2','triwulan3','triwulan4'];
        var map = {};
        diklatList.forEach(function (d) {
            var nama = (d.nama || '').toLowerCase().trim();
            if (!nama) return;
            var hasAny = KEYS.some(function (k) {
                var val = d[k];
                if (!val) return false;
                if (typeof val === 'object') return !!(val.link || val.fileName || val.fileDataUrl);
                return String(val).trim() !== '';
            });
            map[nama] = hasAny;
        });
        return map;
    }

    function getDiklatValue(personName) {
        if (!state.diklatLoaded) return null;
        var key = (personName || '').toLowerCase().trim();
        return state.diklatScores[key] === true ? 10 : 0;
    }

    // ══════════════════════════════════════════════════════════
    // SKOR TIM
    // Diambil dari integration v2.3 yang memanggil semua API
    // operasional identik dengan dashboard, kemudian rata-rata
    // 3 bulan per triwulan. Skor tim × 0.60 = maks 60 poin.
    // ══════════════════════════════════════════════════════════

    function normalizeUnitKey(s) {
        return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function findUnitScoreInMonth(monthScores, unitName) {
        if (!monthScores || typeof monthScores !== 'object') return null;
        var targetNorm = normalizeUnitKey(unitName);
        var exactKey = Object.keys(monthScores).find(function(k) {
            return normalizeUnitKey(k) === targetNorm;
        });
        if (exactKey) return monthScores[exactKey];
        var partialKey = Object.keys(monthScores).find(function(k) {
            var kNorm = normalizeUnitKey(k);
            return kNorm.indexOf(targetNorm) !== -1 || targetNorm.indexOf(kNorm) !== -1;
        });
        if (partialKey) return monthScores[partialKey];
        return null;
    }

    function calcTWTeamScores(twKey) {
        var months = TRIWULAN_DEF[twKey].months;
        var result = {};

        UNITS.forEach(function (unit) {
            var vals = [];
            months.forEach(function (m) {
                var msc = state.teamScoresByMonth[m];
                if (!msc) {
                    console.log('[PPO-TW] calcTWTeamScores: bulan', m, 'tidak ada');
                    return;
                }
                var unitData = findUnitScoreInMonth(msc, unit);
                if (!unitData) {
                    console.log('[PPO-TW] calcTWTeamScores: unit', unit, 'tidak ditemukan di bulan', m,
                        '| Keys:', Object.keys(msc));
                    return;
                }
                // unitData bisa berupa { total, bbm, kendaraan, ... } atau angka langsung
                var total;
                if (typeof unitData === 'number') {
                    total = unitData;
                } else if (unitData.total !== undefined) {
                    total = parseFloat(unitData.total);
                } else {
                    total = _sumComponents(unitData);
                }
                if (!isNaN(total)) {
                    console.log('[PPO-TW] calcTWTeamScores:', unit, m, '→', total);
                    vals.push(total);
                }
            });
            result[unit] = vals.length
                ? +(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length).toFixed(2)
                : null;
        });

        console.log('[PPO-TW] calcTWTeamScores result for', twKey, ':', result);
        return result;
    }

    function _sumComponents(sc) {
        var keys = ['bbm','kendaraan','ruang','kearsipan','spj','monev'];
        var t = 0, has = false;
        keys.forEach(function (k) { var v = parseFloat(sc[k]); if (!isNaN(v)) { t += v; has = true; } });
        return has ? t : null;
    }

    function rebuildTWTeamScores() {
        TW_KEYS.forEach(function (tw) {
            state.teamScoresByTW[tw] = calcTWTeamScores(tw);
        });
    }

    // Skor tim mentah (rata-rata TW), SEBELUM dikali bobot
    function getTeamScoreRaw(unit) {
        var twSc = state.teamScoresByTW[state.tw];
        if (!twSc) return null;
        var v = twSc[unit];
        return (v !== null && v !== undefined && !isNaN(v)) ? v : null;
    }

    // Bobot tim = skor_raw × 0.60 (maks 60 poin dari total 100)
    function getTeamScoreWeighted(unit) {
        var raw = getTeamScoreRaw(unit);
        return raw !== null ? +(raw * 0.60).toFixed(2) : null;
    }

    // Alias agar kode lama tetap berjalan (kembalikan skor RAW)
    function getTeamScore(unit) { return getTeamScoreRaw(unit); }

    // ── JSONP ──────────────────────────────────────────────────────
    function gasJsonp(params) {
        return new Promise(function (resolve, reject) {
            var gasUrl = getGasUrl();
            if (!gasUrl) { reject(new Error('URL GAS belum diatur')); return; }
            var cb = '__ppoGas_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
            var done = false, script = document.createElement('script');
            var timeout = setTimeout(function () {
                if (done) return; cleanup(); reject(new Error('Timeout 20 detik'));
            }, 20000);
            function cleanup() {
                done = true; clearTimeout(timeout);
                try { delete window[cb]; } catch(e){}
                if (script.parentNode) script.parentNode.removeChild(script);
            }
            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () { if (done) return; cleanup(); reject(new Error('Network error')); };
            var qs = Object.keys(params || {}).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
            script.src = gasUrl + '?' + qs + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    function findPersonByPid(personPid) {
        var found = null;
        GROUPS.some(function (g) {
            var p = g.people.find(function (pp) { return pid(g.id, pp.name) === personPid; });
            if (p) { found = { group: g, person: p }; return true; }
        });
        return found;
    }

    function mapGasRecordToLocal(rec) {
        var criteria = (rec.criteria && typeof rec.criteria === 'object') ? rec.criteria : {};
        var diklatFromGas = parseFloat(rec.diklat) || 0;
        diklatFromGas = diklatFromGas >= 5 ? 10 : 0;
        var skorTim  = parseFloat(rec.skorTim) || 0;
        var bobotTim = +(skorTim * 0.60).toFixed(2);
        var akhlak   = calcAkhlak(criteria);
        var nilaiAkhlak = akhlak.weighted;
        var total = +(bobotTim + nilaiAkhlak + diklatFromGas).toFixed(2);
        return {
            tw: rec.tw || state.tw, gid: rec.gid || '', evaluator: rec.penilai || '',
            name: rec.nama || '', unit: rec.unit || '', criteria: criteria,
            diklat: diklatFromGas, teamScore: skorTim,
            summary: { teamW: bobotTim, akhlakW: nilaiAkhlak, diklatW: diklatFromGas, total: total },
            updatedAt: rec.updatedAt || new Date().toISOString(), updatedBy: rec.updatedBy || 'Admin'
        };
    }

    // ══════════════════════════════════════════════════════════
    // loadFromGAS
    // ══════════════════════════════════════════════════════════
    function loadFromGAS() {
        var gasUrl = getGasUrl();
        if (!gasUrl) return Promise.resolve();
        setLoadingState(true);
        var tw = state.tw, tahun = getCurrentYearString();

        state.teamScoresByMonth = {};
        state.teamScoresByTW = {};

        var pDiklat = fetchDiklatScores().then(function (scores) {
            state.diklatScores = scores || {};
            state.diklatLoaded = true;
            console.log('[PPO-TW] Diklat loaded, jumlah pegawai:', Object.keys(state.diklatScores).length);
        }).catch(function (e) {
            console.error('[PPO-TW] Diklat fetch error:', e);
            state.diklatLoaded = true;
        });

        var pTeam = _fetchMonthlyTeamScoresForTW(tw).then(function () {
            rebuildTWTeamScores();
            var twSc = state.teamScoresByTW[tw] || {};
            var hasData = Object.values(twSc).some(function(v){ return v !== null; });
            if (hasData) {
                _updateAutoLoadStatus('Skor tim triwulan berhasil dihitung', 'success');
            } else {
                _updateAutoLoadStatus('Skor tim belum ada untuk ' + tw + ' — cek data di dashboard', 'warning');
            }
        }).catch(function (e) {
            console.error('[PPO-TW] Team score fetch error:', e);
            _updateAutoLoadStatus('Gagal mengambil skor tim dari server', 'error');
        });

        var pData = gasJsonp({ action: 'getAllPenilaianTW', tw: tw, tahun: tahun })
            .then(function (res) {
                console.log('[PPO-TW] getAllPenilaianTW response:', res && res.status, 'total:', res && res.total);
                if (res && res.status === 'success' && Array.isArray(res.records)) {
                    if (!state.records[tw]) state.records[tw] = {};
                    res.records.forEach(function (rec) {
                        if (!rec.gid || !rec.nama) return;
                        var recPid = pid(rec.gid, rec.nama);
                        state.records[tw][recPid] = mapGasRecordToLocal(rec);
                    });
                    saveRecords();
                }
            })
            .catch(function (err) {
                if (window.showToast) showToast('Gagal sinkronisasi: ' + err.message, 'error');
            });

        return Promise.all([pDiklat, pTeam, pData]).finally(function () {
            setLoadingState(false);
            render();
        });
    }

    // SESUDAH — fetch semua 12 bulan sekaligus
function _fetchMonthlyTeamScoresForTW(tw) {
    // Kumpulkan semua bulan unik dari semua TW (= 12 bulan)
    var allMonths = [];
    TW_KEYS.forEach(function (twKey) {
        TRIWULAN_DEF[twKey].months.forEach(function (m) {
            if (allMonths.indexOf(m) === -1) allMonths.push(m);
        });
    });

    console.log('[PPO-TW] _fetchMonthlyTeamScoresForTW: fetch semua bulan', allMonths);

    if (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.fetchAllTeamScores) {
        var promises = allMonths.map(function (m) {
            // Skip bulan yang sudah ada di cache state (tidak perlu re-fetch)
            if (state.teamScoresByMonth[m] &&
                Object.keys(state.teamScoresByMonth[m]).length > 0) {
                console.log('[PPO-TW] Skip fetch (cache hit):', m);
                return Promise.resolve();
            }
            return window.PPO_GAS_CONFIG.fetchAllTeamScores(m)
                .then(function (scores) {
                    console.log('[PPO-TW] Team scores for', m, ':', scores);
                    state.teamScoresByMonth[m] = scores || {};
                })
                .catch(function (e) {
                    console.error('[PPO-TW] fetchAllTeamScores error for', m, ':', e);
                    state.teamScoresByMonth[m] = {};
                });
        });
        return Promise.all(promises);
    }

    // Fallback langsung
    allMonths.forEach(function (m) {
        if (!state.teamScoresByMonth[m]) state.teamScoresByMonth[m] = {};
    });
    return Promise.resolve();
}

    function _updateAutoLoadStatus(msg, type) {
        var el  = document.getElementById('ppo-status-msg');
        var dot = document.getElementById('ppo-status-dot');
        if (!el) return;
        el.textContent = msg;
        var colors = { success:'#10b981', warning:'#f59e0b', info:'#6b7280', error:'#ef4444' };
        if (dot) dot.style.background = colors[type] || colors.info;
    }

    function setLoadingState(on) {
        state.loading = on;
        var btn = document.getElementById('ppo-btn-refresh');
        if (!btn) return;
        btn.disabled = on;
        btn.innerHTML = on
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ppo-spin"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Memuat...'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Refresh';
    }

    // ── SAVE / DELETE GAS ──────────────────────────────────────────
    function saveToGAS(personPid, rec) {
        var found = findPersonByPid(personPid);
        if (!found) return Promise.reject(new Error('Pegawai tidak ditemukan: ' + personPid));

        var diklatToSend = (rec.diklat >= 5) ? 10 : 0;

        var payload = {
            action: 'savePenilaianTW',
            tw: state.tw,
            tahun: getCurrentYearString(),
            gid: found.group.id,
            penilai: found.group.evaluator,
            namaPegawai: found.person.name,
            unit: found.person.unit,
            criteria: JSON.stringify(rec.criteria || {}),
            diklat: diklatToSend,
            skorTim: rec.teamScore || 0,
            updatedBy: state.currentUser ? (state.currentUser.name || 'Admin') : 'Admin',
            catatan: ''
        };

        if (window.PPO_GAS_CONFIG && window.PPO_GAS_CONFIG.savePenilaian) return window.PPO_GAS_CONFIG.savePenilaian(payload);
        var gasUrl = getGasUrl();
        if (!gasUrl) return Promise.resolve({ status: 'skipped' });
        return new Promise(function (resolve, reject) {
            var cb = '__ppoSave_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
            var done = false, script = document.createElement('script');
            var timer = setTimeout(function () { if (done) return; cleanup(); reject(new Error('Timeout simpan')); }, 20000);
            function cleanup() { done = true; clearTimeout(timer); try { delete window[cb]; } catch(e){} if (script.parentNode) script.parentNode.removeChild(script); }
            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () { if (done) return; cleanup(); reject(new Error('Network error')); };
            script.src = getGasUrl() + '?jsonBody=' + encodeURIComponent(JSON.stringify(payload)) + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    function deleteFromGAS(personPid) {
        var found = findPersonByPid(personPid);
        if (!found) return Promise.reject(new Error('Pegawai tidak ditemukan: ' + personPid));
        var payload = {
            action: 'deletePenilaianTW',
            tw: state.tw, gid: found.group.id, namaPegawai: found.person.name,
            deletedBy: state.currentUser ? (state.currentUser.name || 'Admin') : 'Admin'
        };
        var gasUrl = getGasUrl();
        if (!gasUrl) return Promise.resolve({ status: 'skipped' });
        return new Promise(function (resolve, reject) {
            var cb = '__ppoDel_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
            var done = false, script = document.createElement('script');
            var timer = setTimeout(function () { if (done) return; cleanup(); reject(new Error('Timeout hapus')); }, 20000);
            function cleanup() { done = true; clearTimeout(timer); try { delete window[cb]; } catch(e){} if (script.parentNode) script.parentNode.removeChild(script); }
            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () { if (done) return; cleanup(); reject(new Error('Network error')); };
            script.src = gasUrl + '?jsonBody=' + encodeURIComponent(JSON.stringify(payload)) + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    // ── DELETE dari toolbar tabel ─────────────────────────────────
    function deleteRecord(personPid) {
        var found = findPersonByPid(personPid);
        if (!found) return;

        var personName = found.person.name;
        var twLabel_   = twLabel(state.tw);

        function doDelete() {
            delRec(personPid);
            if (window.showToast) showToast('Penilaian ' + personName.split(',')[0] + ' (' + twLabel_ + ') dihapus.', 'success');
            render();
            deleteFromGAS(personPid).catch(function (err) {
                if (window.showToast) showToast('Lokal terhapus. Server gagal: ' + err.message, 'error');
            });
        }

        if (window.showConfirmModal) {
            showConfirmModal({
                icon: '🗑️',
                title: 'Hapus Penilaian?',
                message: 'Data penilaian <strong>' + esc(personName) + '</strong> untuk <strong>' + esc(twLabel_) + '</strong> akan dihapus permanen.',
                confirmText: 'Hapus',
                confirmClass: 'btn-danger'
            }, doDelete);
        } else {
            if (!confirm('Hapus penilaian ' + personName + ' (' + twLabel_ + ')?\n\nTindakan ini tidak dapat dibatalkan.')) return;
            doDelete();
        }
    }
    window.ppoDeleteRecord = deleteRecord;

    // ══════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════
    function slug(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
    function pid(gid, name) { return gid + '::' + slug(name); }
    function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
    function escJs(s) { return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
    function twLabel(tw) { return (TRIWULAN_DEF[tw] && TRIWULAN_DEF[tw].label) || tw || '—'; }
    function twShort(tw) { return (TRIWULAN_DEF[tw] && TRIWULAN_DEF[tw].short) || tw || '—'; }

    var UNIT_PALETTE = {
        'Sekretariat'                        : { bg:'#EFF6FF', color:'#1D4ED8', letter:'S' },
        'Bidang Koperasi'                    : { bg:'#FEF3C7', color:'#B45309', letter:'K' },
        'Bidang UKM'                         : { bg:'#DCFCE7', color:'#15803D', letter:'U' },
        'Bidang Usaha Mikro'                 : { bg:'#F3E8FF', color:'#7E22CE', letter:'M' },
        'Bidang Kewirausahaan'               : { bg:'#FEE2E2', color:'#B91C1C', letter:'W' },
        'Balai Layanan Usaha Terpadu KUMKM'  : { bg:'#E0F2FE', color:'#075985', letter:'B' }
    };
    function unitPalette(unit) { return UNIT_PALETTE[unit] || { bg:'#F1F5F9', color:'#475569', letter:'?' }; }
    function initials(name) {
        return String(name||'').split(' ').filter(function(w){return w.length>0;})
            .slice(0,2).map(function(w){return w[0].toUpperCase();}).join('');
    }
    function unitShort(unit) {
        var map = {
            'Sekretariat':'Sekretariat','Bidang Koperasi':'B. Koperasi','Bidang UKM':'B. UKM',
            'Bidang Usaha Mikro':'B. Usaha Mikro','Bidang Kewirausahaan':'B. Kewirausahaan',
            'Balai Layanan Usaha Terpadu KUMKM':'BLUT KUMKM'
        };
        return map[unit] || unit;
    }

    // ── AUTH ───────────────────────────────────────────────────────
    function getUser() {
        var u = null;
        if (window.AUTH && typeof AUTH.getUser === 'function') u = AUTH.getUser();
        if (!u) { try { u = JSON.parse(localStorage.getItem('user') || 'null'); } catch(e){} }
        if (!u) return null;
        u._role = (window.AUTH && typeof AUTH.normalizeRole === 'function')
            ? AUTH.normalizeRole(u.role) || '' : String(u.role||'').toLowerCase().trim();
        return u;
    }
    function isAdmin()   { var u = state.currentUser; return !!(u && u._role === 'superadmin'); }
    function isProgram() { var u = state.currentUser; return !!(u && u._role === 'program'); }
    function getAllowedGids() {
        var u = state.currentUser;
        if (!u) return [];
        var role = u._role;
        if (role === 'superadmin' || role === 'program') return null;
        if (ROLE_TO_GID[role]) return [ROLE_TO_GID[role]];
        var derived = deriveGidFromUser(u);
        if (derived) return [derived];
        return [];
    }
    function deriveGidFromUser(u) {
        if (!u || !u.name) return null;
        var uNameLower = u.name.toLowerCase().trim();
        var found = GROUPS.find(function(g){ return g.evaluator.toLowerCase() === uNameLower; });
        if (found) return found.id;
        var uNameNoGelar = uNameLower.split(',')[0].trim();
        found = GROUPS.find(function(g){ return g.evaluator.toLowerCase().split(',')[0].trim() === uNameNoGelar; });
        if (found) return found.id;
        var uWords = uNameNoGelar.split(/\s+/).filter(function(w){ return w.length >= 3; });
        if (uWords.length > 0) {
            found = GROUPS.find(function(g) {
                var evalLower = g.evaluator.toLowerCase();
                return uWords.every(function(w){ return evalLower.indexOf(w) !== -1; });
            });
            if (found) return found.id;
        }
        return null;
    }
    function canEditGroup(gid) {
        if (isAdmin() || isProgram()) return true;
        var allowedGids = getAllowedGids();
        if (allowedGids === null) return true;
        return allowedGids.indexOf(gid) !== -1;
    }

    // ══════════════════════════════════════════════════════════
    // KALKULASI
    // Formula: Tim×0.60 + AkhlakAvg×3 + Diklat(0/10) = maks 100
    // ══════════════════════════════════════════════════════════
    function calcAkhlak(criteria) {
        var vals = AKHLAK.map(function (a) {
            var v = parseFloat(criteria && criteria[a.key]);
            return isNaN(v) ? 7 : Math.min(10, Math.max(7, v));
        });
        var avg = vals.reduce(function(a,b){return a+b;},0) / AKHLAK.length;
        return {
            avg:      +avg.toFixed(2),
            weighted: +(avg * 3).toFixed(2)   // maks 30 poin
        };
    }

    function calcFinal(teamScoreRaw, akhlakAvg, diklat) {
        var t = parseFloat(teamScoreRaw)  || 0;
        var a = parseFloat(akhlakAvg)     || 7;
        var d = parseFloat(diklat)        || 0;
        d = d >= 5 ? 10 : 0;
        var teamW   = +(t * 0.60).toFixed(2);   // maks 60 poin
        var akhlakW = +(a * 3).toFixed(2);       // maks 30 poin
        var diklatW = d;                          // 0 atau 10 poin
        var total   = +(teamW + akhlakW + diklatW).toFixed(2);
        return { teamW: teamW, akhlakW: akhlakW, diklatW: diklatW, total: total };
    }

    function statusOf(total) {
        if (total >= 90) return { label:'Amat Baik',      cls:'ppo-s-great', color:'#15803D', bg:'#DCFCE7' };
        if (total >= 80) return { label:'Baik',            cls:'ppo-s-good',  color:'#1D4ED8', bg:'#DBEAFE' };
        if (total >= 70) return { label:'Cukup Baik',      cls:'ppo-s-fair',  color:'#B45309', bg:'#FEF3C7' };
        return               { label:'Perlu Pembinaan', cls:'ppo-s-low',   color:'#B91C1C', bg:'#FEE2E2' };
    }

    function snap(personPid, personName, unit) {
        var rec = getRec(personPid), ts = getTeamScore(unit);
        var criteria = rec && rec.criteria ? rec.criteria : {};
        var akhlak   = calcAkhlak(criteria);
        var diklatVal = getDiklatValue(personName);
        var diklat    = diklatVal !== null ? diklatVal
                        : (rec && rec.diklat != null ? (rec.diklat >= 5 ? 10 : 0) : 0);
        var final    = calcFinal(ts, akhlak.avg, diklat);
        return {
            rec: rec, ts: ts, akhlak: akhlak, diklat: diklat,
            diklatLoaded: state.diklatLoaded, final: final,
            status: rec ? statusOf(final.total)
                        : { label:'Belum Dinilai', cls:'ppo-s-pending', color:'#6B7280', bg:'#F3F4F6' }
        };
    }

    function visibleGroups() {
        var allowedGids = getAllowedGids();
        if (allowedGids === null) return GROUPS;
        if (allowedGids.length === 0) return [];
        return GROUPS.filter(function(g){ return allowedGids.indexOf(g.id) !== -1; });
    }
    function allVisiblePeople() {
        var rows = [];
        visibleGroups().forEach(function (g) {
            g.people.forEach(function (p) {
                rows.push({ gid:g.id, evaluator:g.evaluator, unitLabel:g.unitLabel,
                            name:p.name, unit:p.unit, pid:pid(g.id, p.name) });
            });
        });
        return rows;
    }
    function filteredPeople() {
        var q  = (state.search||'').toLowerCase();
        var gf = state.groupFilter || '';
        var sf = state.statusFilter || '';
        return allVisiblePeople().filter(function (p) {
            if (q && !p.name.toLowerCase().includes(q) && !p.unit.toLowerCase().includes(q)) return false;
            if (gf && p.gid !== gf) return false;
            var rec = getRec(p.pid);
            if (sf === 'done' && !rec) return false;
            if (sf === 'draft' && rec) return false;
            return true;
        });
    }

    // SVG Icons
    var IC = {
        edit   : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        trash  : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
        eye    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
        refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
        search : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        close  : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        lock   : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        users  : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        info   : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    // ══════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════
    function render() {
        renderStats();
        renderTable();
        var rp = document.getElementById('ppo-panel-rekap');
        if (rp && rp.style.display !== 'none') renderRekap();
        var rnk = document.getElementById('ppo-panel-ranking');
        if (rnk && rnk.style.display !== 'none') renderRanking();
    }

    function renderStats() {
        var people = allVisiblePeople(), done = 0, totals = [], akhlaks = [];
        people.forEach(function (p) {
            var s = snap(p.pid, p.name, p.unit);
            if (s.rec) { done++; if (!isNaN(s.final.total)) totals.push(s.final.total); akhlaks.push(s.akhlak.avg); }
        });
        var avgT = totals.length  ? +(totals.reduce(function(a,b){return a+b;},0)/totals.length).toFixed(1) : 0;
        var avgA = akhlaks.length ? +(akhlaks.reduce(function(a,b){return a+b;},0)/akhlaks.length).toFixed(1) : 0;
        var pct  = people.length  ? Math.round(done/people.length*100) : 0;
        var el   = document.getElementById('ppo-stat-grid');
        if (!el) return;
        el.innerHTML =
            '<div class="stat-card" style="border-left:4px solid #2563EB;">' +
            '<div class="stat-label">Total Pegawai</div><div class="stat-value">' + people.length + '</div>' +
            '<div class="stat-footer">Dalam tanggung jawab Anda</div></div>' +
            '<div class="stat-card" style="border-left:4px solid #10b981;">' +
            '<div class="stat-label">Sudah Dinilai</div><div class="stat-value">' + done + '</div>' +
            '<div class="stat-footer">' + pct + '% dari total pegawai' +
            '<div class="ppo-prog-track" style="margin-top:8px;"><div class="ppo-prog-fill" style="width:' + pct + '%"></div></div>' +
            '</div></div>' +
            '<div class="stat-card" style="border-left:4px solid #D97706;">' +
            '<div class="stat-label">Rata-rata Nilai</div><div class="stat-value">' + (avgT||'—') + '</div>' +
            '<div class="stat-footer">Nilai akhir /100</div></div>' +
            '<div class="stat-card" style="border-left:4px solid #9333EA;">' +
            '<div class="stat-label">Rata-rata AKHLAK</div><div class="stat-value">' + (avgA||'—') + '</div>' +
            '<div class="stat-footer">Skala 7 – 10</div></div>';
    }

    function renderTable() {
        var people   = filteredPeople();
        var tbody    = document.getElementById('ppo-tbody');
        var mobileList = document.getElementById('ppo-mobile-list');
        var colEval  = document.getElementById('ppo-col-evaluator');
        if (!tbody) return;
        var showEvalCol = isAdmin() || isProgram();
        if (colEval) colEval.style.display = showEvalCol ? '' : 'none';

        var sub = document.getElementById('ppo-table-count');
        if (sub) sub.textContent = people.length + ' pegawai · ' + twLabel(state.tw) + ' (' + twShort(state.tw) + ')';

        var html = '', lastGid = '';
        people.forEach(function (p, i) {
            var s   = snap(p.pid, p.name, p.unit);
            var pal = unitPalette(p.unit);
            var ini = initials(p.name);
            var ts  = s.ts !== null ? s.ts.toFixed(1) : '—';
            var ak  = s.rec ? s.akhlak.avg.toFixed(1) : '—';
            var tot = s.rec ? s.final.total.toFixed(1) : '—';
            var canEdit = canEditGroup(p.gid);

            var dkHtml = !s.diklatLoaded
                ? '<span class="ppo-dk-load">···</span>'
                : (s.diklat === 10
                    ? '<span class="ppo-dk-yes">✓&nbsp;10</span>'
                    : '<span class="ppo-dk-no">✗&nbsp;0</span>');

            if (showEvalCol && p.gid !== lastGid) {
                var grp = GROUPS.find(function(g){ return g.id === p.gid; });
                if (grp) {
                    html += '<tr class="ppo-group-hdr"><td colspan="11">' +
                        '<span class="ppo-group-hdr-label">' + esc(grp.evaluator) + '</span>' +
                        '<span class="ppo-group-hdr-unit">' + esc(grp.unitLabel) + '</span>' +
                        '</td></tr>';
                }
                lastGid = p.gid;
            }

            // Tombol aksi
            var actionHtml = '<div class="ppo-actions">';
            if (canEdit) actionHtml += '<button onclick="ppoOpenModal(\'' + escJs(p.pid) + '\')" class="ppo-act-btn ppo-act-edit" title="' + (s.rec?'Edit':'Nilai') + '">' + IC.edit + '</button>';
            if (s.rec)   actionHtml += '<button onclick="ppoOpenModalView(\'' + escJs(p.pid) + '\')" class="ppo-act-btn ppo-act-view" title="Lihat">' + IC.eye + '</button>';
            // Tombol DELETE — muncul bila ada record & user bisa edit
            if (s.rec && canEdit) {
                actionHtml += '<button onclick="ppoDeleteRecord(\'' + escJs(p.pid) + '\')" class="ppo-act-btn ppo-act-del" title="Hapus penilaian">' + IC.trash + '</button>';
            }
            actionHtml += '</div>';

            // Kolom skor tim dengan bobot
            var tsBobot = s.ts !== null ? (s.ts * 0.60).toFixed(1) : '—';
            var tsCell  = s.ts !== null
                ? '<span class="ppo-ts-cell">' + ts + '<span class="ppo-ts-w">×60%=' + tsBobot + '</span></span>'
                : '<span class="ppo-dim">—</span>';

            html +=
                '<tr class="ppo-row">' +
                '<td class="ppo-td-no">' + (i+1) + '</td>' +
                '<td class="ppo-td-name"><div class="ppo-person-cell">' +
                '<div class="ppo-avatar" style="background:' + pal.bg + ';color:' + pal.color + ';">' + ini + '</div>' +
                '<div class="ppo-person-info"><span class="ppo-person-name">' + esc(p.name) + '</span>' +
                '<span class="ppo-person-unit">' + esc(p.unit) + '</span></div></div></td>' +
                '<td class="ppo-td-unit"><span class="ppo-unit-chip" style="background:' + pal.bg + ';color:' + pal.color + ';">' + esc(unitShort(p.unit)) + '</span></td>' +
                (showEvalCol ? '<td class="ppo-td-eval">' + esc(p.evaluator.split(',')[0]) + '</td>' : '') +
                '<td class="ppo-td-num">' + tsCell + '</td>' +
                '<td class="ppo-td-num' + (s.rec?'':' ppo-dim') + '">' + ak + '</td>' +
                '<td class="ppo-td-dik">' + dkHtml + '</td>' +
                '<td class="ppo-td-total' + (s.rec?' ppo-total-val':' ppo-dim') + '">' + tot + '</td>' +
                '<td class="ppo-td-status"><span class="ppo-status-badge" style="background:' + s.status.bg + ';color:' + s.status.color + ';">' + s.status.label + '</span></td>' +
                '<td class="ppo-td-action">' + actionHtml + '</td>' +
                '</tr>';
        });
        if (!html) html = '<tr><td colspan="11" class="ppo-empty">Tidak ada data yang sesuai filter.</td></tr>';
        tbody.innerHTML = html;

        if (mobileList) {
            var mHtml = '';
            people.forEach(function (p) {
                var s = snap(p.pid, p.name, p.unit);
                var pal = unitPalette(p.unit); var ini = initials(p.name);
                var ts = s.ts !== null ? s.ts.toFixed(1) : '—';
                var tot = s.rec ? s.final.total.toFixed(1) : '—';
                var canEdit = canEditGroup(p.gid);
                mHtml += '<div class="ppo-mcard">' +
                    '<div class="ppo-mcard-top">' +
                    '<div class="ppo-avatar ppo-avatar-lg" style="background:' + pal.bg + ';color:' + pal.color + ';">' + ini + '</div>' +
                    '<div class="ppo-mcard-info"><div class="ppo-mcard-name">' + esc(p.name) + '</div><div class="ppo-mcard-unit">' + esc(p.unit) + '</div></div>' +
                    '<span class="ppo-status-badge" style="background:' + s.status.bg + ';color:' + s.status.color + ';">' + s.status.label + '</span></div>' +
                    '<div class="ppo-mcard-scores">' +
                    '<div class="ppo-mscore"><div class="ppo-mscore-label">Tim (rata TW)</div><div class="ppo-mscore-val">' + ts + '</div></div>' +
                    '<div class="ppo-mscore"><div class="ppo-mscore-label">Tim ×60%</div><div class="ppo-mscore-val">' + (s.ts!==null?(s.ts*0.60).toFixed(1):'—') + '</div></div>' +
                    '<div class="ppo-mscore"><div class="ppo-mscore-label">AKHLAK</div><div class="ppo-mscore-val">' + (s.rec?s.akhlak.avg.toFixed(1):'—') + '</div></div>' +
                    '<div class="ppo-mscore"><div class="ppo-mscore-label">Diklat</div><div class="ppo-mscore-val">' + (s.diklatLoaded?(s.diklat===10?'10':'0'):'···') + '</div></div>' +
                    '<div class="ppo-mscore ppo-mscore-total"><div class="ppo-mscore-label">Nilai Akhir</div><div class="ppo-mscore-val ppo-mscore-big">' + tot + '</div></div></div>' +
                    '<div class="ppo-mcard-actions">' +
                    (canEdit ? '<button onclick="ppoOpenModal(\'' + escJs(p.pid) + '\')" class="ppo-mbtn ppo-mbtn-edit">' + IC.edit + (s.rec?' Edit Penilaian':' Mulai Nilai') + '</button>' : '') +
                    (s.rec   ? '<button onclick="ppoOpenModalView(\'' + escJs(p.pid) + '\')" class="ppo-mbtn ppo-mbtn-view">' + IC.eye + ' Lihat Detail</button>' : '') +
                    (s.rec && canEdit ? '<button onclick="ppoDeleteRecord(\'' + escJs(p.pid) + '\')" class="ppo-mbtn ppo-mbtn-del">' + IC.trash + ' Hapus</button>' : '') +
                    '</div></div>';
            });
            if (!mHtml) mHtml = '<div class="ppo-empty" style="padding:40px;text-align:center;">Tidak ada data.</div>';
            mobileList.innerHTML = mHtml;
        }
    }

    function renderRekap() {
        var tbody = document.getElementById('ppo-rekap-tbody');
        if (!tbody) return;
        var html = '';
        UNITS.forEach(function (unit) {
            var people = allVisiblePeople().filter(function(p){ return p.unit === unit; });
            if (!people.length) return;
            var done=0, tots=[], akhs=[], dks=[];
            people.forEach(function(p){
                var s = snap(p.pid, p.name, p.unit);
                if (s.rec) { done++; if (!isNaN(s.final.total)) tots.push(s.final.total); akhs.push(s.akhlak.avg); dks.push(s.diklat); }
            });
            var avgT = tots.length ? +(tots.reduce(function(a,b){return a+b;},0)/tots.length).toFixed(1) : '—';
            var avgA = akhs.length ? +(akhs.reduce(function(a,b){return a+b;},0)/akhs.length).toFixed(1) : '—';
            var avgD = dks.length  ? +(dks.reduce(function(a,b){return a+b;},0)/dks.length).toFixed(1)  : '—';
            var pct  = Math.round(done/people.length*100);
            var pal  = unitPalette(unit);
            html += '<tr>' +
                '<td><div style="display:flex;align-items:center;gap:8px;">' +
                '<div style="width:6px;height:28px;border-radius:3px;background:' + pal.color + ';flex-shrink:0;"></div>' +
                '<span style="font-size:13px;font-weight:600;color:#1E293B;">' + esc(unit) + '</span></div></td>' +
                '<td class="ppo-td-center">' + people.length + '</td>' +
                '<td class="ppo-td-center">' + done + '</td>' +
                '<td><div style="display:flex;align-items:center;gap:8px;">' +
                '<div style="flex:1;height:4px;background:#F1F5F9;border-radius:2px;overflow:hidden;">' +
                '<div style="height:100%;width:' + pct + '%;background:' + pal.color + ';border-radius:2px;"></div></div>' +
                '<span style="font-size:12px;color:#64748B;min-width:30px;">' + pct + '%</span></div></td>' +
                '<td class="ppo-td-center" style="font-weight:700;font-size:14px;">' + avgT + '</td>' +
                '<td class="ppo-td-center">' + avgA + '</td>' +
                '<td class="ppo-td-center">' + avgD + '</td>' +
                '</tr>';
        });
        if (!html) html = '<tr><td colspan="7" class="ppo-empty">Belum ada data.</td></tr>';
        tbody.innerHTML = html;
    }

    function renderRanking() {
        var el = document.getElementById('ppo-ranking-list');
        if (!el) return;
        var ranked = [];
        allVisiblePeople().forEach(function (p) {
            var s = snap(p.pid, p.name, p.unit);
            if (s.rec && !isNaN(s.final.total)) ranked.push({ name:p.name, unit:p.unit, total:s.final.total, status:s.status });
        });
        ranked.sort(function(a,b){ return b.total - a.total; });
        if (!ranked.length) { el.innerHTML = '<p class="ppo-empty" style="padding:40px;">Belum ada data.</p>'; return; }
        var MEDAL = ['🥇','🥈','🥉'];
        el.innerHTML = ranked.slice(0,25).map(function(r,i){
            var pal = unitPalette(r.unit); var ini = initials(r.name);
            return '<div class="ppo-rank-row">' +
                '<div class="ppo-rank-pos">' + (i<3?MEDAL[i]:'<span class="ppo-rank-num">'+(i+1)+'</span>') + '</div>' +
                '<div class="ppo-avatar ppo-avatar-sm" style="background:' + pal.bg + ';color:' + pal.color + ';">' + ini + '</div>' +
                '<div class="ppo-rank-info"><div class="ppo-rank-name">' + esc(r.name) + '</div><div class="ppo-rank-unit">' + esc(r.unit) + '</div></div>' +
                '<span class="ppo-status-badge" style="background:' + r.status.bg + ';color:' + r.status.color + ';">' + r.status.label + '</span>' +
                '<div class="ppo-rank-score">' + r.total.toFixed(1) + '</div></div>';
        }).join('');
    }

    // ══════════════════════════════════════════════════════════
    // MODAL PENILAIAN
    // ══════════════════════════════════════════════════════════
    var _activePid = null, _modalReadOnly = false;

    function openModalView(personPid) { _modalReadOnly = true; openModal(personPid, true); }

    function openModal(personPid, readOnly) {
        var person = null, group = null;
        GROUPS.some(function(g){
            var p = g.people.find(function(pp){ return pid(g.id,pp.name) === personPid; });
            if (p) { person=p; group=g; return true; }
        });
        if (!person) { if (window.showToast) showToast('Pegawai tidak ditemukan.','error'); return; }
        var isReadOnly = readOnly || false;
        if (!isReadOnly && !canEditGroup(group.id)) { if (window.showToast) showToast('Tidak memiliki akses.','error'); return; }
        _activePid = personPid; _modalReadOnly = isReadOnly;

        var rec      = getRec(personPid);
        var criteria = rec && rec.criteria ? rec.criteria : {};
        var diklatVal = getDiklatValue(person.name);
        var diklat    = diklatVal !== null ? diklatVal
                        : (rec && rec.diklat != null ? (rec.diklat >= 5 ? 10 : 0) : 0);
        var ts       = getTeamScore(person.unit);
        var tsW      = ts !== null ? +(ts * 0.60).toFixed(2) : null;
        var akhlak   = calcAkhlak(criteria);
        var final    = calcFinal(ts, akhlak.avg, diklat);
        var sts      = rec ? statusOf(final.total) : { label:'Belum Dinilai', color:'#6B7280', bg:'#F3F4F6' };
        var pal      = unitPalette(person.unit);
        var ini      = initials(person.name);

        var twMonths = TRIWULAN_DEF[state.tw].months;
        var tsBreakdownHtml = '<div class="ppo-ts-breakdown">' +
            twMonths.map(function (m) {
                var msc = state.teamScoresByMonth[m];
                var unitData = msc ? findUnitScoreInMonth(msc, person.unit) : null;
                var val = null;
                if (unitData !== null) {
                    if (typeof unitData === 'number') val = unitData;
                    else if (unitData.total !== undefined) val = parseFloat(unitData.total);
                    else val = _sumComponents(unitData);
                }
                var pct = (val !== null && !isNaN(val)) ? Math.round(val) : 0;
                var w   = (val !== null && !isNaN(val)) ? (val * 0.60).toFixed(1) : '—';
                return '<div class="ppo-ts-br-row">' +
                    '<span class="ppo-ts-br-label">' + m.slice(0,3) + '</span>' +
                    '<div class="ppo-ts-br-bar"><div style="width:' + pct + '%"></div></div>' +
                    '<span class="ppo-ts-br-val">' + (val !== null && !isNaN(val) ? val.toFixed(1) : '—') +
                    '<span class="ppo-ts-br-max">/100</span></span>' +
                    '<span class="ppo-ts-br-w" title="×60%">→' + w + '</span>' +
                    '</div>';
            }).join('') +
            '<div class="ppo-ts-br-row ppo-ts-br-total">' +
            '<span class="ppo-ts-br-label" style="font-weight:700;">Rata</span>' +
            '<div class="ppo-ts-br-bar"><div style="width:' + (ts !== null ? Math.round(ts) : 0) + '%;background:#3B82F6"></div></div>' +
            '<span class="ppo-ts-br-val" style="font-weight:700;">' + (ts !== null ? ts.toFixed(1) : '—') +
            '<span class="ppo-ts-br-max">/100</span></span>' +
            '<span class="ppo-ts-br-w" style="font-weight:700;">→' + (tsW !== null ? tsW.toFixed(1) : '—') + '</span>' +
            '</div>' +
            '</div>';

        var diklatChip = !state.diklatLoaded
            ? '<span class="ppo-chip-loading">Memuat...</span>'
            : (diklat === 10
                ? '<span class="ppo-chip-yes">Sudah upload diklat → +10 poin</span>'
                : '<span class="ppo-chip-no">Belum upload diklat → +0 poin</span>');

        var akhlakHTML = AKHLAK.map(function (a) {
            var v = parseFloat(criteria[a.key]) || 7; v = Math.min(10, Math.max(7, v));
            var LABELS = { 7:'Kurang', 8:'Cukup Baik', 9:'Baik', 10:'Amat Baik' };
            var ctrl = isReadOnly
                ? '<div class="ppo-akhl-val">' + v + ' — ' + LABELS[v] + '</div>'
                : '<select data-key="' + a.key + '" onchange="ppoUpdatePreview()" class="ppo-akhl-sel">' +
                  [7,8,9,10].map(function(o){ return '<option value="'+o+'"'+(v==o?' selected':'')+'>'+o+' — '+LABELS[o]+'</option>'; }).join('') + '</select>';
            return '<div class="ppo-akhl-row"><div class="ppo-akhl-text">' +
                '<div class="ppo-akhl-name">' + esc(a.label) + '</div>' +
                '<div class="ppo-akhl-desc">' + esc(a.desc) + '</div></div>' +
                '<div class="ppo-akhl-ctrl">' + ctrl + '</div></div>';
        }).join('');

        var readOnlyBadge = isReadOnly ? '<span class="ppo-readonly-badge">Mode Lihat</span>' : '';

        var box = document.getElementById('ppo-modal-box');
        if (!box) return;

        var twBadge = '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;' +
            'padding:2px 10px;border-radius:20px;background:#EFF6FF;color:#1D4ED8;margin-left:8px;">' +
            state.tw + ' · ' + twShort(state.tw) + '</span>';

        var bobotInfo = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">' +
            '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#EFF6FF;color:#1D4ED8;font-weight:600;">Tim ×60% (maks 60 poin)</span>' +
            '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#F3E8FF;color:#7E22CE;font-weight:600;">AKHLAK ×3 (maks 30 poin)</span>' +
            '<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:#DCFCE7;color:#15803D;font-weight:600;">Diklat 0/10 poin</span>' +
            '</div>';

        box.innerHTML =
            '<div class="ppo-mhdr">' +
            '<div class="ppo-mhdr-person">' +
            '<div class="ppo-avatar ppo-avatar-lg" style="background:' + pal.bg + ';color:' + pal.color + ';">' + ini + '</div>' +
            '<div><div class="ppo-mhdr-name">' + esc(person.name) + readOnlyBadge + twBadge + '</div>' +
            '<div class="ppo-mhdr-meta">' + esc(group.evaluator) + ' &middot; ' + esc(person.unit) + '</div></div></div>' +
            '<button class="ppo-mclose" onclick="ppoCloseModal()">' + IC.close + '</button>' +
            '</div>' +

            '<div class="ppo-mbody">' +

            '<div class="ppo-mcol-left">' +
            '<div class="ppo-mc-section-title">Komponen Penilaian</div>' +
            bobotInfo +

            '<div class="ppo-comp-card">' +
            '<div class="ppo-comp-hdr">' +
            '<div class="ppo-comp-label">Skor Tim <small style="font-weight:400;color:#9CA3AF;">(rata-rata ' + state.tw + ')</small></div>' +
            '<div class="ppo-comp-weight">× 0.60 → maks 60 poin</div></div>' +
            '<div class="ppo-comp-body">' +
            '<div class="ppo-comp-score">' + (ts !== null ? ts.toFixed(1) : '—') + '</div>' +
            '<div class="ppo-comp-detail">× 0.60 = <strong>' + (tsW !== null ? tsW.toFixed(1) : '—') + '</strong> poin</div></div>' +
            tsBreakdownHtml +
            (!isReadOnly ? '<div class="ppo-ts-btns"><button class="ppo-ts-btn-refresh" onclick="ppoRefreshTWTeamScore(\'' + escJs(person.unit) + '\')">' + IC.refresh + ' Perbarui Skor Tim</button></div>' +
            '<div id="ppo-ts-fetch-status" class="ppo-ts-status">Skor tim = rata-rata 3 bulan dalam ' + state.tw + ', kemudian dikali 60%.</div>' : '') +
            '</div>' +

            '<div class="ppo-comp-card">' +
            '<div class="ppo-comp-hdr"><div class="ppo-comp-label">BerAKHLAK</div><div class="ppo-comp-weight">Rata × 3 → maks 30 poin</div></div>' +
            '<div class="ppo-comp-body"><div class="ppo-comp-score" id="ppo-prev-akhlak-w">' + akhlak.weighted.toFixed(2) + '</div>' +
            '<div class="ppo-comp-detail">Rata-rata <span id="ppo-prev-akhlak-avg">' + akhlak.avg.toFixed(2) + '</span> × 3</div></div>' +
            '</div>' +

            '<div class="ppo-comp-card">' +
            '<div class="ppo-comp-hdr"><div class="ppo-comp-label">Diklat ' + IC.lock + '</div><div class="ppo-comp-weight">0 atau 10 poin · otomatis</div></div>' +
            '<div class="ppo-comp-body"><div class="ppo-comp-score" style="color:' + (diklat===10?'#15803D':'#B91C1C') + ';">' + diklat + '</div>' +
            '<div class="ppo-comp-detail">' + diklatChip + '</div></div>' +
            '</div>' +

            '<div class="ppo-total-card" id="ppo-total-card" style="border-color:' + sts.color + '20;background:' + sts.bg + ';">' +
            '<div class="ppo-total-label" style="color:' + sts.color + ';">Nilai Akhir /100</div>' +
            '<div class="ppo-total-score" id="ppo-prev-total" style="color:' + sts.color + ';">' + (rec?final.total.toFixed(1):'—') + '</div>' +
            '<div class="ppo-total-status" id="ppo-prev-status" style="color:' + sts.color + ';">' + sts.label + '</div>' +
            '</div>' +
            '<div class="ppo-formula">= (Tim × 0.60) + (Rata AKHLAK × 3) + Diklat (0/10)</div>' +
            (rec?'<div class="ppo-updated">Diperbarui ' + new Date(rec.updatedAt).toLocaleString('id-ID') + ' oleh ' + esc(rec.updatedBy||'Admin') + '</div>':'') +
            '</div>' +

            '<div class="ppo-mcol-right">' +
            '<div class="ppo-mc-section-title">Penilaian BerAKHLAK — ' + twLabel(state.tw) + '</div>' +
            (!isReadOnly ? '<div class="ppo-preset-bar"><span>Isi semua nilai:</span>' +
                [7,8,9,10].map(function(v){ return '<button class="ppo-preset-btn" onclick="ppoApplyPreset('+v+')">'+v+'</button>'; }).join('') +
                '</div>' : '') +
            '<div class="ppo-akhl-list">' + akhlakHTML + '</div>' +
            '</div>' +

            '</div>' +

            '<div class="ppo-mfooter">' +
            (!isReadOnly && rec ? '<button class="ppo-mfbtn ppo-mfbtn-danger" onclick="ppoResetModal()">Reset Data</button>' : '') +
            '<div style="flex:1"></div>' +
            '<button class="ppo-mfbtn ppo-mfbtn-ghost" onclick="ppoCloseModal()">' + (isReadOnly?'Tutup':'Batal') + '</button>' +
            (!isReadOnly ? '<button class="ppo-mfbtn ppo-mfbtn-primary" onclick="ppoSaveModal()" id="ppo-save-btn">Simpan Penilaian</button>' : '') +
            '</div>';

        document.getElementById('ppo-modal-overlay').classList.add('open');
        if (!isReadOnly) updatePreview();
    }

    function updatePreview() {
        if (!_activePid || _modalReadOnly) return;
        var personName='', unit='';
        GROUPS.some(function(g){
            var p = g.people.find(function(pp){ return pid(g.id,pp.name) === _activePid; });
            if (p) { unit=p.unit; personName=p.name; return true; }
        });
        var criteria = {};
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){ criteria[sel.dataset.key] = parseFloat(sel.value)||7; });
        var diklatVal = getDiklatValue(personName);
        var diklat = diklatVal !== null ? diklatVal : 0;
        var ts = getTeamScore(unit), akhlak = calcAkhlak(criteria);
        var final = calcFinal(ts, akhlak.avg, diklat), sts = statusOf(final.total);

        function setText(id,val){ var el=document.getElementById(id); if(el) el.textContent=val; }
        setText('ppo-prev-akhlak-w',  akhlak.weighted.toFixed(2));
        setText('ppo-prev-akhlak-avg',akhlak.avg.toFixed(2));
        setText('ppo-prev-total',     final.total.toFixed(1));
        setText('ppo-prev-status',    sts.label);

        var card = document.getElementById('ppo-total-card');
        if (card) {
            card.style.borderColor = sts.color + '20';
            card.style.background  = sts.bg;
            var scoreEl = document.getElementById('ppo-prev-total');
            if (scoreEl) scoreEl.style.color = sts.color;
            var statusEl = document.getElementById('ppo-prev-status');
            if (statusEl) statusEl.style.color = sts.color;
            var labelEl = card.querySelector('.ppo-total-label');
            if (labelEl) labelEl.style.color = sts.color;
        }
    }

    function applyPreset(val) {
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){ sel.value = String(val); });
        updatePreview();
    }

    function refreshTWTeamScore(unit) {
        var statusEl = document.getElementById('ppo-ts-fetch-status');
        if (statusEl) statusEl.textContent = 'Mengambil skor tim dari server...';
        // Reset cache & refetch
        try { localStorage.removeItem('penilaian_orang_team_cache_v1'); } catch(e) {}
        state.teamScoresByMonth = {};
        state.teamScoresByTW = {};
        _fetchMonthlyTeamScoresForTW(state.tw).then(function () {
            rebuildTWTeamScores();
            if (statusEl) statusEl.textContent = 'Skor tim diperbarui. Tutup & buka kembali untuk melihat rincian terbaru.';
            render();
            if (window.showToast) showToast('Skor tim triwulan diperbarui.', 'success');
        }).catch(function (err) {
            if (statusEl) statusEl.textContent = 'Gagal: ' + (err && err.message ? err.message : 'error');
        });
    }

    function saveModal() {
        if (!_activePid || _modalReadOnly) return;
        var found = findPersonByPid(_activePid);
        if (!found) return;
        var criteria = {};
        document.querySelectorAll('#ppo-modal-box [data-key]').forEach(function(sel){ criteria[sel.dataset.key] = parseFloat(sel.value)||7; });
        var diklatVal = getDiklatValue(found.person.name);
        var diklat = diklatVal !== null ? diklatVal : 0;
        var ts = getTeamScore(found.person.unit);
        var akhlak = calcAkhlak(criteria);
        var final  = calcFinal(ts, akhlak.avg, diklat);

        var saveBtn = document.getElementById('ppo-save-btn');
        if (saveBtn) { saveBtn.disabled=true; saveBtn.textContent='Menyimpan...'; }

        var newRec = {
            tw: state.tw, gid: found.group.id, evaluator: found.group.evaluator,
            name: found.person.name, unit: found.person.unit,
            criteria: criteria,
            diklat: diklat,
            teamScore: ts !== null ? ts : 0,
            summary: final,
            updatedAt: new Date().toISOString(),
            updatedBy: state.currentUser ? (state.currentUser.name||'Admin') : 'Admin'
        };
        setRec(_activePid, newRec);
        if (window.showToast) showToast('Penilaian ' + twLabel(state.tw) + ' tersimpan.', 'success');
        var syncPid = _activePid;
        closeModal(); render();
        saveToGAS(syncPid, newRec)
            .then(function(res){
                if (!res) return;
                if (res.status === 'success') {
                    if (window.showToast) showToast('Tersinkronisasi ke server.','success');
                } else if (res.status !== 'skipped') {
                    if (window.showToast) showToast('Simpan lokal. Sinkronisasi gagal: '+(res.message||''),'error');
                }
            }).catch(function(err){
                if (window.showToast) showToast('Simpan lokal. Sinkronisasi gagal: '+err.message,'error');
            });
    }

    function resetModal() {
        if (!_activePid || _modalReadOnly) return;
        var pidToDelete = _activePid;
        var found = findPersonByPid(pidToDelete);
        var personName = found ? found.person.name : '';
        function doDelete() {
            delRec(pidToDelete);
            if (window.showToast) showToast('Data penilaian direset.','success');
            closeModal(); render();
            deleteFromGAS(pidToDelete).catch(function(err){ if (window.showToast) showToast('Lokal terhapus. Server gagal: '+err.message,'error'); });
        }
        if (window.showConfirmModal) {
            showConfirmModal({
                icon:'🗑️', title:'Reset Penilaian?',
                message:'Data penilaian <strong>'+esc(personName)+'</strong> untuk <strong>'+esc(twLabel(state.tw))+'</strong> akan dihapus permanen.',
                confirmText:'Reset', confirmClass:'btn-danger'
            }, doDelete);
        } else {
            if (!confirm('Reset data penilaian '+twLabel(state.tw)+'?')) return;
            doDelete();
        }
    }

    function closeModal() {
        var overlay = document.getElementById('ppo-modal-overlay');
        var box     = document.getElementById('ppo-modal-box');
        if (overlay) overlay.classList.remove('open');
        if (box)     box.innerHTML = '';
        _activePid = null; _modalReadOnly = false;
    }

    // ── EXPOSE GLOBAL ──────────────────────────────────────────────
    window.ppoOpenModal           = openModal;
    window.ppoOpenModalView       = openModalView;
    window.ppoCloseModal          = closeModal;
    window.ppoUpdatePreview       = updatePreview;
    window.ppoApplyPreset         = applyPreset;
    window.ppoSaveModal           = saveModal;
    window.ppoResetModal          = resetModal;
    window.ppoLoadFromGAS         = loadFromGAS;
    window.ppoRefreshTWTeamScore  = refreshTWTeamScore;

    function switchTab(tab, btn) {
        document.querySelectorAll('#section-' + SECTION_ID + ' .ppo-tab').forEach(function(b){ b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        ['daftar','rekap','ranking'].forEach(function(t){
            var el = document.getElementById('ppo-panel-'+t);
            if (el) el.style.display = (t===tab) ? 'block' : 'none';
        });
        if (tab === 'rekap')   renderRekap();
        if (tab === 'ranking') renderRanking();
    }
    window.ppoSwitchTab = switchTab;

    // ══════════════════════════════════════════════════════════
    // STYLES
    // ══════════════════════════════════════════════════════════
    var STYLE_ID = 'ppo-styles-v63';
    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
/* ─── PPO v6.3 ─── */
#section-penilaian-orang{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','DM Sans',sans-serif;}
#section-penilaian-orang *{box-sizing:border-box;}
@keyframes ppospn{to{transform:rotate(360deg);}}
.ppo-spin{animation:ppospn .7s linear infinite;display:inline-block;}
.ppo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:28px;}
.ppo-header-left{display:flex;align-items:center;gap:14px;}
.ppo-header-icon{width:44px;height:44px;border-radius:12px;background:#1E293B;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ppo-title{font-size:21px;font-weight:700;color:#0F172A;letter-spacing:-.025em;margin:0;line-height:1.2;}
.ppo-subtitle{font-size:12.5px;color:#64748B;margin:3px 0 0;}
.ppo-header-right{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.ppo-tw-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px;}
.ppo-tw-pill{padding:7px 18px;border-radius:20px;border:1.5px solid #E2E8F0;background:#F8FAFC;color:#64748B;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
.ppo-tw-pill.active{background:#1E293B;color:#fff;border-color:#1E293B;}
.ppo-tw-pill:hover:not(.active){background:#E2E8F0;border-color:#CBD5E1;}
.ppo-tw-badge{font-size:10px;opacity:.7;margin-left:4px;}
.ppo-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:inherit;white-space:nowrap;line-height:1.4;}
.ppo-btn-ghost{background:white;border-color:#E2E8F0;color:#374151;}
.ppo-btn-ghost:hover{background:#F8FAFC;border-color:#CBD5E1;}
.ppo-btn-primary{background:#1E293B;color:white;border-color:#1E293B;}
.ppo-btn-primary:hover{background:#0F172A;}
.ppo-btn:disabled{opacity:.5;cursor:not-allowed;}
.ppo-sel{padding:7px 10px;border:1px solid #E2E8F0;border-radius:8px;font-size:12.5px;font-family:inherit;color:#374151;background:white;cursor:pointer;line-height:1.4;}
.ppo-sel:focus{outline:none;border-color:#94A3B8;}
.ppo-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
.ppo-prog-track{height:3px;background:#F1F5F9;border-radius:2px;margin-top:6px;overflow:hidden;}
.ppo-prog-fill{height:100%;background:linear-gradient(90deg,#3B82F6,#10B981);border-radius:2px;transition:width .4s;}
.ppo-status-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;background:#F8FAFC;border:1px solid #F1F5F9;font-size:12px;color:#6B7280;margin-bottom:14px;}
.ppo-status-dot{width:7px;height:7px;border-radius:50%;background:#6B7280;flex-shrink:0;}
.ppo-tabs{display:flex;border-bottom:1.5px solid #E2E8F0;margin-bottom:18px;gap:0;}
.ppo-tab{padding:9px 18px;font-size:13px;font-weight:600;color:#6B7280;background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1.5px;transition:all .15s;font-family:inherit;}
.ppo-tab.active{color:#0F172A;border-bottom-color:#0F172A;}
.ppo-tab:hover:not(.active){color:#374151;}
.ppo-filter-bar{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;}
.ppo-search-box{position:relative;flex:1;min-width:200px;}
.ppo-search-box svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9CA3AF;pointer-events:none;}
.ppo-search-input{width:100%;padding:7px 10px 7px 32px;border:1px solid #E2E8F0;border-radius:8px;font-size:13px;font-family:inherit;color:#1E293B;background:white;}
.ppo-search-input:focus{outline:none;border-color:#94A3B8;}
.ppo-tcard{background:white;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;}
.ppo-tcard-hdr{padding:14px 18px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.ppo-tcard-title{font-size:13.5px;font-weight:700;color:#1E293B;}
.ppo-tcard-count{font-size:12px;color:#94A3B8;}
.ppo-tbl-wrap{overflow-x:auto;}
#ppo-main-table{width:100%;border-collapse:collapse;font-size:13px;}
#ppo-main-table th{padding:10px 12px;font-size:11px;font-weight:600;color:#1E293B;text-transform:uppercase;letter-spacing:.07em;text-align:left;white-space:nowrap;}
#ppo-main-table th.tc{text-align:center;}
#ppo-main-table td{padding:11px 12px;border-bottom:1px solid #F8FAFC;vertical-align:middle;}
#ppo-main-table tbody tr:hover td{background:#FAFAFA;}
#ppo-main-table tbody tr:last-child td{border-bottom:none;}
.ppo-td-no{color:#CBD5E1;font-size:12px;font-weight:500;width:36px;}
.ppo-td-unit{white-space:nowrap;}
.ppo-td-eval{font-size:12px;color:#94A3B8;}
.ppo-td-num{text-align:center;font-family:'SF Mono',ui-monospace,monospace;font-size:13px;font-weight:600;color:#475569;}
.ppo-td-dik{text-align:center;}
.ppo-td-total{text-align:center;font-family:'SF Mono',ui-monospace,monospace;}
.ppo-td-status{white-space:nowrap;}
.ppo-td-action{width:100px;}
.ppo-td-center{text-align:center;}
.ppo-total-val{font-size:15px;font-weight:700;color:#0F172A;}
.ppo-dim{color:#D1D5DB;}
/* Skor tim dengan bobot */
.ppo-ts-cell{display:flex;flex-direction:column;align-items:center;gap:1px;}
.ppo-ts-w{font-size:10px;font-weight:500;color:#3B82F6;background:#EFF6FF;padding:1px 5px;border-radius:4px;white-space:nowrap;}
.ppo-avatar{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;letter-spacing:.01em;}
.ppo-avatar-sm{width:28px;height:28px;font-size:10px;}
.ppo-avatar-lg{width:40px;height:40px;font-size:13px;border-radius:10px;}
.ppo-person-cell{display:flex;align-items:center;gap:10px;}
.ppo-person-info{display:flex;flex-direction:column;}
.ppo-person-name{font-weight:600;font-size:13px;color:#1E293B;line-height:1.3;}
.ppo-person-unit{font-size:11.5px;color:#94A3B8;display:none;}
.ppo-unit-chip{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;white-space:nowrap;}
.ppo-status-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:20px;font-size:11.5px;font-weight:600;white-space:nowrap;}
.ppo-dk-yes{display:inline-flex;align-items:center;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:#DCFCE7;color:#15803D;white-space:nowrap;}
.ppo-dk-no{display:inline-flex;align-items:center;font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:20px;background:#FEE2E2;color:#B91C1C;white-space:nowrap;}
.ppo-dk-load{font-size:12px;color:#D1D5DB;}
.ppo-group-hdr td{background:#F8FAFC;padding:7px 12px;border-bottom:1px solid #E2E8F0;}
.ppo-group-hdr-label{font-size:11.5px;font-weight:700;color:#374151;}
.ppo-group-hdr-unit{font-size:11px;color:#94A3B8;margin-left:8px;}
.ppo-actions{display:flex;gap:4px;justify-content:center;}
.ppo-act-btn{width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid transparent;cursor:pointer;transition:all .15s;background:none;}
.ppo-act-edit{background:#FFF7ED;color:#B45309;border-color:#FED7AA;}
.ppo-act-edit:hover{background:#FEF3C7;border-color:#FCD34D;}
.ppo-act-view{background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;}
.ppo-act-view:hover{background:#DBEAFE;}
.ppo-act-del{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
.ppo-act-del:hover{background:#FEE2E2;border-color:#FCA5A5;}
.ppo-empty{text-align:center;padding:40px;color:#9CA3AF;font-size:13px;}
.ppo-rekap-card{background:white;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;}
.ppo-rekap-card table{width:100%;border-collapse:collapse;font-size:13px;}
.ppo-rekap-card thead{background:#1E293B;}
.ppo-rekap-card th{padding:10px 12px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.07em;text-align:left;}
.ppo-ranking-card{background:white;border:1px solid #E2E8F0;border-radius:12px;padding:8px;}
.ppo-rank-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;transition:background .15s;}
.ppo-rank-row:hover{background:#F8FAFC;}
.ppo-rank-pos{width:28px;font-size:18px;text-align:center;flex-shrink:0;}
.ppo-rank-num{display:inline-block;width:22px;height:22px;border-radius:50%;background:#F1F5F9;color:#6B7280;font-size:11px;font-weight:700;line-height:22px;text-align:center;}
.ppo-rank-info{flex:1;min-width:0;}
.ppo-rank-name{font-weight:600;font-size:13px;color:#1E293B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.ppo-rank-unit{font-size:11.5px;color:#94A3B8;}
.ppo-rank-score{font-size:20px;font-weight:700;color:#1E293B;font-family:'SF Mono',ui-monospace,monospace;min-width:50px;text-align:right;}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);z-index:9999;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto;}
.modal-overlay.open{display:flex;}
#ppo-modal-box{background:white;border-radius:16px;width:100%;max-width:920px;margin:auto;border:1px solid #E2E8F0;overflow:hidden;}
.ppo-mhdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #F1F5F9;gap:12px;}
.ppo-mhdr-person{display:flex;align-items:center;gap:12px;}
.ppo-mhdr-name{font-size:15px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.ppo-mhdr-meta{font-size:12px;color:#6B7280;margin-top:2px;}
.ppo-mclose{width:32px;height:32px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#6B7280;flex-shrink:0;}
.ppo-mclose:hover{background:#F1F5F9;color:#1E293B;}
.ppo-readonly-badge{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:#FEF3C7;color:#B45309;}
.ppo-mbody{display:grid;grid-template-columns:.9fr 1.1fr;gap:0;max-height:72vh;overflow-y:auto;}
.ppo-mcol-left{padding:18px 20px;border-right:1px solid #F1F5F9;display:flex;flex-direction:column;gap:10px;}
.ppo-mcol-right{padding:18px 20px;}
.ppo-mc-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9CA3AF;margin-bottom:4px;}
.ppo-comp-card{border:1px solid #F1F5F9;border-radius:10px;padding:12px 14px;background:#FAFAFA;}
.ppo-comp-hdr{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px;}
.ppo-comp-label{font-size:12.5px;font-weight:700;color:#1E293B;display:flex;align-items:center;gap:5px;}
.ppo-comp-weight{font-size:11px;color:#94A3B8;}
.ppo-comp-body{display:flex;align-items:baseline;gap:8px;}
.ppo-comp-score{font-size:28px;font-weight:700;color:#1E293B;font-family:'SF Mono',ui-monospace,monospace;line-height:1;}
.ppo-comp-detail{font-size:12px;color:#6B7280;}
.ppo-ts-breakdown{margin-top:8px;display:flex;flex-direction:column;gap:4px;}
.ppo-ts-br-row{display:flex;align-items:center;gap:6px;}
.ppo-ts-br-total{border-top:1px solid #E2E8F0;margin-top:4px;padding-top:4px;}
.ppo-ts-br-label{font-size:11.5px;color:#6B7280;width:32px;flex-shrink:0;}
.ppo-ts-br-bar{flex:1;height:4px;background:#E2E8F0;border-radius:2px;overflow:hidden;}
.ppo-ts-br-bar div{height:100%;background:#94A3B8;border-radius:2px;}
.ppo-ts-br-val{font-size:11.5px;font-weight:600;color:#374151;font-family:monospace;min-width:38px;text-align:right;}
.ppo-ts-br-max{color:#9CA3AF;font-weight:400;}
.ppo-ts-br-w{font-size:11px;color:#3B82F6;min-width:44px;text-align:right;font-family:monospace;}
.ppo-ts-btns{display:flex;gap:6px;margin-top:10px;}
.ppo-ts-btn-refresh{flex:1;padding:7px 10px;border-radius:8px;border:1px solid #D1FAE5;background:#F0FDF4;color:#15803D;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:5px;}
.ppo-ts-status{font-size:11px;color:#6B7280;margin-top:5px;font-style:italic;}
.ppo-total-card{border-radius:12px;padding:16px;text-align:center;border:1.5px solid #F1F5F9;margin-top:2px;}
.ppo-total-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;}
.ppo-total-score{font-size:44px;font-weight:700;font-family:'SF Mono',ui-monospace,monospace;line-height:1;}
.ppo-total-status{font-size:12.5px;font-weight:600;margin-top:5px;}
.ppo-formula{font-size:11.5px;color:#94A3B8;background:#F8FAFC;border-radius:7px;padding:8px 10px;font-family:'SF Mono',ui-monospace,monospace;border:1px solid #F1F5F9;text-align:center;}
.ppo-updated{font-size:11px;color:#94A3B8;text-align:center;}
.ppo-chip-yes{font-size:11.5px;font-weight:600;color:#15803D;background:#DCFCE7;padding:2px 8px;border-radius:20px;display:inline-block;}
.ppo-chip-no{font-size:11.5px;font-weight:600;color:#B91C1C;background:#FEE2E2;padding:2px 8px;border-radius:20px;display:inline-block;}
.ppo-chip-loading{font-size:11.5px;color:#9CA3AF;}
.ppo-preset-bar{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap;}
.ppo-preset-bar span{font-size:11.5px;color:#6B7280;}
.ppo-preset-btn{padding:3px 12px;border-radius:20px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid #E2E8F0;background:white;font-family:inherit;color:#374151;}
.ppo-preset-btn:hover{border-color:#94A3B8;background:#F8FAFC;}
.ppo-akhl-list{display:flex;flex-direction:column;gap:6px;max-height:440px;overflow-y:auto;padding-right:2px;}
.ppo-akhl-row{border:1px solid #F1F5F9;border-radius:9px;padding:10px 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;background:white;}
.ppo-akhl-row:hover{border-color:#E2E8F0;background:#FAFAFA;}
.ppo-akhl-text{flex:1;min-width:0;}
.ppo-akhl-name{font-size:12.5px;font-weight:600;color:#1E293B;margin-bottom:2px;}
.ppo-akhl-desc{font-size:11.5px;color:#9CA3AF;line-height:1.5;}
.ppo-akhl-ctrl{flex-shrink:0;}
.ppo-akhl-sel{padding:6px 9px;border:1px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:12.5px;font-weight:600;min-width:140px;background:white;cursor:pointer;color:#1E293B;}
.ppo-akhl-sel:focus{border-color:#94A3B8;outline:none;}
.ppo-akhl-val{font-size:12.5px;font-weight:600;color:#1E293B;padding:6px 10px;background:#F8FAFC;border-radius:8px;min-width:140px;text-align:center;border:1px solid #F1F5F9;}
.ppo-mfooter{display:flex;align-items:center;gap:8px;padding:14px 22px;border-top:1px solid #F1F5F9;flex-wrap:wrap;}
.ppo-mfbtn{display:inline-flex;align-items:center;gap:5px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;transition:all .15s;}
.ppo-mfbtn-primary{background:#1E293B;color:white;border-color:#1E293B;}
.ppo-mfbtn-primary:hover{background:#0F172A;}
.ppo-mfbtn-primary:disabled{opacity:.5;cursor:not-allowed;}
.ppo-mfbtn-ghost{background:white;border-color:#E2E8F0;color:#374151;}
.ppo-mfbtn-ghost:hover{background:#F8FAFC;}
.ppo-mfbtn-danger{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
.ppo-mfbtn-danger:hover{background:#FEE2E2;}
.ppo-mobile-list{display:none;}
.ppo-mcard{background:white;border:1px solid #E2E8F0;border-radius:12px;padding:14px;margin-bottom:10px;}
.ppo-mcard-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}
.ppo-mcard-info{flex:1;min-width:0;}
.ppo-mcard-name{font-size:14px;font-weight:700;color:#1E293B;line-height:1.3;}
.ppo-mcard-unit{font-size:12px;color:#6B7280;margin-top:2px;}
.ppo-mcard-scores{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px;padding:10px;background:#F8FAFC;border-radius:8px;}
.ppo-mscore{text-align:center;}
.ppo-mscore-label{font-size:10px;color:#94A3B8;font-weight:500;}
.ppo-mscore-val{font-size:13px;font-weight:700;color:#374151;font-family:monospace;}
.ppo-mscore-total .ppo-mscore-val{color:#1E293B;}
.ppo-mscore-big{font-size:17px!important;}
.ppo-mcard-actions{display:flex;gap:7px;}
.ppo-mbtn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;}
.ppo-mbtn-edit{background:#FFF7ED;color:#B45309;border-color:#FED7AA;}
.ppo-mbtn-view{background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;}
.ppo-mbtn-del{background:#FEF2F2;color:#B91C1C;border-color:#FECACA;}
@media(max-width:900px){.ppo-mbody{grid-template-columns:1fr;max-height:none;}.ppo-mcol-left{border-right:none;border-bottom:1px solid #F1F5F9;}}
@media(max-width:768px){.ppo-stat-grid{grid-template-columns:repeat(2,1fr);}.ppo-tbl-wrap{display:none;}.ppo-mobile-list{display:block;}.ppo-header{flex-direction:column;gap:12px;}.ppo-header-right{width:100%;}.ppo-filter-bar{flex-direction:column;}.ppo-search-box{width:100%;}.ppo-mfooter{flex-direction:column;}.ppo-mfbtn{width:100%;justify-content:center;}.ppo-tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;}.ppo-tab{white-space:nowrap;font-size:12.5px;padding:8px 14px;}}
`;
        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════════
    // BUILD SHELL
    // ══════════════════════════════════════════════════════════
    function buildShell() {
        var section = document.getElementById('section-' + SECTION_ID);
        if (!section) return;
        var u = state.currentUser, admin = isAdmin(), prog = isProgram();
        var showAllGroups = admin || prog;

        var roleLabel = u && u._role ? (window.AUTH && AUTH.ROLE_LABELS ? (AUTH.ROLE_LABELS[u._role]||u._role) : u._role) : '';
        var heroSub   = showAllGroups
            ? 'Tampilan seluruh pegawai lintas unit — Penilaian Per Triwulan'
            : 'Menilai sebagai <strong>' + esc(roleLabel) + '</strong>' + (u&&u.name?' &middot; '+esc(u.name.split(',')[0]):'') + ' — Per Triwulan';

        var penilaiFilter = showAllGroups
            ? '<select id="ppo-group-filter" class="ppo-sel" onchange="(function(){window._ppoState.groupFilter=document.getElementById(\'ppo-group-filter\').value;window._ppoRender();})()">' +
              '<option value="">Semua penilai</option>' +
              GROUPS.map(function(g){ return '<option value="'+g.id+'">'+esc(g.evaluator.split(',')[0])+'</option>'; }).join('') + '</select>'
            : '';

        var adminTabs = showAllGroups
            ? '<button class="ppo-tab" onclick="ppoSwitchTab(\'rekap\',this)">Rekap Per Bidang</button>' +
              '<button class="ppo-tab" onclick="ppoSwitchTab(\'ranking\',this)">Ranking</button>'
            : '';

        var twPills = TW_KEYS.map(function (tw) {
            return '<button class="ppo-tw-pill' + (tw === state.tw ? ' active' : '') + '" onclick="ppoSetTW(\'' + tw + '\',this)">' +
                tw + '<span class="ppo-tw-badge">' + twShort(tw) + '</span></button>';
        }).join('');

        section.innerHTML = [
            '<div class="container">',
            '<div class="ppo-header">',
            '<div class="ppo-header-left">',
            '<div class="ppo-header-icon">' + IC.users + '</div>',
            '<div><h1 class="ppo-title">Penilaian Per Orang</h1><p class="ppo-subtitle">' + heroSub + '</p></div>',
            '</div>',
            '<div class="ppo-header-right">',
            '<button class="ppo-btn ppo-btn-ghost" onclick="(function(){window._ppoState.diklatLoaded=false;window._ppoState.diklatScores={};return window.ppoLoadFromGAS();})()" title="Refresh data diklat">'+IC.refresh+' Diklat</button>',
            '<button id="ppo-btn-refresh" class="ppo-btn ppo-btn-primary" onclick="window.ppoLoadFromGAS()">' + IC.refresh + ' Refresh</button>',
            '</div>',
            '</div>',
            '<div style="margin-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#9CA3AF;">Pilih Periode Triwulan:</div>',
            '<div class="ppo-tw-pills">' + twPills + '</div>',
            // Keterangan formula
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">',
            '<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#EFF6FF;color:#1D4ED8;font-weight:600;">Tim ×60% (maks 60 poin)</span>',
            '<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#F3E8FF;color:#7E22CE;font-weight:600;">AKHLAK ×3 (maks 30 poin)</span>',
            '<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#DCFCE7;color:#15803D;font-weight:600;">Diklat 0 atau 10 poin</span>',
            '<span style="font-size:11px;padding:3px 10px;border-radius:20px;background:#F1F5F9;color:#475569;font-weight:600;">Total maks 100</span>',
            '</div>',
            '<div class="ppo-stat-grid" id="ppo-stat-grid"></div>',
            '<div class="ppo-tabs">',
            '<button class="ppo-tab active" onclick="ppoSwitchTab(\'daftar\',this)">Daftar Pegawai</button>',
            adminTabs,
            '</div>',
            '<div id="ppo-panel-daftar">',
            '<div class="ppo-status-bar">',
            '<div class="ppo-status-dot" id="ppo-status-dot"></div>',
            '<span id="ppo-status-msg">Mengambil skor tim dari server...</span>',
            '</div>',
            '<div class="ppo-filter-bar">',
            '<div class="ppo-search-box">',
            IC.search,
            '<input type="text" id="ppo-search" class="ppo-search-input" placeholder="Cari nama atau unit..." oninput="(function(){window._ppoState.search=document.getElementById(\'ppo-search\').value;window._ppoRender();})()">',
            '</div>',
            penilaiFilter,
            '<select id="ppo-status-filter" class="ppo-sel" onchange="(function(){window._ppoState.statusFilter=document.getElementById(\'ppo-status-filter\').value;window._ppoRender();})()">',
            '<option value="">Semua status</option>',
            '<option value="done">Sudah dinilai</option>',
            '<option value="draft">Belum dinilai</option>',
            '</select>',
            '</div>',
            '<div class="ppo-tcard">',
            '<div class="ppo-tcard-hdr">',
            '<div class="ppo-tcard-title">Daftar Pegawai</div>',
            '<div class="ppo-tcard-count" id="ppo-table-count"></div>',
            '</div>',
            '<div class="ppo-tbl-wrap">',
            '<table id="ppo-main-table"><thead><tr>',
            '<th>#</th><th>Nama Pegawai</th><th>Unit</th>',
            '<th id="ppo-col-evaluator">Penilai</th>',
            '<th class="tc">Tim (raw → ×60%)</th>',
            '<th class="tc">AKHLAK</th>',
            '<th class="tc">Diklat</th>',
            '<th class="tc">Total /100</th>',
            '<th class="tc">Status</th>',
            '<th></th>',
            '</tr></thead><tbody id="ppo-tbody"></tbody></table>',
            '</div>',
            '<div class="ppo-mobile-list" id="ppo-mobile-list"></div>',
            '</div>',
            '</div>',
            '<div id="ppo-panel-rekap" style="display:none;">',
            '<div class="ppo-rekap-card"><div style="overflow-x:auto;">',
            '<table><thead><tr>',
            '<th>Divisi / Unit</th>',
            '<th style="text-align:center;">Pegawai</th>',
            '<th style="text-align:center;">Dinilai</th>',
            '<th>Progress</th>',
            '<th style="text-align:center;">Rata Nilai /100</th>',
            '<th style="text-align:center;">Rata AKHLAK</th>',
            '<th style="text-align:center;">Rata Diklat</th>',
            '</tr></thead>',
            '<tbody id="ppo-rekap-tbody"></tbody>',
            '</table></div></div>',
            '</div>',
            '<div id="ppo-panel-ranking" style="display:none;">',
            '<div class="ppo-ranking-card"><div id="ppo-ranking-list"></div></div>',
            '</div>',
            '</div>',
            '<div class="modal-overlay" id="ppo-modal-overlay" onclick="if(event.target===this)ppoCloseModal()">',
            '<div id="ppo-modal-box"></div>',
            '</div>'
        ].join('');
    }

    window.ppoSetTW = function (tw, btn) {
        if (!TRIWULAN_DEF[tw]) return;
        state.tw = tw;
        document.querySelectorAll('#section-' + SECTION_ID + ' .ppo-tw-pill')
            .forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');

        // Jangan reset teamScoresByMonth — data sudah ada dari fetch sebelumnya
        // Cukup rebuild skor TW dari data yang sudah ada
        rebuildTWTeamScores();
        render();

        // Hanya re-fetch jika data bulan TW ini belum ada sama sekali
        var twMonths = TRIWULAN_DEF[tw].months;
        var hasData = twMonths.some(function (m) {
            return state.teamScoresByMonth[m] &&
                Object.keys(state.teamScoresByMonth[m]).length > 0;
        });
        if (!hasData) {
            loadFromGAS();
        }
    };

    // ── SECTION INIT ──────────────────────────────────────────────
    window.sectionInits = window.sectionInits || {};
    window.sectionInits[SECTION_ID] = function () {
        state.currentUser = getUser();
        if (state.currentUser && !state.currentUser.gid) {
            var role = state.currentUser._role;
            if (ROLE_TO_GID[role]) state.currentUser.gid = ROLE_TO_GID[role];
            else { var dg = deriveGidFromUser(state.currentUser); if (dg) state.currentUser.gid = dg; }
        }

        loadRecords();
        injectStyles();
        buildShell();

        window._ppoState  = state;
        window._ppoRender = render;
        window._ppoMonthLabel = twLabel;

        render();
        setTimeout(function () { loadFromGAS(); }, 200);
    };

})();