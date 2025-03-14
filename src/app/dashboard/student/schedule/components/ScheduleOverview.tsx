'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const mockClasses = [
  { subject: "Mathematics", time: "10:00 AM", teacher: "Dr. Smith", color: "blue" },
  { subject: "Physics", time: "11:30 AM", teacher: "Mrs. Johnson", color: "purple" },
  { subject: "English", time: "2:00 PM", teacher: "Mr. Williams", color: "pink" },
]

const mockEvents = [
  { name: "Math Quiz", date: "Tomorrow", type: "quiz", color: "violet" },
  { name: "Science Project Due", date: "Friday", type: "assignment", color: "blue" },
  { name: "Literature Review", date: "Next Week", type: "assignment", color: "green" },
]

export function ScheduleOverview() {
  return (
    <div className="space-y-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Schedule Overview</h2>
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Classes Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockClasses.map((class_, index) => (
                <div key={index} className="flex flex-col space-y-1 border-l-2 border-blue-500 pl-4">
                  <div className="font-semibold text-gray-900">{class_.subject}</div>
                  <div className="text-sm text-gray-600">
                    {class_.time} • {class_.teacher}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary Card */}
        <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-none hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <span className="h-2 w-2 rounded-full bg-violet-500"></span>
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-gray-700">
                <span>Total Classes</span>
                <span className="font-bold">15</span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Completed</span>
                <span className="font-bold text-green-600">8</span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Upcoming</span>
                <span className="font-bold text-blue-600">7</span>
              </div>
              <div className="h-2 bg-white rounded-full mt-2">
                <div className="h-full w-[53%] bg-violet-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-none hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <span className="h-2 w-2 rounded-full bg-pink-500"></span>
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEvents.map((event, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-white/80">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{event.name}</span>
                    <span className="text-sm text-gray-600">{event.date}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    event.type === 'quiz' ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 