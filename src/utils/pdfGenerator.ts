import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Pre-convert images inside the element to inline base64 data URLs
 * to completely prevent html2canvas CORS / tainted canvas SecurityError.
 */
async function ensureImagesLoaded(element: HTMLElement): Promise<void> {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(async (img) => {
    try {
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
      if (img.src && !img.src.startsWith('data:')) {
        const response = await fetch(img.src);
        const blob = await response.blob();
        await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              img.setAttribute('data-original-src', img.src);
              img.src = reader.result;
            }
            resolve(true);
          };
          reader.onerror = () => resolve(false);
          reader.readAsDataURL(blob);
        });
      }
    } catch {
      // Continue even if an image prefetch fails
    }
  });
  await Promise.all(promises);
}

function restoreImages(element: HTMLElement) {
  const images = element.querySelectorAll<HTMLImageElement>('img[data-original-src]');
  images.forEach((img) => {
    const orig = img.getAttribute('data-original-src');
    if (orig) {
      img.src = orig;
      img.removeAttribute('data-original-src');
    }
  });
}

/**
 * Direct file download trigger that works reliably across all browsers and devices,
 * especially iOS (iPhone / iPad) where standard anchor download can be blocked or hidden in Safari downloads.
 */
async function triggerFileDownload(blob: Blob, fileName: string) {
  // Check if device is iOS (iPhone/iPad/iPod or iPad on iOS 13+)
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  // 1. Try iOS / Mobile Web Share API first (Opens standard iOS Share sheet with 'Save to Files', AirDrop, LINE, etc.)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
        });
        return;
      }
    } catch (shareErr) {
      // User cancelled share or share not supported, continue to fallback
      if ((shareErr as Error).name === 'AbortError') {
        return;
      }
    }
  }

  // 2. Standard direct anchor download
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.setAttribute('download', fileName);
  anchor.style.display = 'none';

  if (isIOS) {
    // In iOS Safari, target="_blank" ensures the PDF opens in a new tab if direct download is silently queued
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }

  document.body.appendChild(anchor);
  anchor.click();

  // 3. For iOS Safari fallback, if user is in in-app browser or anchor didn't prompt, open blob URL directly
  if (isIOS) {
    setTimeout(() => {
      window.open(url, '_blank');
    }, 400);
  }

  setTimeout(() => {
    if (anchor.parentNode) {
      anchor.parentNode.removeChild(anchor);
    }
    // Clean up URL object after sufficient time for iOS viewer to load
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  }, 1500);
}

