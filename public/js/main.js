/* ═══════════════════════════════════════════════
   LIFELAB 재무건강 진단 — Main Logic
   ═══════════════════════════════════════════════ */

// ── State ─────────────────────────────────────
const state = {
  currentStep: 0,
  score: 0,
  scoreType: '',
  scores: {},
  ref_staff: 'instagram',
  ref_staff_name: '인스타광고',
  submittedData: null
}

// ── URL Parameter Detection ───────────────────
;(function detectRef() {
  const params = new URLSearchParams(location.search)
  const ref = params.get('ref')
  const rn  = params.get('rn')
  if (ref && rn) {
    state.ref_staff      = ref
    state.ref_staff_name = decodeURIComponent(rn)
    const banner = document.getElementById('ref-banner')
    const name   = document.getElementById('banner-name')
    banner.classList.add('show')
    name.textContent = decodeURIComponent(rn) + ' 담당자'
  }
})()

// ── Load footer notice from site_settings ────
;(async function loadSettings() {
  try {
    const res  = await fetch('/tables/site_settings')
    if (!res.ok) return
    const data = await res.json()

    // 헬퍼: id로 값 찾기
    const get = (key) => {
      const item = data.find(d => d.id === key || d.copyid === key)
      return item ? (item.value || '') : ''
    }

    // ① 하단 고지문구 (관리자 > 사이트설정 > 하단 고지문구)
    const noticeEl = document.getElementById('footer-notice')
    if (noticeEl) {
      const val = get('footer_notice')
      noticeEl.innerHTML = val.trim()
        ? val.replace(/\n/g, '<br/>')
        : '라이프랩 LIFE LAB | 금융소비자보호법 준수'
    }

    // ② 준법감시 문구
    const compEl = document.getElementById('compliance-text')
    if (compEl) {
      const val = get('compliance_text')
      if (val.trim()) compEl.textContent = val
    }

    // ③ 광고심의 정보
    const adEl = document.getElementById('footer-ad-review')
    if (adEl) {
      const no   = get('ad_review_no')
      const date = get('ad_review_date')
      const org  = get('ad_review_org')
      if (no || date || org) {
        adEl.textContent = `광고심의필 제${no}호 | 심의일자: ${date} | 심의기관: ${org}`
      }
    }

  } catch(e) { /* silent */ }
})()

// ── Navigation ────────────────────────────────
function startDiagnosis() {
  document.getElementById('hero').style.display = 'none'
  document.getElementById('steps-area').style.display = 'block'
  document.getElementById('progress-wrap').classList.add('show')
  goStep(1)
}

function goStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById(`step${n}`).classList.add('active')
  state.currentStep = n
  updateProgress(n)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updateProgress(n) {
  const steps = document.querySelectorAll('.progress-step')
  steps.forEach((s, i) => {
    s.classList.remove('active', 'done')
    const idx = i + 1
    if (idx < n)       s.classList.add('done')
    else if (idx === n) s.classList.add('active')
  })
  const pct = { 1: 25, 2: 50, 3: 75, 4: 100 }
  document.getElementById('progress-bar').style.width = (pct[n] || 25) + '%'
}

// ── Debt conditional toggle ───────────────────
;(function bindDebtToggle() {
  document.querySelectorAll('[name="has_debt"]').forEach(r => {
    r.addEventListener('change', () => {
      const show = document.querySelector('[name="has_debt"]:checked').value === 'yes'
      document.getElementById('debt-detail').classList.toggle('show', show)
    })
  })
})()

// ── Phone auto-hyphen ─────────────────────────
;(function bindPhone() {
  const el = document.getElementById('c_phone')
  if (!el) return
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g, '')
    if (v.length <= 3)       el.value = v
    else if (v.length <= 7)  el.value = v.slice(0,3) + '-' + v.slice(3)
    else                     el.value = v.slice(0,3) + '-' + v.slice(3,7) + '-' + v.slice(7,11)
  })
})()

