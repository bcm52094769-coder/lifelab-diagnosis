/* ════════════════════════════════════════════
   LIFELAB — 3분 재무습관 테스트
   ════════════════════════════════════════════ */

const BITLY_TOKEN = '4f4580c98e61892b510fd28c01c2f5e82b0e82d5'

// ── State ──────────────────────────────────────
const state = {
  currentStep: 0,
  quizIndex: 0,       // 현재 퀴즈 문항 인덱스
  answers: {},        // { qIdx: answerValue }
  score: 0,
  scoreType: '',
  scores: {},
  ref_staff: 'instagram',
  ref_staff_name: '인스타광고',
  invited_by: '',     // 나를 초대한 사람 전화번호 (?invitedBy= 파라미터)
  submittedData: null,
  // 룰렛 상태
  roulette: {
    entryCount: 0,
    phone: '',
    played: false,
    result: null,
    spinning: false,
    angle: 0            // 현재 캔버스 각도 (radians)
  }
}

// ── 12문항 퀴즈 데이터 ──────────────────────────
const QUIZ = [
  {
    id: 'q1',
    category: '비상금',
    icon: 'fa-hospital-user',
    question: '갑작스러운 병원비가 생기면 준비된 비상금이 있나요?',
    hint: '비상금은 예상치 못한 지출에 대비하는 안전망입니다.',
    options: [
      { val: 'A', text: '6개월 이상 생활비 정도 준비되어 있다', score: 10 },
      { val: 'B', text: '3개월 정도는 가능하다', score: 7 },
      { val: 'C', text: '1개월 정도는 가능하다', score: 4 },
      { val: 'D', text: '거의 없다', score: 0 }
    ]
  },
  {
    id: 'q2',
    category: '저축습관',
    icon: 'fa-piggy-bank',
    question: '매달 저축이나 투자를 먼저 하고 남은 돈을 쓰고 있나요?',
    hint: '선저축 후지출 습관은 자산 형성의 핵심입니다.',
    options: [
      { val: 'A', text: '항상 먼저 저축한다', score: 10 },
      { val: 'B', text: '대체로 먼저 저축한다', score: 7 },
      { val: 'C', text: '남으면 저축한다', score: 3 },
      { val: 'D', text: '거의 못 한다', score: 0 }
    ]
  },
  {
    id: 'q3',
    category: '보험이해',
    icon: 'fa-shield-heart',
    question: '내가 가입한 보험이 어떤 상황에서 얼마가 나오는지 알고 있나요?',
    hint: '보험 내용을 모르면 정작 필요할 때 청구를 못 할 수 있습니다.',
    options: [
      { val: 'A', text: '정확히 알고 있다', score: 10 },
      { val: 'B', text: '대략 알고 있다', score: 7 },
      { val: 'C', text: '보험료만 알고 있다', score: 3 },
      { val: 'D', text: '잘 모르겠다', score: 0 }
    ]
  },
  {
    id: 'q4',
    category: '보험점검',
    icon: 'fa-magnifying-glass',
    question: '지금 가입한 보험이 최근 기준으로 되어 있는지 확인해본 적 있나요?',
    hint: '옛날 보험은 보장 범위가 좁고 요즘 기준과 다를 수 있습니다.',
    options: [
      { val: 'A', text: '최근 1년 안에 확인했다', score: 10 },
      { val: 'B', text: '2~3년 전에 확인했다', score: 6 },
      { val: 'C', text: '오래돼서 기억이 안 난다', score: 2 },
      { val: 'D', text: '한 번도 제대로 확인해본 적 없다', score: 0 }
    ]
  },
  {
    id: 'q5',
    category: '보험구분',
    icon: 'fa-sliders',
    question: '보험료가 부담될 때 줄여도 되는 보험과 줄이면 안 되는 보험을 구분할 수 있나요?',
    hint: '보험 리모델링은 불필요한 보험료를 줄이고 보장은 유지하는 방법입니다.',
    options: [
      { val: 'A', text: '구분할 수 있다', score: 10 },
      { val: 'B', text: '어느 정도는 안다', score: 7 },
      { val: 'C', text: '잘 모르겠다', score: 3 },
      { val: 'D', text: '보험료가 부담되지만 그냥 유지 중이다', score: 0 }
    ]
  },
  {
    id: 'q6',
    category: '보장구조',
    icon: 'fa-clipboard-list',
    question: '실손보험·진단비·수술비·입원비의 역할 차이를 알고 있나요?',
    hint: '보장 구조를 알아야 본인에게 맞는 보험을 가입할 수 있습니다.',
    options: [
      { val: 'A', text: '잘 알고 있다', score: 10 },
      { val: 'B', text: '어느 정도 알고 있다', score: 7 },
      { val: 'C', text: '헷갈린다', score: 3 },
      { val: 'D', text: '거의 모른다', score: 0 }
    ]
  },
  {
    id: 'q7',
    category: '노후계획',
    icon: 'fa-umbrella-beach',
    question: '노후에 매달 얼마 정도의 생활비가 필요할지 계산해본 적 있나요?',
    hint: '노후 준비는 일찍 시작할수록 훨씬 유리합니다.',
    options: [
      { val: 'A', text: '구체적으로 계산해봤다', score: 10 },
      { val: 'B', text: '대략 생각만 해봤다', score: 6 },
      { val: 'C', text: '아직 계산해본 적 없다', score: 2 },
      { val: 'D', text: '노후 준비가 막연하다', score: 0 }
    ]
  },
  {
    id: 'q8',
    category: '연금준비',
    icon: 'fa-coins',
    question: '국민연금 외에 개인적으로 준비 중인 노후자금이 있나요?',
    hint: '국민연금만으로는 노후 생활비가 부족할 수 있습니다.',
    options: [
      { val: 'A', text: '충분히 준비 중이다', score: 10 },
      { val: 'B', text: '조금 준비하고 있다', score: 6 },
      { val: 'C', text: '필요성은 알지만 못 하고 있다', score: 2 },
      { val: 'D', text: '아직 없다', score: 0 }
    ]
  },
  {
    id: 'q9',
    category: '가족보장',
    icon: 'fa-house-chimney-user',
    question: '가족에게 문제가 생겼을 때 남은 가족의 생활비를 생각해본 적 있나요?',
    hint: '소득자에게 문제가 생겼을 때를 대비하는 것이 중요합니다.',
    options: [
      { val: 'A', text: '준비되어 있다', score: 10 },
      { val: 'B', text: '어느 정도 준비되어 있다', score: 7 },
      { val: 'C', text: '생각은 해봤지만 부족한 것 같다', score: 3 },
      { val: 'D', text: '생각해본 적 없다', score: 0 }
    ]
  },
  {
    id: 'q10',
    category: '보험청구',
    icon: 'fa-file-medical',
    question: '최근 3년 안에 보험금을 청구해본 적이 있나요?',
    hint: '많은 분들이 청구 가능한 보험금을 놓치고 있습니다.',
    options: [
      { val: 'A', text: '청구했고 잘 받았다', score: 10 },
      { val: 'B', text: '청구했지만 복잡했다', score: 6 },
      { val: 'C', text: '청구할 수 있는지 몰라서 못 했다', score: 2 },
      { val: 'D', text: '병원은 갔지만 청구는 안 했다', score: 0 }
    ]
  },
  {
    id: 'q11',
    category: '담당자',
    icon: 'fa-user-tie',
    question: '병원 이용·교통사고·보험금 청구처럼 필요할 때 물어볼 담당자가 있나요?',
    hint: '가입 후에도 꾸준히 관리해주는 담당자가 있으면 훨씬 유리합니다.',
    options: [
      { val: 'A', text: '바로 연락할 담당자가 있다', score: 10 },
      { val: 'B', text: '있긴 하지만 자주 연락하진 않는다', score: 6 },
      { val: 'C', text: '누구에게 물어봐야 할지 애매하다', score: 2 },
      { val: 'D', text: '없다', score: 0 }
    ]
  },
  {
    id: 'q12',
    category: '관심분야',
    icon: 'fa-list-check',
    question: '지금 나에게 가장 필요한 점검은 무엇이라고 생각하나요?',
    hint: '가장 관심 있는 분야를 선택해 주시면 맞춤 상담을 준비합니다.',
    options: [
      { val: 'A', text: '보험 보장 점검', score: 5 },
      { val: 'B', text: '보험료 줄이기', score: 5 },
      { val: 'C', text: '노후 준비', score: 5 },
      { val: 'D', text: '저축·투자 습관', score: 5 },
      { val: 'E', text: '보험금 청구 가능 여부', score: 5 },
      { val: 'F', text: '잘 모르겠지만 한번 확인해보고 싶다', score: 5 }
    ]
  }
]

