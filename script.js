// ==========================================
// CONFIG & CONSTANTS
// ==========================================
const PASSWORD_GURU_STATIS = "guru123";

// Link CSV Google Sheets tempat respon Google Form Anda tersimpan
const URL_SPREADSHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSboq-4AO_aGEAAVARkJoGIFrLV3BrDAXdubIgzXKmZT5d_q0eI7Sdkq08vC2pavOC10RIsIygO1ASt/pub?gid=2077710240&single=true&output=csv";

// Link CSV Google Sheets respon Refleksi Siswa
const URL_SPREADSHEET_REFLEKSI_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_scAvTDo_fBrLyg4n70e0lrpmextEDYA1P7LdRrDkOLeb1etnGlMN9Y7j_Um8V8XQFVXpS_EzcBzM/pub?gid=1469454404&single=true&output=csv";

// Base URL Google Form Baru Milik Anda
const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSeoSUbmuE5Tn2lsAB3kAA7hPIiGVoM2PfCOirwOgEJGrSj-mQ/viewform";
const GOOGLE_FORM_REFLEKSI_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfgI-CmNDzUF8DOpfrNrSS7R2-dWoOiW29RY9zsQlOhfQV12A/viewform";

// Data Misi
const DATA_MISI = {
  1: {
    judul: "Misi 1: Jumping Jack",
    instruksi: "Siap mulai bergerak? Pilih cara yang paling nyaman untuk mengaktifkan tubuhmu!",
    video: "about:blank",
    submisi: true
  },
  2: { judul: "Misi 2: Sit Up", instruksi: "Lakukan Sit Up dengan posisi tangan di dada secara benar.", video: "about:blank", submisi: true },
  3: { judul: "Misi 3: Misi Lainnya", instruksi: "Lakukan gerakan Misi 3 konsisten 1 menit.", video: "about:blank", submisi: true },
  4: { judul: "Misi 4: Planking", instruksi: "Tahan posisi Plank sekuat mungkin dan catat detiknya.", video: "about:blank", submisi: true },
  5: { judul: "Misi 5: Final Rush", instruksi: "Naikkan semangatmu! Pilih cara bergerak yang membuatmu tetap aktif sampai pos selesai!", video: "about:blank", submisi: true }
};

let currentMisi = 1;
let chartGuruInstance = null;
let currentSiswaTab = 'dashboard';
let currentGuruTableTab = 'siswa'; // 'siswa' atau 'refleksi'

// Variabel Paginasi Guru
let guruDataCache = [];
let filteredGuruData = [];
let guruCurrentPage = 1;
const GURU_ROWS_PER_PAGE = 10;

// Variabel Paginasi Refleksi Guru
let refleksiDataCache = [];
let filteredRefleksiData = [];
let refleksiCurrentPage = 1;
const REFLEKSI_ROWS_PER_PAGE = 10;

// Helper Fungsi untuk Mengubah Teks ke Title Case (Misal: "TIM 1" -> "Tim 1")
function formatTimToTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

// ==========================================
// INITIALIZATION
// ==========================================
window.onload = function () {
  const inputTgl = document.getElementById('inputTanggal');
  if (inputTgl) {
    const today = new Date().toISOString().split('T')[0];
    inputTgl.value = today; // Tanggal otomatis terisi hari ini (YYYY-MM-DD)
  }
  kembaliKePilihanRole();
};

// ==========================================
// NAVIGATION & ROLE SWITCHING
// ==========================================
function pilihRole(role) {
  if (role === 'guru') {
    const inputPass = document.getElementById('inputPassGuru');
    if (inputPass) inputPass.value = '';
    const modal = document.getElementById('modalPasswordGuru');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => { if (inputPass) inputPass.focus(); }, 100);
    }
  } else if (role === 'siswa') {
    aktifkanViewSiswa();
  } else if (role === 'refleksi') {
    aktifkanViewRefleksi();
  } else if (role === 'panduan') {
    aktifkanViewPanduan();
  }
}

