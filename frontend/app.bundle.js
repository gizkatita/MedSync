(function () {
// Source: config.js
const supabaseUrl = "https://tcwungdywrhktdxuylwo.supabase.co";
const supabaseAnonKey = "sb_publishable_z2MYg6O0poc5tWBql33OJA_kRWkkL0n";
const supabaseSdkReady = typeof window.supabase?.createClient === "function";

const supabaseClient = supabaseUrl && supabaseAnonKey && supabaseSdkReady
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseConfigMessage = supabaseClient
  ? ""
  : !supabaseUrl || !supabaseAnonKey
    ? "Atur SUPABASE_URL dan SUPABASE_ANON_KEY pada konfigurasi proyek."
    : "Library Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.";

// Source: js/karyawan.js
const karyawanConfig = {
  key: "karyawan",
  title: "Data Karyawan",
  singular: "Karyawan",
  description: "Kelola identitas, status kerja, dan kompensasi karyawan rumah sakit.",
  table: "karyawan",
  id: "id_karyawan",
  select: "*",
  order: "nama",
  searchPlaceholder: "Cari nama, NIK, jabatan, unit kerja...",
  search: ["nama", "nik", "jabatan", "unit_kerja"],
  columns: [["nama", "Nama Karyawan"], ["nik", "NIK"], ["jabatan", "Jabatan"], ["unit_kerja", "Unit Kerja"], ["status_pegawai", "Status Pegawai"], ["gaji_pokok", "Gaji Pokok"], ["status_aktif", "Status"]],
  filters: [
    { field: "unit_kerja", label: "Semua Unit", source: "units" },
    { field: "status_pegawai", label: "Semua Status Pegawai", options: ["Tetap", "Kontrak", "Honorer"] },
    { field: "status_aktif", label: "Semua Status", options: ["Aktif", "Nonaktif"] }
  ],
  fields: [
    { name: "nik", label: "NIK / Nomor Pegawai", required: true, maxlength: 32 },
    { name: "nama", label: "Nama Lengkap", required: true, minlength: 2, maxlength: 150 },
    { name: "jabatan", label: "Jabatan", required: true, maxlength: 100 },
    { name: "unit_kerja", label: "Unit Kerja", required: true, maxlength: 100 },
    { name: "status_pegawai", label: "Status Pegawai", type: "select", options: ["Tetap", "Kontrak", "Honorer"], required: true },
    { name: "status_aktif", label: "Status Aktif", type: "select", options: ["Aktif", "Nonaktif"], required: true, default: "Aktif" },
    { name: "gaji_pokok", label: "Gaji Pokok (Rp)", type: "number", min: "0", step: "1000", required: true },
    { name: "tanggal_masuk", label: "Tanggal Masuk", type: "date", required: true },
    { name: "no_hp", label: "Nomor HP", type: "tel", maxlength: 30 },
    { name: "email", label: "Email", type: "email", maxlength: 254 }
  ]
};

// Source: js/absensi.js
const absensiConfig = {
  key: "absensi",
  title: "Absensi",
  singular: "Absensi",
  description: "Pantau kehadiran harian dan keterlambatan karyawan.",
  table: "absensi",
  id: "id_absensi",
  select: "*,karyawan(nama,nik,jabatan,unit_kerja)",
  order: "tanggal",
  searchPlaceholder: "Cari nama, NIK, atau keterangan...",
  search: ["karyawan.nama", "karyawan.nik", "keterangan"],
  columns: [["tanggal", "Tanggal"], ["id_karyawan", "Karyawan"], ["jam_masuk", "Jam Masuk"], ["jam_keluar", "Jam Keluar"], ["status_kehadiran", "Status Kehadiran"], ["keterlambatan", "Terlambat (menit)"]],
  filters: [
    { field: "status_kehadiran", label: "Semua Status", options: ["Hadir", "Izin", "Sakit", "Cuti", "Alpa"] },
    { field: "id_karyawan", label: "Semua Karyawan", source: "employees" }
  ],
  dateFilter: { field: "tanggal", label: "Tanggal", type: "date" },
  fields: [
    { name: "id_karyawan", label: "Karyawan", type: "employee", required: true },
    { name: "tanggal", label: "Tanggal", type: "date", required: true },
    { name: "status_kehadiran", label: "Status Kehadiran", type: "select", options: ["Hadir", "Izin", "Sakit", "Cuti", "Alpa"], required: true },
    { name: "jam_masuk", label: "Jam Masuk", type: "time" },
    { name: "jam_keluar", label: "Jam Keluar", type: "time" },
    { name: "keterangan", label: "Keterangan", type: "textarea", wide: true }
  ]
};

// Source: js/lembur.js
const lemburConfig = {
  key: "lembur",
  title: "Pengelolaan Lembur",
  singular: "Pengajuan Lembur",
  description: "Kelola pengajuan, persetujuan, dan nominal lembur yang terhubung dengan payroll.",
  table: "lembur",
  id: "id_lembur",
  select: "*,karyawan(nama,nik,jabatan,unit_kerja)",
  order: "tanggal",
  searchPlaceholder: "Cari nama, NIK, atau keterangan...",
  search: ["karyawan.nama", "karyawan.nik", "keterangan"],
  columns: [["id_karyawan", "Karyawan"], ["tanggal", "Tanggal"], ["jam_mulai", "Mulai"], ["jam_selesai", "Selesai"], ["total_jam", "Total Jam"], ["total_lembur", "Nominal Lembur"], ["status", "Status"]],
  filters: [
    { field: "status", label: "Semua Status", options: ["Menunggu", "Disetujui", "Ditolak"] },
    { field: "id_karyawan", label: "Semua Karyawan", source: "employees" }
  ],
  dateFilter: { field: "tanggal", label: "Bulan", type: "month" },
  fields: [
    { name: "id_karyawan", label: "Karyawan", type: "employee", required: true },
    { name: "tanggal", label: "Tanggal Lembur", type: "date", required: true },
    { name: "jam_mulai", label: "Jam Mulai", type: "time", required: true },
    { name: "jam_selesai", label: "Jam Selesai", type: "time", required: true },
    { name: "tarif_lembur", label: "Tarif per Jam (Rp)", type: "number", min: "0", step: "1000", required: true },
    { name: "status", label: "Status Pengajuan", type: "select", options: ["Menunggu", "Disetujui", "Ditolak"], required: true, default: "Menunggu" },
    { name: "keterangan", label: "Keterangan", type: "textarea", wide: true }
  ]
};

// Source: js/kinerja.js
const kinerjaConfig = {
  key: "kinerja",
  title: "Penilaian Kinerja",
  singular: "Penilaian Kinerja",
  description: "Evaluasi karyawan berdasarkan indikator terukur dan predikat otomatis.",
  table: "penilaian_kinerja",
  id: "id_penilaian",
  select: "*,karyawan(nama,nik,jabatan,unit_kerja)",
  order: "periode",
  searchPlaceholder: "Cari nama karyawan, NIK, atau predikat...",
  search: ["karyawan.nama", "karyawan.nik", "predikat", "catatan"],
  columns: [["periode", "Periode"], ["id_karyawan", "Karyawan"], ["skor_kehadiran", "Kehadiran"], ["skor_kedisiplinan", "Disiplin"], ["skor_kinerja", "Kinerja"], ["skor_target", "Target"], ["total_skor", "Total Skor"], ["predikat", "Predikat"]],
  filters: [
    { field: "predikat", label: "Semua Predikat", options: ["Sangat Baik", "Baik", "Cukup", "Kurang", "Sangat Kurang"] },
    { field: "id_karyawan", label: "Semua Karyawan", source: "employees" }
  ],
  dateFilter: { field: "periode", label: "Periode", type: "month" },
  fields: [
    { name: "id_karyawan", label: "Karyawan", type: "employee", required: true },
    { name: "periode", label: "Periode Penilaian", type: "month", required: true },
    { name: "skor_kehadiran", label: "Skor Kehadiran (0-100)", type: "number", min: "0", max: "100", step: ".01", required: true },
    { name: "skor_kedisiplinan", label: "Skor Kedisiplinan (0-100)", type: "number", min: "0", max: "100", step: ".01", required: true },
    { name: "skor_kinerja", label: "Skor Kinerja (0-100)", type: "number", min: "0", max: "100", step: ".01", required: true },
    { name: "skor_target", label: "Skor Target (0-100)", type: "number", min: "0", max: "100", step: ".01", required: true },
    { name: "catatan", label: "Catatan Evaluasi", type: "textarea", wide: true }
  ]
};

// Source: js/payroll.js
const payrollConfig = {
  key: "payroll",
  title: "Payroll",
  singular: "Payroll",
  description: "Kelola payroll bulanan, rincian potongan, potongan cicilan kasbon, dan gaji bersih yang tersinkronisasi.",
  table: "payroll",
  id: "id_payroll",
  select: "*,karyawan(nama,nik,jabatan,unit_kerja)",
  order: "periode",
  searchPlaceholder: "Cari nama atau NIK karyawan...",
  search: ["karyawan.nama", "karyawan.nik", "karyawan.unit_kerja"],
  columns: [["periode", "Periode"], ["id_karyawan", "Karyawan"], ["gaji_pokok", "Gaji Pokok"], ["total_lembur", "Total Lembur"], ["tunjangan", "Tunjangan"], ["insentif", "Insentif"], ["potongan", "Rincian Potongan"], ["gaji_bersih", "Gaji Bersih"], ["status_pembayaran", "Status"]],
  filters: [
    { field: "status_pembayaran", label: "Semua Status", options: ["Draft", "Diproses", "Dibayar"] },
    { field: "karyawan.unit_kerja", label: "Semua Unit", source: "units" }
  ],
  dateFilter: { field: "periode", label: "Periode", type: "month" },
  fields: [
    { name: "id_karyawan", label: "Karyawan", type: "employee", required: true },
    { name: "periode", label: "Periode Payroll", type: "month", required: true },
    { name: "tunjangan", label: "Tunjangan (Rp)", type: "number", min: "0", step: "1000", required: true, default: "0" },
    { name: "insentif", label: "Insentif (Rp)", type: "number", min: "0", step: "1000", required: true, default: "0" },
    { name: "potongan", label: "Potongan (Rp)", type: "number", min: "0", step: "1000", required: true, default: "0", readonlyOnEdit: true }
  ]
};

// Source: js/accounting.js
const accountingState = {
  accountSearch: "",
  accountType: "",
  ledgerAccount: "",
  ledgerPeriod: accountingCurrentMonth(),
  ledgerFrom: "",
  ledgerTo: "",
  statementPeriod: accountingCurrentMonth(),
  journalPeriod: "",
  journalFrom: "",
  journalTo: "",
  journalStatus: ""
};

const accountTypes = ["Aset", "Liabilitas", "Ekuitas", "Pendapatan", "Beban"];
const accountNormalBalance = { Aset: "Debit", Beban: "Debit", Liabilitas: "Kredit", Ekuitas: "Kredit", Pendapatan: "Kredit" };
const accountingSystemAccountCodes = ["201", "202", "501", "502", "503", "504"];

function accountingCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function accountingPayrollActions(row) {
  if (!state.accountingReady) return `<span class="accounting-hint">Jalankan migration akuntansi untuk jurnal</span>`;
  const payrollId = esc(row.id_payroll);
  const payrollJournal = state.payrollJournals?.[`${row.id_payroll}:payroll`];
  const paymentJournal = state.payrollJournals?.[`${row.id_payroll}:payroll_payment`];
  const payrollAction = row.status_pembayaran === "Draft"
    ? ""
    : payrollJournal
      ? `<button class="button button-quiet accounting-small" data-action="open-journals" data-id="${payrollId}">Jurnal ${esc(payrollJournal.status)}</button>`
      : `<button class="button button-quiet accounting-small" data-action="create-payroll-journal" data-id="${payrollId}">Buat Jurnal Payroll</button>`;
  const paymentAction = row.status_pembayaran !== "Dibayar"
    ? ""
    : paymentJournal
      ? `<button class="button button-quiet accounting-small" data-action="open-journals" data-id="${payrollId}">Pembayaran ${esc(paymentJournal.status)}</button>`
      : `<label class="sr-only" for="cash-${payrollId}">Akun kas/bank untuk pembayaran</label><select class="accounting-cash-select" id="cash-${payrollId}" data-cash-account>${(state.cashAccounts || []).map((account) => `<option value="${esc(account.id_account)}" ${account.code === "102" ? "selected" : ""}>${esc(account.code)} · ${esc(account.name)}</option>`).join("")}</select><button class="button button-quiet accounting-small" data-action="create-payment-journal" data-id="${payrollId}" ${payrollJournal?.status !== "Posted" ? "disabled title=\"Jurnal payroll harus Posted terlebih dahulu\"" : ""}>Buat Jurnal Pembayaran</button>`;
  return `<div class="accounting-payroll-actions">${payrollAction}${paymentAction}</div>`;
}

function accountingMetric(label, value, detail, icon, moneyValue = false) {
  return metricCard(label, value, detail, icon, "metric-mint", moneyValue);
}

async function accountingRows() {
  const [entriesResult, linesResult, accountsResult] = await Promise.all([
    supabaseClient.from("journal_entries").select("*").order("entry_date", { ascending: false }),
    supabaseClient.from("journal_lines").select("id_line,id_journal,id_account,description,debit,credit"),
    supabaseClient.from("accounts").select("*").order("code")
  ]);
  for (const result of [entriesResult, linesResult, accountsResult]) if (result.error) throw result.error;
  const accounts = new Map((accountsResult.data || []).map((account) => [account.id_account, account]));
  const linesByJournal = new Map();
  for (const line of linesResult.data || []) {
    const journalLines = linesByJournal.get(line.id_journal) || [];
    journalLines.push({ ...line, account: accounts.get(line.id_account) });
    linesByJournal.set(line.id_journal, journalLines);
  }
  const entries = entriesResult.data || [];
  const payrollIds = [...new Set(entries.filter((entry) => entry.entry_type === "payroll").map((entry) => entry.source_payroll_id).filter(Boolean))];
  const deductionsResult = payrollIds.length
    ? await supabaseClient.from("payroll_potongan").select("id_payroll,jenis_potongan,nominal").in("id_payroll", payrollIds)
    : { data: [], error: null };
  if (deductionsResult.error) throw deductionsResult.error;
  const deductionsByPayroll = new Map();
  for (const detail of deductionsResult.data || []) {
    const details = deductionsByPayroll.get(detail.id_payroll) || [];
    details.push(detail);
    deductionsByPayroll.set(detail.id_payroll, details);
  }
  return { entries, linesByJournal, accounts: accountsResult.data || [], deductionsByPayroll };
}

function accountingDeductionSubline(payrollId, deductionsByPayroll) {
  const details = deductionsByPayroll.get(payrollId) || [];
  if (!details.length) return "";
  const totals = new Map();
  for (const item of details) totals.set(item.jenis_potongan, (totals.get(item.jenis_potongan) || 0) + Number(item.nominal || 0));
  return `<small class="accounting-subline">Rincian payroll: ${[...totals].map(([type, amount]) => `${esc(type)} ${money(amount)}`).join(" · ")}</small>`;
}

async function renderAccountingDashboard() {
  const period = currentMonth();
  const [payrollResult, entriesResult, linesResult] = await Promise.all([
    supabaseClient.from("payroll").select("id_payroll,gaji_pokok,total_lembur,tunjangan,insentif,potongan,gaji_bersih,periode").eq("periode", monthDate(period)),
    supabaseClient.from("journal_entries").select("id_journal,status,entry_type,period"),
    supabaseClient.from("journal_lines").select("id_journal,id_account,debit,credit,accounts(code)")
  ]);
  for (const result of [payrollResult, entriesResult, linesResult]) if (result.error) throw result.error;
  const payroll = payrollResult.data || [];
  const payrollIds = payroll.map((row) => row.id_payroll);
  const deductionResult = payrollIds.length
    ? await supabaseClient.from("payroll_potongan").select("id_payroll,jenis_potongan,nominal").in("id_payroll", payrollIds)
    : { data: [], error: null };
  if (deductionResult.error) throw deductionResult.error;
  const deductionDetails = deductionResult.data || [];
  const entries = entriesResult.data || [];
  const entriesById = new Map(entries.map((entry) => [entry.id_journal, entry]));
  const lines = linesResult.data || [];
  const posted = entries.filter((entry) => entry.status === "Posted");
  const postedIds = new Set(posted.map((entry) => entry.id_journal));
  const currentPeriod = monthDate(period);
  const postedExpense = (code) => lines.reduce((sum, line) => {
    const journal = entriesById.get(line.id_journal);
    if (!postedIds.has(line.id_journal) || journal?.period !== currentPeriod || line.accounts?.code !== code) return sum;
    return sum + Number(line.debit || 0) - Number(line.credit || 0);
  }, 0);
  const payrollDebt = lines.reduce((sum, line) => {
    if (!postedIds.has(line.id_journal) || line.accounts?.code !== "201") return sum;
    return sum + Number(line.credit || 0) - Number(line.debit || 0);
  }, 0);
  const periodPayroll = payroll.reduce((sum, row) => sum + Number(row.gaji_bersih || 0), 0);
  const salaryExpense = postedExpense("501");
  const overtimeExpense = postedExpense("502");
  const periodDeductions = payroll.reduce((sum, row) => sum + Number(row.potongan || 0), 0);
  const deductionGroups = new Map();
  for (const detail of deductionDetails) deductionGroups.set(detail.jenis_potongan, (deductionGroups.get(detail.jenis_potongan) || 0) + Number(detail.nominal || 0));
  const detailedTotal = deductionDetails.reduce((sum, detail) => sum + Number(detail.nominal || 0), 0);
  const detailedPayrollIds = new Set(deductionDetails.map((detail) => detail.id_payroll));
  const legacyPotongan = payroll.filter((row) => !detailedPayrollIds.has(row.id_payroll))
    .reduce((sum, row) => sum + Number(row.potongan || 0), 0);
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">SISTEM INFORMASI AKUNTANSI</span><h1>Dashboard Akuntansi</h1><p>Ringkasan payroll bulan ${esc(monthLabel(monthDate(period)))} dan status jurnal berdasarkan data Supabase.</p></div><button class="button button-primary" data-open-view="journals"><i data-lucide="book-open-check"></i> Kelola jurnal</button></section><section class="metric-grid accounting-metrics">${accountingMetric("Total Payroll", periodPayroll, `${payroll.length} record · gaji bersih bulan ini`, "wallet-cards", true)}${accountingMetric("Total Potongan Payroll", periodDeductions, "Agregat payroll periode berjalan", "badge-minus", true)}${accountingMetric("Total Beban Gaji", salaryExpense, "Gaji pokok payroll bulan ini", "badge-dollar-sign", true)}${accountingMetric("Total Beban Lembur", overtimeExpense, "Lembur disetujui bulan ini", "clock-4", true)}${accountingMetric("Total Utang Gaji", payrollDebt, "Saldo akun 201 dari jurnal Posted", "receipt-text", true)}${accountingMetric("Jumlah Jurnal", entries.length, "Seluruh jurnal payroll", "book-open")}${accountingMetric("Jurnal Draft", entries.filter((entry) => entry.status === "Draft").length, "Menunggu pemeriksaan dan posting", "file-pen-line")}${accountingMetric("Jurnal Posted", posted.length, "Tercatat di buku besar", "book-check")}</section><section class="panel panel-pad accounting-deduction-summary"><div class="panel-heading"><div><span class="eyebrow">REKONSILIASI POTONGAN</span><h2>Rincian payroll periode berjalan</h2></div><button class="inline-link" data-open-view="laporan">Buka laporan <i data-lucide="arrow-up-right"></i></button></div><p>Rincian ini membentuk payroll.potongan dan gaji bersih. Laporan keuangan dan buku besar tetap memakai jurnal berstatus Posted pada akun Utang Potongan Gaji (202).</p><div class="accounting-deduction-breakdown">${[...deductionGroups].sort(([left], [right]) => left.localeCompare(right, "id-ID")).map(([type, amount]) => `<div><span>${esc(type)}</span><strong>${money(amount)}</strong></div>`).join("") || `<p class="accounting-hint">Belum ada rincian potongan payroll pada periode ini.</p>`}<div class="accounting-deduction-total"><span>Rincian tersimpan</span><strong>${money(detailedTotal)}</strong></div>${legacyPotongan ? `<div class="accounting-legacy-warning">Potongan agregat lama belum dirinci: <strong>${money(legacyPotongan)}</strong>. Nilai tersebut tetap berada di payroll dan tidak dikategorikan otomatis.</div>` : ""}</div></section><section class="panel panel-pad accounting-dashboard-note"><div class="panel-heading"><div><span class="eyebrow">ALUR AKUNTANSI PAYROLL</span><h2>Payroll → jurnal → buku besar → laporan</h2></div></div><p>Jurnal Payroll mencatat beban gaji, lembur, tunjangan, insentif, utang gaji bersih, dan utang potongan. Jurnal pembayaran hanya tersedia untuk payroll Dibayar setelah jurnal pengakuannya Posted. Laporan hanya memakai jurnal Posted; rincian baru masuk ke laporan keuangan setelah payroll diproses dan jurnal dibuat sesuai workflow.</p><div class="accounting-shortcuts"><button class="button button-quiet" data-open-view="accounts">Daftar Akun</button><button class="button button-quiet" data-open-view="ledger">Buku Besar</button><button class="button button-quiet" data-open-view="income-statement">Laba Rugi</button><button class="button button-quiet" data-open-view="balance-sheet">Posisi Keuangan</button></div></section>`;
  icons();
}

async function renderAccounts() {
  const { data, error } = await supabaseClient.from("accounts").select("*").order("code");
  if (error) throw error;
  const rows = (data || []).filter((account) => {
    const q = accountingState.accountSearch.toLocaleLowerCase("id-ID");
    return (!accountingState.accountType || account.account_type === accountingState.accountType)
      && (!q || `${account.code} ${account.name}`.toLocaleLowerCase("id-ID").includes(q));
  });
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">AKUNTANSI</span><h1>Daftar Akun</h1><p>Kelola chart of accounts yang digunakan untuk jurnal payroll dan laporan keuangan.</p></div><button class="button button-primary" id="account-new"><i data-lucide="plus"></i> Tambah akun</button></section><section class="panel accounting-form-panel" id="account-form-panel" hidden><form id="account-form"><input type="hidden" name="id_account"><div class="account-form-grid"><label class="form-field"><span>Kode akun</span><input name="code" maxlength="20" required></label><label class="form-field"><span>Nama akun</span><input name="name" maxlength="120" required></label><label class="form-field"><span>Tipe akun</span><select name="account_type" required>${accountTypes.map((type) => `<option value="${type}">${type}</option>`).join("")}</select></label><label class="form-field"><span>Saldo normal</span><select name="normal_balance" required><option value="Debit">Debit</option><option value="Kredit">Kredit</option></select></label></div><p class="form-error" id="account-form-error" role="alert"></p><div class="modal-actions"><button class="button button-quiet" id="account-cancel" type="button">Batal</button><button class="button button-primary" type="submit"><i data-lucide="check"></i> Simpan akun</button></div></form></section><section class="panel data-panel"><div class="table-toolbar"><span class="table-count"><strong>${rows.length}</strong> akun</span><div class="table-tools"><label class="search-box"><i data-lucide="search"></i><input id="account-search" type="search" value="${esc(accountingState.accountSearch)}" placeholder="Cari kode atau nama akun" aria-label="Cari akun"></label><label class="filter-box"><span class="sr-only">Filter tipe akun</span><select id="account-type-filter" aria-label="Filter tipe akun"><option value="">Semua tipe akun</option>${accountTypes.map((type) => `<option value="${type}" ${accountingState.accountType === type ? "selected" : ""}>${type}</option>`).join("")}</select></label></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Kode</th><th>Nama Akun</th><th>Tipe</th><th>Saldo Normal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.length ? rows.map((account) => `<tr><td><strong>${esc(account.code)}</strong></td><td>${esc(account.name)}</td><td>${esc(account.account_type)}</td><td>${esc(account.normal_balance)}</td><td>${badge(account.is_active ? "Aktif" : "Nonaktif")}</td><td><div class="row-actions"><button class="icon-button" data-account-edit="${esc(account.id_account)}" aria-label="Edit akun ${esc(account.code)}"><i data-lucide="pencil"></i></button><button class="button button-quiet accounting-small" data-account-toggle="${esc(account.id_account)}">${account.is_active ? "Nonaktifkan" : "Aktifkan"}</button><button class="icon-button danger" data-account-delete="${esc(account.id_account)}" aria-label="Hapus akun ${esc(account.code)}"><i data-lucide="trash-2"></i></button></div></td></tr>`).join("") : `<tr><td class="empty-cell" colspan="6">Tidak ada akun yang sesuai filter.</td></tr>`}</tbody></table></div><div class="table-foot"><span>${rows.length} akun ditemukan</span><span>Akun yang sudah dipakai jurnal tidak dapat dihapus; nonaktifkan jika tidak digunakan lagi.</span></div></section>`;
  $("account-new").addEventListener("click", () => showAccountForm());
  $("account-search").addEventListener("input", (event) => { accountingState.accountSearch = event.target.value; void renderAccounts(); });
  $("account-type-filter").addEventListener("change", (event) => { accountingState.accountType = event.target.value; void renderAccounts(); });
  $("account-form").addEventListener("submit", (event) => void saveAccount(event));
  $("account-form").elements.account_type.addEventListener("change", (event) => {
    $("account-form").elements.normal_balance.value = accountNormalBalance[event.target.value];
  });
  $("account-cancel").addEventListener("click", () => { $("account-form-panel").hidden = true; });
  document.querySelectorAll("[data-account-edit]").forEach((button) => button.addEventListener("click", () => {
    const account = data.find((item) => item.id_account === button.dataset.accountEdit);
    if (account) showAccountForm(account);
  }));
  document.querySelectorAll("[data-account-toggle]").forEach((button) => button.addEventListener("click", () => void toggleAccount(button.dataset.accountToggle, data)));
  document.querySelectorAll("[data-account-delete]").forEach((button) => button.addEventListener("click", () => void deleteAccount(button.dataset.accountDelete, data)));
  icons();
}

function showAccountForm(account = null) {
  const form = $("account-form");
  form.reset();
  form.elements.id_account.value = account?.id_account || "";
  form.elements.code.value = account?.code || "";
  form.elements.name.value = account?.name || "";
  form.elements.account_type.value = account?.account_type || "Aset";
  form.elements.normal_balance.value = account?.normal_balance || "Debit";
  const systemAccount = Boolean(account && accountingSystemAccountCodes.includes(account.code));
  form.elements.code.readOnly = systemAccount;
  form.elements.account_type.disabled = systemAccount;
  form.elements.normal_balance.disabled = systemAccount;
  $("account-form-error").textContent = "";
  $("account-form-panel").hidden = false;
  form.elements.code.focus();
}

async function saveAccount(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id_account.value;
  const accountType = form.elements.account_type.value;
  const record = {
    code: form.elements.code.value.trim(),
    name: form.elements.name.value.trim(),
    account_type: accountType,
    normal_balance: form.elements.normal_balance.value
  };
  if (!record.code || !record.name || !accountTypes.includes(accountType)) return;
  try {
    const query = supabaseClient.from("accounts");
    const result = id ? await query.update(record).eq("id_account", id) : await query.insert(record);
    if (result.error) throw result.error;
    toast(`Akun berhasil ${id ? "diperbarui" : "ditambahkan"}.`);
    await renderAccounts();
  } catch (error) {
    $("account-form-error").textContent = explainError(error);
    toast(explainError(error), "error");
  }
}

async function toggleAccount(id, accounts) {
  const account = accounts.find((item) => item.id_account === id);
  if (!account) return;
  try {
    const { error } = await supabaseClient.from("accounts").update({ is_active: !account.is_active }).eq("id_account", id);
    if (error) throw error;
    toast(`Akun ${account.is_active ? "dinonaktifkan" : "diaktifkan"}.`);
    await renderAccounts();
  } catch (error) {
    toast(explainError(error), "error");
  }
}

async function deleteAccount(id, accounts) {
  const account = accounts.find((item) => item.id_account === id);
  if (account && accountingSystemAccountCodes.includes(account.code)) {
    toast("Akun sistem payroll tidak dapat dihapus. Nonaktifkan akun jika tidak digunakan lagi.", "error");
    return;
  }
  if (!account || !window.confirm(`Hapus akun ${account.code} · ${account.name}? Akun yang sudah dipakai jurnal tidak dapat dihapus.`)) return;
  try {
    const { error } = await supabaseClient.from("accounts").delete().eq("id_account", id);
    if (error) throw error;
    toast("Akun berhasil dihapus.");
    await renderAccounts();
  } catch (error) {
    const message = error?.code === "23503"
      ? "Akun sudah digunakan oleh jurnal dan tidak dapat dihapus. Nonaktifkan akun jika tidak digunakan lagi."
      : explainError(error);
    toast(message, "error");
  }
}

function accountingLineMarkup(line, payrollId = null, deductionsByPayroll = new Map()) {
  const breakdown = line.account?.code === "202" ? accountingDeductionSubline(payrollId, deductionsByPayroll) : "";
  return `<tr><td>${esc(line.account?.code || "-")}</td><td>${esc(line.account?.name || "Akun tidak ditemukan")}</td><td>${esc(line.description || "-")}${breakdown}</td><td class="money-cell">${line.debit ? money(line.debit) : "-"}</td><td class="money-cell">${line.credit ? money(line.credit) : "-"}</td></tr>`;
}

async function renderJournals() {
  const { entries, linesByJournal, accounts, deductionsByPayroll } = await accountingRows();
  const filtered = entries.filter((entry) => {
    if (accountingState.journalPeriod && String(entry.period).slice(0, 7) !== accountingState.journalPeriod) return false;
    if (accountingState.journalFrom && entry.entry_date < accountingState.journalFrom) return false;
    if (accountingState.journalTo && entry.entry_date > accountingState.journalTo) return false;
    if (accountingState.journalStatus && entry.status !== accountingState.journalStatus) return false;
    return true;
  });
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">AKUNTANSI</span><h1>Jurnal</h1><p>Periksa keseimbangan jurnal payroll dan jurnal pembayaran sebelum posting.</p></div><button class="button button-quiet" data-open-view="payroll"><i data-lucide="wallet-cards"></i> Buka Payroll</button></section><section class="panel data-panel"><div class="accounting-filter-row"><label class="form-field"><span>Periode</span><input type="month" id="journal-period" value="${esc(accountingState.journalPeriod)}"></label><label class="form-field"><span>Dari tanggal</span><input type="date" id="journal-from" value="${esc(accountingState.journalFrom)}"></label><label class="form-field"><span>Sampai tanggal</span><input type="date" id="journal-to" value="${esc(accountingState.journalTo)}"></label><label class="form-field"><span>Status</span><select id="journal-status"><option value="">Semua status</option><option value="Draft" ${accountingState.journalStatus === "Draft" ? "selected" : ""}>Draft</option><option value="Posted" ${accountingState.journalStatus === "Posted" ? "selected" : ""}>Posted</option></select></label></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Tanggal</th><th>Nomor Jurnal</th><th>Periode</th><th>Keterangan</th><th>Status</th><th>Total Debit</th><th>Total Kredit</th><th>Aksi</th></tr></thead><tbody>${filtered.length ? filtered.map((entry) => {
    const lines = linesByJournal.get(entry.id_journal) || [];
    const debit = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const credit = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    return `<tr class="journal-summary-row"><td>${esc(dateLabel(entry.entry_date))}</td><td><strong>${esc(entry.journal_number)}</strong></td><td>${esc(monthLabel(entry.period))}</td><td>${esc(entry.description)}</td><td>${badge(entry.status)}</td><td class="money-cell">${money(debit)}</td><td class="money-cell">${money(credit)}</td><td>${entry.status === "Draft" ? `<button class="button button-primary accounting-small" data-post-journal="${esc(entry.id_journal)}">Posting</button>` : `<span class="accounting-hint">Terkunci</span>`}</td></tr><tr class="journal-lines-row"><td colspan="8"><div class="table-scroll"><table class="data-table journal-lines-table"><thead><tr><th>Kode</th><th>Akun</th><th>Keterangan</th><th>Debit</th><th>Kredit</th></tr></thead><tbody>${lines.map((line) => accountingLineMarkup(line, entry.source_payroll_id, deductionsByPayroll)).join("")}</tbody></table></div></td></tr>`;
  }).join("") : `<tr><td class="empty-cell" colspan="8">Belum ada jurnal pada filter ini. Buat jurnal dari baris payroll berstatus Diproses atau Dibayar.</td></tr>`}</tbody></table></div><div class="table-foot"><span>${filtered.length} jurnal · hanya status Posted masuk buku besar/laporan.</span><span>${accounts.length} akun tersedia</span></div></section>`;
  $("journal-period").addEventListener("change", (event) => { accountingState.journalPeriod = event.target.value; void renderJournals(); });
  $("journal-from").addEventListener("change", (event) => { accountingState.journalFrom = event.target.value; void renderJournals(); });
  $("journal-to").addEventListener("change", (event) => { accountingState.journalTo = event.target.value; void renderJournals(); });
  $("journal-status").addEventListener("change", (event) => { accountingState.journalStatus = event.target.value; void renderJournals(); });
  document.querySelectorAll("[data-post-journal]").forEach((button) => button.addEventListener("click", () => void postJournal(button.dataset.postJournal)));
  icons();
}

async function postJournal(id) {
  if (!window.confirm("Posting jurnal ini? Jurnal Posted akan terkunci dan masuk Buku Besar serta laporan keuangan.")) return;
  try {
    const { error } = await supabaseClient.rpc("post_journal_entry", { p_journal_id: id });
    if (error) throw error;
    toast("Jurnal berhasil di-Posted.");
    await renderCurrent();
  } catch (error) {
    toast(explainError(error), "error");
  }
}

async function renderLedger() {
  const { entries, linesByJournal, accounts, deductionsByPayroll } = await accountingRows();
  const accountId = accountingState.ledgerAccount || accounts.find((account) => account.is_active)?.id_account || "";
  accountingState.ledgerAccount = accountId;
  const monthStart = monthDate(accountingState.ledgerPeriod);
  const monthEnd = monthDate(shiftMonth(accountingState.ledgerPeriod, 1));
  const from = accountingState.ledgerFrom || monthStart;
  const to = accountingState.ledgerTo || new Date(new Date(`${monthEnd}T12:00:00`).getTime() - 86400000).toISOString().slice(0, 10);
  const account = accounts.find((item) => item.id_account === accountId);
  const journalRows = [];
  let opening = 0;
  const sortedEntries = entries.filter((entry) => entry.status === "Posted" && entry.entry_date <= to)
    .sort((a, b) => a.entry_date.localeCompare(b.entry_date) || a.journal_number.localeCompare(b.journal_number));
  for (const entry of sortedEntries) {
    for (const line of linesByJournal.get(entry.id_journal) || []) {
      if (line.id_account !== accountId) continue;
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      const movement = account?.normal_balance === "Kredit" ? credit - debit : debit - credit;
      if (entry.entry_date < from) opening += movement;
      else journalRows.push({ entry, line, debit, credit, movement });
    }
  }
  let balance = opening;
  const rows = journalRows.map((item) => {
    balance += item.movement;
    const deductionDetails = item.line.account?.code === "202"
      ? accountingDeductionSubline(item.entry.source_payroll_id, deductionsByPayroll)
      : "";
    return `<tr><td>${esc(dateLabel(item.entry.entry_date))}</td><td>${esc(item.entry.journal_number)}</td><td>${esc(item.entry.description)}${item.line.description ? `<small class="accounting-subline">${esc(item.line.description)}</small>` : ""}${deductionDetails}</td><td class="money-cell">${item.debit ? money(item.debit) : "-"}</td><td class="money-cell">${item.credit ? money(item.credit) : "-"}</td><td class="money-cell"><strong>${money(balance)}</strong></td></tr>`;
  }).join("");
  const totalDebit = journalRows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = journalRows.reduce((sum, row) => sum + row.credit, 0);
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">AKUNTANSI</span><h1>Buku Besar</h1><p>Mutasi dan saldo akun dihitung dari jurnal berstatus Posted.</p></div></section><section class="panel data-panel"><div class="accounting-filter-row ledger-filters"><label class="form-field"><span>Akun</span><select id="ledger-account">${accounts.map((item) => `<option value="${esc(item.id_account)}" ${item.id_account === accountId ? "selected" : ""}>${esc(item.code)} · ${esc(item.name)}</option>`).join("")}</select></label><label class="form-field"><span>Periode</span><input type="month" id="ledger-period" value="${esc(accountingState.ledgerPeriod)}"></label><label class="form-field"><span>Dari tanggal</span><input type="date" id="ledger-from" value="${esc(accountingState.ledgerFrom)}"></label><label class="form-field"><span>Sampai tanggal</span><input type="date" id="ledger-to" value="${esc(accountingState.ledgerTo)}"></label></div><div class="accounting-opening">Saldo awal per ${esc(dateLabel(from))}: <strong>${money(opening)}</strong> · ${esc(account?.code || "")} ${esc(account?.name || "")}</div><div class="table-scroll"><table class="data-table"><thead><tr><th>Tanggal</th><th>Nomor Jurnal</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Saldo</th></tr></thead><tbody>${rows || `<tr><td class="empty-cell" colspan="6">Tidak ada mutasi Posted pada rentang tanggal ini.</td></tr>`}</tbody><tfoot><tr><th colspan="3">Total mutasi · Saldo akhir</th><th class="money-cell">${money(totalDebit)}</th><th class="money-cell">${money(totalCredit)}</th><th class="money-cell">${money(balance)}</th></tr></tfoot></table></div></section>`;
  $("ledger-account").addEventListener("change", (event) => { accountingState.ledgerAccount = event.target.value; void renderLedger(); });
  $("ledger-period").addEventListener("change", (event) => { accountingState.ledgerPeriod = event.target.value; accountingState.ledgerFrom = ""; accountingState.ledgerTo = ""; void renderLedger(); });
  $("ledger-from").addEventListener("change", (event) => { accountingState.ledgerFrom = event.target.value; void renderLedger(); });
  $("ledger-to").addEventListener("change", (event) => { accountingState.ledgerTo = event.target.value; void renderLedger(); });
  icons();
}

