/* ═══════════════════════════════════════════════
   LIFELAB 관리자 — Admin Logic
   ═══════════════════════════════════════════════ */

const BITLY_TOKEN = '4f4580c98e61892b510fd28c01c2f5e82b0e82d5'
const ADMIN_ID    = 'lifelab'
const ADMIN_PW    = 'lifelab1234!'

let allConsultations = []
let allStaff         = []
let currentSrc       = 'all'
let selectedRow      = null

// ── Login ──────────────────────────────────────
function doLogin() {
  const id  = document.getElementById('login-id').value.trim()
  const pw  = document.getElementById('login-pw').value
  const err = document.getElementById('login-error')

  if (id === ADMIN_ID && pw === ADMIN_PW) {
    document.getElementById('login-page').style.display = 'none'
    document.getElementById('app-page').classList.add('show')
    sessionStorage.setItem('ll_admin', '1')
    loadAll()
  } else {
    err.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.'
  }
}

function doLogout() {
  sessionStorage.removeItem('ll_admin')
  location.reload()
}

// Auto-login if session exists
;(function checkSession() {
  if (sessionStorage.getItem('ll_admin') === '1') {
    document.getElementById('login-page').style.display = 'none'
    document.getElementById('app-page').classList.add('show')
    loadAll()
  }
})()

// ── Tab Switch ─────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'))
  document.getElementById(`tab-${name}`).classList.add('active')

  const titles = { consultations: '상담 신청 목록', staff: '담당자 관리', settings: '사이트 설정' }
  document.getElementById('top-bar-title').textContent = titles[name] || ''

  const items = document.querySelectorAll('.menu-item')
  const idx   = { consultations: 0, staff: 1, settings: 2 }
  if (items[idx[name]]) items[idx[name]].classList.add('active')

  if (name === 'staff')    loadStaff()
  if (name === 'settings') loadSettings()
}

// ── Load All ───────────────────────────────────
async function loadAll() {
  await Promise.all([loadConsultations(), loadStaff()])
}

// ── Consultations ──────────────────────────────
async function loadConsultations() {
  try {
    const res  = await fetch('/tables/consultations')
    allConsultations = await res.json()
    buildSourceTabs()
    updateStats()
    renderTable()
  } catch(e) {
    showToast('데이터 로드 실패', 'error')
  }
}

function buildSourceTabs() {
  const container = document.getElementById('source-tabs')
  // Collect unique staff names
  const staffMap = {}
  allConsultations.forEach(c => {
    if (c.ref_staff && c.ref_staff !== 'instagram') {
      staffMap[c.ref_staff] = c.ref_staff_name || c.ref_staff
    }
  })

  // Keep first two (all + instagram), remove extra staff tabs
  const existing = [...container.querySelectorAll('.source-tab')]
  existing.forEach((t, i) => { if (i >= 2) t.remove() })

  Object.entries(staffMap).forEach(([id, name]) => {
    if (!container.querySelector(`[data-src="${id}"]`)) {
      const btn = document.createElement('button')
      btn.className   = 'source-tab'
      btn.dataset.src = id
      btn.textContent = `👤 ${name}`
      btn.onclick = () => filterBySource(id, btn)
      container.appendChild(btn)
    }
  })
}

function filterBySource(src, el) {
  currentSrc = src
  document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
  renderTable()
}

function updateStats() {
  document.getElementById('stat-total').textContent       = allConsultations.length
  document.getElementById('stat-new').textContent         = allConsultations.filter(c => c.status === '신규').length
  document.getElementById('stat-done').textContent        = allConsultations.filter(c => c.status === '상담완료').length
  document.getElementById('stat-contracted').textContent  = allConsultations.filter(c => c.status === '계약완료').length
}

