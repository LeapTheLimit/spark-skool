import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { type Route } from 'next';

export default function Sidebar() {
  const menuItems = [
    { title: 'Dashboard', icon: '/icons/dashboard.svg', href: '/dashboard/teacher' as Route },
    { title: 'Content', icon: '/icons/materials.svg', href: '/dashboard/teacher/content' as Route },
    { title: 'Students', icon: '/icons/students.svg', href: '/dashboard/teacher/students' as Route },
  ];

  return (
    <div className="w-[240px] bg-[#111111] border-r border-gray-800">
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2 mb-8 px-4">
          <Image src="/logo.svg" alt="SparkSkool" width={32} height={32} />
          <span className="font-bold text-xl text-white">SparkSkool</span>
        </Link>
        
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1a1a]"
            >
              <Image src={item.icon} alt={item.title} width={20} height={20} />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
} 