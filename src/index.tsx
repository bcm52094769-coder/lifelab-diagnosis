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
    'SELECT * FROM ll_consultations ORDER BY apply_date DESC'
  ).all()
  return c.json(results)
})

app.post('/tables/consultations', async (c) => {
  const body = await c.req.json()
  const now  = new Date().toISOString()

  const r = await c.env.DB.prepare(`
    INSERT INTO ll_consultations (
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
  await c.env.DB.prepare(`UPDATE ll_consultations SET ${fields} WHERE id = ?`)
    .bind(...values, id).run()
  return c.json({ ok: true })
})

app.delete('/tables/consultations/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM ll_consultations WHERE id = ?')
    .bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ─── staff ───────────────────────────────────────────────────────────────────

app.get('/tables/staff', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ll_staff ORDER BY name'
  ).all()
  return c.json(results)
})

app.post('/tables/staff', async (c) => {
  const body = await c.req.json()
  const now  = new Date().toISOString()
  const r = await c.env.DB.prepare(
    'INSERT INTO ll_staff (name, active, created_at) VALUES (?,?,?)'
  ).bind(body.name, 1, now).run()
  return c.json({ id: r.meta.last_row_id, ok: true })
})

app.patch('/tables/staff/:id', async (c) => {
  const id   = c.req.param('id')
  const body = await c.req.json()
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ')
  const values = Object.values(body)
  await c.env.DB.prepare(`UPDATE ll_staff SET ${fields} WHERE id = ?`)
    .bind(...values, id).run()
  return c.json({ ok: true })
})

app.delete('/tables/staff/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM ll_staff WHERE id = ?')
    .bind(c.req.param('id')).run()
  return c.json({ ok: true })
})

// ─── site_settings ───────────────────────────────────────────────────────────

app.get('/tables/site_settings', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ll_site_settings'
  ).all()
  return c.json(results)
})

app.put('/tables/site_settings', async (c) => {
  const items: { id: string; value: string; label: string }[] = await c.req.json()
  for (const item of items) {
    const exists = await c.env.DB.prepare(
      'SELECT id FROM ll_site_settings WHERE id = ?'
    ).bind(item.id).first()
    if (exists) {
      await c.env.DB.prepare(
        'UPDATE ll_site_settings SET value = ?, label = ? WHERE id = ?'
      ).bind(item.value, item.label, item.id).run()
    } else {
      await c.env.DB.prepare(
        'INSERT INTO ll_site_settings (id, value, label) VALUES (?,?,?)'
      ).bind(item.id, item.value, item.label).run()
    }
  }
  return c.json({ ok: true })
})

// ─── entries (응모권) ─────────────────────────────────────────────────────────

// 응모권 조회 (전화번호로)
app.get('/api/entry/:phone', async (c) => {
  const phone = c.req.param('phone').replace(/\D/g, '')
  const entry = await c.env.DB.prepare(
    'SELECT * FROM ll_entries WHERE phone = ?'
  ).bind(phone).first()
  return c.json(entry || null)
})

// 전체 응모권 목록 (관리자용)
app.get('/api/entries', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT e.*,
      (SELECT COUNT(*) FROM ll_entries ie WHERE ie.invited_by = e.phone) as invite_count
     FROM ll_entries e ORDER BY e.created_at DESC`
  ).all()
  return c.json(results)
})

// 응모권 생성/업데이트 (상담 신청 완료 시 호출)
// 1) 본인 응모권 +1
// 2) 나를 초대한 사람 응모권 +1 (invited_by 있을 때)
app.post('/api/entry', async (c) => {
  const body = await c.req.json()
  const { name, phone, consult_id, ref_staff, ref_staff_name, invited_by } = body
  const cleanPhone     = (phone || '').replace(/\D/g, '')
  const cleanInvitedBy = (invited_by || '').replace(/\D/g, '')
  const now = new Date().toISOString()

  // 이미 응모한 전화번호인지 확인
  const existing = await c.env.DB.prepare(
    'SELECT * FROM ll_entries WHERE phone = ?'
  ).bind(cleanPhone).first() as any

  let myEntryId = 0

  if (existing) {
    // 이미 있으면 그냥 응모권 수 유지 (중복 신청 방지)
    myEntryId = existing.id
    return c.json({ id: myEntryId, entry_count: existing.entry_count, duplicate: true })
  } else {
    // 새 응모권 생성 (기본 1장)
    const r = await c.env.DB.prepare(
      `INSERT INTO ll_entries (phone, name, consult_id, ref_staff, ref_staff_name, invited_by, entry_count, created_at)
       VALUES (?,?,?,?,?,?,1,?)`
    ).bind(cleanPhone, name || '', consult_id || 0, ref_staff || '', ref_staff_name || '', cleanInvitedBy, now).run()
    myEntryId = r.meta.last_row_id
  }

  // 나를 초대한 사람(invited_by)의 응모권 +1
  if (cleanInvitedBy) {
    const inviter = await c.env.DB.prepare(
      'SELECT * FROM ll_entries WHERE phone = ?'
    ).bind(cleanInvitedBy).first() as any

    if (inviter) {
      await c.env.DB.prepare(
        'UPDATE ll_entries SET entry_count = entry_count + 1 WHERE phone = ?'
      ).bind(cleanInvitedBy).run()
    }
  }

  // 방금 생성된 응모권 반환
  const newEntry = await c.env.DB.prepare(
    'SELECT * FROM ll_entries WHERE id = ?'
  ).bind(myEntryId).first()

  return c.json({ id: myEntryId, entry_count: 1, ok: true, entry: newEntry })
})

