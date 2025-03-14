import React from 'react';

export default function ActivityPanel() {
  return (
    <div className="w-[300px] border-l border-gray-800 bg-[#111111] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white font-semibold">Recent Activity</h2>
        <button className="text-sm text-blue-500 hover:text-blue-400">View All</button>
      </div>
      
      <div className="space-y-4">
        {/* Activity items will go here */}
      </div>
    </div>
  );
} 