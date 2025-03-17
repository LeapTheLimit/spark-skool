'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion";
import { ClockIcon, BookOpenIcon, AcademicCapIcon, CheckCircleIcon } from "@heroicons/react/24/outline"

const scheduleEvents = [
  {
    type: 'class',
    subject: 'Mathematics',
    title: 'Quadratic Equations',
    time: '10:00 AM',
    duration: '1h',
    teacher: 'Dr. Smith',
    color: 'blue'
  },
  {
    type: 'homework',
    subject: 'Physics',
    title: 'Forces Lab Report',
    dueTime: '11:59 PM',
    status: 'pending',
    color: 'purple'
  },
  {
    type: 'class',
    subject: 'English',
    title: 'Literature Analysis',
    time: '2:00 PM',
    duration: '1h',
    teacher: 'Mrs. Johnson',
    color: 'pink'
  },
  {
    type: 'exam',
    subject: 'Chemistry',
    title: 'Mid-term Exam',
    time: '3:30 PM',
    duration: '2h',
    room: 'Lab 204',
    color: 'green'
  }
];

export function Schedule() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-violet-50 p-4 rounded-xl"
        >
          <h3 className="text-violet-600 font-medium mb-2">Today's Classes</h3>
          <p className="text-3xl font-extrabold text-violet-700">4</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-blue-50 p-4 rounded-xl"
        >
          <h3 className="text-blue-600 font-medium mb-2">Assignments</h3>
          <p className="text-3xl font-extrabold text-blue-700">3</p>
        </motion.div>
      </div>

      {/* Timeline */}
      <Card className="border-none shadow-md bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900">
              <BookOpenIcon className="w-5 h-5 text-blue-500" />
              Today's Schedule
            </div>
            <span className="text-sm text-gray-600 font-normal">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {scheduleEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-6 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-gray-100"
              >
                <div className={`absolute left-0 top-2 w-2 h-2 rounded-full bg-${event.color}-500 -translate-x-[3px]`} />
                <div className={`bg-${event.color}-50 p-4 rounded-xl border border-${event.color}-100`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-${event.color}-600 text-sm font-medium`}>
                        {event.subject}
                      </span>
                      <h3 className="font-medium text-gray-900">{event.title}</h3>
                    </div>
                    {event.type === 'class' && (
                      <span className={`bg-${event.color}-100 text-${event.color}-600 text-xs px-2 py-1 rounded-full`}>
                        {event.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {event.time || event.dueTime}
                    </div>
                    {event.teacher && (
                      <div className="flex items-center gap-1">
                        <AcademicCapIcon className="w-4 h-4" />
                        {event.teacher}
                      </div>
                    )}
                    {event.status && (
                      <div className="flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        {event.status}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 