// ── Score Calculation ─────────────────────────
function calcScore() {
  const income  = parseFloat(document.getElementById('monthly_income').value) || 0
  const living  = parseFloat(document.getElementById('monthly_living').value) || 0
  const saving  = parseFloat(document.getElementById('monthly_saving').value) || 0
  const asset   = parseFloat(document.getElementById('total_asset').value) || 0
  const insAmt  = parseFloat(document.getElementById('monthly_insurance').value) || 0
  const debtAmt = parseFloat(document.getElementById('monthly_debt').value) || 0

  const hasDebt    = document.querySelector('[name="has_debt"]:checked')?.value === 'yes'
  const incomeType = document.querySelector('[name="income_type"]:checked')?.value || 'fixed'
  const emergency  = document.querySelector('[name="emergency_level"]:checked')?.value || '없음'
  const socialSec  = document.querySelector('[name="social_security"]:checked')?.value || '모두'

  // Saving methods
  const savingMethods = [...document.querySelectorAll('[id^="sm_"]:checked')].map(e => e.value)
  // Insurance types
  const insuranceTypes = [...document.querySelectorAll('[id^="ins_"]:checked')].map(e => e.value)
  // Retirement plans
  const retirementPlans = [...document.querySelectorAll('[id^="rp_"]:checked')].map(e => e.value)

  const scores = {}

  // ① 소득대비 생활비 (20점)
  let s1 = 0
  if (income > 0) {
    const ratio = living / income
    if      (ratio <= 0.45) s1 = 20
    else if (ratio <= 0.55) s1 = 16
    else if (ratio <= 0.65) s1 = 12
    else if (ratio <= 0.75) s1 = 7
    else if (ratio <= 0.85) s1 = 3
    else                    s1 = 0
  }
  scores.income = { label: '소득/지출 비율', score: s1, max: 20 }

  // ② 저축률 (22점) — 가처분소득 기준
  let s2 = 0
  const disposable = income - (hasDebt ? debtAmt : 0)
  if (disposable > 0) {
    const sr = saving / disposable
    if      (sr >= 0.35) s2 = 22
    else if (sr >= 0.25) s2 = 18
    else if (sr >= 0.20) s2 = 14
    else if (sr >= 0.15) s2 = 10
    else if (sr >= 0.10) s2 = 6
    else if (sr >= 0.05) s2 = 3
    else                 s2 = 0
  }
  scores.saving = { label: '저축률', score: s2, max: 22 }

  // ③ 부채건전성 (15점)
  let s3 = 0
  if (!hasDebt || debtAmt === 0) {
    s3 = 15
  } else if (income > 0) {
    const dsr = debtAmt / income
    if      (dsr <= 0.15) s3 = 12
    else if (dsr <= 0.25) s3 = 8
    else if (dsr <= 0.35) s3 = 4
    else                  s3 = 0
  }
  scores.debt = { label: '부채건전성', score: s3, max: 15 }

  // ④ 비상금 (15점)
  const emergencyMap = { '없음': 0, '1개월미만': 4, '1~3개월': 9, '3~6개월': 13, '6개월이상': 15 }
  const s4 = emergencyMap[emergency] || 0
  scores.emergency = { label: '비상금', score: s4, max: 15 }

  // ⑤ 보험적정성 (13점) — 보험료비율 5~12%: 기본 7점 + 종류 보너스
  let s5 = 0
  if (income > 0) {
    const insRatio = insAmt / income
    if (insRatio >= 0.05 && insRatio <= 0.12) s5 = 7
    else if (insRatio > 0 && insRatio < 0.05)  s5 = 4
    else if (insRatio > 0.12)                  s5 = 4
    // Bonus: insurance types (max 6)
    const hasEssential = insuranceTypes.some(t => ['실손','암보험'].includes(t))
    const hasLife       = insuranceTypes.includes('종신')
    const hasPension    = insuranceTypes.includes('연금보험')
    let bonus = 0
    if (hasEssential) bonus += 3
    if (hasLife)      bonus += 2
    if (hasPension)   bonus += 1
    s5 = Math.min(s5 + bonus, 13)
  }
  scores.insurance = { label: '보험적정성', score: s5, max: 13 }

  // ⑥ 자산축적도 (8점) — 소득대비 자산
  let s6 = 0
  if (income > 0) {
    const months = asset / income
    if      (months >= 36) s6 = 8
    else if (months >= 24) s6 = 6
    else if (months >= 12) s6 = 4
    else if (months >= 6)  s6 = 2
  }
  scores.asset = { label: '자산축적도', score: s6, max: 8 }

  // ⑦ 분산투자 (7점) — 저축수단 수
  let s7 = 0
  const smCount = savingMethods.length
  if      (smCount >= 4) s7 = 7
  else if (smCount === 3) s7 = 6
  else if (smCount === 2) s7 = 4
  else if (smCount === 1) s7 = 2
  scores.diversify = { label: '분산투자', score: s7, max: 7 }

  // ⑧ 노후준비 (10점)
  let s8 = 0
  const rpFiltered = retirementPlans.filter(r => r !== '준비안됨')
  const rpCount    = rpFiltered.length
  if      (rpCount >= 4) s8 = 10
  else if (rpCount === 3) s8 = 8
  else if (rpCount === 2) s8 = 6
  else if (rpCount === 1) s8 = 3
  if (socialSec === '미가입') s8 = Math.max(0, s8 - 2)
  scores.retirement = { label: '노후준비', score: s8, max: 10 }

  // 소득유형 보정
  let total = Object.values(scores).reduce((a, b) => a + b.score, 0)
  if (incomeType === 'variable') total = Math.max(0, total - 2)
  if (incomeType === 'mixed')    total = Math.max(0, total - 1)
  total = Math.min(100, Math.round(total))

  // Type
  let type = ''
  if      (total >= 80) type = '안정형'
  else if (total >= 65) type = '점검필요형'
  else if (total >= 50) type = '개선필요형'
  else                  type = '상담권장형'

  return { total, type, scores, savingMethods, insuranceTypes, retirementPlans }
}

