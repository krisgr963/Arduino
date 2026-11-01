import { CircuitProject, ComponentDefinition } from '../types/circuit';

export interface ImageExportOptions {
  format: 'png' | 'svg';
  scale: 1 | 2 | 3; // 1x, 2x (Retina), 3x (Print 300DPI)
  background: 'dark' | 'white' | 'transparent' | 'blueprint';
  cropToContent: boolean;
  includeWatermark: boolean;
  includeNotes: boolean;
  customTitle?: string;
}

export interface CircuitBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding box of components, notes, and wires with padding.
 */
export function calculateCircuitBounds(
  project: CircuitProject,
  componentDefs: Map<string, ComponentDefinition>,
  padding = 60
): CircuitBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (project.components.length === 0 && (!project.notes || project.notes.length === 0)) {
    return { minX: 100, minY: 100, maxX: 900, maxY: 600, width: 800, height: 500 };
  }

  // Check all components
  project.components.forEach((comp) => {
    const def = componentDefs.get(comp.typeId);
    const w = def?.width || 80;
    const h = def?.height || 60;
    minX = Math.min(minX, comp.x);
    minY = Math.min(minY, comp.y);
    maxX = Math.max(maxX, comp.x + w);
    maxY = Math.max(maxY, comp.y + h);
  });

  // Check sticky notes if present
  if (project.notes && project.notes.length > 0) {
    project.notes.forEach((note) => {
      minX = Math.min(minX, note.x);
      minY = Math.min(minY, note.y);
      maxX = Math.max(maxX, note.x + (note.width || 180));
      maxY = Math.max(maxY, note.y + (note.height || 120));
    });
  }

  // Ensure reasonable minimum dimensions
  const contentWidth = Math.max(maxX - minX, 400);
  const contentHeight = Math.max(maxY - minY, 300);

  return {
    minX: Math.round(minX - padding),
    minY: Math.round(minY - padding),
    maxX: Math.round(maxX + padding),
    maxY: Math.round(maxY + padding),
    width: Math.round(contentWidth + padding * 2),
    height: Math.round(contentHeight + padding * 2),
  };
}

/**
 * Prepares a clean SVG element for export by removing interactive selection/temporary artifacts,
 * applying desired viewBox and background styling.
 */
export function prepareSvgForExport(
  originalSvg: SVGSVGElement,
  bounds: CircuitBounds,
  options: ImageExportOptions,
  project: CircuitProject
): SVGSVGElement {
  const clone = originalSvg.cloneNode(true) as SVGSVGElement;

  // 1. Reset root transforms and establish viewBox
  clone.removeAttribute('style');
  clone.style.transform = 'none';
  clone.style.transformOrigin = '0 0';
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  const viewBoxX = options.cropToContent ? bounds.minX : 0;
  const viewBoxY = options.cropToContent ? bounds.minY : 0;
  const viewBoxWidth = options.cropToContent ? bounds.width : 1600;
  const viewBoxHeight = options.cropToContent ? bounds.height : 1000;

  clone.setAttribute('viewBox', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);
  clone.setAttribute('width', `${viewBoxWidth}`);
  clone.setAttribute('height', `${viewBoxHeight}`);

  // 2. Set background
  let bgColor = 'transparent';
  if (options.background === 'dark') bgColor = '#090d16';
  else if (options.background === 'white') bgColor = '#ffffff';
  else if (options.background === 'blueprint') bgColor = '#0f172a';
  else if (options.background === 'transparent') bgColor = 'none';

  if (bgColor !== 'none') {
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', `${viewBoxX}`);
    bgRect.setAttribute('y', `${viewBoxY}`);
    bgRect.setAttribute('width', `${viewBoxWidth}`);
    bgRect.setAttribute('height', `${viewBoxHeight}`);
    bgRect.setAttribute('fill', bgColor);
    clone.insertBefore(bgRect, clone.firstChild);
  }

  // 3. Remove temporary interactive UI elements (like marquee selection, wire drawing cursors)
  const tempElements = clone.querySelectorAll('.pointer-events-none.animate-pulse, [stroke-dasharray="4 3"]');
  tempElements.forEach((el) => {
    // If it's a selection box, remove it
    if (el.tagName === 'rect' && el.getAttribute('stroke') === '#3b82f6') {
      el.remove();
    }
  });

  // Filter out sticky notes if option is disabled
  if (!options.includeNotes) {
    const notesLayer = clone.querySelector('#notes-layer');
    if (notesLayer) notesLayer.remove();
  }

  // 4. Optional Watermark & Project Info footer
  if (options.includeWatermark) {
    const footerG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    footerG.setAttribute('id', 'export-watermark');
    footerG.setAttribute('transform', `translate(${viewBoxX + 16}, ${viewBoxY + viewBoxHeight - 16})`);

    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '0');
    titleText.setAttribute('y', '0');
    titleText.setAttribute('font-family', 'ui-sans-serif, system-ui, sans-serif');
    titleText.setAttribute('font-size', '11');
    titleText.setAttribute('font-weight', '600');
    titleText.setAttribute(
      'fill',
      options.background === 'white' ? '#475569' : '#94a3b8'
    );
    titleText.textContent = `⚡ CircuLab Fritzing Designer • ${project.name || 'Kretsdesign'} • ${new Date().toLocaleDateString('nb-NO')}`;

    footerG.appendChild(titleText);
    clone.appendChild(footerG);
  }

  return clone;
}

