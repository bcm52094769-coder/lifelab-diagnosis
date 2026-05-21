-- ═══════════════════════════════════════════════════════
-- 이벤트 응모권 & 룰렛 테이블
-- 이벤트 기간: 2025-05-22 ~ 2025-07-31
-- ═══════════════════════════════════════════════════════

-- 응모권 테이블
-- 응모권은 2가지 방식으로 생성됨:
--   1) 상담 신청 완료 시 자동 +1
--   2) 내가 초대한 지인이 상담 신청 완료 시 +1 (초대 응모권)
CREATE TABLE IF NOT EXISTS ll_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  phone       TEXT NOT NULL,          -- 응모자 전화번호 (식별키)
  name        TEXT NOT NULL DEFAULT '',
  consult_id  INTEGER DEFAULT 0,      -- 연결된 상담 신청 ID
  ref_staff   TEXT DEFAULT '',        -- 유입 설계사 ID
  ref_staff_name TEXT DEFAULT '',     -- 유입 설계사 이름
  invited_by  TEXT DEFAULT '',        -- 나를 초대한 사람 전화번호 (초대받아 온 경우)
  entry_count INTEGER DEFAULT 1,      -- 보유 응모권 수
  roulette_result TEXT DEFAULT '',    -- 룰렛 결과 (꽝/스타벅스/치킨/5만원/10만원)
  roulette_played INTEGER DEFAULT 0,  -- 룰렛 실행 여부 (0=미실행, 1=실행완료)
  roulette_at TEXT DEFAULT '',        -- 룰렛 실행 일시
  created_at  TEXT DEFAULT ''
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_entries_phone  ON ll_entries(phone);
CREATE INDEX IF NOT EXISTS idx_entries_staff  ON ll_entries(ref_staff);
CREATE INDEX IF NOT EXISTS idx_entries_invited ON ll_entries(invited_by);

-- 룰렛 상품 설정 (관리자가 수정 가능)
-- prize_id, label, total_count(총 당첨 가능수), current_count(현재 당첨수), probability(확률%)
CREATE TABLE IF NOT EXISTS ll_prizes (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  total_count INTEGER DEFAULT 0,   -- 총 당첨 인원
  win_count   INTEGER DEFAULT 0,   -- 현재까지 당첨된 수
  probability INTEGER DEFAULT 0,   -- 기본 확률 (관리용, 실제 확률은 잔여수량 기반)
  active      INTEGER DEFAULT 1
);

-- 기본 상품 세팅
INSERT OR IGNORE INTO ll_prizes (id, label, total_count, win_count, probability, active) VALUES
  ('10만원',     '상품권 10만원',      10,  0, 5,  1),
  ('5만원',      '상품권 5만원',       20,  0, 10, 1),
  ('치킨',       '치킨 기프티콘',      20,  0, 10, 1),
  ('스타벅스',   '스타벅스 기프티콘',  50,  0, 25, 1),
  ('꽝',         '아쉽게도 꽝!',        0,  0, 50, 1);
