begin;

create table if not exists public.payroll_pinjaman_roles (
  id_karyawan uuid not null references public.karyawan(id_karyawan) on delete cascade,
  role text not null check (role in ('Employee', 'HR/Admin', 'Approver')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (id_karyawan, role)
);

insert into public.payroll_pinjaman_roles (id_karyawan, role)
select k.id_karyawan, 'Employee'
from public.karyawan k
on conflict (id_karyawan, role) do nothing;

create table if not exists public.payroll_pinjaman (
  id_pinjaman uuid primary key default gen_random_uuid(),
  id_karyawan uuid not null,
  pemohon_id uuid not null,
  jenis text not null,
  nominal_pengajuan numeric(14, 2) not null,
  nominal_disetujui numeric(14, 2),
  tenor integer not null,
  angsuran_per_bulan numeric(14, 2),
  total_terbayar numeric(14, 2) not null default 0,
  sisa_saldo numeric(14, 2) not null default 0,
  tanggal_pengajuan date not null default current_date,
  tanggal_disetujui date,
  disetujui_oleh uuid,
  tanggal_pencairan date,
  periode_cicilan_pertama date,
  status text not null default 'Diajukan',
  status_pembatalan text not null default 'Tidak Ada',
  pemohon_pembatalan_id uuid,
  approver_pembatalan_id uuid,
  tanggal_pengajuan_pembatalan timestamptz,
  tanggal_persetujuan_pembatalan timestamptz,
  alasan_pembatalan text,
  catatan_persetujuan text,
  alasan_penolakan text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payroll_pinjaman_karyawan_fk foreign key (id_karyawan)
    references public.karyawan(id_karyawan) on delete restrict,
  constraint payroll_pinjaman_pemohon_fk foreign key (pemohon_id)
    references public.karyawan(id_karyawan) on delete restrict,
  constraint payroll_pinjaman_disetujui_oleh_fk foreign key (disetujui_oleh)
    references public.karyawan(id_karyawan) on delete restrict,
  constraint payroll_pinjaman_pemohon_batal_fk foreign key (pemohon_pembatalan_id)
    references public.karyawan(id_karyawan) on delete restrict,
  constraint payroll_pinjaman_approver_batal_fk foreign key (approver_pembatalan_id)
    references public.karyawan(id_karyawan) on delete restrict
);

create table if not exists public.payroll_pinjaman_pembatalan (
  id_pembatalan uuid primary key default gen_random_uuid(),
  id_pinjaman uuid not null references public.payroll_pinjaman(id_pinjaman) on delete restrict,
  pemohon_id uuid not null references public.karyawan(id_karyawan) on delete restrict,
  approver_id uuid references public.karyawan(id_karyawan) on delete restrict,
  tanggal_pengajuan timestamptz not null default now(),
  tanggal_persetujuan timestamptz,
  status_persetujuan text not null default 'Menunggu Persetujuan',
  alasan_pembatalan text not null,
  catatan_approver text,
  created_at timestamptz not null default now()
);

create table if not exists public.payroll_pinjaman_cicilan (
  id_cicilan uuid primary key default gen_random_uuid(),
  id_pinjaman uuid not null references public.payroll_pinjaman(id_pinjaman) on delete restrict,
  nomor_cicilan integer not null,
  periode_payroll date not null,
  tanggal_pembayaran date,
  nominal_cicilan numeric(14, 2) not null,
  metode_pembayaran text not null default 'Potongan Payroll',
  id_payroll uuid references public.payroll(id_payroll) on delete restrict,
  status text not null default 'Terjadwal',
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_pinjaman_potongan (
  id_cicilan uuid primary key references public.payroll_pinjaman_cicilan(id_cicilan) on delete restrict,
  id_potongan uuid not null unique references public.payroll_potongan(id_potongan) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.payroll_pinjaman_audit (
  id_audit uuid primary key default gen_random_uuid(),
  id_pinjaman uuid not null references public.payroll_pinjaman(id_pinjaman) on delete restrict,
  id_cicilan uuid references public.payroll_pinjaman_cicilan(id_cicilan) on delete restrict,
  actor_id uuid references public.karyawan(id_karyawan) on delete restrict,
  actor_role text,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.payroll_pinjaman
  drop constraint if exists payroll_pinjaman_jenis_check,
  drop constraint if exists payroll_pinjaman_nominal_pengajuan_check,
  drop constraint if exists payroll_pinjaman_nominal_disetujui_check,
  drop constraint if exists payroll_pinjaman_tenor_check,
  drop constraint if exists payroll_pinjaman_angsuran_per_bulan_check,
  drop constraint if exists payroll_pinjaman_total_terbayar_check,
  drop constraint if exists payroll_pinjaman_sisa_saldo_check,
  drop constraint if exists payroll_pinjaman_periode_cicilan_pertama_check,
  drop constraint if exists payroll_pinjaman_status_check,
  drop constraint if exists payroll_pinjaman_status_pembatalan_check,
  drop constraint if exists payroll_pinjaman_total_tidak_melebihi_disetujui,
  drop constraint if exists payroll_pinjaman_saldo_tidak_melebihi_disetujui,
  drop constraint if exists payroll_pinjaman_status_persetujuan,
  drop constraint if exists payroll_pinjaman_status_dicairkan,
  drop constraint if exists payroll_pinjaman_lunas,
  drop constraint if exists payroll_pinjaman_pembatalan_diaudit,
  drop constraint if exists payroll_pinjaman_pembatalan_approved,
  drop constraint if exists payroll_pinjaman_pembatalan_final,
  drop constraint if exists payroll_pinjaman_saldo_konsisten,
  drop constraint if exists payroll_pinjaman_ditolak_dengan_alasan,
  drop constraint if exists payroll_pinjaman_pembatalan_status_konsisten,
  drop constraint if exists payroll_pinjaman_disetujui_saldo_awal,
  drop constraint if exists payroll_pinjaman_dibatalkan_sebelum_cair,
  drop constraint if exists payroll_pinjaman_belum_disetujui;

alter table public.payroll_pinjaman
  add constraint payroll_pinjaman_jenis_check
    check (jenis in ('Kasbon', 'Pinjaman')),
  add constraint payroll_pinjaman_nominal_pengajuan_check
    check (nominal_pengajuan > 0),
  add constraint payroll_pinjaman_nominal_disetujui_check
    check (nominal_disetujui is null or nominal_disetujui > 0),
  add constraint payroll_pinjaman_tenor_check
    check (tenor between 1 and 600),
  add constraint payroll_pinjaman_angsuran_per_bulan_check
    check (angsuran_per_bulan is null or angsuran_per_bulan > 0),
  add constraint payroll_pinjaman_total_terbayar_check
    check (total_terbayar >= 0),
  add constraint payroll_pinjaman_sisa_saldo_check
    check (sisa_saldo >= 0),
  add constraint payroll_pinjaman_periode_cicilan_pertama_check
    check (periode_cicilan_pertama is null or
      periode_cicilan_pertama = date_trunc('month', periode_cicilan_pertama)::date),
  add constraint payroll_pinjaman_status_check
    check (status in ('Diajukan', 'Disetujui', 'Ditolak', 'Dicairkan', 'Berjalan', 'Lunas', 'Dibatalkan')),
  add constraint payroll_pinjaman_status_pembatalan_check
    check (status_pembatalan in ('Tidak Ada', 'Menunggu Persetujuan', 'Disetujui', 'Ditolak')),
  add constraint payroll_pinjaman_total_tidak_melebihi_disetujui
    check (nominal_disetujui is null or total_terbayar <= nominal_disetujui),
  add constraint payroll_pinjaman_saldo_tidak_melebihi_disetujui
    check (nominal_disetujui is null or sisa_saldo <= nominal_disetujui),
  add constraint payroll_pinjaman_status_persetujuan
    check (status not in ('Disetujui', 'Dicairkan', 'Berjalan', 'Lunas') or
      (nominal_disetujui is not null and nominal_disetujui > 0
       and angsuran_per_bulan is not null and angsuran_per_bulan > 0
       and tanggal_disetujui is not null and disetujui_oleh is not null)),
  add constraint payroll_pinjaman_status_dicairkan
    check (status not in ('Dicairkan', 'Berjalan', 'Lunas') or
      (tanggal_pencairan is not null and periode_cicilan_pertama is not null)),
  add constraint payroll_pinjaman_lunas
    check (status <> 'Lunas' or
      (nominal_disetujui is not null and sisa_saldo = 0
       and total_terbayar = nominal_disetujui)),
  add constraint payroll_pinjaman_pembatalan_diaudit
    check (status_pembatalan not in ('Menunggu Persetujuan', 'Disetujui', 'Ditolak') or
      (pemohon_pembatalan_id is not null and tanggal_pengajuan_pembatalan is not null
       and char_length(btrim(coalesce(alasan_pembatalan, ''))) > 0)),
  add constraint payroll_pinjaman_pembatalan_approved
    check (status_pembatalan not in ('Disetujui', 'Ditolak') or
      (approver_pembatalan_id is not null and tanggal_persetujuan_pembatalan is not null
       and approver_pembatalan_id <> pemohon_pembatalan_id)),
  add constraint payroll_pinjaman_pembatalan_final
    check (status_pembatalan <> 'Disetujui' or status = 'Dibatalkan'),
  add constraint payroll_pinjaman_pembatalan_status_konsisten
    check (
      (status_pembatalan = 'Tidak Ada'
       and pemohon_pembatalan_id is null
       and approver_pembatalan_id is null
       and tanggal_pengajuan_pembatalan is null
       and tanggal_persetujuan_pembatalan is null
       and alasan_pembatalan is null
       and catatan_persetujuan is null)
      or
      (status_pembatalan = 'Menunggu Persetujuan'
       and pemohon_pembatalan_id is not null
       and approver_pembatalan_id is null
       and tanggal_pengajuan_pembatalan is not null
       and tanggal_persetujuan_pembatalan is null
       and char_length(btrim(coalesce(alasan_pembatalan, ''))) > 0
       and catatan_persetujuan is null)
      or
      (status_pembatalan in ('Disetujui', 'Ditolak')
       and pemohon_pembatalan_id is not null
       and approver_pembatalan_id is not null
       and approver_pembatalan_id <> pemohon_pembatalan_id
       and tanggal_pengajuan_pembatalan is not null
       and tanggal_persetujuan_pembatalan is not null
       and char_length(btrim(coalesce(alasan_pembatalan, ''))) > 0)
    ),
  add constraint payroll_pinjaman_disetujui_saldo_awal
    check (status <> 'Disetujui' or
      (total_terbayar = 0 and sisa_saldo = nominal_disetujui)),
  add constraint payroll_pinjaman_dibatalkan_sebelum_cair
    check (status <> 'Dibatalkan' or
      (status_pembatalan = 'Disetujui' and tanggal_pencairan is null
       and total_terbayar = 0 and sisa_saldo = 0)),
  add constraint payroll_pinjaman_belum_disetujui
    check (status not in ('Diajukan', 'Ditolak') or
      (nominal_disetujui is null and angsuran_per_bulan is null
       and tanggal_disetujui is null and disetujui_oleh is null
       and tanggal_pencairan is null and periode_cicilan_pertama is null
       and total_terbayar = 0 and sisa_saldo = 0)),
  add constraint payroll_pinjaman_saldo_konsisten
    check (status not in ('Dicairkan', 'Berjalan', 'Lunas') or
      (nominal_disetujui is not null and
       total_terbayar + sisa_saldo = nominal_disetujui)),
  add constraint payroll_pinjaman_ditolak_dengan_alasan
    check (status <> 'Ditolak' or char_length(btrim(coalesce(alasan_penolakan, ''))) > 0);

alter table public.payroll_pinjaman_pembatalan
  drop constraint if exists payroll_pinjaman_pembatalan_status_persetujuan_check,
  drop constraint if exists payroll_pinjaman_pembatalan_alasan_pembatalan_check,
  drop constraint if exists payroll_pinjaman_pembatalan_approver_valid;

alter table public.payroll_pinjaman_pembatalan
  add constraint payroll_pinjaman_pembatalan_status_persetujuan_check
    check (status_persetujuan in ('Menunggu Persetujuan', 'Disetujui', 'Ditolak')),
  add constraint payroll_pinjaman_pembatalan_alasan_pembatalan_check
    check (char_length(btrim(alasan_pembatalan)) > 0),
  add constraint payroll_pinjaman_pembatalan_approver_valid
    check (
      (status_persetujuan = 'Menunggu Persetujuan' and approver_id is null
       and tanggal_persetujuan is null)
      or
      (status_persetujuan in ('Disetujui', 'Ditolak') and approver_id is not null
       and tanggal_persetujuan is not null and approver_id <> pemohon_id
       and (status_persetujuan <> 'Ditolak'
         or char_length(btrim(coalesce(catatan_approver, ''))) > 0))
    );

alter table public.payroll_pinjaman_cicilan
  drop constraint if exists payroll_pinjaman_cicilan_nomor_cicilan_check,
  drop constraint if exists payroll_pinjaman_cicilan_periode_payroll_check,
  drop constraint if exists payroll_pinjaman_cicilan_nominal_cicilan_check,
  drop constraint if exists payroll_pinjaman_cicilan_metode_pembayaran_check,
  drop constraint if exists payroll_pinjaman_cicilan_status_check,
  drop constraint if exists payroll_pinjaman_cicilan_nomor_unik,
  drop constraint if exists payroll_pinjaman_cicilan_periode_unik,
  drop constraint if exists payroll_pinjaman_cicilan_status_relasi;

alter table public.payroll_pinjaman_cicilan
  add constraint payroll_pinjaman_cicilan_nomor_cicilan_check
    check (nomor_cicilan between 1 and 600),
  add constraint payroll_pinjaman_cicilan_periode_payroll_check
    check (periode_payroll = date_trunc('month', periode_payroll)::date),
  add constraint payroll_pinjaman_cicilan_nominal_cicilan_check
    check (nominal_cicilan > 0),
  add constraint payroll_pinjaman_cicilan_metode_pembayaran_check
    check (metode_pembayaran in ('Potongan Payroll', 'Pembayaran Manual')),
  add constraint payroll_pinjaman_cicilan_status_check
    check (status in ('Terjadwal', 'Dibayar', 'Dibatalkan')),
  add constraint payroll_pinjaman_cicilan_nomor_unik
    unique (id_pinjaman, nomor_cicilan),
  add constraint payroll_pinjaman_cicilan_periode_unik
    unique (id_pinjaman, periode_payroll),
  add constraint payroll_pinjaman_cicilan_status_relasi
    check (
      (status = 'Dibayar' and id_payroll is not null and tanggal_pembayaran is not null)
      or (status <> 'Dibayar' and id_payroll is null and tanggal_pembayaran is null)
    );

alter table public.payroll_pinjaman_audit
  drop constraint if exists payroll_pinjaman_audit_actor_role_check;
alter table public.payroll_pinjaman_audit
  add constraint payroll_pinjaman_audit_actor_role_check
  check (actor_role is null or actor_role in ('Employee', 'HR/Admin', 'Approver'));

create index if not exists payroll_pinjaman_karyawan_idx
  on public.payroll_pinjaman(id_karyawan, status);
create index if not exists payroll_pinjaman_status_idx
  on public.payroll_pinjaman(status, created_at desc);
create index if not exists payroll_pinjaman_cicilan_periode_idx
  on public.payroll_pinjaman_cicilan(periode_payroll, status);
create index if not exists payroll_pinjaman_cicilan_payroll_idx
  on public.payroll_pinjaman_cicilan(id_payroll);
create index if not exists payroll_pinjaman_audit_loan_idx
  on public.payroll_pinjaman_audit(id_pinjaman, created_at desc);
create index if not exists payroll_pinjaman_pembatalan_loan_idx
  on public.payroll_pinjaman_pembatalan(id_pinjaman, tanggal_pengajuan desc);
create unique index if not exists payroll_pinjaman_satu_pembatalan_menunggu
  on public.payroll_pinjaman_pembatalan(id_pinjaman)
  where status_persetujuan = 'Menunggu Persetujuan';

drop trigger if exists payroll_pinjaman_set_updated_at on public.payroll_pinjaman;
create trigger payroll_pinjaman_set_updated_at
before update on public.payroll_pinjaman
for each row execute function public.set_updated_at();

drop trigger if exists payroll_pinjaman_cicilan_set_updated_at on public.payroll_pinjaman_cicilan;
create trigger payroll_pinjaman_cicilan_set_updated_at
before update on public.payroll_pinjaman_cicilan
for each row execute function public.set_updated_at();

alter table public.payroll_pinjaman_roles enable row level security;
alter table public.payroll_pinjaman enable row level security;
alter table public.payroll_pinjaman_pembatalan enable row level security;
alter table public.payroll_pinjaman_cicilan enable row level security;
alter table public.payroll_pinjaman_potongan enable row level security;
alter table public.payroll_pinjaman_audit enable row level security;

drop policy if exists "Baca peran pinjaman untuk anon" on public.payroll_pinjaman_roles;
create policy "Baca peran pinjaman untuk anon"
  on public.payroll_pinjaman_roles for select to anon using (true);
drop policy if exists "Baca pinjaman untuk anon" on public.payroll_pinjaman;
create policy "Baca pinjaman untuk anon"
  on public.payroll_pinjaman for select to anon using (true);
drop policy if exists "Baca pengajuan pembatalan untuk anon" on public.payroll_pinjaman_pembatalan;
create policy "Baca pengajuan pembatalan untuk anon"
  on public.payroll_pinjaman_pembatalan for select to anon using (true);
drop policy if exists "Baca cicilan pinjaman untuk anon" on public.payroll_pinjaman_cicilan;
create policy "Baca cicilan pinjaman untuk anon"
  on public.payroll_pinjaman_cicilan for select to anon using (true);
drop policy if exists "Baca tautan potongan pinjaman untuk anon" on public.payroll_pinjaman_potongan;
create policy "Baca tautan potongan pinjaman untuk anon"
  on public.payroll_pinjaman_potongan for select to anon using (true);
drop policy if exists "Baca audit pinjaman untuk anon" on public.payroll_pinjaman_audit;
create policy "Baca audit pinjaman untuk anon"
  on public.payroll_pinjaman_audit for select to anon using (true);

grant usage on schema public to anon;
grant select on public.payroll_pinjaman_roles, public.payroll_pinjaman,
  public.payroll_pinjaman_pembatalan, public.payroll_pinjaman_cicilan,
  public.payroll_pinjaman_potongan, public.payroll_pinjaman_audit to anon;

create or replace function public.has_payroll_pinjaman_role(
  p_actor uuid,
  p_allowed_roles text[]
)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_actor is not null and exists (
    select 1
    from public.payroll_pinjaman_roles r
    where r.id_karyawan = p_actor
      and r.is_active
      and r.role = any(p_allowed_roles)
  )
$$;

create or replace function public.assign_default_payroll_employee_role()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.payroll_pinjaman_roles (id_karyawan, role)
  values (new.id_karyawan, 'Employee')
  on conflict (id_karyawan, role) do nothing;
  return new;
end;
$$;

drop trigger if exists payroll_pinjaman_assign_employee_role on public.karyawan;
create trigger payroll_pinjaman_assign_employee_role
after insert on public.karyawan
for each row execute function public.assign_default_payroll_employee_role();

create or replace function public.audit_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_actor_role text,
  p_event_type text,
  p_details jsonb default '{}'::jsonb,
  p_id_cicilan uuid default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.payroll_pinjaman_audit
    (id_pinjaman, id_cicilan, actor_id, actor_role, event_type, details)
  values
    (p_id_pinjaman, p_id_cicilan, p_actor, p_actor_role, p_event_type,
     coalesce(p_details, '{}'::jsonb));
end;
$$;

create or replace function public.create_payroll_pinjaman(
  p_actor uuid,
  p_id_karyawan uuid,
  p_jenis text,
  p_nominal_pengajuan numeric,
  p_tenor integer,
  p_keterangan text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_id uuid;
  actor_role text;
begin
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['Employee', 'HR/Admin']
  ) then
    raise exception 'Pemohon tidak memiliki role yang berwenang';
  end if;
  if p_id_karyawan is null or not exists (
    select 1 from public.karyawan k where k.id_karyawan = p_id_karyawan
  ) then
    raise exception 'Karyawan pengajuan tidak ditemukan';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Employee')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;
  if actor_role = 'Employee' and p_actor <> p_id_karyawan then
    raise exception 'Employee hanya dapat mengajukan untuk dirinya sendiri';
  end if;
  if p_jenis is null or p_jenis not in ('Kasbon', 'Pinjaman')
    or p_nominal_pengajuan is null or p_nominal_pengajuan <= 0
    or p_nominal_pengajuan > 999999999999.99
    or p_tenor is null or p_tenor not between 1 and 600 then
    raise exception 'Jenis, nominal, atau tenor pengajuan tidak valid';
  end if;

  insert into public.payroll_pinjaman
    (id_karyawan, pemohon_id, jenis, nominal_pengajuan, tenor, keterangan)
  values
    (p_id_karyawan, p_actor, p_jenis, p_nominal_pengajuan, p_tenor,
     nullif(btrim(p_keterangan), ''))
  returning id_pinjaman into loan_id;

  perform public.audit_payroll_pinjaman(
    loan_id, p_actor, actor_role, 'Diajukan',
    jsonb_build_object('jenis', p_jenis, 'nominal_pengajuan', p_nominal_pengajuan,
      'tenor', p_tenor)
  );
  return loan_id;
end;
$$;

create or replace function public.update_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_jenis text,
  p_nominal_pengajuan numeric,
  p_tenor integer,
  p_keterangan text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_row public.payroll_pinjaman%rowtype;
  actor_role text;
  loan_employee_id uuid;
begin
  select l.id_karyawan into loan_employee_id
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman;
  if not found then raise exception 'Pinjaman tidak ditemukan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(loan_employee_id::text, 0));
  select * into loan_row
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman
  for update;
  if loan_row.status <> 'Diajukan'
    or loan_row.status_pembatalan = 'Menunggu Persetujuan' then
    raise exception 'Hanya pengajuan Diajukan tanpa pembatalan menunggu yang dapat diubah';
  end if;
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['Employee', 'HR/Admin']
  ) then
    raise exception 'Aktor tidak memiliki role yang berwenang';
  end if;
  if p_actor <> loan_row.pemohon_id
    and not public.has_payroll_pinjaman_role(p_actor, array['HR/Admin']) then
    raise exception 'Aktor tidak berwenang mengubah pengajuan ini';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Employee')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;
  if p_jenis is null or p_jenis not in ('Kasbon', 'Pinjaman')
    or p_nominal_pengajuan is null or p_nominal_pengajuan <= 0
    or p_nominal_pengajuan > 999999999999.99
    or p_tenor is null or p_tenor not between 1 and 600 then
    raise exception 'Jenis, nominal, atau tenor pengajuan tidak valid';
  end if;

  update public.payroll_pinjaman
  set jenis = p_jenis, nominal_pengajuan = p_nominal_pengajuan,
      tenor = p_tenor, keterangan = nullif(btrim(p_keterangan), '')
  where id_pinjaman = p_id_pinjaman;
  perform public.audit_payroll_pinjaman(
    p_id_pinjaman, p_actor, actor_role, 'Pengajuan diperbarui',
    jsonb_build_object('jenis', p_jenis, 'nominal_pengajuan', p_nominal_pengajuan,
      'tenor', p_tenor)
  );
  return p_id_pinjaman;
end;
$$;

create or replace function public.decide_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_disetujui boolean,
  p_nominal_disetujui numeric default null,
  p_tenor integer default null,
  p_catatan text default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_row public.payroll_pinjaman%rowtype;
  actor_role text;
  monthly_amount numeric(14, 2);
begin
  select * into loan_row
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman
  for update;
  if not found or loan_row.status <> 'Diajukan' then
    raise exception 'Pengajuan bukan dalam status Diajukan';
  end if;
  if loan_row.status_pembatalan = 'Menunggu Persetujuan' then
    raise exception 'Selesaikan permintaan pembatalan terlebih dahulu';
  end if;
  if p_disetujui is null then raise exception 'Keputusan persetujuan wajib dipilih'; end if;
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['HR/Admin', 'Approver']
  ) then
    raise exception 'Approver tidak memiliki role yang berwenang';
  end if;
  if p_actor = loan_row.pemohon_id then
    raise exception 'Pemohon tidak boleh menyetujui pengajuannya sendiri';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Approver')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;

  if p_disetujui then
    if p_nominal_disetujui is null or p_nominal_disetujui <= 0
      or p_nominal_disetujui > loan_row.nominal_pengajuan
      or p_tenor is null or p_tenor not between 1 and 600
      or p_tenor > floor(p_nominal_disetujui * 100) then
      raise exception 'Nominal disetujui atau tenor tidak valid';
    end if;
    monthly_amount := round(p_nominal_disetujui / p_tenor, 2);
    update public.payroll_pinjaman
    set nominal_disetujui = p_nominal_disetujui,
        tenor = p_tenor,
        angsuran_per_bulan = monthly_amount,
        total_terbayar = 0,
        sisa_saldo = p_nominal_disetujui,
        tanggal_disetujui = current_date,
        disetujui_oleh = p_actor,
        status = 'Disetujui',
        alasan_penolakan = null
    where id_pinjaman = p_id_pinjaman;
    perform public.audit_payroll_pinjaman(
      p_id_pinjaman, p_actor, actor_role, 'Disetujui',
      jsonb_build_object('nominal_disetujui', p_nominal_disetujui,
        'tenor', p_tenor, 'angsuran_per_bulan', monthly_amount,
        'catatan', p_catatan)
    );
  else
    if char_length(btrim(coalesce(p_catatan, ''))) = 0 then
      raise exception 'Alasan penolakan wajib diisi';
    end if;
    update public.payroll_pinjaman
    set status = 'Ditolak', alasan_penolakan = btrim(p_catatan)
    where id_pinjaman = p_id_pinjaman;
    perform public.audit_payroll_pinjaman(
      p_id_pinjaman, p_actor, actor_role, 'Ditolak',
      jsonb_build_object('alasan', btrim(p_catatan))
    );
  end if;
  return p_id_pinjaman;
end;
$$;

create or replace function public.disburse_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_periode_pertama date default null
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_row public.payroll_pinjaman%rowtype;
  payroll_row public.payroll%rowtype;
  candidate_payroll public.payroll%rowtype;
  actor_role text;
  loan_employee_id uuid;
  first_period date;
  candidate_period date;
  installment_amount numeric(14, 2);
  scheduled_amount numeric(14, 2);
  remaining_amount numeric(14, 2);
  installment_index integer;
  payroll_found boolean;
begin
  select l.id_karyawan into loan_employee_id
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman;
  if not found then raise exception 'Pinjaman tidak ditemukan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(loan_employee_id::text, 0));
  select * into loan_row
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman
  for update;
  if loan_row.status <> 'Disetujui'
    or loan_row.status_pembatalan = 'Menunggu Persetujuan' then
    raise exception 'Hanya pinjaman Disetujui tanpa pembatalan menunggu yang dapat dicairkan';
  end if;
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['HR/Admin', 'Approver']
  ) or p_actor = loan_row.pemohon_id then
    raise exception 'Aktor tidak berwenang mencairkan pinjaman ini';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Approver')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;

  if p_periode_pertama is null then
    candidate_period := date_trunc('month', current_date)::date;
    for installment_index in 1..120 loop
      candidate_payroll := null;
      select p.* into candidate_payroll
      from public.payroll p
      where p.id_karyawan = loan_row.id_karyawan
        and p.periode = candidate_period
      for update;
      if found and candidate_payroll.status_pembayaran = 'Draft'
        and not exists (
          select 1 from public.journal_entries e
          where e.source_payroll_id = candidate_payroll.id_payroll
        ) then
        first_period := candidate_period;
        exit;
      end if;
      candidate_period := (candidate_period + interval '1 month')::date;
    end loop;
    if first_period is null then
      raise exception 'Tidak ditemukan record payroll Draft tanpa jurnal pada 120 periode mendatang';
    end if;
  else
    first_period := p_periode_pertama;
    if first_period <> date_trunc('month', first_period)::date then
      raise exception 'Periode cicilan pertama harus tanggal pertama bulan';
    end if;
    if first_period < date_trunc('month', current_date)::date then
      raise exception 'Periode cicilan pertama tidak boleh mendahului bulan pencairan';
    end if;
    select p.* into payroll_row
    from public.payroll p
    where p.id_karyawan = loan_row.id_karyawan
      and p.periode = first_period
    for update;
    payroll_found := found;
    if not payroll_found then
      raise exception 'Periode harus memiliki record payroll untuk karyawan ini';
    end if;
    if payroll_row.status_pembayaran <> 'Draft'
      or exists (
        select 1 from public.journal_entries e
        where e.source_payroll_id = payroll_row.id_payroll
      ) then
      raise exception 'Payroll periode pertama sudah diproses atau memiliki jurnal; pilih periode terbuka berikutnya';
    end if;
  end if;

  installment_amount := round(loan_row.nominal_disetujui / loan_row.tenor, 2);
  remaining_amount := loan_row.nominal_disetujui;
  for installment_index in 1..loan_row.tenor loop
    scheduled_amount := case
      when installment_index = loan_row.tenor then remaining_amount
      else least(installment_amount, remaining_amount)
    end;
    insert into public.payroll_pinjaman_cicilan
      (id_pinjaman, nomor_cicilan, periode_payroll, nominal_cicilan)
    values (
      p_id_pinjaman,
      installment_index,
      (first_period + make_interval(months => installment_index - 1))::date,
      scheduled_amount
    );
    remaining_amount := remaining_amount - scheduled_amount;
  end loop;

  update public.payroll_pinjaman
  set status = 'Berjalan',
      tanggal_pencairan = current_date,
      periode_cicilan_pertama = first_period,
      total_terbayar = 0,
      sisa_saldo = nominal_disetujui
  where id_pinjaman = p_id_pinjaman;
  perform public.audit_payroll_pinjaman(
    p_id_pinjaman, p_actor, actor_role, 'Dicairkan dan jadwal dibuat',
    jsonb_build_object('tanggal_pencairan', current_date,
      'periode_pertama', first_period, 'tenor', loan_row.tenor,
      'nominal_disetujui', loan_row.nominal_disetujui)
  );
  return p_id_pinjaman;
end;
$$;

create or replace function public.request_cancel_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_alasan text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_row public.payroll_pinjaman%rowtype;
  actor_role text;
  loan_employee_id uuid;
begin
  select l.id_karyawan into loan_employee_id
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman;
  if not found then raise exception 'Pinjaman tidak ditemukan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(loan_employee_id::text, 0));
  select * into loan_row
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman
  for update;
  if loan_row.status not in ('Diajukan', 'Disetujui')
    or loan_row.tanggal_pencairan is not null
    or exists (
      select 1 from public.payroll_pinjaman_cicilan c
      where c.id_pinjaman = p_id_pinjaman
    ) then
    raise exception 'Pembatalan hanya diizinkan sebelum pencairan; saldo/cicilan/payroll yang sudah berjalan harus dikoreksi melalui proses terpisah';
  end if;
  if loan_row.status_pembatalan = 'Menunggu Persetujuan' then
    raise exception 'Pengajuan pembatalan masih menunggu persetujuan';
  end if;
  if p_alasan is null or char_length(btrim(p_alasan)) = 0 then
    raise exception 'Alasan pembatalan wajib diisi';
  end if;
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['Employee', 'HR/Admin']
  ) then
    raise exception 'Aktor tidak berwenang mengajukan pembatalan';
  end if;
  if p_actor <> loan_row.id_karyawan
    and not public.has_payroll_pinjaman_role(p_actor, array['HR/Admin']) then
    raise exception 'Employee hanya dapat mengajukan pembatalan untuk pinjamannya sendiri';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Employee')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;

  update public.payroll_pinjaman
  set status_pembatalan = 'Menunggu Persetujuan',
      pemohon_pembatalan_id = p_actor,
      approver_pembatalan_id = null,
      tanggal_pengajuan_pembatalan = now(),
      tanggal_persetujuan_pembatalan = null,
      alasan_pembatalan = btrim(p_alasan),
      catatan_persetujuan = null
  where id_pinjaman = p_id_pinjaman;
  insert into public.payroll_pinjaman_pembatalan
    (id_pinjaman, pemohon_id, alasan_pembatalan)
  values (p_id_pinjaman, p_actor, btrim(p_alasan));
  perform public.audit_payroll_pinjaman(
    p_id_pinjaman, p_actor, actor_role, 'Pembatalan diajukan',
    jsonb_build_object('alasan', btrim(p_alasan),
      'saldo_sebelum_pembatalan', loan_row.sisa_saldo)
  );
  return p_id_pinjaman;
