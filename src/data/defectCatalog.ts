// Tri-lingual defect catalog — KO / EN / VI
// INSIGHT FOCUS: field inspection guidance for garment factories and external
// visual-inspection agencies — practical QC-floor instructions from F&F QA,
// keeping only the core tolerances and standards actually used on-site.

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
      ko: '검단대에서 정면·이면을 육안으로 훑고, 어깨·겨드랑·밑단·포켓 입구 등 힘을 많이 받는 부위는 살짝 당겨 봉제선 들뜸과 실 튀김을 확인해 주세요. 시접 폭(몸판 1cm, 밑단 2cm 기준)과 되돌림 봉제·코너 보강 유무를 패턴과 대조하고, 박음실 쉐이드 차이는 같은 광원 아래에서 함께 점검해 불량 위치를 샘플에 표시합니다.',
      en: 'On the QC table, scan the face and back of the finished garment and gently stretch high-stress areas (shoulder, underarm, hem, pocket openings) to check for seam puckering and loose stitches. Compare seam-allowance width (body 1 cm, hem 2 cm) against the pattern, verify backstitching and corner reinforcement, check sewing-thread shade consistency under the same lighting, and mark defect locations on the sample.',
      vi: 'Trên bàn kiểm, rà cả mặt phải và mặt trái của sản phẩm và kéo nhẹ các vị trí chịu lực (vai, nách, lai, miệng túi) để phát hiện đường may bung hoặc chỉ lỏng. Đối chiếu độ rộng đường biên may (thân 1 cm, lai 2 cm) với rập, kiểm tra mũi lại và gia cố góc, so sánh sắc độ chỉ may dưới cùng ánh sáng, và đánh dấu vị trí lỗi lên sản phẩm.',
    },
  },
  fabric: {
    label: {
      ko: '원단 불량 (긁힘/오염/파손)',
      en: 'Fabric defect (abrasion / stain / tear)',
      vi: 'Lỗi vải (trầy/bẩn/rách)',
    },
    insight: {
      ko: '완성품을 검단대에 펼쳐 앞판·뒷판·소매 순서로 전수 육안 검사하고, 긁힘·오염·구멍·줄무늬가 보이면 위치와 길이를 기록해 4-Point System(≥3인치 = 4점)으로 점수화해 주세요. 노출도가 높은 부위(앞판 가슴·포켓·칼라)에 결함이 있으면 대체 재단 가능 여부를 판단해 따로 분류하고, 이염·타색 혼입은 같은 PO 내 최소 3장을 교차 확인합니다.',
      en: 'Spread the finished garment on the QC table and inspect face, back, and sleeves in order; when abrasions, stains, holes, or streaks appear, record the location and length and score the defect by the 4-Point System (≥3 in = 4 pts). If defects fall on highly visible zones (front body, chest, pockets, collar), separate them and judge whether re-cutting is possible, and cross-check color bleeding or cross-contamination on at least 3 garments from the same PO.',
      vi: 'Trải sản phẩm hoàn thiện trên bàn kiểm và kiểm tra toàn bộ thân trước, thân sau, tay áo theo thứ tự; khi thấy trầy, bẩn, lỗ hoặc sọc, ghi vị trí và chiều dài rồi chấm điểm theo 4-Point System (≥3 inch = 4 điểm). Nếu lỗi nằm ở vùng lộ (thân trước, ngực, túi, cổ), tách riêng và đánh giá khả năng cắt lại, đồng thời kiểm chéo hiện tượng dây màu hoặc lẫn màu trên ít nhất 3 sản phẩm cùng PO.',
    },
  },
  color: {
    label: {
      ko: '색상 차이 / 염색 불량',
      en: 'Color deviation / dyeing defect',
      vi: 'Sai màu / lỗi nhuộm',
    },
    insight: {
      ko: '승인 스와치를 항상 함께 두고 자연광과 매장 조명 두 가지 광원 아래에서 몸판·소매·칼라·포켓 등 주요 부위의 쉐이드를 비교해 주세요. 봉제로 이어지는 접합부(몸판-소매, 앞판-뒷판, 몸판-칼라)의 색상 단차를 우선 확인하고, 같은 PO 내 3장 이상을 가로로 이어 놓아 로트 간 편차와 얼룩·덜 염색 여부를 기록합니다.',
      en: 'Keep the approved swatch on hand at all times and compare shade on the body, sleeves, collar, and pockets under both daylight and store lighting. Prioritize shade steps at sewn junctions (body-to-sleeve, front-to-back, body-to-collar), line up at least 3 garments from the same PO side-by-side, and record inter-lot deviation together with any patchy or under-dyed areas.',
      vi: 'Luôn đặt swatch đã duyệt bên cạnh và so sắc độ ở thân, tay, cổ, túi dưới hai nguồn sáng: ánh sáng tự nhiên và ánh sáng cửa hàng. Ưu tiên kiểm tra chênh sắc ở các điểm nối may (thân-tay, thân trước-thân sau, thân-cổ), xếp liền nhau ít nhất 3 sản phẩm cùng PO để ghi độ lệch giữa các lô cũng như vùng loang và vùng nhuộm chưa đều.',
    },
  },
  print: {
    label: {
      ko: '프린트 / 자수 불량',
      en: 'Print / embroidery defect',
      vi: 'Lỗi in / thêu',
    },
    insight: {
      ko: '프린트·자수 위치가 패턴 좌표와 ±3mm 이내인지 자로 확인하고, 경계선·로고 주변을 가까이서 관찰해 번짐·끊김·실밥·실 풀림 유무를 기록해 주세요. 세탁 5회 후 크랙·탈색 여부와 자수 뒷면 오프닝·부착포(백스티치) 들뜸도 함께 점검하며, 같은 불량이 3장 이상 연속 발견되면 공정 이슈로 분류해 별도 보고합니다.',
      en: 'Use a ruler to confirm that print or embroidery placement is within ±3 mm of the pattern coordinates, and inspect edges and areas around logos up close for bleeding, gaps, loose threads, or unraveling. Check for cracking or fading after 5 washes along with backing-cloth lifting or openings on the embroidery reverse, and if the same defect appears on 3 or more consecutive garments, classify it as a process issue and report separately.',
      vi: 'Dùng thước xác nhận vị trí in/thêu lệch không quá ±3 mm so với tọa độ trên rập, và quan sát kỹ đường viền cùng khu vực quanh logo để phát hiện lem, đứt, đầu chỉ thừa hoặc tuột chỉ. Kiểm tra nứt/phai sau 5 lần giặt cùng hiện tượng bong lót thêu hoặc hở mặt sau; nếu cùng một lỗi xuất hiện trên 3 sản phẩm liên tiếp trở lên, xếp vào lỗi quy trình và báo cáo riêng.',
    },
  },
  accessory: {
    label: {
      ko: '부자재 불량 (지퍼/단추/라벨)',
      en: 'Trim defect (zipper / button / label)',
      vi: 'Lỗi phụ liệu (khóa/cúc/nhãn)',
    },
    insight: {
      ko: '지퍼는 끝까지 50회 왕복 작동해 슬라이더 걸림·치아 이탈·상하 마감 유무를 확인하고, 단추·스냅은 양손으로 당겨 탈락 여부를 점검해 주세요(성인복 기준 90N 이상, 아동복 70N 이상). 라벨·트림 롯트번호와 승인 거래처를 대조하고, 다른 부자재 혼입이 의심되면 샘플을 남긴 뒤 같은 PO에서 추가 5장을 확인합니다.',
      en: 'Run the zipper through 50 full open-close cycles to check for slider catches, tooth skipping, and proper top/bottom stops, and pull buttons and snaps by hand to confirm retention (≥90 N for adult wear, ≥70 N for kidswear). Cross-check label and trim lot numbers against the approved supplier, and when mixed trim is suspected, keep the sample and inspect 5 additional garments from the same PO.',
      vi: 'Kéo khóa đi hết hành trình 50 lần để kiểm tra kẹt slider, lệch răng và chốt trên/dưới, đồng thời kéo tay nút và nút bấm để xác nhận độ bám (≥90 N cho đồ người lớn, ≥70 N cho đồ trẻ em). Đối chiếu số lô nhãn và phụ liệu với nhà cung cấp đã duyệt; nếu nghi ngờ lẫn phụ liệu khác, giữ lại mẫu và kiểm tra thêm 5 sản phẩm cùng PO.',
    },
  },
  measurement: {
    label: {
      ko: '치수 불량 (스펙 이탈)',
      en: 'Measurement out-of-spec',
      vi: 'Lỗi thông số kích thước',
    },
    insight: {
      ko: '샘플을 평평하게 펼쳐 스펙 시트의 주요 POM 8부위(가슴·어깨·기장·소매길이·소매너비·밑단·암홀·목너비)를 메저로 측정하고, 스펙 대비 ±1cm 허용치 내인지 확인해 주세요. 같은 사이즈 3장 이상을 동일 방식으로 측정해 치우침 방향(예: 전반적으로 짧음)이 보이면 샘플과 함께 표로 남기고, 프레싱 수축이 의심되면 스팀 후 30분 안정화 뒤 재측정합니다.',
      en: 'Lay the sample flat and use a tape measure to check 8 key POMs from the spec sheet (chest, shoulder, length, sleeve length, sleeve width, hem, armhole, neck opening) within the ±1 cm tolerance. Measure at least 3 garments of the same size the same way, and when a bias direction shows up (e.g., all pieces running short), log it as a table alongside the sample; when pressing shrinkage is suspected, re-measure after 30 minutes of stabilization following steam.',
      vi: 'Trải phẳng sản phẩm và dùng thước dây đo 8 điểm POM chính trong bảng thông số (ngực, vai, dài áo, dài tay, rộng tay, lai, nách, vòng cổ) trong dung sai ±1 cm. Đo cùng cách trên ít nhất 3 sản phẩm cùng size; nếu xuất hiện hướng lệch (ví dụ tất cả đều ngắn hơn), lập bảng kèm mẫu; nếu nghi co do ủi, đo lại sau 30 phút ổn định sau khi xông hơi.',
    },
  },
  contamination: {
    label: {
      ko: '오염 / 이물질 혼입',
      en: 'Contamination / foreign matter',
      vi: 'Nhiễm bẩn / dị vật',
    },
    insight: {
      ko: '검단대 위 정면·이면을 형광등과 자연광 두 광원에서 훑어 얼룩·기름·분진·이물질을 위치와 함께 기록하고, 바늘·철심 혼입이 의심되면 금속검출기를 통과시켜 주세요. 같은 부위에서 오염이 반복되면 라인·공정·작업자별로 구분해 집계하고, 외관검사 AQL 2.5(Major) 기준으로 건수를 합산해 보고합니다.',
      en: 'Scan the face and back on the QC table under both fluorescent and daylight, log the location of stains, oil marks, dust, or foreign matter, and when needle or metal contamination is suspected, pass the garment through a needle detector. If the same zone is contaminated repeatedly, tally findings by line, process, and operator, and sum the count under the AQL 2.5 (Major) visual-inspection criterion in the report.',
      vi: 'Dưới ánh sáng huỳnh quang và ánh sáng tự nhiên, rà mặt phải và mặt trái trên bàn kiểm, ghi vị trí vết bẩn, dầu, bụi hoặc dị vật; nếu nghi lẫn kim hoặc kim loại, cho qua máy dò kim. Nếu cùng một vùng bị bẩn lặp lại, thống kê theo chuyền, công đoạn, công nhân, và tổng hợp số lỗi theo tiêu chí AQL 2.5 (Major) ngoại quan khi báo cáo.',
    },
  },
  labeling: {
    label: {
      ko: '라벨/케어라벨 오기재',
      en: 'Labeling / care-label error',
      vi: 'Lỗi nhãn / nhãn bảo quản',
    },
    insight: {
      ko: '케어라벨과 사이즈 라벨의 혼용률·원산지·KC마크·바코드가 스펙과 일치하는지 한 장씩 확인하고, 부착 위치(±5mm)와 봉제선 방향이 패턴과 같은지 점검해 주세요. 세탁 10회 후 인쇄 선명도 유지와 라벨 가장자리 들뜸·말림 여부를 함께 확인하고, 오기재 발견 시 같은 PO 전량을 대상으로 선별 재검 계획을 보고에 포함합니다.',
      en: 'Check each care label and size label piece by piece so that fiber content, country of origin, KC mark, and barcode match the spec, and verify the attachment position (±5 mm) and stitch direction against the pattern. Confirm print legibility and label-edge lifting or curling after 10 washes, and when a misprint is found, include a full-PO re-sort plan in the report.',
      vi: 'Kiểm tra từng nhãn bảo quản và nhãn size một sản phẩm một để thành phần, xuất xứ, dấu KC và mã vạch khớp với tiêu chuẩn, đồng thời xác nhận vị trí gắn (±5 mm) và hướng đường may so với rập. Kiểm tra độ rõ nét của chữ in và hiện tượng bong hoặc cong mép nhãn sau 10 lần giặt; khi phát hiện in sai, đưa vào báo cáo kế hoạch phân loại lại toàn bộ PO.',
    },
  },
  other: {
    label: { ko: '기타', en: 'Other', vi: 'Khác' },
    insight: {
      ko: '불량이 어떤 조건(세탁·마찰·압력·온도 등)에서 재현되는지 기록하고, 동일 PO 내 최소 5장을 추가 선별해 일회성 현상인지 공정 이슈인지 판단해 주세요. 재현 과정을 사진·측정값과 함께 남기고, 현장에서 확인이 어려운 항목은 외부 검사기관에 의뢰할 시험 항목과 샘플 수량을 보고서에 함께 기재합니다.',
      en: 'Record the conditions under which the defect reproduces (wash, friction, pressure, temperature, etc.) and pull at least 5 additional garments from the same PO to judge whether the issue is isolated or a process problem. Document the reproduction with photos and measurements, and for items that cannot be verified on-site, list the external-lab test items and sample quantities to commission in the report.',
      vi: 'Ghi lại điều kiện tái hiện lỗi (giặt, ma sát, áp lực, nhiệt độ…) và lấy thêm ít nhất 5 sản phẩm cùng PO để xác định đây là hiện tượng đơn lẻ hay vấn đề quy trình. Lưu lại quá trình tái hiện kèm ảnh và số liệu; với các hạng mục không thể kiểm tra tại chỗ, ghi rõ trong báo cáo các chỉ tiêu và số lượng mẫu cần gửi ra trung tâm kiểm định bên ngoài.',
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
