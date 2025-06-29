import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export class DocumentGenerator {
  /**
   * Generate and download a PDF document
   */
  static async generatePDF(content: string, filename: string): Promise<void> {
    try {
      // Create new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font and size
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      const maxWidth = pageWidth - (margin * 2);

      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(content, maxWidth);
      
      let yPosition = margin;
      let pageNumber = 1;

      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contract Document', margin, yPosition);
      yPosition += lineHeight * 2;

      // Add content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          pageNumber++;
        }

        pdf.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
      }

      // Add page numbers
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      // Save the PDF
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF document');
    }
  }

  /**
   * Generate and download a DOCX document
   */
  static async generateDOCX(content: string, filename: string): Promise<void> {
    try {
      // Split content into paragraphs
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      // Create document paragraphs
      const docParagraphs = paragraphs.map((paragraph, index) => {
        const trimmedParagraph = paragraph.trim();
        
        // Check if this looks like a heading (all caps, short, or starts with numbers/letters followed by period)
        const isHeading = (
          trimmedParagraph.length < 100 &&
          (trimmedParagraph === trimmedParagraph.toUpperCase() ||
           /^[A-Z0-9]+[\.\)]\s/.test(trimmedParagraph) ||
           /^(ARTICLE|SECTION|SCHEDULE|EXHIBIT)\s/i.test(trimmedParagraph))
        );

        if (isHeading) {
          return new Paragraph({
            children: [
              new TextRun({
                text: trimmedParagraph,
                bold: true,
                size: 24
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: index === 0 ? 0 : 400,
              after: 200
            }
          });
        } else {
          return new Paragraph({
            children: [
              new TextRun({
                text: trimmedParagraph,
                size: 22
              })
            ],
            spacing: {
              before: 0,
              after: 200
            }
          });
        }
      });

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Contract Document',
                    bold: true,
                    size: 32
                  })
                ],
                heading: HeadingLevel.TITLE,
                spacing: {
                  after: 400
                }
              }),
              // Content paragraphs
              ...docParagraphs
            ]
          }
        ]
      });

      // Generate and save the document
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      saveAs(blob, `${filename}.docx`);
    } catch (error) {
      console.error('DOCX generation failed:', error);
      throw new Error('Failed to generate DOCX document');
    }
  }

  /**
   * Generate and download a TXT document
   */
  static generateTXT(content: string, filename: string): void {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${filename}.txt`);
    } catch (error) {
      console.error('TXT generation failed:', error);
      throw new Error('Failed to generate TXT document');
    }
  }
}