function kembaliKePilihanRole() {
  document.getElementById('viewPilihRole').classList.add('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if (document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if (document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  document.getElementById('btnBeranda').style.display = 'none';
  sessionStorage.removeItem('isGuruLoggedIn');
}

function verifikasiGuru() {
  const pass = document.getElementById('inputPassGuru')?.value || '';
  if (pass === PASSWORD_GURU_STATIS) {
    sessionStorage.setItem('isGuruLoggedIn', 'true');
    document.getElementById('modalPasswordGuru').style.display = 'none';
    document.getElementById('inputPassGuru').value = '';
    aktifkanViewGuru();
  } else {
    alert("Password Salah! Akses khusus guru.");
    const input = document.getElementById('inputPassGuru');
    if (input) {
      input.value = '';
      input.focus();
    }
  }
}

function batalLoginGuru() {
  document.getElementById('modalPasswordGuru').style.display = 'none';
  const input = document.getElementById('inputPassGuru');
  if (input) input.value = '';
  kembaliKePilihanRole();
}

function aktifkanViewSiswa() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if (document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if (document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  document.getElementById('viewSiswa').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'none'; // Siswa sudah punya tombol Keluar

  const nama = sessionStorage.getItem('siswa_nama1');
  if (!nama) {
    document.getElementById('modalIdentitas').style.display = 'flex';
  } else {
    updateSidebarProfile();
    updateDashboard();
  }

  loadProgressMisi();
}

function aktifkanViewGuru() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewSiswa').classList.remove('active');
  if (document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if (document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  document.getElementById('viewGuru').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'inline-flex';

  muatDataGuru();
  muatDataRefleksi();
}

function aktifkanViewRefleksi() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if (document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  if (document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'inline-flex';

  loadRefleksiForm();
}

function aktifkanViewPanduan() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if (document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if (document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'inline-flex';
}

// ==========================================
// SISWA TAB NAVIGATION
// ==========================================
function switchSiswaTab(tabName) {
  currentSiswaTab = tabName;

  document.querySelectorAll('.siswa-tab').forEach(tab => tab.classList.remove('active'));

  const tabMap = {
    'dashboard': 'tabDashboard',
    'materi': 'tabMateri',
    'misi': 'tabMisi'
  };

  if (document.getElementById(tabMap[tabName])) {
    document.getElementById(tabMap[tabName]).classList.add('active');
  }

  document.querySelectorAll('.sidebar-btn:not(.sidebar-btn-danger)').forEach(btn => btn.classList.remove('active'));
  const sideNavMap = {
    'dashboard': 'sideNavDashboard',
    'materi': 'sideNavMateri',
    'misi': 'sideNavMisi'
  };
  const sideBtn = document.getElementById(sideNavMap[tabName]);
  if (sideBtn) sideBtn.classList.add('active');

  document.querySelectorAll('.mobile-tab').forEach(btn => btn.classList.remove('active'));
  const mobNavMap = {
    'dashboard': 'mobNavDashboard',
    'materi': 'mobNavMateri',
    'misi': 'mobNavMisi'
  };
  const mobBtn = document.getElementById(mobNavMap[tabName]);
  if (mobBtn) mobBtn.classList.add('active');
}

// ==========================================
// SISWA FLOW & LOGIC
// ==========================================
function simpanIdentitasSiswa() {
  const nama1 = document.getElementById('inputNama1') ? document.getElementById('inputNama1').value.trim() : '';
  const nama2 = document.getElementById('inputNama2') ? document.getElementById('inputNama2').value.trim() : '';
  const nama3 = document.getElementById('inputNama3') ? document.getElementById('inputNama3').value.trim() : '';
  const nama4 = document.getElementById('inputNama4') ? document.getElementById('inputNama4').value.trim() : '';
  const nama5 = document.getElementById('inputNama5') ? document.getElementById('inputNama5').value.trim() : '';
  const kelas = document.getElementById('inputKelas') ? document.getElementById('inputKelas').value : '';
  const timRaw = document.getElementById('inputTim') ? document.getElementById('inputTim').value : '';
  const tgl = document.getElementById('inputTanggal') ? document.getElementById('inputTanggal').value : '';

  if (!nama1 || !kelas || !timRaw) {
    alert("Mohon isi minimal Nama Anggota 1, Kelas, dan Tim terlebih dahulu!");
    return;
  }

  const timFormatted = formatTimToTitleCase(timRaw);

  sessionStorage.setItem('siswa_nama1', nama1);
  sessionStorage.setItem('siswa_nama2', nama2);
  sessionStorage.setItem('siswa_nama3', nama3);
  sessionStorage.setItem('siswa_nama4', nama4);
  sessionStorage.setItem('siswa_nama5', nama5);
  sessionStorage.setItem('siswa_kelas', kelas);
  sessionStorage.setItem('siswa_tim', timFormatted);
  sessionStorage.setItem('siswa_tgl', tgl);

  document.getElementById('modalIdentitas').style.display = 'none';
  updateSidebarProfile();
  updateDashboard();
  loadProgressMisi();
}

function updateSidebarProfile() {
  const kelas = sessionStorage.getItem('siswa_kelas') || '-';
  const tim = sessionStorage.getItem('siswa_tim') || 'Tim';

  const sidebarProfile = document.getElementById('sidebarProfile');
  if (sidebarProfile) {
    sidebarProfile.style.display = 'flex';
    document.getElementById('sidebarNama').innerText = tim;
    document.getElementById('sidebarKelas').innerText = kelas;

    const initials = tim.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profileAvatar').innerText = initials;
  }

  const dashNama = document.getElementById('dashboardNama');
  if (dashNama) dashNama.innerText = tim;
}

function updateDashboard() {
  const tgl = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];
  const statTanggal = document.getElementById('statTanggal');
  if (statTanggal) statTanggal.innerText = tgl;

  updateProgressRing();
}

function updateProgressRing() {
  let completed = 0;
  const tglAktivitas = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];
  for (let i = 1; i <= 5; i++) {
    if (localStorage.getItem(`completed_misi_${i}_${tglAktivitas}`)) {
      completed++;
    }
  }
  const total = 5;
  const percent = Math.round((completed / total) * 100);

  const progressText = document.getElementById('progressText');
  if (progressText) progressText.innerText = percent + '%';

  const circle = document.getElementById('progressCircle');
  if (circle) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (completed / total) * circumference;
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
  }

  const progressDone = document.getElementById('progressDone');
  const progressPending = document.getElementById('progressPending');
  const statMisiSelesai = document.getElementById('statMisiSelesai');

  if (progressDone) progressDone.innerText = completed;
  if (progressPending) progressPending.innerText = total - completed;
  if (statMisiSelesai) statMisiSelesai.innerText = completed;
}

function resetIdentitas() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.reload();
}

// ==========================================
// MISI LOGIC
// ==========================================
function loadProgressMisi() {
  const tglAktivitas = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];

  for (let i = 1; i <= 5; i++) {
    const card = document.getElementById(`misiCard${i}`);
    const status = document.getElementById(`misiStatus${i}`);
    const isCompleted = localStorage.getItem(`completed_misi_${i}_${tglAktivitas}`);

    if (card) {
      card.classList.remove('locked');

      if (isCompleted) {
        card.classList.add('completed');
        if (status) status.innerHTML = '<span class="material-symbols-rounded">check</span>';
      } else {
        card.classList.remove('completed');
        if (status) status.innerHTML = '<span class="material-symbols-rounded">lock_open</span>';
      }
    }
  }

  updateProgressRing();
}

function openMisiDetail(misiNum) {
  currentMisi = misiNum;
  const misi = DATA_MISI[misiNum];

  document.getElementById('videoIframe').src = misi.video;

  const menuMisi1 = document.getElementById('misi1Menu');
  const infoMisi1 = document.getElementById('misi1InfoCard');
  const menuMisi2 = document.getElementById('misi2Menu');
  const infoMisi2 = document.getElementById('misi2InfoCard');
  const menuMisi3 = document.getElementById('misi3Menu');
  const infoMisi3 = document.getElementById('misi3InfoCard');
  const menuMisi4 = document.getElementById('misi4Menu');
  const infoMisi4 = document.getElementById('misi4InfoCard');
  const menuMisi5 = document.getElementById('misi5Menu');
  const infoMisi5 = document.getElementById('misi5InfoCard');
  const formSection = document.getElementById('misiFormSection');

  // Hide all menus and infos initially
  if (menuMisi1) menuMisi1.style.display = 'none';
  if (infoMisi1) infoMisi1.style.display = 'none';
  if (menuMisi2) menuMisi2.style.display = 'none';
  if (infoMisi2) infoMisi2.style.display = 'none';
  if (menuMisi3) menuMisi3.style.display = 'none';
  if (infoMisi3) infoMisi3.style.display = 'none';
  if (menuMisi4) menuMisi4.style.display = 'none';
  if (infoMisi4) infoMisi4.style.display = 'none';
  if (menuMisi5) menuMisi5.style.display = 'none';
  if (infoMisi5) infoMisi5.style.display = 'none';

  if (misiNum === 1) {
    if (menuMisi1) menuMisi1.style.display = 'flex';
    if (infoMisi1) infoMisi1.style.display = 'flex';
    if (document.getElementById('optJumping')) document.getElementById('optJumping').checked = true;
    pilihSubMisi('jumping_jack');
  } else if (misiNum === 2) {
    if (menuMisi2) menuMisi2.style.display = 'flex';
    if (infoMisi2) infoMisi2.style.display = 'flex';
    if (document.getElementById('optSquat')) document.getElementById('optSquat').checked = true;
    pilihSubMisi('squat');
  } else if (misiNum === 3) {
    if (menuMisi3) menuMisi3.style.display = 'flex';
    if (infoMisi3) infoMisi3.style.display = 'flex';
    if (document.getElementById('optPushUp')) document.getElementById('optPushUp').checked = true;
    pilihSubMisi('push_up');
  } else if (misiNum === 4) {
    if (menuMisi4) menuMisi4.style.display = 'flex';
    if (infoMisi4) infoMisi4.style.display = 'flex';
    if (document.getElementById('optAltLunge')) document.getElementById('optAltLunge').checked = true;
    pilihSubMisi('alt_lunge');
  } else if (misiNum === 5) {
    if (menuMisi5) menuMisi5.style.display = 'flex';
    if (infoMisi5) infoMisi5.style.display = 'flex';
    if (document.getElementById('optHighKnees')) document.getElementById('optHighKnees').checked = true;
    pilihSubMisi('high_knees');
  } else {
    if (formSection) formSection.style.display = 'block';
    loadGoogleForm();
  }
  document.getElementById('misiListView').style.display = 'none';
  document.getElementById('misiDetailView').style.display = 'block';
}