end;
$$;

create or replace function public.decide_cancel_payroll_pinjaman(
  p_id_pinjaman uuid,
  p_actor uuid,
  p_setujui boolean,
  p_catatan text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  loan_row public.payroll_pinjaman%rowtype;
  cancellation_id uuid;
  actor_role text;
  loan_employee_id uuid;
begin
  select l.id_karyawan into loan_employee_id
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman;
  if not found then raise exception 'Pinjaman tidak ditemukan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(loan_employee_id::text, 0));
  select * into loan_row
  from public.payroll_pinjaman l
  where l.id_pinjaman = p_id_pinjaman
  for update;
  if loan_row.status_pembatalan <> 'Menunggu Persetujuan' then
    raise exception 'Tidak ada pengajuan pembatalan yang menunggu persetujuan';
  end if;
  if p_setujui is null then raise exception 'Keputusan pembatalan wajib dipilih'; end if;
  if loan_row.status not in ('Diajukan', 'Disetujui')
    or loan_row.tanggal_pencairan is not null
    or exists (
      select 1 from public.payroll_pinjaman_cicilan c
      where c.id_pinjaman = p_id_pinjaman
    ) then
    raise exception 'Pinjaman yang sudah dicairkan tidak dapat dibatalkan; saldo/cicilan/payroll harus tetap utuh';
  end if;
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['HR/Admin', 'Approver']
  ) then
    raise exception 'Approver tidak memiliki role yang berwenang';
  end if;
  if p_actor = loan_row.pemohon_pembatalan_id then
    raise exception 'Pemohon tidak boleh menyetujui atau menolak permintaannya sendiri';
  end if;
  if not p_setujui and char_length(btrim(coalesce(p_catatan, ''))) = 0 then
    raise exception 'Catatan alasan penolakan wajib diisi';
  end if;
  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active
    and r.role in ('HR/Admin', 'Approver')
  order by case r.role when 'HR/Admin' then 1 else 2 end
  limit 1;

  update public.payroll_pinjaman_pembatalan
  set status_persetujuan = case when p_setujui then 'Disetujui' else 'Ditolak' end,
      approver_id = p_actor,
      tanggal_persetujuan = now(),
      catatan_approver = nullif(btrim(p_catatan), '')
  where id_pinjaman = p_id_pinjaman
    and status_persetujuan = 'Menunggu Persetujuan'
  returning id_pembatalan into cancellation_id;
  if not found then raise exception 'Permintaan pembatalan aktif tidak ditemukan'; end if;

  update public.payroll_pinjaman
  set status_pembatalan = case when p_setujui then 'Disetujui' else 'Ditolak' end,
      approver_pembatalan_id = p_actor,
      tanggal_persetujuan_pembatalan = now(),
      catatan_persetujuan = nullif(btrim(p_catatan), ''),
      status = case when p_setujui then 'Dibatalkan' else status end,
      sisa_saldo = case when p_setujui then 0 else sisa_saldo end
  where id_pinjaman = p_id_pinjaman;

  perform public.audit_payroll_pinjaman(
    p_id_pinjaman, p_actor, actor_role,
    case when p_setujui then 'Pembatalan disetujui' else 'Pembatalan ditolak' end,
    jsonb_build_object('id_pembatalan', cancellation_id,
      'pemohon', loan_row.pemohon_pembatalan_id,
      'alasan', loan_row.alasan_pembatalan,
      'catatan_approver', p_catatan,
      'saldo_sebelum_keputusan', loan_row.sisa_saldo)
  );
  return p_id_pinjaman;
