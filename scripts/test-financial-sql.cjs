/* eslint-disable @typescript-eslint/no-require-imports -- Standalone isolated SQL test. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
(async()=>{ const db=new PGlite(); const admin={query:async(sql,params)=>params ? db.query(sql,params) : (await db.exec(sql)).at(-1)}; try {

 const m=path.join(__dirname,'../supabase/migrations/');
 await admin.query(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 CREATE TABLE organizations(id uuid PRIMARY KEY); CREATE TABLE org_members(org_id uuid,user_id uuid,role text);
 CREATE FUNCTION is_org_member(uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM org_members WHERE org_id=$1 AND user_id=auth.uid())$$;
 CREATE FUNCTION is_org_admin(uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$SELECT EXISTS(SELECT 1 FROM org_members WHERE org_id=$1 AND user_id=auth.uid() AND role='admin')$$;
 GRANT USAGE ON SCHEMA auth TO authenticated,anon;
 CREATE FUNCTION purge_expired_rows() RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$SELECT '{}'::jsonb$$;
 CREATE FUNCTION purge_expired_factur_x_history() RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$SELECT 0$$;
 CREATE FUNCTION get_shared_link(text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$SELECT '{}'::jsonb$$;
 `);
 for(const file of ['014_coownerships.sql','015_coownership_finance.sql','017_coownership_assemblies.sql','018_coownership_accounting.sql','047_syndic_allocation_keys.sql','050_syndic_reminders.sql'])await admin.query(fs.readFileSync(m+file,'utf8'));
 await admin.query('GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated; GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;');
 const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 await admin.query(`INSERT INTO auth.users(id) VALUES ('${a}'),('${b}'); INSERT INTO organizations VALUES ('${a}'),('${b}'); INSERT INTO org_members VALUES ('${a}','${a}','admin'),('${b}','${b}','admin'); INSERT INTO coownerships(id,org_id,name) VALUES ('${a}','${a}','Private A'),('${b}','${b}','Private B');`);
 const scalar=async(sql,params=[])=>(await admin.query(sql,params)).rows[0];
 const aa=(await scalar("INSERT INTO accounting_accounts(coownership_id,code,label,classe,account_type) VALUES($1,'600','A expenses',6,'expense') RETURNING id",[a])).id;
 const ab=(await scalar("INSERT INTO accounting_accounts(coownership_id,code,label,classe,account_type) VALUES($1,'600','B expenses',6,'expense') RETURNING id",[b])).id;
 for(const [owner,account,year,amount] of [[a,aa,2025,100],[a,aa,2026,200],[b,ab,2026,999]]){
   const y=(await scalar('INSERT INTO coownership_accounting_years(coownership_id,year) VALUES($1,$2) RETURNING id',[owner,year])).id;
   const e=(await scalar("INSERT INTO accounting_entries(coownership_id,year_id,entry_date,label) VALUES($1,$2,$3,'test') RETURNING id",[owner,y,year+'-01-01'])).id;
   await admin.query('INSERT INTO accounting_entry_lines(entry_id,account_id,debit) VALUES($1,$2,$3)',[e,account,amount]);
   await admin.query('INSERT INTO coownership_budget_lines(coownership_id,year,account_id,amount_budgeted) VALUES($1,$2,$3,500)',[owner,year,account]);
 }
 const unit=(await scalar("INSERT INTO coownership_units(coownership_id,lot_number,owner_name,tantiemes) VALUES($1,'A1','A owner',1000) RETURNING id",[a])).id;
 for(const [status,due,amount,paid] of [['issued','2026-01-01',40,0],['issued','2026-02-01',60,0],['draft','2026-03-01',1000,0],['cancelled','2026-04-01',2000,0],['paid','2026-05-01',10,10]]){
   const c=(await scalar("INSERT INTO coownership_calls(coownership_id,label,period_start,period_end,due_date,status) VALUES($1,'QA','2026-01-01','2026-12-31',$2,$3) RETURNING id",[a,due,status])).id;
   await admin.query('INSERT INTO coownership_unit_charges(call_id,unit_id,amount_due,amount_paid) VALUES($1,$2,$3,$4)',[c,unit,amount,paid]);
 }
 await admin.query('SET ROLE anon');
 assert.equal((await admin.query('SELECT * FROM coownership_budget_vs_actual')).rows.length,3);
 assert.equal((await scalar('SELECT total_debit FROM accounting_balance($1,2026)',[b])).total_debit,'999.00');
 console.log('PASS baseline reproduced: anonymous views and financial RPC expose another organization');
 await admin.query('RESET ROLE');
 assert.equal((await scalar('SELECT total_debit FROM accounting_balance($1,2026)',[a])).total_debit,'300.00');
 const migration=fs.readFileSync(m+'067_private_financial_access.sql','utf8'); await admin.query(migration);await admin.query(migration);
 assert.equal((await scalar("SELECT count(*)::int n FROM tevaxia_audit.schema_backups WHERE migration='067'")).n,1);
 await admin.query(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${a}',false);`);
 assert.equal((await scalar('SELECT total_debit FROM accounting_balance($1,2026)',[a])).total_debit,'200.00');
 assert.equal((await admin.query('SELECT * FROM accounting_balance($1,2026)',[b])).rows.length,0);
 assert.equal((await admin.query('SELECT * FROM coownership_budget_vs_actual')).rows.length,2);
 assert.equal((await scalar('SELECT amount_actual FROM coownership_budget_vs_actual WHERE year=2026')).amount_actual,'200.00');
 const balance=await scalar('SELECT nb_charges::text,total_due,total_paid,balance_outstanding,oldest_unpaid_due_date::text FROM coownership_owner_balance');
 assert.deepEqual(balance,{nb_charges:'3',total_due:'110',total_paid:'10',balance_outstanding:'100',oldest_unpaid_due_date:'2026-01-01'});
 await assert.rejects(admin.query('SELECT seed_accounting_chart($1)',[b]),/row-level security/);
 assert.ok((await scalar('SELECT seed_accounting_chart($1) n',[a])).n>0);
 await assert.rejects(admin.query('SELECT purge_expired_rows()'),/permission denied/);
 await assert.rejects(admin.query('SELECT * FROM tevaxia_audit.schema_backups'),/permission denied/);
 console.log('PASS authenticated isolation; own seed succeeds, foreign seed/purge/backup access refused; annual balances and oldest overdue corrected');
 await admin.query("RESET ROLE; SET ROLE anon; SELECT set_config('request.jwt.claim.sub','',false)");
 await assert.rejects(admin.query('SELECT * FROM accounting_balance($1,2026)',[a]),/permission denied/);
 await assert.rejects(admin.query('SELECT purge_expired_factur_x_history()'),/permission denied/);
 assert.deepEqual((await scalar("SELECT get_shared_link('public-token') result")).result,{});
 for(const name of ['coownership_budget_vs_actual','coownership_owner_balance','coownership_unpaid_charges']){
   // Supabase's table policies call private helpers; either denial or no rows is safe.
   try {assert.equal((await admin.query('SELECT * FROM '+name)).rows.length,0);}catch(e){assert.match(e.message,/permission denied/);}
 }
 await admin.query('RESET ROLE');
 console.log('PASS anon financial RPCs denied, public token API retained, views no longer bypass RLS; migration idempotent; PostgreSQL '+(await admin.query('SHOW server_version')).rows[0].server_version);
 await admin.query(`CREATE TABLE auth.mfa_factors(id uuid DEFAULT gen_random_uuid(),user_id uuid,status text);
 CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$SELECT jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true))$$;
 CREATE FUNCTION org_agency_stats() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN RETURN 42; END$$;
 GRANT EXECUTE ON FUNCTION org_agency_stats() TO authenticated;
 CREATE POLICY qa_permissive ON accounting_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);`);
 const aalSql=fs.readFileSync(m+'068_enrolled_mfa_assurance.sql','utf8');await admin.query(aalSql);await admin.query(aalSql);
 await admin.query(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${a}',false); SELECT set_config('request.jwt.claim.aal','aal1',false)`);
 assert.equal((await scalar('SELECT session_has_required_aal() allowed')).allowed,true);
 assert.equal((await scalar('SELECT org_agency_stats() n')).n,42);
 await admin.query(`RESET ROLE; INSERT INTO auth.mfa_factors(user_id,status) VALUES('${a}','unverified'); SET ROLE authenticated`);
 assert.equal((await scalar('SELECT session_has_required_aal() allowed')).allowed,true);
 await admin.query("RESET ROLE; UPDATE auth.mfa_factors SET status='verified'; SET ROLE authenticated");
 assert.equal((await scalar('SELECT session_has_required_aal() allowed')).allowed,false);
 assert.equal((await admin.query('SELECT * FROM accounting_accounts')).rows.length,0);
 await assert.rejects(admin.query('SELECT org_agency_stats()'),/MFA verification required/);
 await assert.rejects(admin.query("INSERT INTO accounting_accounts(coownership_id,code,label,classe,account_type) VALUES($1,'999','blocked',6,'expense')",[a]),/row-level security/);
 await admin.query("SELECT set_config('request.jwt.claim.aal','aal2',false)");
 assert.equal((await scalar('SELECT session_has_required_aal() allowed')).allowed,true);
 assert.equal((await scalar('SELECT org_agency_stats() n')).n,42);
 assert.ok((await admin.query('SELECT * FROM accounting_accounts')).rows.length>0);
 await admin.query(`SELECT set_config('request.jwt.claim.sub','${b}',false); SELECT set_config('request.jwt.claim.aal','aal1',false)`);
 assert.equal((await scalar('SELECT session_has_required_aal() allowed')).allowed,true);
 await admin.query("RESET ROLE; SET ROLE anon; SELECT set_config('request.jwt.claim.sub','',false)");
 assert.deepEqual((await scalar("SELECT get_shared_link('bearer') result")).result,{});
 await admin.query('RESET ROLE');
 console.log('PASS AAL2: optional until verified, private reads/writes and definer RPC blocked at AAL1 even with permissive policy; AAL2 restored, unenrolled second account and public tokens preserved');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exit(1)});
