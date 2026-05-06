import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

// ─── consultations ───────────────────────────────────────────────────────────

app.get('/tables/consultations', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM consultations ORDER BY apply_date DESC'
  ).all()
  return c.json(results)
})

app.post('/tables/consultations', async (c) => {
  const body = await c.req.json()
  const now  = new Date().toISOString()

  const r = await c.env.DB.prepare(`
    INSERT INTO consultations (
      name, phone, birthdate, job,
      monthly_income, monthly_living, monthly_saving, saving_method,
      monthly_insurance, has_emergency_fund, has_retirement_plan,
      financial_score, score_type, question, preferred_time,
      privacy_agreed, status, assignee, memo, apply_date,
      income_type, has_debt, monthly_debt, total_asset,
      insurance_types, emergency_level, social_security,
      retirement_plans, fin_goal, ref_staff, ref_staff_name
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    body.name ?? '',
    body.phone ?? '',
    body.birthdate ?? '',
    body.job ?? '',
    body.monthly_income ?? 0,
    body.monthly_living ?? 0,
    body.monthly_saving ?? 0,
    JSON.stringify(body.saving_method ?? []),
    body.monthly_insurance ?? 0,
    body.has_emergency_fund ? 1 : 0,
    body.has_retirement_plan ? 1 : 0,
    body.financial_score ?? 0,
    body.score_type ?? '',
    body.question ?? '',
    body.preferred_time ?? '',
    body.privacy_agreed ? 1 : 0,
    body.status ?? '신규',
    body.assignee ?? '',
    body.memo ?? '',
    now,
    body.income_type ?? '',
    body.has_debt ? 1 : 0,
    body.monthly_debt ?? 0,
    body.total_asset ?? 0,
    JSON.stringify(body.insurance_types ?? []),
    body.emergency_level ?? '',
    body.social_security ?? '',
    JSON.stringify(body.retirement_plans ?? []),
    body.fin_goal ?? '',
    body.ref_staff ?? 'instagram',
    body.ref_staff_name ?? '인스타광고'
  ).run()

  return c.json({ id: r.meta.last_row_id, ok: true })
})

app.patch('/tables/consultations/:id', async (c) => {
  const id   = c.req.param('id')
  const body = await c.req.json()
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ')
  const values = Object.values(body)
  await c.env.DB.prepare(`UPDATE consultations SET ${fields} WHERE id = ?`)
    .bind(...values, id).run()
  return c.json({ ok: true })
})

app.delete('/tables/consultations/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM consultations WHERE id = ?')
    .bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ─── staff ───────────────────────────────────────────────────────────────────

app.get('/tables/staff', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM staff ORDER BY name'
  ).all()
  return c.json(results)
})

app.post('/tables/staff', async (c) => {
  const body = await c.req.json()
  const now  = new Date().toISOString()
  const r = await c.env.DB.prepare(
    'INSERT INTO staff (name, active, created_at) VALUES (?,?,?)'
  ).bind(body.name, 1, now).run()
  return c.json({ id: r.meta.last_row_id, ok: true })
})

app.patch('/tables/staff/:id', async (c) => {
  const id   = c.req.param('id')
  const body = await c.req.json()
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ')
  const values = Object.values(body)
  await c.env.DB.prepare(`UPDATE staff SET ${fields} WHERE id = ?`)
    .bind(...values, id).run()
  return c.json({ ok: true })
})

app.delete('/tables/staff/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM staff WHERE id = ?')
    .bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ─── site_settings ───────────────────────────────────────────────────────────

app.get('/tables/site_settings', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM site_settings'
  ).all()
  return c.json(results)
})

app.put('/tables/site_settings', async (c) => {
  const items: { id: string; value: string; label: string }[] = await c.req.json()
  for (const item of items) {
    const exists = await c.env.DB.prepare(
      'SELECT id FROM site_settings WHERE id = ?'
    ).bind(item.id).first()
    if (exists) {
      await c.env.DB.prepare(
        'UPDATE site_settings SET value = ?, label = ? WHERE id = ?'
      ).bind(item.value, item.label, item.id).run()
    } else {
      await c.env.DB.prepare(
        'INSERT INTO site_settings (id, value, label) VALUES (?,?,?)'
      ).bind(item.id, item.value, item.label).run()
    }
  }
  return c.json({ ok: true })
})

export default app
