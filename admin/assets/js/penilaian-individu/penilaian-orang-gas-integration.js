// ============================================================
// penilaian-orang-gas-integration.js  v2.3
// Integrasi GAS untuk Penilaian Per Orang — TRIWULAN ONLY
//
// PERUBAHAN v2.3:
//  - fetchAllTeamScores: ambil dari API Operasional yang SAMA
//    dengan dashboard (BBM + Kendaraan + Ruang + Kearsipan +
//    SPJ + Monev) lalu jumlahkan, bukan dari sheet TeamScoreCache
//  - Hapus semua cache localStorage untuk team scores
//  - savePenilaian → selalu ke savePenilaianTW
//  - Tidak ada field 'bulan' di payload
// ============================================================

(function () {
    'use strict';

    // ── URL GAS ──────────────────────────────────────────────
    var GAS_URL_PPO = 'https://script.google.com/macros/s/AKfycbzhf7jO8TdVg5Q1xV1ZIE11cVlKfOTSUwlaZdZAZvA36nzNTsqzWEci3UQwmHRKHauv-g/exec';

    // URL Operasional (sama dengan yang dipakai dashboard)
    var GAS_URL_OPERASIONAL = (typeof API_OP !== 'undefined' && API_OP)
        ? API_OP
        : GAS_URL_PPO;

    // URL SPJ & Monev jika tersedia (opsional, diambil dari global)
    var GAS_URL_SPJ   = (typeof API_SPJ   !== 'undefined' && API_SPJ)   ? API_SPJ   : null;
    var GAS_URL_MONEV = (typeof API_MONEV !== 'undefined' && API_MONEV) ? API_MONEV : null;

    // ── Bersihkan cache lama ─────────────────────────────────
    (function clearOldCache() {
        try {
            localStorage.removeItem('penilaian_orang_team_cache_v1');
            localStorage.removeItem('penilaian_orang_diklat_cache_v1');
        } catch (e) {}
    })();

    // ── Helper JSONP (GET params) ─────────────────────────────
    function _jsonp(url, params, timeoutMs) {
        return new Promise(function (resolve, reject) {
            var cb = '__ppoInt_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done = false;
            var script = document.createElement('script');
            var timer = setTimeout(function () {
                if (done) return; cleanup();
                reject(new Error('Timeout ' + (timeoutMs || 20000) / 1000 + ' detik'));
            }, timeoutMs || 20000);
            function cleanup() {
                done = true; clearTimeout(timer);
                try { delete window[cb]; } catch (e) {}
                if (script.parentNode) script.parentNode.removeChild(script);
            }
            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () { if (done) return; cleanup(); reject(new Error('Network error')); };
            var qs = Object.keys(params || {}).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');
            script.src = url + '?' + qs + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    // ── Helper JSONP (jsonBody) ───────────────────────────────
    function _jsonpBody(url, payload) {
        return new Promise(function (resolve, reject) {
            var cb = '__ppoIntBody_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done = false;
            var script = document.createElement('script');
            var timer = setTimeout(function () {
                if (done) return; cleanup();
                reject(new Error('Timeout 20 detik'));
            }, 20000);
            function cleanup() {
                done = true; clearTimeout(timer);
                try { delete window[cb]; } catch (e) {}
                if (script.parentNode) script.parentNode.removeChild(script);
            }
            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () { if (done) return; cleanup(); reject(new Error('Network error')); };
            script.src = url
                + '?jsonBody=' + encodeURIComponent(JSON.stringify(payload))
                + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    // ── Normalisasi nama bulan ───────────────────────────────
    var MONTH_MAP_ID = {
        'januari':'JANUARI','februari':'FEBRUARI','maret':'MARET',
        'april':'APRIL','mei':'MEI','juni':'JUNI',
        'juli':'JULI','agustus':'AGUSTUS','september':'SEPTEMBER',
        'oktober':'OKTOBER','november':'NOVEMBER','desember':'DESEMBER'
    };

    function _normBulan(str) {
        if (!str) return '';
        var first = String(str).trim().toLowerCase().split(/[\s,\/\-]+/)[0];
        return MONTH_MAP_ID[first] || String(str).trim().toUpperCase().split(/[\s,\/\-]+/)[0];
    }

    // ── Modul & bobot (identik dengan dashboard) ─────────────
    var MODS = [
        { key: 'bbm',       max: 5  },
        { key: 'kendaraan', max: 10 },
        { key: 'ruang',     max: 5  },
        { key: 'kearsipan', max: 5  },
        { key: 'spj',       max: 35 },
        { key: 'monev',     max: 40 },
    ];

    var UNITS_LIST = [
        'Sekretariat','Bidang Koperasi','Bidang UKM',
        'Bidang Usaha Mikro','Bidang Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM'
    ];

    // ── Ambil skor tim SATU bulan dari semua API operasional ──
    // Mengembalikan { 'Sekretariat': { bbm, kendaraan, ruang, kearsipan, spj, monev, total }, ... }
    function _fetchOneMonthScores(bulan) {
        var op = GAS_URL_OPERASIONAL;

        // Siapkan semua promise paralel
        var pRoom   = _jsonp(op, { action: 'getRoomScores' }, 15000).catch(function () { return null; });
        var pVehK   = _jsonp(op, { action: 'getVehicleScores', jenis: 'KUNCI'  }, 15000).catch(function () { return null; });
        var pVehB   = _jsonp(op, { action: 'getVehicleScores', jenis: 'BERSIH' }, 15000).catch(function () { return null; });
        var pBbm    = _jsonp(op, { action: 'getBBMScores' }, 15000).catch(function () { return null; });
        var pArsip  = _jsonp(op, { action: 'getRekapArsip' }, 15000).catch(function () { return null; });

        // SPJ & Monev dari URL terpisah jika ada
        var pSpj   = GAS_URL_SPJ
            ? _jsonp(GAS_URL_SPJ,   { action: 'getAllMonthlySheetData' }, 15000).catch(function () { return null; })
            : Promise.resolve(null);
        var pMonev = GAS_URL_MONEV
            ? _jsonp(GAS_URL_MONEV, { action: 'getAllSheetData' }, 15000).catch(function () { return null; })
            : Promise.resolve(null);

        return Promise.all([pRoom, pVehK, pVehB, pBbm, pArsip, pSpj, pMonev])
            .then(function (results) {
                var roomR  = results[0];
                var vkR    = results[1];
                var vbR    = results[2];
                var bbmR   = results[3];
                var arsipR = results[4];
                var spjR   = results[5];
                var monevR = results[6];

                // Inisialisasi semua unit
                var sc = {};
                UNITS_LIST.forEach(function (u) {
                    sc[u] = { bbm: 0, kendaraan: 0, ruang: 0, kearsipan: 0, spj: 0, monev: 0, total: 0 };
                });

                // ── Ruang Rapat ──────────────────────────────
                if (roomR && roomR.success && Array.isArray(roomR.scores)) {
                    roomR.scores.forEach(function (s) {
                        if (s.bulan === bulan && sc[s.unit]) {
                            sc[s.unit].ruang = parseFloat(s.skorAkhir) || 0;
                        }
                    });
                }

                // ── Kendaraan (KUNCI + BERSIH dijumlah) ──────
                var km = {}, bm = {};
                if (vkR && vkR.success && Array.isArray(vkR.scores)) {
                    vkR.scores.forEach(function (s) { if (s.bulan === bulan) km[s.unit] = parseFloat(s.skorAkhir) || 0; });
                }
                if (vbR && vbR.success && Array.isArray(vbR.scores)) {
                    vbR.scores.forEach(function (s) { if (s.bulan === bulan) bm[s.unit] = parseFloat(s.skorAkhir) || 0; });
                }
                UNITS_LIST.forEach(function (u) {
                    var k = km[u] !== undefined ? km[u] : 0;
                    var b = bm[u] !== undefined ? bm[u] : 0;
                    sc[u].kendaraan = k + b;
                });

                // ── BBM ───────────────────────────────────────
                if (bbmR && bbmR.success && Array.isArray(bbmR.scores)) {
                    bbmR.scores.forEach(function (s) {
                        if (s.bulan === bulan && sc[s.unit]) {
                            sc[s.unit].bbm = parseFloat(s.skorAkhir) || 0;
                        }
                    });
                }

                // ── Kearsipan ────────────────────────────────
                if (arsipR && arsipR.success && arsipR.rekap) {
                    var rekapArsip = arsipR.rekap;
                    var bulanKey = Object.keys(rekapArsip).find(function (k) {
                        return _normBulan(k) === bulan;
                    });
                    if (bulanKey) {
                        var unitData = rekapArsip[bulanKey];
                        UNITS_LIST.forEach(function (u) {
                            var fk = Object.keys(unitData).find(function (k) {
                                return k.trim().toLowerCase() === u.trim().toLowerCase();
                            });
                            if (fk && unitData[fk] && unitData[fk].skorAkhir !== undefined) {
                                sc[u].kearsipan = parseFloat(unitData[fk].skorAkhir) || 0;
                            }
                        });
                    }
                }

                // ── SPJ ───────────────────────────────────────
                if (spjR) {
                    var spjData = null;
                    if (spjR.success && spjR.rekap && Object.keys(spjR.rekap).length > 0) {
                        spjData = spjR.rekap;
                    } else if (spjR.success && spjR.data && typeof spjR.data === 'object' && !Array.isArray(spjR.data)) {
                        spjData = spjR.data;
                    }
                    if (!spjData) {
                        // Fallback localStorage SPJ
                        try {
                            var lRaw = localStorage.getItem('spj_keuangan_data');
                            if (lRaw) spjData = JSON.parse(lRaw);
                        } catch (e) {}
                    }
                    if (spjData) {
                        var spjKey = Object.keys(spjData).find(function (k) {
                            return k.toUpperCase() === bulan.toUpperCase();
                        });
                        if (spjKey) {
                            var spjBulan = spjData[spjKey];
                            UNITS_LIST.forEach(function (u) {
                                var uk = Object.keys(spjBulan).find(function (k) {
                                    return k.trim().toLowerCase() === u.trim().toLowerCase();
                                });
                                if (!uk) return;
                                var ud = spjBulan[uk];
                                var v = parseFloat(
                                    ud.totalNilai !== undefined ? ud.totalNilai
                                    : ud.total     !== undefined ? ud.total
                                    : ud.nilai     !== undefined ? ud.nilai : 0
                                );
                                if (!isNaN(v) && v >= 0) sc[u].spj = v;
                            });
                        }
                    }
                } else {
                    // Fallback localStorage SPJ tanpa API
                    try {
                        var lRaw2 = localStorage.getItem('spj_keuangan_data');
                        if (lRaw2) {
                            var spjLocal = JSON.parse(lRaw2);
                            var spjKey2 = Object.keys(spjLocal).find(function (k) {
                                return k.toUpperCase() === bulan.toUpperCase();
                            });
                            if (spjKey2) {
                                var spjBulan2 = spjLocal[spjKey2];
                                UNITS_LIST.forEach(function (u) {
                                    var uk = Object.keys(spjBulan2).find(function (k) {
                                        return k.trim().toLowerCase() === u.trim().toLowerCase();
                                    });
                                    if (!uk) return;
                                    var ud = spjBulan2[uk];
                                    var v = parseFloat(
                                        ud.totalNilai !== undefined ? ud.totalNilai
                                        : ud.total !== undefined ? ud.total
                                        : ud.nilai !== undefined ? ud.nilai : 0
                                    );
                                    if (!isNaN(v) && v >= 0) sc[u].spj = v;
                                });
                            }
                        }
                    } catch (e) {}
                }

                // ── Monev ─────────────────────────────────────
                if (monevR) {
                    var monevData = null;
                    var monevType = null;
                    if (monevR.status === 'success' && monevR.data && !Array.isArray(monevR.data)) {
                        monevData = monevR.data; monevType = 'nested';
                    } else if ((monevR.success || monevR.status === 'success') && monevR.rekap) {
                        monevData = monevR.rekap; monevType = 'rekap';
                    } else if (Array.isArray(monevR.data)) {
                        monevData = monevR.data; monevType = 'array';
                    } else if (Array.isArray(monevR)) {
                        monevData = monevR; monevType = 'array';
                    }
                    if (monevData && (monevType === 'nested' || monevType === 'rekap')) {
                        var mk = Object.keys(monevData).find(function (k) { return _normBulan(k) === bulan; });
                        if (mk) {
                            var bd = monevData[mk];
                            UNITS_LIST.forEach(function (u) {
                                var uk = Object.keys(bd).find(function (k) {
                                    return k.trim().toLowerCase() === u.trim().toLowerCase();
                                });
                                var ud = uk ? bd[uk] : null;
                                if (!ud) return;
                                var raw = ud.total !== undefined ? ud.total : ud.totalNilai !== undefined ? ud.totalNilai : ud.nilai !== undefined ? ud.nilai : null;
                                if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[u].monev = v; }
                            });
                        }
                    } else if (monevData && monevType === 'array') {
                        monevData.filter(function (d) { return _normBulan(d.bulan || d.month || d.periode || '') === bulan; })
                            .forEach(function (d) {
                                var ur = String(d.unit || d.divisi || d.bidang || '').trim();
                                var mu = UNITS_LIST.find(function (u) { return u.trim().toLowerCase() === ur.toLowerCase(); });
                                if (!mu) return;
                                var raw = d.total !== undefined ? d.total : d.totalNilai !== undefined ? d.totalNilai : d.nilai !== undefined ? d.nilai : null;
                                if (raw !== null) { var v = parseFloat(raw); if (!isNaN(v) && v >= 0) sc[mu].monev = v; }
                            });
                    }
                } else {
                    // Fallback localStorage Monev
                    var capBulan = bulan.charAt(0) + bulan.slice(1).toLowerCase();
                    UNITS_LIST.forEach(function (u) {
                        try {
                            var keys = ['monev_' + bulan + '_' + u, 'monev_' + bulan.toLowerCase() + '_' + u, 'monev_' + capBulan + '_' + u];
                            for (var i = 0; i < keys.length; i++) {
                                var d = JSON.parse(localStorage.getItem(keys[i]) || 'null');
                                if (!d) continue;
                                var v = d.totalScore !== undefined ? d.totalScore : d.total !== undefined ? d.total : d.totalNilai !== undefined ? d.totalNilai : null;
                                if (v !== null && !isNaN(parseFloat(v))) { sc[u].monev = parseFloat(v); break; }
                            }
                        } catch (e) {}
                    });
                }

                // ── Hitung total per unit ────────────────────
                UNITS_LIST.forEach(function (u) {
                    var t = 0;
                    MODS.forEach(function (m) { t += sc[u][m.key] || 0; });
                    sc[u].total = +t.toFixed(2);
                });

                console.log('[PPO-Integration v2.3] Scores for', bulan, ':', sc);
                return sc;
            });
    }

    // ── fetchAllTeamScores — PENGGANTI dari versi lama ────────
    // Dipanggil per bulan dari penilaian-orang.js
    // Mengembalikan format { 'Sekretariat': { total: 94.6, bbm, ... }, ... }
    function fetchAllTeamScores(bulan) {
        console.log('[PPO-Integration v2.3] fetchAllTeamScores:', bulan);

        // Cek apakah dashboard sudah punya cache untuk bulan ini
        // (dashboard.js menulis ke penilaian_orang_team_cache_v1 via dbSyncToPPOCache)
        try {
            var cached = JSON.parse(localStorage.getItem('penilaian_orang_team_cache_v1') || '{}');
            var bulanData = cached[bulan];
            if (bulanData && bulanData.scores && bulanData.timestamp) {
                var ageMin = (Date.now() - bulanData.timestamp) / 60000;
                if (ageMin < 30) {
                    console.log('[PPO-Integration v2.3] Cache hit dari dashboard untuk', bulan, '(usia:', ageMin.toFixed(1), 'menit)');
                    return Promise.resolve(bulanData.scores);
                }
            }
        } catch (e) {}

        // Tidak ada cache → fetch langsung
        return _fetchOneMonthScores(bulan)
            .then(function (scores) {
                // Simpan ke cache untuk penggunaan berikutnya
                try {
                    var cache = {};
                    try { cache = JSON.parse(localStorage.getItem('penilaian_orang_team_cache_v1') || '{}'); } catch (e2) {}
                    cache[bulan] = { scores: scores, timestamp: Date.now() };
                    localStorage.setItem('penilaian_orang_team_cache_v1', JSON.stringify(cache));
                } catch (e) {}
                return scores;
            })
            .catch(function (err) {
                console.error('[PPO-Integration v2.3] fetchAllTeamScores error for', bulan, ':', err);
                return {};
            });
    }

    // ── savePenilaian → SELALU ke savePenilaianTW ─────────────
    function savePenilaian(payload) {
        var p = Object.assign({}, payload);
        p.action = 'savePenilaianTW';
        delete p.bulan;

        if (!p.tw) {
            console.error('[PPO-Integration] tw kosong!', p);
            return Promise.reject(new Error('Field tw wajib diisi'));
        }

        var d = parseFloat(p.diklat);
        p.diklat = (!isNaN(d) && d >= 5) ? 10 : 0;

        console.log('[PPO-Integration v2.3] savePenilaianTW =>', {
            action: p.action, tw: p.tw, gid: p.gid,
            namaPegawai: p.namaPegawai, diklat: p.diklat
        });

        return _jsonpBody(GAS_URL_PPO, p);
    }

    // ── Expose PPO_GAS_CONFIG ─────────────────────────────────
    window.PPO_GAS_CONFIG = {
        url:                GAS_URL_PPO,
        urlOperasional:     GAS_URL_OPERASIONAL,
        savePenilaian:      savePenilaian,
        fetchAllTeamScores: fetchAllTeamScores
    };

    console.log('[PPO-Integration v2.3] Ready. URL PPO:', GAS_URL_PPO, '| URL Operasional:', GAS_URL_OPERASIONAL);

})();