function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase()
  const status = document.getElementById('status-filter').value

  let data = allConsultations.filter(c => {
    if (currentSrc === 'instagram' && c.ref_staff !== 'instagram') return false
    if (currentSrc !== 'all' && currentSrc !== 'instagram' && c.ref_staff !== currentSrc) return false
    if (status && c.status !== status) return false
    if (search) {
      const haystack = `${c.name} ${c.phone} ${c.job}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })

  const tbody = document.getElementById('consultation-tbody')
  tbody.innerHTML = ''

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--gray-400)">데이터가 없습니다</td></tr>`
    return
  }

  data.forEach(c => {
    const tc = typeClass(c.score_type)
    const sc = statusClass(c.status)
    const dt = c.apply_date ? new Date(c.apply_date).toLocaleDateString('ko-KR', {
      year: '2-digit', month: '2-digit', day: '2-digit'
    }) : '—'

    tbody.insertAdjacentHTML('beforeend', `
      <tr onclick="openDetail(${c.id})">
        <td>${dt}</td>
        <td><strong>${esc(c.name)}</strong></td>
        <td>${esc(c.phone)}</td>
        <td>${esc(c.job)}</td>
        <td><strong>${c.financial_score || 0}점</strong></td>
        <td><span class="type-chip ${tc}">${esc(c.score_type)}</span></td>
        <td style="font-size:.78rem">${esc(c.preferred_time) || '—'}</td>
        <td style="font-size:.78rem">${esc(c.ref_staff_name) || esc(c.ref_staff)}</td>
        <td><span class="status-badge ${sc}">${esc(c.status)}</span></td>
        <td style="font-size:.8rem">${esc(c.assignee) || '—'}</td>
        <td onclick="event.stopPropagation()">
          <button class="tbl-btn edit" onclick="openDetail(${c.id})">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `)
  })
}

// ── Detail Modal ───────────────────────────────
function openDetail(id) {
  const c = allConsultations.find(x => x.id === id)
  if (!c) return
  selectedRow = c

  // Parse JSON arrays
  const savingMethod   = safeJSON(c.saving_method, []).join(', ') || '—'
  const insuranceTypes = safeJSON(c.insurance_types, []).join(', ') || '—'
  const retirementPlans= safeJSON(c.retirement_plans, []).join(', ') || '—'
  const dt = c.apply_date ? new Date(c.apply_date).toLocaleString('ko-KR') : '—'

  document.getElementById('detail-modal-body').innerHTML = `
    <div class="detail-section">
      <div class="detail-section-title">기본 정보</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="d-label">이름</div><div class="d-value">${esc(c.name)}</div></div>
        <div class="detail-item"><div class="d-label">연락처</div><div class="d-value">${esc(c.phone)}</div></div>
        <div class="detail-item"><div class="d-label">생년월일</div><div class="d-value">${esc(c.birthdate) || '—'}</div></div>
        <div class="detail-item"><div class="d-label">직업</div><div class="d-value">${esc(c.job)}</div></div>
        <div class="detail-item"><div class="d-label">신청일시</div><div class="d-value">${dt}</div></div>
        <div class="detail-item"><div class="d-label">유입경로</div><div class="d-value">${esc(c.ref_staff_name) || esc(c.ref_staff)}</div></div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">진단 데이터</div>
      <div class="detail-grid">
        <div class="detail-item"><div class="d-label">재무점수</div><div class="d-value" style="color:var(--primary);font-size:1.1rem">${c.financial_score || 0}점</div></div>
        <div class="detail-item"><div class="d-label">유형</div><div class="d-value"><span class="type-chip ${typeClass(c.score_type)}">${esc(c.score_type)}</span></div></div>
        <div class="detail-item"><div class="d-label">소득유형</div><div class="d-value">${esc(c.income_type) || '—'}</div></div>
        <div class="detail-item"><div class="d-label">월소득</div><div class="d-value">${c.monthly_income || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">월생활비</div><div class="d-value">${c.monthly_living || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">월저축</div><div class="d-value">${c.monthly_saving || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">총금융자산</div><div class="d-value">${c.total_asset || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">대출여부</div><div class="d-value">${c.has_debt ? '있음' : '없음'}</div></div>
        <div class="detail-item"><div class="d-label">월상환액</div><div class="d-value">${c.monthly_debt || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">월보험료</div><div class="d-value">${c.monthly_insurance || 0}만원</div></div>
        <div class="detail-item"><div class="d-label">비상금</div><div class="d-value">${esc(c.emergency_level) || '—'}</div></div>
        <div class="detail-item"><div class="d-label">4대보험</div><div class="d-value">${esc(c.social_security) || '—'}</div></div>
        <div class="detail-item detail-full"><div class="d-label">저축수단</div><div class="d-value">${savingMethod}</div></div>
        <div class="detail-item detail-full"><div class="d-label">보험종류</div><div class="d-value">${insuranceTypes}</div></div>
        <div class="detail-item detail-full"><div class="d-label">노후준비</div><div class="d-value">${retirementPlans}</div></div>
        <div class="detail-item"><div class="d-label">재무목표</div><div class="d-value">${esc(c.fin_goal) || '—'}</div></div>
        <div class="detail-item"><div class="d-label">희망시간</div><div class="d-value">${esc(c.preferred_time) || '언제든 가능'}</div></div>
      </div>
      ${c.question ? `<div style="margin-top:10px;padding:12px;background:var(--gray-50);border-radius:8px;font-size:.83rem;color:var(--gray-600)"><strong>질문:</strong> ${esc(c.question)}</div>` : ''}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">상태 관리</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div class="d-label" style="margin-bottom:6px">상태 변경</div>
          <select id="detail-status" style="width:100%;padding:9px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.875rem;font-family:inherit;outline:none">
            <option ${c.status==='신규'?'selected':''}>신규</option>
            <option ${c.status==='상담완료'?'selected':''}>상담완료</option>
            <option ${c.status==='계약완료'?'selected':''}>계약완료</option>
            <option ${c.status==='취소'?'selected':''}>취소</option>
          </select>
        </div>
        <div>
          <div class="d-label" style="margin-bottom:6px">담당자 배정</div>
          <select id="detail-assignee" style="width:100%;padding:9px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.875rem;font-family:inherit;outline:none">
            <option value="">미배정</option>
            ${allStaff.filter(s => s.id !== 1 || s.name !== '인스타광고').map(s =>
              `<option value="${esc(s.name)}" ${c.assignee===s.name?'selected':''}>${esc(s.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div style="grid-column:1/-1">
          <div class="d-label" style="margin-bottom:6px">메모</div>
          <textarea id="detail-memo" style="width:100%;padding:9px 12px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:.875rem;font-family:inherit;outline:none;resize:vertical;min-height:70px">${esc(c.memo) || ''}</textarea>
        </div>
      </div>
    </div>
  `

  openModal('detail-modal')
}

async function saveDetailChanges() {
  if (!selectedRow) return
  const patch = {
    status:   document.getElementById('detail-status').value,
    assignee: document.getElementById('detail-assignee').value,
    memo:     document.getElementById('detail-memo').value
  }
  await fetch(`/tables/consultations/${selectedRow.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
  })
  closeModal('detail-modal')
  showToast('변경사항이 저장되었습니다.', 'success')
  await loadConsultations()
}

async function deleteConsultation() {
  if (!selectedRow) return
  if (!confirm(`"${selectedRow.name}" 신청을 삭제하시겠습니까?`)) return
  await fetch(`/tables/consultations/${selectedRow.id}`, { method: 'DELETE' })
  closeModal('detail-modal')
  showToast('삭제되었습니다.', 'success')
  await loadConsultations()
}

// ── Staff ──────────────────────────────────────
async function loadStaff() {
  try {
    const res = await fetch('/tables/staff')
    allStaff  = await res.json()
    renderStaff()
    renderStaffStats()
  } catch(e) {}
}

function renderStaffStats() {
  const grid = document.getElementById('staff-stats-grid')
  if (!grid) return
  grid.innerHTML = ''
  allStaff.forEach(s => {
    const cnt = allConsultations.filter(c => c.ref_staff === String(s.id) || c.ref_staff_name === s.name).length
    grid.insertAdjacentHTML('beforeend', `
      <div class="staff-stat-card">
        <div class="staff-stat-name">${esc(s.name)}</div>
        <div class="staff-stat-count">${cnt}</div>
        <div class="staff-stat-label">총 신청건수</div>
      </div>
    `)
  })
}

function renderStaff() {
  const tbody = document.getElementById('staff-tbody')
  if (!tbody) return
  tbody.innerHTML = ''
  allStaff.forEach(s => {
    const cnt = allConsultations.filter(c =>
      c.ref_staff === String(s.id) || c.ref_staff_name === s.name
    ).length
    const dt = s.created_at ? new Date(s.created_at).toLocaleDateString('ko-KR') : '—'
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${esc(s.name)}</strong></td>
        <td style="font-size:.8rem;color:var(--gray-400)">${s.id}</td>
        <td>${cnt}건</td>
        <td><span class="status-badge ${s.active ? 'done' : 'canceled'}">${s.active ? '활성' : '비활성'}</span></td>
        <td style="font-size:.8rem">${dt}</td>
        <td>
          <button class="tbl-btn copy" onclick="copyStaffLink(${s.id}, '${esc(s.name)}')">
            <i class="fas fa-link"></i> 링크 복사
          </button>
        </td>
        <td style="display:flex;gap:6px">
          <button class="tbl-btn edit" onclick="editStaff(${s.id}, '${esc(s.name)}', ${s.active ? 1 : 0})">
            <i class="fas fa-pen"></i>
          </button>
          <button class="tbl-btn del" onclick="deleteStaff(${s.id}, '${esc(s.name)}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `)
  })
}

function openAddStaff() {
  document.getElementById('new-staff-name').value = ''
  openModal('staff-modal')
}

async function addStaff() {
  const name = document.getElementById('new-staff-name').value.trim()
  if (!name) return showToast('이름을 입력해 주세요.', 'error')

  await fetch('/tables/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, active: 1 })
  })
  closeModal('staff-modal')
  showToast(`"${name}" 담당자가 추가되었습니다.`, 'success')
  await loadStaff()
  buildSourceTabs()
}

async function editStaff(id, currentName, active) {
  const newName = prompt('담당자 이름 변경:', currentName)
  if (!newName || newName.trim() === currentName) return
  await fetch(`/tables/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName.trim() })
  })
  showToast('담당자 이름이 변경되었습니다.', 'success')
  await loadStaff()
}

async function deleteStaff(id, name) {
  if (!confirm(`"${name}" 담당자를 삭제하시겠습니까?`)) return
  await fetch(`/tables/staff/${id}`, { method: 'DELETE' })
  showToast('삭제되었습니다.', 'success')
  await loadStaff()
  buildSourceTabs()
}

async function copyStaffLink(staffId, staffName) {
  const origin = location.origin
  const longUrl = `${origin}/?ref=${staffId}&rn=${encodeURIComponent(staffName)}`
  const short   = await shortenUrl(longUrl)
  const final   = short || longUrl

  navigator.clipboard.writeText(final).then(() => {
    showToast(`${staffName} 링크 복사 완료: ${final}`, 'success')
  }).catch(() => {
    prompt('링크를 복사하세요:', final)
  })
}

// ── Bit.ly Shorten ─────────────────────────────
async function shortenUrl(longUrl) {
  try {
    const res = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BITLY_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ long_url: longUrl })
    })
    const data = await res.json()
    return data.link || null
  } catch(e) {
    return null
  }
}

// ── Settings ───────────────────────────────────
async function loadSettings() {
  try {
    const res  = await fetch('/tables/site_settings')
    const data = await res.json()
    data.forEach(item => {
      const el = document.getElementById(`set-${item.id}`)
      if (el) el.value = item.value || ''
    })
  } catch(e) {}
}

async function saveSettings() {
  const ids = ['ad_review_no','ad_review_date','ad_review_org','compliance_text','privacy_url','footer_notice']
  const labels = {
    ad_review_no: '광고심의필번호', ad_review_date: '심의일자',
    ad_review_org: '심의기관', compliance_text: '준법감시 문구',
    privacy_url: '개인정보처리방침 URL', footer_notice: '하단 고지문구'
  }
  const payload = ids.map(id => ({
    id,
    label: labels[id] || id,
    value: document.getElementById(`set-${id}`)?.value || ''
  }))

  await fetch('/tables/site_settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  showToast('설정이 저장되었습니다.', 'success')
}

// ── Excel Export ───────────────────────────────
function exportExcel() {
  const rows = [
    ['신청일','이름','연락처','생년월일','직업','월소득','월생활비','월저축',
     '총자산','보험료','대출월상환','재무점수','유형','비상금','4대보험',
     '저축수단','보험종류','노후준비','재무목표','희망시간','질문',
     '상태','담당자','유입경로','메모']
  ]
  allConsultations.forEach(c => {
    rows.push([
      c.apply_date ? new Date(c.apply_date).toLocaleDateString('ko-KR') : '',
      c.name, c.phone, c.birthdate, c.job,
      c.monthly_income, c.monthly_living, c.monthly_saving,
      c.total_asset, c.monthly_insurance, c.monthly_debt,
      c.financial_score, c.score_type,
      c.emergency_level, c.social_security,
      safeJSON(c.saving_method, []).join('/'),
      safeJSON(c.insurance_types, []).join('/'),
      safeJSON(c.retirement_plans, []).join('/'),
      c.fin_goal, c.preferred_time, c.question,
      c.status, c.assignee,
      c.ref_staff_name || c.ref_staff,
      c.memo
    ])
  })

  const csv  = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = `lifelab_consultations_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
}

// ── Helpers ────────────────────────────────────
function typeClass(type) {
  return { '안정형': 'stable', '점검필요형': 'check', '개선필요형': 'improve', '상담권장형': 'consult' }[type] || 'check'
}

function statusClass(status) {
  return { '신규': 'new', '상담완료': 'done', '계약완료': 'contracted', '취소': 'canceled' }[status] || 'new'
}

function esc(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

function safeJSON(str, fallback) {
  try { return JSON.parse(str) || fallback } catch { return fallback }
}

function openModal(id) {
  document.getElementById(id).classList.add('show')
}
function closeModal(id) {
  document.getElementById(id).classList.remove('show')
  selectedRow = null
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast')
  const msgEl = document.getElementById('toast-msg')
  toast.className = 'show' + (type ? ` ${type}` : '')
  msgEl.textContent = msg
  setTimeout(() => { toast.className = '' }, 3200)
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('show')
  })
})
