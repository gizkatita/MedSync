import { supabaseClient, supabaseConfigMessage } from "../config.js";
import { karyawanConfig } from "./karyawan.js";
import { absensiConfig } from "./absensi.js";
import { lemburConfig } from "./lembur.js";
import { kinerjaConfig } from "./kinerja.js";
import { payrollConfig } from "./payroll.js";

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
