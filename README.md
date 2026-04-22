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
- **3개국어 동시 기재** — 불량 내역·검사 가이드 KO/EN/VI, 사용자 입력 디테일은 MyMemory API 실번역(localStorage 캐시)
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
   - `KG_API_BASE` (선택)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `TEAMS_WEBHOOK_URL`
4. Deploy

## API 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| GET | `/api/kg/meta` | 스냅샷 메타 + live 여부 |
| GET | `/api/kg/style/:code` | 단일 품번 조회 (KG → 스냅샷 fallback) |
| GET | `/api/kg/styles?season=25FW&brand=V` | 목록 필터 |
| GET | `/api/notify/status` | SMTP/Teams 설정 여부 |
| POST | `/api/notify/email` | PDF 첨부 이메일 발송 |
| POST | `/api/notify/teams` | Teams 채널 게시 |

## 데이터 출처

- Knowledge Graph: F&F KG (`execute_kg_api_to_context`) 2026-04-22 스냅샷
- 실 협력사 15개 · 실 품번 90개 · 실 제품 이미지 URL