async function renderFinancialStatement(type) {
  const { entries, linesByJournal, accounts } = await accountingRows();
  const period = accountingState.statementPeriod;
  const start = monthDate(period);
  const afterEnd = monthDate(shiftMonth(period, 1));
  const end = new Date(new Date(`${afterEnd}T12:00:00`).getTime() - 86400000).toISOString().slice(0, 10);
  const posted = entries.filter((entry) => entry.status === "Posted" && entry.entry_date <= end);
  const activity = new Map(accounts.map((account) => [account.id_account, { debit: 0, credit: 0 }]));
  for (const entry of posted) {
    if (type === "income-statement" && (entry.entry_date < start || entry.entry_date > end)) continue;
    for (const line of linesByJournal.get(entry.id_journal) || []) {
      const sum = activity.get(line.id_account);
      if (sum) {
        sum.debit += Number(line.debit || 0);
        sum.credit += Number(line.credit || 0);
      }
    }
  }
  let body = "";
  if (type === "income-statement") {
    const revenue = accounts.filter((account) => account.account_type === "Pendapatan");
    const expenses = accounts.filter((account) => account.account_type === "Beban");
    const revenueLines = revenue.map((account) => ({ account, amount: activity.get(account.id_account).credit - activity.get(account.id_account).debit })).filter((row) => row.amount !== 0);
    const expenseLines = expenses.map((account) => ({ account, amount: activity.get(account.id_account).debit - activity.get(account.id_account).credit })).filter((row) => row.amount !== 0);
    const revenueTotal = revenueLines.reduce((sum, row) => sum + row.amount, 0);
    const expenseTotal = expenseLines.reduce((sum, row) => sum + row.amount, 0);
    body = `<div class="statement-section"><h3>Pendapatan</h3>${revenueLines.length ? revenueLines.map((row) => accountingStatementLine(row.account, row.amount)).join("") : `<p class="accounting-empty">Belum ada pendapatan tercatat dalam jurnal Posted pada periode ini. Sistem tidak mengasumsikan pendapatan.</p>`}<div class="statement-total"><span>Total Pendapatan</span><strong>${money(revenueTotal)}</strong></div></div><div class="statement-section"><h3>Beban</h3>${expenseLines.length ? expenseLines.map((row) => accountingStatementLine(row.account, row.amount)).join("") : `<p class="accounting-empty">Belum ada beban tercatat dalam jurnal Posted pada periode ini.</p>`}<div class="statement-total"><span>Total Beban</span><strong>${money(expenseTotal)}</strong></div></div><div class="statement-net"><span>${revenueTotal - expenseTotal >= 0 ? "Laba bersih" : "Rugi bersih"}</span><strong>${money(Math.abs(revenueTotal - expenseTotal))}</strong></div>`;
  } else {
    const assets = accounts.filter((account) => account.account_type === "Aset")
      .map((account) => ({ account, amount: activity.get(account.id_account).debit - activity.get(account.id_account).credit })).filter((row) => row.amount !== 0);
    const liabilities = accounts.filter((account) => account.account_type === "Liabilitas")
      .map((account) => ({ account, amount: activity.get(account.id_account).credit - activity.get(account.id_account).debit })).filter((row) => row.amount !== 0);
    const equity = accounts.filter((account) => account.account_type === "Ekuitas")
      .map((account) => ({ account, amount: activity.get(account.id_account).credit - activity.get(account.id_account).debit })).filter((row) => row.amount !== 0);
    const resultAccounts = accounts.filter((account) => ["Pendapatan", "Beban"].includes(account.account_type));
    const retainedResult = resultAccounts.reduce((sum, account) => {
      const movement = activity.get(account.id_account);
      return sum + movement.credit - movement.debit;
    }, 0);
    const totalAssets = assets.reduce((sum, row) => sum + row.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, row) => sum + row.amount, 0);
    const totalEquity = equity.reduce((sum, row) => sum + row.amount, 0) + retainedResult;
    body = `<div class="statement-section"><h3>Aset</h3>${assets.map((row) => accountingStatementLine(row.account, row.amount)).join("") || `<p class="accounting-empty">Belum ada saldo aset dari jurnal Posted.</p>`}<div class="statement-total"><span>Total Aset</span><strong>${money(totalAssets)}</strong></div></div><div class="statement-section"><h3>Liabilitas</h3>${liabilities.map((row) => accountingStatementLine(row.account, row.amount)).join("") || `<p class="accounting-empty">Belum ada saldo liabilitas dari jurnal Posted.</p>`}<div class="statement-total"><span>Total Liabilitas</span><strong>${money(totalLiabilities)}</strong></div></div><div class="statement-section"><h3>Ekuitas</h3>${equity.map((row) => accountingStatementLine(row.account, row.amount)).join("") || ""}<div class="statement-line"><span>Laba (rugi) kumulatif dari jurnal Posted</span><strong>${money(retainedResult)}</strong></div><div class="statement-total"><span>Total Ekuitas</span><strong>${money(totalEquity)}</strong></div></div><div class="statement-net"><span>Total Liabilitas &amp; Ekuitas</span><strong>${money(totalLiabilities + totalEquity)}</strong></div><p class="accounting-footnote">Saldo per ${esc(dateLabel(end))}. Hasil usaha kumulatif memasukkan hanya akun pendapatan/beban dari jurnal Posted sampai tanggal laporan.</p>`;
  }
  const title = type === "income-statement" ? "Laporan Laba Rugi" : "Laporan Posisi Keuangan";
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">LAPORAN KEUANGAN</span><h1>${title}</h1><p>${type === "income-statement" ? `Pendapatan dan beban dari jurnal Posted periode ${esc(monthLabel(start))}.` : `Aset, liabilitas, dan ekuitas dari jurnal Posted sampai ${esc(dateLabel(end))}.`}</p></div><button class="button button-quiet" id="statement-print"><i data-lucide="printer"></i> Cetak laporan</button></section><section class="panel panel-pad statement-panel"><div class="statement-toolbar"><label class="form-field"><span>Periode laporan</span><input type="month" id="statement-period" value="${esc(period)}"></label></div>${body}</section>`;
  $("statement-period").addEventListener("change", (event) => { accountingState.statementPeriod = event.target.value; void renderFinancialStatement(type); });
  $("statement-print").addEventListener("click", printReport);
  icons();
}

function accountingStatementLine(account, amount) {
  return `<div class="statement-line"><span>${esc(account.code)} · ${esc(account.name)}</span><strong>${money(amount)}</strong></div>`;
}

async function renderAccounting(view) {
  if (view === "accounting-dashboard") return renderAccountingDashboard();
  if (view === "accounts") return renderAccounts();
  if (view === "journals") return renderJournals();
  if (view === "ledger") return renderLedger();
  if (view === "income-statement" || view === "balance-sheet") return renderFinancialStatement(view);
  throw new Error(`Halaman akuntansi tidak dikenal: ${view}`);
}

