# 라이프랩 LIFE LAB — 재무건강 진단 웹사이트

## 📋 프로젝트 개요
- **서비스명**: 라이프랩 LIFE LAB 재무건강 진단
- **목표**: 소득·지출·저축·부채·보험·노후 등 8가지 항목을 100점 만점으로 진단하고 전문가 무료 상담을 연결
- **플랫폼**: Cloudflare Pages + D1 Database

## 🌐 URL
- **프로덕션**: https://lifelab-diagnosis.pages.dev
- **관리자**: https://lifelab-diagnosis.pages.dev/admin.html
- **직원전용**: https://lifelab-diagnosis.pages.dev/staff_links.html
- **로컬 개발**: http://localhost:3000

## 🗂 파일 구조
```
public/
├── index.html          # 메인 진단 페이지 (4단계 플로우)
├── admin.html          # 관리자 페이지
├── staff_links.html    # 직원 전용 링크 페이지
├── css/
│   ├── style.css       # 메인 스타일 (chip 라디오/체크박스, 반응형)
│   └── admin.css       # 관리자 스타일 (사이드바 레이아웃)
├── js/
│   ├── main.js         # 진단 로직 (8항목 채점, API 연동)
│   └── admin.js        # 관리자 로직 (통계, 테이블, 모달, bit.ly)
└── images/
    └── logo.svg        # 심전도 라인 로고
src/
└── index.tsx           # Hono API (consultations/staff/site_settings)
migrations/
└── 0001_init.sql       # D1 초기 스키마 (로컬용)
```

## 🔑 로그인 정보
| 페이지 | ID / 선택 | 비밀번호 |
|--------|-----------|---------|
| 관리자(admin.html) | lifelab | lifelab1234! |
| 직원전용(staff_links.html) | 담당자 선택 | lifelab2026! |

## 🎯 완성된 기능

### index.html (메인 진단)
- [x] 헤더: 로고 + 무료진단 시작 버튼
- [x] 히어로 섹션: 82점 미리보기 카드
- [x] URL 파라미터 `?ref=ID&rn=이름` 감지 → 상단 배너
- [x] STEP 1: 6개 섹션 익명 재무 입력 (chip 스타일)
- [x] STEP 2: 원형 점수 링 애니메이션, 항목별 바차트, 유형 배지
- [x] STEP 3: 상담 신청 폼 (연락처 자동 하이픈, 개인정보 동의 테이블)
- [x] STEP 4: 완료 화면, 링크 공유 버튼

### 점수 계산 (100점 만점)
| # | 항목 | 만점 |
|---|------|------|
| ① | 소득대비 생활비 비율 | 20점 |
| ② | 저축률 (가처분소득 기준) | 22점 |
| ③ | 부채건전성 (DSR) | 15점 |
| ④ | 비상금 규모 | 15점 |
| ⑤ | 보험적정성 | 13점 |
| ⑥ | 자산축적도 | 8점 |
| ⑦ | 분산투자 | 7점 |
| ⑧ | 노후준비 | 10점 |

유형: 안정형(80+) / 점검필요형(65+) / 개선필요형(50+) / 상담권장형(50미만)

### admin.html (관리자)
- [x] 로그인 (ID: lifelab / PW: lifelab1234!)
- [x] 통계카드 4개 (전체/신규/상담완료/계약완료)
- [x] 유입경로 탭 필터 (전체/인스타광고/직원별 동적 생성)
- [x] 검색(이름/연락처/직업) + 상태 필터 + CSV 엑셀 다운로드
- [x] 행 클릭 → 상세 모달 (전체 진단데이터, 상태변경, 담당자배정, 메모)
- [x] 담당자 관리 (추가/수정/삭제, bit.ly 단축링크 복사)
- [x] 사이트 설정 (광고심의필번호, 준법감시 문구 등)

### staff_links.html (직원전용)
- [x] 로그인 (담당자 select + 공통 PW: lifelab2026!)
- [x] 개인 단축 링크 (bit.ly API 자동 단축)
- [x] 원본 URL 토글 보기
- [x] QR코드 생성 (qrcodejs) + 이미지 저장
- [x] 문자 발송 템플릿 + 복사
- [x] 내 신청 통계 카드 4개

## 🗄 DB 테이블 (Cloudflare D1)
- `ll_consultations` — 상담 신청 데이터 (31개 컬럼)
- `ll_staff` — 직원 목록
- `ll_site_settings` — 사이트 설정

**API 엔드포인트**
```
GET/POST   /tables/consultations
PATCH/DELETE /tables/consultations/:id
GET/POST   /tables/staff
PATCH/DELETE /tables/staff/:id
GET        /tables/site_settings
PUT        /tables/site_settings
```

## 🚀 배포 정보
- **플랫폼**: Cloudflare Pages
- **상태**: ✅ 활성
- **D1 DB**: lifelab-production (ID: 566cff30-6a0b-47ec-95c5-7197da55214e)
- **기술스택**: Hono + TypeScript + Cloudflare D1 + TailwindCSS(CDN) + Font Awesome

## 🛠 로컬 개발 방법
```bash
# 1. 의존성 설치
npm install

# 2. 로컬 DB 마이그레이션
npm run db:migrate:local

# 3. 빌드
npm run build

# 4. PM2 서버 시작
pm2 start ecosystem.config.cjs

# 5. 브라우저 접속
open http://localhost:3000
```

## 🔄 프로덕션 배포
```bash
npm run build
# _routes.json 수정 (API only)
echo '{"version":1,"include":["/tables/*"],"exclude":[]}' > dist/_routes.json
npx wrangler pages deploy dist --project-name lifelab-diagnosis --commit-dirty=true
```