// ── URL Param 감지 ──────────────────────────────
;(function detectRef() {
  const p = new URLSearchParams(location.search)
  const ref = p.get('ref'), rn = p.get('rn')
  if (ref && rn) {
    state.ref_staff      = ref
    state.ref_staff_name = decodeURIComponent(rn)
    const banner = document.getElementById('ref-banner')
    const name   = document.getElementById('banner-name')
    banner.classList.add('show')
    name.textContent = decodeURIComponent(rn) + ' 담당자'
  }

  // 지인 초대 파라미터 (?invitedBy=전화번호)
  const invitedBy = p.get('invitedBy')
  if (invitedBy) {
    state.invited_by = invitedBy.replace(/\D/g, '')
  }
})()

// ── Footer & 상품 이미지 로드 ──────────────────
;(async function loadSettings() {
  try {
    const res  = await fetch('/tables/site_settings')
    if (!res.ok) return
    const data = await res.json()
    const get  = k => { const i = data.find(d => d.id === k || d.copyid === k); return i ? (i.value||'') : '' }

    const noticeEl = document.getElementById('footer-notice')
    if (noticeEl) {
      const v = get('footer_notice')
      noticeEl.innerHTML = v.trim() ? v.replace(/\n/g,'<br/>') : '라이프랩 LIFE LAB | 금융소비자보호법 준수'
    }
    const compEl = document.getElementById('compliance-text')
    if (compEl) { const v = get('compliance_text'); if (v.trim()) compEl.textContent = v }
    const adEl = document.getElementById('footer-ad-review')
    if (adEl) {
      const no = get('ad_review_no'), date = get('ad_review_date'), org = get('ad_review_org')
      if (no||date||org) adEl.textContent = `광고심의필 제${no}호 | 심의일자: ${date} | 심의기관: ${org}`
    }

    // 상품 이미지 로드
    const prizeUrl = get('prize_image')
    if (prizeUrl) {
      const banner = document.getElementById('prize-banner')
      const imgWrap = document.getElementById('prize-img-wrap')
      const doneBox = document.getElementById('prize-done-box')
      const doneImg = document.getElementById('prize-done-img')
      if (banner) banner.style.display = 'block'
      if (imgWrap) imgWrap.innerHTML = `<img src="${prizeUrl}" alt="추첨상품" class="prize-img" />`
      if (doneBox) doneBox.style.display = 'flex'
      if (doneImg) doneImg.innerHTML = `<img src="${prizeUrl}" alt="추첨상품" class="prize-done-img-item" />`
    }
  } catch(e) {}
})()

