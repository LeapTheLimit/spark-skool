'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  DocumentIcon, 
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  ChartBarIcon,
  SparklesIcon,
  BeakerIcon,
  CalculatorIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';
import type { Route } from 'next';

const subjects = [
  {
    name: "Mathematics",
    icon: CalculatorIcon,
    color: "blue",
    progress: 75,
    nextClass: "Today, 10:00 AM",
    assignments: 3,
    href: "/dashboard/student/directory/math" as Route
  },
  {
    name: "Physics",
    icon: BeakerIcon,
    color: "purple",
    progress: 68,
    nextClass: "Tomorrow, 11:30 AM",
    assignments: 2,
    href: "/dashboard/student/directory/physics" as Route
  },
  {
    name: "English",
    icon: LanguageIcon,
    color: "pink",
    progress: 82,
    nextClass: "Today, 2:00 PM",
    assignments: 1,
    href: "/dashboard/student/directory/english" as Route
  }
  // Add other subjects...
];

const recentActivities = [
  {
    title: "Math Worksheet",
    timeAgo: "Added 2 hours ago",
    icon: BookOpenIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    href: "/dashboard/student/directory/math" as Route
  },
  {
    title: "Biology Assignment",
    timeAgo: "Due tomorrow",
    icon: ClockIcon,
    iconBg: "bg-green-100",
    iconColor: "text-green-500",
    href: "/dashboard/student/directory/biology" as Route
  }
];

export default function DirectoryPage() {
  return (
    <div className="flex flex-col h-full pb-24 bg-gray-50">
      {/* Header */}
      <div className="bg-violet-500 text-white p-6 rounded-b-[2rem] mx-4 mb-6">
        <h1 className="text-2xl font-semibold mb-1">Directory</h1>
        <p className="text-violet-100 text-sm">
          Access all your materials, homework, and tasks
        </p>
      </div>

      {/* Subject Overview */}
      <div className="mx-4 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject, index) => (
            <Link href={subject.href} key={index}> 
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={`bg-${subject.color}-50 p-4 rounded-2xl border border-${subject.color}-100`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`bg-${subject.color}-100 p-2 rounded-xl`}>
                      <subject.icon className={`w-5 h-5 text-${subject.color}-500`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-500">Next: {subject.nextClass}</p>
                    </div>
                  </div>
                  <div className={`text-${subject.color}-500 text-sm font-medium`}>
                    {subject.progress}%
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mb-4">
                  <div 
                    className={`h-full bg-${subject.color}-500 rounded-full`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{subject.assignments} assignments due</span>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 gap-4 mx-4 mb-8">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-blue-50/80 p-4 rounded-2xl flex flex-col"
        >
          <DocumentIcon className="w-6 h-6 text-blue-500 mb-2" />
          <h2 className="text-gray-900 font-medium mb-1">Study Materials</h2>
          <p className="text-gray-500 text-sm mb-2">
            Quick access to your latest study materials
          </p>
          <Link href={"/materials" as Route} className="text-blue-500 text-sm mt-auto">
            View All →
          </Link>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-green-50/80 p-4 rounded-2xl flex flex-col"
        >
          <CheckCircleIcon className="w-6 h-6 text-green-500 mb-2" />
          <h2 className="text-gray-900 font-medium mb-1">Homework</h2>
          <p className="text-gray-500 text-sm mb-2">
            Track and submit your assignments
          </p>
          <Link href={"/homework" as Route} className="text-green-500 text-sm mt-auto">
            View All →
          </Link>
        </motion.div>
      </div>

      {/* Hope AI Section */}
      <div className="mx-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <SparklesIcon className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-semibold">SPARK AI Assistant</h2>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl text-black"
        >
          <p className="text-black text-sm mb-4">
            Get personalized help with your studies and track your progress
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-xl p-3">
              <h3 className="font-medium mb-1">Study Streak</h3>
              <p className="text-2xl font-bold">5 days</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <h3 className="font-medium mb-1">Questions Asked</h3>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="mx-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <Link href={activity.href} key={index}>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 bg-white rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`${activity.iconBg} p-2 rounded-xl`}>
                    <activity.icon className={`w-5 h-5 ${activity.iconColor}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{activity.title}</span>
                    <span className="text-gray-400 text-sm">{activity.timeAgo}</span>
                  </div>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-300" />
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 