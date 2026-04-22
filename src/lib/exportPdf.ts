import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

async function renderPdf(el: HTMLElement): Promise<jsPDF> {
  // 3× scale → ~9 MP capture, near photographic quality for printed A4.
  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  return pdf;
}

export async function exportElementToPdf(el: HTMLElement, filename: string) {
  const pdf = await renderPdf(el);
  pdf.save(filename);
}

export async function renderElementToPdfBlob(
  el: HTMLElement,
  filename: string
): Promise<{ blob: Blob; filename: string }> {
  const pdf = await renderPdf(el);
  const blob = pdf.output('blob');
  return { blob, filename };
}