end;
$$;

create or replace function public.process_payroll_pinjaman(
  p_id_payroll uuid,
  p_actor uuid
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  payroll_row public.payroll%rowtype;
  installment_row record;
  deduction_id uuid;
  deduction_type text;
  deduction_amount numeric(14, 2);
  remaining_balance numeric(14, 2);
  paid_total numeric(14, 2);
  processed_count integer := 0;
  payroll_employee_id uuid;
  actor_role text;
begin
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['HR/Admin']
  ) then
    raise exception 'Pemrosesan cicilan hanya dapat dijalankan oleh role HR/Admin';
  end if;
  select p.id_karyawan into payroll_employee_id
  from public.payroll p
  where p.id_payroll = p_id_payroll;
  if not found then raise exception 'Payroll tidak ditemukan'; end if;
  perform pg_advisory_xact_lock(hashtextextended(payroll_employee_id::text, 0));
  select * into payroll_row
  from public.payroll p
  where p.id_payroll = p_id_payroll
  for update;
  if payroll_row.status_pembayaran <> 'Draft' then
    raise exception 'Cicilan hanya dapat ditambahkan ke payroll Draft melalui workflow payroll yang sudah ada';
  end if;
  if exists (
    select 1 from public.journal_entries e
    where e.source_payroll_id = p_id_payroll
  ) then
    raise exception 'Payroll memiliki jurnal; rincian potongan tidak dapat diubah';
  end if;
  if exists (
    select 1
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
      and l.status_pembatalan = 'Menunggu Persetujuan'
  ) then
    raise exception 'Pembatalan pinjaman menunggu persetujuan; payroll belum dapat memproses cicilan';
  end if;
  if exists (
    select 1
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
      and l.status <> 'Berjalan'
  ) then
    raise exception 'Ditemukan cicilan Terjadwal yang tidak memiliki pinjaman Berjalan';
  end if;
  if exists (
    select 1
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    join public.payroll_potongan d
      on d.id_payroll = p_id_payroll
     and d.jenis_potongan = case l.jenis
       when 'Kasbon' then 'Kasbon'
       else 'Pinjaman Karyawan'
     end
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
  ) then
    raise exception 'Potongan Kasbon/Pinjaman sudah ada di payroll; cegah double deduction dan rekonsiliasi dahulu';
  end if;
  if exists (
    select 1
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
  ) and payroll_row.potongan > 0 and not exists (
    select 1 from public.payroll_potongan d
    where d.id_payroll = p_id_payroll
  ) then
    raise exception 'Payroll memiliki potongan agregat tanpa rincian Fase 3; rekonsiliasi dahulu';
  end if;

  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active and r.role = 'HR/Admin'
  limit 1;

  for installment_row in
    select c.id_cicilan, c.id_pinjaman, c.nominal_cicilan,
      l.jenis, l.sisa_saldo, l.total_terbayar
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
      and l.status = 'Berjalan'
    order by c.id_pinjaman
    for update of c, l
  loop
    if installment_row.sisa_saldo <= 0 then
      raise exception 'Cicilan Terjadwal memiliki saldo pinjaman nol';
    end if;
    deduction_amount := least(installment_row.nominal_cicilan, installment_row.sisa_saldo);
    deduction_type := case installment_row.jenis
      when 'Kasbon' then 'Kasbon'
      else 'Pinjaman Karyawan'
    end;

    deduction_id := public.save_payroll_potongan(
      p_id_payroll,
      deduction_type,
      deduction_amount,
      'Cicilan pinjaman #' || installment_row.id_cicilan::text,
      null
    );
    insert into public.payroll_pinjaman_potongan (id_cicilan, id_potongan)
    values (installment_row.id_cicilan, deduction_id);

    update public.payroll_pinjaman_cicilan
    set status = 'Dibayar',
        id_payroll = p_id_payroll,
        tanggal_pembayaran = current_date
    where id_cicilan = installment_row.id_cicilan
      and status = 'Terjadwal'
      and id_payroll is null;
    if not found then
      raise exception 'Cicilan sudah diproses atau terhubung ke payroll lain';
    end if;

    remaining_balance := installment_row.sisa_saldo - deduction_amount;
    paid_total := installment_row.total_terbayar + deduction_amount;
    update public.payroll_pinjaman
    set sisa_saldo = remaining_balance,
        total_terbayar = paid_total,
        status = case when remaining_balance = 0 then 'Lunas' else 'Berjalan' end
    where id_pinjaman = installment_row.id_pinjaman;
    perform public.audit_payroll_pinjaman(
      installment_row.id_pinjaman, p_actor, actor_role,
      'Cicilan masuk ke payroll',
      jsonb_build_object('id_payroll', p_id_payroll,
        'nominal', deduction_amount, 'sisa_saldo', remaining_balance,
        'total_terbayar', paid_total),
      installment_row.id_cicilan
    );
    processed_count := processed_count + 1;
  end loop;

  return processed_count;
