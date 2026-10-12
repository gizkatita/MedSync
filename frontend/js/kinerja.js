export const kinerjaConfig = {
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
