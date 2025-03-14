'use client';

import { useEffect, useState } from 'react';
import mammoth from 'mammoth';

interface FilePreviewProps {
  content: string | ArrayBuffer;
  type: string;
}

export function FilePreview({ content, type }: FilePreviewProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    const convertDocxToHtml = async () => {
      if (type.includes('word') || type.includes('document')) {
        try {
          // Convert base64 to ArrayBuffer
          const binaryString = window.atob(content.toString().split(',')[1]);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
          setHtmlContent(result.value);
        } catch (error) {
          console.error('Error converting DOCX:', error);
          setHtmlContent('<p class="text-red-500">Error loading document</p>');
        }
      }
    };

    convertDocxToHtml();
  }, [content, type]);

  // For PDF files
  if (type.includes('pdf')) {
    return (
      <div className="w-full h-[400px] border rounded-lg">
        <iframe
          src={content as string}
          className="w-full h-full"
          title="PDF preview"
        />
      </div>
    );
  }

  // For Word documents
  if (type.includes('word') || type.includes('document')) {
    return (
      <div className="w-full min-h-[200px] p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          </svg>
          <span className="text-sm font-medium">Word Document</span>
        </div>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    );
  }

  // For PowerPoint presentations
  if (type.includes('presentation')) {
    return (
      <div className="w-full min-h-[200px] p-4 bg-white border rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
          </svg>
          <span className="text-sm font-medium">PowerPoint Presentation</span>
        </div>
        <p className="text-gray-600">Preview not available. Please download to view.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100px] p-4 bg-white border rounded-lg">
      <p className="text-gray-700">{content as string}</p>
    </div>
  );
}