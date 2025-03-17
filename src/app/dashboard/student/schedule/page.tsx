'use client';

import { Schedule } from "@/components/student/Schedule"
import { ScheduleOverview } from "./components/ScheduleOverview"
import { motion } from "framer-motion"
import { CalendarIcon, ClockIcon, AcademicCapIcon } from "@heroicons/react/24/outline"

export default function SchedulePage() {
  return (
    <div className="container py-6 px-4 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500">Manage your classes and assignments</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-black rounded-xl hover:bg-violet-600 transition-colors"
          >
            <ClockIcon className="w-5 h-5" />
            Add Event
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-500 rounded-xl hover:bg-violet-100 transition-colors"
          >
            <AcademicCapIcon className="w-5 h-5" />
            Study Planner
          </motion.button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Today's Classes", value: "4", color: "blue" },
          { label: "Assignments Due", value: "2", color: "purple" },
          { label: "Study Hours", value: "6h", color: "green" }
        ].map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.02 }}
            className={`bg-${stat.color}-50 p-4 rounded-xl border border-${stat.color}-100`}
          >
            <p className={`text-${stat.color}-600 text-sm font-medium`}>{stat.label}</p>
            <p className={`text-${stat.color}-700 text-2xl font-bold mt-1`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <ScheduleOverview />
          <Schedule />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white p-4 rounded-xl border border-gray-100"
          >
            <h3 className="font-semibold text-gray-900 mb-3">Study Reminders</h3>
            <div className="space-y-2">
              {[
                { subject: "Math Quiz", time: "Tomorrow, 10:00 AM" },
                { subject: "Physics Lab", time: "Thursday, 2:00 PM" },
                { subject: "English Essay", time: "Friday, 11:59 PM" }
              ].map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-gray-900 text-sm font-medium">{reminder.subject}</span>
                  <span className="text-gray-500 text-xs">{reminder.time}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-violet-500 to-violet-600 p-4 rounded-xl text-black"
          >
            <h3 className="font-semibold mb-3">Study Streak</h3>
            <div className="text-3xl font-bold mb-2">5 Days 🔥</div>
            <p className="text-black text-sm">Keep up the great work!</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 