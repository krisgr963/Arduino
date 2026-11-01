import { jsPDF } from 'jspdf';
import { CircuitProject, ComponentDefinition } from '../types/circuit';

export interface PDFExportOptions {
  includeVisualPreview: boolean;
  includeBOM: boolean;
  includeNotes: boolean;
  includeWiring: boolean;
  orientation: 'portrait' | 'landscape';
  canvasSvgElement?: SVGSVGElement | null;
}

/**
 * Converts an SVG element to a PNG Data URL using an offscreen canvas.
 */
export async function svgToPngDataUrl(svgElement: SVGSVGElement): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
      
      // Determine dimensions
      const bbox = svgElement.getBBox ? svgElement.getBBox() : { width: 1200, height: 800 };
      const width = Math.max(bbox.width + 100, 1000);
      const height = Math.max(bbox.height + 100, 700);

      svgClone.setAttribute('width', `${width}`);
      svgClone.setAttribute('height', `${height}`);
      svgClone.style.backgroundColor = '#090d16';

      const xml = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(blobURL);
          resolve(null);
          return;
        }

        // Fill background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(image, 0, 0);

        URL.revokeObjectURL(blobURL);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      };

      image.onerror = () => {
        URL.revokeObjectURL(blobURL);
        resolve(null);
      };

      image.src = blobURL;
    } catch (err) {
      console.warn('Could not rasterize SVG to PNG:', err);
      resolve(null);
    }
  });
}

/**
 * Generates and downloads a PDF document containing the circuit diagram,
 * component BOM table, notes, and wiring connections.
 */