function pilihSubMisi(jenis) {
  const formSection = document.getElementById('misiFormSection');

  // Pos 1 elements
  const infoJumpingJack = document.getElementById('infoJumpingJack');
  const infoStepJack = document.getElementById('infoStepJack');

  // Pos 2 elements
  const infoSquat = document.getElementById('infoSquat');
  const infoSitToStand = document.getElementById('infoSitToStand');

  // Pos 3 elements
  const infoPushUp = document.getElementById('infoPushUp');
  const infoKneePushUp = document.getElementById('infoKneePushUp');

  // Pos 4 elements
  const infoAltLunge = document.getElementById('infoAltLunge');
  const infoRevLunge = document.getElementById('infoRevLunge');

  // Pos 5 elements
  const infoHighKnees = document.getElementById('infoHighKnees');
  const infoMarchingKnee = document.getElementById('infoMarchingKnee');

  if (jenis === 'jumping_jack') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/XR0xeuK5zBU?si=cqm1FvvHZWGae8jo";
    if (formSection) formSection.style.display = 'block';
    if (infoJumpingJack) infoJumpingJack.style.display = 'flex';
    if (infoStepJack) infoStepJack.style.display = 'none';
  } else if (jenis === 'step_jack') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/JHdVMkRBuRA?si=jaKyY97hgRfZ5uF4";
    if (formSection) formSection.style.display = 'block';
    if (infoJumpingJack) infoJumpingJack.style.display = 'none';
    if (infoStepJack) infoStepJack.style.display = 'flex';
  } else if (jenis === 'squat') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/YaXPRqUwItQ?si=-gxP0s-xvZDoir6w";
    if (formSection) formSection.style.display = 'block';
    if (infoSquat) infoSquat.style.display = 'flex';
    if (infoSitToStand) infoSitToStand.style.display = 'none';
  } else if (jenis === 'sit_to_stand') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/ITv-_BkcrD0?si=CKAFVN8sW187M1cG";
    if (formSection) formSection.style.display = 'block';
    if (infoSquat) infoSquat.style.display = 'none';
    if (infoSitToStand) infoSitToStand.style.display = 'flex';
  } else if (jenis === 'push_up') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/WDIpL0pjun0?si=FK_BhD5p7EfRSxrh";
    if (formSection) formSection.style.display = 'block';
    if (infoPushUp) infoPushUp.style.display = 'flex';
    if (infoKneePushUp) infoKneePushUp.style.display = 'none';
  } else if (jenis === 'knee_push_up') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/bwWlK8f1-NM?si=cDl2AoesA86bw6h2";
    if (formSection) formSection.style.display = 'block';
    if (infoPushUp) infoPushUp.style.display = 'none';
    if (infoKneePushUp) infoKneePushUp.style.display = 'flex';
  } else if (jenis === 'alt_lunge') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/YnYA-ughpNQ?si=6K1PdNb_U_Jt_8NK";
    if (formSection) formSection.style.display = 'block';
    if (infoAltLunge) infoAltLunge.style.display = 'flex';
    if (infoRevLunge) infoRevLunge.style.display = 'none';
  } else if (jenis === 'rev_lunge') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/Ry-wqegeKlE?si=sW5C1nfwylgK8zx4";
    if (formSection) formSection.style.display = 'block';
    if (infoAltLunge) infoAltLunge.style.display = 'none';
    if (infoRevLunge) infoRevLunge.style.display = 'flex';
  } else if (jenis === 'high_knees') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/FvjmPRU3zn4?si=NmMnDP8il1NTi_Pk";
    if (formSection) formSection.style.display = 'block';
    if (infoHighKnees) infoHighKnees.style.display = 'flex';
    if (infoMarchingKnee) infoMarchingKnee.style.display = 'none';
  } else if (jenis === 'marching_knee') {
    document.getElementById('videoIframe').src = "https://www.youtube.com/embed/LWlEqUvoIYQ?si=HdxZHAarKifMlolb";
    if (formSection) formSection.style.display = 'block';
    if (infoHighKnees) infoHighKnees.style.display = 'none';
    if (infoMarchingKnee) infoMarchingKnee.style.display = 'flex';
  }

  loadGoogleForm();
}

function closeMisiDetail() {
  document.getElementById('misiDetailView').style.display = 'none';
  document.getElementById('misiListView').style.display = 'block';
  document.getElementById('videoIframe').src = 'about:blank';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selesaikanMisiAktif() {
  const tglAktivitas = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];
  const keyLimit = `completed_misi_${currentMisi}_${tglAktivitas}`;

  if (localStorage.getItem(keyLimit)) {
    alert("Anda sudah menyelesaikan misi ini untuk hari ini!");
    return;
  }

  localStorage.setItem(keyLimit, 'true');
  alert(`Selamat! Anda telah menyelesaikan ${DATA_MISI[currentMisi]?.judul || 'Misi ' + currentMisi} 🎉`);

  loadProgressMisi();
  closeMisiDetail();
}

// ==========================================
// INTEGRASI GOOGLE FORM PREFILLED (FIXED DROPDOWN TIM & ALL FIELDS)
// ==========================================
function loadGoogleForm() {
  const timRaw = sessionStorage.getItem('siswa_tim') || '';
  const tim = formatTimToTitleCase(timRaw); // Mengubah format menjadi "Tim 1" agar pas dengan Dropdown

  const nama1 = sessionStorage.getItem('siswa_nama1') || '';
  const nama2 = sessionStorage.getItem('siswa_nama2') || '';
  const nama3 = sessionStorage.getItem('siswa_nama3') || '';
  const nama4 = sessionStorage.getItem('siswa_nama4') || '';
  const nama5 = sessionStorage.getItem('siswa_nama5') || '';
  const kelas = sessionStorage.getItem('siswa_kelas') || '';
  const tgl = sessionStorage.getItem('siswa_tgl') || '';
  const namaMisi = `Misi ${currentMisi}`;

  const params = new URLSearchParams({
    'embedded': 'true',
    'entry.2067976853': tim,        // ID Dropdown Tim ("Tim 1")
    'entry.643801065': nama1,       // Nama 1
    'entry.736170731': nama2,       // Nama 2
    'entry.659497245': nama3,       // Nama 3
    'entry.862341159': nama4,       // Nama 4
    'entry.1500857900': nama5,      // Nama 5
    'entry.1986450964': kelas,      // Kelas
    'entry.518299779': tgl,        // Tanggal
    'entry.777073408': namaMisi    // Nama Misi
  });

  const prefilledUrl = `${GOOGLE_FORM_BASE_URL}?${params.toString()}`;

  const iframe = document.getElementById('googleFormIframe');
  if (iframe) iframe.src = prefilledUrl;
}

function loadRefleksiForm() {
  const iframe = document.getElementById('refleksiFormIframe');
  if (iframe) {
    // If the URL has no query string, we should use '?'
    iframe.src = GOOGLE_FORM_REFLEKSI_URL + "?embedded=true";
  }
}

// ==========================================
// MATERI CARD TOGGLE
// ==========================================
function toggleMateriCard(card) {
  card.classList.toggle('expanded');
  const toggleText = card.querySelector('.materi-toggle');
  if (card.classList.contains('expanded')) {
    toggleText.innerText = 'Tutup ↑';
  } else {
    toggleText.innerText = 'Baca Selengkapnya ↓';
  }
}

// ==========================================
// GURU DASHBOARD & DATA PROCESSING
// ==========================================

