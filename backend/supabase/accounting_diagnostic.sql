with table_status as (
  select
    expected.table_name,
    to_regclass(format('%I.%I', 'public', expected.table_name)) as relation_oid
  from (values
    ('accounts'),
    ('journal_entries'),
    ('journal_lines'),
    ('payroll')
  ) as expected(table_name)
),
counts as (
  select
    case when to_regclass('public.accounts') is null then null else
      (xpath('/table/row/row_count/text()', query_to_xml(
        'select count(*) as row_count from public.accounts', true, false, ''
      )))[1]::text::bigint end as account_count,
    case when to_regclass('public.journal_entries') is null then null else
      (xpath('/table/row/row_count/text()', query_to_xml(
        'select count(*) as row_count from public.journal_entries', true, false, ''
      )))[1]::text::bigint end as journal_count,
    case when to_regclass('public.journal_entries') is null then null else
      (xpath('/table/row/row_count/text()', query_to_xml(
        'select count(*) as row_count from public.journal_entries where status = ''Posted''', true, false, ''
      )))[1]::text::bigint end as posted_journal_count,
    case when to_regclass('public.journal_entries') is null then null else
      (xpath('/table/row/row_count/text()', query_to_xml(
        'select count(*) as row_count from public.journal_entries where entry_type = ''payroll'' and source_payroll_id is not null', true, false, ''
      )))[1]::text::bigint end as payroll_journal_count,
    case when to_regclass('public.journal_entries') is null
      or to_regclass('public.journal_lines') is null
      or to_regclass('public.accounts') is null then null else
      (xpath('/table/row/row_count/text()', query_to_xml(
        'select count(*) as row_count from public.journal_entries e join public.journal_lines l on l.id_journal = e.id_journal join public.accounts a on a.id_account = l.id_account where e.status = ''Posted''', true, false, ''
      )))[1]::text::bigint end as posted_ledger_line_count
)
select
  s.table_name,
  case when s.relation_oid is null then 'NOT FOUND' else 'FOUND' end as table_status,
  c.account_count,
  c.journal_count,
  c.posted_journal_count,
  c.payroll_journal_count,
  c.posted_ledger_line_count
from table_status s
cross join counts c
order by case s.table_name
  when 'accounts' then 1
  when 'journal_entries' then 2
  when 'journal_lines' then 3
  else 4
end;

select
  expected.table_name,
  columns.column_name,
  columns.data_type,
  columns.udt_name,
  columns.is_nullable,
  columns.column_default
from (values ('accounts'), ('journal_entries'), ('journal_lines'), ('payroll')) as expected(table_name)
left join information_schema.columns as columns
  on columns.table_schema = 'public'
  and columns.table_name = expected.table_name
order by expected.table_name, columns.ordinal_position;

select
  table_constraints.table_name,
  table_constraints.constraint_name,
  table_constraints.constraint_type,
  key_columns.column_name,
  referenced.table_name as referenced_table,
  referenced.column_name as referenced_column,
  pg_get_constraintdef(constraint_info.oid, true) as definition
from information_schema.table_constraints
join pg_namespace as table_schema
  on table_schema.nspname = table_constraints.constraint_schema
join pg_class as table_relation
  on table_relation.relnamespace = table_schema.oid
  and table_relation.relname = table_constraints.table_name
join pg_constraint as constraint_info
  on constraint_info.conrelid = table_relation.oid
  and constraint_info.conname = table_constraints.constraint_name
left join information_schema.key_column_usage as key_columns
  on key_columns.constraint_schema = table_constraints.constraint_schema
  and key_columns.constraint_name = table_constraints.constraint_name
  and key_columns.table_name = table_constraints.table_name
left join information_schema.constraint_column_usage as referenced
  on referenced.constraint_schema = table_constraints.constraint_schema
  and referenced.constraint_name = table_constraints.constraint_name
where table_constraints.constraint_schema = 'public'
  and table_constraints.table_name in ('accounts', 'journal_entries', 'journal_lines', 'payroll')
order by table_constraints.table_name, table_constraints.constraint_name, key_columns.ordinal_position;

select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('accounts', 'journal_entries', 'journal_lines')
order by tablename, indexname;

select
  trigger_schema,
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('accounts', 'journal_entries', 'journal_lines')
order by event_object_table, trigger_name, event_manipulation;