/**
 * Generates an SVG string ready for saving or embedding.
 */
export function generateSvgString(
  svgElement: SVGSVGElement,
  bounds: CircuitBounds,
  options: ImageExportOptions,
  project: CircuitProject
): string {
  const preparedSvg = prepareSvgForExport(svgElement, bounds, options, project);
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(preparedSvg);

  // Ensure standalone XML declaration
  if (!svgString.startsWith('<?xml')) {
    svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
  }

  return svgString;
}

/**
 * Exports the circuit as a High-Resolution PNG file.
 */
export async function exportToPng(
  svgElement: SVGSVGElement,
  bounds: CircuitBounds,
  options: ImageExportOptions,
  project: CircuitProject
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    try {
      const preparedSvg = prepareSvgForExport(svgElement, bounds, options, project);
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(preparedSvg);

      const baseWidth = options.cropToContent ? bounds.width : 1600;
      const baseHeight = options.cropToContent ? bounds.height : 1000;
      const targetWidth = Math.round(baseWidth * options.scale);
      const targetHeight = Math.round(baseHeight * options.scale);

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          URL.revokeObjectURL(blobURL);
          reject(new Error('Canvas context could not be created'));
          return;
        }

        // Configure high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Background fill if specified
        if (options.background === 'dark') {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (options.background === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        } else if (options.background === 'blueprint') {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Draw SVG onto scaled Canvas
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(blobURL);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to encode PNG blob'));
              return;
            }
            const dataUrl = canvas.toDataURL('image/png');
            resolve({ dataUrl, blob, width: targetWidth, height: targetHeight });
          },
          'image/png',
          1.0
        );
      };

      image.onerror = (err) => {
        URL.revokeObjectURL(blobURL);
        reject(err);
      };

      image.src = blobURL;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Downloads a Blob or data URL as a file with the given filename.
 */
export function downloadFile(content: Blob | string, filename: string, mimeType = 'image/png') {
  let url: string;
  let shouldRevoke = false;

  if (content instanceof Blob) {
    url = URL.createObjectURL(content);
    shouldRevoke = true;
  } else if (content.startsWith('data:') || content.startsWith('blob:')) {
    url = content;
  } else {
    const blob = new Blob([content], { type: mimeType });
    url = URL.createObjectURL(blob);
    shouldRevoke = true;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (shouldRevoke) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Copies a PNG blob directly to the system clipboard.
 */
export async function copyPngToClipboard(blob: Blob): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    return false;
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ]);
    return true;
  } catch (err) {
    console.warn('Could not copy image to clipboard:', err);
    return false;
  }
}

/**
 * Copies an SVG string directly to the clipboard as text.
 */
export async function copySvgToClipboard(svgString: string): Promise<boolean> {
  if (!navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(svgString);
    return true;
  } catch (err) {
    console.warn('Could not copy SVG text to clipboard:', err);
    return false;
  }
}
