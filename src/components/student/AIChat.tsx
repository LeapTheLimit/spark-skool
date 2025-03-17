'use client';

export default function AIChat() {
  return (
    <div className="bg-white rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">AI Homework Help</h2>
      </div>
      
      <div className="h-[300px] overflow-y-auto mb-4 space-y-4">
        {/* Chat messages will go here */}
      </div>

      <div className="flex items-center gap-2 border rounded-lg p-2">
        <input 
          type="text"
          placeholder="Ask about your homework..."
          className="flex-1 outline-none"
        />
        <button className="p-2 bg-black text-white rounded-lg">
          Send
        </button>
      </div>
    </div>
  );
} 