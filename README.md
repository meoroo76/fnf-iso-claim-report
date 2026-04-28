# ISO Claim Report · F&F QA

생산 완료·매장 입고 후 발생한 소비자/매장 클레임을 **한국어 · 영어 · 베트남어**로 동시 문서화하고, PDF/Word로 내보내며, 협력사에 **이메일 자동 발송** 또는 **Teams 채널 게시**까지 원스톱으로 처리하는 웹앱입니다.

## 배포 현황

- GitHub: https://github.com/meoroo76/fnf-iso-claim-report (private)
- Vercel: 자동 배포 (main 브랜치 push 시)
- Dashboard: https://vercel.com/meoroo76s-projects/fnf-iso-claim-report

## 데이터 규모 (KG 스냅샷 2026-04-22)

- 품번: 553개 (DUVETICA V × 322 + SERGIO TACCHINI ST × 231)
- 실 PO 매핑: 537개 품번 (97%)
- 협력사: 55+ (MFAC_COMPY_NM 실데이터)
- 운영시즌: 25FW · 26SS

## 핵심 기능

- **지식그래프 실시간 조회** — 품번 입력 시 제품 이미지·협력사·컬러·입고수량·PO 자동 로드 (운영시즌 25FW/26SS, DUVETICA/SERGIO TACCHINI/DISCOVERY × 90건 스냅샷 + `KG_API_BASE` 설정 시 라이브 호출)
- **3개국어 동시 기재 — 3번째 언어 가변** — KO + EN 고정 + 4개 언어 중 1개 선택 (베트남어 default · 중국어 · 인도네시아어 · 미얀마어). 입력 디테일은 **Claude AI 번역** (폴백: MyMemory API + localStorage 캐시)
- **AI 생산 주의사항 자동 생성** — 실제 불량 카테고리·브랜드·시즌·협력사 컨텍스트 기반으로 다음 라운드 협력사·외관검사 대행사용 지시문을 KO/EN/VI 동시 생성 (Claude Haiku 4.5 via Vercel AI Gateway)
- **검사 가이드 중심 인사이트** — ISO 표준 기반 측정법·허용치·시험 절차
- **A4 단일 페이지 · 3× 고해상도 사진** — 실물 샘플 해외 발송 곤란 대응 (html2canvas scale:3 · PNG)
- **PDF / Word 내보내기** · **이메일 자동 발송 (PDF 첨부)** · **Teams 채널 게시 (MessageCard)**
- **자동 이메일 본문** — 심각도 · 스타일 · 협력사 · 불량 리스트 · CAPA 회신 요청을 3개 국어로 자동 드래프트

## 기술 스택

- Vite + React 19 + TypeScript + Tailwind
- jsPDF + html2canvas (PDF) · docx (Word)
- Vercel Functions (백엔드 API) / 로컬 Vite 미들웨어 (dev)
- Nodemailer (SMTP) · Teams Incoming Webhook

## 개발

```bash
npm install
cp .env.example .env          # 선택: 실 SMTP / Teams / KG 연동
npm run dev                   # http://localhost:5173
```

`.env` 없이도 모든 기능 동작 — 이메일/Teams는 **시뮬레이션 모드** (콘솔 로그 + 성공 응답), KG는 **로컬 스냅샷 (90건)** 사용.

## 프로덕션 배포 (Vercel)

1. GitHub에 push
2. `vercel` CLI 또는 Vercel Dashboard에서 프로젝트 연결
3. Dashboard → Settings → Environment Variables:
   - **`AI_GATEWAY_API_KEY`** (필수, AI 생성 기능용 — 아래 참고)
   - 또는 `ANTHROPIC_API_KEY` (직접 호출 폴백)
4. Deploy

### AI Gateway 설정 (Claude 호출)

AI 생성 버튼은 `/api/generate` Vercel Function을 거쳐 Claude Haiku 4.5를 호출합니다.

**Vercel AI Gateway 사용 (추천):**

