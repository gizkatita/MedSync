-- This file creates the existing HR/payroll schema. Run accounting_migration.sql
-- after it to add the accounting tables and functions without replacing these tables.
create extension if not exists pgcrypto;

create table if not exists public.karyawan (
  id_karyawan uuid primary key default gen_random_uuid(),
  nik varchar(32) not null unique check (char_length(btrim(nik)) between 1 and 32),
  nama varchar(150) not null check (char_length(btrim(nama)) between 2 and 150),
  jabatan varchar(100) not null check (char_length(btrim(jabatan)) > 0),
  unit_kerja varchar(100) not null check (char_length(btrim(unit_kerja)) > 0),
  status_pegawai varchar(20) not null check (status_pegawai in ('Tetap', 'Kontrak', 'Honorer')),
  gaji_pokok numeric(14, 2) not null check (gaji_pokok >= 0),
  tanggal_masuk date not null,
  no_hp varchar(30),
  email varchar(254) unique check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  status_aktif varchar(20) not null default 'Aktif' check (status_aktif in ('Aktif', 'Nonaktif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.absensi (
  id_absensi uuid primary key default gen_random_uuid(),
  id_karyawan uuid not null references public.karyawan(id_karyawan) on delete cascade,
  tanggal date not null,
  jam_masuk time,
  jam_keluar time,
  status_kehadiran varchar(20) not null check (status_kehadiran in ('Hadir', 'Izin', 'Sakit', 'Cuti', 'Alpa')),
  keterlambatan integer not null default 0 check (keterlambatan >= 0),
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint absensi_satu_per_hari unique (id_karyawan, tanggal),
  constraint absensi_jam_hadir check (status_kehadiran <> 'Hadir' or (jam_masuk is not null and jam_keluar is not null))
);

create table if not exists public.lembur (
  id_lembur uuid primary key default gen_random_uuid(),
  id_karyawan uuid not null references public.karyawan(id_karyawan) on delete cascade,
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  total_jam numeric(7, 2) not null default 0 check (total_jam > 0),
  tarif_lembur numeric(14, 2) not null check (tarif_lembur >= 0),
  total_lembur numeric(14, 2) not null default 0 check (total_lembur >= 0),
  status varchar(20) not null default 'Menunggu' check (status in ('Menunggu', 'Disetujui', 'Ditolak')),
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lembur_jam_tidak_sama check (jam_mulai <> jam_selesai)
);

create table if not exists public.penilaian_kinerja (
  id_penilaian uuid primary key default gen_random_uuid(),
  id_karyawan uuid not null references public.karyawan(id_karyawan) on delete cascade,
  periode date not null check (periode = date_trunc('month', periode)::date),
  skor_kehadiran numeric(5, 2) not null check (skor_kehadiran between 0 and 100),
  skor_kedisiplinan numeric(5, 2) not null check (skor_kedisiplinan between 0 and 100),
  skor_kinerja numeric(5, 2) not null check (skor_kinerja between 0 and 100),
  skor_target numeric(5, 2) not null check (skor_target between 0 and 100),
  total_skor numeric(5, 2) not null default 0 check (total_skor between 0 and 100),
  predikat varchar(20) not null default 'Sangat Kurang' check (predikat in ('Sangat Baik', 'Baik', 'Cukup', 'Kurang', 'Sangat Kurang')),
  catatan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kinerja_satu_periode unique (id_karyawan, periode)
);

create table if not exists public.payroll (
  id_payroll uuid primary key default gen_random_uuid(),
  id_karyawan uuid not null references public.karyawan(id_karyawan) on delete cascade,
  periode date not null check (periode = date_trunc('month', periode)::date),
  gaji_pokok numeric(14, 2) not null default 0 check (gaji_pokok >= 0),
  total_lembur numeric(14, 2) not null default 0 check (total_lembur >= 0),
  tunjangan numeric(14, 2) not null default 0 check (tunjangan >= 0),
  insentif numeric(14, 2) not null default 0 check (insentif >= 0),
  potongan numeric(14, 2) not null default 0 check (potongan >= 0),
  gaji_kotor numeric(14, 2) not null default 0 check (gaji_kotor >= 0),
  gaji_bersih numeric(14, 2) not null default 0 check (gaji_bersih >= 0),
  status_pembayaran varchar(20) not null default 'Draft' check (status_pembayaran in ('Draft', 'Diproses', 'Dibayar')),
  tanggal_bayar date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_satu_per_periode unique (id_karyawan, periode),
  constraint payroll_potongan_wajar check (potongan <= gaji_pokok + total_lembur + tunjangan + insentif),
  constraint payroll_tanggal_bayar check (status_pembayaran <> 'Dibayar' or tanggal_bayar is not null)
);

create index if not exists karyawan_unit_status_idx on public.karyawan(unit_kerja, status_aktif);
create index if not exists absensi_tanggal_idx on public.absensi(tanggal desc);
create index if not exists absensi_karyawan_tanggal_idx on public.absensi(id_karyawan, tanggal desc);
create index if not exists lembur_status_tanggal_idx on public.lembur(status, tanggal desc);
create index if not exists lembur_karyawan_tanggal_idx on public.lembur(id_karyawan, tanggal desc);
create index if not exists kinerja_periode_idx on public.penilaian_kinerja(periode desc);
create index if not exists payroll_periode_idx on public.payroll(periode desc);
create index if not exists payroll_karyawan_periode_idx on public.payroll(id_karyawan, periode desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;

create or replace function public.hitung_absensi()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.keterlambatan := case
    when new.status_kehadiran = 'Hadir' and new.jam_masuk > time '08:00'
      then ceil(extract(epoch from (new.jam_masuk - time '08:00')) / 60)::integer
    else 0
  end;
  return new;
end;
$$;

create or replace function public.hitung_total_lembur()
returns trigger language plpgsql set search_path = ''
as $$
declare
  durasi numeric;
begin
  durasi := extract(epoch from (new.jam_selesai - new.jam_mulai));
  if durasi < 0 then durasi := durasi + 86400; end if;
  new.total_jam := round(durasi / 3600, 2);
  if new.total_jam <= 0 then raise exception 'Durasi lembur harus lebih dari nol'; end if;
  new.total_lembur := round(new.total_jam * new.tarif_lembur, 2);
  return new;
end;
$$;

create or replace function public.hitung_penilaian_kinerja()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.total_skor := round((new.skor_kehadiran + new.skor_kedisiplinan + new.skor_kinerja + new.skor_target) / 4, 2);
  new.predikat := case
    when new.total_skor >= 90 then 'Sangat Baik'
    when new.total_skor >= 80 then 'Baik'
    when new.total_skor >= 70 then 'Cukup'
    when new.total_skor >= 60 then 'Kurang'
    else 'Sangat Kurang'
  end;
  return new;
end;
$$;

create or replace function public.hitung_payroll()
returns trigger language plpgsql set search_path = ''
as $$
begin
  select k.gaji_pokok into new.gaji_pokok from public.karyawan k where k.id_karyawan = new.id_karyawan;
  if new.gaji_pokok is null then raise exception 'Karyawan tidak ditemukan'; end if;
  select coalesce(sum(l.total_lembur), 0) into new.total_lembur
  from public.lembur l
  where l.id_karyawan = new.id_karyawan and l.status = 'Disetujui'
    and l.tanggal >= new.periode and l.tanggal < (new.periode + interval '1 month')::date;
  new.gaji_kotor := new.gaji_pokok + new.total_lembur + new.tunjangan + new.insentif;
  new.gaji_bersih := new.gaji_kotor - new.potongan;
  return new;
end;
$$;

create or replace function public.sinkronkan_payroll_lembur()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    update public.payroll p set
      total_lembur = totals.nilai,
      gaji_kotor = p.gaji_pokok + totals.nilai + p.tunjangan + p.insentif,
      gaji_bersih = p.gaji_pokok + totals.nilai + p.tunjangan + p.insentif - p.potongan
    from (select coalesce(sum(l.total_lembur), 0) as nilai from public.lembur l
          where l.id_karyawan = old.id_karyawan and l.status = 'Disetujui'
            and l.tanggal >= date_trunc('month', old.tanggal)::date
            and l.tanggal < (date_trunc('month', old.tanggal) + interval '1 month')::date) totals
    where p.id_karyawan = old.id_karyawan and p.periode = date_trunc('month', old.tanggal)::date
      and exists (select 1 from public.karyawan k where k.id_karyawan = old.id_karyawan);
  end if;
  if tg_op <> 'DELETE' then
    update public.payroll p set
      total_lembur = totals.nilai,
      gaji_kotor = p.gaji_pokok + totals.nilai + p.tunjangan + p.insentif,
      gaji_bersih = p.gaji_pokok + totals.nilai + p.tunjangan + p.insentif - p.potongan
    from (select coalesce(sum(l.total_lembur), 0) as nilai from public.lembur l
          where l.id_karyawan = new.id_karyawan and l.status = 'Disetujui'
            and l.tanggal >= date_trunc('month', new.tanggal)::date
            and l.tanggal < (date_trunc('month', new.tanggal) + interval '1 month')::date) totals
    where p.id_karyawan = new.id_karyawan and p.periode = date_trunc('month', new.tanggal)::date
      and exists (select 1 from public.karyawan k where k.id_karyawan = new.id_karyawan);
  end if;
  return null;
end;
$$;

create or replace function public.sinkronkan_gaji_karyawan()
returns trigger language plpgsql set search_path = ''
as $$
begin
  update public.payroll p set gaji_pokok = new.gaji_pokok,
    gaji_kotor = new.gaji_pokok + p.total_lembur + p.tunjangan + p.insentif,
    gaji_bersih = new.gaji_pokok + p.total_lembur + p.tunjangan + p.insentif - p.potongan
  where p.id_karyawan = new.id_karyawan;
  return null;
end;
$$;

drop trigger if exists karyawan_set_updated_at on public.karyawan;
create trigger karyawan_set_updated_at before update on public.karyawan for each row execute function public.set_updated_at();
drop trigger if exists absensi_calculate on public.absensi;
create trigger absensi_calculate before insert or update on public.absensi for each row execute function public.hitung_absensi();
drop trigger if exists absensi_set_updated_at on public.absensi;
create trigger absensi_set_updated_at before update on public.absensi for each row execute function public.set_updated_at();
drop trigger if exists lembur_calculate on public.lembur;
drop trigger if exists lembur_hitung_total on public.lembur;
create trigger lembur_calculate before insert or update on public.lembur for each row execute function public.hitung_total_lembur();
drop trigger if exists lembur_set_updated_at on public.lembur;
create trigger lembur_set_updated_at before update on public.lembur for each row execute function public.set_updated_at();
drop trigger if exists lembur_sync_payroll on public.lembur;
create trigger lembur_sync_payroll after insert or update or delete on public.lembur for each row execute function public.sinkronkan_payroll_lembur();
drop trigger if exists kinerja_calculate on public.penilaian_kinerja;
create trigger kinerja_calculate before insert or update on public.penilaian_kinerja for each row execute function public.hitung_penilaian_kinerja();
drop trigger if exists kinerja_set_updated_at on public.penilaian_kinerja;
create trigger kinerja_set_updated_at before update on public.penilaian_kinerja for each row execute function public.set_updated_at();
drop trigger if exists payroll_calculate on public.payroll;
create trigger payroll_calculate before insert or update on public.payroll for each row execute function public.hitung_payroll();
drop trigger if exists payroll_set_updated_at on public.payroll;
create trigger payroll_set_updated_at before update on public.payroll for each row execute function public.set_updated_at();
drop trigger if exists karyawan_sync_payroll on public.karyawan;
create trigger karyawan_sync_payroll after update of gaji_pokok on public.karyawan for each row
when (old.gaji_pokok is distinct from new.gaji_pokok)
execute function public.sinkronkan_gaji_karyawan();

alter table public.karyawan enable row level security;
alter table public.absensi enable row level security;
alter table public.lembur enable row level security;
alter table public.penilaian_kinerja enable row level security;
alter table public.payroll enable row level security;

-- Academic/demo deployment only: no-login anon access exposes all HR and payroll data.
drop policy if exists "Akses demo akademik untuk anon" on public.karyawan;
create policy "Akses demo akademik untuk anon" on public.karyawan for all to anon using (true) with check (true);
drop policy if exists "Akses demo akademik untuk anon" on public.absensi;
create policy "Akses demo akademik untuk anon" on public.absensi for all to anon using (true) with check (true);
drop policy if exists "Akses demo akademik untuk anon" on public.lembur;
create policy "Akses demo akademik untuk anon" on public.lembur for all to anon using (true) with check (true);
drop policy if exists "Akses demo akademik untuk anon" on public.penilaian_kinerja;
create policy "Akses demo akademik untuk anon" on public.penilaian_kinerja for all to anon using (true) with check (true);
drop policy if exists "Akses demo akademik untuk anon" on public.payroll;
create policy "Akses demo akademik untuk anon" on public.payroll for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.karyawan, public.absensi, public.lembur, public.penilaian_kinerja, public.payroll to anon;

insert into public.karyawan (nik, nama, jabatan, unit_kerja, status_pegawai, gaji_pokok, tanggal_masuk, no_hp, email)
values
  ('33010001', 'Alya Pratama', 'Perawat', 'Rawat Inap', 'Tetap', 5500000, '2022-05-16', '081200000001', 'alya.pratama@rsdemo.id'),
  ('33010002', 'Raka Wijaya', 'Dokter Umum', 'IGD', 'Kontrak', 8500000, '2021-11-01', '081200000002', 'raka.wijaya@rsdemo.id'),
  ('33010003', 'Nadia Putri', 'Analis Laboratorium', 'Laboratorium', 'Tetap', 6200000, '2023-02-20', '081200000003', 'nadia.putri@rsdemo.id'),
  ('33010004', 'Bima Saputra', 'Radiografer', 'Radiologi', 'Kontrak', 6800000, '2022-08-08', '081200000004', 'bima.saputra@rsdemo.id'),
  ('33010005', 'Sinta Maharani', 'Staf Administrasi', 'Administrasi', 'Honorer', 4500000, '2024-01-15', '081200000005', 'sinta.maharani@rsdemo.id'),
  ('33010006', 'Dewi Lestari', 'Apoteker', 'Farmasi', 'Tetap', 7100000, '2020-04-06', '081200000006', 'dewi.lestari@rsdemo.id'),
  ('33010007', 'Fajar Hidayat', 'Analis Kesehatan', 'Laboratorium', 'Kontrak', 5700000, '2023-09-11', '081200000007', 'fajar.hidayat@rsdemo.id'),
  ('33010008', 'Intan Permata', 'Bidan', 'Rawat Inap', 'Tetap', 5900000, '2019-07-22', '081200000008', 'intan.permata@rsdemo.id'),
  ('33010009', 'Yoga Prasetyo', 'Petugas IGD', 'IGD', 'Honorer', 4800000, '2024-03-04', '081200000009', 'yoga.prasetyo@rsdemo.id'),
  ('33010010', 'Maya Anggraini', 'Staf Keuangan', 'Administrasi', 'Tetap', 6500000, '2021-06-14', '081200000010', 'maya.anggraini@rsdemo.id')
on conflict (nik) do nothing;

insert into public.absensi (id_karyawan, tanggal, jam_masuk, jam_keluar, status_kehadiran, keterangan)
select k.id_karyawan, current_date, case when n % 4 = 0 then '08:12'::time else '07:55'::time end,
       '16:05'::time, case when n = 3 then 'Izin' else 'Hadir' end,
       case when n = 3 then 'Keperluan keluarga' else 'Shift pagi' end
from public.karyawan k
join generate_series(1, 10) as employee_number(n) on k.nik = '330100' || lpad(n::text, 2, '0')
on conflict (id_karyawan, tanggal) do nothing;

insert into public.absensi (id_karyawan, tanggal, jam_masuk, jam_keluar, status_kehadiran, keterangan)
select k.id_karyawan, current_date - d.day_offset,
       case when (d.day_offset + n) % 5 = 0 then '08:10'::time else '07:50'::time end,
       '16:00'::time,
       case when (d.day_offset + n) % 17 = 0 then 'Sakit'
            when (d.day_offset + n) % 13 = 0 then 'Cuti'
            when (d.day_offset + n) % 11 = 0 then 'Izin' else 'Hadir' end,
       'Data demo absensi'
from generate_series(1, 10) as employee_number(n)
cross join generate_series(1, 14) as d(day_offset)
join public.karyawan k on k.nik = '330100' || lpad(n::text, 2, '0')
where extract(isodow from current_date - d.day_offset) < 6
on conflict (id_karyawan, tanggal) do nothing;

insert into public.lembur (id_karyawan, tanggal, jam_mulai, jam_selesai, tarif_lembur, status, keterangan)
select k.id_karyawan, current_date - v.offset_days, '16:00', v.finish, v.rate, v.status, v.note
from (values
  ('33010001', 2, '19:00'::time, 35000, 'Disetujui', 'Penggantian shift'),
  ('33010002', 1, '18:30'::time, 40000, 'Menunggu', 'Persiapan layanan IGD'),
  ('33010003', 3, '18:00'::time, 30000, 'Disetujui', 'Pemeriksaan sampel tambahan'),
  ('33010006', 4, '20:00'::time, 32000, 'Menunggu', 'Rekonsiliasi stok farmasi'),
  ('33010008', 5, '19:00'::time, 35000, 'Disetujui', 'Dukungan layanan rawat inap')
) as v(nik, offset_days, finish, rate, status, note)
join public.karyawan k on k.nik = v.nik
where not exists (select 1 from public.lembur l where l.id_karyawan = k.id_karyawan and l.tanggal = current_date - v.offset_days and l.keterangan = v.note);

insert into public.penilaian_kinerja (id_karyawan, periode, skor_kehadiran, skor_kedisiplinan, skor_kinerja, skor_target, catatan)
select k.id_karyawan, date_trunc('month', current_date)::date, v.attendance, v.discipline, v.performance, v.target, 'Evaluasi kinerja periode berjalan'
from (values
  ('33010001', 92, 88, 90, 86), ('33010002', 95, 91, 94, 89), ('33010003', 90, 87, 91, 88),
  ('33010004', 84, 82, 85, 80), ('33010005', 88, 85, 82, 86), ('33010006', 96, 93, 92, 94),
  ('33010007', 86, 89, 84, 83), ('33010008', 94, 92, 90, 91), ('33010009', 78, 81, 79, 82),
  ('33010010', 91, 90, 93, 92)
) as v(nik, attendance, discipline, performance, target)
join public.karyawan k on k.nik = v.nik
on conflict (id_karyawan, periode) do nothing;

insert into public.payroll (id_karyawan, periode, tunjangan, insentif, potongan, status_pembayaran, tanggal_bayar)
select k.id_karyawan, date_trunc('month', current_date)::date, v.allowance, v.incentive, v.deduction, v.status,
       case when v.status = 'Dibayar' then current_date else null end
from (values
  ('33010001', 750000, 250000, 150000, 'Dibayar'),
  ('33010002', 900000, 300000, 250000, 'Diproses'),
  ('33010003', 600000, 150000, 100000, 'Draft'),
  ('33010006', 800000, 200000, 175000, 'Draft'),
  ('33010008', 700000, 180000, 120000, 'Draft')
) as v(nik, allowance, incentive, deduction, status)
join public.karyawan k on k.nik = v.nik
on conflict (id_karyawan, periode) do nothing;
