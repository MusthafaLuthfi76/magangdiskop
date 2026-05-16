// ============================================================
// penilaian-orang-gas-integration.js  v2.1
// Integrasi GAS untuk Penilaian Per Orang — TRIWULAN ONLY
//
// PERBAIKAN v2.1:
//  - URL GAS menggunakan URL backend yang benar
//  - savePenilaian → selalu ke savePenilaianTW
//  - Tidak ada field 'bulan' di payload
// ============================================================

(function () {
    'use strict';

    // ── URL GAS ──────────────────────────────────────────────
    // URL backend PPO (yang punya handler savePenilaianTW)
    // Ganti dengan URL deploy GAS Anda yang sudah diperbarui
    var GAS_URL_PPO = 'https://script.google.com/macros/s/AKfycbzhf7jO8TdVg5Q1xV1ZIE11cVlKfOTSUwlaZdZAZvA36nzNTsqzWEci3UQwmHRKHauv-g/exec';

    // URL untuk ambil data operasional (skor tim, diklat)
    var GAS_URL_OPERASIONAL = (typeof API_OP !== 'undefined' && API_OP)
        ? API_OP
        : GAS_URL_PPO;

    // ── Helper JSONP (GET params) ─────────────────────────────
    function _jsonp(url, params) {
        return new Promise(function (resolve, reject) {
            var cb = '__ppoInt_' + Date.now() + '_' + Math.floor(Math.random() * 99999);
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

    // ── Team Score Cache ──────────────────────────────────────
    var TEAM_CACHE_KEY = 'penilaian_orang_team_cache_v1';

    function _saveTeamCache(bulan, scores) {
        try {
            var raw = JSON.parse(localStorage.getItem(TEAM_CACHE_KEY) || '{}');
            raw[bulan] = { scores: scores, timestamp: Date.now() };
            localStorage.setItem(TEAM_CACHE_KEY, JSON.stringify(raw));
        } catch (e) {}
    }

    function _loadTeamCache(bulan) {
        try {
            var raw = JSON.parse(localStorage.getItem(TEAM_CACHE_KEY) || '{}');
            var entry = raw[bulan];
            if (!entry || !entry.scores) return null;
            if (Date.now() - (entry.timestamp || 0) > 3600000) return null;
            return entry.scores;
        } catch (e) { return null; }
    }

    // ── Ambil skor tim per bulan ──────────────────────────────
    function fetchTeamScoresForMonth(bulan) {
        var cached = _loadTeamCache(bulan);
        if (cached) return Promise.resolve(cached);
        return _jsonp(GAS_URL_OPERASIONAL, {
            action: 'getTeamScores',
            bulan: bulan,
            tahun: new Date().getFullYear().toString()
        }).then(function (res) {
            if (res && res.status === 'success' && res.scores) {
                _saveTeamCache(bulan, res.scores);
                return res.scores;
            }
            return {};
        }).catch(function () { return {}; });
    }

    function fetchAllTeamScores(bulan) {
        return fetchTeamScoresForMonth(bulan);
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

        console.log('[PPO-Integration] savePenilaianTW =>', {
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

    console.log('[PPO-Integration v2.1] Ready. URL:', GAS_URL_PPO);

})();