// ─── roulette (룰렛 결과 저장) ───────────────────────────────────────────────

// 상품 목록 조회
app.get('/api/prizes', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM ll_prizes WHERE active = 1 ORDER BY probability DESC'
  ).all()
  return c.json(results)
})

// 룰렛 실행 (결과 결정 & 저장)
// 서버사이드에서 당첨 결과 결정 → 조작 방지
app.post('/api/roulette/:phone', async (c) => {
  const phone = c.req.param('phone').replace(/\D/g, '')
  const now   = new Date().toISOString()

  // 응모권 확인
  const entry = await c.env.DB.prepare(
    'SELECT * FROM ll_entries WHERE phone = ?'
  ).bind(phone).first() as any

  if (!entry) return c.json({ error: '응모권이 없습니다.' }, 404)
  if (entry.roulette_played) return c.json({ error: '이미 룰렛을 실행했습니다.', result: entry.roulette_result }, 400)

  // 상품 조회 (꽝 제외 당첨 가능 상품)
  const { results: prizes } = await c.env.DB.prepare(
    'SELECT * FROM ll_prizes WHERE active = 1'
  ).all() as { results: any[] }

  // 당첨 결정 로직:
  // - 잔여 수량이 있는 상품은 당첨 후보에 포함
  // - 확률은 probability 필드 기준으로 가중 랜덤
  const pool: string[] = []
  for (const p of prizes) {
    if (p.id === '꽝') {
      // 꽝은 50개 슬롯
      for (let i = 0; i < 50; i++) pool.push('꽝')
    } else {
      const remaining = (p.total_count || 0) - (p.win_count || 0)
      if (remaining > 0) {
        // 잔여 수량 * probability 만큼 슬롯 추가
        const slots = Math.max(1, Math.floor(p.probability || 1))
        for (let i = 0; i < slots; i++) pool.push(p.id)
      }
    }
  }

  if (pool.length === 0) {
    // 모든 상품 소진 시 꽝 처리
    await c.env.DB.prepare(
      'UPDATE ll_entries SET roulette_result=?, roulette_played=1, roulette_at=? WHERE phone=?'
    ).bind('꽝', now, phone).run()
    return c.json({ result: '꽝', label: '아쉽게도 꽝!', ok: true })
  }

  // 랜덤 선택
  const picked = pool[Math.floor(Math.random() * pool.length)]

  // 당첨 상품이면 win_count 증가
  if (picked !== '꽝') {
    await c.env.DB.prepare(
      'UPDATE ll_prizes SET win_count = win_count + 1 WHERE id = ?'
    ).bind(picked).run()
  }

  // 결과 저장
  await c.env.DB.prepare(
    'UPDATE ll_entries SET roulette_result=?, roulette_played=1, roulette_at=? WHERE phone=?'
  ).bind(picked, now, phone).run()

  const prizeRow = prizes.find((p: any) => p.id === picked)
  return c.json({ result: picked, label: prizeRow?.label || picked, ok: true })
})

// 상품 설정 업데이트 (관리자)
app.put('/api/prizes', async (c) => {
  const items: any[] = await c.req.json()
  for (const item of items) {
    await c.env.DB.prepare(
      'UPDATE ll_prizes SET label=?, total_count=?, probability=?, active=? WHERE id=?'
    ).bind(item.label, item.total_count, item.probability, item.active ? 1 : 0, item.id).run()
  }
  return c.json({ ok: true })
})

export default app
