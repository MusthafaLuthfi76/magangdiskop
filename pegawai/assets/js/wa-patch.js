// ============================================================
// wa-patch.js
// Load SETELAH main.js
// ============================================================

const WA_ADMIN_VOUCHER_BBM = '6289518014663';  // admin voucher BBM & kendaraan
const WA_ADMIN_RUANG_RAPAT = '6282136890388';  // admin ruang rapat
const WA_ADMIN_KEARSIPAN   = '62895333318630'; // admin kearsipan

// Mapping: alertId → waBoxId
const WA_BOX_MAP = {
    'alert-kendaraan': 'wa-box-kendaraan',
    'alert-ruangan': 'wa-box-ruangan',
    'alert-voucher': 'wa-box-voucher',
    'alert-spj': 'wa-box-spj',
    'alert-pengajuan-dana': 'wa-box-pengajuan-dana',
    'alert-arsip': 'wa-box-arsip',
    'alert-dana-bersama': 'wa-box-dana-bersama'
};

// ── Timestamp WIB ─────────────────────────────────────────
function waTimestamp() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const pad = n => String(n).padStart(2, '0');
    const wib = new Date(now.getTime() + 7 * 3600 * 1000);
    return `${days[now.getDay()]}, ${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()} pukul ${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())} WIB`;
}

// ── Rupiah ────────────────────────────────────────────────
function waRupiah(angka) {
    const num = parseInt(String(angka).replace(/\D/g, '')) || 0;
    return 'Rp ' + num.toLocaleString('id-ID');
}

// ── Sembunyikan WA box (saat form disubmit ulang) ─────────
function hideWABox(alertId) {
    const boxId = WA_BOX_MAP[alertId];
    if (!boxId) return;
    const box = document.getElementById(boxId);
    if (box) box.style.display = 'none';
}

// ── Tampilkan WA box — SELALU di luar & di bawah alert ────
// Parameter adminNumber wajib diisi sesuai jenis pengajuan
// ─────────────────────────────────────────────────────────
function showWhatsAppButton(alertId, waMessage, adminNumber) {
    const alertEl = document.getElementById(alertId);
    if (!alertEl) return;

    const boxId = WA_BOX_MAP[alertId];
    if (!boxId) return;

    // Cari atau buat box
    let box = document.getElementById(boxId);
    if (!box) {
        box = document.createElement('div');
        box.id = boxId;
    }

    // Pastikan box berada tepat SETELAH alertEl di DOM
    if (alertEl.nextSibling !== box) {
        alertEl.insertAdjacentElement('afterend', box);
    }

    const waUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(waMessage)}`;

    box.style.cssText = `
        display: block;
        margin-top: 10px;
    `;

    box.innerHTML = `
<div style="
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 14px;
    padding: 16px 20px;
">
    <div style="
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        background: #25D366;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    ">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    </div>
    <div style="flex: 1; min-width: 0;">
        <p style="margin: 0 0 3px; font-size: 14px; font-weight: 600; color: #166534;">
            Pengajuan berhasil terkirim ke sistem!
        </p>
        <p style="margin: 0 0 12px; font-size: 13px; color: #15803d; line-height: 1.5;">
            Klik tombol di bawah untuk mengirim notifikasi ke admin via WhatsApp. Pesan sudah terisi otomatis sesuai data pengajuan Anda.
        </p>
        <a href="${waUrl}"
           target="_blank"
           rel="noopener noreferrer"
           style="
               display: inline-flex;
               align-items: center;
               gap: 8px;
               padding: 10px 20px;
               background: #25D366;
               color: #fff;
               border-radius: 10px;
               font-size: 14px;
               font-weight: 600;
               text-decoration: none;
               transition: background 0.15s;
           "
           onmouseover="this.style.background='#1ebe5d'"
           onmouseout="this.style.background='#25D366'"
        >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" style="flex-shrink: 0;">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Kirim Konfirmasi ke Admin via WhatsApp
        </a>
    </div>