// ── Progress ────────────────────────────────────
function updateProgress(n) {
  document.querySelectorAll('.progress-step').forEach((s,i) => {
    s.classList.remove('active','done')
    const idx = i+1
    if (idx < n) s.classList.add('done')
    else if (idx === n) s.classList.add('active')
  })
  const pct = {1:25,2:50,3:75,4:100}
  document.getElementById('progress-bar').style.width = (pct[n]||25)+'%'
}

function goStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'))
  document.getElementById(`step${n}`).classList.add('active')
  state.currentStep = n
  updateProgress(n)
  window.scrollTo({ top:0, behavior:'smooth' })
}

// ── 퀴즈 시작 ───────────────────────────────────
function startQuiz() {
  document.getElementById('hero').style.display = 'none'
  document.getElementById('steps-area').style.display = 'block'
  document.getElementById('progress-wrap').classList.add('show')
  state.quizIndex = 0
  state.answers   = {}
  renderQuizCard(0)
  goStep(1)
}

// ── 퀴즈 카드 렌더링 ────────────────────────────
function renderQuizCard(idx) {
  const q   = QUIZ[idx]
  const total = QUIZ.length
  const saved = state.answers[idx]

  // 상단 진행도
  document.getElementById('quiz-current').textContent = idx + 1
  document.getElementById('quiz-total').textContent   = total
  document.getElementById('quiz-bar').style.width     = ((idx + 1) / total * 100) + '%'

  // 이전/다음/제출 버튼
  document.getElementById('quiz-prev').style.display   = idx === 0 ? 'none' : 'flex'
  document.getElementById('quiz-next').style.display   = idx < total - 1 ? 'flex' : 'none'
  document.getElementById('quiz-submit').style.display = idx === total - 1 ? 'flex' : 'none'

  // 카드 HTML
  const optHtml = q.options.map(o => `
    <label class="quiz-option ${saved === o.val ? 'selected' : ''}" data-val="${o.val}" onclick="selectAnswer(${idx}, '${o.val}', this)">
      <span class="quiz-opt-key">${o.val}</span>
      <span class="quiz-opt-text">${o.text}</span>
      <i class="fas fa-check quiz-opt-check"></i>
    </label>
  `).join('')

  document.getElementById('quiz-container').innerHTML = `
    <div class="quiz-card fade-in">
      <div class="quiz-category">
        <i class="fas ${q.icon}"></i> ${q.category}
        <span class="quiz-q-num">${idx+1}/${total}</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-hint"><i class="fas fa-lightbulb"></i> ${q.hint}</div>
      <div class="quiz-options">${optHtml}</div>
    </div>
  `
}

// ── 답변 선택 ───────────────────────────────────
function selectAnswer(idx, val, el) {
  state.answers[idx] = val
  el.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'))
  el.classList.add('selected')

  // 마지막 문항 아니면 0.4초 후 자동 다음으로
  if (idx < QUIZ.length - 1) {
    setTimeout(() => quizNext(), 400)
  }
}

// ── 이전/다음 ────────────────────────────────────
function quizPrev() {
  if (state.quizIndex > 0) {
    state.quizIndex--
    renderQuizCard(state.quizIndex)
  }
}

function quizNext() {
  if (state.answers[state.quizIndex] === undefined) {
    showToast('답변을 선택해 주세요! 😊', 'warn')
    document.getElementById('quiz-container').querySelector('.quiz-card').classList.add('shake')
    setTimeout(() => document.getElementById('quiz-container').querySelector('.quiz-card')?.classList.remove('shake'), 500)
    return
  }
  if (state.quizIndex < QUIZ.length - 1) {
    state.quizIndex++
    renderQuizCard(state.quizIndex)
  }
}

