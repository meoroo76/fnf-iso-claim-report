import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  TextRun,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import type { ReportState, ThirdLang } from '../types';
import { THIRD_LANG_LABELS } from '../types';
import { DEFECT_CATALOG } from '../data/defectCatalog';

function catalogLabel(category: keyof typeof DEFECT_CATALOG, lang: ThirdLang): string {
  const c = DEFECT_CATALOG[category];
  return lang === 'vi' ? c.label.vi : c.label.en;
}
function catalogInsight(category: keyof typeof DEFECT_CATALOG, lang: ThirdLang): string {
  const c = DEFECT_CATALOG[category];
  return lang === 'vi' ? c.insight.vi : c.insight.en;
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1] ?? '';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function plainCell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, size: 18 })] })],
  });
}

export async function exportReportToDocx(state: ReportState): Promise<void> {
  const {
    product,
    defects,
    defectPhotos,
    careLabelPhotos,
    translations,
    productionGuidance,
    thirdLanguage,
  } = state;
  if (!product) return;
  const thirdMeta = THIRD_LANG_LABELS[thirdLanguage];

  const totalDefectQty = defects.reduce((acc, d) => acc + d.qty, 0);
  const defectRate = ((totalDefectQty / product.receivedQty) * 100).toFixed(2);

  const header = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: 'F&F CORPORATION · QUALITY ASSURANCE',
          bold: true,
          color: 'C8102E',
          size: 16,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: 'ISO Claim Report', size: 56, bold: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Claim No. ${state.claimNo}   ·   Date ${state.inspectionDate}   ·   Inspector ${state.inspector || '-'}`,
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableRow('Brand', product.brand),
      tableRow('Style (품번)', product.styleCode),
      tableRow('Supplier (협력사)', `${product.supplier} · ${product.supplierVendorCode}`),
      tableRow('Color (칼라)', `${product.color} (${product.colorCode})`),
      tableRow('Category / Season', `${product.category} · ${product.season}`),
      tableRow('PO Number', product.poNumber),
      tableRow('Received Qty (입고수량)', `${product.receivedQty.toLocaleString()} pcs`),
      tableRow('Defect Qty / Rate', `${totalDefectQty.toLocaleString()} pcs · ${defectRate}%`),
    ],
  });

  const defectHeader = new TableRow({
    tableHeader: true,
    children: [
      plainCell('#', true),
      plainCell('Qty', true),
      plainCell('한국어 (KO)', true),
      plainCell('English (EN)', true),
      plainCell(`${thirdMeta.native} (${thirdLanguage.toUpperCase()})`, true),
    ],
  });

  const defectRows = defects.map((d, i) => {
    const cat = DEFECT_CATALOG[d.category];
    const tl = translations[d.detailKo.trim()];
    const thirdText = tl?.[thirdLanguage] ?? d.detailKo;
    const thirdLabel = catalogLabel(d.category, thirdLanguage);
    return new TableRow({
      children: [
        plainCell(String(i + 1)),
        plainCell(String(d.qty)),
        plainCell(`${cat.label.ko}\n${d.detailKo}`),
        plainCell(`${cat.label.en}\n${tl?.en ?? d.detailKo}`),
        plainCell(`${thirdLabel}\n${thirdText}`),
      ],
    });
  });

  const defectTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [defectHeader, ...defectRows],
  });

  const categories = Array.from(new Set(defects.map((d) => d.category)));
  const insightBlocks: Paragraph[] = [];
  const langSlots: Array<'ko' | 'en' | ThirdLang> = ['ko', 'en', thirdLanguage];
  langSlots.forEach((lang) => {
    const langTitle =
      lang === 'ko' ? '· 한국어' : lang === 'en' ? '· English' : `· ${thirdMeta.native}`;
    insightBlocks.push(
      new Paragraph({
        children: [
          new TextRun({ text: langTitle, bold: true, size: 20, color: 'C8102E' }),
        ],
      })
    );
    categories.forEach((c) => {
      const label =
        lang === 'ko'
          ? DEFECT_CATALOG[c].label.ko
          : lang === 'en'
          ? DEFECT_CATALOG[c].label.en
          : catalogLabel(c, thirdLanguage);
      const insight =
        lang === 'ko'
          ? DEFECT_CATALOG[c].insight.ko
          : lang === 'en'
          ? DEFECT_CATALOG[c].insight.en
          : catalogInsight(c, thirdLanguage);
      insightBlocks.push(
        new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `${label}: `, bold: true, size: 18 }),
            new TextRun({ text: insight, size: 18 }),
          ],
        })
      );
    });
    insightBlocks.push(new Paragraph({ text: '' }));
  });

  const imageParagraphs: Paragraph[] = [];
  if (defectPhotos.length > 0) {
    imageParagraphs.push(sectionTitle('Defect Evidence · 불량 사진'));
    for (const p of defectPhotos.slice(0, 6)) {
      try {
        imageParagraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: dataUrlToUint8(p.dataUrl),
                transformation: { width: 220, height: 160 },
                type: 'png',
              } as any),
            ],
          })
        );
      } catch {
        // Skip if image conversion fails
      }
    }
  }
  if (careLabelPhotos.length > 0) {
    imageParagraphs.push(sectionTitle('Care Label · 케어라벨 (검사번호)'));
    for (const p of careLabelPhotos.slice(0, 6)) {
      try {
        imageParagraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: dataUrlToUint8(p.dataUrl),
                transformation: { width: 180, height: 120 },
                type: 'png',
              } as any),
            ],
          })
        );
      } catch {
        // Skip
      }
    }
  }

  const guidanceBlocks: Paragraph[] = [];
  if (productionGuidance) {
    const guidanceSlots: Array<'ko' | 'en' | ThirdLang> = ['ko', 'en', thirdLanguage];
    guidanceSlots.forEach((lang) => {
      const langTitle =
        lang === 'ko' ? '· 한국어' : lang === 'en' ? '· English' : `· ${thirdMeta.native}`;
      guidanceBlocks.push(
        new Paragraph({
          children: [
            new TextRun({ text: langTitle, bold: true, size: 20, color: 'C8102E' }),
          ],
        })
      );
      guidanceBlocks.push(
        new Paragraph({
          children: [new TextRun({ text: productionGuidance[lang] ?? '', size: 18 })],
        })
      );
      guidanceBlocks.push(new Paragraph({ text: '' }));
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri' } },
      },
    },
    sections: [
      {
        children: [
          ...header,
          sectionTitle('Product Information'),
          infoTable,
          new Paragraph({ text: '' }),
          sectionTitle('Defect Findings · 불량 내역 · Chi tiết lỗi'),
          defectTable,
          new Paragraph({ text: '' }),
          ...(productionGuidance
            ? [
                sectionTitle(
                  'Production Cautions · 생산 주의사항 · Lưu ý sản xuất (AI · Claude)'
                ),
                ...guidanceBlocks,
              ]
            : []),
          sectionTitle('Corrective Action Insights · 조치 인사이트 · Đề xuất khắc phục'),
          ...insightBlocks,
          ...imageParagraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ISO_Claim_Report_${state.claimNo || product.styleCode}.docx`);
}

function tableRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 18, color: '6B7280' })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
      }),
    ],
  });
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'C8102E', space: 2 },
    },
    children: [
      new TextRun({ text, bold: true, size: 22, color: 'C8102E' }),
    ],
  });
}
