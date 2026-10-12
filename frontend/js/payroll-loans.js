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
