'use client';

import { useRef, useEffect, useState } from 'react';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

interface CameraProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

export function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        // Try to get the best camera for document scanning
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        // Prefer back camera on mobile devices
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear')
        );

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: backCamera ? { exact: backCamera.deviceId } : undefined,
            facingMode: backCamera ? undefined : 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 4/3 }
          }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Store track for flash control
          const videoTrack = stream.getVideoTracks()[0];
          setTrack(videoTrack);
          
          // Check if flash/torch is available
          const capabilities = videoTrack.getCapabilities();
          setHasFlash('torch' in capabilities);
        }

        setCameraReady(true);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please ensure camera permissions are granted.');
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!track) return;
    
    try {
      const capabilities = track.getCapabilities();
      const settings = track.getSettings();
      
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{
            // @ts-ignore - torch is available but not in type definitions
            torch: !settings.torch
          }]
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (err) {
      console.error('Error toggling flash:', err);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.95 // High quality
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {error ? (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <>
          <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera overlay */}
            <div className="absolute inset-0 border-2 border-white border-opacity-50 pointer-events-none">
              <div className="absolute inset-4 border border-white border-opacity-30 rounded" />
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-4 inset-x-4 flex justify-between items-center">
              {hasFlash && (
                <button
                  onClick={toggleFlash}
                  className={`p-2 rounded-full ${
                    flashEnabled ? 'bg-yellow-500' : 'bg-gray-800 bg-opacity-50'
                  }`}
                >
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0012 18.469c-.944 0-1.844-.376-2.508-1.044l-.548.547z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={captureImage}
                disabled={!cameraReady}
                className={`p-4 rounded-full ${
                  cameraReady 
                    ? 'bg-white text-black hover:bg-gray-100' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <CameraIcon className="w-8 h-8" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-800 bg-opacity-50 text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <p className="mt-2 text-sm text-gray-600 text-center">
            Position the exam paper within the frame and ensure good lighting
          </p>
        </>
      )}
    </div>
  );
} 