begin;

alter table public.payroll_pinjaman_cicilan
  drop constraint if exists payroll_pinjaman_cicilan_status_check,
  drop constraint if exists payroll_pinjaman_cicilan_status_relasi;

alter table public.payroll_pinjaman_cicilan
  add constraint payroll_pinjaman_cicilan_status_check
    check (status in ('Terjadwal', 'Diproses', 'Dibayar', 'Dibatalkan')),
  add constraint payroll_pinjaman_cicilan_status_relasi
    check (
      (status = 'Terjadwal' and id_payroll is null and tanggal_pembayaran is null)
      or (status = 'Diproses' and id_payroll is not null and tanggal_pembayaran is null)
      or (status = 'Dibayar' and id_payroll is not null and tanggal_pembayaran is not null)
      or (status = 'Dibatalkan' and id_payroll is null and tanggal_pembayaran is null)
    );

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
  scheduled_total numeric(14, 2);
  detail_total numeric(14, 2);
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
    raise exception 'Cicilan hanya dapat ditautkan ke payroll Draft';
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

  select coalesce(sum(least(c.nominal_cicilan, l.sisa_saldo)), 0)
    into scheduled_total
  from public.payroll_pinjaman_cicilan c
  join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
  where l.id_karyawan = payroll_row.id_karyawan
    and c.periode_payroll = payroll_row.periode
    and c.status = 'Terjadwal'
    and l.status = 'Berjalan';

  if scheduled_total = 0 then return 0; end if;

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
      and l.status = 'Berjalan'
  ) then
    raise exception 'Potongan Kasbon/Pinjaman sudah ada di payroll; rekonsiliasi dahulu untuk mencegah potongan ganda';
  end if;

  select coalesce(sum(d.nominal), 0) into detail_total
  from public.payroll_potongan d
  where d.id_payroll = p_id_payroll;

  if detail_total > 0 and detail_total <> payroll_row.potongan then
    raise exception 'Total payroll.potongan tidak sama dengan rincian payroll_potongan; rekonsiliasi dahulu';
  end if;
  if detail_total = 0 and payroll_row.potongan > 0
    and payroll_row.potongan <> scheduled_total then
    raise exception 'Potongan agregat lama tidak sama dengan total cicilan jatuh tempo; rekonsiliasi potongan tanpa rincian dahulu';
  end if;

  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active and r.role = 'HR/Admin'
  limit 1;

  for installment_row in
    select c.id_cicilan, c.id_pinjaman, c.nominal_cicilan,
      l.jenis, l.sisa_saldo
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    where l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
      and c.status = 'Terjadwal'
      and l.status = 'Berjalan'
    order by c.id_pinjaman, c.nomor_cicilan
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
    set status = 'Diproses',
        id_payroll = p_id_payroll,
        tanggal_pembayaran = null
    where id_cicilan = installment_row.id_cicilan
      and status = 'Terjadwal'
      and id_payroll is null;
    if not found then
      raise exception 'Cicilan sudah diproses atau terhubung ke payroll lain';
    end if;

    perform public.audit_payroll_pinjaman(
      installment_row.id_pinjaman, p_actor, actor_role,
      'Cicilan ditautkan ke payroll',
      jsonb_build_object(
        'id_payroll', p_id_payroll,
        'nominal_potongan', deduction_amount,
        'status_settlement', 'Menunggu payroll Dibayar'
      ),
      installment_row.id_cicilan
    );
    processed_count := processed_count + 1;
  end loop;

  return processed_count;
end;
$$;

create or replace function public.settle_payroll_pinjaman(
  p_id_payroll uuid,
  p_actor uuid
)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  payroll_row public.payroll%rowtype;
  installment_row record;
  expected_amount numeric(14, 2);
  remaining_balance numeric(14, 2);
  paid_total numeric(14, 2);
  settled_count integer := 0;
  payroll_employee_id uuid;
  actor_role text;
begin
  if p_actor is null or not public.has_payroll_pinjaman_role(
    p_actor, array['HR/Admin']
  ) then
    raise exception 'Settlement cicilan hanya dapat dijalankan oleh role HR/Admin';
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
  if payroll_row.status_pembayaran <> 'Dibayar'
    or payroll_row.tanggal_bayar is null then
    raise exception 'Settlement cicilan hanya dapat dilakukan setelah payroll berstatus Dibayar';
  end if;

  select r.role into actor_role
  from public.payroll_pinjaman_roles r
  where r.id_karyawan = p_actor and r.is_active and r.role = 'HR/Admin'
  limit 1;

  for installment_row in
    select c.id_cicilan, c.id_pinjaman, c.nominal_cicilan,
      l.jenis, l.sisa_saldo, l.total_terbayar,
      d.nominal as deduction_amount, d.jenis_potongan
    from public.payroll_pinjaman_cicilan c
    join public.payroll_pinjaman l on l.id_pinjaman = c.id_pinjaman
    join public.payroll_pinjaman_potongan lp on lp.id_cicilan = c.id_cicilan
    join public.payroll_potongan d on d.id_potongan = lp.id_potongan
    where c.id_payroll = p_id_payroll
      and c.status = 'Diproses'
      and l.id_karyawan = payroll_row.id_karyawan
      and c.periode_payroll = payroll_row.periode
    order by c.id_pinjaman, c.nomor_cicilan
    for update of c, l
  loop
    expected_amount := least(installment_row.nominal_cicilan, installment_row.sisa_saldo);
    if expected_amount <= 0
      or installment_row.deduction_amount <> expected_amount
      or installment_row.jenis_potongan <> (case installment_row.jenis
        when 'Kasbon' then 'Kasbon'
        else 'Pinjaman Karyawan'
      end) then
      raise exception 'Rincian potongan cicilan tidak sesuai saldo atau jenis pinjaman';
    end if;

    update public.payroll_pinjaman_cicilan
    set status = 'Dibayar',
        tanggal_pembayaran = payroll_row.tanggal_bayar
    where id_cicilan = installment_row.id_cicilan
      and id_payroll = p_id_payroll
      and status = 'Diproses';
    if not found then
      raise exception 'Cicilan tidak lagi berstatus Diproses untuk payroll ini';
    end if;

    remaining_balance := installment_row.sisa_saldo - expected_amount;
    paid_total := installment_row.total_terbayar + expected_amount;
    update public.payroll_pinjaman
    set sisa_saldo = remaining_balance,
        total_terbayar = paid_total,
        status = case when remaining_balance = 0 then 'Lunas' else 'Berjalan' end
    where id_pinjaman = installment_row.id_pinjaman;

    perform public.audit_payroll_pinjaman(
      installment_row.id_pinjaman, p_actor, actor_role,
      'Cicilan diselesaikan setelah payroll Dibayar',
      jsonb_build_object(
        'id_payroll', p_id_payroll,
        'nominal', expected_amount,
        'sisa_saldo', remaining_balance,
        'total_terbayar', paid_total
      ),
      installment_row.id_cicilan
    );
    settled_count := settled_count + 1;
  end loop;

  return settled_count;
end;
$$;

revoke all on function public.process_payroll_pinjaman(uuid, uuid) from public;
revoke all on function public.settle_payroll_pinjaman(uuid, uuid) from public;
grant execute on function public.process_payroll_pinjaman(uuid, uuid) to anon;
grant execute on function public.settle_payroll_pinjaman(uuid, uuid) to anon;

commit;
