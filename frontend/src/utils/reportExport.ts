/**
 * Shared report-export machinery (html2canvas capture + jsPDF multi-page slicing).
 * Extracted from MonitorReportModal so fleet-level reports reuse the same
 * pixel-identical pipeline. Slice breakpoints are derived from the report's
 * section/table CSS classes so rows never split across PDF pages.
 */

export function sanitizeFileName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'monitor-report';
}

export function createWhiteCanvasSlice(sourceCanvas: HTMLCanvasElement, sourceY: number, sourceHeight: number) {
  const sliceCanvas = document.createElement('canvas');
  sliceCanvas.width = sourceCanvas.width;
  sliceCanvas.height = sourceHeight;

  const context = sliceCanvas.getContext('2d');
  if (!context) throw new Error('Could not prepare PDF page');

  context.fillStyle = '#FFFDFB';
  context.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
  context.drawImage(
    sourceCanvas,
    0,
    sourceY,
    sourceCanvas.width,
    sourceHeight,
    0,
    0,
    sourceCanvas.width,
    sourceHeight,
  );

  return sliceCanvas;
}

const DEFAULT_BREAK_SELECTOR = '.monitor-report-header, .report-meta-row, .report-section, .report-check-table tr';

export function getCanvasBreakpoints(
  reportElement: HTMLElement,
  canvas: HTMLCanvasElement,
  selector: string = DEFAULT_BREAK_SELECTOR,
) {
  const reportRect = reportElement.getBoundingClientRect();
  const scale = canvas.width / reportElement.scrollWidth;
  const elements = reportElement.querySelectorAll<HTMLElement>(selector);
  const breakpoints = Array.from(elements)
    .map((element) => Math.round((element.getBoundingClientRect().top - reportRect.top) * scale))
    .filter((top) => top > 0 && top < canvas.height);

  return Array.from(new Set(breakpoints)).sort((a, b) => a - b);
}

export function getNextPdfSliceHeight(
  canvas: HTMLCanvasElement,
  breakpoints: number[],
  sourceY: number,
  idealPageHeight: number,
) {
  const remainingHeight = canvas.height - sourceY;
  if (remainingHeight <= idealPageHeight) return remainingHeight;

  const target = sourceY + idealPageHeight;
  const minimumUsefulBreak = sourceY + idealPageHeight * 0.45;
  const breakPadding = 28;
  const safeBreakCandidates = breakpoints.filter(
    (point) => point > minimumUsefulBreak && point < target - breakPadding,
  );
  const safeBreak = safeBreakCandidates[safeBreakCandidates.length - 1];

  return Math.max(120, (safeBreak ?? target) - sourceY);
}

export async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas');
  const exportScale = Math.min(Math.max(window.devicePixelRatio || 1, 2), 3);

  document.body.classList.add('exporting-report');
  try {
    return await html2canvas(element, {
      backgroundColor: '#FFFDFB',
      height: element.scrollHeight,
      onclone: (documentClone) => {
        documentClone.body.classList.add('exporting-report');
      },
      removeContainer: true,
      scale: exportScale,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      width: element.scrollWidth,
      windowHeight: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });
  } finally {
    document.body.classList.remove('exporting-report');
  }
}

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  breakSelector?: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const canvas = await captureElement(element);
  const pdf = new jsPDF({
    compress: true,
    format: 'a4',
    orientation: 'portrait',
    unit: 'pt',
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const idealPageHeight = Math.floor((contentHeight * canvas.width) / contentWidth);
  const breakpoints = getCanvasBreakpoints(element, canvas, breakSelector);
  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = getNextPdfSliceHeight(canvas, breakpoints, sourceY, idealPageHeight);
    const sliceCanvas = createWhiteCanvasSlice(canvas, sourceY, sliceHeight);
    const imageData = sliceCanvas.toDataURL('image/png');
    const imageHeight = (sliceHeight * contentWidth) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.setFillColor(255, 253, 251);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.addImage(imageData, 'PNG', margin, margin, contentWidth, imageHeight, undefined, 'FAST');

    sourceY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(`${fileName}.pdf`);
}