// Source: js/payroll-deductions.js
const deductionTypes = [
  "PPh 21",
  "BPJS Kesehatan",
  "BPJS Ketenagakerjaan",
  "Kasbon",
  "Pinjaman Karyawan",
  "Potongan Lainnya"
];

const MAX_DEDUCTION_AMOUNT = 999999999999.99;
const deductionState = { rows: [], payroll: [], linkedLoanDeductionIds: new Set(), journaledPayrollIds: new Set(), postedPayrollIds: new Set(), search: "", period: "" };

async function loadDeductionData() {
  const [deductionsResult, payrollResult, journalsResult, loanLinksResult] = await Promise.all([
    supabaseClient.schema("public").from("payroll_potongan").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("payroll").select("id_payroll,id_karyawan,periode,potongan,gaji_kotor,gaji_bersih,status_pembayaran,karyawan(nama,nik,jabatan,unit_kerja)").order("periode", { ascending: false }),
    supabaseClient.from("journal_entries").select("source_payroll_id,status").not("source_payroll_id", "is", null),
    supabaseClient.from("payroll_pinjaman_potongan").select("id_potongan")
  ]);
  for (const result of [deductionsResult, payrollResult, journalsResult, loanLinksResult]) if (result.error) throw result.error;
  deductionState.rows = deductionsResult.data || [];
  deductionState.payroll = payrollResult.data || [];
  deductionState.journaledPayrollIds = new Set((journalsResult.data || []).map((entry) => entry.source_payroll_id));
  deductionState.postedPayrollIds = new Set((journalsResult.data || []).filter((entry) => entry.status === "Posted").map((entry) => entry.source_payroll_id));
  deductionState.linkedLoanDeductionIds = new Set((loanLinksResult.data || []).map((link) => link.id_potongan));
}

function deductionPayroll(id) {
  return deductionState.payroll.find((payroll) => payroll.id_payroll === id);
}

function renderPayrollDeductionPage(preserveFormState = false) {
  const currentForm = preserveFormState ? $("deduction-form") : null;
  const currentFormState = currentForm ? {
    visible: !$("deduction-form-panel").hidden,
    id: currentForm.elements.id_potongan.value,
    payrollId: currentForm.elements.id_payroll.value,
    payrollDisabled: currentForm.elements.id_payroll.disabled,
    type: currentForm.elements.jenis_potongan.value,
    amount: currentForm.elements.nominal.value,
    note: currentForm.elements.keterangan.value,
    error: $("deduction-form-error").textContent
  } : null;
  const payrollById = new Map(deductionState.payroll.map((payroll) => [payroll.id_payroll, payroll]));
  const payrollDeductions = new Map();
  for (const row of deductionState.rows) {
    const rows = payrollDeductions.get(row.id_payroll) || [];
    rows.push(row);
    payrollDeductions.set(row.id_payroll, rows);
  }
  const search = deductionState.search.trim().toLocaleLowerCase("id-ID");
  const visibleRows = deductionState.rows.filter((row) => {
    const payroll = payrollById.get(row.id_payroll);
    const person = payroll?.karyawan;
    return (!deductionState.period || String(payroll?.periode || "").startsWith(deductionState.period))
      && (!search || `${person?.nama || ""} ${person?.nik || ""} ${row.jenis_potongan} ${row.keterangan || ""}`.toLocaleLowerCase("id-ID").includes(search));
  });
  const legacyPayroll = deductionState.payroll.filter((payroll) =>
    Number(payroll.potongan || 0) > 0 && !(payrollDeductions.get(payroll.id_payroll) || []).length
      && (!deductionState.period || String(payroll.periode).startsWith(deductionState.period))
      && (!search || `${payroll.karyawan?.nama || ""} ${payroll.karyawan?.nik || ""}`.toLocaleLowerCase("id-ID").includes(search))
  );
  const payrollOptions = deductionState.payroll.filter((payroll) =>
    payroll.status_pembayaran === "Draft" && !deductionState.journaledPayrollIds.has(payroll.id_payroll));
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">PAYROLL</span><h1>Potongan Gaji</h1><p>Kelola rincian potongan per payroll. Total rincian tersimpan atomik ke payroll.potongan dan gaji bersih.</p></div><button class="button button-primary" id="deduction-add"><i data-lucide="plus"></i> Tambah Potongan</button></section><section class="panel panel-pad deduction-form-panel" id="deduction-form-panel" hidden><form id="deduction-form"><input type="hidden" name="id_potongan"><div class="deduction-form-grid"><label class="form-field"><span>Karyawan / Periode Payroll</span><select name="id_payroll" required><option value="">Pilih payroll...</option>${payrollOptions.map((payroll) => `<option value="${esc(payroll.id_payroll)}">${esc(payroll.karyawan?.nama || "Karyawan")} · ${esc(payroll.karyawan?.nik || "")} · ${esc(monthLabel(payroll.periode))} · Gaji kotor ${money(payroll.gaji_kotor)} · Potongan saat ini ${money(payroll.potongan)}</option>`).join("")}</select></label><label class="form-field"><span>Jenis Potongan</span><select name="jenis_potongan" required><option value="">Pilih jenis potongan...</option>${deductionTypes.map((type) => `<option value="${esc(type)}">${esc(type)}</option>`).join("")}</select></label><label class="form-field"><span>Nominal (Rp)</span><input name="nominal" type="number" min="0.01" max="${MAX_DEDUCTION_AMOUNT}" step="0.01" required></label><label class="form-field"><span>Keterangan</span><input name="keterangan" type="text" maxlength="500"></label></div><p class="deduction-legacy-warning" id="deduction-legacy-warning" hidden></p><p class="form-error" id="deduction-form-error" role="alert"></p><div class="modal-actions"><button class="button button-quiet" id="deduction-cancel" type="button">Batal</button><button class="button button-primary" type="submit"><i data-lucide="check"></i> Simpan potongan</button></div></form></section><section class="panel data-panel"><div class="table-toolbar"><span class="table-count"><strong>${visibleRows.length}</strong> rincian potongan</span><div class="table-tools"><label class="search-box"><i data-lucide="search"></i><input id="deduction-search" type="search" value="${esc(deductionState.search)}" placeholder="Cari karyawan atau jenis potongan" aria-label="Cari potongan"></label><label class="filter-box"><span class="sr-only">Filter periode</span><input id="deduction-period" type="month" value="${esc(deductionState.period)}" aria-label="Filter periode"></label></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Karyawan</th><th>Periode</th><th>Jenis Potongan</th><th>Nominal</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>${visibleRows.length ? visibleRows.map((row) => {
    const payroll = payrollById.get(row.id_payroll);
    const linkedLoan = deductionState.linkedLoanDeductionIds.has(row.id_potongan);
    const journalLocked = deductionState.journaledPayrollIds.has(row.id_payroll);
    const locked = linkedLoan || journalLocked;
    const lockText = linkedLoan
      ? "Potongan ini terhubung ke cicilan; perubahan harus melalui workflow pinjaman"
      : deductionState.postedPayrollIds.has(row.id_payroll)
        ? "Payroll sudah diposting ke akuntansi; perubahan dikunci"
        : "Payroll memiliki jurnal Draft; perubahan dikunci agar jurnal tidak kedaluwarsa";
    return `<tr><td><span class="mini-name"><span><strong>${esc(payroll?.karyawan?.nama || "Karyawan tidak ditemukan")}</strong><small>${esc(payroll?.karyawan?.nik || "")}</small></span></span></td><td>${esc(monthLabel(payroll?.periode))}</td><td>${esc(row.jenis_potongan)}${linkedLoan ? `<br>${badge("Cicilan Pinjaman")}` : ""}</td><td class="money-cell">${money(row.nominal)}</td><td>${esc(row.keterangan || "-")}</td><td><div class="row-actions"><button class="icon-button" data-deduction-view="${esc(row.id_potongan)}" aria-label="Lihat potongan"><i data-lucide="eye"></i></button><button class="icon-button" data-deduction-edit="${esc(row.id_potongan)}" aria-label="Edit potongan" ${locked ? `disabled title="${lockText}"` : ""}><i data-lucide="pencil"></i></button><button class="icon-button danger" data-deduction-delete="${esc(row.id_potongan)}" aria-label="Hapus potongan" ${locked ? `disabled title="${lockText}"` : ""}><i data-lucide="trash-2"></i></button></div>${locked ? `<span class="deduction-lock-note">${linkedLoan ? "Dikelola oleh modul kasbon & pinjaman" : deductionState.postedPayrollIds.has(row.id_payroll) ? "Payroll Posted · Terkunci" : "Jurnal Draft · Terkunci"}</span>` : ""}</td></tr>`;
  }).join("") : `<tr><td class="empty-cell" colspan="6">Belum ada rincian potongan yang sesuai filter.</td></tr>`}</tbody></table></div></section><section class="panel panel-pad deduction-legacy-panel"><div class="panel-heading"><div><span class="eyebrow">DATA LAMA DIPERTAHANKAN</span><h2>Potongan belum dirinci</h2></div></div><p class="deduction-legacy-copy">Nilai agregat payroll lama tetap utuh dan tidak ditafsirkan sebagai jenis potongan tertentu. Rinci hanya payroll yang belum memiliki jurnal.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Karyawan</th><th>Periode</th><th>Total lama</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${legacyPayroll.length ? legacyPayroll.map((payroll) => {
    const locked = deductionState.journaledPayrollIds.has(payroll.id_payroll);
    const posted = deductionState.postedPayrollIds.has(payroll.id_payroll);
    return `<tr><td>${esc(payroll.karyawan?.nama || "Karyawan tidak ditemukan")} · ${esc(payroll.karyawan?.nik || "")}</td><td>${esc(monthLabel(payroll.periode))}</td><td class="money-cell">${money(payroll.potongan)}</td><td>${badge("Potongan belum dirinci")} ${locked ? badge(posted ? "Terkunci · Posted" : "Terkunci · Draft") : ""}</td><td>${locked ? `<span class="accounting-hint">${posted ? "Payroll sudah diposting ke akuntansi; perubahan dikunci" : "Jurnal Draft ada; perubahan dikunci agar jurnal tidak kedaluwarsa"}</span>` : `<button class="button button-quiet accounting-small" data-deduction-allocate="${esc(payroll.id_payroll)}">Rinci potongan</button>`}</td></tr>`;
  }).join("") : `<tr><td class="empty-cell" colspan="5">Tidak ada potongan legacy yang belum dirinci pada filter ini.</td></tr>`}</tbody></table></div></section>`;
  if (currentFormState?.visible) {
    const form = $("deduction-form");
    form.elements.id_potongan.value = currentFormState.id;
    form.elements.id_payroll.value = currentFormState.payrollId;
    form.elements.id_payroll.disabled = currentFormState.payrollDisabled;
    form.elements.jenis_potongan.value = currentFormState.type;
    form.elements.nominal.value = currentFormState.amount;
    form.elements.keterangan.value = currentFormState.note;
    $("deduction-form-error").textContent = currentFormState.error;
    $("deduction-form-panel").hidden = false;
    updateDeductionLegacyWarning();
  }
  $("deduction-add").addEventListener("click", () => showDeductionForm());
  $("deduction-search").addEventListener("input", (event) => {
    const cursor = event.target.selectionStart;
    deductionState.search = event.target.value;
    renderPayrollDeductionPage(true);
    $("deduction-search").focus();
    $("deduction-search").setSelectionRange(cursor, cursor);
  });
  $("deduction-period").addEventListener("change", (event) => { deductionState.period = event.target.value; renderPayrollDeductionPage(true); });
  $("deduction-form").addEventListener("submit", (event) => void savePayrollDeduction(event));
  $("deduction-form").elements.id_payroll.addEventListener("change", updateDeductionLegacyWarning);
  $("deduction-cancel").addEventListener("click", () => { $("deduction-form-panel").hidden = true; });
  document.querySelectorAll("[data-deduction-view]").forEach((button) => button.addEventListener("click", () => showDeductionDetail(button.dataset.deductionView)));
  document.querySelectorAll("[data-deduction-edit]").forEach((button) => button.addEventListener("click", () => showDeductionForm(deductionState.rows.find((row) => row.id_potongan === button.dataset.deductionEdit))));
  document.querySelectorAll("[data-deduction-delete]").forEach((button) => button.addEventListener("click", () => void deletePayrollDeduction(button.dataset.deductionDelete)));
  document.querySelectorAll("[data-deduction-allocate]").forEach((button) => button.addEventListener("click", () => showDeductionForm(null, button.dataset.deductionAllocate)));
  icons();
}

async function renderPayrollDeductions() {
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">PAYROLL</span><h1>Potongan Gaji</h1><p>Memuat payroll dan rincian potongan dari Supabase...</p></div></section><section class="panel panel-pad"><p class="slip-loading">Memuat data potongan gaji...</p></section>`;
  await loadDeductionData();
  renderPayrollDeductionPage();
}