export async function exportDocumentToPdf(
  elementIds: string[],
  fileName: string = 'ระบบนัดหมายงานผู้บริหารจังหวัดลพบุรี.pdf',
  onProgress?: (status: boolean) => void,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<boolean> {
  try {
    if (onProgress) onProgress(true);

    const isPortrait = orientation === 'portrait';

    const pdf = new jsPDF({
      orientation: isPortrait ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = isPortrait ? 210 : 297; // A4 width in mm
    const pageHeight = isPortrait ? 297 : 210; // A4 height in mm
    const margin = 8; // 8mm margin
    const targetWidth = pageWidth - margin * 2;
    const targetHeight = pageHeight - margin * 2;

    let pagesRendered = 0;

    for (let i = 0; i < elementIds.length; i++) {
      const el = document.getElementById(elementIds[i]);
      if (!el) continue;

      // Ensure element is visible during capture
      const originalDisplay = el.style.display;
      if (window.getComputedStyle(el).display === 'none') {
        el.style.display = 'block';
      }

      // Temporarily hide .no-print elements
      const noPrintEls = el.querySelectorAll('.no-print');
      noPrintEls.forEach((item) => {
        (item as HTMLElement).style.setProperty('display', 'none', 'important');
      });

      // Temporarily ensure high-resolution desktop width for sharp typography
      const originalWidth = el.style.width;
      const originalMaxWidth = el.style.maxWidth;
      const originalMinWidth = el.style.minWidth;
      const originalBoxShadow = el.style.boxShadow;
      const originalBorder = el.style.border;

      const captureWidth = isPortrait ? '850px' : '1200px';

      el.style.width = captureWidth;
      el.style.maxWidth = captureWidth;
      el.style.minWidth = captureWidth;
      el.style.boxShadow = 'none';
      el.style.border = 'none';

      // Pre-load and convert images to data URLs to guarantee zero canvas tainting
      await ensureImagesLoaded(el);

      const canvas = await html2canvas(el, {
        scale: 2, // 2x sharp resolution for TH Sarabun typography
        useCORS: true,
        allowTaint: false, // Must be false so toDataURL never throws SecurityError
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: isPortrait ? 900 : 1280,
        onclone: (_clonedDoc, clonedEl) => {
          // Remove all non-printable buttons and tools
          clonedEl.querySelectorAll('.no-print').forEach((item) => {
            (item as HTMLElement).remove();
          });

          // Style official tables cleanly to prevent rendering glitches
          clonedEl.querySelectorAll('.official-table').forEach((table) => {
            const tbl = table as HTMLTableElement;
            tbl.style.borderCollapse = 'collapse';
            tbl.style.borderSpacing = '0';
            tbl.style.border = '1.5px solid #000000';
            tbl.style.backgroundColor = '#ffffff';
          });

          // Ensure <tr> has NO borders or shadows that could bleed across rowspan cells
          clonedEl.querySelectorAll('.official-table tr').forEach((row) => {
            const r = row as HTMLTableRowElement;
            r.style.border = 'none';
            r.style.borderTop = 'none';
            r.style.borderBottom = 'none';
            r.style.boxShadow = 'none';
            r.style.outline = 'none';
          });

          // Explicitly set 1.5px solid black on all th and td
          clonedEl.querySelectorAll('.official-table th, .official-table td').forEach((cell) => {
            const c = cell as HTMLElement;
            c.style.border = '1.5px solid #000000';
            c.style.borderColor = '#000000';
            c.style.backgroundColor = '#ffffff';
            c.style.boxShadow = 'none';
          });

          // For cells with rowspan > 1 (e.g. executive name column), explicitly clear internal line artifacts
          clonedEl.querySelectorAll('.official-table td[rowspan]').forEach((cell) => {
            const c = cell as HTMLElement;
            c.style.backgroundColor = '#ffffff';
            c.style.zIndex = '2';
          });
        },
      });

      // Restore images
      restoreImages(el);

      // Restore element original styles
      el.style.width = originalWidth;
      el.style.maxWidth = originalMaxWidth;
      el.style.minWidth = originalMinWidth;
      el.style.boxShadow = originalBoxShadow;
      el.style.border = originalBorder;
      el.style.display = originalDisplay;

      // Restore .no-print elements
      noPrintEls.forEach((item) => {
        (item as HTMLElement).style.removeProperty('display');
      });

      const imgData = canvas.toDataURL('image/png');

      if (pagesRendered > 0) {
        pdf.addPage('a4', isPortrait ? 'portrait' : 'landscape');
      }

      // Explicitly fill entire page background with pure white #FFFFFF
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

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

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
      pagesRendered++;
    }

    if (pagesRendered > 0) {
      // 1. Direct Blob Download (Saves straight to local computer / device Downloads folder, iOS Files, or native share)
      const pdfBlob = pdf.output('blob');
      await triggerFileDownload(pdfBlob, fileName);

      // 2. Also execute pdf.save as secondary fallback
      try {
        pdf.save(fileName);
      } catch (saveErr) {
        console.warn('pdf.save note:', saveErr);
      }

      return true;
    } else {
      console.warn('No document elements found to render for PDF.');
      return false;
    }
  } catch (error) {
    console.error('PDF export error:', error);
    return false;
  } finally {
    if (onProgress) onProgress(false);
  }
}
