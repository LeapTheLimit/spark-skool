import Link from 'next/link';

interface Assignment {
  subject: string;
  duration: string;
  status: 'Done' | 'To do';
  icon: string;
  bgColor: string;
}

export default function Assignments() {
  const assignments: Assignment[] = [
    {
      subject: 'Basic mathematic',
      duration: '45 min',
      status: 'Done',
      icon: '📊',
      bgColor: 'bg-blue-50'
    },
    {
      subject: 'English grammar',
      duration: '60 min',
      status: 'To do',
      icon: '📚',
      bgColor: 'bg-green-50'
    },
    {
      subject: 'Science',
      duration: '40 min',
      status: 'To do',
      icon: '🧪',
      bgColor: 'bg-yellow-50'
    },
    {
      subject: 'World history',
      duration: '20 min',
      status: 'To do',
      icon: '🌍',
      bgColor: 'bg-purple-50'
    },
  ];

  return (
    <div className="bg-white min-h-screen p-4">
      {/* Top Navigation */}
      <div className="flex gap-4 mb-6 text-gray-600">
        <span className="font-medium">Subjects</span>
        <span className="font-bold">Homework</span>
        <span className="font-medium">Library</span>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
        <div className="flex items-center">
          <span className="text-gray-400">🔍</span>
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none outline-none ml-2 w-full"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between mb-6">
        <select className="bg-transparent">
          <option>Subject: All</option>
        </select>
        <select className="bg-transparent">
          <option>Sort by: Do first</option>
        </select>
      </div>

      {/* Date Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Tuesday 6</h2>
          <span className="text-gray-500 text-sm">4 tasks</span>
        </div>
        <span className="text-gray-400">📅</span>
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {assignments.map((assignment, index) => (
          <div 
            key={index} 
            className={`${assignment.bgColor} p-4 rounded-xl flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{assignment.icon}</span>
              <div>
                <h3 className="font-medium">{assignment.subject}</h3>
                <span className="text-gray-500 text-sm">{assignment.duration}</span>
              </div>
            </div>
            <span className={`${
              assignment.status === 'Done' ? 'text-green-600' : 'text-gray-500'
            }`}>
              {assignment.status}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-around items-center">
          <span className="text-xl">🏠</span>
          <span className="text-xl">📅</span>
          <div className="bg-black text-white p-3 rounded-full -mt-8">
            <span className="text-xl">≡</span>
          </div>
          <span className="text-xl">💬</span>
        </div>
      </div>
    </div>
  );
} 