create sequence if not exists public.journal_number_seq;

create table if not exists public.accounts (
  id_account uuid primary key default gen_random_uuid(),
  code varchar(20) not null unique check (char_length(btrim(code)) between 1 and 20),
  name varchar(120) not null check (char_length(btrim(name)) between 2 and 120),
  account_type varchar(20) not null check (account_type in ('Aset', 'Liabilitas', 'Ekuitas', 'Pendapatan', 'Beban')),
  normal_balance varchar(10) not null check (normal_balance in ('Debit', 'Kredit')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id_journal uuid primary key default gen_random_uuid(),
  journal_number varchar(30) not null unique,
  entry_date date not null,
  period date not null check (period = date_trunc('month', period)::date),
  description text not null check (char_length(btrim(description)) > 0),
  entry_type varchar(30) not null check (entry_type in ('payroll', 'payroll_payment')),
  status varchar(10) not null default 'Draft' check (status in ('Draft', 'Posted')),
  source_payroll_id uuid references public.payroll(id_payroll) on delete restrict,
  created_at timestamptz not null default now(),
  posted_at timestamptz,
  constraint journal_source_type_required check (source_payroll_id is not null),
  constraint journal_posted_at_status check ((status = 'Posted') = (posted_at is not null)),
  constraint journal_source_once unique (source_payroll_id, entry_type)
);

create table if not exists public.journal_lines (
  id_line uuid primary key default gen_random_uuid(),
  id_journal uuid not null references public.journal_entries(id_journal) on delete cascade,
  id_account uuid not null references public.accounts(id_account) on delete restrict,
  description text,
  debit numeric(14, 2) not null default 0 check (debit >= 0),
  credit numeric(14, 2) not null default 0 check (credit >= 0),
  constraint journal_line_one_side check (not (debit > 0 and credit > 0)),
  constraint journal_line_positive_amount check (debit > 0 or credit > 0)
);

create index if not exists journal_entries_date_idx on public.journal_entries(entry_date desc);
create index if not exists journal_entries_period_idx on public.journal_entries(period desc);
create index if not exists journal_entries_status_idx on public.journal_entries(status, entry_date desc);
create index if not exists journal_lines_journal_idx on public.journal_lines(id_journal);
create index if not exists journal_lines_account_idx on public.journal_lines(id_account, id_journal);

insert into public.accounts (code, name, account_type, normal_balance) values
  ('101', 'Kas', 'Aset', 'Debit'),
  ('102', 'Bank', 'Aset', 'Debit'),
  ('201', 'Utang Gaji', 'Liabilitas', 'Kredit'),
  ('202', 'Utang Potongan Gaji', 'Liabilitas', 'Kredit'),
  ('301', 'Modal', 'Ekuitas', 'Kredit'),
  ('401', 'Pendapatan Layanan', 'Pendapatan', 'Kredit'),
  ('501', 'Beban Gaji', 'Beban', 'Debit'),
  ('502', 'Beban Lembur', 'Beban', 'Debit'),
  ('503', 'Beban Tunjangan', 'Beban', 'Debit'),
  ('504', 'Beban Insentif', 'Beban', 'Debit')
on conflict (code) do nothing;

create or replace function public.set_account_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at := now(); return new; end; $$;

create or replace function public.guard_journal_entry()
returns trigger language plpgsql set search_path = ''
as $$
declare
  debit_total numeric(14, 2);
  credit_total numeric(14, 2);
  line_count integer;
begin
  if tg_op = 'DELETE' then
    if old.status = 'Posted' then raise exception 'Jurnal Posted tidak dapat dihapus'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if old.status = 'Posted' then raise exception 'Jurnal Posted tidak dapat diubah'; end if;
  end if;
  if new.status = 'Posted' then
    select coalesce(sum(l.debit), 0), coalesce(sum(l.credit), 0), count(*)
      into debit_total, credit_total, line_count
    from public.journal_lines l where l.id_journal = new.id_journal;
    if line_count < 2 or debit_total <= 0 or debit_total <> credit_total then
      raise exception 'Jurnal tidak seimbang atau belum memiliki minimal dua baris (debit %, kredit %)', debit_total, credit_total;
    end if;
    new.posted_at := coalesce(new.posted_at, now());
  elsif tg_op = 'INSERT' then
    new.posted_at := null;
  elsif old.status is distinct from new.status then
    new.posted_at := null;
  end if;
  return new;
end;
$$;

create or replace function public.guard_journal_line()
returns trigger language plpgsql set search_path = ''
as $$
declare
  journal_status varchar(10);
begin
  if tg_op = 'DELETE' then
    select e.status into journal_status from public.journal_entries e where e.id_journal = old.id_journal;
  else
    if tg_op = 'UPDATE' then
      select e.status into journal_status from public.journal_entries e where e.id_journal = old.id_journal;
      if journal_status = 'Posted' then raise exception 'Baris jurnal Posted tidak dapat diubah'; end if;
    end if;
    select e.status into journal_status from public.journal_entries e where e.id_journal = new.id_journal;
  end if;
  if journal_status = 'Posted' then raise exception 'Baris jurnal Posted tidak dapat diubah'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at before update on public.accounts
for each row execute function public.set_account_updated_at();

drop trigger if exists journal_entries_guard on public.journal_entries;
create trigger journal_entries_guard before insert or update or delete on public.journal_entries
for each row execute function public.guard_journal_entry();

drop trigger if exists journal_lines_guard on public.journal_lines;
create trigger journal_lines_guard before insert or update or delete on public.journal_lines
for each row execute function public.guard_journal_line();

create or replace function public.create_payroll_journal(p_payroll_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  payroll_row public.payroll%rowtype;
  journal_id uuid;
  account_salary uuid;
  account_overtime uuid;
  account_allowance uuid;
  account_incentive uuid;
  account_payable uuid;
  account_deductions uuid;
  generated_number varchar(30);
begin
  select * into payroll_row from public.payroll
    where id_payroll = p_payroll_id for update;
  if not found then raise exception 'Data payroll tidak ditemukan'; end if;
  if payroll_row.status_pembayaran = 'Draft' then
    raise exception 'Payroll harus berstatus Diproses atau Dibayar sebelum dijurnal';
  end if;

  select id_journal into journal_id from public.journal_entries
    where source_payroll_id = p_payroll_id and entry_type = 'payroll';
  if journal_id is not null then return journal_id; end if;

  select id_account into account_salary from public.accounts where code = '501' and is_active;
  select id_account into account_overtime from public.accounts where code = '502' and is_active;
  select id_account into account_allowance from public.accounts where code = '503' and is_active;
  select id_account into account_incentive from public.accounts where code = '504' and is_active;
  select id_account into account_payable from public.accounts where code = '201' and is_active;
  select id_account into account_deductions from public.accounts where code = '202' and is_active;
  if account_salary is null or account_overtime is null or account_allowance is null
    or account_incentive is null or account_payable is null or account_deductions is null then
    raise exception 'Akun default payroll 201, 202, dan 501-504 harus aktif';
  end if;
  if payroll_row.gaji_kotor <= 0 then raise exception 'Payroll bernilai nol tidak dapat dijurnal'; end if;

  generated_number := 'JRN-' || to_char(payroll_row.periode, 'YYYYMM') || '-' ||
    lpad(nextval('public.journal_number_seq')::text, 6, '0');
  insert into public.journal_entries
    (journal_number, entry_date, period, description, entry_type, source_payroll_id)
  values
    (generated_number, payroll_row.periode, payroll_row.periode,
     'Pengakuan payroll periode ' || to_char(payroll_row.periode, 'MM/YYYY'),
     'payroll', p_payroll_id)
  returning id_journal into journal_id;

  if payroll_row.gaji_pokok > 0 then
    insert into public.journal_lines (id_journal, id_account, description, debit)
    values (journal_id, account_salary, 'Beban gaji pokok', payroll_row.gaji_pokok);
  end if;
  if payroll_row.total_lembur > 0 then
    insert into public.journal_lines (id_journal, id_account, description, debit)
    values (journal_id, account_overtime, 'Beban lembur disetujui', payroll_row.total_lembur);
  end if;
  if payroll_row.tunjangan > 0 then
    insert into public.journal_lines (id_journal, id_account, description, debit)
    values (journal_id, account_allowance, 'Beban tunjangan', payroll_row.tunjangan);
  end if;
  if payroll_row.insentif > 0 then
    insert into public.journal_lines (id_journal, id_account, description, debit)
    values (journal_id, account_incentive, 'Beban insentif', payroll_row.insentif);
  end if;
  if payroll_row.gaji_bersih > 0 then
    insert into public.journal_lines (id_journal, id_account, description, credit)
    values (journal_id, account_payable, 'Utang gaji bersih', payroll_row.gaji_bersih);
  end if;
  if payroll_row.potongan > 0 then
    insert into public.journal_lines (id_journal, id_account, description, credit)
    values (journal_id, account_deductions, 'Utang potongan payroll', payroll_row.potongan);
  end if;
  return journal_id;
end;
$$;

create or replace function public.create_payroll_payment_journal(
  p_payroll_id uuid,
  p_cash_account_id uuid
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  payroll_row public.payroll%rowtype;
  payroll_journal public.journal_entries%rowtype;
  cash_account public.accounts%rowtype;
  payment_journal_id uuid;
  generated_number varchar(30);
begin
  select * into payroll_row from public.payroll
    where id_payroll = p_payroll_id for update;
  if not found then raise exception 'Data payroll tidak ditemukan'; end if;
  if payroll_row.status_pembayaran <> 'Dibayar' or payroll_row.tanggal_bayar is null then
    raise exception 'Payroll harus berstatus Dibayar dan memiliki tanggal pembayaran';
  end if;

  select * into payroll_journal from public.journal_entries
    where source_payroll_id = p_payroll_id and entry_type = 'payroll';
  if not found then
    raise exception 'Jurnal pengakuan payroll harus Posted sebelum membuat jurnal pembayaran';
  end if;
  if payroll_journal.status <> 'Posted' then
    raise exception 'Jurnal pengakuan payroll harus Posted sebelum membuat jurnal pembayaran';
  end if;
  select id_journal into payment_journal_id from public.journal_entries
    where source_payroll_id = p_payroll_id and entry_type = 'payroll_payment';
  if payment_journal_id is not null then return payment_journal_id; end if;

  select * into cash_account from public.accounts where id_account = p_cash_account_id and is_active;
  if not found then
    raise exception 'Pilih akun Kas/Bank aktif bertipe Aset';
  end if;
  if cash_account.account_type <> 'Aset' then
    raise exception 'Pilih akun Kas/Bank aktif bertipe Aset';
  end if;
  if not exists (select 1 from public.accounts where code = '201' and is_active) then
    raise exception 'Akun Utang Gaji 201 harus aktif untuk mencatat pembayaran';
  end if;
  if payroll_row.gaji_bersih <= 0 then raise exception 'Gaji bersih harus lebih dari nol untuk pembayaran'; end if;

  generated_number := 'JRN-' || to_char(payroll_row.tanggal_bayar, 'YYYYMM') || '-' ||
    lpad(nextval('public.journal_number_seq')::text, 6, '0');
  insert into public.journal_entries
    (journal_number, entry_date, period, description, entry_type, source_payroll_id)
  values
    (generated_number, payroll_row.tanggal_bayar, payroll_row.periode,
     'Pembayaran gaji periode ' || to_char(payroll_row.periode, 'MM/YYYY'),
     'payroll_payment', p_payroll_id)
  returning id_journal into payment_journal_id;

  insert into public.journal_lines (id_journal, id_account, description, debit)
  values (payment_journal_id, (select id_account from public.accounts where code = '201'),
          'Pelunasan utang gaji', payroll_row.gaji_bersih);
  insert into public.journal_lines (id_journal, id_account, description, credit)
  values (payment_journal_id, p_cash_account_id, 'Pembayaran melalui ' || cash_account.name,
          payroll_row.gaji_bersih);
  return payment_journal_id;
end;
$$;

create or replace function public.post_journal_entry(p_journal_id uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  journal_status varchar(10);
begin
  select status into journal_status from public.journal_entries
    where id_journal = p_journal_id for update;
  if not found then raise exception 'Jurnal tidak ditemukan'; end if;
  if journal_status = 'Posted' then return p_journal_id; end if;
  update public.journal_entries set status = 'Posted' where id_journal = p_journal_id;
  return p_journal_id;
end;
$$;

alter table public.accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_lines enable row level security;

drop policy if exists "Akses demo akuntansi untuk anon" on public.accounts;
create policy "Akses demo akuntansi untuk anon" on public.accounts
for all to anon using (true) with check (true);
drop policy if exists "Baca jurnal demo untuk anon" on public.journal_entries;
create policy "Baca jurnal demo untuk anon" on public.journal_entries
for select to anon using (true);
drop policy if exists "Baca baris jurnal demo untuk anon" on public.journal_lines;
create policy "Baca baris jurnal demo untuk anon" on public.journal_lines
for select to anon using (true);

grant select, insert, update, delete on public.accounts to anon;
grant select on public.journal_entries, public.journal_lines to anon;
grant usage, select on sequence public.journal_number_seq to anon;
grant execute on function public.create_payroll_journal(uuid) to anon;
grant execute on function public.create_payroll_payment_journal(uuid, uuid) to anon;
grant execute on function public.post_journal_entry(uuid) to anon;
