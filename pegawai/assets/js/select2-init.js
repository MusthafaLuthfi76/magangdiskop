// ============================================
// CUSTOM AUTOCOMPLETE untuk Sub Kegiatan
// Single input field — langsung ketik untuk cari
// Menggantikan Select2 yang memunculkan kotak pencarian terpisah
// ============================================

const SUB_KEGIATAN_LIST = [
    "Pemanfaatan Ruang Satuan Ruang Strategis Merapi",
    "Penyusunan Dokumen Perencanaan Perangkat Daerah",
    "Koordinasi dan Penyusunan DPA-SKPD",
    "Evaluasi Kinerja Perangkat Daerah",
    "Penyediaan Gaji dan Tunjangan ASN",
    "Pelaksanaan Penatausahaan dan Pengujian/Verifikasi Keuangan SKPD",
    "Koordinasi dan Penyusunan Laporan Keuangan Akhir Tahun SKPD",
    "Koordinasi dan Penyusunan Laporan Keuangan Bulanan/ Triwulanan/Semesteran SKPD",
    "Penatausahaan Barang Milik Daerah pada SKPD",
    "Penyediaan Komponen Instalasi Listrik/Penerangan Bangunan Kantor",
    "Penyediaan Peralatan dan Perlengkapan Kantor",
    "Penyediaan Peralatan Rumah Tangga",
    "Penyediaan Barang Cetakan dan Penggandaan",
    "Penyediaan Bahan Bacaan dan Peraturan Perundang-Undangan",
    "Penyelenggaraan Rapat Koordinasi dan Konsultasi SKPD",
    "Pengadaan Peralatan dan Mesin Lainnya",
    "Pengadaan Sarana dan Prasarana Gedung Kantor atau Bangunan Lainnya",
    "Penyediaan Jasa Surat Menyurat",
    "Penyediaan Jasa Komunikasi, Sumber Daya Air dan Listrik",
    "Penyediaan Jasa Pelayanan Umum Kantor",
    "Penyediaan Jasa Pemeliharaan, Biaya Pemeliharaan dan Pajak Kendaraan Perorangan Dinas atau Kendaraan Dinas Jabatan",
    "Penyediaan Jasa Pemeliharaan, Biaya Pemeliharaan, Pajak dan Perizinan Kendaraan Dinas Operasional atau Lapangan",
    "Pemeliharaan Mebel",
    "Pemeliharaan Peralatan dan Mesin Lainnya",
    "Pemeliharaan/Rehabilitasi Gedung Kantor dan Bangunan Lainnya",
    "Pemeliharaan/Rehabilitasi Sarana dan Prasarana Gedung Kantor atau Bangunan Lainnya",
    "Fasilitasi Izin Usaha Simpan Pinjam untuk Koperasi Dengan Wilayah Keanggotaan Lintas Daerah Kabupaten/Kota dalam 1 (satu) Daerah Provinsi",
    "Penguatan Tata Kelola Kelembagaan Koperasi",
    "Penilaian Kesehatan Koperasi Meliputi Tata Kelola, Profil Risiko, Kinerja Keuangan, dan Permodalan",
    "Peningkatan Pemahaman dan Pengetahuan Perkoperasian serta Kapasitas dan Kompetensi SDM Koperasi",
    "Peningkatan Produktivitas, Nilai Tambah, Akses Pasar, Akses Pembiayaan, Penguatan Kelembagaan, Penataan Manajemen, Standarisasi, dan Restrukturisasi Usaha",
    "Menumbuhkembangkan UMKM untuk Menjadi Usaha yang Tangguh dan Mandiri Sehingga dapat Meningkatkan Penciptaan Lapangan Kerja, Pemerataan Pendapatan, Pertumbuhan Ekonomi, dan Pengentasan Kemiskinan",
    "Peningkatan Pemahaman dan Pengetahuan UMKM serta Kapasitas dan Kompetensi SDM UMKM dan Kewirausahaan",
    "Produksi dan Pengolahan, Pemasaran, Sumber Daya Manusia, serta Desain dan Teknologi",
    "Peningkatan Pemahaman dan Pengetahuan Literasi Hukum dan Bantuan Penyelesaian Perkara bagi Pelaku UMKM",
    "Nominasi Warisan Budaya Nasional dan Dunia",
    "Pengembangan Industri Kreatif",
    "Pengembangan Kewirausahaan Desa"
];

