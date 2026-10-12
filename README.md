# MedSync — Hospital HR, Payroll & Accounting Management System

MedSync adalah aplikasi web Sistem Informasi Akuntansi untuk mengintegrasikan data karyawan rumah sakit, absensi, lembur, penilaian kinerja, payroll, rincian potongan, kasbon/pinjaman, slip gaji, jurnal, buku besar, dan laporan biaya tenaga kerja. Aplikasi memakai HTML, CSS, dan JavaScript tanpa framework, dengan Supabase PostgreSQL sebagai database.

DEMO WEB : https://gizkatita.github.io/MedSync/

> **Penting — konfigurasi demo akademik:** SQL mengaktifkan kebijakan RLS yang mengizinkan peran `anon` membaca dan mengubah data HR/payroll dan daftar akun, serta memanggil RPC jurnal. Hal ini diperlukan karena aplikasi tidak memakai halaman login. Gunakan hanya untuk tugas/demo dengan data fiktif di project Supabase terpisah. Jangan gunakan kebijakan tersebut untuk data rumah sakit sungguhan atau deploy publik.

## Teknologi dan struktur folder

```text
SISTEM_PAYROLL_HOSPITAL/
├── backend/
│   ├── app.js
│   └── supabase/
│       ├── schema.sql
│       ├── accounting_migration.sql
│       ├── payroll_deductions_migration.sql
│       └── payroll_loans_migration.sql
├── frontend/
│   ├── config.js
│   ├── app.bundle.js
│   ├── build.py
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── payroll-loans.css
│   └── js/
│       ├── app.js
│       ├── karyawan.js
│       ├── absensi.js
│       ├── lembur.js
│       ├── kinerja.js
│       ├── payroll.js
│       ├── accounting.js
│       ├── payroll-deductions.js
│       └── payroll-loans.js
└── README.md
```

- Frontend: HTML5, CSS3 responsif, JavaScript ES modules, Supabase JS v2 CDN, Lucide icons.
- Database: Supabase PostgreSQL; tabel HR/payroll, kasbon/pinjaman, rincian potongan payroll, dan tabel akuntansi.
- `backend/app.js`: server file statis Node.js opsional untuk menjalankan frontend lokal, tanpa dependencies atau `package.json`.

## ERD — HR, payroll, dan akuntansi

```text
KARYAWAN (1) ──< ABSENSI
KARYAWAN (1) ──< LEMBUR
KARYAWAN (1) ──< PENILAIAN_KINERJA
KARYAWAN (1) ──< PAYROLL
KARYAWAN (1) ──< PAYROLL_PINJAMAN (1) ──< PAYROLL_PINJAMAN_CICILAN
PAYROLL_PINJAMAN (1) ──< PAYROLL_PINJAMAN_PEMBATALAN / PAYROLL_PINJAMAN_AUDIT
PAYROLL_PINJAMAN_CICILAN (1) ──< PAYROLL_PINJAMAN_POTONGAN >── (1) PAYROLL_POTONGAN
PAYROLL (1) ──< JOURNAL_ENTRIES (pengakuan dan pembayaran)
JOURNAL_ENTRIES (1) ──< JOURNAL_LINES >── (1) ACCOUNTS
```

Constraint existing membatasi NIK unik, satu absensi per karyawan per tanggal, serta satu penilaian dan payroll per karyawan per bulan. Tabel jurnal menyimpan sumber payroll dan tipe transaksi unik; baris jurnal memiliki foreign key akun/jurnal dan validasi debit-kredit. Posting divalidasi di PostgreSQL dan mengunci jurnal beserta barisnya.

## Menyiapkan Supabase

