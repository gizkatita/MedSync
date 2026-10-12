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