select
  routine_schema,
  routine_name,
  specific_name,
  routine_type,
  data_type as return_type,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'set_account_updated_at',
    'guard_journal_entry',
    'guard_journal_line',
    'create_payroll_journal',
    'create_payroll_payment_journal',
    'post_journal_entry'
  )
order by routine_name, specific_name;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('accounts', 'journal_entries', 'journal_lines')
order by tablename, policyname;

select
  expected.table_name,
  case when to_regclass(format('%I.%I', 'public', expected.table_name)) is null then false
    else has_table_privilege(
      'anon',
      format('%I.%I', 'public', expected.table_name),
      'SELECT'
    )
  end as anon_can_select,
  case when to_regclass(format('%I.%I', 'public', expected.table_name)) is null then false
    else has_table_privilege(
      'anon',
      format('%I.%I', 'public', expected.table_name),
      'INSERT'
    )
  end as anon_can_insert
from (values ('accounts'), ('journal_entries'), ('journal_lines')) as expected(table_name)
order by expected.table_name;

select
  expected.signature,
  to_regprocedure(expected.signature) is not null as function_found,
  case when to_regprocedure(expected.signature) is null then false
    else has_function_privilege('anon', to_regprocedure(expected.signature), 'EXECUTE')
  end as anon_can_execute
from (values
  ('public.create_payroll_journal(uuid)'),
  ('public.create_payroll_payment_journal(uuid,uuid)'),
  ('public.post_journal_entry(uuid)')
) as expected(signature)
order by expected.signature;

with account_xml as (
  select case
    when to_regclass('public.accounts') is null then '<table/>'::xml
    else query_to_xml(
      'select code, name from public.accounts where code in (''101'', ''102'', ''201'', ''202'', ''301'', ''401'', ''501'', ''502'', ''503'', ''504'') order by code',
      true, false, ''
    )
  end as document
)
select
  expected.code,
  expected.name as expected_name,
  case
    when to_regclass('public.accounts') is null then 'TABLE NOT FOUND'
    when found_account.code is null then 'MISSING'
    else 'FOUND'
  end as account_status,
  found_account.name as actual_name
from (values
  ('101', 'Kas'),
  ('102', 'Bank'),
  ('201', 'Utang Gaji'),
  ('202', 'Utang Potongan Gaji'),
  ('301', 'Modal'),
  ('401', 'Pendapatan Layanan'),
  ('501', 'Beban Gaji'),
  ('502', 'Beban Lembur'),
  ('503', 'Beban Tunjangan'),
  ('504', 'Beban Insentif')
) as expected(code, name)
cross join account_xml
left join lateral xmltable(
  '/table/row'
  passing account_xml.document
  columns code text path 'code', name text path 'name'
) as found_account on found_account.code = expected.code
order by expected.code;

with payroll_journal_xml as (
  select case
    when to_regclass('public.journal_entries') is null
      or to_regclass('public.journal_lines') is null
      or to_regclass('public.payroll') is null then '<table/>'::xml
    else query_to_xml(
      'select e.journal_number, to_char(e.entry_date, ''YYYY-MM-DD'') as entry_date, e.source_payroll_id::text as payroll_id, e.description, e.status, coalesce(sum(l.debit), 0)::numeric(14, 2)::text as total_debit, coalesce(sum(l.credit), 0)::numeric(14, 2)::text as total_credit from public.journal_entries e join public.payroll p on p.id_payroll = e.source_payroll_id left join public.journal_lines l on l.id_journal = e.id_journal where e.entry_type = ''payroll'' group by e.id_journal, e.journal_number, e.entry_date, e.source_payroll_id, e.description, e.status order by e.entry_date desc, e.journal_number',
      true, false, ''
    )
  end as document
)
select
  journal.journal_number,
  journal.entry_date,
  journal.payroll_id,
  journal.description,
  journal.status,
  journal.total_debit::numeric(14, 2) as total_debit,
  journal.total_credit::numeric(14, 2) as total_credit,
  journal.total_debit::numeric(14, 2) = journal.total_credit::numeric(14, 2) as is_balanced
from payroll_journal_xml
cross join lateral xmltable(
  '/table/row'
  passing payroll_journal_xml.document
  columns
    journal_number text path 'journal_number',
    entry_date date path 'entry_date',
    payroll_id uuid path 'payroll_id',
    description text path 'description',
    status text path 'status',
    total_debit text path 'total_debit',
    total_credit text path 'total_credit'
) as journal
order by journal.entry_date desc, journal.journal_number;