1. Buat project Supabase khusus demo kuliah.
2. Buka **SQL Editor → New query**, salin seluruh isi `backend/supabase/schema.sql`, lalu jalankan untuk membuat skema HR/payroll existing dan data demo.
3. Jalankan isi `backend/supabase/accounting_migration.sql` pada SQL Editor yang sama. Migration ini menambahkan objek akuntansi; data/tabel HR yang ada tidak dihapus. Untuk database existing yang sudah memiliki tabel accounting, jangan jalankan ulang migration tersebut.
4. Setelah memastikan tabel `payroll` memiliki kolom `id_payroll`, `potongan`, `gaji_kotor`, dan `gaji_bersih`, jalankan `backend/supabase/payroll_deductions_migration.sql`. Migration ini hanya menambahkan tabel rincian, policy, trigger validasi, dan RPC atomik; tidak mengubah tabel accounting atau membuat rincian payroll lama. Jika migration potongan versi sebelumnya sudah diterapkan, jalankan kembali file idempotent ini untuk mengunci perubahan hanya pada payroll Draft, melindungi rincian cicilan yang tertaut dari perubahan/penghapusan lewat RPC umum, dan memperbarui validasi. Jangan jalankan ulang migration accounting.
5. Jalankan `backend/supabase/payroll_loans_migration.sql` setelah schema HR/payroll, accounting, dan payroll deductions tersedia. Migration ini menambahkan tabel pinjaman, jadwal cicilan, permintaan pembatalan, role simulasi, audit, dan RPC payroll; tidak menghapus riwayat atau mengubah migration akuntansi. Setelah migration dijalankan, provision role `HR/Admin` dan/atau `Approver` hanya untuk karyawan berwenang melalui SQL Editor, misalnya `insert into public.payroll_pinjaman_roles (id_karyawan, role) values ('<UUID_KARYAWAN>', 'HR/Admin') on conflict (id_karyawan, role) do update set is_active = true;`. Karyawan yang tersedia otomatis mendapat role `Employee`.
6. Untuk database yang sudah memasang Fase 4, jalankan `backend/supabase/payroll_loans_processing_fix.sql` setelah Fase 3 dan Fase 4. Migration inkremental ini menambahkan status cicilan `Diproses`, memperbarui `process_payroll_pinjaman` agar membuat rincian melalui `save_payroll_potongan` dan menautkannya tanpa mengurangi saldo sebelum payroll dibayar, serta menambahkan `settle_payroll_pinjaman` untuk memperbarui saldo hanya setelah payroll berstatus `Dibayar`. Untuk instalasi baru, jalankan juga migration ini setelah migration Fase 4.
7. **Workflow role adalah simulasi, bukan authentication.** Aplikasi belum memakai login. Pemilih actor di UI hanya untuk menjalankan simulasi; seluruh RPC tetap memeriksa karyawan, role, status request, dan larangan self-approval di database. Jangan gunakan workflow ini untuk data atau keputusan produksi sebelum Supabase Auth diintegrasikan dan actor diturunkan dari `auth.uid()`.
8. Buka **Project Settings → API** (atau **Data API / Connect**, bergantung versi dashboard) untuk mendapatkan **Project URL** dan **anon / publishable key**. Jangan pernah memakai `service_role` / secret key di browser.
9. Konfigurasi project ini sudah diisi di `frontend/config.js`. Jika memakai project Supabase lain, ganti dua string konfigurasi di bagian paling atas:

   ```js
   const supabaseUrl = "https://PROJECT-REF.supabase.co";
   const supabaseAnonKey = "sb_publishable_..."; // atau anon public key project
   ```

9. Simpan file. Setelah menjalankan migration sesuai urutan dan mengisi konfigurasi, halaman dapat mengelola data HR/payroll, kasbon/pinjaman, dan akuntansi langsung di Supabase.

URL dan anon/publishable key digunakan di browser dan bukan pengganti kebijakan RLS; kebijakan anon yang sengaja terbuka hanya layak digunakan dengan data demo. Tidak ada `.env`, `env.example`, atau `package.json`.

### Menjalankan ulang migration

Migration menggunakan `IF NOT EXISTS`/`CREATE OR REPLACE` untuk objeknya. Namun migration accounting lama memasukkan akun standar, jadi jangan jalankan ulang pada database aktif kecuali telah ditinjau. Migration potongan dapat dijalankan ulang dan tidak menghapus payroll atau jurnal.

## Menjalankan aplikasi

**Pilihan 1 — buka langsung:** klik dua kali `frontend/index.html`. Script aplikasi sudah dibundel agar halaman juga berjalan tanpa JavaScript modules, yang diblokir browser pada alamat `file://`. Koneksi Supabase tetap memerlukan internet.

**Pilihan 2 — VS Code Live Server (direkomendasikan untuk pengembangan):**

1. Buka `frontend/index.html` di VS Code.
2. Klik **Go Live** dari ekstensi Live Server.
3. Buka URL lokal yang ditampilkan.

**Pilihan 3 — server lokal bawaan (Node.js):**

```powershell
node backend/app.js
```

Buka `http://localhost:8080`. Untuk port lain di PowerShell:

```powershell
$env:PORT=8001; node backend/app.js
```

Ketika aplikasi dibuka, pengguna langsung melihat landing page. Tombol **Masuk ke Sistem** dan **Mulai Kelola Data** membuka workspace tanpa login. Jika mengubah file di `frontend/config.js` atau `frontend/js/`, buat ulang bundle sebelum membuka aplikasi atau push: `py frontend/build.py` (Windows) atau `python3 frontend/build.py` (macOS/Linux).

## Fitur aplikasi