function showDeductionForm(row = null, payrollId = "") {
  if (row && deductionState.linkedLoanDeductionIds.has(row.id_potongan)) {
    toast("Potongan cicilan dikelola oleh modul kasbon dan pinjaman.", "error");
    return;
  }
  const form = $("deduction-form");
  form.reset();
  form.elements.id_potongan.value = row?.id_potongan || "";
  form.elements.id_payroll.value = row?.id_payroll || payrollId;
  form.elements.id_payroll.disabled = Boolean(row);
  form.elements.jenis_potongan.value = row?.jenis_potongan || "PPh 21";
  form.elements.nominal.value = row?.nominal ?? "";
  form.elements.keterangan.value = row?.keterangan || "";
  $("deduction-form-error").textContent = "";
  $("deduction-form-panel").hidden = false;
  updateDeductionLegacyWarning();
  $("deduction-form").scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateDeductionLegacyWarning() {
  const form = $("deduction-form");
  const payroll = deductionPayroll(form.elements.id_payroll.value);
  const warning = $("deduction-legacy-warning");
  const existingDetails = deductionState.rows.some((row) => row.id_payroll === payroll?.id_payroll);
  const showWarning = !form.elements.id_potongan.value && !existingDetails && Number(payroll?.potongan || 0) > 0;
  warning.hidden = !showWarning;
  warning.textContent = showWarning
    ? `Payroll ini memiliki potongan lama ${money(payroll.potongan)} tanpa rincian. Menyimpan rincian pertama akan mengganti total agregat dengan jumlah rincian baru; nilai lama tidak akan otomatis dikategorikan.`
    : "";
}

async function savePayrollDeduction(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const payrollId = form.elements.id_payroll.value;
  const payroll = deductionPayroll(payrollId);
  const id = form.elements.id_potongan.value || null;
  const nominal = Number(form.elements.nominal.value);
  if (id && deductionState.linkedLoanDeductionIds.has(id)) {
    $("deduction-form-error").textContent = "Potongan cicilan tidak dapat diedit di sini; gunakan workflow kasbon dan pinjaman.";
    return;
  }
  if (!payroll || !form.elements.jenis_potongan.value || !Number.isFinite(nominal) || nominal <= 0 || nominal > MAX_DEDUCTION_AMOUNT) {
    $("deduction-form-error").textContent = "Pilih payroll dan jenis potongan, lalu masukkan nominal lebih dari Rp0 dan tidak melebihi batas Rp999.999.999.999,99.";
    return;
  }
  if (payroll.status_pembayaran !== "Draft" || deductionState.journaledPayrollIds.has(payrollId)) {
    $("deduction-form-error").textContent = "Rincian hanya dapat diubah pada payroll Draft yang belum memiliki jurnal.";
    return;
  }
  const currentTotal = (deductionState.rows)
    .filter((row) => row.id_payroll === payrollId && row.id_potongan !== id)
    .reduce((sum, row) => sum + Number(row.nominal || 0), 0);
  if (currentTotal + nominal > Number(payroll.gaji_kotor || 0)) {
    $("deduction-form-error").textContent = `Total potongan ${money(currentTotal + nominal)} melebihi gaji kotor ${money(payroll.gaji_kotor)}.`;
    return;
  }
  if (!id && !(deductionState.rows || []).some((row) => row.id_payroll === payrollId) && Number(payroll.potongan || 0) > 0
    && !window.confirm(`Payroll memiliki potongan agregat lama ${money(payroll.potongan)} tanpa rincian. Setelah membuat rincian, payroll.potongan akan menjadi jumlah rincian yang Anda masukkan dan tidak akan dikategorikan otomatis. Lanjutkan?`)) return;

  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  $("deduction-form-error").textContent = "";
  try {
    const { error } = await supabaseClient.schema("public").rpc("save_payroll_potongan", {
      p_id_payroll: payrollId,
      p_jenis_potongan: form.elements.jenis_potongan.value,
      p_nominal: nominal,
      p_keterangan: form.elements.keterangan.value.trim() || null,
      p_id_potongan: id
    });
    if (error) throw error;
    $("deduction-form-panel").hidden = true;
    toast(`Potongan berhasil ${id ? "diperbarui" : "ditambahkan"}; total payroll dihitung ulang.`);
  } catch (error) {
    $("deduction-form-error").textContent = explainError(error);
    toast(explainError(error), "error");
  } finally {
    submit.disabled = false;
  }
  if ($("deduction-form-error").textContent === "") {
    try {
      await renderPayrollDeductions();
    } catch (error) {
      toast(`Perubahan tersimpan, tetapi daftar gagal dimuat ulang: ${explainError(error)}`, "error");
    }
  }
}

async function deletePayrollDeduction(id) {
  const row = deductionState.rows.find((item) => item.id_potongan === id);
  if (deductionState.linkedLoanDeductionIds.has(id)) {
    toast("Potongan cicilan tidak dapat dihapus; gunakan workflow koreksi pinjaman yang sesuai.", "error");
    return;
  }
  if (!row || !window.confirm(`Hapus potongan ${row.jenis_potongan} sebesar ${money(row.nominal)}? Total potongan dan gaji bersih payroll akan dihitung ulang.`)) return;
  try {
    const { error } = await supabaseClient.schema("public").rpc("delete_payroll_potongan", { p_id_potongan: id });
    if (error) throw error;
    toast("Potongan dihapus; total payroll dihitung ulang.");
    await renderPayrollDeductions();
  } catch (error) {
    toast(explainError(error), "error");
    return;
  }
  try {
    await renderPayrollDeductions();
  } catch (error) {
    toast(`Potongan terhapus, tetapi daftar gagal dimuat ulang: ${explainError(error)}`, "error");
  }
}

function showDeductionDetail(id) {
  const row = deductionState.rows.find((item) => item.id_potongan === id);
  const payroll = row ? deductionPayroll(row.id_payroll) : null;
  if (!row) return;
  $("detail-eyebrow").textContent = "RINCIAN POTONGAN";
  $("detail-title").textContent = row.jenis_potongan;
  $("print-slip").hidden = true;
  $("detail-content").innerHTML = `<div class="record-detail-grid"><div class="record-detail-item"><span>Karyawan</span><strong>${esc(payroll?.karyawan?.nama || "-")} · ${esc(payroll?.karyawan?.nik || "")}</strong></div><div class="record-detail-item"><span>Periode</span><strong>${esc(monthLabel(payroll?.periode))}</strong></div><div class="record-detail-item"><span>Jenis Potongan</span><strong>${esc(row.jenis_potongan)}</strong></div><div class="record-detail-item"><span>Nominal</span><strong>${money(row.nominal)}</strong></div><div class="record-detail-item record-detail-wide"><span>Keterangan</span><strong>${esc(row.keterangan || "-")}</strong></div></div>`;
  $("detail-backdrop").hidden = false;
  icons();
}

// Source: js/payroll-loans.js
const payrollLoanState = {
  loans: [],
  installments: [],
  roles: [],
  payroll: [],
  journaledPayrollIds: new Set(),
  payrollJournalStatuses: new Map(),
  actorId: "",
  actorRole: "",
  search: "",
  employee: "",
  jenis: "",
  status: "",
  period: ""
};

async function loadPayrollLoanActors() {
  const { data, error } = await supabaseClient
    .from("payroll_pinjaman_roles")
    .select("id_karyawan,role,is_active")
    .eq("is_active", true)
    .order("role");
  if (error) throw error;
  payrollLoanState.roles = data || [];
  if (!payrollLoanState.roles.some((role) => role.id_karyawan === payrollLoanState.actorId && role.role === payrollLoanState.actorRole)) {
    const defaultRole = payrollLoanState.roles.find((role) => role.role === "Employee") || payrollLoanState.roles[0];
    payrollLoanState.actorId = defaultRole?.id_karyawan || "";
    payrollLoanState.actorRole = defaultRole?.role || "";
  }
}

function payrollLoanActorMarkup() {
  const actors = payrollLoanState.roles.map((role) => {
    const person = state.employees.find((employee) => employee.id_karyawan === role.id_karyawan);
    if (!person) return "";
    const value = `${role.id_karyawan}::${role.role}`;
    return `<option value="${esc(value)}" ${role.id_karyawan === payrollLoanState.actorId && role.role === payrollLoanState.actorRole ? "selected" : ""}>${esc(person.nama)} · ${esc(role.role)}</option>`;
  }).join("");
  return `<label class="loan-actor"><span>Actor simulasi</span><select id="loan-actor" aria-label="Actor simulasi workflow">${actors || '<option value="">Belum ada role terdaftar</option>'}</select></label>`;
}

function payrollAdminActorMarkup() {
  const actors = payrollLoanState.roles.filter((role) => role.role === "HR/Admin").map((role) => {
    const person = state.employees.find((employee) => employee.id_karyawan === role.id_karyawan);
    if (!person) return "";
    return `<option value="${esc(role.id_karyawan)}" ${role.id_karyawan === payrollLoanState.actorId ? "selected" : ""}>${esc(person.nama)} · HR/Admin</option>`;
  }).join("");
  return `<label class="loan-actor"><span>Actor payroll (simulasi)</span><select id="payroll-actor" aria-label="Actor payroll simulasi">${actors || '<option value="">Belum ada role HR/Admin</option>'}</select></label>`;
}

function payrollLoanActorRole(actorId = payrollLoanState.actorId) {
  return payrollLoanState.roles.some((role) => role.id_karyawan === actorId && role.role === payrollLoanState.actorRole)
    ? payrollLoanState.actorRole
    : "";
}

async function loadPayrollLoanData() {
  const results = await Promise.all([
    supabaseClient.from("payroll_pinjaman").select("*,karyawan:karyawan!payroll_pinjaman_karyawan_fk(nama,nik,jabatan,unit_kerja)").order("created_at", { ascending: false }),
    supabaseClient.from("payroll_pinjaman_cicilan").select("*").order("periode_payroll"),
    supabaseClient.from("payroll_pinjaman_audit").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("payroll_pinjaman_pembatalan").select("*").order("tanggal_pengajuan", { ascending: false }),
    supabaseClient.from("payroll").select("id_payroll,id_karyawan,periode,status_pembayaran,potongan,gaji_bersih"),
    supabaseClient.from("journal_entries").select("source_payroll_id,status").not("source_payroll_id", "is", null)
  ]);
  for (const result of results) if (result.error) throw result.error;
  payrollLoanState.loans = results[0].data || [];
  payrollLoanState.installments = results[1].data || [];
  payrollLoanState.audit = results[2].data || [];
  payrollLoanState.cancellations = results[3].data || [];
  payrollLoanState.payroll = results[4].data || [];
  payrollLoanState.journaledPayrollIds = new Set((results[5].data || []).map((entry) => entry.source_payroll_id));
  payrollLoanState.payrollJournalStatuses = new Map((results[5].data || []).map((entry) => [entry.source_payroll_id, entry.status]));
}

function loanMonthLabel(value) {
  return value ? monthLabel(value) : "-";
}

function loanInstallments(id) {
  return payrollLoanState.installments.filter((item) => item.id_pinjaman === id);
}

function loanAudit(id) {
  return (payrollLoanState.audit || []).filter((item) => item.id_pinjaman === id);
}

function loanPayrollSummary(id) {
  if (!id) return "-";
  const payroll = payrollLoanState.payroll.find((item) => item.id_payroll === id);
  if (!payroll) return `${id} · payroll tidak ditemukan`;
  const journalStatus = payrollLoanState.payrollJournalStatuses.get(id);
  return `${loanMonthLabel(payroll.periode)} · ${payroll.status_pembayaran}${journalStatus ? ` · jurnal ${journalStatus}` : ""} · total potongan ${money(payroll.potongan)} · bersih ${money(payroll.gaji_bersih)}`;
}

function loanOpenPeriods(employeeId) {
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const currentPeriod = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  return [...new Set(payrollLoanState.payroll
    .filter((item) => item.id_karyawan === employeeId
      && item.status_pembayaran === "Draft"
      && !payrollLoanState.journaledPayrollIds.has(item.id_payroll)
      && typeof item.periode === "string"
      && item.periode.slice(0, 7) >= currentPeriod)
    .map((item) => item.periode.slice(0, 7))
  )].sort();
}

function loanHasPeriod(loan, period) {
  return loanInstallments(loan.id_pinjaman).some((item) => item.periode_payroll?.slice(0, 7) === period);
}

function filteredPayrollLoans() {
  const query = payrollLoanState.search.trim().toLocaleLowerCase("id-ID");
  return payrollLoanState.loans.filter((loan) => {
    const text = `${loan.karyawan?.nama || ""} ${loan.karyawan?.nik || ""} ${loan.jenis} ${loan.status} ${loan.status_pembatalan}`.toLocaleLowerCase("id-ID");
    return (!query || text.includes(query))
      && (!payrollLoanState.employee || loan.id_karyawan === payrollLoanState.employee)
      && (!payrollLoanState.jenis || loan.jenis === payrollLoanState.jenis)
      && (!payrollLoanState.period || loanHasPeriod(loan, payrollLoanState.period))
      && (!payrollLoanState.status || loan.status === payrollLoanState.status);
  });
}

function filteredLoanInstallments() {
  return payrollLoanState.installments.filter((item) => {
    const loan = payrollLoanState.loans.find((entry) => entry.id_pinjaman === item.id_pinjaman);
    return loan
      && (!payrollLoanState.employee || loan.id_karyawan === payrollLoanState.employee)
      && (!payrollLoanState.jenis || loan.jenis === payrollLoanState.jenis)
      && (!payrollLoanState.status || loan.status === payrollLoanState.status)
      && (!payrollLoanState.period || item.periode_payroll.slice(0, 7) === payrollLoanState.period);
  });
}

function loanActionButton(action, id, label, icon, danger = false) {
  return `<button class="icon-button ${danger ? "danger" : ""}" data-loan-action="${action}" data-loan-id="${esc(id)}" aria-label="${esc(label)}" title="${esc(label)}"><i data-lucide="${icon}"></i></button>`;
}

function loanActions(loan) {
  const actions = [loanActionButton("detail", loan.id_pinjaman, "Lihat detail", "eye")];
  const actorRole = payrollLoanActorRole();
  const cancellationPending = loan.status_pembatalan === "Menunggu Persetujuan";
  const canEdit = loan.status === "Diajukan" && !cancellationPending
    && (actorRole === "HR/Admin" || (actorRole === "Employee" && payrollLoanState.actorId === loan.pemohon_id));
  if (canEdit) actions.push(loanActionButton("edit", loan.id_pinjaman, "Ubah pengajuan", "pencil"));
  const canDecide = ["HR/Admin", "Approver"].includes(actorRole)
    && loan.status === "Diajukan"
    && !cancellationPending
    && payrollLoanState.actorId !== loan.pemohon_id;
  if (canDecide) {
    actions.push(loanActionButton("approve", loan.id_pinjaman, "Setujui", "check"));
    actions.push(loanActionButton("reject", loan.id_pinjaman, "Tolak", "x", true));
  }
  if (["HR/Admin", "Approver"].includes(actorRole) && loan.status === "Disetujui"
    && !cancellationPending
    && payrollLoanState.actorId !== loan.pemohon_id) {
    actions.push(loanActionButton("disburse", loan.id_pinjaman, "Cairkan dan jadwalkan cicilan", "banknote"));
  }
  const canRequestCancel = !cancellationPending
    && ["Diajukan", "Disetujui"].includes(loan.status)
    && !loan.tanggal_pencairan
    && !loanInstallments(loan.id_pinjaman).length
    && (actorRole === "HR/Admin" || (actorRole === "Employee" && payrollLoanState.actorId === loan.id_karyawan));
  if (canRequestCancel) {
    actions.push(loanActionButton("request-cancel", loan.id_pinjaman, "Ajukan pembatalan", "ban", true));
  }
  if (["HR/Admin", "Approver"].includes(actorRole)
    && loan.status_pembatalan === "Menunggu Persetujuan"
    && payrollLoanState.actorId !== loan.pemohon_pembatalan_id) {
    actions.push(loanActionButton("approve-cancel", loan.id_pinjaman, "Setujui pembatalan", "check-check"));
    actions.push(loanActionButton("reject-cancel", loan.id_pinjaman, "Tolak pembatalan", "x", true));
  }
  return `<div class="row-actions">${actions.join("")}</div>`;
}

function renderPayrollLoansPage() {
  const loans = filteredPayrollLoans();
  const installments = filteredLoanInstallments();
  const totalBalance = payrollLoanState.loans
    .filter((item) => item.status !== "Dibatalkan")
    .reduce((sum, item) => sum + Number(item.sisa_saldo || 0), 0);
  const waiting = payrollLoanState.loans.filter((item) => item.status === "Diajukan").length;
  const pendingCancel = payrollLoanState.loans.filter((item) => item.status_pembatalan === "Menunggu Persetujuan").length;
  const canCreate = ["Employee", "HR/Admin"].includes(payrollLoanActorRole());
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">PAYROLL</span><h1>Kasbon &amp; Pinjaman</h1><p>Pengajuan, persetujuan, pencairan, cicilan payroll, dan pembatalan yang tercatat.</p></div>${canCreate ? '<button class="button button-primary" id="loan-create"><i data-lucide="plus"></i> Ajukan pinjaman</button>' : ""}</section>
    <div class="loan-simulation-notice"><strong>Simulasi workflow internal</strong><span>Pemilihan actor dan role belum merupakan authentication atau keamanan identitas. Database memvalidasi role, pemisahan pemohon/approver, dan status alur. Jangan gunakan sebagai otorisasi produksi sebelum Supabase Auth diintegrasikan.</span></div>
    <section class="loan-toolbar panel panel-pad"><div>${payrollLoanActorMarkup()}</div><p>Actor aktif: <strong>${esc(payrollLoanActorRole() || "Belum diprovisi")}</strong>. Role HR/Admin dan Approver disiapkan melalui provision role administratif.</p></section>
    <section class="metric-grid loan-metrics">${metricCard("Pengajuan", payrollLoanState.loans.length, "Seluruh data pinjaman", "hand-coins")}${metricCard("Saldo pinjaman aktif", totalBalance, "Tidak termasuk pinjaman yang dibatalkan", "wallet", "metric-blue", true)}${metricCard("Menunggu keputusan", waiting, "Pengajuan baru", "clock-3", "metric-gold")}${metricCard("Pembatalan menunggu", pendingCancel, "Perlu approval terpisah", "shield-alert", "metric-purple")}</section>
    <section class="panel data-panel"><div class="table-toolbar"><span class="table-count"><strong>${loans.length}</strong> pinjaman</span><div class="table-tools"><label class="search-box"><i data-lucide="search"></i><input id="loan-search" type="search" value="${esc(payrollLoanState.search)}" placeholder="Cari karyawan, jenis, atau status" aria-label="Cari pinjaman"></label><label class="filter-box"><span class="sr-only">Filter karyawan</span><select id="loan-employee" aria-label="Filter karyawan"><option value="">Semua Karyawan</option>${state.employees.map((employee) => `<option value="${esc(employee.id_karyawan)}" ${payrollLoanState.employee === employee.id_karyawan ? "selected" : ""}>${esc(employee.nama)} · ${esc(employee.nik)}</option>`).join("")}</select></label><label class="filter-box"><span class="sr-only">Filter jenis pinjaman</span><select id="loan-type" aria-label="Filter jenis pinjaman"><option value="">Semua Jenis</option>${["Kasbon","Pinjaman"].map((jenis) => `<option value="${jenis}" ${payrollLoanState.jenis === jenis ? "selected" : ""}>${jenis}</option>`).join("")}</select></label><label class="filter-box"><span class="sr-only">Filter status pinjaman</span><select id="loan-status" aria-label="Filter status pinjaman"><option value="">Semua Status Pinjaman</option>${["Diajukan","Disetujui","Ditolak","Dicairkan","Berjalan","Lunas","Dibatalkan"].map((status) => `<option value="${status}" ${payrollLoanState.status === status ? "selected" : ""}>${status}</option>`).join("")}</select></label><label class="filter-box"><span class="sr-only">Filter periode cicilan</span><input id="loan-period" type="month" value="${esc(payrollLoanState.period)}" aria-label="Filter periode cicilan"></label></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Karyawan</th><th>Jenis</th><th>Pengajuan</th><th>Disetujui</th><th>Tenor</th><th>Cicilan / bulan</th><th>Terbayar</th><th>Sisa Saldo</th><th>Status</th><th>Tanggal Pengajuan</th><th>Aksi</th></tr></thead><tbody>${loans.length ? loans.map((loan) => `<tr><td><span class="mini-name"><span><strong>${esc(loan.karyawan?.nama || "-")}</strong><small>${esc(loan.karyawan?.nik || "")}</small></span></span></td><td>${esc(loan.jenis)}</td><td class="money-cell">${money(loan.nominal_pengajuan)}</td><td class="money-cell">${loan.nominal_disetujui == null ? "-" : money(loan.nominal_disetujui)}</td><td>${numeric(loan.tenor)} bulan</td><td class="money-cell">${loan.angsuran_per_bulan == null ? "-" : money(loan.angsuran_per_bulan)}</td><td class="money-cell">${money(loan.total_terbayar)}</td><td class="money-cell">${money(loan.sisa_saldo)}</td><td>${badge(loan.status)}${loan.status_pembatalan !== "Tidak Ada" ? `<br>${badge(loan.status_pembatalan)}` : ""}</td><td>${esc(dateLabel(loan.tanggal_pengajuan))}</td><td>${loanActions(loan)}</td></tr>`).join("") : '<tr><td class="empty-cell" colspan="11">Belum ada pinjaman yang sesuai filter.</td></tr>'}</tbody></table></div></section>
    <section class="panel data-panel"><div class="panel-heading"><div><span class="eyebrow">RINGKASAN CICILAN</span><h2>Jadwal dan riwayat pembayaran</h2><p>Cicilan Dibayar dan transaksi payroll tidak dihapus. Pembatalan hanya tersedia sebelum pencairan.</p></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Karyawan</th><th>Jenis</th><th>Nomor</th><th>Periode</th><th>Nominal</th><th>Status</th><th>Payroll terkait</th><th>Tanggal Bayar</th></tr></thead><tbody>${installments.length ? installments.map((item) => { const loan = payrollLoanState.loans.find((entry) => entry.id_pinjaman === item.id_pinjaman); return `<tr><td>${esc(loan?.karyawan?.nama || "-")}</td><td>${esc(loan?.jenis || "-")}</td><td>${item.nomor_cicilan}</td><td>${esc(loanMonthLabel(item.periode_payroll))}</td><td class="money-cell">${money(item.nominal_cicilan)}</td><td>${badge(item.status)}</td><td>${esc(loanPayrollSummary(item.id_payroll))}</td><td>${esc(dateLabel(item.tanggal_pembayaran))}</td></tr>`; }).join("") : `<tr><td class="empty-cell" colspan="8">${payrollLoanState.installments.length ? "Tidak ada cicilan yang sesuai filter." : "Jadwal cicilan akan tampil setelah pinjaman disetujui dan dicairkan."}</td></tr>`}</tbody></table></div></section>`;
  $("loan-actor")?.addEventListener("change", (event) => {
    [payrollLoanState.actorId, payrollLoanState.actorRole] = event.target.value.split("::");
    void renderPayrollLoans();
  });
  $("loan-search").addEventListener("input", (event) => { payrollLoanState.search = event.target.value; renderPayrollLoansPage(); });
  $("loan-employee").addEventListener("change", (event) => { payrollLoanState.employee = event.target.value; renderPayrollLoansPage(); });
  $("loan-type").addEventListener("change", (event) => { payrollLoanState.jenis = event.target.value; renderPayrollLoansPage(); });
  $("loan-status").addEventListener("change", (event) => { payrollLoanState.status = event.target.value; renderPayrollLoansPage(); });
  $("loan-period").addEventListener("change", (event) => { payrollLoanState.period = event.target.value; renderPayrollLoansPage(); });
  $("loan-create")?.addEventListener("click", () => showPayrollLoanForm());
  $("page-content").querySelector(".data-panel").addEventListener("click", (event) => void handlePayrollLoanAction(event));
  icons();
}

async function renderPayrollLoans() {
  $("page-content").innerHTML = '<section class="panel panel-pad"><p class="slip-loading">Memuat data kasbon dan pinjaman...</p></section>';
  await loadEmployees();
  await Promise.all([loadPayrollLoanActors(), loadPayrollLoanData()]);
  renderPayrollLoansPage();
}

function showPayrollLoanForm(loan = null) {
  const canApplyForOthers = ["HR/Admin"].includes(payrollLoanActorRole());
  if (!["Employee", "HR/Admin"].includes(payrollLoanActorRole())
    || (payrollLoanActorRole() === "Employee" && loan && loan.pemohon_id !== payrollLoanState.actorId)) {
    toast("Role aktif tidak berwenang mengajukan atau mengubah pinjaman ini.", "error");
    return;
  }
  const employee = state.employees.find((item) => item.id_karyawan === (loan?.id_karyawan || payrollLoanState.actorId));
  const options = state.employees.filter((item) => item.id_karyawan === employee?.id_karyawan
    || (!loan && item.status_aktif === "Aktif" && canApplyForOthers))
    .map((item) => `<option value="${esc(item.id_karyawan)}" ${item.id_karyawan === employee?.id_karyawan ? "selected" : ""}>${esc(item.nama)} · ${esc(item.nik)}</option>`).join("");
  $("detail-eyebrow").textContent = "PENGAJUAN";
  $("detail-title").textContent = loan ? "Ubah pengajuan pinjaman" : "Ajukan kasbon atau pinjaman";
  $("detail-cancel").textContent = "Tutup";
  $("print-slip").hidden = true;
  $("detail-content").innerHTML = `<form id="loan-application-form" class="loan-form" data-loan-id="${esc(loan?.id_pinjaman || "")}"><label class="form-field"><span>Karyawan</span><select name="id_karyawan" required ${loan ? "disabled" : ""}>${options}</select></label><label class="form-field"><span>Jenis</span><select name="jenis" required><option ${loan?.jenis === "Kasbon" ? "selected" : ""}>Kasbon</option><option ${loan?.jenis === "Pinjaman" ? "selected" : ""}>Pinjaman</option></select></label><label class="form-field"><span>Nominal pengajuan (Rp)</span><input name="nominal" type="number" min="0.01" max="999999999999.99" step="0.01" value="${esc(loan?.nominal_pengajuan ?? "")}" required></label><label class="form-field"><span>Tenor yang diajukan (bulan)</span><input name="tenor" type="number" min="1" max="600" step="1" value="${esc(loan?.tenor ?? 1)}" required></label><label class="form-field field-wide"><span>Keterangan</span><textarea name="keterangan" maxlength="1000">${esc(loan?.keterangan || "")}</textarea></label><p class="form-error field-wide" id="loan-form-error" role="alert"></p></form>`;
  $("detail-backdrop").hidden = false;
  $("detail-content").insertAdjacentHTML("beforeend", '<div class="modal-actions"><button class="button button-quiet" id="loan-form-cancel" type="button">Batal</button><button class="button button-primary" id="loan-form-submit" type="submit" form="loan-application-form"><i data-lucide="send"></i> Ajukan</button></div>');
  $("loan-application-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void submitPayrollLoan();
  });
  $("loan-form-cancel").addEventListener("click", () => { $("detail-backdrop").hidden = true; });
  $("loan-form-submit").textContent = loan ? "Simpan perubahan" : "Ajukan";
  icons();
}

async function submitPayrollLoan() {
  const form = $("loan-application-form");
  if (!form.reportValidity()) return;
  const amount = Number(form.elements.nominal.value);
  const term = Number(form.elements.tenor.value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999.99
    || !Number.isInteger(term) || term < 1 || term > 600) {
    $("loan-form-error").textContent = "Nominal atau tenor tidak memenuhi batas yang diizinkan.";
    return;
  }
  try {
    const loanId = form.dataset.loanId || "";
    const rpc = loanId ? "update_payroll_pinjaman" : "create_payroll_pinjaman";
    const args = {
      p_actor: payrollLoanState.actorId,
      p_jenis: form.elements.jenis.value,
      p_nominal_pengajuan: amount,
      p_tenor: term,
      p_keterangan: form.elements.keterangan.value.trim() || null
    };
    if (loanId) args.p_id_pinjaman = loanId;
    else args.p_id_karyawan = form.elements.id_karyawan.value;
    const { error } = await supabaseClient.rpc(rpc, args);
    if (error) throw error;
    $("detail-backdrop").hidden = true;
    toast(loanId ? "Pengajuan pinjaman diperbarui." : "Pengajuan pinjaman berhasil dicatat.");
    await renderPayrollLoans();
  } catch (error) {
    $("loan-form-error").textContent = explainError(error);
    toast(explainError(error), "error");
  }
}

function showLoanDetail(loan) {
  const installments = loanInstallments(loan.id_pinjaman);
  const audits = loanAudit(loan.id_pinjaman);
  const cancellations = payrollLoanState.cancellations.filter((item) => item.id_pinjaman === loan.id_pinjaman);
  $("detail-cancel").textContent = "Tutup";
  $("detail-eyebrow").textContent = "RINCIAN & AUDIT";
  $("detail-title").textContent = `${loan.jenis} · ${loan.karyawan?.nama || "Karyawan"}`;
  $("print-slip").hidden = true;
  $("detail-content").innerHTML = `<div class="record-detail-grid"><div class="record-detail-item"><span>Status</span><strong>${badge(loan.status)}</strong></div><div class="record-detail-item"><span>Status pembatalan</span><strong>${badge(loan.status_pembatalan)}</strong></div><div class="record-detail-item"><span>Tanggal pengajuan</span><strong>${esc(dateLabel(loan.tanggal_pengajuan))}</strong></div><div class="record-detail-item"><span>Tanggal persetujuan</span><strong>${esc(dateLabel(loan.tanggal_disetujui))}</strong></div><div class="record-detail-item"><span>Tanggal pencairan</span><strong>${esc(dateLabel(loan.tanggal_pencairan))}</strong></div><div class="record-detail-item"><span>Periode cicilan pertama</span><strong>${esc(loanMonthLabel(loan.periode_cicilan_pertama))}</strong></div><div class="record-detail-item"><span>Nominal pengajuan</span><strong>${money(loan.nominal_pengajuan)}</strong></div><div class="record-detail-item"><span>Nominal disetujui</span><strong>${loan.nominal_disetujui == null ? "-" : money(loan.nominal_disetujui)}</strong></div><div class="record-detail-item"><span>Tenor / Angsuran</span><strong>${loan.tenor} bulan · ${money(loan.angsuran_per_bulan)}</strong></div><div class="record-detail-item"><span>Terbayar / Sisa</span><strong>${money(loan.total_terbayar)} / ${money(loan.sisa_saldo)}</strong></div><div class="record-detail-item"><span>Pemohon</span><strong>${esc(state.employees.find((item) => item.id_karyawan === loan.pemohon_id)?.nama || "-")}</strong></div><div class="record-detail-item"><span>Approver pinjaman</span><strong>${esc(state.employees.find((item) => item.id_karyawan === loan.disetujui_oleh)?.nama || "-")}</strong></div><div class="record-detail-item"><span>Alasan pembatalan terakhir</span><strong>${esc(loan.alasan_pembatalan || "-")}</strong></div><div class="record-detail-item"><span>Catatan persetujuan terakhir</span><strong>${esc(loan.catatan_persetujuan || "-")}</strong></div></div><div class="loan-detail-section"><h3>Permintaan pembatalan (riwayat)</h3>${cancellations.length ? `<ol class="loan-audit-list">${cancellations.map((item) => `<li><strong>${badge(item.status_persetujuan)} · ${esc(item.alasan_pembatalan)}</strong><span>${esc(dateLabel(item.tanggal_pengajuan))} · Pemohon: ${esc(state.employees.find((person) => person.id_karyawan === item.pemohon_id)?.nama || "-")} · Approver: ${esc(state.employees.find((person) => person.id_karyawan === item.approver_id)?.nama || "Belum diproses")}</span><small>${esc(item.catatan_approver || "Tanpa catatan approver")}</small></li>`).join("")}</ol>` : "<p>Belum ada permintaan pembatalan.</p>"}</div><div class="loan-detail-section"><h3>Jadwal dan transaksi cicilan</h3>${installments.length ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Nomor</th><th>Periode</th><th>Nominal</th><th>Status</th><th>Payroll terkait</th><th>Tanggal bayar</th></tr></thead><tbody>${installments.map((item) => `<tr><td>${item.nomor_cicilan}</td><td>${esc(loanMonthLabel(item.periode_payroll))}</td><td>${money(item.nominal_cicilan)}</td><td>${badge(item.status)}</td><td>${esc(loanPayrollSummary(item.id_payroll))}</td><td>${esc(dateLabel(item.tanggal_pembayaran))}</td></tr>`).join("")}</tbody></table></div>` : "<p>Belum ada cicilan terjadwal.</p>"}</div><div class="loan-detail-section"><h3>Audit trail</h3>${audits.length ? `<ol class="loan-audit-list">${audits.map((item) => `<li><strong>${esc(item.event_type)}</strong><span>${esc(dateLabel(item.created_at))} · ${esc(state.employees.find((person) => person.id_karyawan === item.actor_id)?.nama || "Sistem")} · ${esc(item.actor_role || "System")}</span><small>${esc(JSON.stringify(item.details || {}))}</small></li>`).join("")}</ol>` : "<p>Belum ada aktivitas.</p>"}</div>`;
  $("detail-backdrop").hidden = false;
  icons();
}

function showLoanWorkflowDialog(loan, action) {
  const approved = action === "approve";
  const rejected = action === "reject";
  const disbursing = action === "disburse";
  const requestingCancel = action === "request-cancel";
  const approvingCancel = action === "approve-cancel";
  const periods = disbursing ? loanOpenPeriods(loan.id_karyawan) : [];
  const title = approved ? "Setujui pengajuan"
    : rejected ? "Tolak pengajuan"
      : disbursing ? "Cairkan pinjaman"
        : requestingCancel ? "Ajukan pembatalan"
          : approvingCancel ? "Setujui pembatalan"
            : "Tolak pembatalan";
  let fields = "";

  if (approved) {
    fields = `<label class="form-field"><span>Nominal disetujui (Rp)</span><input name="nominal" type="number" min="0.01" max="${Number(loan.nominal_pengajuan)}" step="0.01" value="${Number(loan.nominal_pengajuan)}" required></label><label class="form-field"><span>Tenor (bulan)</span><input name="tenor" type="number" min="1" max="600" step="1" value="${Number(loan.tenor)}" required></label><label class="form-field field-wide"><span>Catatan approver (opsional)</span><textarea name="note" rows="3" maxlength="1000"></textarea></label>`;
  } else if (rejected) {
    fields = `<label class="form-field field-wide"><span>Alasan penolakan</span><textarea name="note" rows="4" maxlength="1000" required></textarea></label>`;
  } else if (disbursing) {
    fields = periods.length
      ? `<label class="form-field field-wide"><span>Periode cicilan pertama</span><select name="period" required>${periods.map((period) => `<option value="${esc(period)}" ${period === periods[0] ? "selected" : ""}>${esc(loanMonthLabel(`${period}-01`))} · payroll Draft tanpa jurnal</option>`).join("")}</select><small class="loan-field-help">Periode berikutnya hanya dapat dipilih jika payroll karyawan ini sudah tersedia sebagai Draft dan belum memiliki jurnal. Cicilan selanjutnya mengikuti bulan berikutnya sesuai tenor.</small></label>`
      : `<div class="loan-action-notice field-wide" role="status">Belum ada payroll Draft tanpa jurnal untuk karyawan ini pada periode berjalan atau berikutnya. Buat payroll melalui alur yang berlaku, lalu coba pencairan kembali.</div>`;
  } else if (requestingCancel) {
    fields = `<label class="form-field field-wide"><span>Alasan pembatalan</span><textarea name="note" rows="4" maxlength="1000" required></textarea></label>`;
  } else {
    fields = `<label class="form-field field-wide"><span>Catatan approver${approvingCancel ? " (opsional)" : ""}</span><textarea name="note" rows="4" maxlength="1000" ${approvingCancel ? "" : "required"}></textarea></label>`;
  }

  $("detail-cancel").textContent = "Batal";
  $("detail-eyebrow").textContent = "WORKFLOW PINJAMAN";
  $("detail-title").textContent = title;
  $("print-slip").hidden = true;
  $("detail-content").innerHTML = `<form id="loan-workflow-form" class="loan-action-form" data-action="${action}" data-loan-id="${esc(loan.id_pinjaman)}"><p class="loan-action-intro">${esc(loan.jenis)} · ${esc(loan.karyawan?.nama || "Karyawan")} · ${money(loan.nominal_disetujui ?? loan.nominal_pengajuan)}</p><div class="loan-form">${fields}</div><p class="form-error" id="loan-action-error" role="alert"></p><div class="modal-actions"><button class="button button-primary" type="submit" ${disbursing && !periods.length ? "disabled" : ""}>${esc(title)}</button></div></form>`;
  $("detail-backdrop").hidden = false;
  const form = $("loan-workflow-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submitLoanWorkflowAction(event, loan, action);
  });
  if (approved) {
    const amountInput = form.elements.nominal;
    const termInput = form.elements.tenor;
    const updateTermLimit = () => {
      const amount = Number(amountInput.value);
      termInput.max = String(Math.max(1, Math.min(600, Math.floor(amount * 100))));
    };
    amountInput.addEventListener("input", updateTermLimit);
    updateTermLimit();
  }
  icons();
}

async function submitLoanWorkflowAction(event, loan, action) {
  const form = event.currentTarget;
  const submit = form.querySelector('button[type="submit"]');
  const errorMessage = $("loan-action-error");
  const formData = new FormData(form);
  const note = String(formData.get("note") || "").trim();
  let rpc;
  let args;

  if (action === "approve" || action === "reject") {
    const approved = action === "approve";
    const nominal = approved ? Number(formData.get("nominal")) : null;
    const tenor = approved ? Number(formData.get("tenor")) : null;
    if (approved && (!Number.isFinite(nominal) || nominal <= 0 || nominal > Number(loan.nominal_pengajuan))) {
      errorMessage.textContent = "Nominal persetujuan harus lebih dari nol dan tidak boleh melebihi nominal pengajuan.";
      return;
    }
    if (approved && (!Number.isInteger(tenor) || tenor <= 0 || tenor > 600 || tenor > Math.floor(nominal * 100))) {
      errorMessage.textContent = "Tenor persetujuan harus bilangan bulat yang sesuai batas nominal dan paling banyak 600 bulan.";
      return;
    }
    rpc = "decide_payroll_pinjaman";
    args = {
      p_id_pinjaman: loan.id_pinjaman,
      p_actor: payrollLoanState.actorId,
      p_disetujui: approved,
      p_nominal_disetujui: nominal,
      p_tenor: tenor,
      p_catatan: note || null
    };
  } else if (action === "disburse") {
    const period = String(formData.get("period") || "");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period) || !loanOpenPeriods(loan.id_karyawan).includes(period)) {
      errorMessage.textContent = "Pilih periode payroll Draft tanpa jurnal yang tersedia untuk karyawan ini.";
      return;
    }
    rpc = "disburse_payroll_pinjaman";
    args = {
      p_id_pinjaman: loan.id_pinjaman,
      p_actor: payrollLoanState.actorId,
      p_periode_pertama: `${period}-01`
    };
  } else if (action === "request-cancel") {
    if (!note) {
      errorMessage.textContent = "Alasan pembatalan wajib diisi.";
      return;
    }
    rpc = "request_cancel_payroll_pinjaman";
    args = { p_id_pinjaman: loan.id_pinjaman, p_actor: payrollLoanState.actorId, p_alasan: note };
  } else {
    const approve = action === "approve-cancel";
    if (!approve && !note) {
      errorMessage.textContent = "Catatan penolakan wajib diisi.";
      return;
    }
    rpc = "decide_cancel_payroll_pinjaman";
    args = {
      p_id_pinjaman: loan.id_pinjaman,
      p_actor: payrollLoanState.actorId,
      p_setujui: approve,
      p_catatan: note || null
    };
  }

  submit.disabled = true;
  errorMessage.textContent = "";
  try {
    const { error } = await supabaseClient.rpc(rpc, args);
    if (error) throw error;
    $("detail-backdrop").hidden = true;
    if (action === "approve" || action === "reject") {
      toast(`Pengajuan pinjaman ${action === "approve" ? "disetujui" : "ditolak"}.`);
    } else if (action === "disburse") {
      toast("Pinjaman dicairkan dan jadwal cicilan dibuat.");
    } else if (action === "request-cancel") {
      toast("Pembatalan diajukan dan menunggu persetujuan.");
    } else {
      toast(action === "approve-cancel"
        ? "Pembatalan disetujui; pengajuan dibatalkan tanpa menghapus histori."
        : "Pembatalan ditolak; status pinjaman tetap.");
    }
    await renderPayrollLoans();
  } catch (error) {
    errorMessage.textContent = explainError(error);
    toast(explainError(error), "error");
  } finally {
    submit.disabled = false;
  }
}

