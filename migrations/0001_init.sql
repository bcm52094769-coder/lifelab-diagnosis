-- consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  birthdate TEXT DEFAULT '',
  job TEXT DEFAULT '',
  monthly_income REAL DEFAULT 0,
  monthly_living REAL DEFAULT 0,
  monthly_saving REAL DEFAULT 0,
  saving_method TEXT DEFAULT '[]',
  monthly_insurance REAL DEFAULT 0,
  has_emergency_fund INTEGER DEFAULT 0,
  has_retirement_plan INTEGER DEFAULT 0,
  financial_score REAL DEFAULT 0,
  score_type TEXT DEFAULT '',
  question TEXT DEFAULT '',
  preferred_time TEXT DEFAULT '',
  privacy_agreed INTEGER DEFAULT 0,
  status TEXT DEFAULT '신규',
  assignee TEXT DEFAULT '',
  memo TEXT DEFAULT '',
  apply_date TEXT DEFAULT '',
  income_type TEXT DEFAULT '',
  has_debt INTEGER DEFAULT 0,
  monthly_debt REAL DEFAULT 0,
  total_asset REAL DEFAULT 0,
  insurance_types TEXT DEFAULT '[]',
  emergency_level TEXT DEFAULT '',
  social_security TEXT DEFAULT '',
  retirement_plans TEXT DEFAULT '[]',
  fin_goal TEXT DEFAULT '',
  ref_staff TEXT DEFAULT 'instagram',
  ref_staff_name TEXT DEFAULT '인스타광고'
);

-- staff table
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT ''
);

-- site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  value TEXT DEFAULT '',
  label TEXT DEFAULT ''
);

-- default site settings
INSERT OR IGNORE INTO site_settings (id, value, label) VALUES
  ('ad_review_no', '', '광고심의필번호'),
  ('ad_review_date', '', '심의일자'),
  ('ad_review_org', '', '심의기관'),
  ('compliance_text', '본 광고는 금융소비자보호법에 따라 작성되었습니다.', '준법감시 문구'),
  ('privacy_url', '', '개인정보처리방침 URL'),
  ('footer_notice', '라이프랩 LIFE LAB | 금융소비자보호법 준수', '하단 고지문구');

-- default staff
INSERT OR IGNORE INTO staff (id, name, active, created_at) VALUES
  (1, '인스타광고', 1, '2024-01-01T00:00:00.000Z');