// ── Render Result ─────────────────────────────
function renderResult(result) {
  const { total, type, scores } = result

  // Ring animation
  const circumference = 2 * Math.PI * 55
  const ring = document.getElementById('ring-progress')
  ring.style.strokeDashoffset = circumference
  setTimeout(() => {
    const offset = circumference - (total / 100) * circumference
    ring.style.strokeDashoffset = offset
  }, 100)

  // Number counter
  const numEl = document.getElementById('score-num')
  let cur = 0
  const timer = setInterval(() => {
    cur = Math.min(cur + Math.ceil(total / 40), total)
    numEl.textContent = cur
    if (cur >= total) clearInterval(timer)
  }, 30)

  // Type badge
  const typeClass = { '안정형': 'stable', '점검필요형': 'check', '개선필요형': 'improve', '상담권장형': 'consult' }
  const typeIcon  = { '안정형': 'fa-shield-check', '점검필요형': 'fa-magnifying-glass-chart', '개선필요형': 'fa-triangle-exclamation', '상담권장형': 'fa-circle-exclamation' }
  const tc = typeClass[type] || 'check'
  const ti = typeIcon[type]  || 'fa-chart-simple'

  document.getElementById('result-badge').innerHTML =
    `<span class="type-badge ${tc}"><i class="fas ${ti}"></i> ${type}</span>`
  document.getElementById('result-type-name').textContent = type

  const typeDescs = {
    '안정형':    '전반적으로 재무 상태가 안정적입니다. 일부 항목을 최적화하면 더욱 탄탄한 자산을 만들 수 있습니다.',
    '점검필요형':'기본 재무 틀은 갖추어졌으나 일부 취약 부분이 있습니다. 전문가 점검으로 빠르게 개선할 수 있습니다.',
    '개선필요형':'여러 항목에서 개선이 필요합니다. 지금 바로 전략을 세우면 재무 상태를 크게 향상시킬 수 있습니다.',
    '상담권장형':'재무 구조 전반에 걸쳐 개선이 시급합니다. 전문가 상담을 통해 맞춤 솔루션을 찾아보세요.'
  }
  document.getElementById('result-type-desc').textContent = typeDescs[type] || ''

  // Bar chart
  const barArea = document.getElementById('bar-chart-area')
  barArea.innerHTML = ''
  const itemOrder = ['income','saving','debt','emergency','insurance','asset','diversify','retirement']
  itemOrder.forEach(key => {
    const item = scores[key]
    if (!item) return
    const pct = Math.round((item.score / item.max) * 100)
    const cls = pct >= 75 ? 'good' : pct >= 45 ? 'warning' : 'danger'
    const feedback = getBarFeedback(key, item.score, item.max, pct)
    barArea.insertAdjacentHTML('beforeend', `
      <div class="bar-item">
        <div class="bar-header">
          <span class="bar-label">${item.label}</span>
          <span class="bar-score">${item.score} / ${item.max}점</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${cls}" style="width:0%" data-pct="${pct}"></div>
        </div>
        <div class="bar-feedback">${feedback}</div>
      </div>
    `)
  })
  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%'
    })
  }, 200)

  // Type description box
  const typeBoxData = {
    '안정형': {
      cls: 'stable',
      icon: 'fa-shield-check',
      title: '✅ 안정형 — 재무 상태가 매우 양호합니다!',
      body: '지출 대비 저축률이 높고, 부채 관리와 보험 설계가 균형 잡혀 있습니다. 지금의 좋은 습관을 유지하면서 자산을 더욱 효율적으로 운용하는 방법을 전문가와 상의해 보세요.'
    },
    '점검필요형': {
      cls: 'check',
      icon: 'fa-magnifying-glass-chart',
      title: '🔍 점검필요형 — 몇 가지를 개선하면 훨씬 나아질 수 있습니다',
      body: '전체적인 재무 기반은 갖추어져 있지만, 일부 취약한 부분이 발견됩니다. 전문가와 함께 개선 우선순위를 정하고 체계적인 재무 계획을 세워보세요.'
    },
    '개선필요형': {
      cls: 'improve',
      icon: 'fa-triangle-exclamation',
      title: '⚠️ 개선필요형 — 지금 바로 재무 전략을 점검하세요',
      body: '현재 재무 구조에 여러 취약점이 있습니다. 저축률 개선, 부채 조정, 보험 점검 등 다양한 영역에서 개선이 필요합니다. 전문가와 함께 우선순위를 정해 단계적으로 해결해 가세요.'
    },
    '상담권장형': {
      cls: 'consult',
      icon: 'fa-circle-exclamation',
      title: '🆘 상담권장형 — 전문가 도움이 필요한 상황입니다',
      body: '재무 구조 전반에 걸쳐 개선이 시급합니다. 혼자 해결하기 어려운 복합적인 문제가 있을 수 있으니, 반드시 전문가 상담을 받아보시길 강력히 권장합니다.'
    }
  }
  const bd = typeBoxData[type] || typeBoxData['점검필요형']
  document.getElementById('type-desc-box').innerHTML = `
    <div class="type-desc-box ${bd.cls}">
      <h4><i class="fas ${bd.icon}"></i> ${bd.title}</h4>
      <p>${bd.body}</p>
    </div>
  `

  // Mini banner for step3
  document.getElementById('mini-score-num').textContent = total + '점'
  document.getElementById('mini-score-type').textContent = type
}

