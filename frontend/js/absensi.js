export const absensiConfig = {
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