- Dashboard memuat jumlah karyawan aktif, absensi hadir hari ini, lembur menunggu, total payroll bulan berjalan, sisa saldo kasbon/pinjaman, dan rata-rata skor kinerja langsung dari tabel Supabase.
- Grafik ringkasan absensi, tren payroll enam periode, karyawan per unit/status, dan distribusi predikat dibangun dari data database.
- CRUD karyawan, absensi, lembur, penilaian kinerja, dan payroll memakai Supabase; rincian potongan per kategori memperbarui total potongan dan gaji bersih secara atomik melalui `save_payroll_potongan`.
- Tabel, detail payroll, slip gaji, laporan, dan dashboard akuntansi menampilkan rincian potongan yang sama. Cicilan kasbon/pinjaman ditambahkan ke `payroll_potongan` melalui workflow Fase 4 dan tetap tertaut pada cicilan.
- Laporan memiliki rincian potongan payroll dan jadwal/transaksi cicilan. Jurnal pengakuan memakai nilai payroll tersimpan, sedangkan jurnal Posted, buku besar, dan laporan keuangan tetap dikunci/berbasis jurnal Posted.
- Absensi hanya satu catatan per karyawan per tanggal; PostgreSQL otomatis menghitung keterlambatan dari jam masuk setelah pukul 08.00.
- Pengajuan lembur dapat disetujui/ditolak; total durasi dan nominal dihitung PostgreSQL, dan payroll bulan terkait disinkronkan ketika lembur disetujui/diubah.
- Skor penilaian (0–100), total skor, dan predikat dihitung PostgreSQL.
- Payroll memperoleh gaji pokok karyawan dan total lembur disetujui dari database. Tunjangan, insentif, dan potongan dapat diisi pada form; total gaji dihitung otomatis. Absensi dan penilaian kinerja belum mengubah gaji secara otomatis karena aturan pengali/potongannya belum ditetapkan.
- Persetujuan payroll tersedia di menu **Payroll**: pilih **Setujui Payroll** pada status Draft untuk mengubahnya menjadi Diproses. Setelah jurnal payroll Posted dan transfer benar-benar dilakukan, pilih **Catat Pembayaran** lalu isi tanggal transfer; proses tersebut mengubah status menjadi Dibayar dan membuka langkah pembuatan jurnal pembayaran.
- Menu **Potongan Gaji** menyimpan rincian per payroll melalui RPC transaksional; jumlah rincian menjadi `payroll.potongan`, gaji bersih dihitung ulang, dan total potongan tidak boleh melebihi gaji kotor.
- Menu **Kasbon & Pinjaman** mengelola pengajuan, persetujuan, pencairan, jadwal cicilan, saldo, laporan, dan audit trail. Cicilan periode pertama default ke periode payroll terbuka terdekat; periode berikutnya bulanan dan dapat dipilih ke depan.
- Saat payroll Draft diproses, cicilan Terjadwal pada periode payroll dimasukkan sebagai rincian Kasbon/Pinjaman melalui transaksi atomik. Payroll berjurnal/terkunci, potongan lama tanpa rincian, atau potongan pinjaman manual yang berpotensi double deduction ditolak untuk direkonsiliasi lebih dahulu.
- Pembatalan pinjaman adalah soft-cancel melalui pengajuan, persetujuan/penolakan, dan audit, tetapi hanya tersedia sebelum pencairan. Pinjaman yang telah dicairkan atau memiliki cicilan tidak dapat dibatalkan melalui workflow ini agar saldo dan riwayat payroll tetap utuh; pinjaman Lunas juga tidak dapat dibatalkan.
- Pemilihan actor/role untuk workflow adalah simulasi internal karena aplikasi belum memiliki login. Role dan pemisahan pemohon/approver tetap divalidasi database/RPC, tetapi identitas belum dapat dianggap terautentikasi.
- Payroll lama yang mempunyai `potongan` tanpa rincian tetap mempertahankan agregatnya dan ditandai **Potongan belum dirinci**. Sistem tidak membuat kategori/nominal detail otomatis. Payroll yang sudah memiliki jurnal tidak dapat diedit agar jurnal existing tidak berubah.
- Chart of Accounts mendukung tambah, edit, pencarian, filter tipe, dan aktivasi/nonaktif akun. Akun yang sudah terpakai jurnal tidak dapat dihapus karena relasi foreign key.
- Tombol **Buat Jurnal Payroll** di baris payroll berstatus Diproses/Dibayar membuat jurnal Draft langsung dari nominal payroll Supabase. Jurnal mendebit akun beban gaji, lembur, tunjangan, insentif dan mengkredit utang gaji bersih serta utang potongan.
- Payroll Dibayar dapat dibuatkan jurnal pembayaran dengan akun Kas/Bank pilihan setelah jurnal payroll berstatus Posted. Posting jurnal menolak debit/kredit tidak seimbang dan mengunci jurnal Posted.
- Dashboard akuntansi, Jurnal, Buku Besar, Laba Rugi, dan Posisi Keuangan memakai data Supabase. Buku besar serta laporan hanya membaca jurnal Posted; pendapatan yang tidak ada pada jurnal tidak dibuatkan angka.
- Slip gaji menampilkan identitas, pendapatan, rincian potongan aktual (atau status belum dirinci), total, status, dan tanggal bayar; tombol cetak memakai `window.print()`.
- Laporan karyawan, absensi, lembur, kinerja, payroll, dan kasbon/pinjaman menyediakan filter periode, unit, karyawan, status/predikat, cetak, dan ekspor CSV.
- Ringkasan biaya tenaga kerja menampilkan gaji pokok, tunjangan, insentif, lembur, potongan, serta gaji bersih berdasarkan bulan dan unit kerja.
- Sidebar dapat diciutkan di layar besar dan menjadi menu drawer di ponsel; tabel dapat digulir horizontal.