async function handlePayrollLoanAction(event) {
  const button = event.target.closest("[data-loan-action]");
  if (!button) return;
  const loan = payrollLoanState.loans.find((item) => item.id_pinjaman === button.dataset.loanId);
  if (!loan) return;
  const action = button.dataset.loanAction;
  if (action === "detail") { showLoanDetail(loan); return; }
  if (action === "edit") { showPayrollLoanForm(loan); return; }
  showLoanWorkflowDialog(loan, action);
}

// Source: js/app.js

const configs = Object.fromEntries([karyawanConfig, absensiConfig, lemburConfig, kinerjaConfig, payrollConfig].map((item) => [item.key, item]));
const labels = { dashboard: "Dashboard", ...Object.fromEntries(Object.values(configs).map((item) => [item.key, item.title])), "payroll-deductions": "Potongan Gaji", "payroll-loans": "Kasbon & Pinjaman", laporan: "Laporan", "accounting-dashboard": "Dashboard Akuntansi", accounts: "Daftar Akun", journals: "Jurnal", ledger: "Buku Besar", "income-statement": "Laba Rugi", "balance-sheet": "Posisi Keuangan" };
const state = { view: "dashboard", rows: [], employees: [], payrollDeductionDetails: [], cashAccounts: [], payrollJournals: {}, payrollJournalStatusAvailable: false, payrollWorkflowReady: false, accountingReady: false, search: "", filters: {}, date: "", reportType: "payroll", reportPeriod: new Date().toISOString().slice(0, 7), reportUnit: "", reportEmployee: "", reportStatus: "", reportRows: [], editing: null, compact: false };
let queuedView = null;
let isRenderingView = false;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
const numeric = (value) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value || 0));
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const currentMonth = () => today().slice(0, 7);
const monthDate = (month) => `${String(month || "").slice(0, 7)}-01`;
const isISODate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const monthLabel = (value) => value ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(`${String(value).slice(0, 7)}-01T12:00:00`)) : "-";
const dateLabel = (value) => value ? new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`)) : "-";
const statuses = ["Hadir", "Izin", "Sakit", "Cuti", "Alpa"];
const reportTypes = {
  karyawan: { label: "Laporan Karyawan", table: "karyawan", id: "id_karyawan", select: "*", date: null, columns: [["nik", "NIK"], ["nama", "Nama"], ["jabatan", "Jabatan"], ["unit_kerja", "Unit Kerja"], ["status_pegawai", "Status Pegawai"], ["status_aktif", "Status Aktif"], ["gaji_pokok", "Gaji Pokok"]] },
  absensi: { label: "Laporan Absensi", table: "absensi", id: "id_absensi", select: "*,karyawan(nama,nik,jabatan,unit_kerja)", date: "tanggal", columns: [["tanggal", "Tanggal"], ["id_karyawan", "Karyawan"], ["status_kehadiran", "Status"], ["jam_masuk", "Jam Masuk"], ["jam_keluar", "Jam Keluar"], ["keterlambatan", "Terlambat (menit)"], ["keterangan", "Keterangan"]] },
  lembur: { label: "Laporan Lembur", table: "lembur", id: "id_lembur", select: "*,karyawan(nama,nik,jabatan,unit_kerja)", date: "tanggal", columns: [["tanggal", "Tanggal"], ["id_karyawan", "Karyawan"], ["status", "Status"], ["total_jam", "Total Jam"], ["tarif_lembur", "Tarif per Jam"], ["total_lembur", "Total Lembur"]] },
  kinerja: { label: "Laporan Kinerja", table: "penilaian_kinerja", id: "id_penilaian", select: "*,karyawan(nama,nik,jabatan,unit_kerja)", date: "periode", columns: [["periode", "Periode"], ["id_karyawan", "Karyawan"], ["total_skor", "Total Skor"], ["predikat", "Predikat"], ["catatan", "Catatan"]] },
  payroll: { label: "Laporan Payroll", table: "payroll", id: "id_payroll", select: "*,karyawan(nama,nik,jabatan,unit_kerja)", date: "periode", columns: [["periode", "Periode"], ["id_karyawan", "Karyawan"], ["gaji_pokok", "Gaji Pokok"], ["total_lembur", "Total Lembur"], ["tunjangan", "Tunjangan"], ["insentif", "Insentif"], ["potongan", "Potongan"], ["potongan_detail", "Rincian Potongan"], ["gaji_kotor", "Gaji Kotor"], ["gaji_bersih", "Gaji Bersih"], ["status_pembayaran", "Status"]] },
  "payroll-deductions": { label: "Rincian Potongan Payroll", table: "payroll_potongan", id: "id_potongan", select: "*", date: "periode", columns: [["periode", "Periode"], ["id_karyawan", "Karyawan"], ["jenis_potongan", "Jenis Potongan"], ["nominal", "Nominal"], ["keterangan", "Keterangan"], ["status_pembayaran", "Status Payroll"]] },
  loans: { label: "Laporan Kasbon & Pinjaman", table: "payroll_pinjaman", id: "id_pinjaman", select: "*,karyawan:karyawan!payroll_pinjaman_karyawan_fk(nama,nik,jabatan,unit_kerja)", date: "tanggal_pengajuan", columns: [["tanggal_pengajuan", "Tanggal Pengajuan"], ["id_karyawan", "Karyawan"], ["jenis", "Jenis"], ["nominal_pengajuan", "Pengajuan"], ["nominal_disetujui", "Disetujui"], ["total_terbayar", "Terbayar"], ["sisa_saldo", "Sisa Saldo"], ["status", "Status"], ["status_pembatalan", "Status Pembatalan"]] },
  "loan-installments": { label: "Rincian Cicilan Pinjaman", table: "payroll_pinjaman_cicilan", id: "id_cicilan", select: "*", date: "periode_payroll", columns: [["periode_payroll", "Periode Payroll"], ["id_karyawan", "Karyawan"], ["jenis", "Jenis"], ["nomor_cicilan", "Cicilan Ke"], ["nominal_cicilan", "Nominal"], ["status", "Status Cicilan"], ["payroll_status", "Status Payroll"], ["tanggal_pembayaran", "Tanggal Bayar"]] }
};

function icons() { window.lucide?.createIcons(); }

function toast(message, type = "success") {
  const node = $("toast");
  node.textContent = message;
  node.className = `toast is-visible${type === "error" ? " toast-error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("is-visible"), 4000);
}

function explainError(error) {
  if (error?.code === "23505") return "Data dengan NIK, tanggal, atau periode tersebut sudah tersedia.";
  if (error?.code === "23503") return "Karyawan terkait tidak ditemukan.";
  if (error?.code === "23514") return "Nilai tidak memenuhi aturan validasi database.";
  if (error?.code === "42501") return "Akses Supabase ditolak. Periksa policy RLS untuk deployment demo.";
  if (error?.code === "PGRST205") return "PostgREST tidak dapat menemukan tabel pada schema cache database yang dikonfigurasi. Verifikasi project Supabase, schema public, dan refresh schema cache.";
  if (error?.code === "42P01") return "Tabel yang diminta tidak tersedia pada database Supabase yang dikonfigurasi.";
  return error?.message || "Permintaan gagal. Periksa koneksi dan konfigurasi Supabase.";
}

function errorPage(error) {
  const setup = !supabaseClient;
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">${setup ? "KONFIGURASI" : "KONEKSI DATABASE"}</span><h1>${setup ? "Hubungkan Supabase" : "Data belum dapat dimuat"}</h1><p>${esc(setup ? supabaseConfigMessage : explainError(error))}</p></div></section><section class="panel error-panel"><span class="feature-icon feature-gold"><i data-lucide="${setup ? "settings-2" : "wifi-off"}"></i></span><h2>${setup ? "Konfigurasikan akses database" : "Periksa skema dan koneksi"}</h2><p>${setup ? 'Isi SUPABASE_URL dan SUPABASE_ANON_KEY pada frontend/config.js menggunakan URL project dan anon/publishable key. Jangan gunakan service role key.' : `${esc(explainError(error))} Pastikan proyek Supabase aktif dan schema SQL sudah dijalankan.`}</p><button class="button button-primary" id="retry-load"><i data-lucide="refresh-cw"></i> Coba lagi</button></section>`;
  $("retry-load").addEventListener("click", () => void renderCurrent());
  icons();
}

async function loadEmployees() {
  const { data, error } = await supabaseClient.from("karyawan").select("id_karyawan,nik,nama,jabatan,unit_kerja,status_pegawai,status_aktif,gaji_pokok").order("nama");
  if (error) throw error;
  state.employees = data || [];
  return state.employees;
}

function employeeName(row) {
  const person = row.karyawan || state.employees.find((employee) => employee.id_karyawan === row.id_karyawan);
  return person ? `${person.nama} · ${person.nik}` : "Karyawan tidak ditemukan";
}

function payrollDeductionsFor(payrollId) {
  return state.payrollDeductionDetails.filter((detail) => detail.id_payroll === payrollId);
}

function payrollDeductionGroups(details) {
  const totals = new Map();
  for (const detail of details) totals.set(detail.jenis_potongan, (totals.get(detail.jenis_potongan) || 0) + Number(detail.nominal || 0));
  return [...totals].sort(([left], [right]) => left.localeCompare(right, "id-ID"));
}

function payrollDeductionCell(row) {
  const details = row.report_deduction_details || payrollDeductionsFor(row.id_payroll);
  const groups = payrollDeductionGroups(details);
  const breakdown = groups.length
    ? groups.map(([type, amount]) => `${type} ${money(amount)}`).join(" · ")
    : Number(row.potongan || 0) > 0 ? "Belum dirinci" : "Tanpa potongan";
  return `<strong>${money(row.potongan)}</strong><small class="payroll-deduction-cell-detail">${esc(breakdown)}</small>`;
}

function badge(value) {
  const className = String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `<span class="status-badge status-${esc(className)}">${esc(value || "-")}</span>`;
}

function cellContent(field, row) {
  const value = row[field];
  if (field === "id_karyawan") return `<span class="mini-name"><span class="table-avatar">${esc((row.karyawan?.nama || "?").split(/\s+/).map((part) => part[0]).slice(0, 2).join(""))}</span><span><strong>${esc(row.karyawan?.nama || employeeName(row))}</strong><small>${esc(row.karyawan?.nik || "")}</small></span></span>`;
  if (field === "potongan" && row.id_payroll) return payrollDeductionCell(row);
  if (field === "potongan_detail") {
    const details = row.report_deduction_details || payrollDeductionsFor(row.id_payroll);
    return details.length
      ? `<span>${esc(payrollDeductionGroups(details).map(([type, amount]) => `${type}: ${money(amount)}`).join(" · "))}</span>`
      : Number(row.potongan || 0) ? badge("Potongan belum dirinci") : "-";
  }
  if (["gaji_pokok", "tarif_lembur", "total_lembur", "tunjangan", "insentif", "potongan", "gaji_kotor", "gaji_bersih", "nominal", "nominal_cicilan", "nominal_pengajuan", "nominal_disetujui", "total_terbayar", "sisa_saldo"].includes(field)) return `<span class="money-cell">${value == null ? "-" : money(value)}</span>`;
  if (["periode", "periode_payroll"].includes(field)) return esc(monthLabel(value));
  if (["tanggal", "tanggal_masuk", "tanggal_bayar", "tanggal_pengajuan", "tanggal_pembayaran"].includes(field)) return esc(dateLabel(value));
  if (["jam_masuk", "jam_keluar", "jam_mulai", "jam_selesai"].includes(field)) return esc(value ? String(value).slice(0, 5) : "-");
  if (field === "total_jam") return `${numeric(value)} jam`;
  if (field === "keterlambatan") return Number(value || 0) ? `${numeric(value)} menit` : "-";
  if (["total_skor", "skor_kehadiran", "skor_kedisiplinan", "skor_kinerja", "skor_target"].includes(field)) return numeric(value);
  if (["status", "status_kehadiran", "status_pegawai", "status_aktif", "status_pembayaran", "status_pembatalan", "payroll_status", "predikat"].includes(field)) return badge(value);
  return esc(value || "-");
}