</div>`;
}

// ============================================================
// OVERRIDE submitKendaraan
// → WA ke: WA_ADMIN_VOUCHER_BBM (admin kendaraan & BBM)
// ============================================================
function submitKendaraan(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateTimeRange(form, 'waktu_mulai', 'waktu_selesai')) return;

    hideWABox('alert-kendaraan');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const tanggal = form.querySelector('[name="tanggal"]').value;
    const mulai = form.querySelector('[name="waktu_mulai"]').value;
    const selesai = form.querySelector('[name="waktu_selesai"]').value;
    const keperluan = form.querySelector('[name="keperluan"]').value;
    const alamat = form.querySelector('[name="alamat"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PENGAJUAN KENDARAAN DINAS
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Tanggal Pakai: ${tanggal}
- Waktu: ${mulai} - ${selesai}
- Keperluan: ${keperluan}
- Alamat: ${alamat}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'KENDARAAN');

    const submitBtn = document.getElementById('submit-kendaraan');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-kendaraan', 'loading-kendaraan', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-kendaraan', function (success) {
        setProgress('progress-kendaraan', 'loading-kendaraan', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-kendaraan', 'loading-kendaraan');
            if (success) {
                showAlert('alert-kendaraan', '✓ Pengajuan kendaraan dinas berhasil dikirim!');
                showWhatsAppButton('alert-kendaraan', waMsg, WA_ADMIN_VOUCHER_BBM);
                form.reset();
            } else {
                showAlert('alert-kendaraan', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================================
// OVERRIDE submitRuang
// → WA ke: WA_ADMIN_RUANG_RAPAT
// ============================================================
function submitRuang(event) {
    event.preventDefault();
    const form = event.target;
    if (!validateTimeRange(form, 'waktu_mulai', 'waktu_selesai')) return;

    hideWABox('alert-ruangan');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const tanggal = form.querySelector('[name="tanggal"]').value;
    const mulai = form.querySelector('[name="waktu_mulai"]').value;
    const selesai = form.querySelector('[name="waktu_selesai"]').value;
    const kegiatan = form.querySelector('[name="nama_kegiatan"]').value;
    const peserta = form.querySelector('[name="jumlah_peserta"]').value;
    const difabelEl = form.querySelector('[name="difabel"]:checked');
    const difabel = difabelEl ? difabelEl.value : 'Tidak Tahu';
    const khusus = form.querySelector('[name="permintaan_khusus"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PERMINTAAN RUANG RAPAT
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Tanggal: ${tanggal}
- Waktu: ${mulai} - ${selesai}
- Kegiatan: ${kegiatan}
- Peserta: ${peserta} orang
- Peserta Difabel: ${difabel}
- Permintaan Khusus: ${khusus || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'RUANG_RAPAT');

    const submitBtn = document.getElementById('submit-ruangan');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-ruangan', 'loading-ruangan', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-ruangan', function (success) {
        setProgress('progress-ruangan', 'loading-ruangan', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-ruangan', 'loading-ruangan');
            if (success) {
                showAlert('alert-ruangan', '✓ Pengajuan ruang rapat berhasil dikirim!');
                showWhatsAppButton('alert-ruangan', waMsg, WA_ADMIN_RUANG_RAPAT);
                form.reset();
            } else {
                showAlert('alert-ruangan', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================================
// OVERRIDE submitVoucher
// → WA ke: WA_ADMIN_VOUCHER_BBM
// ============================================================
function submitVoucher(event) {
    event.preventDefault();
    const form = event.target;

    hideWABox('alert-voucher');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const nopol = form.querySelector('[name="nomor_polisi"]').value;
    const jenis = form.querySelector('[name="jenis_voucher"]').value;
    const nominal = document.getElementById('nominal_diajukan').value;
    const alamat = form.querySelector('[name="alamat_tujuan"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PERMINTAAN VOUCHER BBM
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- No. Kendaraan: ${nopol}
- Jenis Voucher: ${jenis}
- Nominal Diajukan: ${waRupiah(nominal)}
- Alamat Tujuan: ${alamat}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'VOUCHER_BBM');

    const submitBtn = document.getElementById('submit-voucher');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim...';
    setProgress('progress-voucher', 'loading-voucher', 30, 'Mengirim pengajuan...');

    submitViaIframe(formData, 'iframe-voucher', function (success) {
        setProgress('progress-voucher', 'loading-voucher', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-voucher', 'loading-voucher');
            if (success) {
                showAlert('alert-voucher', '✓ Permintaan voucher BBM berhasil dikirim!');
                showWhatsAppButton('alert-voucher', waMsg, WA_ADMIN_VOUCHER_BBM);
                form.reset();
            } else {
                showAlert('alert-voucher', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan';
        }, 500);
    });
}

// ============================================================
// OVERRIDE submitSPJ
// → Tidak ada WA button (SPJ tidak memerlukan konfirmasi manual)
// ============================================================
function submitSPJ(event) {
    event.preventDefault();
    const form = event.target;

    hideWABox('alert-spj');

    const nama = form.querySelector('[name="nama"]').value;
    const unit = form.querySelector('[name="unit"]').value;
    const subKegiatan = form.querySelector('[name="sub_kegiatan"]').value;
    const bulan = form.querySelector('[name="bulan"]').value;
    const nominal = document.getElementById('nominal_spj').value;
    const ts = waTimestamp();

    const waMsg =
        `- PENYAMPAIAN SPJ BARU
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Sub Kegiatan: ${subKegiatan}
- Bulan SPJ: ${bulan}
- Nominal SPJ: ${waRupiah(nominal)}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const formData = new FormData(form);
    formData.append('type', 'SPJ');

    const submitBtn = document.getElementById('submit-spj');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengirim SPJ...';
    setProgress('progress-spj', 'loading-spj', 30, 'Mengirim SPJ ke sistem...');

    submitViaIframe(formData, 'iframe-spj', function (success) {
        setProgress('progress-spj', 'loading-spj', 100, 'Selesai!');
        setTimeout(() => {
            hideProgress('progress-spj', 'loading-spj');
            if (success) {
                showAlert('alert-spj', '✓ SPJ berhasil dikirim!');
                form.reset();
            } else {
                showAlert('alert-spj', '✗ Terjadi kesalahan, silakan coba lagi', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim SPJ';
        }, 500);
    });
}

// ============================================================
// OVERRIDE submitPengajuanDana (async)
// → Tidak ada WA button (dana diproses internal)
// ============================================================
async function submitPengajuanDana(event) {
    event.preventDefault();

    hideWABox('alert-pengajuan-dana');

    const displayEl = document.getElementById('display-nominal-pengajuan');
    const hiddenEl = document.getElementById('nominal_pengajuan');
    if (displayEl && hiddenEl) {
        const raw = displayEl.value.replace(/\D/g, '');
        if (raw) hiddenEl.value = raw;
    }
    const nominalRaw = hiddenEl ? hiddenEl.value : '';
    if (!nominalRaw || parseInt(nominalRaw) <= 0) {
        alert('❌ Nominal pengajuan harus diisi dengan angka yang valid.');
        if (displayEl) displayEl.focus();
        return;
    }
    if (!selectedPengajuanFile) {
        alert('❌ Silakan pilih file pengajuan dana PDF terlebih dahulu!');
        return;
    }

    const formElement = event.target;
    const nama = formElement.querySelector('[name="nama"]').value;
    const unit = formElement.querySelector('[name="unit"]').value;
    const subKegiatan = formElement.querySelector('[name="sub_kegiatan"]').value;
    const bulan = formElement.querySelector('[name="bulan_pengajuan"]').value;
    const ts = waTimestamp();

    const waMsg =
        `- PENGAJUAN DANA BARU
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Sub Kegiatan: ${subKegiatan}
- Bulan Pengajuan: ${bulan}
- Nominal: ${waRupiah(nominalRaw)}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;

    const submitBtn = document.getElementById('submit-pengajuan-dana');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengunggah Pengajuan...';
    setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 20, 'Membaca file...');

    try {
        const base64Data = await fileToBase64(selectedPengajuanFile);
        setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 50, 'Mengunggah ke sistem...');

        const hiddenForm = document.createElement('form');
        hiddenForm.method = 'POST';
        hiddenForm.action = GAS_URL;
        hiddenForm.target = 'iframe-pengajuan-dana';
        hiddenForm.style.display = 'none';

        const fields = {
            action: 'uploadPengajuanDana',
            nama, unit,
            sub_kegiatan: subKegiatan,
            bulan_pengajuan: bulan,
            nominal_pengajuan: nominalRaw,
            fileName: selectedPengajuanFile.name,
            fileData: base64Data,
            mimeType: selectedPengajuanFile.type
        };
        for (const [key, value] of Object.entries(fields)) {
            const inp = document.createElement('input');
            inp.type = 'hidden'; inp.name = key; inp.value = value;
            hiddenForm.appendChild(inp);
        }

        let iframe = document.getElementById('iframe-pengajuan-dana');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'iframe-pengajuan-dana';
            iframe.name = 'iframe-pengajuan-dana';
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
        }
        document.body.appendChild(hiddenForm);
        setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 75, 'Menyimpan file...');
        hiddenForm.submit();
        setTimeout(() => setProgress('progress-pengajuan-dana', 'loading-pengajuan-dana', 100, 'Selesai!'), 1000);

        setTimeout(() => {
            hideProgress('progress-pengajuan-dana', 'loading-pengajuan-dana');
            showAlert('alert-pengajuan-dana', '✓ Pengajuan dana berhasil dikirim! File tersimpan di sistem.');
            formElement.reset();
            selectedPengajuanFile = null;
            document.getElementById('file-pengajuan-info').classList.remove('show');
            if (hiddenForm.parentNode) document.body.removeChild(hiddenForm);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan Dana';
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        hideProgress('progress-pengajuan-dana', 'loading-pengajuan-dana');
        showAlert('alert-pengajuan-dana', '✗ ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan Dana';
    }
}

// ============================================================
// OVERRIDE submitDokumen (async)
// → WA ke: WA_ADMIN_KEARSIPAN
// ============================================================
async function submitDokumen(event) {
    event.preventDefault();
    const formElement = event.target;
    const submitBtn = document.getElementById('submit-arsip');

    hideWABox('alert-arsip');

    if (arsipUploadMode === 'file') {
        if (!selectedArsipFile) { alert('❌ Silakan pilih file terlebih dahulu!'); return; }
    } else {
        if (getDriveLinks().length === 0) { alert('❌ Silakan isi minimal satu link Google Drive!'); return; }
    }

    const nama = formElement.querySelector('[name="nama"]').value;
    const unit = formElement.querySelector('[name="unit"]').value;
    const bulan = formElement.querySelector('[name="bulan"]').value;
    const tahun = formElement.querySelector('[name="tahun"]').value;
    const jenisDok = formElement.querySelector('[name="jenis_dokumen"]').value;
    const keterangan = formElement.querySelector('[name="keterangan"]').value;
    const ts = waTimestamp();

    let waMsg;
    if (arsipUploadMode === 'drive') {
        const links = getDriveLinks();
        const linksText = links.map((l, i) => `${i + 1}. ${l}`).join('\n');
        waMsg =
            `- UPLOAD DOKUMEN ARSIP (LINK DRIVE)
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Jenis Dokumen: ${jenisDok}
- Bulan/Tahun: ${bulan} / ${tahun}
- Link Drive (${links.length}):
${linksText}
- Keterangan: ${keterangan || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;
    } else {
        waMsg =
            `- UPLOAD DOKUMEN ARSIP
--------------------
- Pemohon: ${nama}
- Unit/Divisi: ${unit}
- Jenis Dokumen: ${jenisDok}
- Bulan/Tahun: ${bulan} / ${tahun}
- File: ${selectedArsipFile ? selectedArsipFile.name : '-'}
- Keterangan: ${keterangan || '-'}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan ini.`;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = arsipUploadMode === 'file' ? 'Mengunggah...' : 'Mengirim...';
    setProgress('progress-arsip', 'loading-arsip', 15, 'Mempersiapkan data...');

    const baseFields = {
        action: 'uploadDokumen',
        nama, unit, bulan, tahun,
        jenis_dokumen: jenisDok,
        keterangan,
        upload_mode: arsipUploadMode
    };

    try {
        if (arsipUploadMode === 'drive') {
            setProgress('progress-arsip', 'loading-arsip', 50, 'Mengirim link Drive...');
            submitViaIframeFields({ ...baseFields, drive_links: JSON.stringify(getDriveLinks()) }, 'iframe-arsip');
        } else {
            setProgress('progress-arsip', 'loading-arsip', 30, `Membaca file: ${selectedArsipFile.name}`);
            const base64Data = await fileToBase64(selectedArsipFile);
            setProgress('progress-arsip', 'loading-arsip', 65, 'Mengunggah ke Google Drive...');
            submitViaIframeFields({
                ...baseFields,
                fileName: selectedArsipFile.name,
                fileData: base64Data,
                mimeType: selectedArsipFile.type || 'application/octet-stream'
            }, 'iframe-arsip');
        }

        setProgress('progress-arsip', 'loading-arsip', 95, 'Menyelesaikan...');
        setTimeout(() => setProgress('progress-arsip', 'loading-arsip', 100, 'Selesai!'), 800);

        setTimeout(() => {
            hideProgress('progress-arsip', 'loading-arsip');
            const msg = arsipUploadMode === 'file'
                ? '✓ Dokumen berhasil diunggah ke Google Drive!'
                : '✓ Link Google Drive berhasil dikirim!';
            showAlert('alert-arsip', msg, 'success');
            showWhatsAppButton('alert-arsip', waMsg, WA_ADMIN_KEARSIPAN);

            formElement.reset();
            selectedArsipFile = null;
            const infoEl = document.getElementById('arsip-file-info');
            if (infoEl) { infoEl.textContent = ''; infoEl.className = 'arsip-file-info'; }

            driveLinksCounter = 1;
            const dlContainer = document.getElementById('drive-links-container');
            if (dlContainer) {
                dlContainer.innerHTML = `<div class="drive-link-row" id="drive-row-1" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
                    <input type="url" class="form-control drive-link-input" placeholder="https://drive.google.com/file/d/..." style="flex:1;">
                    <button type="button" class="btn btn-sm" onclick="removeDriveLink('drive-row-1')" style="display:none;color:#dc2626;border-color:#fca5a5;flex-shrink:0;">✕</button>
                </div>`;
            }

            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Dokumen';
        }, 3200);

    } catch (error) {
        console.error('❌ Error:', error);
        hideProgress('progress-arsip', 'loading-arsip');
        showAlert('alert-arsip', '✗ ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Dokumen';
    }
}

async function submitDanaBersama(event) {
    event.preventDefault();

    hideWABox('alert-dana-bersama');

    // Validasi dasar
    var subKegiatan = (document.getElementById('db-sub-kegiatan-val') || {}).value || '';
    if (!subKegiatan.trim()) {
        alert('❌ Sub Kegiatan harus dipilih dari daftar!');
        return;
    }
    if (selectedBidangSet.size === 0) {
        alert('❌ Pilih minimal satu bidang yang terlibat!');
        return;
    }
    if (!selectedDanaBersamaFile) {
        alert('❌ Silakan pilih file PDF pengajuan dana!');
        return;
    }

    const form = event.target;
    const nama = form.querySelector('[name="nama"]').value;
    const bidang = Array.from(selectedBidangSet).join(', ');
    const bulan = form.querySelector('[name="bulan_pengajuan"]').value;
    const nominalRaw = document.getElementById('nominal_dana_bersama_hidden').value;
    const ts = waTimestamp();

    // Template Pesan WA
    const waMsg =
        `- PENGAJUAN DANA LINTAS BIDANG
--------------------
- Pemohon: ${nama}
- Bidang Terlibat: ${bidang}
- Sub Kegiatan: ${subKegiatan}
- Bulan Pengajuan: ${bulan}
- Nominal: ${waRupiah(nominalRaw)}
- File: ${selectedDanaBersamaFile.name}
--------------------
- Diajukan: ${ts}
Silakan buka dashboard admin untuk memproses pengajuan kolaboratif ini.`;

    const submitBtn = document.getElementById('submit-dana-bersama');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengunggah...';
    setProgress('progress-dana-bersama', 'loading-dana-bersama', 20, 'Membaca file...');

    try {
        const base64Data = await fileToBase64(selectedDanaBersamaFile);
        setProgress('progress-dana-bersama', 'loading-dana-bersama', 55, 'Mengunggah ke sistem...');

        const fields = {
            action: 'uploadDanaBersama',
            nama: nama,
            sub_kegiatan: subKegiatan,
            bulan_pengajuan: bulan,
            nominal_pengajuan: nominalRaw,
            bidang: Array.from(selectedBidangSet).join(','),
            fileName: selectedDanaBersamaFile.name,
            fileData: base64Data,
            mimeType: 'application/pdf'
        };

        setProgress('progress-dana-bersama', 'loading-dana-bersama', 80, 'Menyimpan data...');
        const result = await submitViaIframeFields(fields, 'iframe-dana-bersama');

        setProgress('progress-dana-bersama', 'loading-dana-bersama', 100, 'Selesai!');

        setTimeout(() => {
            hideProgress('progress-dana-bersama', 'loading-dana-bersama');
            const ok = result && (result.status === 'success' || result.success === true);

            if (ok) {
                showAlert('alert-dana-bersama', '✓ Pengajuan Dana Lintas Bidang berhasil dikirim!');
                showWhatsAppButton('alert-dana-bersama', waMsg);
                resetDanaBersamaForm(); // Fungsi reset yang sudah ada di HTML
            } else {
                showAlert('alert-dana-bersama', '✗ Gagal mengirim pengajuan.', 'error');
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Kirim Pengajuan Dana Lintas Bidang';
        }, 1000);

    } catch (error) {
        console.error(error);
        hideProgress('progress-dana-bersama', 'loading-dana-bersama');
        showAlert('alert-dana-bersama', '✗ ' + error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kirim Pengajuan Dana Lintas Bidang';
    }
}