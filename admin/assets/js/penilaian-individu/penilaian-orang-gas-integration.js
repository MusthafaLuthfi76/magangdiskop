// ============================================================
// penilaian-orang-gas-integration.js — VERSI 3.0
// Konfigurasi & helper fetch skor tim langsung dari semua API
// tanpa perlu buka halaman Dashboard terlebih dahulu.
//
// PERUBAHAN UTAMA v3.0:
//  1. fetchAllTeamScores() — ambil langsung dari 6 sumber API
//     (BBM, Kendaraan Kunci, Kendaraan Bersih, Ruang Rapat,
//      Kearsipan/Dokumen, SPJ, Monev) secara paralel via JSONP
//  2. ppoSaveToGAS() — helper save yang diperbaiki, dipanggil
//     dari penilaian-orang.js via window.PPO_GAS_CONFIG.saveHelper
//  3. Semua URL dikonfigurasi di satu tempat
// ============================================================
(function () {
    'use strict';

    // ── URL Google Apps Script — SESUAIKAN DENGAN DEPLOYMENT ANDA ──
    window.PPO_GAS_CONFIG = {
        // URL GAS untuk Penilaian Per Orang (sheet PenilaianOrang)
        url: 'https://script.google.com/macros/s/AKfycbwHOeuxIolhlJheHWqKXcHBfPivW6Mgt5HCr3E5vrWhAZ-bMvLjUcWAYPsLoYTeld5bZQ/exec',

        // URL GAS Operasional (BBM, Kendaraan, Ruang Rapat, Kearsipan)
        urlOperasional: 'https://script.google.com/macros/s/AKfycbxsdAlN0gLea0f9iA9h5R8VTZJtIBK_JJxFwzP_TbP5lPNCq4oylR5rD6gPB5sshMjwlg/exec',

        // URL GAS SPJ Keuangan
        urlSPJ: 'https://script.google.com/macros/s/AKfycbxrlBOq5yyUH-FSX6s1g_4feGVeJNJVNP_5vw7fAW4VdHrGxdwZgBnb_0rIomtXgw-U/exec',

        // URL GAS Monev
        urlMonev: 'https://script.google.com/macros/s/AKfycbwn6AO1g22y9_WeIoBXJ69nE5cvVRldyQsTSk5Hmc36PWRFU86pWGJ8NN5ZNeDHsaLU6A/exec',
    };

    // ── Nama unit yang sesuai dengan semua API ──
    var UNITS = [
        'Sekretariat',
        'Bidang Koperasi',
        'Bidang UKM',
        'Bidang Usaha Mikro',
        'Bidang Kewirausahaan',
        'Balai Layanan Usaha Terpadu KUMKM'
    ];

    // ── Bobot masing-masing komponen (maks 100) ──
    var KOMPONEN = {
        bbm:       { label: 'BBM',         maks: 5  },
        kendaraan: { label: 'Kendaraan',   maks: 10 },
        ruang:     { label: 'Ruang Rapat', maks: 5  },
        kearsipan: { label: 'Kearsipan',   maks: 5  },
        spj:       { label: 'SPJ',         maks: 35 },
        monev:     { label: 'Monev',       maks: 40 },
    };

    // ── Cache key (sama dengan yang dipakai penilaian-orang.js) ──
    var TEAM_CACHE_KEY = 'penilaian_orang_team_cache_v1';

    // ============================================================
    // JSONP HELPER
    // Bisa memanggil GAS URL mana saja dengan parameter apapun.
    // ============================================================
    function jsonp(url, params, timeoutMs) {
        return new Promise(function (resolve, reject) {
            if (!url || url.indexOf('GANTI_URL') !== -1) {
                reject(new Error('URL belum dikonfigurasi: ' + url));
                return;
            }
            var cb     = '__gasJP_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done   = false;
            var script = document.createElement('script');
            var timer  = setTimeout(function () {
                if (done) return;
                cleanup();
                reject(new Error('Timeout (' + (timeoutMs || 15000) / 1000 + 's)'));
            }, timeoutMs || 15000);

            function cleanup() {
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (e) {}
                if (script.parentNode) script.parentNode.removeChild(script);
            }

            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () {
                if (done) return;
                cleanup();
                reject(new Error('Network error'));
            };

            var qs = Object.keys(params || {}).map(function (k) {
                return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
            }).join('&');

            script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + qs + '&callback=' + cb;
            document.head.appendChild(script);
        });
    }

    // ============================================================
    // NORMALISASI NAMA UNIT
    // Setiap API punya format unit sedikit berbeda.
    // ============================================================
    function normalizeUnit(raw) {
        if (!raw) return '';
        var s = raw.trim();
        // Alias umum
        var map = {
            'BLUT': 'Balai Layanan Usaha Terpadu KUMKM',
            'Balai KUMKM': 'Balai Layanan Usaha Terpadu KUMKM',
            'Balai Layanan Usaha Terpadu': 'Balai Layanan Usaha Terpadu KUMKM',
        };
        if (map[s]) return map[s];
        // Cari exact match
        var found = UNITS.find(function (u) { return u === s; });
        if (found) return found;
        // Case-insensitive
        var sLow = s.toLowerCase();
        found = UNITS.find(function (u) { return u.toLowerCase() === sLow; });
        if (found) return found;
        // Partial match
        found = UNITS.find(function (u) { return sLow.indexOf(u.toLowerCase()) !== -1 || u.toLowerCase().indexOf(sLow) !== -1; });
        return found || s;
    }

    // ============================================================
    // FETCH SCORES DARI MASING-MASING SUMBER
    // Setiap fungsi mengembalikan { [unit]: nilai } atau {}
    // ============================================================

    // ── 1. BBM (maks 5) ──
    function fetchBBM(bulan) {
        return jsonp(window.PPO_GAS_CONFIG.urlOperasional,
            { action: 'getBBMScores' }, 12000)
        .then(function (res) {
            var result = {};
            if (!res || !res.success) return result;
            (res.scores || []).forEach(function (s) {
                if ((s.bulan || '').toUpperCase() !== bulan.toUpperCase()) return;
                var unit = normalizeUnit(s.unit);
                if (!unit) return;
                result[unit] = parseFloat(s.skorAkhir) || 0;
            });
            return result;
        }).catch(function () { return {}; });
    }

    // ── 2. Kendaraan = Kunci + Bersih (maks 10 total) ──
    function fetchKendaraan(bulan) {
        return Promise.all([
            jsonp(window.PPO_GAS_CONFIG.urlOperasional,
                { action: 'getVehicleScores', jenis: 'KUNCI' }, 12000)
                .catch(function () { return null; }),
            jsonp(window.PPO_GAS_CONFIG.urlOperasional,
                { action: 'getVehicleScores', jenis: 'BERSIH' }, 12000)
                .catch(function () { return null; }),
        ]).then(function (results) {
            var result = {};
            results.forEach(function (res) {
                if (!res || !res.success) return;
                (res.scores || []).forEach(function (s) {
                    if ((s.bulan || '').toUpperCase() !== bulan.toUpperCase()) return;
                    var unit = normalizeUnit(s.unit);
                    if (!unit) return;
                    result[unit] = (result[unit] || 0) + (parseFloat(s.skorAkhir) || 0);
                });
            });
            return result;
        }).catch(function () { return {}; });
    }

    // ── 3. Ruang Rapat (maks 5) ──
    function fetchRuangRapat(bulan) {
        return jsonp(window.PPO_GAS_CONFIG.urlOperasional,
            { action: 'getRoomScores' }, 12000)
        .then(function (res) {
            var result = {};
            if (!res || !res.success) return result;
            (res.scores || []).forEach(function (s) {
                if ((s.bulan || '').toUpperCase() !== bulan.toUpperCase()) return;
                var unit = normalizeUnit(s.unit);
                if (!unit) return;
                result[unit] = parseFloat(s.skorAkhir) || 0;
            });
            return result;
        }).catch(function () { return {}; });
    }

    // ── 4. Kearsipan/Dokumen (maks 5) ──
    // Diambil dari getDocuments, rata-rata nilai per unit per bulan
    function fetchKearsipan(bulan) {
        return jsonp(window.PPO_GAS_CONFIG.urlOperasional,
            { action: 'getDocuments' }, 12000)
        .then(function (res) {
            var result = {};
            var docs = [];
            if (Array.isArray(res)) docs = res;
            else if (res && Array.isArray(res.data)) docs = res.data;

            var acc = {}; // { unit: [nilai, ...] }
            docs.forEach(function (d) {
                if (!d.nilai || d.nilai === '' || d.nilai === '-') return;
                var nilaiNum = parseFloat(String(d.nilai).replace(',', '.'));
                if (isNaN(nilaiNum) || nilaiNum <= 0) return;
                // Cocokkan bulan
                var docBulan = (d.bulan || '').toString().trim().toUpperCase();
                if (docBulan !== bulan.toUpperCase()) return;
                var unit = normalizeUnit(d.unit);
                if (!unit) return;
                if (!acc[unit]) acc[unit] = [];
                acc[unit].push(nilaiNum);
            });

            Object.keys(acc).forEach(function (unit) {
                var vals = acc[unit];
                var avg  = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
                result[unit] = +Math.min(5, avg).toFixed(2);
            });
            return result;
        }).catch(function () { return {}; });
    }

    // ── 5. SPJ Keuangan (maks 35) ──
    // Gunakan getAllMonthlySheetData (paling akurat) lalu fallback ke getAllSPJKeuangan
    function fetchSPJ(bulan) {
        return jsonp(window.PPO_GAS_CONFIG.urlSPJ,
            { action: 'getAllMonthlySheetData' }, 15000)
        .then(function (res) {
            var result = {};
            if (!res || !res.success || !res.rekap) throw new Error('no data');
            var bulanKey = Object.keys(res.rekap).find(function (k) {
                return k.toUpperCase() === bulan.toUpperCase();
            });
            if (!bulanKey) return result;
            var bulanData = res.rekap[bulanKey];
            Object.keys(bulanData).forEach(function (unitRaw) {
                var unit = normalizeUnit(unitRaw);
                if (!unit) return;
                var d = bulanData[unitRaw];
                var total = parseFloat(
                    d.totalNilai !== undefined ? d.totalNilai :
                    d.total      !== undefined ? d.total      :
                    d.nilai      !== undefined ? d.nilai      : NaN
                );
                if (!isNaN(total) && total >= 0) result[unit] = +total.toFixed(2);
            });
            return result;
        })
        .catch(function () {
            // Fallback ke getAllSPJKeuangan
            return jsonp(window.PPO_GAS_CONFIG.urlSPJ,
                { action: 'getAllSPJKeuangan' }, 15000)
            .then(function (res2) {
                var result = {};
                if (!res2 || !res2.success || !res2.rekap) return result;
                var bulanKey = Object.keys(res2.rekap).find(function (k) {
                    return k.toUpperCase() === bulan.toUpperCase();
                });
                if (!bulanKey) return result;
                var bulanData = res2.rekap[bulanKey];
                Object.keys(bulanData).forEach(function (unitRaw) {
                    var unit = normalizeUnit(unitRaw);
                    if (!unit) return;
                    var d = bulanData[unitRaw];
                    var total = parseFloat(d.totalNilai !== undefined ? d.totalNilai : d.total);
                    if (!isNaN(total) && total >= 0) result[unit] = +total.toFixed(2);
                });
                return result;
            }).catch(function () { return {}; });
        });
    }

    // ── 6. Monev (maks 40) ──
    // Gunakan getAllSheetData (format nested bulan→unit→{total})
    function fetchMonev(bulan) {
        return jsonp(window.PPO_GAS_CONFIG.urlMonev,
            { action: 'getAllSheetData' }, 15000)
        .then(function (res) {
            var result = {};
            var data   = null;

            if (res && res.status === 'success' && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
                data = res.data; // nested: { BULAN: { unit: {...} } }
            } else if (res && res.rekap) {
                data = res.rekap;
            }

            if (!data) return result;

            var bulanKey = Object.keys(data).find(function (k) {
                // Normalisasi: "APRIL", "April", "april" semua cocok
                return k.trim().toUpperCase() === bulan.toUpperCase();
            });
            if (!bulanKey) return result;

            var bulanData = data[bulanKey];
            Object.keys(bulanData).forEach(function (unitRaw) {
                var unit = normalizeUnit(unitRaw);
                if (!unit) return;
                var d = bulanData[unitRaw];
                var raw =
                    d.total     !== undefined ? d.total     :
                    d.totalNilai !== undefined ? d.totalNilai :
                    d.nilai      !== undefined ? d.nilai      : null;
                if (raw !== null) {
                    var v = parseFloat(raw);
                    if (!isNaN(v) && v >= 0) result[unit] = +v.toFixed(2);
                }
            });
            return result;
        }).catch(function () { return {}; });
    }

    // ============================================================
    // FETCH SEMUA KOMPONEN SECARA PARALEL
    // Mengembalikan { [unit]: { bbm, kendaraan, ruang, kearsipan, spj, monev, total } }
    // ============================================================
    window.PPO_GAS_CONFIG.fetchAllTeamScores = function (bulan) {
        if (!bulan) return Promise.reject(new Error('Parameter bulan wajib diisi'));

        var urlOp    = window.PPO_GAS_CONFIG.urlOperasional;
        var urlSPJ   = window.PPO_GAS_CONFIG.urlSPJ;
        var urlMonev = window.PPO_GAS_CONFIG.urlMonev;

        // Jika URL belum dikonfigurasi, skip sumber tersebut
        var promises = [
            urlOp.indexOf('GANTI_URL')    === -1 ? fetchBBM(bulan)       : Promise.resolve({}),
            urlOp.indexOf('GANTI_URL')    === -1 ? fetchKendaraan(bulan)  : Promise.resolve({}),
            urlOp.indexOf('GANTI_URL')    === -1 ? fetchRuangRapat(bulan) : Promise.resolve({}),
            urlOp.indexOf('GANTI_URL')    === -1 ? fetchKearsipan(bulan)  : Promise.resolve({}),
            urlSPJ.indexOf('GANTI_URL')   === -1 ? fetchSPJ(bulan)        : Promise.resolve({}),
            urlMonev.indexOf('GANTI_URL') === -1 ? fetchMonev(bulan)      : Promise.resolve({}),
        ];

        var keys = ['bbm', 'kendaraan', 'ruang', 'kearsipan', 'spj', 'monev'];

        return Promise.all(promises).then(function (results) {
            // Gabungkan semua hasil ke format { unit: { komponen: nilai, total: N } }
            var combined = {};
            UNITS.forEach(function (unit) {
                combined[unit] = { bbm: 0, kendaraan: 0, ruang: 0, kearsipan: 0, spj: 0, monev: 0, total: 0 };
            });

            results.forEach(function (res, i) {
                var key = keys[i];
                Object.keys(res).forEach(function (unit) {
                    var normUnit = normalizeUnit(unit);
                    if (!combined[normUnit]) combined[normUnit] = { bbm:0, kendaraan:0, ruang:0, kearsipan:0, spj:0, monev:0, total:0 };
                    combined[normUnit][key] = parseFloat(res[unit]) || 0;
                });
            });

            // Hitung total per unit
            UNITS.forEach(function (unit) {
                var c = combined[unit];
                c.total = +( c.bbm + c.kendaraan + c.ruang + c.kearsipan + c.spj + c.monev ).toFixed(2);
            });

            return combined;
        });
    };

    // ============================================================
    // SIMPAN KE CACHE LOKAL
    // ============================================================
    window.PPO_GAS_CONFIG.saveTeamScoresToCache = function (bulan, scores) {
        try {
            var cached = JSON.parse(localStorage.getItem('penilaian_orang_team_cache_v1') || '{}');
            cached[bulan] = { scores: scores, timestamp: Date.now() };
            localStorage.setItem('penilaian_orang_team_cache_v1', JSON.stringify(cached));
        } catch (e) {
            console.warn('[PPO Integration] Gagal simpan cache:', e);
        }
    };

    // ============================================================
    // SAVE PENILAIAN KE GAS — diperbaiki
    // Masalah lama: 'criteria' dikirim sebagai objek JS, tapi GAS
    // mengharapkan JSON string di dalam JSONP GET request.
    // Solusi: stringify criteria + kirim lewat jsonBody.
    // ============================================================
    window.PPO_GAS_CONFIG.savePenilaian = function (payload) {
        var url = window.PPO_GAS_CONFIG.url;
        if (!url || url.indexOf('GANTI_URL') !== -1) {
            return Promise.reject(new Error('URL GAS PPO belum dikonfigurasi'));
        }

        // Pastikan criteria adalah string JSON
        var body = Object.assign({}, payload);
        body.action = 'savePenilaian';
        if (body.criteria && typeof body.criteria === 'object') {
            body.criteria = JSON.stringify(body.criteria);
        }

        return new Promise(function (resolve, reject) {
            var cb     = '__gasSave_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done   = false;
            var script = document.createElement('script');
            var timer  = setTimeout(function () {
                if (done) return;
                cleanup();
                reject(new Error('Timeout simpan penilaian (20 detik)'));
            }, 20000);

            function cleanup() {
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (e) {}
                if (script.parentNode) script.parentNode.removeChild(script);
            }

            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () {
                if (done) return;
                cleanup();
                reject(new Error('Network error saat simpan penilaian'));
            };

            // Kirim via jsonBody — lebih andal untuk data nested
            var encoded = encodeURIComponent(JSON.stringify(body));
            script.src  = url + '?jsonBody=' + encoded + '&callback=' + cb;
            document.head.appendChild(script);
        });
    };

    // ============================================================
    // DELETE PENILAIAN DARI GAS
    // ============================================================
    window.PPO_GAS_CONFIG.deletePenilaian = function (payload) {
        var url = window.PPO_GAS_CONFIG.url;
        if (!url || url.indexOf('GANTI_URL') !== -1) {
            return Promise.reject(new Error('URL GAS PPO belum dikonfigurasi'));
        }

        var body = Object.assign({}, payload);
        body.action = 'deletePenilaian';

        return new Promise(function (resolve, reject) {
            var cb     = '__gasDel_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
            var done   = false;
            var script = document.createElement('script');
            var timer  = setTimeout(function () {
                if (done) return;
                cleanup();
                reject(new Error('Timeout hapus penilaian'));
            }, 20000);

            function cleanup() {
                done = true;
                clearTimeout(timer);
                try { delete window[cb]; } catch (e) {}
                if (script.parentNode) script.parentNode.removeChild(script);
            }

            window[cb] = function (data) { cleanup(); resolve(data); };
            script.onerror = function () {
                if (done) return;
                cleanup();
                reject(new Error('Network error saat hapus penilaian'));
            };

            var encoded = encodeURIComponent(JSON.stringify(body));
            script.src  = url + '?jsonBody=' + encoded + '&callback=' + cb;
            document.head.appendChild(script);
        });
    };

    console.log('[PPO Integration v3.0] Loaded. URLs configured:', {
        ppo:       window.PPO_GAS_CONFIG.url       ? '✓' : '✗',
        operasional: window.PPO_GAS_CONFIG.urlOperasional.indexOf('GANTI') === -1 ? '✓' : '(belum diisi)',
        spj:       window.PPO_GAS_CONFIG.urlSPJ.indexOf('GANTI')   === -1 ? '✓' : '(belum diisi)',
        monev:     window.PPO_GAS_CONFIG.urlMonev.indexOf('GANTI') === -1 ? '✓' : '(belum diisi)',
    });

})();