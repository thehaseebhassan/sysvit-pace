# Planned tables (not yet migrated)

All rows carry `workspace_id` + RLS like the Phase 1 tables. Money = integer cents + `currency_code` (never floats).

- clients(name, contact_email, currency_code) ; projects.client_id added later
- time_entries(task_id, member_id, minutes int, started_at, billable bool, note)
- proposals(client_id, project_id, status, total_cents bigint, currency_code, sent_at)
- invoices(client_id, number, status, subtotal_cents, tax_cents, total_cents, currency_code, issued_at, due_at)
- invoice_line_items(invoice_id, description, quantity numeric, unit_price_cents bigint, amount_cents bigint, time_entry_id?, task_id?)