function rowActions(key, row) {
  const config = configs[key];
  const id = esc(row[config.id]);
  const actions = [];
  if (key === "lembur" && row.status === "Menunggu") {
    actions.push(`<button class="icon-button approve-action" data-action="approve" data-id="${id}" aria-label="Setujui lembur" title="Setujui"><i data-lucide="check"></i></button>`);
    actions.push(`<button class="icon-button danger" data-action="reject" data-id="${id}" aria-label="Tolak lembur" title="Tolak"><i data-lucide="x"></i></button>`);
  }
  actions.push(`<button class="icon-button" data-action="detail" data-id="${id}" aria-label="Lihat detail" title="Lihat detail"><i data-lucide="eye"></i></button>`);
  if (key === "payroll") actions.push(`<button class="icon-button" data-action="slip" data-id="${id}" aria-label="Lihat slip gaji" title="Lihat slip gaji"><i data-lucide="file-text"></i></button>`);
  if (key === "payroll" && row.status_pembayaran === "Draft") {
    const canApprove = !state.payrollWorkflowReady || payrollLoanActorRole() === "HR/Admin";
    actions.push(`<button class="button button-quiet accounting-small" data-action="advance-payroll" data-id="${id}" ${canApprove ? "" : "disabled"} title="${canApprove ? "Setujui payroll dan ubah status menjadi Diproses" : "Pilih actor HR/Admin untuk menyetujui payroll"}">Setujui Payroll</button>`);
  }
  if (key === "payroll" && row.status_pembayaran === "Diproses") {
    const recognitionJournal = state.payrollJournals[`${row.id_payroll}:payroll`];
    const canMarkPaid = state.accountingReady && state.payrollJournalStatusAvailable && recognitionJournal?.status === "Posted"
      && (!state.payrollWorkflowReady || payrollLoanActorRole() === "HR/Admin");
    const markPaidReason = !state.accountingReady || !state.payrollJournalStatusAvailable
      ? "Migration akuntansi dan status jurnal harus tersedia"
      : recognitionJournal?.status !== "Posted"
        ? "Posting jurnal payroll terlebih dahulu"
        : "Pilih actor HR/Admin";
    actions.push(`<button class="button button-quiet accounting-small" data-action="mark-payroll-paid" data-id="${id}" ${canMarkPaid ? "" : "disabled"} title="${canMarkPaid ? "Catat payroll yang sudah ditransfer" : markPaidReason}">Catat Pembayaran</button>`);
  }
  if (key === "payroll" && state.payrollWorkflowReady && payrollLoanActorRole() === "HR/Admin" && row.status_pembayaran === "Dibayar" && row.tanggal_bayar) actions.push(`<button class="icon-button approve-action" data-action="settle-payroll-loans" data-id="${id}" aria-label="Settle cicilan payroll" title="Perbarui saldo pinjaman setelah payroll Dibayar"><i data-lucide="badge-check"></i></button>`);
  if (key === "payroll") actions.push(accountingPayrollActions(row));
  const postedPayroll = key === "payroll" && Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll && journal.status === "Posted");
  const journaledPayroll = key === "payroll" && Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll);
  const payrollEditLocked = key === "payroll" && (journaledPayroll || !state.payrollJournalStatusAvailable || row.status_pembayaran !== "Draft");
  const payrollDeleteLocked = key === "payroll" && (journaledPayroll || row.status_pembayaran !== "Draft");
  const editTitle = postedPayroll ? "Payroll sudah diposting ke akuntansi; perubahan dikunci" : journaledPayroll ? "Payroll memiliki jurnal; perubahan dikunci agar jurnal tidak kedaluwarsa" : key === "payroll" && row.status_pembayaran !== "Draft" ? "Payroll non-Draft hanya dapat dikoreksi melalui proses terpisah" : payrollEditLocked ? "Status jurnal tidak dapat diverifikasi; perubahan payroll dikunci sementara" : "Edit";
  const deleteTitle = postedPayroll ? "Payroll Posted tidak dapat dihapus" : journaledPayroll ? "Payroll berjurnal tidak dapat dihapus" : payrollDeleteLocked ? "Payroll non-Draft tidak dapat dihapus" : "Hapus";
  actions.push(`<button class="icon-button" data-action="edit" data-id="${id}" aria-label="Edit" title="${editTitle}" ${payrollEditLocked ? "disabled" : ""}><i data-lucide="pencil"></i></button>`);
  actions.push(`<button class="icon-button danger" data-action="delete" data-id="${id}" aria-label="Hapus" title="${deleteTitle}" ${payrollDeleteLocked ? "disabled" : ""}><i data-lucide="trash-2"></i></button>`);
  return `<div class="row-actions">${actions.join("")}</div>`;
}

function filteredRows(key) {
  const config = configs[key];
  const query = state.search.trim().toLocaleLowerCase("id-ID");
  return state.rows.filter((row) => {
    const values = config.search.map((path) => path.split(".").reduce((value, part) => value?.[part], row));
    if (query && !values.some((value) => String(value ?? "").toLocaleLowerCase("id-ID").includes(query))) return false;
    if (config.filters.some((filter) => state.filters[filter.field] && String(filter.field.split(".").reduce((value, part) => value?.[part], row) ?? "") !== state.filters[filter.field])) return false;
    if (state.date && config.dateFilter) {
      const value = String(row[config.dateFilter.field] || "");
      if (config.dateFilter.type === "month" ? !value.startsWith(state.date) : value.slice(0, 10) !== state.date) return false;
    }
    return true;
  });
}

function renderRows(config, rows, actions = true) {
  if (!rows.length) return `<tr><td class="empty-cell" colspan="${config.columns.length + (actions ? 1 : 0)}"><i data-lucide="inbox"></i>Belum ada data yang sesuai filter.</td></tr>`;
  return rows.map((row) => `<tr>${config.columns.map(([field]) => `<td>${cellContent(field, row)}</td>`).join("")}${actions ? `<td>${rowActions(config.key, row)}</td>` : ""}</tr>`).join("");
}