// ── 점수 계산 ─────────────────────────────────────
function calcScore() {
  // 문항별 점수 합산
  let totalRaw = 0
  const catScores = {}

  QUIZ.forEach((q, idx) => {
    const ans = state.answers[idx]
    if (!ans) return
    const opt = q.options.find(o => o.val === ans)
    if (!opt) return
    totalRaw += opt.score
    if (!catScores[q.category]) catScores[q.category] = { label: q.category, score: 0, max: 0 }
    catScores[q.category].score += opt.score
    catScores[q.category].max   += 10  // q12는 최대 5이지만 통일감을 위해 10 기준
  })

  // 100점 환산 (최대 115점 → 100으로 환산)
  const maxPossible = QUIZ.reduce((a, q) => a + Math.max(...q.options.map(o => o.score)), 0)
  const total = Math.min(100, Math.round((totalRaw / maxPossible) * 100))

  // 영역별 묶기 (바 차트용)
  const areaScores = {
    emergency:  { label: '비상금 준비', key: 'q1' },
    saving:     { label: '저축 습관',   key: 'q2' },
    insurance:  { label: '보험 이해도', key: 'q3,q4,q5,q6' },
    retirement: { label: '노후 준비',   key: 'q7,q8' },
    family:     { label: '가족 보장',   key: 'q9' },
    claim:      { label: '보험금 청구', key: 'q10' },
    manager:    { label: '전담 관리자', key: 'q11' },
    interest:   { label: '관심 분야',   key: 'q12' }
  }

  const bars = []
  // 비상금
  bars.push({ label:'비상금 준비',  score: getQScore(0), max:10 })
  // 저축
  bars.push({ label:'저축 습관',    score: getQScore(1), max:10 })
  // 보험 이해도 (q3~q6 평균 → /4 → *10)
  const insRaw = [2,3,4,5].reduce((a,i) => a + getQScore(i), 0)
  bars.push({ label:'보험 이해도',  score: Math.round(insRaw/4), max:10 })
  // 노후 준비 (q7,q8 평균)
  const retRaw = [6,7].reduce((a,i) => a + getQScore(i), 0)
  bars.push({ label:'노후 준비',    score: Math.round(retRaw/2), max:10 })
  // 가족 보장
  bars.push({ label:'가족 보장',    score: getQScore(8), max:10 })
  // 보험금 청구
  bars.push({ label:'보험금 청구',  score: getQScore(9), max:10 })
  // 전담 관리자
  bars.push({ label:'전담 관리자',  score: getQScore(10), max:10 })

  // 유형 판정
  let type = ''
  if      (total >= 80) type = '안정관리형'
  else if (total >= 60) type = '점검필요형'
  else if (total >= 40) type = '리스크주의형'
  else                  type = '상담추천형'

  // q12 답변 저장
  const q12Ans = QUIZ[11].options.find(o => o.val === state.answers[11])
  const interest = q12Ans ? q12Ans.text : ''

  return { total, type, bars, interest }
}

function getQScore(idx) {
  const ans = state.answers[idx]
  if (!ans) return 0
  const opt = QUIZ[idx].options.find(o => o.val === ans)
  return opt ? Math.min(opt.score, 10) : 0
}

