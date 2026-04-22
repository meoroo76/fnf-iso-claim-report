// Tri-lingual defect catalog — KO / EN / VI
// INSIGHT FOCUS: how to inspect the defect thoroughly.
// Provides concrete inspection methods, tolerance values, and test procedures
// so the QA inspector can validate each claim in a standardized way.

export type DefectCategory =
  | 'stitching'
  | 'fabric'
  | 'color'
  | 'print'
  | 'accessory'
  | 'measurement'
  | 'contamination'
  | 'labeling'
  | 'other';

export type TriLingual = { ko: string; en: string; vi: string };

export const DEFECT_CATALOG: Record<DefectCategory, { label: TriLingual; insight: TriLingual }> = {
  stitching: {
    label: {
      ko: '봉제 불량 (스티칭)',
      en: 'Stitching defect',
      vi: 'Lỗi đường may',
    },
    insight: {
      ko: '10배 확대경으로 SPI(인치당 땀수) 균일성, 바늘땀 건너뜀 · 밀림 유무, 시접 폭, 코너부 보강 여부를 확인하고, 접착 테이프를 붙였다 떼어 실 풀림·마찰 내성을 기록합니다.',
      en: 'Under a 10× loupe, verify SPI uniformity, skipped/jammed stitches, seam-allowance width, and corner reinforcement; apply/remove adhesive tape to check thread unraveling and friction resistance.',
      vi: 'Dùng kính lúp 10×, kiểm tra độ đồng đều SPI, mũi bị nhảy/kẹt, độ rộng đường biên may và phần gia cố góc; dán/bóc băng dính để đánh giá độ tuột chỉ và chịu ma sát.',
    },
  },
  fabric: {
    label: {
      ko: '원단 불량 (긁힘/오염/파손)',
      en: 'Fabric defect (abrasion / stain / tear)',
      vi: 'Lỗi vải (trầy/bẩn/rách)',
    },
    insight: {
      ko: '4-Point System 기준으로 결함 길이를 측정(≥3인치=4점)하고, ISO 105-X12(마찰견뢰도) · ISO 13937(인열강도) · ISO 12947(마모) 시험지에 결과를 기입하여 클레임 사유를 수치화합니다.',
      en: 'Score the defect by the 4-Point System (≥3 in = 4 pts) and log ISO 105-X12 (rubbing fastness), ISO 13937 (tear strength), and ISO 12947 (abrasion) test results to quantify the claim.',
      vi: 'Chấm điểm lỗi theo 4-Point System (≥3 inch = 4 điểm) và ghi nhận kết quả ISO 105-X12 (độ bền ma sát), ISO 13937 (độ bền xé), ISO 12947 (mài mòn) để định lượng khiếu nại.',
    },
  },
  color: {
    label: {
      ko: '색상 차이 / 염색 불량',
      en: 'Color deviation / dyeing defect',
      vi: 'Sai màu / lỗi nhuộm',
    },
    insight: {
      ko: 'D65 광원 라이트박스에서 승인 스와치와 대조해 분광측색계로 ΔE(CIELAB)를 측정하고, 허용치 1.5 이내 여부 · 메타메리즘(D65/TL84/A광원) · 로트 간 편차를 기록합니다.',
      en: 'Under a D65 light-box, compare against the approved swatch with a spectrophotometer; record ΔE (CIELAB) within 1.5 tolerance, metamerism across D65/TL84/A sources, and inter-lot deviation.',
      vi: 'Trong hộp sáng D65, so sánh với swatch đã duyệt bằng máy đo quang phổ; ghi ΔE (CIELAB) trong dung sai 1.5, hiện tượng metamerism dưới D65/TL84/A và độ lệch giữa các lô.',
    },
  },
  print: {
    label: {
      ko: '프린트 / 자수 불량',
      en: 'Print / embroidery defect',
      vi: 'Lỗi in / thêu',
    },
    insight: {
      ko: '프린트 정위치 오차(±3mm)와 세탁 5회 후 크랙·탈색, 자수 밀도(stitch/cm²) · 백스티치 마감 · 뒷면 부착포 텐션을 확대 촬영하여 비교 자료로 남깁니다.',
      en: 'Check print registration (±3mm), post-5-wash cracking and fading, embroidery density (stitch/cm²), backstitch finish, and reverse-side backing tension; archive magnified photographs as comparison evidence.',
      vi: 'Kiểm tra vị trí in (±3mm), nứt/phai sau giặt 5 lần, mật độ thêu (mũi/cm²), hoàn thiện mũi lại và lực căng vải lót mặt trong; lưu ảnh phóng đại làm bằng chứng đối chiếu.',
    },
  },
  accessory: {
    label: {
      ko: '부자재 불량 (지퍼/단추/라벨)',
      en: 'Trim defect (zipper / button / label)',
      vi: 'Lỗi phụ liệu (khóa/cúc/nhãn)',
    },
    insight: {
      ko: '지퍼 슬라이더 50회 왕복 작동 시험 · 단추 당김강도(≥90N, 아동용 70N) · 스냅버튼 착탈력(40~80N)을 측정하고, 부자재 롯트번호와 공급처를 대조해 기록합니다.',
      en: 'Run a 50-cycle zipper slider test; measure button pull strength (≥90N; 70N for kidswear) and snap engagement (40–80N); record the trim lot number and supplier for traceability.',
      vi: 'Thử khóa kéo 50 lần; đo lực kéo nút (≥90N; trẻ em 70N) và lực đóng/mở nút bấm (40–80N); ghi số lô phụ liệu và nhà cung cấp để truy xuất.',
    },
  },
  measurement: {
    label: {
      ko: '치수 불량 (스펙 이탈)',
      en: 'Measurement out-of-spec',
      vi: 'Lỗi thông số kích thước',
    },
    insight: {
      ko: '스펙 시트의 8개 주요 POM(가슴·어깨·기장·소매길이·밑단·암홀 등)을 평면 측정하고 허용치(±1cm)와 비교, 같은 사이즈 3장 이상으로 표준편차(σ)와 편차 방향을 확인합니다.',
      en: 'Flat-measure the 8 key POMs (chest, shoulder, length, sleeve, hem, armhole, etc.) against spec tolerance (±1 cm); validate standard deviation (σ) and bias direction across ≥3 garments of the same size.',
      vi: 'Đo phẳng 8 điểm POM chính (ngực, vai, dài áo, dài tay, lai, nách…) so với dung sai (±1 cm); xác nhận độ lệch chuẩn (σ) và hướng lệch trên ≥3 sản phẩm cùng size.',
    },
  },
  contamination: {
    label: {
      ko: '오염 / 이물질 혼입',
      en: 'Contamination / foreign matter',
      vi: 'Nhiễm bẩn / dị vật',
    },
    insight: {
      ko: '금속검출기(Fe 1.2mm / SUS 2.0mm 기준) 통과 시험과 UV 365nm 램프로 형광 얼룩 · 유기물 오염을 점검하고, 외관검사 AQL 2.5 Major 기준으로 건 수를 집계합니다.',
      en: 'Perform needle-detector passage (Fe 1.2 mm / SUS 2.0 mm thresholds) and UV-365 nm inspection for fluorescent stains and organic contamination; tally findings under AQL 2.5 Major visual criteria.',
      vi: 'Cho qua máy dò kim loại (ngưỡng Fe 1.2 mm / SUS 2.0 mm) và dùng đèn UV 365 nm để phát hiện vết huỳnh quang và chất hữu cơ; tổng hợp theo tiêu chí AQL 2.5 Major.',
    },
  },
  labeling: {
    label: {
      ko: '라벨/케어라벨 오기재',
      en: 'Labeling / care-label error',
      vi: 'Lỗi nhãn / nhãn bảo quản',
    },
    insight: {
      ko: '스펙 대비 케어라벨 내용(혼용률·원산지·KC마크·바코드) 일치 여부, 부착 위치(±5mm), 세탁 10회 후 인쇄 선명도(ISO 105-C06)와 박음 유지력을 확인해 기록합니다.',
      en: 'Cross-check care-label content (fiber content, origin, KC mark, barcode) against spec, attachment position (±5 mm), print legibility after 10 washes (ISO 105-C06), and stitch retention.',
      vi: 'Đối chiếu nội dung nhãn bảo quản (thành phần, xuất xứ, dấu KC, mã vạch) với tiêu chuẩn, vị trí gắn (±5 mm), độ rõ in sau 10 lần giặt (ISO 105-C06) và độ bền đường may gắn nhãn.',
    },
  },
  other: {
    label: { ko: '기타', en: 'Other', vi: 'Khác' },
    insight: {
      ko: '불량 재현 조건(온도·세탁·마찰 등)을 기록하고, 동일 PO에서 샘플 5장을 추가 선별해 단일 발생인지 공정 이슈인지 판단한 뒤 사진·측정값과 함께 리포트에 첨부합니다.',
      en: 'Record defect reproduction conditions (temperature, wash, friction, etc.) and pull 5 more samples from the same PO to distinguish an isolated case from a process issue; attach photos and measurements to the report.',
      vi: 'Ghi lại điều kiện tái hiện lỗi (nhiệt độ, giặt, ma sát…) và lấy thêm 5 mẫu trong cùng PO để phân biệt lỗi đơn lẻ hay vấn đề quy trình; đính kèm ảnh và số liệu vào báo cáo.',
    },
  },
};

export const UI_STRINGS = {
  appTitle: 'ISO Claim Report',
  appSubtitle: 'F&F Quality Assurance · Defect Report Builder',
  sectionInput: '1. 입력',
  sectionPreview: '2. 리포트 미리보기',
  styleLookup: '스타일(품번) 조회',
  styleLookupPlaceholder: '예: VDPT10854 또는 V25FVDPT10854',
  lookupBtn: '지식그래프 조회',
  defectList: '불량 내역',
  addDefect: '+ 불량 추가',
  category: '불량 카테고리',
  qty: '수량',
  detail: '상세 설명 (한국어)',
  photos: '불량 사진',
  careLabel: '케어라벨 사진 (검사번호)',
  claimNo: '클레임 번호',
  inspector: '검사자',
  inspectionDate: '검사일',
  generateReport: '리포트 생성',
  exportPdf: 'PDF 다운로드',
  exportDocx: 'Word 다운로드',
} as const;