// Parser CSV handal dengan dukungan tanda kutip & koma dalam cell
function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const entries = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        entries.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    entries.push(current.trim());
    return entries;
  };

  const parsed = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length >= 2) {
      parsed.push(cols);
    }
  }
  return parsed;
}

async function muatDataGuru() {
  const tbody = document.getElementById('tbodyGuru');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Memuat data dari Google Sheets...</td></tr>';

  try {
    const cacheBuster = "&_t=" + new Date().getTime();
    const response = await fetch(URL_SPREADSHEET_CSV + cacheBuster);
    const dataCsv = await response.text();

    const rawRows = parseCsvRows(dataCsv);
    const dataParsed = [];

    rawRows.forEach((cols, idx) => {
      // Struktur kolom:
      // [0] Timestamp, [1] TIM, [2-6] Nama 1-5, [7] Kelas, [8] Tanggal Kegiatan,
      // [9] Nama Aktivitas, [10] Hasil / Jumlah Repetisi,
      // [11] Form Penilaian Persiapan, [12] Pelaksanaan, [13] Kontrol, [14] Penyelesaian
      
      const tim = cols[1] || 'Tim -';
      
      // Kumpulkan nama anggota
      const namaList = [cols[2], cols[3], cols[4], cols[5], cols[6]]
        .map(n => (n || '').trim())
        .filter(n => n && n !== '-');
      const namaDisplay = namaList.length > 0 ? namaList.join(', ') : (cols[2] || '-');

      const kelas = cols[7] || '-';
      const tgl = cols[8] || (cols[0] ? cols[0].split(' ')[0] : '-');
      const aktivitas = cols[9] || '-';
      const hasilRaw = cols[10] || '0';

      const pPersiapan = cols[11] || '-';
      const pPelaksanaan = cols[12] || '-';
      const pKontrol = cols[13] || '-';
      const pPenyelesaian = cols[14] || '-';

      const item = {
        id: idx + 1,
        timestamp: cols[0] || '',
        tim: tim,
        nama: namaDisplay,
        namaList: namaList,
        kelas: kelas,
        tgl: tgl,
        misi: aktivitas,
        hasil: hasilRaw,
        hasilNum: parseFloat(hasilRaw) || 0,
        penilaian: {
          persiapan: pPersiapan,
          pelaksanaan: pPelaksanaan,
          kontrol: pKontrol,
          penyelesaian: pPenyelesaian
        }
      };

      dataParsed.push(item);
    });

    guruDataCache = dataParsed;
    filteredGuruData = [...dataParsed];
    guruCurrentPage = 1;

    populateGuruFilterDropdowns(dataParsed);
    updateGuruStats(dataParsed);

    renderTabelGuruPaginasi();
    updateGuruChart();

  } catch (err) {
    console.error("Gagal mengambil data:", err);
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--danger);">Gagal memuat data dari Google Sheets. Pastikan koneksi aktif dan spreadsheet dipublikasikan.</td></tr>';
  }
}

// ==========================================
// GURU: STAT CARDS
// ==========================================
function updateGuruStats(data) {
  // Hitung jumlah tim unik atau siswa
  const uniqueTim = [...new Set(data.map(d => d.tim).filter(t => t && t !== '-'))];
  const allNama = [];
  data.forEach(d => {
    if (d.namaList && d.namaList.length > 0) {
      allNama.push(...d.namaList);
    } else if (d.nama && d.nama !== '-') {
      allNama.push(d.nama);
    }
  });
  const uniqueSiswa = [...new Set(allNama)];

  const statTotalSiswa = document.getElementById('statTotalSiswa');
  if (statTotalSiswa) {
    statTotalSiswa.innerText = uniqueSiswa.length > 0 ? uniqueSiswa.length : uniqueTim.length;
  }

  const statTotalSubmit = document.getElementById('statTotalSubmit');
  if (statTotalSubmit) statTotalSubmit.innerText = data.length;

  const validNumbers = data.map(d => parseFloat(d.hasil)).filter(v => !isNaN(v));
  const avg = validNumbers.length > 0 ? Math.round(validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length) : 0;
  const statAvgHasil = document.getElementById('statAvgHasil');
  if (statAvgHasil) statAvgHasil.innerText = avg;

  // Hitung tim dengan rata-rata/total hasil terbaik
  const totalPerTim = {};
  data.forEach(d => {
    const val = parseFloat(d.hasil) || 0;
    const key = d.tim || d.nama;
    totalPerTim[key] = (totalPerTim[key] || 0) + val;
  });
  let topNama = '-';
  let topVal = 0;
  for (const [key, total] of Object.entries(totalPerTim)) {
    if (total > topVal) { topVal = total; topNama = key; }
  }
  const statTopSiswa = document.getElementById('statTopSiswa');
  if (statTopSiswa) statTopSiswa.innerText = topNama;
}

// ==========================================
// GURU: POPULATE FILTER DROPDOWNS
// ==========================================
function populateGuruFilterDropdowns(data) {
  // 1. Filter Tim
  const selTim = document.getElementById('filterColTim');
  if (selTim) {
    const currentVal = selTim.value;
    const uniqueTim = [...new Set(data.map(d => d.tim))].filter(t => t && t !== '-').sort();
    selTim.innerHTML = '<option value="">Semua</option>';
    uniqueTim.forEach(tim => {
      const opt = document.createElement('option');
      opt.value = tim;
      opt.textContent = tim;
      selTim.appendChild(opt);
    });
    selTim.value = currentVal;
  }

  // 2. Filter Kelas
  const selKelas = document.getElementById('filterColKelas');
  if (selKelas) {
    const currentVal = selKelas.value;
    const uniqueKelas = [...new Set(data.map(d => d.kelas))].filter(k => k && k !== '-').sort();
    selKelas.innerHTML = '<option value="">Semua</option>';
    uniqueKelas.forEach(kelas => {
      const opt = document.createElement('option');
      opt.value = kelas;
      opt.textContent = kelas;
      selKelas.appendChild(opt);
    });
    selKelas.value = currentVal;
  }

  // 3. Filter Misi / Aktivitas
  const selMisi = document.getElementById('filterColMisi');
  if (selMisi) {
    const currentVal = selMisi.value;
    const uniqueMisi = [...new Set(data.map(d => d.misi))].filter(m => m && m !== '-').sort();
    selMisi.innerHTML = '<option value="">Semua Aktivitas</option>';
    uniqueMisi.forEach(misi => {
      const opt = document.createElement('option');
      opt.value = misi;
      opt.textContent = misi;
      selMisi.appendChild(opt);
    });
    selMisi.value = currentVal;
  }
}

// Helper badge status penilaian kriteria
function createPenilaianBadge(status) {
  if (!status || status === '-') return '<span class="eval-pill eval-neutral">-</span>';
  const clean = status.trim().toLowerCase();
  if (clean.includes('sangat sesuai')) {
    return `<span class="eval-pill eval-sangat-sesuai" title="${status}">⭐ S.Sesuai</span>`;
  }
  if (clean.includes('cukup sesuai')) {
    return `<span class="eval-pill eval-cukup-sesuai" title="${status}">🟡 Cukup</span>`;
  }
  if (clean.includes('kurang sesuai')) {
    return `<span class="eval-pill eval-kurang-sesuai" title="${status}">🟠 Kurang</span>`;
  }
  if (clean.includes('tidak sesuai')) {
    return `<span class="eval-pill eval-tidak-sesuai" title="${status}">🔴 Tdk Sesuai</span>`;
  }
  if (clean.includes('sesuai')) {
    return `<span class="eval-pill eval-sesuai" title="${status}">🟢 Sesuai</span>`;
  }
  return `<span class="eval-pill eval-neutral" title="${status}">${status}</span>`;
}