1. Vercel Dashboard → AI → AI Gateway → API Keys → Create
2. 신규 가입자 **$5 무료 크레딧** 자동 지급 (별도 Anthropic 계정 불필요)
3. `vercel env add AI_GATEWAY_API_KEY` 또는 Dashboard에서 환경변수 추가
4. Production / Preview / Development 모두 적용

**예상 비용:** Haiku 4.5 호출 1건당 약 $0.005 (≈10원). 월 100건 기준 $0.5 수준 — Vercel Hobby + AI Gateway 무료 크레딧 안에서 운영 가능.

**Anthropic 직접 호출 (폴백):**

`AI_GATEWAY_API_KEY` 대신 `ANTHROPIC_API_KEY`를 설정하면 AI SDK가 자동으로 Anthropic Console로 직접 라우팅합니다. (마이그레이션 시점에 둘 중 하나만 있으면 동작)

**키 미설정 시 동작:** AI 호출이 실패하면 자동으로 기존 MyMemory 번역으로 폴백되어 리포트는 계속 생성됩니다 (생산 주의사항 섹션만 비표시).

---

## 🧠 용어집 관리 — Claude AI 학습 (3단 우선순위 사전 시스템)

Claude Haiku는 fine-tuning이 불가능하므로, **컨텍스트 주입** 방식으로 F&F 사내 용어를 강제합니다. 매 호출마다 다음 **3단 사전이 우선순위 순서대로** 자동 주입됩니다:

| 순위 | 파일 | 역할 | 편집 방법 |
|---|---|---|---|
| **🥇 1순위** | `src/input/fashion_glossary.js` | F&F 큐레이트 5개 국어 전문 용어 (ko/en/vi/zh/id/my) | 본 파일 직접 편집 |
| **🥈 2순위** | `data/garmentGlossary.json` | 사용자 추가 용어·규칙 (3개 국어 ko/en/vi) | JSON 한 줄 추가 |
| **🥉 3순위** | `src/data/defectCatalog.ts` | 9개 카테고리 공식 인사이트 (스타일/톤 참조) | 카테고리 추가 시만 수정 |

**충돌 시:** 1순위 > 2순위 > 3순위. 즉 `fashion_glossary.js`의 단어가 항상 우선 적용됩니다.

### 용어 추가 워크플로우

```bash
# 1. JSON 파일 열기
code data/garmentGlossary.json

# 2. terms[] 배열에 추가
{ "ko": "되돌림 봉제", "en": "backstitch reinforcement", "vi": "may lại gia cố" }

# 3. (선택) rules[] 에 사용 맥락 / 금지 패턴 추가
"절대 'lai'를 'đáy'로 번역하지 말 것"

# 4. version, lastUpdated 갱신 후 commit
git add data/garmentGlossary.json
git commit -m "docs(glossary): add backstitch reinforcement terms"
git push

# 5. Vercel 자동 배포 (≈ 90초) → 다음 AI 호출부터 영구 반영
```

### 토큰 예산 가이드

- 현재 시드 ≈ 38 terms + 8 rules → 약 1.5K 토큰
- **안전 한도:** terms 약 500개 + rules 약 50개 (Haiku 4.5)
- 그 이상 늘면 모델을 Sonnet으로 업그레이드하거나 카테고리별 분할 고려

### 우선순위 규칙

용어집 ↔ defectCatalog 충돌 시 **glossary가 우선**합니다 (프롬프트 후방 배치 = 더 높은 가중치).
즉, defectCatalog의 표현이 마음에 안 들면 glossary에 덮어쓰기 가능 — defectCatalog.ts 수정 불필요.

## 📊 데이터 적재 — Google Sheet 보관함 (개발 단계)

매 리포트 생성 시 **자동으로 Google Sheet에 한 줄 추가**됩니다 (fire-and-forget). 검색·필터·통계는 Sheet의 표준 기능 + Pivot Table로 즉시 가능. 향후 SharePoint List로 마이그레이션 예정.

### 저장되는 28개 컬럼

```
created_at | claim_no | inspection_date | inspector | brand | style_code |
product_name | category | season | color | color_code | supplier |
supplier_vendor_code | po_number | received_qty | total_defect_qty |
defect_rate_pct | severity | third_language | defect_categories |
defects_json | translations_json | guidance_ko | guidance_en | guidance_third |
ai_source | defect_photo_count | care_label_photo_count
```