// ============================================
// CORE: Buat autocomplete widget pada sebuah <select>
// targetId : id dari <select> asli (akan disembunyikan)
// ============================================
function createAutocomplete(targetId) {
    const $select = document.getElementById(targetId);
    if (!$select) return;

    // Cegah inisialisasi ganda
    if ($select.dataset.acInit === 'true') return;
    $select.dataset.acInit = 'true';

    // Sembunyikan <select> asli, tapi tetap ikut form submit via value sync
    $select.style.display = 'none';
    $select.removeAttribute('required');

    // Buat wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'ac-wrapper';

    // Input utama yang user ketik
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control ac-input';
    input.placeholder = 'Ketik untuk mencari sub kegiatan...';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.required = true;

    // Ikon chevron kanan
    const chevron = document.createElement('span');
    chevron.className = 'ac-chevron';
    chevron.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

    // Dropdown list
    const list = document.createElement('ul');
    list.className = 'ac-list';

    wrapper.appendChild(input);
    wrapper.appendChild(chevron);
    wrapper.appendChild(list);

    // Sisipkan wrapper tepat sebelum <select>
    $select.parentNode.insertBefore(wrapper, $select);

    // ---- State ----
    let activeIndex = -1;
    let isOpen = false;

    // ---- Helpers ----
    function openList(items) {
        list.innerHTML = '';
        activeIndex = -1;

        const toRender = items.length > 0 ? items : null;

        if (!toRender) {
            const li = document.createElement('li');
            li.className = 'ac-empty';
            li.textContent = 'Sub kegiatan tidak ditemukan';
            list.appendChild(li);
        } else {
            toRender.forEach(function (item) {
                const li = document.createElement('li');
                li.className = 'ac-item';

                // Highlight matched text
                const query = input.value.trim();
                if (query) {
                    const idx = item.toLowerCase().indexOf(query.toLowerCase());
                    if (idx >= 0) {
                        li.innerHTML =
                            escapeHtml(item.substring(0, idx)) +
                            '<mark>' + escapeHtml(item.substring(idx, idx + query.length)) + '</mark>' +
                            escapeHtml(item.substring(idx + query.length));
                    } else {
                        li.textContent = item;
                    }
                } else {
                    li.textContent = item;
                }

                li.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    selectItem(item);
                });
                list.appendChild(li);
            });
        }

        list.style.display = 'block';
        isOpen = true;

        // Kalau ada nilai terpilih, scroll ke item itu
        if ($select.value) {
            const allItems = list.querySelectorAll('.ac-item');
            allItems.forEach(function (el) {
                if (el.textContent === $select.value) {
                    el.classList.add('ac-selected');
                    el.scrollIntoView({ block: 'nearest' });
                }
            });
        }
    }

    function closeList() {
        list.style.display = 'none';
        isOpen = false;
        activeIndex = -1;
    }

    function selectItem(value) {
        input.value = value;

        // Sync ke <select> asli — pastikan option ada, atau buat sementara
        let opt = $select.querySelector('option[value="' + value.replace(/"/g, '\\"') + '"]');
        if (!opt) {
            opt = document.createElement('option');
            opt.value = value;
            opt.textContent = value;
            $select.appendChild(opt);
        }
        $select.value = value;

        input.classList.remove('ac-invalid');
        closeList();
        $select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function highlightItem(newIndex) {
        const items = list.querySelectorAll('.ac-item');
        items.forEach(function (el) { el.classList.remove('ac-active'); });
        if (newIndex >= 0 && newIndex < items.length) {
            items[newIndex].classList.add('ac-active');
            items[newIndex].scrollIntoView({ block: 'nearest' });
            activeIndex = newIndex;
        }
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function getFiltered() {
        const q = input.value.trim().toLowerCase();
        if (!q) return SUB_KEGIATAN_LIST;
        return SUB_KEGIATAN_LIST.filter(function (i) { return i.toLowerCase().includes(q); });
    }

    // ---- Events ----

    // Klik input → buka semua atau filtered
    input.addEventListener('click', function () {
        openList(getFiltered());
    });

    // Klik chevron → toggle
    chevron.addEventListener('mousedown', function (e) {
        e.preventDefault();
        if (isOpen) {
            closeList();
        } else {
            input.focus();
            openList(getFiltered());
        }
    });

    // Ketik → filter realtime
    input.addEventListener('input', function () {
        const q = input.value.trim();
        if (!q) {
            $select.value = '';
            openList(SUB_KEGIATAN_LIST);
            return;
        }
        const filtered = SUB_KEGIATAN_LIST.filter(function (i) {
            return i.toLowerCase().includes(q.toLowerCase());
        });
        openList(filtered);
    });

    // Keyboard navigation
    input.addEventListener('keydown', function (e) {
        const items = list.querySelectorAll('.ac-item');

        if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            openList(getFiltered());
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlightItem(Math.min(activeIndex + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlightItem(Math.max(activeIndex - 1, 0));
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && items[activeIndex]) {
                e.preventDefault();
                selectItem(items[activeIndex].textContent.replace(/\s+/g, ' ').trim());
            }
        } else if (e.key === 'Escape') {
            closeList();
        } else if (e.key === 'Tab') {
            // Jika ada item aktif, pilih saat Tab
            if (activeIndex >= 0 && items[activeIndex]) {
                selectItem(items[activeIndex].textContent.replace(/\s+/g, ' ').trim());
            }
            closeList();
        }
    });

    // Blur → validasi
    input.addEventListener('blur', function () {
        setTimeout(function () {
            closeList();
            const val = input.value.trim();
            if (val && !SUB_KEGIATAN_LIST.includes(val)) {
                // Nilai tidak valid — tandai
                input.classList.add('ac-invalid');
                $select.value = '';
            } else if (!val) {
                $select.value = '';
            }
        }, 200);
    });

    // Klik di luar → tutup
    document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) {
            closeList();
        }
    });
}

// ============================================
// INIT
// ============================================
function initAllAutocomplete() {
    // Hapus inisialisasi Select2 lama jika ada
    if (typeof $ !== 'undefined' && typeof $.fn !== 'undefined' && typeof $.fn.select2 !== 'undefined') {
        $('.select2-subkegiatan').each(function () {
            if ($(this).hasClass('select2-hidden-accessible')) {
                try { $(this).select2('destroy'); } catch (e) { }
            }
        });
    }

    // Init semua field sub kegiatan — termasuk Dana Bersama
    createAutocomplete('sub-kegiatan-spj');
    createAutocomplete('sub-kegiatan-dana');
    createAutocomplete('sub-kegiatan-dana-bersama'); // ← TAMBAHAN untuk Dana Bersama

    console.log('✅ Custom autocomplete initialized (spj, dana, dana-bersama)');
}

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initAllAutocomplete, 150);
});

console.log('✅ select2-init.js (custom autocomplete) loaded');