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