// ── 결과 렌더링 ───────────────────────────────────
function renderResult(result) {
  const { total, type, bars } = result
  const circumference = 2 * Math.PI * 55

  // 링 애니메이션
  const ring = document.getElementById('ring-progress')
  ring.style.strokeDashoffset = circumference
  setTimeout(() => {
    ring.style.strokeDashoffset = circumference - (total / 100) * circumference
  }, 100)

  // 숫자 카운터
  const numEl = document.getElementById('score-num')
  let cur = 0
  const timer = setInterval(() => {
    cur = Math.min(cur + Math.ceil(total / 40), total)
    numEl.textContent = cur
    if (cur >= total) clearInterval(timer)
  }, 30)

  // 유형 배지
  const typeMap = {
    '안정관리형': { cls:'stable',  icon:'fa-shield-check',          color:'#16a34a' },
    '점검필요형': { cls:'check',   icon:'fa-magnifying-glass-chart', color:'#2563eb' },
    '리스크주의형':{ cls:'improve', icon:'fa-triangle-exclamation',   color:'#d97706' },
    '상담추천형': { cls:'consult', icon:'fa-circle-exclamation',     color:'#dc2626' }
  }
  const tm = typeMap[type] || typeMap['점검필요형']
  document.getElementById('result-badge').innerHTML =
    `<span class="type-badge ${tm.cls}"><i class="fas ${tm.icon}"></i> ${type}</span>`
  document.getElementById('result-type-name').textContent = type

  const typeDescs = {
    '안정관리형': '현재 기본적인 재무습관은 잘 잡혀 있습니다. 다만 보험, 노후자금, 병원비 대비는 시간이 지나면서 기준이 달라질 수 있어 정기적인 확인이 필요합니다.',
    '점검필요형': '현재 돈 관리는 어느 정도 하고 있지만, 내가 가입한 보험의 보장 내용이나 노후 준비 수준은 명확하지 않을 수 있습니다. 오래전 가입 보험이 있다면 현재 기준과 비교해볼 필요가 있습니다.',
    '리스크주의형': '갑작스러운 병원비, 소득중단, 노후생활비에 대한 준비가 부족할 수 있습니다. 지금 당장 가입을 늘리기보다, 먼저 현재 상황을 정확히 확인하는 것이 중요합니다.',
    '상담추천형': '보험료는 내고 있지만 어떤 보장을 받고 있는지 모르거나, 노후 준비가 막연하다면 전문가와 함께 한 번 정리해보는 것이 좋습니다. 간단한 점검만으로도 불필요한 보험료와 부족한 보장을 확인할 수 있습니다.'
  }
  document.getElementById('result-type-desc').textContent = typeDescs[type] || ''

  // 바 차트
  const barArea = document.getElementById('bar-chart-area')
  barArea.innerHTML = ''
  bars.forEach(item => {
    const pct = Math.round((item.score / item.max) * 100)
    const cls = pct >= 75 ? 'good' : pct >= 45 ? 'warning' : 'danger'
    barArea.insertAdjacentHTML('beforeend', `
      <div class="bar-item">
        <div class="bar-header">
          <span class="bar-label">${item.label}</span>
          <span class="bar-score">${item.score} / ${item.max}점</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${cls}" style="width:0%" data-pct="${pct}"></div>
        </div>
      </div>
    `)
  })
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(b => { b.style.width = b.dataset.pct + '%' })
  }, 200)

  // 유형 설명 박스
  const typeBoxData = {
    '안정관리형': {
      cls:'stable', icon:'fa-shield-check',
      title:'✅ 안정관리형 — 기본 재무습관이 잘 잡혀 있습니다!',
      body:'비상금, 저축, 보험에 대한 기본 이해와 준비가 되어 있습니다. 다만 보험 내용이 최신 기준인지, 노후 준비가 충분한지 전문가와 함께 점검해보면 더욱 탄탄한 재무 기반을 만들 수 있습니다.'
    },
    '점검필요형': {
      cls:'check', icon:'fa-magnifying-glass-chart',
      title:'🔍 점검필요형 — 몇 가지 놓치고 있는 부분이 있습니다',
      body:'전체적인 재무 기반은 갖추어져 있지만, 보험 내용 파악이나 노후 준비 측면에서 개선할 부분이 보입니다. 전문가와 함께 현재 상태를 점검하고 개선 방향을 찾아보세요.'
    },
    '리스크주의형': {
      cls:'improve', icon:'fa-triangle-exclamation',
      title:'⚠️ 리스크주의형 — 몇 가지 위험 요소가 있습니다',
      body:'비상금, 보험 보장, 노후 준비 중 취약한 부분이 있습니다. 지금 당장 큰 변화보다는 현재 상황을 정확히 파악하는 것부터 시작하세요. 전문가와의 무료 상담이 큰 도움이 될 수 있습니다.'
    },
    '상담추천형': {
      cls:'consult', icon:'fa-circle-exclamation',
      title:'💬 상담추천형 — 전문가 점검이 필요합니다',
      body:'보험료는 내고 있지만 내용을 잘 모르거나, 노후 준비가 막연한 상태입니다. 간단한 전문가 상담만으로도 불필요한 보험료를 줄이고 부족한 보장을 보완할 수 있습니다. 무료 상담을 꼭 받아보세요.'
    }
  }
  const bd = typeBoxData[type] || typeBoxData['점검필요형']
  document.getElementById('type-desc-box').innerHTML = `
    <div class="type-desc-box ${bd.cls}">
      <h4><i class="fas ${bd.icon}"></i> ${bd.title}</h4>
      <p>${bd.body}</p>
    </div>
  `

  // 미니배너
  document.getElementById('mini-score-num').textContent  = total + '점'
  document.getElementById('mini-score-type').textContent = type
}

// ── 결과 계산 & 이동 ─────────────────────────────
function calcAndShowResult() {
  // 미답변 체크
  const unanswered = QUIZ.findIndex((_, idx) => state.answers[idx] === undefined)
  if (unanswered !== -1) {
    showToast('모든 문항에 답변해 주세요!', 'warn')
    state.quizIndex = unanswered
    renderQuizCard(unanswered)
    return
  }

  const result     = calcScore()
  state.score      = result.total
  state.scoreType  = result.type
  state.interest   = result.interest

  goStep(2)
  setTimeout(() => renderResult(result), 100)
  document.getElementById('go-step3').onclick = () => goStep(3)
}