function getBarFeedback(key, score, max, pct) {
  const feedbacks = {
    income: {
      high:   '소득 대비 생활비 비율이 매우 양호합니다. 지출 관리가 잘 되고 있어요!',
      mid:    '생활비 비율이 다소 높습니다. 고정비 절감을 검토해 보세요.',
      low:    '소득 대비 생활비가 너무 높습니다. 지출 구조 개선이 시급합니다.'
    },
    saving: {
      high:   '저축률이 우수합니다. 자산 형성의 핵심인 저축 습관을 잘 유지하고 있어요!',
      mid:    '저축률을 조금 더 높이면 자산 형성 속도가 빨라집니다.',
      low:    '저축률이 낮습니다. 지출을 줄이고 저축 비중을 늘리는 것이 중요합니다.'
    },
    debt: {
      high:   '부채 관리가 매우 양호합니다. 소득 대비 적정 수준을 유지하고 있어요!',
      mid:    '부채 상환 부담이 다소 있습니다. 고금리 부채부터 상환 전략을 세워보세요.',
      low:    '부채 비율이 높습니다. 부채 구조 조정이 필요합니다.'
    },
    emergency: {
      high:   '비상금이 충분합니다. 예상치 못한 상황에도 안정적으로 대처할 수 있어요.',
      mid:    '비상금이 다소 부족합니다. 최소 3개월치 생활비 확보를 목표로 하세요.',
      low:    '비상금이 없거나 매우 부족합니다. 소액이라도 비상금 통장을 만들어 보세요.'
    },
    insurance: {
      high:   '보험 설계가 균형 잡혀 있습니다. 적정 수준의 보장을 유지하고 있어요.',
      mid:    '보험료 비율 또는 보장 범위를 점검해 보세요.',
      low:    '보험 설계에 개선이 필요합니다. 필수 보장(실손, 암) 확보가 중요합니다.'
    },
    asset: {
      high:   '자산 축적 수준이 우수합니다. 꾸준한 저축과 투자의 결과입니다!',
      mid:    '자산 축적을 더욱 가속화해 보세요.',
      low:    '자산 축적이 아직 초기 단계입니다. 꾸준한 저축이 중요합니다.'
    },
    diversify: {
      high:   '다양한 저축·투자 수단으로 잘 분산되어 있습니다!',
      mid:    '저축·투자 수단을 더 다양화하면 리스크를 줄일 수 있습니다.',
      low:    '저축 수단이 한 곳에 집중되어 있습니다. 분산 투자를 고려해 보세요.'
    },
    retirement: {
      high:   '노후 준비가 체계적으로 잘 되어 있습니다. 미래를 위한 훌륭한 준비!',
      mid:    '노후 준비를 조금 더 강화해 보세요.',
      low:    '노후 준비가 부족합니다. 연금 등 장기 저축 상품 가입을 검토해 보세요.'
    }
  }
  const fb = feedbacks[key] || { high: '양호', mid: '보통', low: '개선 필요' }
  if (pct >= 75) return fb.high
  if (pct >= 45) return fb.mid
  return fb.low
}

