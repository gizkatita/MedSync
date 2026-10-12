create table if not exists public.payroll_potongan (
  id_potongan uuid primary key default gen_random_uuid(),
  id_payroll uuid not null references public.payroll(id_payroll) on delete cascade,
  jenis_potongan text not null check (jenis_potongan in (
    'PPh 21',
    'BPJS Kesehatan',
    'BPJS Ketenagakerjaan',
    'Kasbon',
    'Pinjaman Karyawan',
    'Potongan Lainnya'
  )),
  nominal numeric(14, 2) not null check (nominal > 0),
  keterangan text,
  created_at timestamptz not null default now()
);

create index if not exists payroll_potongan_payroll_idx
  on public.payroll_potongan(id_payroll);

alter table public.payroll_potongan enable row level security;

drop policy if exists "Baca rincian potongan payroll untuk anon" on public.payroll_potongan;
create policy "Baca rincian potongan payroll untuk anon" on public.payroll_potongan
for select to anon using (true);

grant select on public.payroll_potongan to anon;

create or replace function public.guard_payroll_deduction_total()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  detail_total numeric(14, 2);
begin
  if exists (
    select 1 from public.journal_entries e
    where e.source_payroll_id = old.id_payroll and e.status = 'Posted'
  ) and (
    new.id_karyawan is distinct from old.id_karyawan
    or new.periode is distinct from old.periode
    or new.gaji_pokok is distinct from old.gaji_pokok
    or new.total_lembur is distinct from old.total_lembur
    or new.tunjangan is distinct from old.tunjangan
    or new.insentif is distinct from old.insentif
    or new.potongan is distinct from old.potongan
    or new.gaji_kotor is distinct from old.gaji_kotor
    or new.gaji_bersih is distinct from old.gaji_bersih
  ) then
    raise exception 'Payroll sudah diposting ke akuntansi; perubahan nilai payroll dan potongan dikunci.';
  end if;

  if exists (select 1 from public.payroll_potongan d where d.id_payroll = new.id_payroll) then
    select coalesce(sum(d.nominal), 0) into detail_total
    from public.payroll_potongan d where d.id_payroll = new.id_payroll;
    if new.potongan <> detail_total then
      raise exception 'Total potongan payroll harus sama dengan jumlah rincian (expected %, received %)',
        detail_total, new.potongan;
    end if;
  end if;
  if new.potongan > new.gaji_kotor and (
    new.potongan is distinct from old.potongan
    or new.gaji_kotor is distinct from old.gaji_kotor
    or new.tunjangan is distinct from old.tunjangan
    or new.insentif is distinct from old.insentif
    or new.id_karyawan is distinct from old.id_karyawan
    or new.periode is distinct from old.periode
  ) then
    raise exception 'Total potongan % melebihi gaji kotor %', new.potongan, new.gaji_kotor;
  end if;
  return new;
end;
$$;

drop trigger if exists payroll_deduction_total_guard on public.payroll;
drop trigger if exists payroll_z_deduction_total_guard on public.payroll;
create trigger payroll_deduction_total_guard
before update on public.payroll
for each row execute function public.guard_payroll_deduction_total();

