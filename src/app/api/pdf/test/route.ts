import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/services/pdfExtractor';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Create a minimal valid PDF buffer
    const minimalPdf = Buffer.from(
      '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF',
      'utf-8'
    );
    
    try {
      await extractTextFromPDF(minimalPdf);
      return NextResponse.json({
        success: true,
        message: 'PDF extraction service is functioning correctly'
      });
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'PDF extraction test failed'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 