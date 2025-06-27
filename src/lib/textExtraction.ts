import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker to use the correct .mjs file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export class TextExtractionService {
  /**
   * Extract text from a PDF file using pdfjs-dist
   */
  private static async extractFromPDF(file: File): Promise<string> {
    const timerId = `PDF-extraction-${file.name}`;
    console.time(timerId);
    console.log(`🔄 Starting PDF text extraction for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📄 PDF file loaded into memory: ${file.name}`);
      
      // Load the PDF document with better error handling
      const loadingTaskTimer = `PDF-loading-${file.name}`;
      console.time(loadingTaskTimer);
      
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reduce console noise
      });
      
      const pdf = await loadingTask.promise;
      console.timeEnd(loadingTaskTimer);
      console.log(`📖 PDF document loaded: ${pdf.numPages} pages`);
      
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const pageTimer = `PDF-page-${pageNum}-${file.name}`;
        console.time(pageTimer);
        
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine text items from the page with proper spacing
          const pageText = textContent.items
            .map((item: any) => {
              // Handle different text item types
              if (typeof item === 'object' && item.str) {
                return item.str;
              }
              return '';
            })
            .filter(text => text.trim().length > 0)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }
          
          console.timeEnd(pageTimer);
          console.log(`📄 Page ${pageNum}/${pdf.numPages} processed: ${pageText.length} characters extracted`);
        } catch (pageError) {
          console.timeEnd(pageTimer);
          console.warn(`⚠️ Failed to extract text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      console.timeEnd(timerId);
      console.log(`✅ PDF extraction completed: ${file.name} - ${fullText.length} total characters extracted`);
      
      return fullText.trim();
    } catch (error) {
      console.timeEnd(timerId);
      console.error(`❌ PDF text extraction failed for ${file.name}:`, error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from a DOCX file
   */
  private static async extractFromDOCX(file: File): Promise<string> {
    const timerId = `DOCX-extraction-${file.name}`;
    console.time(timerId);
    console.log(`🔄 Starting DOCX text extraction for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log(`📄 DOCX file loaded into memory: ${file.name}`);
      
      const mammothTimer = `DOCX-mammoth-${file.name}`;
      console.time(mammothTimer);
      
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      console.timeEnd(mammothTimer);
      
      if (!result.value || result.value.trim().length === 0) {
        throw new Error('No text content found in DOCX file');
      }
      
      console.timeEnd(timerId);
      console.log(`✅ DOCX extraction completed: ${file.name} - ${result.value.length} characters extracted`);
      
      return result.value.trim();
    } catch (error) {
      console.timeEnd(timerId);
      console.error(`❌ DOCX text extraction failed for ${file.name}:`, error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from any supported file type
   */
  static async extractText(file: File): Promise<string> {
    const overallTimer = `Text-extraction-${file.name}`;
    console.time(overallTimer);
    console.log(`🚀 Starting text extraction for: ${file.name}`);
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.timeEnd(overallTimer);
      throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
    }

    try {
      let result: string;
      
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        console.log(`📋 Detected PDF file: ${file.name}`);
        result = await this.extractFromPDF(file);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.docx')
      ) {
        console.log(`📋 Detected DOCX file: ${file.name}`);
        result = await this.extractFromDOCX(file);
      } else {
        console.timeEnd(overallTimer);
        throw new Error(`Unsupported file type: ${fileType}. Only PDF and DOCX files are supported.`);
      }
      
      console.timeEnd(overallTimer);
      console.log(`🎉 Text extraction completed successfully for: ${file.name}`);
      
      return result;
    } catch (error) {
      console.timeEnd(overallTimer);
      console.error(`💥 Text extraction failed for ${file.name}:`, error);
      throw error;
    }
  }

  /**
   * Extract text from multiple files
   */
  static async extractTextFromFiles(files: File[]): Promise<string[]> {
    const batchTimer = `Batch-extraction-${files.length}-files`;
    console.time(batchTimer);
    console.log(`🔄 Starting batch text extraction for ${files.length} files`);
    
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileTimer = `File-${i + 1}-of-${files.length}-${file.name}`;
      console.time(fileTimer);
      
      try {
        console.log(`📂 Processing file ${i + 1}/${files.length}: ${file.name}`);
        const text = await this.extractText(file);
        
        if (text.trim().length === 0) {
          console.warn(`⚠️ No text extracted from ${file.name}`);
          results.push('');
        } else {
          console.log(`✅ Successfully extracted ${text.length} characters from ${file.name}`);
          results.push(text);
        }
        
        console.timeEnd(fileTimer);
      } catch (error) {
        console.timeEnd(fileTimer);
        console.error(`❌ Failed to extract text from ${file.name}:`, error);
        // Add empty string for failed extractions to maintain array order
        results.push('');
      }
    }
    
    console.timeEnd(batchTimer);
    
    const successCount = results.filter(text => text.trim().length > 0).length;
    const totalChars = results.reduce((sum, text) => sum + text.length, 0);
    
    console.log(`🎯 Batch extraction completed: ${successCount}/${files.length} files successful, ${totalChars} total characters extracted`);
    
    return results;
  }

  /**
   * Validate if file type is supported for text extraction
   */
  static isSupportedFileType(file: File): boolean {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    return (
      fileType === 'application/pdf' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.pdf') ||
      fileName.endsWith('.docx')
    );
  }

  /**
   * Get file type description
   */
  static getFileTypeDescription(file: File): string {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return 'PDF Document';
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return 'Word Document (DOCX)';
    } else {
      return 'Unknown Document Type';
    }
  }

  /**
   * Test if PDF.js worker is properly configured
   */
  static async testWorkerConfiguration(): Promise<boolean> {
    const testTimer = 'PDF-worker-test';
    console.time(testTimer);
    console.log('🔧 Testing PDF.js worker configuration...');
    
    try {
      // Create a minimal valid PDF document for testing
      const testPdf = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, // %PDF-1.4\n
        0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 1 0 obj\n
        0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // <</Type/Catalog/Pages 2 0 R>>\n
        0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj\n
        0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 2 0 obj\n
        0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, 0x3e, 0x0a, // <</Type/Pages/Kids[3 0 R]/Count 1>>\n
        0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj\n
        0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 3 0 obj\n
        0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x2f, 0x4d, 0x65, 0x64, 0x69, 0x61, 0x42, 0x6f, 0x78, 0x5b, 0x30, 0x20, 0x30, 0x20, 0x36, 0x31, 0x32, 0x20, 0x37, 0x39, 0x32, 0x5d, 0x3e, 0x3e, 0x0a, // <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>\n
        0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj\n
        0x78, 0x72, 0x65, 0x66, 0x0a, // xref\n
        0x30, 0x20, 0x34, 0x0a, // 0 4\n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a, // 0000000000 65535 f \n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, // 0000000009 00000 n \n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x35, 0x38, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, // 0000000058 00000 n \n
        0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x32, 0x32, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a, // 0000000122 00000 n \n
        0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a, // trailer\n
        0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // <</Size 4/Root 1 0 R>>\n
        0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, // startxref\n
        0x32, 0x31, 0x33, 0x0a, // 213\n
        0x25, 0x25, 0x45, 0x4f, 0x46 // %%EOF
      ]);
      
      const loadingTask = pdfjs.getDocument({ data: testPdf });
      await loadingTask.promise;
      
      console.timeEnd(testTimer);
      console.log('✅ PDF.js worker test successful');
      return true;
    } catch (error) {
      console.timeEnd(testTimer);
      console.error('❌ PDF.js worker test failed:', error);
      return false;
    }
  }
}