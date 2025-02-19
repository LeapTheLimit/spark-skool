'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  BookOpenIcon, 
  ClockIcon, 
  SparklesIcon,
  TrophyIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  BoltIcon,
  FireIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  BookmarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function StudentDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">Good morning,</p>
          <h1 className="text-2xl font-bold text-gray-900">Sarah Hessy</h1>
        </div>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center overflow-hidden">
            <Image 
              src="/images/profiles/sarah.png" 
              alt="Sarah Hessy" 
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                console.log('Image failed to load');
                e.currentTarget.src = 'https://ui-avatars.com/api/?name=Sarah+Hessy&background=8B5CF6&color=fff';
              }}
              onLoad={() => console.log('Image loaded successfully')}
            />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white" />
        </motion.div>
      </div>

      {/* Next Class Card - Updated with light gradient */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-6 text-gray-900"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              <p className="text-blue-500">Next Class</p>
            </div>
            <h2 className="text-2xl font-bold mb-2">Mathematics</h2>
            <p className="text-gray-500">Starts in 30 minutes</p>
            <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors">
              Join now
            </button>
          </div>
          <div className="bg-blue-200/30 p-3 rounded-2xl">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-8 h-8 text-blue-500"
            >
              <path 
                d="M4 15V9C4 7.89543 4.89543 7 6 7H13C14.1046 7 15 7.89543 15 9V15C15 16.1046 14.1046 17 13 17H6C4.89543 17 4 16.1046 4 15Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M18.3753 8.29976L15.3753 10.6998C15.1381 10.8895 15 11.1768 15 11.4806V12.5194C15 12.8232 15.1381 13.1105 15.3753 13.3002L18.3753 15.7002C19.0301 16.2241 20 15.7579 20 14.9194V9.08062C20 8.24212 19.0301 7.77595 18.3753 8.29976Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Hope AI Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-medium text-gray-900">SPARK SKOOL Insights</h2>
          </div>
          <button className="text-violet-500 text-sm hover:text-violet-600">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Growth Analysis Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl text-gray-900"
          >
            <div className="flex items-center gap-3 mb-4">
              <ChartBarIcon className="w-6 h-6 text-violet-200" />
              <h3 className="font-semibold">Your Learning Progress</h3>
            </div>
            <p className="text-violet-100 text-sm mb-3">
              You've improved 15% in Mathematics this week! Your problem-solving speed has increased significantly.
            </p>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-violet-100">Weekly Progress</span>
                <span className="text-white">85%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div className="h-full w-[85%] bg-white rounded-full" />
              </div>
            </div>
          </motion.div>

          {/* Class Summary Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white p-6 rounded-2xl border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="w-6 h-6 text-violet-500" />
              <h3 className="font-semibold text-gray-900">Today's Class Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-violet-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  In Mathematics, you mastered quadratic equations and completed 3 practice exercises.
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  Your English essay showed strong analytical skills. Consider adding more supporting examples.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Chat with Hope */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white p-6 rounded-2xl border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ChatBubbleLeftIcon className="w-6 h-6 text-violet-500" />
              <h3 className="font-semibold text-gray-900">Chat with SPARK</h3>
            </div>
            <span className="text-sm text-gray-400">Last chat: 2 days ago</span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Hey! Need help with your studies? I can help you review concepts or practice problems.
          </p>
          <div className="flex gap-3">
            <button className="flex-1 bg-violet-500 text-white px-4 py-2 rounded-xl hover:bg-violet-600 transition-colors">
              Start Chat
            </button>
            <button className="flex-1 bg-violet-50 text-violet-500 px-4 py-2 rounded-xl hover:bg-violet-100 transition-colors">
              View Previous Chats
            </button>
          </div>
        </motion.div>
      </div>

      {/* Exam Preparation */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Exam Preparation</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              title: 'Mock Tests',
              desc: '3 tests available',
              icon: DocumentMagnifyingGlassIcon,
              color: 'from-blue-400 to-blue-500'
            },
            { 
              title: 'Practice Papers',
              desc: 'Last year papers',
              icon: AcademicCapIcon,
              color: 'from-purple-400 to-purple-500'
            },
            { 
              title: 'Performance Analytics',
              desc: 'Track your progress',
              icon: ChartBarIcon,
              color: 'from-green-400 to-emerald-500'
            },
            { 
              title: 'Study Schedule',
              desc: 'Optimize your time',
              icon: ClockIcon,
              color: 'from-orange-400 to-red-500'
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br ${item.color} p-4 rounded-2xl text-gray-900`}
            >
              <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-white/80">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { title: 'SAT Prep', icon: SparklesIcon, color: 'from-pink-400 to-rose-500' },
            { title: 'AP Courses', icon: RocketLaunchIcon, color: 'from-violet-400 to-purple-500' },
            { title: 'Study Groups', icon: FireIcon, color: 'from-amber-400 to-orange-500' },
            { title: 'Research Projects', icon: LightBulbIcon, color: 'from-cyan-400 to-blue-500' },
          ].map((resource, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className={`flex-shrink-0 w-40 bg-gradient-to-br ${resource.color} p-4 rounded-2xl text-gray-900`}
            >
              <resource.icon className="w-6 h-6 mb-3" />
              <h3 className="font-bold">{resource.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { 
              title: 'Completed Math Quiz', 
              time: '2 hours ago', 
              icon: CheckCircleIcon, 
              color: 'bg-blue-50 text-blue-600' 
            },
            { 
              title: 'Submitted Physics Report', 
              time: '5 hours ago', 
              icon: DocumentTextIcon, 
              color: 'bg-purple-50 text-purple-600' 
            },
            { 
              title: 'Started New Chapter', 
              time: 'Yesterday', 
              icon: BookmarkIcon, 
              color: 'bg-green-50 text-green-600' 
            },
          ].map((activity, index) => (
            <div key={index} className={`flex items-center gap-4 p-4 rounded-xl ${activity.color.split(' ')[0]}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.color.split(' ')[1]}`}>
                <activity.icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-medium ${activity.color.split(' ')[1]}`}>{activity.title}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study Resources - Modified for 10th grade */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Advanced Study Materials</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { subject: 'Advanced Physics', icon: BeakerIcon, color: 'from-cyan-400 to-blue-500' },
            { subject: 'Calculus Prep', icon: SparklesIcon, color: 'from-violet-400 to-purple-500' },
            { subject: 'Literature Analysis', icon: BookOpenIcon, color: 'from-rose-400 to-pink-500' },
            { subject: 'Chemistry Lab', icon: BoltIcon, color: 'from-green-400 to-emerald-500' },
          ].map((resource, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className={`flex-shrink-0 w-48 bg-gradient-to-br ${resource.color} p-4 rounded-2xl text-gray-900`}
            >
              <resource.icon className="w-6 h-6 mb-3" />
              <h3 className="font-bold">{resource.subject}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}