### Menguji alur Payroll → Jurnal → Buku Besar → Laporan

1. Pastikan migration akuntansi sudah dijalankan di Supabase. Buka **Daftar Akun** dan pastikan akun 101–504 serta akun 202 tersedia.
2. Buka **Payroll**. Pada payroll Draft, pilih **Setujui Payroll**. Jika workflow role aktif, pilih actor HR/Admin; sistem juga menautkan cicilan terjadwal. Status berubah menjadi Diproses.
3. Pada payroll Diproses, pilih **Buat Jurnal Payroll**. Buka **Jurnal**, periksa baris debit/kredit dan kesamaan total, kemudian pilih **Posting**. Payroll Draft belum dapat dijurnal.
4. Buka **Buku Besar**, pilih akun Beban Gaji atau Utang Gaji dan periode terkait. Mutasi Posted, saldo awal, total debit/kredit, serta saldo berjalan harus muncul.
5. Setelah transfer gaji benar-benar dilakukan, kembali ke **Payroll**, pilih **Catat Pembayaran**, dan isi tanggal transfer. Untuk payroll Dibayar, pilih akun Kas/Bank dan **Buat Jurnal Pembayaran** setelah jurnal pengakuan sudah Posted. Kembali ke Jurnal dan posting jurnal pembayaran.
6. Buka **Laba Rugi** dan **Posisi Keuangan** untuk melihat dampak jurnal Posted. Pendapatan tetap kosong/nol sampai ada jurnal pendapatan aktual; aplikasi tidak membuat nilai pendapatan contoh.

## Deploy ke GitHub Pages

1. Isi `frontend/config.js` dengan Project URL dan anon/publishable key demo yang sudah diatur (RLS anon terbuka berarti key dan semua data demo bisa diakses publik).
2. Push repository ke GitHub dan buka **Settings → Pages**.
3. Pilih **GitHub Actions** sebagai deployment source. Workflow `.github/workflows/pages.yml` akan membangun Pages saat push ke branch `main`.
4. Workflow membangun ulang bundle aplikasi dari kode sumber secara otomatis sebelum deploy. Project URL dan anon/publishable key diambil dari `frontend/config.js`; jangan masukkan service-role key.
5. Setelah workflow selesai, buka URL Pages. Pastikan URL project Supabase dapat diakses serta schema dan accounting migration sudah dijalankan.

> Berbeda dengan aplikasi login, anon key memang terlihat di browser. Perlindungan data pada versi demo ini tidak disediakan oleh secret key, sehingga jangan gunakan data personal maupun payroll asli.

## Troubleshooting

- **Dashboard menampilkan “Hubungkan Supabase”:** cek Project URL dan anon/publishable key di `frontend/config.js`, pastikan library CDN dapat dimuat, lalu refresh.
- **Tabel akuntansi tidak ditemukan:** jalankan `backend/supabase/accounting_migration.sql` sesudah `backend/supabase/schema.sql` pada SQL Editor Supabase.
- **RLS / permission denied:** cek apakah seluruh policy demo dan grant anon pada akhir file schema berhasil dijalankan. Ingat, kebijakan demo tersebut membuka CRUD anon.
- **NIK, absensi, kinerja, atau payroll duplikat:** setiap pelanggaran constraint unik dilaporkan sebagai notifikasi; perbaiki record lama atau gunakan tanggal/periode/karyawan yang berbeda.
- **Payroll duplikat:** satu karyawan hanya memiliki satu record per bulan. Edit record bulan tersebut alih-alih membuat duplikat.
- **Halaman langsung dibuka tetapi bundle belum mengikuti perubahan kode:** jalankan `py frontend/build.py` (Windows) atau `python3 frontend/build.py` (macOS/Linux).
- **GitHub Pages tidak menampilkan data:** pastikan workflow Pages selesai sukses, `frontend/config.js` berisi kredensial project yang benar, project Supabase aktif, dan skema/policy anon sudah diterapkan.
- **Periksa error runtime:** buka Developer Tools → Console dan Network untuk melihat error query Supabase atau library eksternal.