export async function exportCircuitToPDF(
  project: CircuitProject,
  componentDefs: Map<string, ComponentDefinition>,
  options: PDFExportOptions
): Promise<void> {
  const isLandscape = options.orientation === 'landscape';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // Color Palette
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue 600
  const headerBgColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const textDarkColor: [number, number, number] = [30, 41, 59]; // Slate 800
  const textMutedColor: [number, number, number] = [100, 116, 139]; // Slate 500
  const borderColor: [number, number, number] = [203, 213, 225]; // Slate 300

  // Helper: Draw running page footer
  const drawPageFooter = (pageNum: number, totalPages?: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMutedColor);
    const dateStr = new Date().toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`CircuLab Fritzing Designer - ${project.name} | Generert: ${dateStr}`, margin, pageHeight - 8);
    const pageStr = totalPages ? `Side ${pageNum} av ${totalPages}` : `Side ${pageNum}`;
    doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // 1. PAGE 1: HEADER & OVERVIEW
  // Top Banner
  doc.setFillColor(...headerBgColor);
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  // CircuLab Brand Pill
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin + 4, currentY + 4, 28, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('CIRCULAB', margin + 18, currentY + 8.5, { align: 'center' });

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(project.name || 'Kretsdesign', margin + 36, currentY + 9);

  // Subtitle / Date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  const projectDate = new Date(project.updatedAt || Date.now()).toLocaleDateString('nb-NO');
  doc.text(`Kretsdokumentasjon & Komponentspesifikasjon | Revidert: ${projectDate} | Versjon: ${project.version || '1.0'}`, margin + 4, currentY + 19);

  currentY += 28;

  // Project Summary Statistics Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  const compCount = project.components.length;
  const wireCount = project.wires.length;
  const noteCount = (project.notes || []).length;
  const layerCount = (project.layers || []).length || 3;

  const statWidth = contentWidth / 4;
  const stats = [
    { label: 'KOMPONENTER', val: `${compCount} stk` },
    { label: 'LEDNINGSKOBLINGER', val: `${wireCount} stk` },
    { label: 'NOTATER / VEDLEGG', val: `${noteCount} stk` },
    { label: 'ORGANISERTE LAG', val: `${layerCount} lag` },
  ];

  stats.forEach((st, idx) => {
    const xPos = margin + idx * statWidth + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMutedColor);
    doc.text(st.label, xPos, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...textDarkColor);
    doc.text(st.val, xPos, currentY + 13);
  });

  currentY += 22;

  // 2. VISUAL CIRCUIT DIAGRAM PREVIEW (If enabled and captured)
  if (options.includeVisualPreview && options.canvasSvgElement) {
    try {
      const pngData = await svgToPngDataUrl(options.canvasSvgElement);
      if (pngData) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...textDarkColor);
        doc.text('Visuell Kretsillustrasjon (Koblingsbilde)', margin, currentY + 4);

        currentY += 7;

        // Image dimensions
        const maxImgHeight = isLandscape ? pageHeight - currentY - 20 : 90;
        const imgAspect = 1200 / 750;
        let imgW = contentWidth;
        let imgH = imgW / imgAspect;

        if (imgH > maxImgHeight) {
          imgH = maxImgHeight;
          imgW = imgH * imgAspect;
        }

        // Draw image frame
        doc.setFillColor(9, 13, 22); // Canvas dark background
        doc.roundedRect(margin, currentY, contentWidth, imgH, 2, 2, 'F');
        doc.addImage(pngData, 'PNG', margin + (contentWidth - imgW) / 2, currentY, imgW, imgH);

        currentY += imgH + 10;
      }
    } catch (err) {
      console.warn('Failed to embed circuit snapshot in PDF:', err);
    }
  }

  // Draw footer for Page 1
  drawPageFooter(1);

  // 3. PAGE 2: COMPONENT TABLE (BOM / BILL OF MATERIALS)
  if (options.includeBOM && project.components.length > 0) {
    doc.addPage();
    currentY = margin;
    let pageNum = 2;

    // Section Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Stykkliste & Komponentoversikt (Bill of Materials)', margin, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMutedColor);
    doc.text('Komplett spesifikasjon over kretsens komponenter, parametere og datablad-referanser', margin, currentY + 10);

    currentY += 15;

    // Table Header
    const colWidths = {
      label: 24,
      name: 50,
      category: 35,
      specs: 50,
      datasheet: contentWidth - (24 + 50 + 35 + 50),
    };

    const drawTableHeader = (y: number) => {
      doc.setFillColor(241, 245, 249); // Slate 100
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(...borderColor);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...textDarkColor);

      let x = margin + 2;
      doc.text('REF / LABEL', x, y + 5);
      x += colWidths.label;
      doc.text('KOMPONENTNAVN', x, y + 5);
      x += colWidths.name;
      doc.text('KATEGORI', x, y + 5);
      x += colWidths.category;
      doc.text('PARAMETERE / EGENSKAPER', x, y + 5);
      x += colWidths.specs;
      doc.text('DATABLAD / REFERANSE', x, y + 5);
    };

    drawTableHeader(currentY);
    currentY += 7;

    // Rows
    project.components.forEach((comp, idx) => {
      // Check if page overflow
      if (currentY > pageHeight - 20) {
        drawPageFooter(pageNum);
        doc.addPage();
        pageNum++;
        currentY = margin;
        drawTableHeader(currentY);
        currentY += 7;
      }

      const def = componentDefs.get(comp.typeId);
      const isEven = idx % 2 === 0;

      // Row background
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 8, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...textDarkColor);

      let x = margin + 2;
      // 1. Label
      doc.text(comp.label || `C${idx + 1}`, x, currentY + 5.5);
      x += colWidths.label;

      // 2. Name
      doc.setFont('helvetica', 'normal');
      const compName = doc.splitTextToSize(def?.name || comp.typeId, colWidths.name - 3);
      doc.text(compName[0] || '', x, currentY + 5.5);
      x += colWidths.name;

      // 3. Category
      doc.text(def?.category || 'Standard', x, currentY + 5.5);
      x += colWidths.category;

      // 4. Specs
      let specSummary = '';
      if (comp.properties) {
        if (comp.properties.resistance) specSummary = `${comp.properties.resistance} Ω`;
        else if (comp.properties.voltage) specSummary = `${comp.properties.voltage}V`;
        else if (comp.properties.color) specSummary = `Farge: ${comp.properties.color}`;
        else if (comp.properties.nominalVoltage) specSummary = `${comp.properties.nominalVoltage}V`;
      }
      doc.text(specSummary || '-', x, currentY + 5.5);
      x += colWidths.specs;

      // 5. Datasheet
      const dsUrl = comp.datasheetUrl || def?.datasheetUrl;
      if (dsUrl) {
        doc.setTextColor(...primaryColor);
        doc.textWithLink('Åpne datablad >', x, currentY + 5.5, { url: dsUrl });
      } else {
        doc.setTextColor(...textMutedColor);
        doc.text('-', x, currentY + 5.5);
      }

      currentY += 8;
    });

    drawPageFooter(pageNum);
  }

  // 4. SECTION: NOTES & DOCUMENTATION
  if (options.includeNotes && (project.notes && project.notes.length > 0)) {
    doc.addPage();
    currentY = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Kretsnotater & Arbeidsdokumentasjon', margin, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMutedColor);
    doc.text('Klistrelapper og forklaringer lagt inn under designprosessen', margin, currentY + 10);

    currentY += 15;

    project.notes.forEach((note, idx) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }

      // Sticky note box representation
      doc.setFillColor(254, 240, 138); // Yellow 200
      doc.setDrawColor(234, 179, 8); // Yellow 500
      doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(113, 63, 18); // Yellow 900
      doc.text(`Notat #${idx + 1}:`, margin + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const splitText = doc.splitTextToSize(note.text, contentWidth - 8);
      doc.text(splitText.slice(0, 3), margin + 4, currentY + 11);

      currentY += 26;
    });
  }

  // 5. SECTION: WIRING SCHEDULE (Nettliste)
  if (options.includeWiring && project.wires.length > 0) {
    // If not much space left, add page
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    } else {
      currentY += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.text('Ledningsoversikt & Koblingsskjema', margin, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...textMutedColor);
    doc.text('Pinneliste over alle fysiske ledningsforbindelser i kretsen', margin, currentY + 10);

    currentY += 15;

    const colW = contentWidth / 4;

    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...textDarkColor);

    doc.text('FRA KOMPONENT', margin + 3, currentY + 5);
    doc.text('FRA PINNE', margin + colW + 3, currentY + 5);
    doc.text('TIL KOMPONENT', margin + colW * 2 + 3, currentY + 5);
    doc.text('TIL PINNE & FARGE', margin + colW * 3 + 3, currentY + 5);

    currentY += 7;

    project.wires.forEach((wire, idx) => {
      if (currentY > pageHeight - 20) {
        doc.addPage();
        currentY = margin;
      }

      const fromComp = project.components.find((c) => c.id === wire.fromComponentId);
      const toComp = project.components.find((c) => c.id === wire.toComponentId);

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 7, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...textDarkColor);

      doc.text(fromComp?.label || wire.fromComponentId, margin + 3, currentY + 5);
      doc.text(wire.fromPinId, margin + colW + 3, currentY + 5);
      doc.text(toComp?.label || wire.toComponentId, margin + colW * 2 + 3, currentY + 5);
      doc.text(`${wire.toPinId} (${wire.color})`, margin + colW * 3 + 3, currentY + 5);

      currentY += 7;
    });
  }

  // Final total pages count pass and save
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(i, totalPages);
  }

  const cleanProjectName = (project.name || 'kretsdesign').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${cleanProjectName}_dokumentasjon.pdf`);
}
