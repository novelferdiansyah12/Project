// ==========================================
// CONFIG & CONSTANTS
// ==========================================
const PASSWORD_GURU_STATIS = "guru123";

// Link CSV Google Sheets tempat respon Google Form Anda tersimpan
const URL_SPREADSHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQA_bk8VdYN1b6yozIkIbP9lwonvasgUgrkEKGqfBQFXJUHWfiB_qz-UR_WZh0cImIrIVOzpZ5uiZx1/pub?gid=1664999173&single=true&output=csv";

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

// Variabel Paginasi Guru
let guruDataCache = [];
let filteredGuruData = [];
let guruCurrentPage = 1;
const GURU_ROWS_PER_PAGE = 10;

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
    if (sessionStorage.getItem('isGuruLoggedIn') === 'true') {
      aktifkanViewGuru();
    } else {
      document.getElementById('modalPasswordGuru').style.display = 'flex';
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
  if(document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if(document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  document.getElementById('btnBeranda').style.display = 'none';
}

function verifikasiGuru() {
  const pass = document.getElementById('inputPassGuru').value;
  if (pass === PASSWORD_GURU_STATIS) {
    sessionStorage.setItem('isGuruLoggedIn', 'true');
    document.getElementById('modalPasswordGuru').style.display = 'none';
    document.getElementById('inputPassGuru').value = '';
    aktifkanViewGuru();
  } else {
    alert("Password Salah! Akses khusus guru.");
    document.getElementById('inputPassGuru').value = '';
  }
}

function batalLoginGuru() {
  document.getElementById('modalPasswordGuru').style.display = 'none';
  kembaliKePilihanRole();
}

function aktifkanViewSiswa() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if(document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if(document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
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
  if(document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if(document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  document.getElementById('viewGuru').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'inline-flex';

  muatDataGuru();
}

function aktifkanViewRefleksi() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if(document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.remove('active');
  if(document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.add('active');
  document.getElementById('btnBeranda').style.display = 'inline-flex';
  
  loadRefleksiForm();
}

function aktifkanViewPanduan() {
  document.getElementById('viewPilihRole').classList.remove('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  if(document.getElementById('viewRefleksi')) document.getElementById('viewRefleksi').classList.remove('active');
  if(document.getElementById('viewPanduan')) document.getElementById('viewPanduan').classList.add('active');
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
  for(let i=1; i<=5; i++) {
    if(localStorage.getItem(`completed_misi_${i}_${tglAktivitas}`)) {
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
    if(document.getElementById('optJumping')) document.getElementById('optJumping').checked = true;
    pilihSubMisi('jumping_jack');
  } else if (misiNum === 2) {
    if (menuMisi2) menuMisi2.style.display = 'flex';
    if (infoMisi2) infoMisi2.style.display = 'flex';
    if(document.getElementById('optSquat')) document.getElementById('optSquat').checked = true;
    pilihSubMisi('squat');
  } else if (misiNum === 3) {
    if (menuMisi3) menuMisi3.style.display = 'flex';
    if (infoMisi3) infoMisi3.style.display = 'flex';
    if(document.getElementById('optPushUp')) document.getElementById('optPushUp').checked = true;
    pilihSubMisi('push_up');
  } else if (misiNum === 4) {
    if (menuMisi4) menuMisi4.style.display = 'flex';
    if (infoMisi4) infoMisi4.style.display = 'flex';
    if(document.getElementById('optAltLunge')) document.getElementById('optAltLunge').checked = true;
    pilihSubMisi('alt_lunge');
  } else if (misiNum === 5) {
    if (menuMisi5) menuMisi5.style.display = 'flex';
    if (infoMisi5) infoMisi5.style.display = 'flex';
    if(document.getElementById('optHighKnees')) document.getElementById('optHighKnees').checked = true;
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
// GURU DASHBOARD & CHART
// ==========================================
async function muatDataGuru() {
  const tbody = document.getElementById('tbodyGuru');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data dari Google Sheets...</td></tr>';

  try {
    const cacheBuster = "&_t=" + new Date().getTime();
    const response = await fetch(URL_SPREADSHEET_CSV + cacheBuster);
    const dataCsv = await response.text();

    const rows = dataCsv.split('\n').slice(1);
    const dataParsed = [];

    rows.forEach(row => {
      if (!row.trim()) return;

      const cols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"(.*)"$/, '$1').trim());

      if (cols.length >= 5) {
        const item = {
          tgl: cols[3] || (cols[0] ? cols[0].split(' ')[0] : '-'),
          nama: cols[1] || '-',
          kelas: cols[2] || '-',
          misi: cols[4] || '-',
          hasil: cols[5] || '0'
        };

        if (item.nama && item.nama !== '-') {
          dataParsed.push(item);
        }
      }
    });

    guruDataCache = dataParsed;
    filteredGuruData = [...dataParsed];
    guruCurrentPage = 1;

    populateKelasFilter(dataParsed);
    updateGuruStats(dataParsed);

    renderTabelGuruPaginasi();
    updateGuruChart();

  } catch (err) {
    console.error("Gagal mengambil data:", err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--danger);">Gagal memuat data dari Google Sheets. Silakan muat ulang halaman.</td></tr>';
  }
}

// ==========================================
// GURU: STAT CARDS
// ==========================================
function updateGuruStats(data) {
  const uniqueNama = [...new Set(data.map(d => d.nama))];
  const statTotalSiswa = document.getElementById('statTotalSiswa');
  if (statTotalSiswa) statTotalSiswa.innerText = uniqueNama.length;

  const statTotalSubmit = document.getElementById('statTotalSubmit');
  if (statTotalSubmit) statTotalSubmit.innerText = data.length;

  const results = data.map(d => parseFloat(d.hasil)).filter(v => !isNaN(v));
  const avg = results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0;
  const statAvgHasil = document.getElementById('statAvgHasil');
  if (statAvgHasil) statAvgHasil.innerText = avg;

  const totalPerSiswa = {};
  data.forEach(d => {
    const val = parseFloat(d.hasil) || 0;
    totalPerSiswa[d.nama] = (totalPerSiswa[d.nama] || 0) + val;
  });
  let topNama = '-';
  let topVal = 0;
  for (const [nama, total] of Object.entries(totalPerSiswa)) {
    if (total > topVal) { topVal = total; topNama = nama; }
  }
  const statTopSiswa = document.getElementById('statTopSiswa');
  if (statTopSiswa) statTopSiswa.innerText = topNama;
}

// ==========================================
// GURU: POPULATE KELAS FILTER
// ==========================================
function populateKelasFilter(data) {
  const select = document.getElementById('filterColKelas');
  if (!select) return;

  const uniqueKelas = [...new Set(data.map(d => d.kelas))].filter(k => k && k !== '-').sort();
  select.innerHTML = '<option value="">Semua Kelas</option>';
  uniqueKelas.forEach(kelas => {
    const opt = document.createElement('option');
    opt.value = kelas;
    opt.textContent = kelas;
    select.appendChild(opt);
  });
}

// ==========================================
// GURU: TABLE RENDERING & PAGINATION
// ==========================================
function renderTabelGuruPaginasi() {
  const tbody = document.getElementById('tbodyGuru');
  tbody.innerHTML = '';

  const totalData = filteredGuruData.length;
  updateTableCount(totalData);

  if (totalData === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data ditemukan.</td></tr>';
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
    tr.innerHTML = `
      <td>${row.tgl}</td>
      <td>${row.nama}</td>
      <td><span class="kelas-badge">${row.kelas}</span></td>
      <td><span class="misi-badge">${row.misi}</span></td>
      <td><strong>${row.hasil}</strong></td>
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

function filterGuruTable() {
  const filterTgl = (document.getElementById('filterColTgl')?.value || '').toLowerCase();
  const filterNama = (document.getElementById('filterColNama')?.value || '').toLowerCase();
  const filterKelas = document.getElementById('filterColKelas')?.value || '';
  const filterMisi = document.getElementById('filterColMisi')?.value || '';
  const filterHasil = (document.getElementById('filterColHasil')?.value || '').toLowerCase();

  filteredGuruData = guruDataCache.filter(item => {
    const matchTgl = !filterTgl || item.tgl.toLowerCase().includes(filterTgl);
    const matchNama = !filterNama || item.nama.toLowerCase().includes(filterNama);
    const matchKelas = !filterKelas || item.kelas === filterKelas;
    const matchMisi = !filterMisi || item.misi === filterMisi;
    const matchHasil = !filterHasil || item.hasil.toLowerCase().includes(filterHasil);

    return matchTgl && matchNama && matchKelas && matchMisi && matchHasil;
  });

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
const CHART_COLORS = [
  'rgba(26, 86, 219, 0.8)',
  'rgba(14, 165, 233, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(5, 150, 105, 0.8)',
  'rgba(217, 119, 6, 0.8)',
  'rgba(220, 38, 38, 0.8)',
  'rgba(147, 51, 234, 0.8)',
  'rgba(20, 184, 166, 0.8)'
];

const CHART_COLORS_BORDER = [
  'rgba(26, 86, 219, 1)',
  'rgba(14, 165, 233, 1)',
  'rgba(59, 130, 246, 1)',
  'rgba(5, 150, 105, 1)',
  'rgba(217, 119, 6, 1)',
  'rgba(220, 38, 38, 1)',
  'rgba(147, 51, 234, 1)',
  'rgba(20, 184, 166, 1)'
];

function updateGuruChart() {
  const chartType = document.getElementById('selectChartType')?.value || 'bar';
  const category = document.getElementById('selectChartCategory')?.value || 'misi';

  const { labels, values } = aggregateDataByCategory(guruDataCache, category);

  renderChartGuru(chartType, labels, values);
}

function aggregateDataByCategory(data, category) {
  const totals = {};
  const counts = {};

  data.forEach(item => {
    let key;
    if (category === 'misi') key = item.misi || 'Lainnya';
    else if (category === 'kelas') key = item.kelas || 'Lainnya';
    else if (category === 'tanggal') key = item.tgl || 'Lainnya';

    const val = parseFloat(item.hasil) || 0;
    totals[key] = (totals[key] || 0) + val;
    counts[key] = (counts[key] || 0) + 1;
  });

  const sortedKeys = Object.keys(totals).sort();
  const labels = sortedKeys;
  const values = sortedKeys.map(k => counts[k] > 0 ? Math.round(totals[k] / counts[k]) : 0);

  return { labels, values };
}

function renderChartGuru(chartType, labels, values) {
  const ctx = document.getElementById('chartGuru').getContext('2d');

  if (chartGuruInstance) {
    chartGuruInstance.destroy();
  }

  const isRadialType = ['pie', 'doughnut', 'polarArea'].includes(chartType);

  const bgColors = labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);
  const borderColors = labels.map((_, i) => CHART_COLORS_BORDER[i % CHART_COLORS_BORDER.length]);

  const datasetConfig = {
    label: 'Rata-Rata Hasil',
    data: values,
    backgroundColor: bgColors,
    borderColor: chartType === 'line' ? CHART_COLORS_BORDER[0] : borderColors,
    borderWidth: chartType === 'line' ? 3 : 1,
    borderRadius: chartType === 'bar' ? 8 : 0,
    borderSkipped: false,
    tension: 0.4,
    fill: chartType === 'line' ? { target: 'origin', above: 'rgba(26, 86, 219, 0.1)' } : false
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: isRadialType, position: 'bottom' }
    }
  };

  if (!isRadialType && chartType !== 'radar') {
    options.scales = {
      y: { beginAtZero: true },
      x: { grid: { display: false } }
    };
  }

  chartGuruInstance = new Chart(ctx, {
    type: chartType,
    data: { labels: labels, datasets: [datasetConfig] },
    options: options
  });
}
function batalLoginSiswa() {
  document.getElementById('modalIdentitas').style.display = 'none';
  kembaliKePilihanRole();
}
