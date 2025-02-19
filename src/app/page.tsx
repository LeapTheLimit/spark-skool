import Image from "next/image";
import Link from "next/link";
import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          SPARK SKOOL
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Transforming education with AI-powered learning
          </p>
          
          <div className="flex gap-6 justify-center">
            <Link
              href="/dashboard/teacher"
              className="rounded-full bg-blue-600 px-8 py-4 text-white hover:bg-blue-700 transition-all hover:scale-105"
            >
              Teacher Portal
            </Link>
            <Link
              href="/dashboard/student"
              className="rounded-full bg-purple-600 px-8 py-4 text-white hover:bg-purple-700 transition-all hover:scale-105"
            >
              Student Portal
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl mb-6 flex items-center justify-center">
              <Image
                src="/icons/teacher.svg"
                alt="Teacher"
                width={32}
                height={32}
                className="text-blue-600"
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">For Teachers</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Create engaging content, track progress, and leverage AI to enhance your teaching experience.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl mb-6 flex items-center justify-center">
              <Image
                src="/icons/student.svg"
                alt="Student"
                width={32}
                height={32}
                className="text-purple-600"
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">For Students</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Experience personalized learning with AI tutoring and interactive content.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
