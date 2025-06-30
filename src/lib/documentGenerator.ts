import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export class DocumentGenerator {
  /**
   * Generate dynamic disclaimer text that includes the document incorporation log
   */
  private static getDynamicDisclaimer(documentIncorporationLog: string[] = []): string {
    let disclaimer = "***\n\nAI-Generated Output: This document is a product of AI analysis and a compilation of the following source documents:\n\n";
    
    if (documentIncorporationLog.length > 0) {
      documentIncorporationLog.forEach((doc, index) => {
        disclaimer += `${index + 1}. ${doc}\n`;
      });
    } else {
      disclaimer += "• No source documents specified\n";
    }
    
    disclaimer += "\nIt serves as a tool for review and understanding, not as an official or executed legal instrument.\n\n***";
    
    return disclaimer;
  }

  /**
   * Generate and download a PDF document
   */
  static async generatePDF(content: string, filename: string, documentIncorporationLog: string[] = []): Promise<void> {
    try {
      // Create new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      const maxWidth = pageWidth - (margin * 2);

      let yPosition = margin;
      let pageNumber = 1;

      // Add header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0); // Black
      pdf.text('Contract Document', margin, yPosition);
      yPosition += lineHeight * 2;

      // Get dynamic disclaimer with document list
      const disclaimerText = this.getDynamicDisclaimer(documentIncorporationLog);

      // Add disclaimer in brown color
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(139, 69, 19); // Brown color (RGB: 139, 69, 19)
      
      // Split disclaimer into lines
      const disclaimerLines = pdf.splitTextToSize(disclaimerText, maxWidth);
      
      for (let i = 0; i < disclaimerLines.length; i++) {
        // Check if we need a new page
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          pageNumber++;
        }

        // Use italic for the main disclaimer text (not the asterisks)
        if (disclaimerLines[i].includes('AI-Generated Output') || 
            disclaimerLines[i].includes('This document is a product') ||
            disclaimerLines[i].includes('serves as a tool') ||
            disclaimerLines[i].includes('It serves as a tool')) {
          pdf.setFont('helvetica', 'italic');
        } else {
          pdf.setFont('helvetica', 'bold');
        }

        pdf.text(disclaimerLines[i], margin, yPosition);
        yPosition += lineHeight;
      }

      yPosition += lineHeight; // Extra space after disclaimer

      // Reset to normal text for contract content
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0); // Black

      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(content, maxWidth);

      // Add content
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
        pdf.setTextColor(0, 0, 0); // Black
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
  static async generateDOCX(content: string, filename: string, documentIncorporationLog: string[] = []): Promise<void> {
    try {
      // Get dynamic disclaimer with document list
      const disclaimerText = this.getDynamicDisclaimer(documentIncorporationLog);
      
      // Add disclaimer to content
      const contentWithDisclaimer = disclaimerText + "\n\n" + content;
      
      // Split content into paragraphs
      const paragraphs = contentWithDisclaimer.split('\n\n').filter(p => p.trim().length > 0);
      
      // Create document paragraphs
      const docParagraphs = paragraphs.map((paragraph, index) => {
        const trimmedParagraph = paragraph.trim();
        
        // Check if this is part of the disclaimer
        const isDisclaimer = index < 10 && ( // Increased range to cover document list
          trimmedParagraph.includes("AI-Generated Output") || 
          trimmedParagraph === "***" ||
          trimmedParagraph.includes("This document is a product") ||
          trimmedParagraph.includes("It serves as a tool") ||
          /^\d+\.\s/.test(trimmedParagraph) // Numbered list items
        );
        
        if (isDisclaimer) {
          // Format disclaimer text
          if (trimmedParagraph === "***") {
            return new Paragraph({
              children: [
                new TextRun({
                  text: trimmedParagraph,
                  bold: true,
                  size: 24,
                  color: "8B4513" // Brown color for asterisks
                })
              ],
              spacing: {
                before: 200,
                after: 200
              }
            });
          } else {
            return new Paragraph({
              children: [
                new TextRun({
                  text: trimmedParagraph,
                  italics: true,
                  size: 22,
                  color: "8B4513" // Brown color for disclaimer text
                })
              ],
              spacing: {
                before: 0,
                after: 200
              }
            });
          }
        }
        
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

      // Generate and save the document using toBlob for browser compatibility
      const blob = await Packer.toBlob(doc);
      
      saveAs(blob, `${filename}.docx`);
    } catch (error) {
      console.error('DOCX generation failed:', error);
      throw new Error('Failed to generate DOCX document');
    }
  }

  /**
   * Generate and download a TXT document
   */
  static generateTXT(content: string, filename: string, documentIncorporationLog: string[] = []): void {
    try {
      // Get dynamic disclaimer with document list
      const disclaimerText = this.getDynamicDisclaimer(documentIncorporationLog);
      
      // Add disclaimer to content
      const contentWithDisclaimer = disclaimerText + "\n\n" + content;
      
      const blob = new Blob([contentWithDisclaimer], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${filename}.txt`);
    } catch (error) {
      console.error('TXT generation failed:', error);
      throw new Error('Failed to generate TXT document');
    }
  }
}