function filterMarkup(config) {
  return config.filters.map((filter) => {
    const selected = state.filters[filter.field] || "";
    const options = filter.source === "employees"
      ? state.employees.map((employee) => [employee.id_karyawan, `${employee.nama} · ${employee.nik}`])
      : filter.source === "units"
        ? [...new Set(state.employees.map((employee) => employee.unit_kerja))].sort().map((unit) => [unit, unit])
        : filter.options.map((option) => [option, option]);
    return `<label class="filter-box"><span class="sr-only">${esc(filter.label)}</span><select data-filter="${esc(filter.field)}" aria-label="${esc(filter.label)}"><option value="">${esc(filter.label)}</option>${options.map(([value, label]) => `<option value="${esc(value)}" ${selected === value ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></label>`;
  }).join("");
}

function renderEntityPage(config) {
  const key = config.key;
  const rows = filteredRows(config.key);
  const dateFilter = config.dateFilter ? `<label class="filter-box"><span class="sr-only">${esc(config.dateFilter.label)}</span><input type="${config.dateFilter.type}" id="record-date" value="${esc(state.date)}" aria-label="${esc(config.dateFilter.label)}"></label>` : "";
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">MANAJEMEN OPERASIONAL</span><h1>${esc(config.title)}</h1><p>${esc(config.description)}</p></div>${key === "payroll" && state.payrollWorkflowReady ? payrollAdminActorMarkup() : ""}<button class="button button-primary" id="add-record"><i data-lucide="plus"></i> Tambah ${esc(config.singular)}</button></section>${key === "payroll" ? `<div class="loan-simulation-notice"><strong>Persetujuan dan pembayaran payroll</strong><span>Pilih “Setujui Payroll” pada payroll Draft untuk mengubahnya menjadi Diproses. Setelah jurnal payroll di-posting dan transfer benar-benar dilakukan, pilih “Catat Pembayaran”. Status Diproses berarti disetujui, bukan berarti sudah dibayar. Actor/role adalah simulasi internal dan belum menjadi autentikasi.</span></div>` : ""}<section class="panel data-panel"><div class="table-toolbar"><span class="table-count"><strong>${rows.length}</strong> data tercatat</span><div class="table-tools"><label class="search-box"><i data-lucide="search"></i><input id="record-search" type="search" value="${esc(state.search)}" placeholder="${esc(config.searchPlaceholder)}" aria-label="Cari data"></label>${filterMarkup(config)}${dateFilter}</div></div><div class="table-scroll"><table class="data-table"><thead><tr>${config.columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}<th>Aksi</th></tr></thead><tbody id="record-body">${renderRows(config, rows)}</tbody></table></div><div class="table-foot"><span>${rows.length} dari ${state.rows.length} data</span><span><i data-lucide="database"></i> Data aktual Supabase PostgreSQL</span></div></section>`;
  $("add-record").addEventListener("click", () => void openForm(config.key));
  $("record-search").addEventListener("input", (event) => { state.search = event.target.value; refreshTable(config); });
  document.querySelectorAll("[data-filter]").forEach((select) => select.addEventListener("change", (event) => { state.filters[event.target.dataset.filter] = event.target.value; refreshTable(config); }));
  $("record-date")?.addEventListener("change", (event) => { state.date = event.target.value; refreshTable(config); });
  $("record-body").addEventListener("click", (event) => void handleRowAction(config.key, event));
  $("payroll-actor")?.addEventListener("change", (event) => {
    payrollLoanState.actorId = event.target.value;
    payrollLoanState.actorRole = "HR/Admin";
    void renderCurrent();
  });
  icons();
}

function refreshTable(config) {
  const rows = filteredRows(config.key);
  $("record-body").innerHTML = renderRows(config, rows);
  document.querySelector(".table-count strong").textContent = rows.length;
  document.querySelector(".table-foot span").textContent = `${rows.length} dari ${state.rows.length} data`;
  icons();
}

async function renderEntity(key) {
  const config = configs[key];
  const [result] = await Promise.all([
    supabaseClient.from(config.table).select(config.select).order(config.order, { ascending: key === "karyawan" })
  ]);
  if (result.error) throw result.error;
  state.rows = result.data || [];
  await loadEmployees();
  if (key === "payroll") {
    if (state.rows.length) {
      const deductionsResult = await supabaseClient.from("payroll_potongan")
        .select("id_potongan,id_payroll,jenis_potongan,nominal,keterangan,created_at")
        .in("id_payroll", state.rows.map((row) => row.id_payroll));
      if (deductionsResult.error) throw deductionsResult.error;
      state.payrollDeductionDetails = deductionsResult.data || [];
    } else state.payrollDeductionDetails = [];
    const [accountsResult, journalsResult] = await Promise.all([
      supabaseClient.from("accounts").select("id_account,code,name,account_type,is_active").eq("account_type", "Aset").eq("is_active", true).order("code"),
      supabaseClient.from("journal_entries").select("id_journal,source_payroll_id,entry_type,status").not("source_payroll_id", "is", null)
    ]);
    const accountingResults = [accountsResult, journalsResult];
    const unexpectedError = accountingResults.find((result) => result.error && !["PGRST205", "42P01"].includes(result.error.code));
    if (unexpectedError) throw unexpectedError.error;
    const missingAccountingSchema = accountingResults.some((result) => ["PGRST205", "42P01"].includes(result.error?.code));
    if (missingAccountingSchema) {
      state.accountingReady = false;
      state.cashAccounts = [];
    } else {
      state.accountingReady = true;
      state.cashAccounts = accountsResult.data || [];
    }
    state.payrollJournalStatusAvailable = !journalsResult.error;
    state.payrollJournals = journalsResult.error
      ? {}
      : Object.fromEntries((journalsResult.data || []).map((journal) => [`${journal.source_payroll_id}:${journal.entry_type}`, journal]));
    try {
      await loadPayrollLoanActors();
      if (payrollLoanActorRole() !== "HR/Admin") {
        const adminRole = payrollLoanState.roles.find((role) => role.role === "HR/Admin");
        payrollLoanState.actorId = adminRole?.id_karyawan || "";
        payrollLoanState.actorRole = adminRole?.role || "";
      }
      state.payrollWorkflowReady = true;
    } catch (error) {
      if (!["PGRST205", "42P01"].includes(error?.code)) throw error;
      state.payrollWorkflowReady = false;
    }
  } else state.payrollDeductionDetails = [];
  renderEntityPage(config);
}

function metricCard(label, value, detail, icon, shade = "metric-teal", moneyValue = false) {
  return `<article class="metric-card ${shade}"><div class="metric-top"><span>${esc(label)}</span><i data-lucide="${icon}"></i></div><strong class="${moneyValue ? "metric-money" : ""}">${moneyValue ? money(value) : esc(value)}</strong><small>${esc(detail)}</small></article>`;
}

function barChart(items, color = "teal") {
  const max = Math.max(1, ...items.map((item) => Number(item.value) || 0));
  if (!items.length) return `<div class="chart-empty">Belum ada data untuk ditampilkan.</div>`;
  return `<div class="chart-list">${items.map((item) => `<div class="chart-row"><span title="${esc(item.label)}">${esc(item.label)}</span><div class="chart-track"><span class="bar-${color}" style="width:${item.value ? Math.max(3, Number(item.value) / max * 100) : 0}%"></span></div><strong>${esc(item.display ?? numeric(item.value))}</strong></div>`).join("")}</div>`;
}

function compactPayroll(rows) {
  if (!rows.length) return `<div class="chart-empty">Belum ada payroll untuk periode ini.</div>`;
  return `<div class="mini-table-wrap"><table class="mini-table"><thead><tr><th>KARYAWAN</th><th>PERIODE</th><th>GAJI BERSIH</th></tr></thead><tbody>${rows.slice(0, 5).map((row) => `<tr><td><strong>${esc(row.karyawan?.nama || "-")}</strong></td><td>${esc(monthLabel(row.periode))}</td><td><strong>${money(row.gaji_bersih)}</strong></td></tr>`).join("")}</tbody></table></div>`;
}

async function renderDashboard() {
  const results = await Promise.all([
    supabaseClient.from("karyawan").select("id_karyawan,nama,unit_kerja,status_pegawai,status_aktif"),
    supabaseClient.from("absensi").select("tanggal,status_kehadiran").gte("tanggal", `${currentMonth()}-01`).lte("tanggal", today()),
    supabaseClient.from("lembur").select("status"),
    supabaseClient.from("payroll").select("periode,gaji_bersih,karyawan(nama)").gte("periode", monthDate(shiftMonth(currentMonth(), -5))).order("periode"),
    supabaseClient.from("penilaian_kinerja").select("total_skor,predikat,periode")
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  const [employees, attendance, overtime, payroll, performance] = results.map((result) => result.data || []);
  let loanSummary = null;
  const loanResult = await supabaseClient.from("payroll_pinjaman").select("status,sisa_saldo,status_pembatalan");
  if (loanResult.error && !["PGRST205", "42P01"].includes(loanResult.error.code)) throw loanResult.error;
  if (!loanResult.error) loanSummary = loanResult.data || [];
  const active = employees.filter((row) => row.status_aktif === "Aktif");
  const todayAttendance = attendance.filter((row) => row.tanggal === today());
  const pending = overtime.filter((row) => row.status === "Menunggu").length;
  const monthPayroll = payroll.filter((row) => String(row.periode).startsWith(currentMonth()));
  const averageScore = performance.length ? performance.reduce((sum, row) => sum + Number(row.total_skor), 0) / performance.length : 0;
  const attendanceCounts = statuses.map((label) => ({ label, value: attendance.filter((row) => row.status_kehadiran === label).length }));
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(currentMonth(), index - 5));
  const payrollTrend = months.map((period) => ({ label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${period}-01T12:00:00`)), value: payroll.filter((row) => String(row.periode).startsWith(period)).reduce((sum, row) => sum + Number(row.gaji_bersih || 0), 0), display: formatCompactMoney(payroll.filter((row) => String(row.periode).startsWith(period)).reduce((sum, row) => sum + Number(row.gaji_bersih || 0), 0)) }));
  const unitCounts = [...new Set(employees.map((row) => row.unit_kerja))].sort().map((label) => ({ label, value: employees.filter((row) => row.unit_kerja === label).length }));
  const statusCounts = ["Tetap", "Kontrak", "Honorer"].map((label) => ({ label, value: employees.filter((row) => row.status_pegawai === label).length }));
  const performanceCounts = ["Sangat Baik", "Baik", "Cukup", "Kurang", "Sangat Kurang"].map((label) => ({ label, value: performance.filter((row) => row.predikat === label).length }));
  const laborCosts = monthPayroll.reduce((acc, row) => {
    acc.net += Number(row.gaji_bersih || 0);
    return acc;
  }, { net: 0 });
  const monthLabelNow = monthLabel(monthDate(currentMonth()));
  const workspaceModules = [
    ["karyawan", "Karyawan", "users-round", "Data dan unit kerja"],
    ["absensi", "Absensi", "calendar-check-2", "Kehadiran harian"],
    ["kinerja", "Penilaian Kinerja", "award", "Evaluasi kinerja"],
    ["lembur", "Lembur", "clock-4", "Pengajuan dan persetujuan"],
    ["payroll", "Payroll", "wallet-cards", "Gaji dan rincian bersih"],
    ["payroll-deductions", "Potongan Gaji", "badge-minus", "Rincian per payroll"],
    ["payroll-loans", "Kasbon & Pinjaman", "hand-coins", "Cicilan dan saldo"],
    ["laporan", "Laporan", "chart-no-axes-combined", "SDM, payroll, cicilan"],
    ["accounting-dashboard", "Dashboard Akuntansi", "layout-dashboard", "Rekonsiliasi dan jurnal"],
    ["accounts", "Daftar Akun", "list-tree", "Bagan akun"],
    ["journals", "Jurnal", "book-open-check", "Draft dan Posted"],
    ["ledger", "Buku Besar", "book-text", "Mutasi akun Posted"],
    ["income-statement", "Laba Rugi", "chart-no-axes-combined", "Laporan keuangan"],
    ["balance-sheet", "Posisi Keuangan", "landmark", "Aset dan liabilitas"]
  ];
  $("page-content").innerHTML = `<section class="welcome-row"><div><span class="eyebrow">RINGKASAN OPERASIONAL &amp; KEUANGAN</span><h1>Selamat datang di MedSync</h1><p>Workspace SDM, payroll, kasbon, akuntansi, dan laporan · ${esc(monthLabelNow)}</p></div><button class="button button-primary" id="quick-add"><i data-lucide="plus"></i> Tambah data</button></section>
    <section class="metric-grid">${metricCard("Total Karyawan Aktif", active.length, `${employees.length} total karyawan`, "users-round")}${metricCard("Hadir Hari Ini", todayAttendance.filter((row) => row.status_kehadiran === "Hadir").length, `${todayAttendance.length} catatan absensi hari ini`, "calendar-check-2", "metric-blue")}${metricCard("Lembur Menunggu", pending, "pengajuan perlu ditinjau", "clock-4", "metric-amber")}${metricCard("Payroll Bulan Ini", laborCosts.net, `${monthPayroll.length} data payroll · gaji bersih`, "wallet-cards", "metric-mint", true)}${metricCard("Saldo Pinjaman Aktif", loanSummary ? loanSummary.filter((loan) => loan.status !== "Dibatalkan").reduce((sum, loan) => sum + Number(loan.sisa_saldo || 0), 0) : "Belum tersedia", loanSummary ? `${loanSummary.filter((loan) => loan.status_pembatalan === "Menunggu Persetujuan").length} pembatalan menunggu persetujuan` : "Terapkan migration Fase 4", "hand-coins", "metric-gold", Boolean(loanSummary))}${metricCard("Rata-rata Kinerja", `${numeric(averageScore)} / 100`, `${performance.length} penilaian kinerja`, "award", "metric-purple")}</section>
    <section class="panel panel-pad workspace-module-panel"><div class="panel-heading"><div><span class="eyebrow">AKSES SELURUH MODUL</span><h2>Workspace MedSync</h2><p>Alur data bergerak dari operasional SDM ke payroll, potongan, kasbon, jurnal, dan laporan.</p></div></div><div class="workspace-module-grid">${workspaceModules.map(([view, title, icon, detail]) => `<button class="workspace-module" data-open-view="${view}"><i data-lucide="${icon}"></i><span><strong>${title}</strong><small>${detail}</small></span><i class="module-arrow" data-lucide="arrow-up-right"></i></button>`).join("")}</div></section>
    <section class="dashboard-grid"><article class="panel panel-pad"><div class="panel-heading"><div><span class="eyebrow">BULAN BERJALAN</span><h2>Ringkasan kehadiran</h2></div><button class="inline-link" data-open-view="absensi">Buka absensi <i data-lucide="arrow-up-right"></i></button></div>${barChart(attendanceCounts)}</article><article class="panel panel-pad"><div class="panel-heading"><div><span class="eyebrow">ENAM PERIODE TERAKHIR</span><h2>Payroll bulanan</h2></div><button class="inline-link" data-open-view="payroll">Semua payroll <i data-lucide="arrow-up-right"></i></button></div>${barChart(payrollTrend, "blue")}</article></section>
    <section class="dashboard-grid dashboard-grid-secondary"><article class="panel panel-pad"><div class="panel-heading"><div><span class="eyebrow">KOMPOSISI TENAGA KERJA</span><h2>Karyawan berdasarkan unit kerja</h2></div></div>${barChart(unitCounts, "green")}<div class="chart-subheading">Status pegawai</div>${barChart(statusCounts, "gold")}</article><article class="panel panel-pad"><div class="panel-heading"><div><span class="eyebrow">HASIL EVALUASI</span><h2>Distribusi predikat kinerja</h2></div><button class="inline-link" data-open-view="kinerja">Penilaian <i data-lucide="arrow-up-right"></i></button></div>${barChart(performanceCounts, "purple")}</article></section>
    <section class="dashboard-grid dashboard-grid-secondary"><article class="panel panel-pad"><div class="panel-heading"><div><span class="eyebrow">PENGGAJIAN TERBARU</span><h2>Payroll terakhir</h2></div><button class="inline-link" data-open-view="payroll">Kelola payroll <i data-lucide="arrow-up-right"></i></button></div>${compactPayroll([...payroll].sort((a, b) => String(b.periode).localeCompare(String(a.periode))).slice(0, 5))}</article><article class="panel panel-pad dashboard-note"><div class="panel-heading"><div><span class="eyebrow">SISTEM INFORMASI AKUNTANSI</span><h2>Biaya tenaga kerja terintegrasi</h2></div><i data-lucide="chart-no-axes-combined"></i></div><p>Persetujuan lembur memperbarui nilai lembur payroll secara otomatis. Gaji pokok, tunjangan, insentif, dan potongan membentuk informasi biaya penggajian.</p><button class="button button-quiet" data-open-view="laporan"><i data-lucide="file-chart-column"></i> Buka laporan &amp; ringkasan biaya</button></article></section>`;
  $("quick-add").addEventListener("click", openQuickAdd);
  icons();
}

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatCompactMoney(amount) {
  if (!amount) return "Rp0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", notation: "compact", maximumFractionDigits: 1 }).format(amount);
}

async function employeeOptions(selected = "") {
  if (!state.employees.length) await loadEmployees();
  const available = state.employees.filter((employee) => employee.status_aktif === "Aktif" || employee.id_karyawan === selected);
  return `<option value="">Pilih karyawan...</option>${available.map((person) => `<option value="${esc(person.id_karyawan)}" ${person.id_karyawan === selected ? "selected" : ""}>${esc(person.nama)} · ${esc(person.nik)}</option>`).join("")}`;
}

async function fieldMarkup(field, value, editing) {
  const required = field.required ? " required" : "";
  const limits = ["min", "max", "step", "minlength", "maxlength"].filter((key) => field[key] !== undefined).map((key) => `${key}="${esc(field[key])}"`).join(" ");
  const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString();
  const defaultDate = field.type === "month" ? localDate.slice(0, 7) : ["date"].includes(field.type) ? localDate.slice(0, 10) : "";
  const initial = value ?? field.default ?? defaultDate;
  const wide = field.wide ? " field-wide" : "";
  if (field.type === "employee") return `<label class="form-field${wide}"><span>${esc(field.label)}</span><select name="${esc(field.name)}"${required}>${await employeeOptions(initial)}</select></label>`;
  if (field.type === "select") return `<label class="form-field${wide}"><span>${esc(field.label)}</span><select name="${esc(field.name)}"${required}><option value="">Pilih ${esc(field.label.toLowerCase())}...</option>${field.options.map((option) => `<option value="${esc(option)}" ${initial === option ? "selected" : ""}>${esc(option)}</option>`).join("")}</select></label>`;
  const type = field.type || "text";
  const inputValue = type === "month" ? String(initial || "").slice(0, 7) : initial;
  if (type === "textarea") return `<label class="form-field${wide}"><span>${esc(field.label)}</span><textarea name="${esc(field.name)}" ${limits}${required}>${esc(inputValue)}</textarea></label>`;
  return `<label class="form-field${wide}"><span>${esc(field.label)}</span><input name="${esc(field.name)}" type="${esc(type)}" value="${esc(inputValue)}" ${limits}${required}${field.readonly || (field.readonlyOnEdit && editing) ? " readonly" : ""}></label>`;
}

function modalOpen() {
  $("modal-backdrop").hidden = false;
  document.body.classList.add("modal-open");
  $("form-error").textContent = "";
}

async function openForm(key, row = null) {
  const config = configs[key];
  state.editing = { key, id: row?.[config.id] || null };
  $("modal-eyebrow").textContent = row ? "UBAH DATA" : "DATA BARU";
  $("modal-title").textContent = `${row ? "Edit" : "Tambah"} ${config.singular}`;
  $("modal-save").hidden = false;
  $("modal-save").querySelector("span").textContent = row ? "Simpan perubahan" : "Simpan data";
  const fields = await Promise.all(config.fields.map((field) => fieldMarkup(field, row?.[field.name], Boolean(row))));
  const preview = key === "lembur" ? `<div class="form-preview" id="overtime-preview">Durasi dan nominal dihitung otomatis oleh database.</div>` : key === "payroll" ? `<div class="form-preview" id="payroll-preview">Pilih karyawan dan periode untuk melihat ringkasan penggajian.${row ? "<small>Total potongan payroll dikelola melalui menu Potongan Gaji agar nilai agregat dan rinciannya tetap sinkron.</small>" : ""}</div>` : "";
  $("form-fields").innerHTML = fields.join("") + preview;
  $("modal-save").disabled = false;
  $("record-form").dataset.module = key;
  modalOpen();
  bindFormEvents(key);
  if (key === "payroll") await updatePayrollPreview(row);
  if (key === "lembur") updateOvertimePreview();
  icons();
  $("form-fields").querySelector("input,select,textarea")?.focus();
}

function bindFormEvents(key) {
  const form = $("record-form");
  if (key === "absensi") {
    form.querySelector('[name="status_kehadiran"]').addEventListener("change", (event) => {
      const present = event.target.value === "Hadir";
      form.querySelector('[name="jam_masuk"]').required = present;
      form.querySelector('[name="jam_keluar"]').required = present;
    });
  }
  if (key === "lembur") form.querySelectorAll('[name="jam_mulai"],[name="jam_selesai"],[name="tarif_lembur"]').forEach((input) => input.addEventListener("input", updateOvertimePreview));
  if (key === "payroll") {
    form.querySelector('[name="id_karyawan"]').addEventListener("change", () => void updatePayrollPreview());
    form.querySelector('[name="periode"]').addEventListener("change", () => void updatePayrollPreview());
    form.querySelectorAll('[name="tunjangan"],[name="insentif"],[name="potongan"]').forEach((input) => input.addEventListener("input", updatePayrollTotals));
  }
}

function updateOvertimePreview() {
  const form = $("record-form");
  const start = form.elements.jam_mulai?.value;
  const finish = form.elements.jam_selesai?.value;
  const rate = Number(form.elements.tarif_lembur?.value || 0);
  if (!start || !finish) {
    $("overtime-preview").textContent = "Durasi dan nominal dihitung otomatis oleh database.";
    return;
  }
  let minutes = Number(finish.slice(0, 2)) * 60 + Number(finish.slice(3, 5)) - Number(start.slice(0, 2)) * 60 - Number(start.slice(3, 5));
  if (minutes < 0) minutes += 1440;
  const hours = Math.round(minutes / 60 * 100) / 100;
  $("overtime-preview").textContent = `Perkiraan ${numeric(hours)} jam · ${money(hours * rate)}. Nilai final dihitung database.`;
}

async function updatePayrollPreview(row = null) {
  const form = $("record-form");
  const employeeId = form.elements.id_karyawan.value;
  const period = form.elements.periode.value;
  const employee = state.employees.find((item) => item.id_karyawan === employeeId);
  let overtimeTotal = 0;
  if (employeeId && period) {
    $("payroll-preview").textContent = "Mengambil data lembur disetujui...";
    const start = monthDate(period);
    const [year, month] = period.split("-").map(Number);
    const finish = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const { data, error } = await supabaseClient.from("lembur").select("total_lembur").eq("id_karyawan", employeeId).eq("status", "Disetujui").gte("tanggal", start).lt("tanggal", finish);
    if (error) {
      $("form-error").textContent = explainError(error);
      toast(explainError(error), "error");
      return;
    }
    overtimeTotal = (data || []).reduce((sum, item) => sum + Number(item.total_lembur || 0), 0);
  }
  const salary = employee ? Number(employee.gaji_pokok) : 0;
  form.dataset.payrollSalary = String(salary);
  form.dataset.approvedOvertime = String(overtimeTotal);
  updatePayrollTotals();
}

function updatePayrollTotals() {
  const form = $("record-form");
  if (!form.elements.tunjangan) return;
  const salary = Number(form.dataset.payrollSalary || 0);
  const overtimeTotal = Number(form.dataset.approvedOvertime || 0);
  const allowance = Number(form.elements.tunjangan?.value || 0);
  const incentive = Number(form.elements.insentif?.value || 0);
  const deduction = Number(form.elements.potongan?.value || 0);
  const gross = salary + overtimeTotal + allowance + incentive;
  $("payroll-preview").innerHTML = `<strong>Gaji pokok</strong> ${money(salary)} &nbsp;·&nbsp; <strong>Lembur disetujui</strong> ${money(overtimeTotal)}<br><strong>Perkiraan gaji kotor</strong> ${money(gross)} &nbsp;·&nbsp; <strong>Gaji bersih</strong> ${money(gross - deduction)}<small>Gaji pokok, lembur, dan total dihitung ulang oleh PostgreSQL saat disimpan.</small>`;
}

function closeForm() {
  $("modal-backdrop").hidden = true;
  document.body.classList.remove("modal-open");
  $("record-form").reset();
  $("modal-save").hidden = false;
  state.editing = null;
}

function collectRecord(form, config) {
  const record = {};
  for (const field of config.fields) {
    let value = new FormData(form).get(field.name);
    if (field.type === "number") value = value === "" ? 0 : Number(value);
    if (field.type === "month" && value) value = monthDate(value);
    if (value === "") value = null;
    record[field.name] = value;
  }
  return record;
}

async function saveRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !state.editing) return;
  const { key, id } = state.editing;
  const config = configs[key];
  const record = collectRecord(form, config);
  if (key === "absensi" && record.status_kehadiran === "Hadir" && (!record.jam_masuk || !record.jam_keluar)) {
    $("form-error").textContent = "Jam masuk dan jam keluar wajib diisi untuk status Hadir.";
    return;
  }
  const button = $("modal-save");
  button.disabled = true;
  button.querySelector("span").textContent = "Menyimpan...";
  try {
    let query = supabaseClient.from(config.table);
    query = id ? query.update(record).eq(config.id, id) : query.insert(record);
    const { error } = await query;
    if (error) throw error;
    closeForm();
    toast(`${config.singular} berhasil ${id ? "diperbarui" : "ditambahkan"}.`);
    await renderCurrent();
  } catch (error) {
    $("form-error").textContent = explainError(error);
    toast(explainError(error), "error");
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = id ? "Simpan perubahan" : "Simpan data";
  }
}

async function handleRowAction(key, event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const config = configs[key];
  const row = state.rows.find((item) => String(item[config.id]) === button.dataset.id);
  if (!row) return;
  const action = button.dataset.action;
  if (action === "open-journals") { setView("journals"); return; }
  if (action === "advance-payroll") {
    if (row.status_pembayaran !== "Draft") {
      toast("Hanya payroll berstatus Draft yang dapat diproses.", "error");
      return;
    }
    if (state.accountingReady && !state.payrollJournalStatusAvailable) {
      toast("Status jurnal belum dapat diverifikasi. Payroll tidak diproses agar jurnal existing tetap terlindungi.", "error");
      return;
    }
    if (Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll)) {
      toast("Payroll ini sudah memiliki jurnal. Periksa status jurnal sebelum melanjutkan.", "error");
      return;
    }
    if (state.payrollWorkflowReady && payrollLoanActorRole() !== "HR/Admin") {
      toast("Pilih actor HR/Admin yang terdaftar untuk memproses payroll dan cicilan.", "error");
      return;
    }
    if (!window.confirm("Payroll Draft akan diproses dan dikunci dari perubahan langsung. Cicilan pinjaman yang jatuh tempo juga akan ditambahkan terlebih dahulu. Lanjutkan?")) return;
    button.disabled = true;
    let installmentCount = 0;
    try {
      if (state.payrollWorkflowReady) {
        const { data, error } = await supabaseClient.rpc("process_payroll_pinjaman", {
          p_id_payroll: row.id_payroll,
          p_actor: payrollLoanState.actorId
        });
        if (error) throw error;
        installmentCount = Number(data || 0);
      }
      const { data, error } = await supabaseClient
        .from("payroll")
        .update({ status_pembayaran: "Diproses" })
        .eq("id_payroll", row.id_payroll)
        .eq("status_pembayaran", "Draft")
        .select("id_payroll")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error("Payroll berubah sejak halaman dibuka dan tidak lagi berstatus Draft. Muat ulang data sebelum mencoba kembali.");
      }
      toast(installmentCount
        ? `Payroll disetujui dan diproses; ${installmentCount} cicilan ditambahkan ke rincian potongan. Payroll kini siap dibuatkan jurnal.`
        : "Payroll disetujui (status Diproses) dan kini siap dibuatkan jurnal.");
      await renderCurrent();
    } catch (error) {
      const message = explainError(error);
      toast(installmentCount
        ? `${installmentCount} cicilan sudah terhubung ke payroll Draft, tetapi status payroll belum berhasil diubah: ${message}`
        : message, "error");
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (action === "mark-payroll-paid") {
    const payrollJournal = state.payrollJournals[`${row.id_payroll}:payroll`];
    if (row.status_pembayaran !== "Diproses"
      || !state.accountingReady
      || !state.payrollJournalStatusAvailable
      || payrollJournal?.status !== "Posted") {
      toast("Payroll hanya dapat dicatat Dibayar setelah jurnal payroll berstatus Posted.", "error");
      return;
    }
    if (state.payrollWorkflowReady && payrollLoanActorRole() !== "HR/Admin") {
      toast("Pilih actor HR/Admin yang terdaftar untuk mencatat pembayaran payroll.", "error");
      return;
    }
    if (!window.confirm(`Pastikan transfer gaji bersih ${money(row.gaji_bersih)} sudah benar-benar dilakukan sebelum melanjutkan.`)) return;
    const paymentDate = window.prompt("Tanggal transfer (YYYY-MM-DD):", today());
    if (paymentDate === null) return;
    if (!isISODate(paymentDate)) {
      toast("Tanggal pembayaran harus berupa tanggal kalender yang valid dengan format YYYY-MM-DD.", "error");
      return;
    }
    button.disabled = true;
    try {
      const { data, error } = await supabaseClient.from("payroll")
        .update({ status_pembayaran: "Dibayar", tanggal_bayar: paymentDate })
        .eq("id_payroll", row.id_payroll)
        .eq("status_pembayaran", "Diproses")
        .select("id_payroll")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Status payroll berubah sejak halaman dibuka. Muat ulang sebelum mencatat pembayaran.");
      toast("Pembayaran payroll tercatat. Selanjutnya buat jurnal pembayaran di Akuntansi > Payroll.");
      await renderCurrent();
    } catch (error) {
      toast(explainError(error), "error");
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (action === "settle-payroll-loans") {
    if (!state.payrollWorkflowReady || payrollLoanActorRole() !== "HR/Admin"
      || row.status_pembayaran !== "Dibayar" || !row.tanggal_bayar) {
      toast("Settlement cicilan hanya dapat dilakukan actor HR/Admin setelah payroll berstatus Dibayar.", "error");
      return;
    }
    button.disabled = true;
    try {
      const { data, error } = await supabaseClient.rpc("settle_payroll_pinjaman", {
        p_id_payroll: row.id_payroll,
        p_actor: payrollLoanState.actorId
      });
      if (error) throw error;
      const count = Number(data || 0);
      toast(count
        ? `${count} cicilan diselesaikan dan saldo pinjaman diperbarui setelah pembayaran payroll.`
        : "Tidak ada cicilan berstatus Diproses yang perlu diselesaikan untuk payroll ini.");
      await renderCurrent();
    } catch (error) {
      toast(explainError(error), "error");
    } finally {
      button.disabled = false;
    }
    return;
  }
  if (action === "create-payroll-journal") {
    try {
      const { error } = await supabaseClient.rpc("create_payroll_journal", { p_payroll_id: row.id_payroll });
      if (error) throw error;
      toast("Jurnal payroll berhasil dibuat sebagai Draft.");
      await renderCurrent();
    } catch (error) { toast(explainError(error), "error"); }
    return;
  }
  if (action === "create-payment-journal") {
    const cashAccountId = button.parentElement.querySelector("[data-cash-account]")?.value;
    if (!cashAccountId) { toast("Tambahkan akun Kas/Bank aktif sebelum membuat jurnal pembayaran.", "error"); return; }
    try {
      const { error } = await supabaseClient.rpc("create_payroll_payment_journal", { p_payroll_id: row.id_payroll, p_cash_account_id: cashAccountId });
      if (error) throw error;
      toast("Jurnal pembayaran berhasil dibuat sebagai Draft.");
      await renderCurrent();
    } catch (error) { toast(explainError(error), "error"); }
    return;
  }
  if (action === "edit") {
    if (key === "payroll" && row.status_pembayaran !== "Draft") {
      toast("Payroll non-Draft hanya dapat dikoreksi melalui proses terpisah.", "error");
      return;
    }
    if (key === "payroll" && !state.payrollJournalStatusAvailable) {
      toast("Status jurnal payroll tidak dapat diverifikasi. Perubahan dikunci sementara agar jurnal akuntansi tidak terdampak.", "error");
      return;
    }
    if (key === "payroll" && Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll)) {
      toast(Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll && journal.status === "Posted")
        ? "Payroll sudah diposting ke akuntansi; perubahan nilai payroll dikunci."
        : "Payroll memiliki jurnal Draft; perubahan dikunci agar jurnal tidak kedaluwarsa.", "error");
      return;
    }
    if (key === "payroll" && Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll && journal.status === "Posted")) {
      toast("Payroll sudah diposting ke akuntansi; perubahan nilai payroll dikunci.", "error");
      return;
    }
    try { await openForm(key, row); } catch (error) { toast(explainError(error), "error"); }
    return;
  }
  if (action === "detail") { openRecordDetail(key, row); return; }
  if (action === "slip") { void openSlip(row); return; }
  if (action === "approve" || action === "reject") {
    const status = action === "approve" ? "Disetujui" : "Ditolak";
    try {
      const { error } = await supabaseClient.from(config.table).update({ status }).eq(config.id, row[config.id]);
      if (error) throw error;
      toast(`Pengajuan lembur ${status.toLowerCase()}.`);
      await renderCurrent();
    } catch (error) { toast(explainError(error), "error"); }
    return;
  }
  if (action === "delete") {
    if (key === "payroll" && (row.status_pembayaran !== "Draft"
      || Object.values(state.payrollJournals).some((journal) => journal.source_payroll_id === row.id_payroll))) {
      toast("Payroll non-Draft atau yang memiliki jurnal tidak dapat dihapus.", "error");
      return;
    }
    const warning = key === "karyawan" ? " Absensi, lembur, penilaian, dan payroll karyawan ini juga akan terhapus." : "";
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${config.singular.toLowerCase()}${key === "karyawan" ? ` ${row.nama}` : ` milik ${row.karyawan?.nama || ""}`}?${warning}`)) return;
    try {
      const { error } = await supabaseClient.from(config.table).delete().eq(config.id, row[config.id]);
      if (error) throw error;
      toast(`${config.singular} berhasil dihapus.`);
      await renderCurrent();
    } catch (error) { toast(explainError(error), "error"); }
  }
}

function openRecordDetail(key, row) {
  const config = configs[key];
  $("detail-eyebrow").textContent = "DETAIL DATA";
  $("detail-title").textContent = `${config.singular} · ${row.karyawan?.nama || row.nama || ""}`.trim();
  $("print-slip").hidden = true;
  const derivedFields = {
    absensi: [["keterlambatan", "Keterlambatan (menit)"]],
    lembur: [["total_jam", "Total Jam"], ["total_lembur", "Total Lembur"]],
    kinerja: [["total_skor", "Total Skor"], ["predikat", "Predikat"]],
    payroll: [["gaji_pokok", "Gaji Pokok"], ["total_lembur", "Total Lembur"], ["gaji_kotor", "Gaji Kotor"], ["potongan", "Total Potongan"], ["gaji_bersih", "Gaji Bersih"], ["status_pembayaran", "Status Payroll"]]
  };
  const fields = [...config.fields.map(({ name, label }) => [name, label]), ...(derivedFields[key] || [])];
  const deductions = key === "payroll" ? payrollDeductionsFor(row.id_payroll) : [];
  const deductionSection = key === "payroll"
    ? `<section class="payroll-detail-breakdown"><h3>Rincian potongan payroll</h3>${deductions.length
      ? `<div class="table-scroll"><table class="data-table"><thead><tr><th>Jenis Potongan</th><th>Nominal</th><th>Keterangan</th></tr></thead><tbody>${deductions.map((item) => `<tr><td>${esc(item.jenis_potongan)}${["Kasbon", "Pinjaman Karyawan"].includes(item.jenis_potongan) ? `<br>${badge("Cicilan Pinjaman")}` : ""}</td><td class="money-cell">${money(item.nominal)}</td><td>${esc(item.keterangan || "-")}</td></tr>`).join("")}</tbody></table></div><p>Total rincian <strong>${money(deductions.reduce((sum, item) => sum + Number(item.nominal || 0), 0))}</strong> · Total payroll <strong>${money(row.potongan)}</strong></p>`
      : Number(row.potongan || 0) > 0
        ? `<p>Nilai potongan payroll ${money(row.potongan)} belum memiliki rincian jenis. Rinci melalui menu Potongan Gaji sebelum jurnal dibuat.</p>`
        : "<p>Tidak ada rincian potongan pada payroll ini.</p>"}</section>`
    : "";
  $("detail-content").innerHTML = `<div class="record-detail-grid">${fields.map(([field, label]) => `<div class="record-detail-item${field === "keterangan" || field === "catatan" ? " record-detail-wide" : ""}"><span>${esc(label)}</span><strong>${cellContent(field, row)}</strong></div>`).join("")}</div>${deductionSection}`;
  $("detail-backdrop").hidden = false;
  icons();
}

async function openSlip(row) {
  const person = row.karyawan || {};
  $("detail-eyebrow").textContent = "DOKUMEN PENGGAJIAN";
  $("detail-title").textContent = `Slip gaji · ${person.nama || "Karyawan"}`;
  $("print-slip").hidden = false;
  $("detail-content").innerHTML = `<p class="slip-loading">Memuat rincian payroll...</p>`;
  $("detail-backdrop").hidden = false;
  let details = null;
  let detailsError = "";
  try {
    const { data, error } = await supabaseClient.schema("public").from("payroll_potongan").select("jenis_potongan,nominal").eq("id_payroll", row.id_payroll).order("created_at");
    if (error) throw error;
    details = data || [];
  } catch (error) {
    detailsError = explainError(error);
    console.error("Payroll deduction details could not be loaded:", error);
    toast(`Slip tetap ditampilkan, tetapi rincian potongan gagal dimuat: ${detailsError}`, "error");
  }
  const deductionDetailMarkup = details?.length
      ? details.map((item) => `<div class="slip-line"><span>${esc(item.jenis_potongan)}${["Kasbon", "Pinjaman Karyawan"].includes(item.jenis_potongan) ? ` ${badge("Cicilan Pinjaman")}` : ""}${item.keterangan ? `<small>${esc(item.keterangan)}</small>` : ""}</span><b>${money(item.nominal)}</b></div>`).join("")
      : detailsError
        ? `<p class="slip-no-details">Rincian potongan belum dapat dibaca: ${esc(detailsError)}${Number(row.potongan || 0) > 0 ? ` · Total payroll tetap ${money(row.potongan)} dan belum dirinci.` : ""}</p>`
        : `<p class="slip-no-details">Belum ada rincian potongan${Number(row.potongan || 0) > 0 ? ` · ${badge("Potongan belum dirinci")}` : ""}</p>`;
  $("detail-content").innerHTML = `<article class="slip"><header class="slip-head"><span class="brand-mark"><i data-lucide="heart-pulse"></i></span><h3>MEDSYNC<br>&amp; PAYROLL MANAGEMENT SYSTEM</h3><p>SLIP GAJI</p></header><div class="slip-employee"><span>Nama<strong>${esc(person.nama || "-")}</strong></span><span>NIK<strong>${esc(person.nik || "-")}</strong></span><span>Jabatan<strong>${esc(person.jabatan || "-")}</strong></span><span>Unit Kerja<strong>${esc(person.unit_kerja || "-")}</strong></span><span>Periode<strong>${esc(monthLabel(row.periode))}</strong></span></div><div class="slip-section-title">PENDAPATAN</div><div class="slip-line"><span>Gaji Pokok</span><b>${money(row.gaji_pokok)}</b></div><div class="slip-line"><span>Tunjangan</span><b>${money(row.tunjangan)}</b></div><div class="slip-line"><span>Insentif</span><b>${money(row.insentif)}</b></div><div class="slip-line"><span>Lembur</span><b>${money(row.total_lembur)}</b></div><div class="slip-total"><span>Total Pendapatan · Gaji Kotor</span><span>${money(row.gaji_kotor)}</span></div><div class="slip-section-title">POTONGAN</div>${deductionDetailMarkup}<div class="slip-total"><span>Total Potongan</span><span>${money(row.potongan)}</span></div><div class="slip-total slip-net"><span>GAJI BERSIH</span><span>${money(row.gaji_bersih)}</span></div><div class="slip-line"><span>Status Pembayaran</span><b>${esc(row.status_pembayaran)}</b></div><div class="slip-line"><span>Tanggal Pembayaran</span><b>${esc(dateLabel(row.tanggal_bayar))}</b></div><footer>Dokumen dibuat oleh MedSync · Sistem SDM, Payroll &amp; Akuntansi Rumah Sakit</footer></article>`;
  icons();
}

function openQuickAdd() {
  const options = Object.values(configs).map((item) => `<button class="quick-add-option" data-add-module="${item.key}"><i data-lucide="${({ karyawan: "users-round", absensi: "calendar-check-2", lembur: "clock-4", kinerja: "award", payroll: "wallet-cards" })[item.key]}"></i>Tambah ${esc(item.singular)}</button>`).join("");
  $("modal-eyebrow").textContent = "AKSES CEPAT";
  $("modal-title").textContent = "Data apa yang ingin ditambahkan?";
  $("form-fields").innerHTML = `<div class="quick-add-grid">${options}</div>`;
  $("form-error").textContent = "";
  $("modal-save").hidden = true;
  $("record-form").dataset.module = "";
  state.editing = null;
  modalOpen();
  $("form-fields").querySelector(".quick-add-grid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-module]");
    if (button) void openForm(button.dataset.addModule);
  });
  icons();
}

function selectMarkup(id, label, options, selected = "") {
  return `<label class="form-field"><span>${esc(label)}</span><select id="${id}">${options.map(([value, text]) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(text)}</option>`).join("")}</select></label>`;
}

async function renderReports() {
  await loadEmployees();
  const units = [...new Set(state.employees.map((person) => person.unit_kerja))].sort();
  const report = reportTypes[state.reportType];
  const statusOptions = {
    karyawan: ["Aktif", "Nonaktif", "Tetap", "Kontrak", "Honorer"],
    absensi: statuses,
    lembur: ["Menunggu", "Disetujui", "Ditolak"],
    kinerja: ["Sangat Baik", "Baik", "Cukup", "Kurang", "Sangat Kurang"],
    payroll: ["Draft", "Diproses", "Dibayar"],
    "payroll-deductions": ["Draft", "Diproses", "Dibayar"],
    loans: ["Diajukan", "Disetujui", "Ditolak", "Dicairkan", "Berjalan", "Lunas", "Dibatalkan", "Tidak Ada", "Menunggu Persetujuan"],
    "loan-installments": ["Terjadwal", "Diproses", "Dibayar"]
  }[state.reportType];
  $("page-content").innerHTML = `<section class="page-heading"><div><span class="eyebrow">INFORMASI AKUNTANSI &amp; SDM</span><h1>Laporan &amp; Biaya Tenaga Kerja</h1><p>Filter, cetak, dan ekspor laporan operasional berbasis database.</p></div></section><section class="panel report-panel"><div class="report-toolbar">${selectMarkup("report-type", "Jenis Laporan", Object.entries(reportTypes).map(([value, item]) => [value, item.label]), state.reportType)}${selectMarkup("report-period", "Periode", [["", "Semua Periode"], ...Array.from({ length: 12 }, (_, index) => { const value = shiftMonth(currentMonth(), -index); return [value, monthLabel(value)]; })], state.reportPeriod)}${selectMarkup("report-unit", "Unit Kerja", [["", "Semua Unit"], ...units.map((unit) => [unit, unit])], state.reportUnit)}${selectMarkup("report-employee", "Karyawan", [["", "Semua Karyawan"], ...state.employees.map((person) => [person.id_karyawan, `${person.nama} · ${person.nik}`])], state.reportEmployee)}${selectMarkup("report-status", "Status / Predikat", [["", "Semua Status"], ...statusOptions.map((status) => [status, status])], state.reportStatus)}<button class="button button-primary" id="report-refresh"><i data-lucide="filter"></i> Tampilkan</button></div><div class="report-actions"><button class="button button-quiet" id="report-csv"><i data-lucide="download"></i> Export CSV</button><button class="button button-quiet" id="report-print"><i data-lucide="printer"></i> Cetak laporan</button></div><div class="report-summary" id="report-summary"></div><div class="table-scroll"><table class="data-table"><thead><tr>${report.columns.map(([, label]) => `<th>${esc(label)}</th>`).join("")}</tr></thead><tbody id="report-body"><tr><td class="empty-cell" colspan="${report.columns.length}">Pilih filter lalu tampilkan laporan.</td></tr></tbody></table></div><div class="report-foot" id="report-foot"></div></section><section class="panel panel-pad labor-panel"><div class="panel-heading"><div><span class="eyebrow">RINGKASAN BIAYA TENAGA KERJA</span><h2>Komponen payroll berdasarkan bulan &amp; unit kerja</h2></div></div><div class="labor-filters">${selectMarkup("cost-period", "Bulan", Array.from({ length: 12 }, (_, index) => { const value = shiftMonth(currentMonth(), -index); return [value, monthLabel(value)]; }), state.costPeriod || currentMonth())}${selectMarkup("cost-unit", "Unit Kerja", [["", "Semua Unit"], ...units.map((unit) => [unit, unit])], state.costUnit || "")}</div><div class="cost-grid" id="cost-grid"></div></section>`;
  ["report-type", "report-period", "report-unit", "report-employee", "report-status"].forEach((id) => $(id).addEventListener("change", () => {
    const previousReportType = state.reportType;
    state.reportType = $("report-type").value;
    state.reportPeriod = $("report-period").value;
    state.reportUnit = $("report-unit").value;
    state.reportEmployee = $("report-employee").value;
    state.reportStatus = $("report-status").value;
    if (state.reportType !== previousReportType) state.reportStatus = "";
    void renderReports();
  }));
  $("report-refresh").addEventListener("click", () => void loadReport());
  $("report-csv").addEventListener("click", exportCsv);
  $("report-print").addEventListener("click", printReport);
  $("cost-period").addEventListener("change", (event) => { state.costPeriod = event.target.value; void loadLaborCosts(); });
  $("cost-unit").addEventListener("change", (event) => { state.costUnit = event.target.value; void loadLaborCosts(); });
  icons();
  await Promise.all([loadReport(), loadLaborCosts()]);
}

function filterReportRows(rows, report) {
  return rows.filter((row) => {
    if (state.reportPeriod && report.date && !String(row[report.date] || "").startsWith(state.reportPeriod)) return false;
    if (state.reportEmployee && row.id_karyawan !== state.reportEmployee) return false;
    const unit = row.unit_kerja || row.karyawan?.unit_kerja;
    if (state.reportUnit && unit !== state.reportUnit) return false;
    if (state.reportStatus) {
      const matches = state.reportType === "karyawan"
        ? row.status_aktif === state.reportStatus || row.status_pegawai === state.reportStatus
        : state.reportType === "kinerja"
          ? row.predikat === state.reportStatus
          : state.reportType === "loans"
            ? row.status === state.reportStatus || row.status_pembatalan === state.reportStatus
            : (row.status || row.status_kehadiran || row.status_pembayaran) === state.reportStatus;
      if (!matches) return false;
    }
    return true;
  });
}

async function loadReport() {
  const report = reportTypes[state.reportType];
  $("report-body").innerHTML = `<tr><td class="empty-cell" colspan="${report.columns.length}">Memuat laporan...</td></tr>`;
  try {
    state.reportRows = await fetchReportRows(report);
    $("report-body").innerHTML = renderRows(report, state.reportRows, false);
    $("report-foot").textContent = `${state.reportRows.length} baris · ${report.label}`;
    if (state.reportType === "payroll") {
      await renderPayrollReportSummary(state.reportRows);
    } else if (state.reportType === "payroll-deductions") {
      const breakdown = payrollDeductionGroups(state.reportRows);
      $("report-summary").innerHTML = `<span><strong>${state.reportRows.length}</strong> rincian</span>${breakdown.map(([type, amount]) => `<span>${esc(type)} <strong>${money(amount)}</strong></span>`).join("")}`;
    } else if (state.reportType === "loans") {
      const applied = state.reportRows.reduce((sum, row) => sum + Number(row.nominal_pengajuan || 0), 0);
      const paid = state.reportRows.reduce((sum, row) => sum + Number(row.total_terbayar || 0), 0);
      const balance = state.reportRows.filter((row) => row.status !== "Dibatalkan").reduce((sum, row) => sum + Number(row.sisa_saldo || 0), 0);
      const cancelledBalance = state.reportRows.filter((row) => row.status === "Dibatalkan").reduce((sum, row) => sum + Number(row.sisa_saldo || 0), 0);
      $("report-summary").innerHTML = `<span><strong>${state.reportRows.length}</strong> pinjaman</span><span>Pengajuan <strong>${money(applied)}</strong></span><span>Terbayar <strong>${money(paid)}</strong></span><span>Saldo aktif <strong>${money(balance)}</strong></span><span>Saldo historis dibatalkan <strong>${money(cancelledBalance)}</strong></span>`;
    } else if (state.reportType === "loan-installments") {
      const scheduled = state.reportRows.filter((row) => row.status === "Terjadwal").reduce((sum, row) => sum + Number(row.nominal_cicilan || 0), 0);
      const processing = state.reportRows.filter((row) => row.status === "Diproses").reduce((sum, row) => sum + Number(row.nominal_cicilan || 0), 0);
      const paid = state.reportRows.filter((row) => row.status === "Dibayar").reduce((sum, row) => sum + Number(row.nominal_cicilan || 0), 0);
      $("report-summary").innerHTML = `<span><strong>${state.reportRows.length}</strong> cicilan</span><span>Terjadwal <strong>${money(scheduled)}</strong></span><span>Diproses · menunggu payroll Dibayar <strong>${money(processing)}</strong></span><span>Sudah dibayar <strong>${money(paid)}</strong></span>`;
    } else {
      $("report-summary").innerHTML = `<span><strong>${state.reportRows.length}</strong> data ditemukan</span>`;
    }
    icons();
  } catch (error) {
    $("report-body").innerHTML = `<tr><td class="empty-cell" colspan="${report.columns.length}">${esc(explainError(error))}</td></tr>`;
    toast(explainError(error), "error");
  }
}

async function fetchReportRows(report) {
  if (state.reportType === "payroll-deductions") {
    const [deductionResult, payrollResult] = await Promise.all([
      supabaseClient.from("payroll_potongan").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("payroll").select("id_payroll,id_karyawan,periode,status_pembayaran,karyawan(nama,nik,jabatan,unit_kerja)")
    ]);
    if (deductionResult.error) throw deductionResult.error;
    if (payrollResult.error) throw payrollResult.error;
    const payrollById = new Map((payrollResult.data || []).map((row) => [row.id_payroll, row]));
    const rows = (deductionResult.data || []).map((detail) => {
      const payroll = payrollById.get(detail.id_payroll);
      return { ...detail, id_karyawan: payroll?.id_karyawan, periode: payroll?.periode, status_pembayaran: payroll?.status_pembayaran, karyawan: payroll?.karyawan };
    });
    return filterReportRows(rows, report);
  }
  if (state.reportType === "loan-installments") {
    let installmentsQuery = supabaseClient.from("payroll_pinjaman_cicilan").select("*").order("periode_payroll", { ascending: false });
    if (state.reportPeriod) {
      installmentsQuery = installmentsQuery.gte("periode_payroll", monthDate(state.reportPeriod))
        .lt("periode_payroll", monthDate(shiftMonth(state.reportPeriod, 1)));
    }
    const { data, error } = await installmentsQuery;
    if (error) throw error;
    const installments = data || [];
    const loanIds = [...new Set(installments.map((item) => item.id_pinjaman))];
    const payrollIds = [...new Set(installments.map((item) => item.id_payroll).filter(Boolean))];
    const [loansResult, payrollResult] = await Promise.all([
      loanIds.length ? supabaseClient.from("payroll_pinjaman").select("id_pinjaman,id_karyawan,jenis").in("id_pinjaman", loanIds) : Promise.resolve({ data: [], error: null }),
      payrollIds.length ? supabaseClient.from("payroll").select("id_payroll,status_pembayaran").in("id_payroll", payrollIds) : Promise.resolve({ data: [], error: null })
    ]);
    if (loansResult.error) throw loansResult.error;
    if (payrollResult.error) throw payrollResult.error;
    const loansById = new Map((loansResult.data || []).map((loan) => [loan.id_pinjaman, loan]));
    const payrollById = new Map((payrollResult.data || []).map((payroll) => [payroll.id_payroll, payroll]));
    const rows = installments.map((item) => ({
      ...item,
      id_karyawan: loansById.get(item.id_pinjaman)?.id_karyawan,
      jenis: loansById.get(item.id_pinjaman)?.jenis,
      karyawan: state.employees.find((employee) => employee.id_karyawan === loansById.get(item.id_pinjaman)?.id_karyawan),
      payroll_status: payrollById.get(item.id_payroll)?.status_pembayaran
    }));
    return filterReportRows(rows, report);
  }
  let query = supabaseClient.from(report.table).select(report.select);
  if (report.date && state.reportPeriod) {
    if (["absensi", "lembur", "loans"].includes(state.reportType)) {
      query = query.gte(report.date, monthDate(state.reportPeriod)).lt(report.date, monthDate(shiftMonth(state.reportPeriod, 1)));
    } else query = query.eq(report.date, monthDate(state.reportPeriod));
  }
  const { data, error } = await query.order(report.date || "created_at", { ascending: false });
  if (error) throw error;
  const rows = filterReportRows(data || [], report);
  if (state.reportType === "payroll" && rows.length) {
    const { data: details, error: detailsError } = await supabaseClient.from("payroll_potongan")
      .select("id_payroll,jenis_potongan,nominal")
      .in("id_payroll", rows.map((row) => row.id_payroll));
    if (detailsError) throw detailsError;
    const detailsByPayroll = new Map();
    for (const detail of details || []) {
      const list = detailsByPayroll.get(detail.id_payroll) || [];
      list.push(detail);
      detailsByPayroll.set(detail.id_payroll, list);
    }
    for (const row of rows) row.report_deduction_details = detailsByPayroll.get(row.id_payroll) || [];
  }
  return rows;
}

async function renderPayrollReportSummary(rows) {
  const payrollTotal = (field) => rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  const summary = {
    gross: payrollTotal("gaji_kotor"),
    deductions: payrollTotal("potongan"),
    net: payrollTotal("gaji_bersih"),
    pph: 0,
    bpjs: 0,
    kasbon: 0,
    loan: 0,
    other: 0,
    legacy: 0
  };
  const payrollWithDetails = new Set();
  for (const item of rows.flatMap((row) => row.report_deduction_details || [])) {
    payrollWithDetails.add(item.id_payroll);
    const amount = Number(item.nominal || 0);
    if (item.jenis_potongan === "PPh 21") summary.pph += amount;
    else if (item.jenis_potongan.startsWith("BPJS")) summary.bpjs += amount;
    else if (item.jenis_potongan === "Kasbon") summary.kasbon += amount;
    else if (item.jenis_potongan === "Pinjaman Karyawan") summary.loan += amount;
    else if (item.jenis_potongan === "Potongan Lainnya") summary.other += amount;
  }
  summary.legacy = rows.filter((row) => Number(row.potongan || 0) > 0 && !payrollWithDetails.has(row.id_payroll)).length;
  const categories = `<span>PPh 21 <strong>${money(summary.pph)}</strong></span><span>BPJS <strong>${money(summary.bpjs)}</strong></span><span>Kasbon <strong>${money(summary.kasbon)}</strong></span><span>Pinjaman <strong>${money(summary.loan)}</strong></span><span>Potongan Lainnya <strong>${money(summary.other)}</strong></span>`;
  $("report-summary").innerHTML = `<span><strong>${rows.length}</strong> payroll</span><span>Total Gaji Kotor <strong>${money(summary.gross)}</strong></span><span>Total Potongan <strong>${money(summary.deductions)}</strong></span><span>Total Gaji Bersih <strong>${money(summary.net)}</strong></span>${categories}${summary.legacy ? `<span>${summary.legacy} payroll · <strong>Potongan belum dirinci</strong></span>` : ""}`;
}

async function loadLaborCosts() {
  const costGrid = $("cost-grid");
  try {
    const period = $("cost-period").value;
    const unit = $("cost-unit").value;
    const { data, error } = await supabaseClient.from("payroll").select("gaji_pokok,total_lembur,tunjangan,insentif,potongan,gaji_bersih,karyawan(unit_kerja)").eq("periode", monthDate(period));
    if (error) throw error;
    const rows = (data || []).filter((row) => !unit || row.karyawan?.unit_kerja === unit);
    const totals = rows.reduce((sum, row) => {
      ["gaji_pokok", "total_lembur", "tunjangan", "insentif", "potongan", "gaji_bersih"].forEach((key) => { sum[key] += Number(row[key] || 0); });
      return sum;
    }, { gaji_pokok: 0, total_lembur: 0, tunjangan: 0, insentif: 0, potongan: 0, gaji_bersih: 0 });
    costGrid.innerHTML = `<p class="cost-caption">${esc(monthLabel(period))}${unit ? ` · ${esc(unit)}` : " · Semua unit"} · ${rows.length} payroll</p><div class="cost-cards">${[["Total Gaji Pokok", "gaji_pokok"], ["Total Tunjangan", "tunjangan"], ["Total Insentif", "insentif"], ["Total Lembur", "total_lembur"], ["Total Potongan", "potongan"], ["Total Gaji Bersih", "gaji_bersih"]].map(([label, key]) => `<article class="cost-card"><span>${label}</span><strong>${money(totals[key])}</strong></article>`).join("")}</div>`;
  } catch (error) {
    costGrid.innerHTML = `<p class="report-error">${esc(explainError(error))}</p>`;
    toast(explainError(error), "error");
  }
}

function csvValue(value) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCsv() {
  const report = reportTypes[state.reportType];
  const content = [report.columns.map(([, label]) => csvValue(label)).join(","), ...state.reportRows.map((row) => report.columns.map(([field]) => {
    if (field === "id_karyawan") return csvValue(employeeName(row));
    if (field === "periode") return csvValue(monthLabel(row.periode));
    return csvValue(row[field]);
  }).join(","))].join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `medhr-laporan-${state.reportType}-${state.reportPeriod || "semua-periode"}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Laporan berhasil diekspor ke CSV.");
}