// ==========================================
// GURU: TABLE RENDERING & PAGINATION
// ==========================================
function renderTabelGuruPaginasi() {
  const tbody = document.getElementById('tbodyGuru');
  if (!tbody) return;
  tbody.innerHTML = '';

  const totalData = filteredGuruData.length;
  updateTableCount(totalData);

  if (totalData === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">Tidak ada data yang cocok dengan pencarian atau filter.</td></tr>';
    updatePaginationControls(0, 0, 0, 0);
    return;
  }

  const totalPages = Math.ceil(totalData / GURU_ROWS_PER_PAGE);
  if (guruCurrentPage > totalPages) guruCurrentPage = totalPages;
  if (guruCurrentPage < 1) guruCurrentPage = 1;

  const startIndex = (guruCurrentPage - 1) * GURU_ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + GURU_ROWS_PER_PAGE, totalData);
  const pageData = filteredGuruData.slice(startIndex, endIndex);

  pageData.forEach(row => {
    const tr = document.createElement('tr');
    
    // Format daftar nama siswa dengan styling chip atau koma rapi
    let namaAnggotaHtml = '';
    if (row.namaList && row.namaList.length > 0) {
      namaAnggotaHtml = row.namaList.map(n => `<span class="nama-chip">${n}</span>`).join(' ');
    } else {
      namaAnggotaHtml = `<span class="nama-chip">${row.nama}</span>`;
    }

    // Render tag aspek kriteria dalam format rapi
    const p = row.penilaian || {};
    const evalHtml = `
      <div class="eval-grid-compact">
        <div class="eval-item"><span class="eval-label">Persiapan</span>${createPenilaianBadge(p.persiapan)}</div>
        <div class="eval-item"><span class="eval-label">Pelaksanaan</span>${createPenilaianBadge(p.pelaksanaan)}</div>
        <div class="eval-item"><span class="eval-label">Kontrol</span>${createPenilaianBadge(p.kontrol)}</div>
        <div class="eval-item"><span class="eval-label">Selesai</span>${createPenilaianBadge(p.penyelesaian)}</div>
      </div>
    `;

    tr.innerHTML = `
      <td><span class="tgl-badge">${row.tgl}</span></td>
      <td style="text-align:center;"><span class="tim-badge">${row.tim}</span></td>
      <td><div class="nama-siswa-wrapper">${namaAnggotaHtml}</div></td>
      <td><span class="kelas-badge">${row.kelas}</span></td>
      <td><span class="misi-badge-cell">${row.misi}</span></td>
      <td style="text-align:center;"><strong class="skor-badge">${row.hasil}</strong></td>
      <td>${evalHtml}</td>
    `;
    tbody.appendChild(tr);
  });

  updatePaginationControls(startIndex + 1, endIndex, totalData, totalPages);
}

function updatePaginationControls(start, end, total, totalPages) {
  const info = document.getElementById('paginationInfo');
  const pageNum = document.getElementById('paginationPageNum');
  const btnPrev = document.getElementById('btnPrevPage');
  const btnNext = document.getElementById('btnNextPage');

  if (info) info.innerText = `Menampilkan ${total === 0 ? 0 : start} - ${end} dari ${total} data`;
  if (pageNum) pageNum.innerText = `Halaman ${guruCurrentPage} / ${totalPages || 1}`;

  if (btnPrev) btnPrev.disabled = (guruCurrentPage <= 1);
  if (btnNext) btnNext.disabled = (guruCurrentPage >= totalPages || totalPages === 0);
}

function changeGuruPage(direction) {
  guruCurrentPage += direction;
  renderTabelGuruPaginasi();
}

// ==========================================
// GURU: SEARCH & COLUMN FILTERING
// ==========================================
function filterGuruTable() {
  const globalSearch = (document.getElementById('guruGlobalSearch')?.value || '').trim().toLowerCase();
  const btnClear = document.getElementById('btnClearSearch');
  if (btnClear) {
    btnClear.style.display = globalSearch ? 'flex' : 'none';
  }

  const filterTgl = (document.getElementById('filterColTgl')?.value || '').trim().toLowerCase();
  const filterTim = document.getElementById('filterColTim')?.value || '';
  const filterNama = (document.getElementById('filterColNama')?.value || '').trim().toLowerCase();
  const filterKelas = document.getElementById('filterColKelas')?.value || '';
  const filterMisi = document.getElementById('filterColMisi')?.value || '';
  const filterHasil = (document.getElementById('filterColHasil')?.value || '').trim().toLowerCase();
  const filterPenilaian = document.getElementById('filterColPenilaian')?.value || '';

  filteredGuruData = guruDataCache.filter(item => {
    // 1. Cek Global Search (mencari ke semua field relevan)
    if (globalSearch) {
      const p = item.penilaian || {};
      const evalText = `${p.persiapan} ${p.pelaksanaan} ${p.kontrol} ${p.penyelesaian}`.toLowerCase();
      const combined = `${item.tim} ${item.nama} ${item.kelas} ${item.misi} ${item.hasil} ${item.tgl} ${evalText}`.toLowerCase();
      if (!combined.includes(globalSearch)) {
        return false;
      }
    }

    // 2. Filter Per Kolom
    const matchTgl = !filterTgl || item.tgl.toLowerCase().includes(filterTgl);
    const matchTim = !filterTim || item.tim === filterTim;
    const matchNama = !filterNama || item.nama.toLowerCase().includes(filterNama);
    const matchKelas = !filterKelas || item.kelas === filterKelas;
    const matchMisi = !filterMisi || item.misi === filterMisi;
    const matchHasil = !filterHasil || item.hasil.toLowerCase().includes(filterHasil);

    let matchPenilaian = true;
    if (filterPenilaian) {
      const p = item.penilaian || {};
      const target = filterPenilaian.toLowerCase();
      matchPenilaian = [p.persiapan, p.pelaksanaan, p.kontrol, p.penyelesaian]
        .some(val => (val || '').toLowerCase().includes(target));
    }

    return matchTgl && matchTim && matchNama && matchKelas && matchMisi && matchHasil && matchPenilaian;
  });

  guruCurrentPage = 1;
  renderTabelGuruPaginasi();
}

function clearGuruSearch() {
  const input = document.getElementById('guruGlobalSearch');
  if (input) {
    input.value = '';
    filterGuruTable();
  }
}

function resetSemuaFilterGuru() {
  const global = document.getElementById('guruGlobalSearch');
  if (global) global.value = '';
  const fTgl = document.getElementById('filterColTgl');
  if (fTgl) fTgl.value = '';
  const fTim = document.getElementById('filterColTim');
  if (fTim) fTim.value = '';
  const fNama = document.getElementById('filterColNama');
  if (fNama) fNama.value = '';
  const fKelas = document.getElementById('filterColKelas');
  if (fKelas) fKelas.value = '';
  const fMisi = document.getElementById('filterColMisi');
  if (fMisi) fMisi.value = '';
  const fHasil = document.getElementById('filterColHasil');
  if (fHasil) fHasil.value = '';
  const fPenilaian = document.getElementById('filterColPenilaian');
  if (fPenilaian) fPenilaian.value = '';

  const btnClear = document.getElementById('btnClearSearch');
  if (btnClear) btnClear.style.display = 'none';

  filteredGuruData = [...guruDataCache];
  guruCurrentPage = 1;
  renderTabelGuruPaginasi();
}

