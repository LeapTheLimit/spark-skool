import { NextResponse } from 'next/server';

const SLIDESGPT_API_KEY = "mwtdxmt1nojedaqf5pznqxkszh80yawc"; // Public key

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // If we need to actually delete from SlidesGPT API
    // Currently just returning success since we only need to remove from local storage
    // which is handled on the frontend
    
    // Uncomment this if you need to actually delete from SlidesGPT API
    /*
    const response = await fetch(`https://api.slidesgpt.com/v1/presentations/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": SLIDESGPT_API_KEY,
        "Content-Type": "application/json"
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to delete presentation ${id}` }, { status: response.status });
    }
    */
    
    return NextResponse.json({ success: true, message: `Presentation ${id} deleted` });
  } catch (error) {
    console.error(`Error deleting presentation ${id}:`, error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error", 
    }, { status: 500 });
  }
} 