// ── 상담 신청 제출 ────────────────────────────────
async function submitConsultation() {
  const name    = document.getElementById('c_name').value.trim()
  const phone   = document.getElementById('c_phone').value.trim()
  const job     = document.getElementById('c_job').value
  const privacy = document.getElementById('privacy_agree').checked

  if (!name)                        return showAlert('이름을 입력해 주세요.')
  if (!phone || phone.length < 10)  return showAlert('연락처를 정확히 입력해 주세요.')
  if (!job)                         return showAlert('직업을 선택해 주세요.')
  if (!privacy)                     return showAlert('개인정보 수집·이용에 동의해 주세요.')

  // 퀴즈 답변 요약 저장
  const quizSummary = QUIZ.map((q,i) => {
    const ans = state.answers[i]
    const opt = q.options.find(o => o.val === ans)
    return `[${q.category}] ${opt ? opt.text : '미답변'}`
  }).join(' | ')

  const payload = {
    name,
    phone,
    birthdate:        document.getElementById('c_birth').value.trim(),
    job,
    financial_score:  state.score,
    score_type:       state.scoreType,
    question:         document.getElementById('c_question').value.trim() || `관심분야: ${state.interest}`,
    preferred_time:   document.getElementById('c_time').value,
    privacy_agreed:   true,
    status:           '신규',
    ref_staff:        state.ref_staff,
    ref_staff_name:   state.ref_staff_name,
    // 퀴즈 원본 데이터
    monthly_income:   0,
    monthly_living:   0,
    monthly_saving:   0,
    total_asset:      0,
    monthly_insurance:0,
    monthly_debt:     0,
    saving_method:    [state.interest || ''],
    insurance_types:  [],
    retirement_plans: [],
    income_type:      'quiz',
    has_debt:         false,
    emergency_level:  QUIZ[0].options.find(o => o.val === state.answers[0])?.text || '',
    social_security:  '',
    fin_goal:         state.interest || '',
    has_emergency_fund: (state.answers[0] === 'A' || state.answers[0] === 'B'),
    has_retirement_plan:(state.answers[6] === 'A' || state.answers[6] === 'B'),
    memo:             quizSummary.slice(0, 500)
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
    const resData = await res.json()
    const consultId = resData.id || 0

    document.getElementById('done-name').textContent  = name
    document.getElementById('done-phone').textContent = phone
    document.getElementById('done-score').textContent = state.score + '점'
    document.getElementById('done-type').textContent  = state.scoreType
    document.getElementById('done-time').textContent  = document.getElementById('c_time').value || '언제든 가능'

    goStep(4)

    // ── 응모권 생성 & 룰렛 모달 열기 ──────────────────
    try {
      await createEntry(name, phone, consultId)
    } catch(e) {
      // 응모권 생성 실패해도 상담 완료는 유지
      console.error('응모권 생성 오류:', e)
    }
  } catch(e) {
    showAlert('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> 상담 신청 완료하기'
  }
}

// ════════════════════════════════════════════════════
//  ROULETTE & ENTRY SYSTEM
// ════════════════════════════════════════════════════

// ── 룰렛 상품 정의 (캔버스 렌더링용) ─────────────────
const ROULETTE_SEGMENTS = [
  { id: '10만원',   label: '10만원',   color: '#f59e0b', emoji: '🏆' },
  { id: '꽝',       label: '꽝',       color: '#94a3b8', emoji: '😅' },
  { id: '스타벅스', label: '스타벅스', color: '#16a34a', emoji: '☕' },
  { id: '치킨',     label: '치킨',     color: '#ea580c', emoji: '🍗' },
  { id: '5만원',    label: '5만원',    color: '#2563eb', emoji: '💙' },
  { id: '꽝',       label: '꽝',       color: '#64748b', emoji: '😅' },
  { id: '스타벅스', label: '스타벅스', color: '#15803d', emoji: '☕' },
  { id: '치킨',     label: '치킨',     color: '#c2410c', emoji: '🍗' },
]

// ── 응모권 생성 API 호출 ─────────────────────────────
async function createEntry(name, phone, consultId) {
  const cleanPhone = phone.replace(/\D/g, '')
  const payload = {
    name,
    phone:          cleanPhone,
    consult_id:     consultId,
    ref_staff:      state.ref_staff,
    ref_staff_name: state.ref_staff_name,
    invited_by:     state.invited_by
  }

  const res   = await fetch('/api/entry', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  const data  = await res.json()

  // 응모권 상태 저장
  state.roulette.phone      = cleanPhone
  state.roulette.entryCount = data.entry_count || 1
  state.roulette.played     = data.duplicate || false // 중복이면 이미 플레이한 것으로 처리

  // 2초 후 룰렛 모달 열기 (완료 화면 먼저 보여주기)
  setTimeout(() => openRouletteModal(), 1800)
}

// ── 룰렛 모달 열기 ───────────────────────────────────
function openRouletteModal() {
  const overlay = document.getElementById('roulette-overlay')
  overlay.style.display = 'flex'

  // 응모권 수 표시
  document.getElementById('my-entry-count').textContent = state.roulette.entryCount
  document.getElementById('invite-entry-display').textContent = state.roulette.entryCount

  // 결과 화면 숨기고 룰렛 화면 보이기
  document.getElementById('roulette-result-wrap').style.display = 'none'
  document.getElementById('roulette-wheel-wrap').style.display  = 'flex'
  document.getElementById('prize-list-mini').style.display      = 'grid'
  document.getElementById('entry-status-box').style.display     = 'flex'

  // 닫기 버튼 처음엔 숨김
  document.getElementById('roulette-close-btn').style.display = 'none'

  // 룰렛 바퀴 그리기
  drawRouletteWheel(state.roulette.angle)

  // 스핀 버튼 상태
  const spinBtn = document.getElementById('roulette-spin-btn')
  if (state.roulette.played) {
    spinBtn.disabled = true
    spinBtn.innerHTML = '<i class="fas fa-check"></i><br/><span>완료</span>'
  } else {
    spinBtn.disabled = false
    spinBtn.innerHTML = '<i class="fas fa-play"></i><br/><span>돌리기</span>'
  }
}

// ── 룰렛 모달 닫기 ───────────────────────────────────
function closeRoulette() {
  const overlay = document.getElementById('roulette-overlay')
  overlay.style.display = 'none'
}

// ── 캔버스 룰렛 그리기 ───────────────────────────────
function drawRouletteWheel(rotationAngle = 0) {
  const canvas = document.getElementById('roulette-canvas')
  if (!canvas) return
  const ctx    = canvas.getContext('2d')
  const n      = ROULETTE_SEGMENTS.length
  const arc    = (2 * Math.PI) / n
  const cx     = canvas.width  / 2
  const cy     = canvas.height / 2
  const r      = cx - 4

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ROULETTE_SEGMENTS.forEach((seg, i) => {
    const start = rotationAngle + i * arc - Math.PI / 2
    const end   = start + arc

    // 파이 조각
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, end)
    ctx.closePath()
    ctx.fillStyle   = seg.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth   = 2
    ctx.stroke()

    // 텍스트
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(start + arc / 2)
    ctx.textAlign    = 'right'
    ctx.fillStyle    = '#fff'
    ctx.font         = `bold ${canvas.width > 240 ? 13 : 11}px Noto Sans KR, sans-serif`
    ctx.shadowColor  = 'rgba(0,0,0,.4)'
    ctx.shadowBlur   = 3
    ctx.fillText(seg.emoji + ' ' + seg.label, r - 10, 5)
    ctx.restore()
  })

  // 중앙 원
  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
  ctx.fillStyle   = '#fff'
  ctx.fill()
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth   = 3
  ctx.stroke()
}

// ── 룰렛 스핀 ────────────────────────────────────────
async function spinRoulette() {
  if (state.roulette.spinning) return
  if (state.roulette.played)   return

  const phone   = state.roulette.phone
  if (!phone)   return

  const spinBtn = document.getElementById('roulette-spin-btn')
  const canvas  = document.getElementById('roulette-canvas')
  spinBtn.disabled = true
  spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  state.roulette.spinning = true
  canvas.classList.add('spinning')

  try {
    // 1. 서버에서 결과 결정
    const res    = await fetch(`/api/roulette/${phone}`, { method: 'POST' })
    const data   = await res.json()

    if (!res.ok) {
      // 이미 했거나 오류
      showToast(data.error || '오류가 발생했습니다.', 'warn')
      spinBtn.disabled = false
      spinBtn.innerHTML = '<i class="fas fa-play"></i><br/><span>돌리기</span>'
      state.roulette.spinning = false
      canvas.classList.remove('spinning')
      return
    }

    const resultId = data.result  // '꽝', '스타벅스', '치킨', '5만원', '10만원'
    const label    = data.label

    // 2. 결과 세그먼트 찾기 (일치하는 첫 번째)
    const segIdx = ROULETTE_SEGMENTS.findIndex(s => s.id === resultId)
    const targetSeg = segIdx >= 0 ? segIdx : 0

    // 3. 목표 각도 계산
    //    세그먼트 중앙이 상단(바늘 위치)에 오도록
    const n           = ROULETTE_SEGMENTS.length
    const arc         = (2 * Math.PI) / n
    // 세그먼트 중앙 각도: 0기준에서 세그먼트가 위치한 각도 (top = -π/2 기준)
    const segCenter   = targetSeg * arc + arc / 2
    // 현재 각도에서 목표 각도까지: 최소 5바퀴 + 타겟
    const spins       = 5 * 2 * Math.PI
    const targetAngle = spins + (2 * Math.PI - segCenter)

    // 4. 애니메이션
    const duration = 4200 // ms
    const startTime = performance.now()
    const startAngle = state.roulette.angle

    function animate(now) {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = startAngle + targetAngle * ease

      state.roulette.angle = current
      drawRouletteWheel(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // 애니메이션 완료
        canvas.classList.remove('spinning')
        state.roulette.spinning = false
        state.roulette.played   = true
        state.roulette.result   = resultId
        showRouletteResult(resultId, label)
      }
    }
    requestAnimationFrame(animate)

  } catch(e) {
    showToast('오류가 발생했습니다. 다시 시도해 주세요.', 'error')
    spinBtn.disabled = false
    spinBtn.innerHTML = '<i class="fas fa-play"></i><br/><span>돌리기</span>'
    state.roulette.spinning = false
    canvas.classList.remove('spinning')
  }
}

// ── 룰렛 결과 표시 ───────────────────────────────────
function showRouletteResult(resultId, label) {
  const isWin = resultId !== '꽝'

  // 바퀴 & 상품목록 숨기기
  document.getElementById('roulette-wheel-wrap').style.display = 'none'
  document.getElementById('prize-list-mini').style.display     = 'none'
  document.getElementById('entry-status-box').style.display    = 'none'

  // 결과 표시
  const resultWrap  = document.getElementById('roulette-result-wrap')
  const iconEl      = document.getElementById('roulette-result-icon')
  const labelEl     = document.getElementById('roulette-result-label')
  const msgEl       = document.getElementById('roulette-result-msg')

  const resultMap = {
    '10만원':   { icon: '🏆', msg: '상담 신청 시 응모권이 등록되었습니다.\n7월 31일 당첨 여부를 문자로 알려드립니다.' },
    '5만원':    { icon: '🎉', msg: '상담 신청 시 응모권이 등록되었습니다.\n7월 31일 당첨 여부를 문자로 알려드립니다.' },
    '치킨':     { icon: '🍗', msg: '상담 신청 시 응모권이 등록되었습니다.\n7월 31일 당첨 여부를 문자로 알려드립니다.' },
    '스타벅스': { icon: '☕', msg: '상담 신청 시 응모권이 등록되었습니다.\n7월 31일 당첨 여부를 문자로 알려드립니다.' },
    '꽝':       { icon: '😅', msg: '아쉽지만 이번엔 꽝이에요.\n하지만 지인 초대로 추가 응모권을 받으세요!' }
  }

  const rm = resultMap[resultId] || resultMap['꽝']
  iconEl.textContent  = rm.icon
  labelEl.textContent = isWin ? `🎊 ${label} 응모권 등록!` : '아쉽게도 꽝!'
  labelEl.className   = `roulette-result-label ${isWin ? 'won' : 'lost'}`
  msgEl.textContent   = rm.msg

  // 응모권 수 업데이트
  document.getElementById('invite-entry-display').textContent = state.roulette.entryCount

  resultWrap.style.display = 'block'

  // 닫기 버튼 표시
  document.getElementById('roulette-close-btn').style.display = 'flex'
}

// ── 지인 초대 링크 복사 ───────────────────────────────
async function copyInviteLink() {
  const phone = state.roulette.phone || document.getElementById('c_phone')?.value?.replace(/\D/g, '') || ''
  const base  = `${location.origin}/?ref=${state.ref_staff}&rn=${encodeURIComponent(state.ref_staff_name)}&invitedBy=${phone}`
  const btn   = document.querySelector('.invite-share-btn')

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 링크 생성 중...' }

  try {
    const res  = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${BITLY_TOKEN}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ long_url: base })
    })
    const data = await res.json()
    const url  = data.link || base
    await navigator.clipboard.writeText(url)
    showToast('초대 링크가 복사되었습니다! 지인에게 공유해 보세요 📎')
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fas fa-check"></i> ${url}` }
    setTimeout(() => { if (btn) btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인 초대 링크 복사' }, 4000)
  } catch {
    try { await navigator.clipboard.writeText(base); showToast('초대 링크 복사 완료!') }
    catch { prompt('아래 링크를 복사하세요:', base) }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인 초대 링크 복사' }
  }
}