function updateTableCount(count) {
  const badge = document.getElementById('tableCountBadge');
  if (badge) badge.innerText = `${count} data`;
}

// ==========================================
// GURU: CHART RENDERING
// ==========================================
const CHART_PALETTE = [
  'rgba(30, 64, 175, 0.85)',   // Deep Blue
  'rgba(14, 165, 233, 0.85)',  // Cyan / Sky
  'rgba(16, 185, 129, 0.85)',  // Emerald Green
  'rgba(245, 158, 11, 0.85)',  // Amber
  'rgba(239, 68, 68, 0.85)',   // Coral Red
  'rgba(139, 92, 246, 0.85)',  // Violet Purple
  'rgba(236, 72, 153, 0.85)',  // Pink
  'rgba(20, 184, 166, 0.85)',  // Teal
  'rgba(100, 116, 139, 0.85)'  // Slate
];

const CHART_PALETTE_BORDER = [
  'rgb(30, 64, 175)',
  'rgb(14, 165, 233)',
  'rgb(16, 185, 129)',
  'rgb(245, 158, 11)',
  'rgb(239, 68, 68)',
  'rgb(139, 92, 246)',
  'rgb(236, 72, 153)',
  'rgb(20, 184, 166)',
  'rgb(100, 116, 139)'
];

function updateGuruChart() {
  const chartType = document.getElementById('selectChartType')?.value || 'bar';
  const category = document.getElementById('selectChartCategory')?.value || 'tim';
  const groupSubKriteria = document.getElementById('groupSubKriteria');
  const subKriteria = document.getElementById('selectSubKriteria')?.value || 'all';

  // Tampilkan subkriteria jika kategori adalah form penilaian
  if (groupSubKriteria) {
    groupSubKriteria.style.display = (category === 'penilaian') ? 'flex' : 'none';
  }

  const { labels, datasets } = buildChartDatasets(guruDataCache, category, chartType, subKriteria);
  renderChartGuru(chartType, labels, datasets);
}

function buildChartDatasets(data, category, chartType, subKriteria) {
  const isRadialType = ['pie', 'doughnut'].includes(chartType);

  // 1. KATEGORI: PROGRESS TIM (Jumlah Submisi & Rata-rata Skor per Tim)
  if (category === 'tim') {
    const timMap = {};
    data.forEach(item => {
      const key = item.tim || 'Tim -';
      if (!timMap[key]) {
        timMap[key] = { count: 0, totalSkor: 0, validSkorCount: 0 };
      }
      timMap[key].count += 1;
      const num = parseFloat(item.hasil);
      if (!isNaN(num)) {
        timMap[key].totalSkor += num;
        timMap[key].validSkorCount += 1;
      }
    });

    const labels = Object.keys(timMap).sort();
    const countData = labels.map(l => timMap[l].count);
    const avgData = labels.map(l => timMap[l].validSkorCount > 0 ? Math.round(timMap[l].totalSkor / timMap[l].validSkorCount) : 0);

    if (isRadialType) {
      // Untuk Pie/Doughnut gunakan jumlah aktivitas terselesaikan
      return {
        labels: labels,
        datasets: [{
          label: 'Total Aktivitas Diselesaikan',
          data: countData,
          backgroundColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderColor: labels.map((_, i) => CHART_PALETTE_BORDER[i % CHART_PALETTE_BORDER.length]),
          borderWidth: 1.5
        }]
      };
    }

    // Untuk Bar / Line, sediakan 2 dataset interaktif: Aktivitas diselesaikan & Rata-rata skor
    return {
      labels: labels,
      datasets: [
        {
          label: 'Aktivitas Diselesaikan',
          data: countData,
          backgroundColor: 'rgba(30, 64, 175, 0.8)',
          borderColor: 'rgb(30, 64, 175)',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Rata-Rata Repetisi / Skor',
          data: avgData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y'
        }
      ]
    };
  }

  // 2. KATEGORI: PER KELAS (Progress partisipasi & rata-rata skor per kelas)
  if (category === 'kelas') {
    const kelasMap = {};
    data.forEach(item => {
      const key = item.kelas || 'Tanpa Kelas';
      if (!kelasMap[key]) {
        kelasMap[key] = { count: 0, totalSkor: 0, validSkorCount: 0 };
      }
      kelasMap[key].count += 1;
      const num = parseFloat(item.hasil);
      if (!isNaN(num)) {
        kelasMap[key].totalSkor += num;
        kelasMap[key].validSkorCount += 1;
      }
    });

    const labels = Object.keys(kelasMap).sort();
    const countData = labels.map(l => kelasMap[l].count);
    const avgData = labels.map(l => kelasMap[l].validSkorCount > 0 ? Math.round(kelasMap[l].totalSkor / kelasMap[l].validSkorCount) : 0);

    if (isRadialType) {
      return {
        labels: labels,
        datasets: [{
          label: 'Jumlah Submisi Kelas',
          data: countData,
          backgroundColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderColor: labels.map((_, i) => CHART_PALETTE_BORDER[i % CHART_PALETTE_BORDER.length]),
          borderWidth: 1.5
        }]
      };
    }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Total Submisi',
          data: countData,
          backgroundColor: 'rgba(14, 165, 233, 0.8)',
          borderColor: 'rgb(14, 165, 233)',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: 'Rata-Rata Skor',
          data: avgData,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }

  // 3. KATEGORI: NAMA AKTIVITAS / MISI
  if (category === 'misi') {
    const misiMap = {};
    data.forEach(item => {
      const key = item.misi || 'Aktivitas Lain';
      if (!misiMap[key]) {
        misiMap[key] = { count: 0, totalSkor: 0, validSkorCount: 0 };
      }
      misiMap[key].count += 1;
      const num = parseFloat(item.hasil);
      if (!isNaN(num)) {
        misiMap[key].totalSkor += num;
        misiMap[key].validSkorCount += 1;
      }
    });

    const labels = Object.keys(misiMap).sort();
    const countData = labels.map(l => misiMap[l].count);
    const avgData = labels.map(l => misiMap[l].validSkorCount > 0 ? Math.round(misiMap[l].totalSkor / misiMap[l].validSkorCount) : 0);

    if (isRadialType) {
      return {
        labels: labels,
        datasets: [{
          label: 'Jumlah Penyelesaian Aktivitas',
          data: countData,
          backgroundColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
          borderColor: labels.map((_, i) => CHART_PALETTE_BORDER[i % CHART_PALETTE_BORDER.length]),
          borderWidth: 1.5
        }]
      };
    }

    return {
      labels: labels,
      datasets: [
        {
          label: 'Total Dilakukan (Kali)',
          data: countData,
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: 'Rata-Rata Capaian Repetisi',
          data: avgData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }

  // 4. KATEGORI: FORM PENILAIAN (Kesesuaian: Sesuai, Tidak Sesuai, Cukup Sesuai, dll)
  if (category === 'penilaian') {
    const statusCategories = ['Sangat Sesuai', 'Sesuai', 'Cukup Sesuai', 'Kurang Sesuai', 'Tidak Sesuai'];
    const countMap = {
      'Sangat Sesuai': 0,
      'Sesuai': 0,
      'Cukup Sesuai': 0,
      'Kurang Sesuai': 0,
      'Tidak Sesuai': 0
    };

    const statusColors = [
      'rgba(16, 185, 129, 0.85)', // Sangat Sesuai (Green)
      'rgba(59, 130, 246, 0.85)',  // Sesuai (Blue)
      'rgba(245, 158, 11, 0.85)',  // Cukup Sesuai (Amber)
      'rgba(249, 115, 22, 0.85)',  // Kurang Sesuai (Orange)
      'rgba(239, 68, 68, 0.85)'    // Tidak Sesuai (Red)
    ];
    const statusBorders = [
      'rgb(16, 185, 129)',
      'rgb(59, 130, 246)',
      'rgb(245, 158, 11)',
      'rgb(249, 115, 22)',
      'rgb(239, 68, 68)'
    ];

    data.forEach(item => {
      const p = item.penilaian || {};
      let valuesToCount = [];

      if (subKriteria === 'all') {
        valuesToCount = [p.persiapan, p.pelaksanaan, p.kontrol, p.penyelesaian];
      } else if (subKriteria === 'persiapan') {
        valuesToCount = [p.persiapan];
      } else if (subKriteria === 'pelaksanaan') {
        valuesToCount = [p.pelaksanaan];
      } else if (subKriteria === 'kontrol') {
        valuesToCount = [p.kontrol];
      } else if (subKriteria === 'penyelesaian') {
        valuesToCount = [p.penyelesaian];
      }

      valuesToCount.forEach(val => {
        if (!val || val === '-') return;
        const normalized = val.trim();
        for (const cat of statusCategories) {
          if (normalized.toLowerCase() === cat.toLowerCase()) {
            countMap[cat] += 1;
            return;
          }
        }
        // Fallback jika ada kata 'tidak sesuai', 'kurang sesuai', dll
        const lower = normalized.toLowerCase();
        if (lower.includes('sangat sesuai')) countMap['Sangat Sesuai'] += 1;
        else if (lower.includes('cukup sesuai')) countMap['Cukup Sesuai'] += 1;
        else if (lower.includes('kurang sesuai')) countMap['Kurang Sesuai'] += 1;
        else if (lower.includes('tidak sesuai')) countMap['Tidak Sesuai'] += 1;
        else if (lower.includes('sesuai')) countMap['Sesuai'] += 1;
      });
    });

    const labels = statusCategories;
    const values = statusCategories.map(cat => countMap[cat]);

    return {
      labels: labels,
      datasets: [{
        label: subKriteria === 'all' ? 'Frekuensi Penilaian (Seluruh Aspek)' : `Penilaian: Aspek ${subKriteria.toUpperCase()}`,
        data: values,
        backgroundColor: statusColors,
        borderColor: statusBorders,
        borderWidth: 1.5,
        borderRadius: 6
      }]
    };
  }

  return { labels: [], datasets: [] };
}

function renderChartGuru(chartType, labels, datasets) {
  const canvas = document.getElementById('chartGuru');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (chartGuruInstance) {
    chartGuruInstance.destroy();
  }

  const isRadialType = ['pie', 'doughnut'].includes(chartType);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: isRadialType ? 'bottom' : 'top',
        labels: {
          font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600', size: 12 },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: '700' },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  if (!isRadialType) {
    options.scales = {
      y: {
        beginAtZero: true,
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } },
        grid: { color: 'rgba(226, 232, 240, 0.8)' }
      },
      x: {
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' } },
        grid: { display: false }
      }
    };
  }

  chartGuruInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: datasets
    },
    options: options
  });
}
// ==========================================
// GURU: SWITCH TABEL FORM SISWA VS REFLEKSI
// ==========================================
function switchTabelGuru(tipe) {
  currentGuruTableTab = tipe;
  const btnSiswa = document.getElementById('btnSwitchFormSiswa');
  const btnRefleksi = document.getElementById('btnSwitchRefleksi');
  const secSiswa = document.getElementById('sectionTabelSiswa');
  const secRefleksi = document.getElementById('sectionTabelRefleksi');

  if (tipe === 'siswa') {
    if (btnSiswa) btnSiswa.classList.add('active');
    if (btnRefleksi) btnRefleksi.classList.remove('active');
    if (secSiswa) secSiswa.style.display = 'block';
    if (secRefleksi) secRefleksi.style.display = 'none';
  } else {
    if (btnSiswa) btnSiswa.classList.remove('active');
    if (btnRefleksi) btnRefleksi.classList.add('active');
    if (secSiswa) secSiswa.style.display = 'none';
    if (secRefleksi) secRefleksi.style.display = 'block';

    if (refleksiDataCache.length === 0) {
      muatDataRefleksi();
    }
  }
}