create or replace function public.save_payroll_potongan(
  p_id_payroll uuid,
  p_jenis_potongan text,
  p_nominal numeric,
  p_keterangan text,
  p_id_potongan uuid default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  payroll_row public.payroll%rowtype;
  deduction_id uuid;
  updated_total numeric(14, 2);
  linked_loan_deduction boolean := false;
begin
  if p_jenis_potongan is null or p_jenis_potongan not in (
    'PPh 21',
    'BPJS Kesehatan',
    'BPJS Ketenagakerjaan',
    'Kasbon',
    'Pinjaman Karyawan',
    'Potongan Lainnya'
  ) then
    raise exception 'Jenis potongan tidak valid';
  end if;
  if p_nominal is null or p_nominal <= 0 or p_nominal > 999999999999.99 then
    raise exception 'Nominal potongan harus lebih dari nol dan tidak melebihi 999999999999.99';
  end if;

  select * into payroll_row from public.payroll
  where id_payroll = p_id_payroll for update;
  if not found then raise exception 'Payroll tidak ditemukan'; end if;
  if payroll_row.status_pembayaran <> 'Draft' then
    raise exception 'Rincian potongan hanya dapat diubah pada payroll Draft';
  end if;

  if exists (
    select 1 from public.journal_entries e
    where e.source_payroll_id = p_id_payroll
  ) then
    raise exception 'Rincian potongan tidak dapat diubah karena payroll sudah memiliki jurnal. Jurnal existing tidak diubah.';
  end if;

  if p_id_potongan is null then
    insert into public.payroll_potongan
      (id_payroll, jenis_potongan, nominal, keterangan)
    values
      (p_id_payroll, p_jenis_potongan, p_nominal, nullif(btrim(p_keterangan), ''))
    returning id_potongan into deduction_id;
  else
    if pg_catalog.to_regclass('public.payroll_pinjaman_potongan') is not null then
      execute 'select exists (select 1 from public.payroll_pinjaman_potongan where id_potongan = $1)'
        into linked_loan_deduction using p_id_potongan;
      if linked_loan_deduction then
        raise exception 'Potongan cicilan pinjaman dikelola oleh workflow pinjaman dan tidak dapat diubah melalui RPC potongan umum';
      end if;
    end if;
    update public.payroll_potongan
    set jenis_potongan = p_jenis_potongan,
        nominal = p_nominal,
        keterangan = nullif(btrim(p_keterangan), '')
    where id_potongan = p_id_potongan
      and id_payroll = p_id_payroll
    returning id_potongan into deduction_id;
    if not found then raise exception 'Rincian potongan tidak ditemukan pada payroll tersebut'; end if;
  end if;

  select coalesce(sum(d.nominal), 0) into updated_total
  from public.payroll_potongan d where d.id_payroll = p_id_payroll;
  if updated_total > payroll_row.gaji_kotor then
    raise exception 'Total potongan % melebihi gaji kotor %', updated_total, payroll_row.gaji_kotor;
  end if;

  update public.payroll set potongan = updated_total
  where id_payroll = p_id_payroll;
  return deduction_id;
end;
$$;

create or replace function public.delete_payroll_potongan(p_id_potongan uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  deduction_row public.payroll_potongan%rowtype;
  payroll_row public.payroll%rowtype;
  updated_total numeric(14, 2);
  linked_loan_deduction boolean := false;
begin
  select * into deduction_row from public.payroll_potongan
  where id_potongan = p_id_potongan;
  if not found then raise exception 'Rincian potongan tidak ditemukan'; end if;

  select * into payroll_row from public.payroll
  where id_payroll = deduction_row.id_payroll for update;
  if not found then raise exception 'Payroll tidak ditemukan'; end if;
  if payroll_row.status_pembayaran <> 'Draft' then
    raise exception 'Rincian potongan hanya dapat diubah pada payroll Draft';
  end if;

  if exists (
    select 1 from public.journal_entries e
    where e.source_payroll_id = deduction_row.id_payroll
  ) then
    raise exception 'Rincian potongan tidak dapat dihapus karena payroll sudah memiliki jurnal. Jurnal existing tidak diubah.';
  end if;

  if pg_catalog.to_regclass('public.payroll_pinjaman_potongan') is not null then
    execute 'select exists (select 1 from public.payroll_pinjaman_potongan where id_potongan = $1)'
      into linked_loan_deduction using p_id_potongan;
    if linked_loan_deduction then
      raise exception 'Potongan cicilan pinjaman tidak dapat dihapus melalui RPC potongan umum';
    end if;
  end if;

  delete from public.payroll_potongan where id_potongan = p_id_potongan;

  select coalesce(sum(d.nominal), 0) into updated_total
  from public.payroll_potongan d where d.id_payroll = deduction_row.id_payroll;

  update public.payroll set potongan = updated_total
  where id_payroll = deduction_row.id_payroll;
  return deduction_row.id_payroll;
end;
$$;

revoke all on function public.save_payroll_potongan(uuid, text, numeric, text, uuid) from public;
revoke all on function public.delete_payroll_potongan(uuid) from public;
grant execute on function public.save_payroll_potongan(uuid, text, numeric, text, uuid) to anon;
grant execute on function public.delete_payroll_potongan(uuid) to anon;
