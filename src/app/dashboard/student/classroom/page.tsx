'use client';

import { motion } from "framer-motion";
import { 
  MicrophoneIcon, 
  VideoCameraIcon,
  HandRaisedIcon,
  PaperClipIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";
import { classroomPeople } from "@/data/classroom-people";
import Image from 'next/image';

export default function ClassroomPage() {
  const { teacher, self, peers } = classroomPeople;

  return (
    <div className="h-[100dvh] overflow-hidden bg-white flex flex-col">
      {/* Teacher Stream with Overlay Header - Made 5% smaller */}
      <div className="relative h-[65vh] bg-gray-100">
        <Image 
          src={teacher.image}
          alt={teacher.name}
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay Header */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-3">
            <button className="text-white">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">English Grammar</h1>
              <p className="text-sm text-white/80">00:22:25</p>
            </div>
          </div>
        </div>

        {/* Control Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <button className="p-3 bg-black/20 rounded-full text-white hover:bg-black/30">
            <MicrophoneIcon className="w-6 h-6" />
          </button>
          <button className="p-3 bg-black/20 rounded-full text-white hover:bg-black/30">
            <VideoCameraIcon className="w-6 h-6" />
          </button>
          <button className="p-3 bg-black/20 rounded-full text-white hover:bg-black/30">
            <HandRaisedIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Self View - Added rounded corners */}
        <div className="absolute left-4 bottom-4 w-32 aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
          <Image 
            src={self.image}
            alt={self.name}
            width={128}
            height={96}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Section - Fixed height */}
      <div className="h-[35vh] bg-white p-4 space-y-3">
        {/* Participants */}
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            +
          </button>
          {peers.map((peer) => (
            <div key={peer.id} className="relative">
              <Image
                src={peer.image}
                alt={peer.name}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              {peer.id === 3 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="text-xs">😂</div>
                </div>
              )}
            </div>
          ))}
          <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm">
            +12
          </div>
        </div>

        {/* Chat Message */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/avatars/peer-1.png"
              alt="Esther Howard"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">Esther Howard</p>
              <p className="text-gray-500 text-sm">Haha that's terrifying 😂</p>
            </div>
            <span className="ml-auto text-xs text-gray-400">9:27am</span>
          </div>
        </div>

        {/* Chat Input */}
        <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-full">
          <input
            type="text"
            placeholder="Text message..."
            className="flex-1 bg-transparent px-3 text-sm focus:outline-none"
          />
          <button className="text-gray-400">
            <PaperClipIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 