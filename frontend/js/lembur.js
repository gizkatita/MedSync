export const lemburConfig = {
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
