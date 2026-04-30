// ============================================================
// app.js — Shared constants, API helpers, and SPA routing
// Admin Panel — Dinas Koperasi UKM
// ============================================================

// ── API URLs ─────────────────────────────────────────────────
const API_OP = 'https://script.google.com/macros/s/AKfycbxNQCq-3r2xBQvug2uzlgGzUSm9FGNnXgoZjJKLzmZpw-BltRPUoCP8gFw8Ke2SV1Z8Eg/exec';
const API_SPJ = 'https://script.google.com/macros/s/AKfycbw8U7fNHneCo2Mi-nWdP-oeeRl8JYydgyMD_ghmepNt4onT8XPixOVF3GQFWqIsVRkb/exec';
const API_MONEV = 'https://script.google.com/macros/s/AKfycbyuQaHsIxxtmnTr4cPuyUQzdvdr23_3wK59JIF8VYA1ihhBm4ZeD3A0qzpginmmA9d-ng/exec';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxNQCq-3r2xBQvug2uzlgGzUSm9FGNnXgoZjJKLzmZpw-BltRPUoCP8gFw8Ke2SV1Z8Eg/exec';

// ── JSONP helper (GET) ─────────────────────────────────────────
function apiGet(url, params) {
    return new Promise(function (resolve, reject) {
        var cb = '__x' + Date.now() + (Math.random() * 9999 | 0);
        var qs = new URLSearchParams(Object.assign({}, params, { callback: cb })).toString();
        var s = document.createElement('script');
        var done = false;
        var clean = function () {
            done = true;
            delete window[cb];
            if (s.parentNode) s.parentNode.removeChild(s);
        };
        window[cb] = function (d) { clean(); resolve(d); };
        s.onerror = function () { clean(); reject(new Error('network error')); };
        s.src = url + '?' + qs;
        setTimeout(function () { if (!done) { clean(); reject(new Error('timeout')); } }, 20000);
        document.head.appendChild(s);
    });
}

// JSONP helper via jsonBody (untuk action yang butuh body)
function apiJsonGet(url, payload, callback) {
    return new Promise(function (resolve, reject) {
        var cb = callback || ('__gas_' + Date.now() + '_' + (Math.random() * 9999 | 0));
        var body = encodeURIComponent(JSON.stringify(payload));
        var script = document.createElement('script');
        var done = false;
        window[cb] = function (data) { done = true; delete window[cb]; script.remove(); resolve(data); };
        script.onerror = function () { if (done) return; delete window[cb]; script.remove(); reject(new Error('Gagal terhubung.')); };
        setTimeout(function () { if (done) return; delete window[cb]; script.remove(); reject(new Error('Request timeout (15s)')); }, 15000);
        script.src = url + '?jsonBody=' + body + '&callback=' + cb;
        document.head.appendChild(script);
    });
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
    if (typeof AUTH !== 'undefined') {
        AUTH.logout();
    } else {
        localStorage.clear();
        window.location.replace('login.html');
    }
}

// ── SPA: Registry & Router ────────────────────────────────────
// Setiap section mendaftarkan fungsi init-nya ke sini
window.sectionInits = window.sectionInits || {};

// Menyimpan section yang sedang aktif (untuk retry)
var _pendingSection = null;

function showSection(id) {
    // ── Otorisasi SPA ──
    if (typeof AUTH !== 'undefined') {
        const user = AUTH.getUser();
        if (user) {
            const role = AUTH.normalizeRole(user.role);
            if (role) {
                const allowed = AUTH.ROLE_ACCESS[role] || [];
                const key = AUTH.SECTIONS ? AUTH.SECTIONS[id] : null;
                if (key && !allowed.includes(key)) {
                    console.warn('[SPA] Akses ditolak ke section:', id);
                    if (window.showToast) showToast('Akses ditolak ke menu ini', 'error');
                    window.location.replace(AUTH.ROLE_HOME[role] || 'index.html#dashboard');
                    return;
                }
            }
        }
    }

    // Sembunyikan semua section
    document.querySelectorAll('.admin-section').forEach(function (s) {
        s.style.display = 'none';
    });

    // Tampilkan section yang dipilih
    var target = document.getElementById('section-' + id);
    if (target) {
        target.style.display = 'block';
    } else {
        // Fallback ke dashboard jika section tidak ditemukan
        id = 'dashboard';
        var dash = document.getElementById('section-dashboard');
        if (dash) dash.style.display = 'block';
    }

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(function (n) {
        n.classList.remove('active');
    });
    var activeNav = document.querySelector('.nav-item[data-section="' + id + '"]');
    if (activeNav) activeNav.classList.add('active');

    // Update URL hash
    window.location.hash = id;

    // Tutup sidebar mobile
    if (window.innerWidth < 1024) {
        var sidebar = document.getElementById('sidebar');
        var overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    // ── Panggil init function (dengan retry jika script belum selesai load) ──
    _runSectionInit(id, 0);
}

/**
 * Mencoba memanggil sectionInits[id].
 * Jika belum tersedia (script defer belum selesai), retry sampai max 20x (2 detik).
 */
function _runSectionInit(id, attempt) {
    if (window.sectionInits && typeof window.sectionInits[id] === 'function') {
        var initFn = window.sectionInits[id];
        delete window.sectionInits[id]; // hanya sekali
        try {
            initFn();
        } catch (e) {
            console.error('[SPA] init error for section', id, e);
        }
    } else if (attempt < 20) {
        // Script defer belum selesai load — tunggu 100ms lalu coba lagi
        setTimeout(function () {
            // Pastikan section ini masih yang aktif (user belum pindah)
            var currentHash = window.location.hash.replace('#', '') || 'dashboard';
            if (currentHash === id) {
                _runSectionInit(id, attempt + 1);
            }
        }, 100);
    } else {
        console.warn('[SPA] sectionInits["' + id + '"] tidak ditemukan setelah 2 detik. ' +
            'Pastikan script section sudah di-load dan SECTION_ID cocok.');
    }
}

// ── Init SPA on load ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // Set admin user info dari localStorage
    var user = {};
    try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch (e) { }
    var nameEl = document.getElementById('adminName');
    var emailEl = document.getElementById('adminEmail');
    if (nameEl) nameEl.textContent = user.name || 'Administrator';
    if (emailEl) emailEl.textContent = user.email || 'admin@dinas.gov.id';

    // Routing berdasarkan URL hash
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    showSection(hash);

    // Listen hash change (tombol back/forward browser)
    window.addEventListener('hashchange', function () {
        var newHash = window.location.hash.replace('#', '') || 'dashboard';
        showSection(newHash);
    });
});