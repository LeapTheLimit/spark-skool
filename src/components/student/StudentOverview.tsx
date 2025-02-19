'use client';

import Image from 'next/image';

export default function StudentOverview() {
  return (
    <div className="bg-white rounded-lg p-6">
      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-6">
        <Image
          src="/images/student-avatar.jpg"
          alt="Student Avatar"
          width={48}
          height={48}
          className="rounded-full"
        />
        <div>
          <h2 className="text-lg font-semibold">Sarah Johnson</h2>
          <p className="text-gray-600">Grade 10 • Science Track</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/activity-1.jpg"
              alt="Activity 1"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <p className="font-medium">Completed Physics Quiz</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Image
              src="/images/activity-2.jpg"
              alt="Activity 2"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <p className="font-medium">Submitted Lab Report</p>
              <p className="text-sm text-gray-500">Yesterday</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none ml-2 w-full"
          />
        </div>
      </div>

      {/* Next Class */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Next class</h2>
          <button className="text-blue-600 text-sm">See all</button>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="font-medium">Basic mathematics</h3>
              <p className="text-gray-500 text-sm">Today, 08:15am</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Image 
              src="/images/teacher-avatar.jpg" 
              alt="Teacher" 
              width={24}
              height={24}
              className="rounded-full"
            />
            <p className="text-sm text-gray-600">Jane Cooper</p>
          </div>
        </div>
      </div>

      {/* Events */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Events</h2>
          <button className="text-blue-600 text-sm">See all</button>
        </div>
        <div className="space-y-3">
          <div className="bg-white border rounded-xl p-4">
            <Image 
              src="/images/event-image.jpg" 
              alt="Event" 
              width={400}
              height={128}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
            <h3 className="font-medium">Comedy show</h3>
            <p className="text-gray-500 text-sm">26 Apr, 6:30pm</p>
          </div>
        </div>
      </div>
    </div>
  );
} 