end;
$$;

drop trigger if exists payroll_loan_workflow_guard on public.payroll;
drop function if exists public.guard_payroll_loan_workflow();
drop function if exists public.process_payroll_pinjaman(uuid);

revoke all on function public.has_payroll_pinjaman_role(uuid, text[]) from public;
revoke all on function public.assign_default_payroll_employee_role() from public;
revoke all on function public.audit_payroll_pinjaman(uuid, uuid, text, text, jsonb, uuid) from public;
revoke all on function public.create_payroll_pinjaman(uuid, uuid, text, numeric, integer, text) from public;
revoke all on function public.update_payroll_pinjaman(uuid, uuid, text, numeric, integer, text) from public;
revoke all on function public.decide_payroll_pinjaman(uuid, uuid, boolean, numeric, integer, text) from public;
revoke all on function public.disburse_payroll_pinjaman(uuid, uuid, date) from public;
revoke all on function public.request_cancel_payroll_pinjaman(uuid, uuid, text) from public;
revoke all on function public.decide_cancel_payroll_pinjaman(uuid, uuid, boolean, text) from public;
revoke all on function public.process_payroll_pinjaman(uuid, uuid) from public;

grant execute on function public.create_payroll_pinjaman(uuid, uuid, text, numeric, integer, text) to anon;
grant execute on function public.update_payroll_pinjaman(uuid, uuid, text, numeric, integer, text) to anon;
grant execute on function public.decide_payroll_pinjaman(uuid, uuid, boolean, numeric, integer, text) to anon;
grant execute on function public.disburse_payroll_pinjaman(uuid, uuid, date) to anon;
grant execute on function public.request_cancel_payroll_pinjaman(uuid, uuid, text) to anon;
grant execute on function public.decide_cancel_payroll_pinjaman(uuid, uuid, boolean, text) to anon;
grant execute on function public.process_payroll_pinjaman(uuid, uuid) to anon;

commit;
