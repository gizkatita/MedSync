export const karyawanConfig = {
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
