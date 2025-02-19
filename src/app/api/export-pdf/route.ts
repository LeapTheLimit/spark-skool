import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function POST(request: Request) {
  try {
    const { content, title } = await request.json();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    page.drawText(title, { x: 50, y: 800, size: 18, font });
    page.drawText(content, { x: 50, y: 750, size: 12, font, maxWidth: 500 });
    
    const pdfBytes = await pdfDoc.save();
    return new Response(new Blob([pdfBytes], { type: 'application/pdf' }), {
      headers: {
        'Content-Disposition': `attachment; filename="${title}.pdf"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
} 