function muatSemuaDataGuru() {
  muatDataGuru();
  muatDataRefleksi();
}

// ==========================================
// GURU: REFLEKSI DATA PROCESSING & TABLE
// ==========================================
async function muatDataRefleksi() {
  const tbody = document.getElementById('tbodyRefleksi');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data refleksi dari Google Sheets...</td></tr>';

  try {
    const cacheBuster = "&_t=" + new Date().getTime();
    const response = await fetch(URL_SPREADSHEET_REFLEKSI_CSV + cacheBuster);
    const dataCsv = await response.text();

    const rawRows = parseCsvRows(dataCsv);
    if (rawRows.length === 0) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada respon refleksi ditemukan.</td></tr>';
      return;
    }

    // Ambil header pertanyaan dari baris pertama (index 0) jika ada
    const lines = dataCsv.split(/\r?\n/).filter(line => line.trim().length > 0);
    const headerCols = lines.length > 0 ? (lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"(.*)"$/, '$1').trim())) : [];

    const dataParsed = [];

    rawRows.forEach((cols, idx) => {
      // cols[0]: Timestamp, cols[1]: Nama, cols[2]: Kelas, cols[3..]: Pertanyaan refleksi
      const waktu = cols[0] || '-';
      const nama = cols[1] || '-';
      const kelas = cols[2] || '-';
      
      // Ambil kesan/perasaan utama (pertanyaan 3 & 4: Bagaimana perasaan & Bagian apa yang dirasakan)
      const perasaan = cols[3] || '';
      const bagianFisik = cols[4] || '';
      let kesanRingkas = '';
      if (perasaan && bagianFisik) {
        kesanRingkas = `${perasaan} • ${bagianFisik}`;
      } else {
        kesanRingkas = perasaan || bagianFisik || '-';
      }

      // Kumpulkan semua Q&A untuk modal detail
      const detailQnA = [];
      for (let i = 3; i < cols.length; i++) {
        const tanya = headerCols[i] || `Pertanyaan ${i - 2}`;
        const jawab = cols[i] || '-';
        if (jawab && jawab !== '-') {
          detailQnA.push({
            pertanyaan: tanya,
            jawaban: jawab
          });
        }
      }

      dataParsed.push({
        id: idx,
        waktu: waktu,
        nama: nama,
        kelas: kelas,
        kesan: kesanRingkas,
        detailQnA: detailQnA,
        rawRow: cols
      });
    });

    refleksiDataCache = dataParsed;
    filteredRefleksiData = [...dataParsed];
    refleksiCurrentPage = 1;

    populateRefleksiFilterDropdowns(dataParsed);
    renderTabelRefleksiPaginasi();

  } catch (err) {
    console.error("Gagal mengambil data refleksi:", err);
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger);">Gagal memuat respon refleksi dari Google Sheets.</td></tr>';
  }
}