// ── Main: Calc & Show Result ──────────────────
function calcAndShowResult() {
  const income = parseFloat(document.getElementById('monthly_income').value) || 0
  const living = parseFloat(document.getElementById('monthly_living').value) || 0
  const saving = parseFloat(document.getElementById('monthly_saving').value) || 0

  if (income <= 0) return showAlert('월 소득을 입력해 주세요.')
  if (living <= 0) return showAlert('월 생활비를 입력해 주세요.')
  if (saving <= 0) return showAlert('월 저축·투자 금액을 입력해 주세요.')

  const result = calcScore()
  state.score     = result.total
  state.scoreType = result.type
  state.scores    = result.scores
  state.diagData  = result

  goStep(2)
  setTimeout(() => renderResult(result), 100)

  // go-step3 binding
  document.getElementById('go-step3').onclick = () => goStep(3)
}

// ── Submit Consultation ───────────────────────
async function submitConsultation() {
  const name    = document.getElementById('c_name').value.trim()
  const phone   = document.getElementById('c_phone').value.trim()
  const job     = document.getElementById('c_job').value
  const privacy = document.getElementById('privacy_agree').checked

  if (!name)    return showAlert('이름을 입력해 주세요.')
  if (!phone || phone.length < 10) return showAlert('연락처를 정확히 입력해 주세요.')
  if (!job)     return showAlert('직업을 선택해 주세요.')
  if (!privacy) return showAlert('개인정보 수집·이용에 동의해 주세요.')

  const income  = parseFloat(document.getElementById('monthly_income').value) || 0
  const living  = parseFloat(document.getElementById('monthly_living').value) || 0
  const saving  = parseFloat(document.getElementById('monthly_saving').value) || 0
  const asset   = parseFloat(document.getElementById('total_asset').value) || 0
  const insAmt  = parseFloat(document.getElementById('monthly_insurance').value) || 0
  const debtAmt = parseFloat(document.getElementById('monthly_debt').value) || 0

  const payload = {
    name,
    phone,
    birthdate:       document.getElementById('c_birth').value.trim(),
    job,
    monthly_income:  income,
    monthly_living:  living,
    monthly_saving:  saving,
    total_asset:     asset,
    monthly_insurance: insAmt,
    monthly_debt:    debtAmt,
    saving_method:   state.diagData?.savingMethods || [],
    insurance_types: state.diagData?.insuranceTypes || [],
    retirement_plans: state.diagData?.retirementPlans || [],
    income_type:     document.querySelector('[name="income_type"]:checked')?.value || 'fixed',
    has_debt:        document.querySelector('[name="has_debt"]:checked')?.value === 'yes',
    emergency_level: document.querySelector('[name="emergency_level"]:checked')?.value || '없음',
    social_security: document.querySelector('[name="social_security"]:checked')?.value || '모두',
    fin_goal:        document.querySelector('[name="fin_goal"]:checked')?.value || '',
    financial_score: state.score,
    score_type:      state.scoreType,
    question:        document.getElementById('c_question').value.trim(),
    preferred_time:  document.getElementById('c_time').value,
    privacy_agreed:  true,
    has_emergency_fund: ['1~3개월','3~6개월','6개월이상'].includes(
      document.querySelector('[name="emergency_level"]:checked')?.value
    ),
    has_retirement_plan: (state.diagData?.retirementPlans || []).filter(r => r !== '준비안됨').length > 0,
    status:          '신규',
    ref_staff:       state.ref_staff,
    ref_staff_name:  state.ref_staff_name
  }

  const btn = document.getElementById('submit-step3')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 신청 중...'

  try {
    const res = await fetch('/tables/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('서버 오류')

    state.submittedData = payload

    // Done page
    document.getElementById('done-name').textContent  = name
    document.getElementById('done-phone').textContent = phone
    document.getElementById('done-score').textContent = state.score + '점'
    document.getElementById('done-type').textContent  = state.scoreType
    document.getElementById('done-time').textContent  = document.getElementById('c_time').value || '언제든 가능'

    goStep(4)
  } catch(e) {
    showAlert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> 상담 신청 완료하기'
  }
}

// ── Share Link ────────────────────────────────
const BITLY_TOKEN = '4f4580c98e61892b510fd28c01c2f5e82b0e82d5'

async function copyShareLink() {
  const btn = document.querySelector('.btn-copy')
  const longUrl = `${location.origin}/?ref=${state.ref_staff}&rn=${encodeURIComponent(state.ref_staff_name)}`

  // 버튼 로딩 상태
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 링크 생성 중...' }

  try {
    // bit.ly API로 단축
    const res = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ long_url: longUrl })
    })
    const data = await res.json()
    const shortUrl = data.link || longUrl

    await navigator.clipboard.writeText(shortUrl)
    showToast('단축 링크가 복사되었습니다! 지인에게 공유해 보세요 📎')

    // 버튼에 단축 URL 표시
    if (btn) {
      btn.disabled = false
      btn.innerHTML = `<i class="fas fa-check"></i> ${shortUrl}`
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인에게 링크 공유하기'
      }, 4000)
    }
  } catch(e) {
    // 실패 시 원본 링크 복사
    try {
      await navigator.clipboard.writeText(longUrl)
      showToast('링크가 복사되었습니다! 📎')
    } catch {
      prompt('아래 링크를 복사하세요:', longUrl)
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인에게 링크 공유하기' }
  }
}

function restartDiagnosis() {
  location.href = '/'
}

// ── Helpers ───────────────────────────────────
function showAlert(msg) {
  alert(msg)
}

function showToast(msg, type = '') {
  let toast = document.getElementById('main-toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'main-toast'
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(12px);
      background:#0f172a; color:#fff; padding:12px 24px; border-radius:50px;
      font-size:.88rem; font-weight:600; z-index:9999; opacity:0;
      transition:opacity .3s, transform .3s; pointer-events:none;
      box-shadow:0 4px 16px rgba(0,0,0,.25); white-space:nowrap;
    `
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  if (type === 'error') toast.style.background = '#dc2626'
  else toast.style.background = '#0f172a'
  toast.style.opacity = '1'
  toast.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(-50%) translateY(12px)'
  }, 3000)
}
