import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportDocumentToPdf(
  elementIds: string[],
  fileName: string = 'วาระงานผู้บริหารจังหวัดลพบุรี.pdf',
  onProgress?: (status: boolean) => void
): Promise<void> {
  try {
    if (onProgress) onProgress(true);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 297; // A4 landscape width in mm
    const pageHeight = 210; // A4 landscape height in mm
    const margin = 8; // 8mm margin
    const targetWidth = pageWidth - margin * 2; // 281mm
    const targetHeight = pageHeight - margin * 2; // 194mm

    let pagesRendered = 0;

    for (let i = 0; i < elementIds.length; i++) {
      const el = document.getElementById(elementIds[i]);
      if (!el) continue;

      // Temporarily hide .no-print elements
      const noPrintEls = el.querySelectorAll('.no-print');
      noPrintEls.forEach((item) => {
        (item as HTMLElement).style.setProperty('display', 'none', 'important');
      });

      // Temporarily ensure desktop-width rendering so table columns don't compress on mobile screens
      const originalWidth = el.style.width;
      const originalMaxWidth = el.style.maxWidth;
      const originalBoxShadow = el.style.boxShadow;
      const originalBorder = el.style.border;

      el.style.width = '1200px';
      el.style.maxWidth = '1200px';
      el.style.boxShadow = 'none';
      el.style.border = 'none';

      const canvas = await html2canvas(el, {
        scale: 2, // 2x resolution for sharp TH Sarabun typography
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 1280,
      });

      // Restore original element styles
      el.style.width = originalWidth;
      el.style.maxWidth = originalMaxWidth;
      el.style.boxShadow = originalBoxShadow;
      el.style.border = originalBorder;

      // Restore .no-print elements
      noPrintEls.forEach((item) => {
        (item as HTMLElement).style.removeProperty('display');
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (pagesRendered > 0) {
        pdf.addPage('a4', 'landscape');
      }

      // Calculate aspect ratio fit to A4 landscape
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;

      let renderWidth = targetWidth;
      let renderHeight = renderWidth / ratio;

      if (renderHeight > targetHeight) {
        renderHeight = targetHeight;
        renderWidth = renderHeight * ratio;
      }

      // Center horizontally and vertically on A4 page
      const xOffset = margin + (targetWidth - renderWidth) / 2;
      const yOffset = margin + (targetHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
      pagesRendered++;
    }

    if (pagesRendered > 0) {
      pdf.save(fileName);
    } else {
      // Fallback
      window.print();
    }
  } catch (error) {
    console.error('PDF export error:', error);
    // Fallback to window.print if html2canvas/jspdf encounters an error
    window.print();
  } finally {
    if (onProgress) onProgress(false);
  }
}