### 셋업 가이드 — 1회성, 약 15분

#### A. Google Cloud 프로젝트 생성

1. https://console.cloud.google.com 접속
2. 좌상단 프로젝트 선택 → **New Project** → 이름: `fnf-iso-claim-dev`
3. 좌측 메뉴 → **APIs & Services** → **Library**
4. `Google Sheets API` 검색 → **Enable**

#### B. Service Account 생성

1. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
2. 이름: `fnf-claim-sheet-writer` → **Create and Continue** → **Done**
3. 생성된 service account 클릭 → **Keys** 탭 → **Add Key** → **Create new key** → **JSON** 선택
4. JSON 파일 다운로드됨 → ⚠️ **절대 git commit 금지**, 안전한 곳에 보관

#### C. Google Sheet 생성 + 권한 부여

1. https://sheets.google.com 에서 새 Sheet 생성, 이름: `F&F ISO Claim Reports`
2. 첫 번째 탭 이름을 **`Reports`** 로 변경
3. **A1:AB1** 에 헤더 복사 붙여넣기:
   ```
   created_at	claim_no	inspection_date	inspector	brand	style_code	product_name	category	season	color	color_code	supplier	supplier_vendor_code	po_number	received_qty	total_defect_qty	defect_rate_pct	severity	third_language	defect_categories	defects_json	translations_json	guidance_ko	guidance_en	guidance_third	ai_source	defect_photo_count	care_label_photo_count
   ```
4. 우상단 **Share** 클릭 → JSON 파일 안의 `client_email` 값(예: `fnf-claim-sheet-writer@fnf-iso-claim-dev.iam.gserviceaccount.com`)을 **Editor** 권한으로 추가
5. URL에서 Sheet ID 복사 — `https://docs.google.com/spreadsheets/d/▼THIS_PART▼/edit`

#### D. Vercel 환경변수 등록

Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value | Sensitive |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | (JSON 파일 전체 내용을 한 줄로) | ☑ |
| `GOOGLE_SHEET_ID` | (Sheet URL의 ID) | ☑ |
| `GOOGLE_SHEET_TAB` | `Reports` (또는 다른 탭명) | ☐ (선택) |

**JSON 한 줄 변환 팁:** Mac/Linux는 `cat key.json | jq -c` / Windows는 메모장에서 enter 모두 제거. 또는 Vercel CLI: `vercel env add GOOGLE_SERVICE_ACCOUNT_JSON < key.json`

#### E. 동작 확인

배포 후 리포트 생성 → 입력 화면 상단에 **"Sheet에 저장됨"** 녹색 배너 표시 → "📊 보관함 열기" 클릭 시 Sheet 새 탭 열림.

### Sheet에서 즉시 가능한 분석

- **필터 뷰:** Data → Create a filter → 컬럼별 검색·범위 필터
- **Pivot Table:** Insert → Pivot table → "협력사별 평균 defect_rate", "월별 클레임 건수" 등
- **차트:** Insert → Chart → 시계열·막대·파이
- **Slicer:** 대시보드 형식으로 협력사·시즌별 토글
- **Apps Script:** 자동 알림 (예: defect_rate ≥ 2.5% 발생 시 Slack/이메일)

### 스키마 변경 시 주의

`api/saveReport.ts`의 `SHEET_COLUMNS` 배열은 **추가만 가능, 순서 변경 금지** (히스토리컬 데이터 정렬 깨짐). 컬럼 추가 시 Sheet 헤더에도 동일하게 끝에 추가.

---

## API 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/generate` | Claude AI — 불량 디테일 KO/EN/3rd 번역 + 생산 주의사항 동시 생성 |
| POST | `/api/saveReport` | Google Sheet에 리포트 한 줄 적재 (fire-and-forget) |

## 데이터 출처

- Knowledge Graph: F&F KG (`execute_kg_api_to_context`) 2026-04-22 스냅샷
- 실 협력사 15개 · 실 품번 90개 · 실 제품 이미지 URL