// ── 공유 링크 (bit.ly 단축) ───────────────────────
async function copyShareLink() {
  const btn     = document.querySelector('.btn-copy')
  const longUrl = `${location.origin}/?ref=${state.ref_staff}&rn=${encodeURIComponent(state.ref_staff_name)}`

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 링크 생성 중...' }

  try {
    const res  = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BITLY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ long_url: longUrl })
    })
    const data = await res.json()
    const shortUrl = data.link || longUrl
    await navigator.clipboard.writeText(shortUrl)
    showToast('단축 링크가 복사되었습니다! 지인에게 공유해 보세요 📎')
    if (btn) {
      btn.disabled = false
      btn.innerHTML = `<i class="fas fa-check"></i> ${shortUrl}`
      setTimeout(() => { btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인에게 링크 공유하기' }, 4000)
    }
  } catch(e) {
    try { await navigator.clipboard.writeText(longUrl); showToast('링크가 복사되었습니다! 📎') }
    catch { prompt('아래 링크를 복사하세요:', longUrl) }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-share-nodes"></i> 지인에게 링크 공유하기' }
  }
}

function restartDiagnosis() { location.href = '/' }

// ── 폰 자동 하이픈 ───────────────────────────────
;(function bindPhone() {
  const el = document.getElementById('c_phone')
  if (!el) return
  el.addEventListener('input', () => {
    let v = el.value.replace(/\D/g,'')
    if (v.length <= 3)      el.value = v
    else if (v.length <= 7) el.value = v.slice(0,3)+'-'+v.slice(3)
    else                    el.value = v.slice(0,3)+'-'+v.slice(3,7)+'-'+v.slice(7,11)
  })
})()

// ── Toast / Alert ─────────────────────────────────
function showAlert(msg) { alert(msg) }

function showToast(msg, type='') {
  let t = document.getElementById('main-toast')
  if (!t) {
    t = document.createElement('div'); t.id = 'main-toast'
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(12px);background:#0f172a;color:#fff;padding:12px 24px;border-radius:50px;font-size:.88rem;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s,transform .3s;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap;'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.style.background = type==='error' ? '#dc2626' : type==='warn' ? '#d97706' : '#0f172a'
  t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'
  setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(12px)' }, 3000)
}