function populateRefleksiFilterDropdowns(data) {
  const selKelas = document.getElementById('filterRefleksiKelas');
  if (selKelas) {
    const currentVal = selKelas.value;
    const uniqueKelas = [...new Set(data.map(d => d.kelas))].filter(k => k && k !== '-').sort();
    selKelas.innerHTML = '<option value="">Semua Kelas</option>';
    uniqueKelas.forEach(kelas => {
      const opt = document.createElement('option');
      opt.value = kelas;
      opt.textContent = kelas;
      selKelas.appendChild(opt);
    });
    selKelas.value = currentVal;
  }
}

function renderTabelRefleksiPaginasi() {
  const tbody = document.getElementById('tbodyRefleksi');
  if (!tbody) return;
  tbody.innerHTML = '';

  const totalData = filteredRefleksiData.length;
  updateRefleksiCount(totalData);

  if (totalData === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 2rem;">Tidak ada data refleksi yang cocok.</td></tr>';
    updateRefleksiPaginationControls(0, 0, 0, 0);
    return;
  }

  const totalPages = Math.ceil(totalData / REFLEKSI_ROWS_PER_PAGE);
  if (refleksiCurrentPage > totalPages) refleksiCurrentPage = totalPages;
  if (refleksiCurrentPage < 1) refleksiCurrentPage = 1;

  const startIndex = (refleksiCurrentPage - 1) * REFLEKSI_ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + REFLEKSI_ROWS_PER_PAGE, totalData);
  const pageData = filteredRefleksiData.slice(startIndex, endIndex);

  pageData.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="tgl-badge">${item.waktu}</span></td>
      <td><strong>${item.nama}</strong></td>
      <td><span class="kelas-badge">${item.kelas}</span></td>
      <td style="text-align:center;">
        <button class="btn btn-sm btn-detail-refleksi" onclick="bukaModalRefleksi(${item.id})">
          <span class="material-symbols-rounded">visibility</span> Lihat Refleksi
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateRefleksiPaginationControls(startIndex + 1, endIndex, totalData, totalPages);
}

function updateRefleksiPaginationControls(start, end, total, totalPages) {
  const info = document.getElementById('refleksiPaginationInfo');
  const pageNum = document.getElementById('refleksiPageNum');
  const btnPrev = document.getElementById('btnPrevRefleksi');
  const btnNext = document.getElementById('btnNextRefleksi');

  if (info) info.innerText = `Menampilkan ${total === 0 ? 0 : start} - ${end} dari ${total} data`;
  if (pageNum) pageNum.innerText = `Halaman ${refleksiCurrentPage} / ${totalPages || 1}`;

  if (btnPrev) btnPrev.disabled = (refleksiCurrentPage <= 1);
  if (btnNext) btnNext.disabled = (refleksiCurrentPage >= totalPages || totalPages === 0);
}

function changeRefleksiPage(direction) {
  refleksiCurrentPage += direction;
  renderTabelRefleksiPaginasi();
}

function filterRefleksiTable() {
  const global = (document.getElementById('refleksiGlobalSearch')?.value || '').trim().toLowerCase();
  const btnClear = document.getElementById('btnClearSearchRefleksi');
  if (btnClear) btnClear.style.display = global ? 'flex' : 'none';

  const fTgl = (document.getElementById('filterRefleksiTgl')?.value || '').trim().toLowerCase();
  const fNama = (document.getElementById('filterRefleksiNama')?.value || '').trim().toLowerCase();
  const fKelas = document.getElementById('filterRefleksiKelas')?.value || '';

  filteredRefleksiData = refleksiDataCache.filter(item => {
    // 1. Global Search
    if (global) {
      const allText = `${item.waktu} ${item.nama} ${item.kelas} ${item.detailQnA.map(q => q.pertanyaan + ' ' + q.jawaban).join(' ')}`.toLowerCase();
      if (!allText.includes(global)) return false;
    }

    // 2. Filter Per Kolom
    const matchTgl = !fTgl || item.waktu.toLowerCase().includes(fTgl);
    const matchNama = !fNama || item.nama.toLowerCase().includes(fNama);
    const matchKelas = !fKelas || item.kelas === fKelas;

    return matchTgl && matchNama && matchKelas;
  });

  refleksiCurrentPage = 1;
  renderTabelRefleksiPaginasi();
}

function clearRefleksiSearch() {
  const input = document.getElementById('refleksiGlobalSearch');
  if (input) {
    input.value = '';
    filterRefleksiTable();
  }
}

function resetFilterRefleksi() {
  const global = document.getElementById('refleksiGlobalSearch');
  if (global) global.value = '';
  const fTgl = document.getElementById('filterRefleksiTgl');
  if (fTgl) fTgl.value = '';
  const fNama = document.getElementById('filterRefleksiNama');
  if (fNama) fNama.value = '';
  const fKelas = document.getElementById('filterRefleksiKelas');
  if (fKelas) fKelas.value = '';

  const btnClear = document.getElementById('btnClearSearchRefleksi');
  if (btnClear) btnClear.style.display = 'none';

  filteredRefleksiData = [...refleksiDataCache];
  refleksiCurrentPage = 1;
  renderTabelRefleksiPaginasi();
}

function updateRefleksiCount(count) {
  const badge = document.getElementById('refleksiCountBadge');
  if (badge) badge.innerText = `${count} data`;
}

// ==========================================
// GURU: MODAL DETAIL REFLEKSI
// ==========================================
function bukaModalRefleksi(itemId) {
  const item = refleksiDataCache.find(d => d.id === itemId);
  if (!item) return;

  const modal = document.getElementById('modalDetailRefleksi');
  const avatar = document.getElementById('modalRefleksiAvatar');
  const namaEl = document.getElementById('modalRefleksiNama');
  const kelasEl = document.getElementById('modalRefleksiKelas');
  const waktuEl = document.getElementById('modalRefleksiWaktu');
  const contentEl = document.getElementById('modalRefleksiContent');

  if (avatar) avatar.innerText = (item.nama || 'S').slice(0, 2).toUpperCase();
  if (namaEl) namaEl.innerText = item.nama;
  if (kelasEl) kelasEl.innerText = item.kelas;
  if (waktuEl) waktuEl.innerText = item.waktu;

  if (contentEl) {
    contentEl.innerHTML = '';
    if (!item.detailQnA || item.detailQnA.length === 0) {
      contentEl.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Tidak ada rincian jawaban refleksi.</p>';
    } else {
      item.detailQnA.forEach((qna, idx) => {
        const card = document.createElement('div');
        card.className = 'qna-card';
        card.innerHTML = `
          <div class="qna-number">Pertanyaan #${idx + 1}</div>
          <div class="qna-question">${qna.pertanyaan}</div>
          <div class="qna-answer">${qna.jawaban}</div>
        `;
        contentEl.appendChild(card);
      });
    }
  }

  if (modal) modal.style.display = 'flex';
}

function tutupModalRefleksi() {
  const modal = document.getElementById('modalDetailRefleksi');
  if (modal) modal.style.display = 'none';
}

function batalLoginSiswa() {
  document.getElementById('modalIdentitas').style.display = 'none';
  kembaliKePilihanRole();
}
