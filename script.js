// ==========================================
// CONFIG & CONSTANTS
// ==========================================
const PASSWORD_GURU_STATIS = "guru123";

// Link CSV Google Sheets tempat respon Google Form Anda tersimpan
const URL_SPREADSHEET_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQA_bk8VdYN1b6yozIkIbP9lwonvasgUgrkEKGqfBQFXJUHWfiB_qz-UR_WZh0cImIrIVOzpZ5uiZx1/pub?gid=1664999173&single=true&output=csv";

// Base URL Google Form Misi milik Anda (pastikan akhiran URL menggunakan viewform?embedded=true)
const GOOGLE_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLSflFWuhozdxCSgQVbENEJmqyApXcTsaZeTZhyelwvhJleT77A/viewform?embedded=true";

// URL Google Form khusus RefleKSI (ganti link di bawah ini dengan link Google Form Refleksi Anda)
const GOOGLE_FORM_REFLEKSI_URL = "https://docs.google.com/forms/d/e/1FAIpQLSflFWuhozdxCSgQVbENEJmqyApXcTsaZeTZhyelwvhJleT77A/viewform?embedded=true";

// Data Misi
const DATA_MISI = {
  1: { judul: "Misi 1: Push Up", instruksi: "Lakukan Push Up selama 1 menit dan catat hasilnya.", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  2: { judul: "Misi 2: Sit Up", instruksi: "Lakukan Sit Up dengan posisi tangan di dada secara benar.", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  3: { judul: "Misi 3: Jumping Jack", instruksi: "Lakukan gerakan Jumping Jack konsisten 1 menit.", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  4: { judul: "Misi 4: Planking", instruksi: "Tahan posisi Plank sekuat mungkin dan catat detiknya.", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
};

let currentMisi = 1;
let chartGuruInstance = null;
let currentSiswaTab = 'dashboard';

// Variabel Paginasi Guru
let guruDataCache = [];
let filteredGuruData = [];
let guruCurrentPage = 1;
const GURU_ROWS_PER_PAGE = 10;

// ==========================================
// INITIALIZATION
// ==========================================
window.onload = function () {
  const inputTgl = document.getElementById('inputTanggal');
  if (inputTgl) inputTgl.valueAsDate = new Date();
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
  }
}

function kembaliKePilihanRole() {
  document.getElementById('viewPilihRole').classList.add('active');
  document.getElementById('viewSiswa').classList.remove('active');
  document.getElementById('viewGuru').classList.remove('active');
  document.getElementById('btnGantiRole').style.display = 'none';
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
  document.getElementById('viewSiswa').classList.add('active');
  document.getElementById('btnGantiRole').style.display = 'inline-flex';

  const nama = sessionStorage.getItem('siswa_nama');
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
  document.getElementById('viewGuru').classList.add('active');
  document.getElementById('btnGantiRole').style.display = 'inline-flex';

  muatDataGuru();
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
    'misi': 'tabMisi',
    'refleksi': 'tabRefleksi'
  };

  if (document.getElementById(tabMap[tabName])) {
    document.getElementById(tabMap[tabName]).classList.add('active');
  }

  document.querySelectorAll('.sidebar-btn:not(.sidebar-btn-danger)').forEach(btn => btn.classList.remove('active'));
  const sideNavMap = {
    'dashboard': 'sideNavDashboard',
    'materi': 'sideNavMateri',
    'misi': 'sideNavMisi',
    'refleksi': 'sideNavRefleksi'
  };
  const sideBtn = document.getElementById(sideNavMap[tabName]);
  if (sideBtn) sideBtn.classList.add('active');

  document.querySelectorAll('.mobile-tab').forEach(btn => btn.classList.remove('active'));
  const mobNavMap = {
    'dashboard': 'mobNavDashboard',
    'materi': 'mobNavMateri',
    'misi': 'mobNavMisi',
    'refleksi': 'mobNavRefleksi'
  };
  const mobBtn = document.getElementById(mobNavMap[tabName]);
  if (mobBtn) mobBtn.classList.add('active');

  if (tabName === 'refleksi') {
    loadRefleksiForm();
  }
}

// ==========================================
// SISWA FLOW & LOGIC
// ==========================================
function simpanIdentitasSiswa() {
  const nama = document.getElementById('inputNama').value;
  const kelas = document.getElementById('inputKelas').value;
  const absen = document.getElementById('inputAbsen').value;
  const tgl = document.getElementById('inputTanggal').value;

  if (!nama || !kelas) {
    alert("Mohon isi Nama dan Kelas terlebih dahulu!");
    return;
  }

  sessionStorage.setItem('siswa_nama', nama);
  sessionStorage.setItem('siswa_kelas', kelas);
  sessionStorage.setItem('siswa_absen', absen);
  sessionStorage.setItem('siswa_tgl', tgl);

  document.getElementById('modalIdentitas').style.display = 'none';
  updateSidebarProfile();
  updateDashboard();
  loadProgressMisi();
}

function updateSidebarProfile() {
  const nama = sessionStorage.getItem('siswa_nama') || 'Siswa';
  const kelas = sessionStorage.getItem('siswa_kelas') || '-';

  const sidebarProfile = document.getElementById('sidebarProfile');
  if (sidebarProfile) {
    sidebarProfile.style.display = 'flex';
    document.getElementById('sidebarNama').innerText = nama;
    document.getElementById('sidebarKelas').innerText = kelas;

    const initials = nama.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('profileAvatar').innerText = initials;
  }

  const dashNama = document.getElementById('dashboardNama');
  if (dashNama) dashNama.innerText = nama.split(' ')[0];

  const rankName = document.getElementById('rankMyName');
  if (rankName) rankName.innerText = nama;
}

function updateDashboard() {
  const tgl = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];
  const statTanggal = document.getElementById('statTanggal');
  if (statTanggal) statTanggal.innerText = tgl;

  updateProgressRing();
}

function updateProgressRing() {
  const unlocked = parseInt(localStorage.getItem('unlockedMisi') || '1');
  const completed = Math.max(0, unlocked - 1);
  const total = 4;
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
  const unlockedMisi = parseInt(localStorage.getItem('unlockedMisi') || '1');

  for (let i = 1; i <= 4; i++) {
    const card = document.getElementById(`misiCard${i}`);
    const status = document.getElementById(`misiStatus${i}`);

    if (card) {
      if (i < unlockedMisi) {
        card.classList.remove('locked');
        card.classList.add('completed');
        if (status) status.innerHTML = '<span class="material-symbols-rounded">check_circle</span>';
      } else if (i === unlockedMisi) {
        card.classList.remove('locked');
        card.classList.remove('completed');
        if (status) status.innerHTML = '<span class="material-symbols-rounded">lock_open</span>';
      } else {
        card.classList.add('locked');
        card.classList.remove('completed');
        if (status) status.innerHTML = '<span class="material-symbols-rounded">lock</span>';
      }
    }
  }

  updateProgressRing();
}

function openMisiDetail(misiNum) {
  const unlockedMisi = parseInt(localStorage.getItem('unlockedMisi') || '1');
  if (misiNum > unlockedMisi) {
    alert("Misi ini masih terkunci! Selesaikan misi sebelumnya terlebih dahulu.");
    return;
  }

  currentMisi = misiNum;
  const misi = DATA_MISI[misiNum];

  document.getElementById('modalMisiJudul').innerText = misi.judul;
  document.getElementById('modalMisiInstruksi').innerText = misi.instruksi;
  document.getElementById('videoIframe').src = misi.video;

  loadGoogleForm();

  document.getElementById('modalMisiDetail').style.display = 'flex';
}

function closeMisiDetail() {
  document.getElementById('modalMisiDetail').style.display = 'none';
  document.getElementById('videoIframe').src = 'about:blank';
}

function selesaikanMisiAktif() {
  const tglAktivitas = sessionStorage.getItem('siswa_tgl') || new Date().toISOString().split('T')[0];
  const keyLimit = `completed_misi_${currentMisi}_${tglAktivitas}`;

  if (localStorage.getItem(keyLimit)) {
    alert("Anda sudah menyelesaikan misi ini untuk hari ini!");
    return;
  }

  localStorage.setItem(keyLimit, 'true');
  alert(`Selamat! Anda telah menyelesaikan ${DATA_MISI[currentMisi].judul} 🎉`);

  const currentUnlocked = parseInt(localStorage.getItem('unlockedMisi') || '1');
  if (currentMisi === currentUnlocked && currentUnlocked < 5) {
    localStorage.setItem('unlockedMisi', currentUnlocked + 1);
  }

  loadProgressMisi();
  closeMisiDetail();
}

// PERBAIKAN: INTEGRASI GOOGLE FORM
function loadGoogleForm() {
  const nama = encodeURIComponent(sessionStorage.getItem('siswa_nama') || '');
  const kelas = encodeURIComponent(sessionStorage.getItem('siswa_kelas') || '');
  const tgl = encodeURIComponent(sessionStorage.getItem('siswa_tgl') || '');
  const namaMisi = encodeURIComponent(`Misi ${currentMisi}`);

  // Catatan: entry.xxxxxxxxx harus sesuai dengan nomor ID pertanyaan di Google Form Anda
  const prefilledUrl = `${GOOGLE_FORM_BASE_URL}&entry.1762199534=${nama}&entry.290400879=${kelas}&entry.904816809=${tgl}&entry.1140592551=${namaMisi}`;

  const iframe = document.getElementById('googleFormIframe');
  if (iframe) iframe.src = prefilledUrl;
}

function loadRefleksiForm() {
  const nama = encodeURIComponent(sessionStorage.getItem('siswa_nama') || '');
  const kelas = encodeURIComponent(sessionStorage.getItem('siswa_kelas') || '');
  const tgl = encodeURIComponent(sessionStorage.getItem('siswa_tgl') || '');

  const prefilledUrl = `${GOOGLE_FORM_REFLEKSI_URL}&entry.1762199534=${nama}&entry.290400879=${kelas}&entry.904816809=${tgl}`;
  const iframe = document.getElementById('refleksiFormIframe');
  if (iframe) iframe.src = prefilledUrl;
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
// GURU DASHBOARD & CHART (LIVE DARI GOOGLE SHEETS)
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
// GURU: CHART RENDERING (DYNAMIC TYPE + CATEGORY)
// ==========================================
const CHART_COLORS = [
  'rgba(26, 86, 219, 0.8)',
  'rgba(14, 165, 233, 0.8)',
  'rgba(59, 130, 246, 0.8)',
  'rgba(5, 150, 105, 0.8)',
  'rgba(217, 119, 6, 0.8)',
  'rgba(220, 38, 38, 0.8)',
  'rgba(147, 51, 234, 0.8)',
  'rgba(20, 184, 166, 0.8)',
  'rgba(79, 70, 229, 0.8)',
  'rgba(2, 132, 199, 0.8)',
  'rgba(249, 115, 22, 0.8)',
  'rgba(34, 197, 94, 0.8)'
];

const CHART_COLORS_BORDER = [
  'rgba(26, 86, 219, 1)',
  'rgba(14, 165, 233, 1)',
  'rgba(59, 130, 246, 1)',
  'rgba(5, 150, 105, 1)',
  'rgba(217, 119, 6, 1)',
  'rgba(220, 38, 38, 1)',
  'rgba(147, 51, 234, 1)',
  'rgba(20, 184, 166, 1)',
  'rgba(79, 70, 229, 1)',
  'rgba(2, 132, 199, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(34, 197, 94, 1)'
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
    if (category === 'misi') {
      key = item.misi || 'Lainnya';
    } else if (category === 'kelas') {
      key = item.kelas || 'Lainnya';
    } else if (category === 'tanggal') {
      key = item.tgl || 'Lainnya';
    }

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
    fill: chartType === 'line' ? {
      target: 'origin',
      above: 'rgba(26, 86, 219, 0.1)'
    } : false,
    pointBackgroundColor: chartType === 'line' ? CHART_COLORS_BORDER[0] : undefined,
    pointRadius: chartType === 'line' ? 5 : undefined,
    pointHoverRadius: chartType === 'line' ? 8 : undefined
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: isRadialType,
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 12,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: '600' },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

  if (!isRadialType && chartType !== 'radar') {
    options.scales = {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
      }
    };
  }

  if (chartType === 'radar') {
    options.scales = {
      r: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        pointLabels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } }
      }
    };
  }

  chartGuruInstance = new Chart(ctx, {
    type: chartType,
    data: {
      labels: labels,
      datasets: [datasetConfig]
    },
    options: options
  });
}