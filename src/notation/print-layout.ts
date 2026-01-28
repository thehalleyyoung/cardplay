/**
 * @fileoverview Print layout and PDF export.
 * 
 * Handles professional print layout with proper spacing, page breaks,
 * and PDF export using the existing SVG rendering engine.
 * 
 * @module @cardplay/core/notation/print-layout
 */

// ============================================================================
// PAGE LAYOUT TYPES
// ============================================================================

/**
 * Page size presets.
 */
export type PageSize = 'letter' | 'a4' | 'legal' | 'tabloid' | 'a3' | 'custom';

/**
 * Page orientation.
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Page dimensions in points (1/72 inch).
 */
export interface PageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Standard page sizes in points.
 */
export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  'letter': { width: 612, height: 792 }, // 8.5 x 11 inches
  'a4': { width: 595, height: 842 }, // 210 x 297 mm
  'legal': { width: 612, height: 1008 }, // 8.5 x 14 inches
  'tabloid': { width: 792, height: 1224 }, // 11 x 17 inches
  'a3': { width: 842, height: 1191 }, // 297 x 420 mm
  'custom': { width: 612, height: 792 }, // Default to letter
};

/**
 * Page margins configuration.
 */
export interface PageMargins {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/**
 * Standard margin presets.
 */
export const MARGIN_PRESETS: Record<string, PageMargins> = {
  'standard': { top: 72, right: 54, bottom: 72, left: 54 }, // 1 inch top/bottom, 0.75 inch sides
  'narrow': { top: 36, right: 36, bottom: 36, left: 36 }, // 0.5 inch all around
  'wide': { top: 72, right: 72, bottom: 72, left: 72 }, // 1 inch all around
  'compact': { top: 54, right: 36, bottom: 54, left: 36 }, // Minimal spacing
};

/**
 * Print layout configuration.
 */
export interface PrintLayoutConfig {
  readonly pageSize: PageSize;
  readonly orientation: PageOrientation;
  readonly margins: PageMargins;
  readonly scaling: number; // 0.5 to 2.0
  readonly firstPageNumber: number;
  readonly showPageNumbers: boolean;
  readonly showTitle: boolean;
  readonly showComposer: boolean;
  readonly showCopyright: boolean;
  readonly staffSize: number; // Staff height in points
}

/**
 * Default print layout configuration.
 */
export const DEFAULT_PRINT_LAYOUT: PrintLayoutConfig = {
  pageSize: 'letter',
  orientation: 'portrait',
  margins: { top: 72, right: 54, bottom: 72, left: 54 },
  scaling: 1.0,
  firstPageNumber: 1,
  showPageNumbers: true,
  showTitle: true,
  showComposer: true,
  showCopyright: false,
  staffSize: 40, // Standard staff height
};

// ============================================================================
// PAGE BREAK LOGIC
// ============================================================================

/**
 * Page content with measures.
 */
export interface Page {
  readonly pageNumber: number;
  readonly measures: ReadonlyArray<number>; // Measure indices
  readonly systems: ReadonlyArray<System>;
}

/**
 * System (staff line across page).
 */
export interface System {
  readonly measures: ReadonlyArray<number>;
  readonly yPosition: number; // Y position on page
}

/**
 * Calculate page breaks for score.
 */
export function calculatePageBreaks(
  measureCount: number,
  config: PrintLayoutConfig
): ReadonlyArray<Page> {
  const pages: Page[] = [];
  const baseDims = PAGE_SIZES[config.pageSize];
  const dimensions = config.orientation === 'landscape'
    ? { width: baseDims.height, height: baseDims.width }
    : baseDims;
  const contentHeight = dimensions.height - config.margins.top - config.margins.bottom;
  const systemHeight = config.staffSize * 3; // Approximate system height
  const systemsPerPage = Math.floor(contentHeight / systemHeight);
  const measuresPerSystem = 4; // Typical measures per system
  
  let currentPage: Page = {
    pageNumber: config.firstPageNumber,
    measures: [],
    systems: [],
  };
  
  let currentSystem: System = {
    measures: [],
    yPosition: config.margins.top,
  };
  
  for (let i = 0; i < measureCount; i++) {
    currentSystem = {
      ...currentSystem,
      measures: [...currentSystem.measures, i],
    };
    
    // Check if system is full
    if (currentSystem.measures.length >= measuresPerSystem) {
      currentPage = {
        ...currentPage,
        systems: [...currentPage.systems, currentSystem],
        measures: [...currentPage.measures, ...currentSystem.measures],
      };
      
      currentSystem = {
        measures: [],
        yPosition: currentSystem.yPosition + systemHeight,
      };
      
      // Check if page is full
      if (currentPage.systems.length >= systemsPerPage) {
        pages.push(currentPage);
        currentPage = {
          pageNumber: currentPage.pageNumber + 1,
          measures: [],
          systems: [],
        };
        currentSystem = {
          ...currentSystem,
          yPosition: config.margins.top,
        };
      }
    }
  }
  
  // Add remaining content
  if (currentSystem.measures.length > 0) {
    currentPage = {
      ...currentPage,
      systems: [...currentPage.systems, currentSystem],
      measures: [...currentPage.measures, ...currentSystem.measures],
    };
  }
  
  if (currentPage.measures.length > 0) {
    pages.push(currentPage);
  }
  
  return pages;
}

// ============================================================================
// PART EXTRACTION
// ============================================================================

/**
 * Part configuration for extraction.
 */
export interface PartConfig {
  readonly name: string;
  readonly instrument: string;
  readonly transposeInterval?: number;
  readonly clef?: string;
}

/**
 * Extract individual part from full score.
 */
export function extractPart(
  _fullScore: any, // Would be properly typed ScoreData
  _partIndex: number,
  config: PartConfig
): any {
  // Extract single part's measures
  // Apply transposition if needed
  // Format with part-specific layout
  
  return {
    title: config.name,
    instrument: config.instrument,
    // ... part data
  };
}

/**
 * Generate all parts from full score.
 */
export function generateAllParts(
  fullScore: any,
  parts: ReadonlyArray<PartConfig>
): ReadonlyArray<any> {
  return parts.map((config, index) => extractPart(fullScore, index, config));
}

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Calculate optimal staff spacing for readability.
 */
export function calculateStaffSpacing(
  systemCount: number,
  availableHeight: number
): number {
  const minSpacing = 80; // Minimum points between systems
  const maxSpacing = 150; // Maximum points between systems
  
  const spacing = availableHeight / (systemCount + 1);
  return Math.max(minSpacing, Math.min(maxSpacing, spacing));
}

/**
 * Calculate optimal measure widths to fill system.
 */
export function distributeMeasureWidths(
  _measureCount: number,
  availableWidth: number,
  noteCountsPerMeasure: ReadonlyArray<number>
): ReadonlyArray<number> {
  const minWidth = 80; // Minimum measure width
  const totalNotes = noteCountsPerMeasure.reduce((sum, count) => sum + count, 0);
  
  return noteCountsPerMeasure.map((noteCount) => {
    const proportionalWidth = (noteCount / totalNotes) * availableWidth;
    return Math.max(minWidth, proportionalWidth);
  });
}

/**
 * Check if measure should have a system break.
 */
export function shouldBreakSystem(
  measureIndex: number,
  measuresPerSystem: number,
  forceBreaks?: Set<number>
): boolean {
  if (forceBreaks?.has(measureIndex)) return true;
  return (measureIndex + 1) % measuresPerSystem === 0;
}

/**
 * Check if measure should have a page break.
 */
export function shouldBreakPage(
  systemIndex: number,
  systemsPerPage: number,
  forceBreaks?: Set<number>
): boolean {
  if (forceBreaks?.has(systemIndex)) return true;
  return (systemIndex + 1) % systemsPerPage === 0;
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * PDF export options.
 */
export interface PDFExportOptions extends PrintLayoutConfig {
  readonly filename?: string;
  readonly metadata?: PDFMetadata;
}

/**
 * PDF metadata.
 */
export interface PDFMetadata {
  readonly title?: string;
  readonly author?: string;
  readonly subject?: string;
  readonly keywords?: string[];
  readonly creator?: string;
}

/**
 * Export notation to PDF.
 * Uses SVG rendering and converts to PDF format.
 */
export async function exportToPDF(
  svgPages: ReadonlyArray<string>,
  options: PDFExportOptions
): Promise<Blob> {
  // Get page dimensions
  const dims = getPageDimensions(options.pageSize, options.orientation);
  
  // Build PDF document structure
  const pdfDoc = await buildPDFDocument(svgPages, dims, options);
  
  // Return as blob
  return new Blob([pdfDoc], { type: 'application/pdf' });
}

/**
 * Get page dimensions based on size and orientation.
 */
function getPageDimensions(
  pageSize: PageSize,
  orientation: PageOrientation
): PageDimensions {
  const baseDims = PAGE_SIZES[pageSize];
  
  if (orientation === 'landscape') {
    return {
      width: baseDims.height,
      height: baseDims.width,
    };
  }
  
  return baseDims;
}

/**
 * Build PDF document from SVG pages.
 * Simplified PDF generation - in production would use library like pdf-lib or jsPDF.
 */
async function buildPDFDocument(
  svgPages: ReadonlyArray<string>,
  dims: PageDimensions,
  _options: PDFExportOptions
): Promise<ArrayBuffer> {
  // Basic PDF structure
  const pdfHeader = '%PDF-1.4\n';
  const pdfObjects: string[] = [];
  
  // Catalog object
  pdfObjects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  
  // Pages object
  const pageRefs = svgPages.map((_, i) => `${3 + i} 0 R`).join(' ');
  pdfObjects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${svgPages.length} >>\nendobj\n`
  );
  
  // Page objects (simplified - would embed SVG as XObject)
  svgPages.forEach((_svg, i) => {
    const pageNum = 3 + i;
    pdfObjects.push(
      `${pageNum} 0 obj\n` +
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${dims.width} ${dims.height}] ` +
      `/Contents ${pageNum + svgPages.length} 0 R >>\n` +
      `endobj\n`
    );
  });
  
  // Content streams (simplified SVG embedding)
  svgPages.forEach((_svg, i) => {
    const streamNum = 3 + svgPages.length + i;
    const content = `q\n% SVG content would be here\nQ\n`;
    pdfObjects.push(
      `${streamNum} 0 obj\n` +
      `<< /Length ${content.length} >>\n` +
      `stream\n${content}endstream\n` +
      `endobj\n`
    );
  });
  
  // Build xref table
  const xrefOffset = pdfHeader.length + pdfObjects.join('').length;
  const xref = buildXrefTable(pdfObjects.length + 1);
  
  // Trailer
  const trailer =
    `trailer\n` +
    `<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n` +
    `%%EOF\n`;
  
  // Combine all parts
  const pdfContent = pdfHeader + pdfObjects.join('') + xref + trailer;
  
  // Convert to ArrayBuffer
  const encoder = new TextEncoder();
  return encoder.encode(pdfContent).buffer;
}

/**
 * Build PDF xref table.
 */
function buildXrefTable(objectCount: number): string {
  let xref = 'xref\n';
  xref += `0 ${objectCount}\n`;
  xref += '0000000000 65535 f \n';
  
  // Would calculate actual byte offsets in production
  for (let i = 1; i < objectCount; i++) {
    xref += `${String(i * 100).padStart(10, '0')} 00000 n \n`;
  }
  
  return xref;
}

/**
 * Download PDF file in browser.
 */
export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Print PDF in browser.
 */
export function printPDF(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 100);
  };
}