function printReport() {
  document.body.classList.add("print-report");
  window.print();
  window.setTimeout(() => document.body.classList.remove("print-report"), 1000);
}

async function renderCurrent() {
  if (!supabaseClient) { errorPage(new Error(supabaseConfigMessage)); return; }
  try {
    if (state.view === "dashboard") await renderDashboard();
    else if (state.view === "payroll-deductions") await renderPayrollDeductions();
    else if (state.view === "payroll-loans") await renderPayrollLoans();
    else if (state.view === "laporan") await renderReports();
    else if (["accounting-dashboard", "accounts", "journals", "ledger", "income-statement", "balance-sheet"].includes(state.view)) await renderAccounting(state.view);
    else await renderEntity(state.view);
  } catch (error) {
    console.error("MedSync data request failed:", error);
    errorPage(error);
    toast(explainError(error), "error");
  }
}

function setView(view) {
  if (!(view in labels)) return;
  queuedView = view;
  if (isRenderingView) return;
  isRenderingView = true;
  void (async () => {
    try {
      while (queuedView) {
        const nextView = queuedView;
        queuedView = null;
        state.view = nextView;
        state.search = "";
        state.date = "";
        state.filters = {};
        $("page-crumb").textContent = labels[nextView];
        document.querySelectorAll(".nav-link").forEach((item) => item.classList.toggle("is-active", item.dataset.view === nextView));
        $("sidebar").classList.remove("is-open");
        $("sidebar-overlay").classList.remove("is-visible");
        $("app-shell").classList.toggle("sidebar-collapsed", state.compact);
        await renderCurrent();
      }
    } finally {
      isRenderingView = false;
      if (queuedView) setView(queuedView);
    }
  })();
}

function enterApp() {
  $("landing").hidden = true;
  $("app-shell").hidden = false;
  $("today-label").textContent = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  setView("dashboard");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnToLanding() {
  $("app-shell").hidden = true;
  $("landing").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-enter-app]").forEach((button) => button.addEventListener("click", enterApp));
document.querySelectorAll("[data-back-landing]").forEach((button) => button.addEventListener("click", returnToLanding));
document.querySelectorAll(".nav-link").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-view]");
  if (button) setView(button.dataset.openView);
});
$("record-form").addEventListener("submit", (event) => void saveRecord(event));
$("modal-close").addEventListener("click", closeForm);
$("modal-cancel").addEventListener("click", closeForm);
$("modal-backdrop").addEventListener("click", (event) => { if (event.target === $("modal-backdrop")) closeForm(); });
$("detail-close").addEventListener("click", () => { $("detail-backdrop").hidden = true; });
$("detail-cancel").addEventListener("click", () => { $("detail-backdrop").hidden = true; });
$("detail-backdrop").addEventListener("click", (event) => { if (event.target === $("detail-backdrop")) $("detail-backdrop").hidden = true; });
$("print-slip").addEventListener("click", () => window.print());
$("menu-toggle").addEventListener("click", () => { $("sidebar").classList.add("is-open"); $("sidebar-overlay").classList.add("is-visible"); });
$("sidebar-overlay").addEventListener("click", () => { $("sidebar").classList.remove("is-open"); $("sidebar-overlay").classList.remove("is-visible"); });
$("collapse-toggle").addEventListener("click", () => {
  state.compact = !state.compact;
  $("app-shell").classList.toggle("sidebar-collapsed", state.compact);
  $("collapse-toggle").innerHTML = `<i data-lucide="${state.compact ? "panel-left-open" : "panel-left-close"}"></i>`;
  icons();
});
$("landing-menu").addEventListener("click", () => document.querySelector(".landing-nav").classList.toggle("is-open"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeForm();
    $("detail-backdrop").hidden = true;
    $("sidebar").classList.remove("is-open");
    $("sidebar-overlay").classList.remove("is-visible");
  }
});
window.addEventListener("afterprint", () => document.body.classList.remove("print-report"));
icons();
})();
