'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Route } from 'next';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalStyles from '@/components/GlobalStyles';

// SparkSkool Mascot component with animated eyes
const SparkMascot = (props: React.SVGProps<SVGSVGElement>) => {
  // State to control blinking
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Set up blinking interval
  useEffect(() => {
    // Random time between blinks (3-7 seconds)
    const getRandomBlinkTime = () => Math.floor(Math.random() * 4000) + 3000;
    
    // Function to trigger a blink
    const triggerBlink = () => {
      setIsBlinking(true);
      // Eyes stay closed for 200ms
      setTimeout(() => setIsBlinking(false), 200);
    };
    
    // Set initial timeout
    let blinkTimeout = setTimeout(triggerBlink, getRandomBlinkTime());
    
    // Set up interval for subsequent blinks
    const blinkInterval = setInterval(() => {
      clearTimeout(blinkTimeout);
      blinkTimeout = setTimeout(triggerBlink, getRandomBlinkTime());
    }, 7000);
    
    // Clean up
    return () => {
      clearTimeout(blinkTimeout);
      clearInterval(blinkInterval);
    };
  }, []);
  
  return (
    <svg
      width={570}
      height={466}
      viewBox="0 0 570 466"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Original mascot paths */}
      <path
        d="M69.2003 67.9078C68.9188 64.3843 62.5636 62.9055 60.6693 65.9242C54.9631 75.0061 46.7335 85.9654 37.5897 91.4113C28.4427 96.8572 14.6459 99.0047 3.72044 99.8244C0.090764 100.098 -1.4326 106.264 1.67713 108.106C11.0328 113.645 22.3225 121.631 27.9326 130.51C33.5427 139.389 35.755 152.782 36.5995 163.388C36.881 166.911 43.2329 168.39 45.1306 165.371C50.8367 156.289 59.0631 145.33 68.2101 139.884C77.3572 134.438 91.1506 132.291 102.079 131.471C105.709 131.198 107.232 125.032 104.123 123.19C94.767 117.651 83.474 109.662 77.8672 100.786C72.2571 91.9063 70.0415 78.5134 69.2003 67.9078Z"
        fill="#3AB7FF"
      />
      <path
        d="M459.423 3.55265C459.578 0.0227812 465.602 -1.38207 467.391 1.69773C475.779 16.1548 490.093 37.4176 506.33 47.0845C522.571 56.7515 548.582 59.4937 565.657 60.1977C569.297 60.3488 570.741 66.1966 567.568 67.9326C552.675 76.0757 530.774 89.9701 520.816 105.732C510.857 121.498 508.029 146.747 507.307 163.326C507.152 166.856 501.124 168.257 499.336 165.177C490.947 150.72 476.637 129.461 460.396 119.794C444.158 110.127 418.147 107.385 401.069 106.681C397.431 106.53 395.987 100.679 399.159 98.9459C414.052 90.7995 435.954 76.9083 445.913 61.1429C455.873 45.3806 458.697 20.1315 459.423 3.55265Z"
        fill="#3AB7FF"
      />
      <path
        d="M314.278 118.972L306.845 108.113C278.116 66.138 263.749 45.1505 245.567 47.1851C227.385 49.2193 217.424 72.9276 197.508 120.345L192.355 132.612C186.694 146.087 183.865 152.824 178.889 157.617C173.913 162.41 167.354 164.716 154.239 169.329L142.298 173.528L133.914 176.481C93.3337 190.817 72.8283 199.072 69.2713 217.012C65.4773 236.149 83.4792 253.633 119.483 288.601L128.798 297.648C139.029 307.584 144.144 312.553 146.871 319.103C149.599 325.653 149.626 333.04 149.686 347.82L149.738 361.273C149.943 413.281 150.046 439.284 165.886 449.076C181.722 458.868 202.806 445.965 244.975 420.159L255.887 413.483C267.869 406.151 273.86 402.483 280.522 401.741C287.183 400.995 293.757 403.255 306.911 407.776L318.884 411.892C365.164 427.801 388.306 435.756 401.888 422.672C415.471 409.588 410.502 384.131 400.558 333.214L397.987 320.04C395.163 305.571 393.748 298.337 395.14 291.327C396.528 284.316 400.566 278.325 408.635 266.341L415.98 255.429C444.381 213.256 458.581 192.17 451.138 174.29C443.691 156.411 419.535 153.579 371.222 147.917L358.724 146.452C344.993 144.843 338.129 144.038 332.326 140.451C326.526 136.864 322.443 130.9 314.278 118.972Z"
        fill="#3AB7FF"
      />
      
      {/* Eye whites */}
      <ellipse cx="220" cy="220" rx="25" ry="30" fill="white" />
      <ellipse cx="350" cy="220" rx="25" ry="30" fill="white" />
      
      {/* Pupils - conditionally rendered based on blinking state */}
      {!isBlinking ? (
        <>
          <circle cx="220" cy="225" r="15" fill="#333" />
          <circle cx="350" cy="225" r="15" fill="#333" />
          <circle cx="225" cy="215" r="5" fill="white" />
          <circle cx="355" cy="215" r="5" fill="white" />
        </>
      ) : (
        <>
          {/* Closed eyes - just thin lines */}
          <path d="M195 220 Q220 210 245 220" stroke="#333" strokeWidth="3" fill="none" />
          <path d="M325 220 Q350 210 375 220" stroke="#333" strokeWidth="3" fill="none" />
        </>
      )}
      
      {/* Smile */}
      <path
        d="M230 300 Q285 350 340 300"
        stroke="#333"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Feature list component with checkmark icons
const FeatureItem = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start space-x-3 mb-4">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#3ab8fe]/20 flex items-center justify-center mt-0.5">
      <svg className="w-4 h-4 text-[#3ab8fe]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
    <p className="text-gray-300 text-lg">{children}</p>
  </div>
);

// Chat bubble typing effect component
const ChatBubbleTypingEffect = ({ features }: { features: string[] }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Change feature every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [features]);
  
  return (
    <div className="min-h-[160px] flex flex-col">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-[#3ab8fe]/20 flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#3ab8fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="text-[#3ab8fe] text-lg font-medium">Spark</div>
      </div>
      
      <div className="relative pl-12">
        <div className="absolute left-5 top-3 w-4 h-4 bg-[#3ab8fe]/20 rotate-45"></div>
        <motion.div 
          key={currentFeature}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="bg-[#3ab8fe]/20 p-4 rounded-xl rounded-tl-none text-white text-lg max-w-[90%]"
        >
          {features[currentFeature]}
          <span className="inline-block w-2 h-5 ml-1 bg-white/70 animate-pulse"></span>
        </motion.div>
      </div>
    </div>
  );
};

interface SignupForm {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'student';
  school?: string;
  schoolCode?: string;
  subject?: string;
  classLevel?: string;
}

// Mock list of registered schools
const registeredSchools = [
  { name: "Springfield Elementary", code: "SPR123" },
  { name: "Riverdale High", code: "RIV456" },
  { name: "Westview Academy", code: "WST789" },
  { name: "Lincoln Middle School", code: "LMS321" },
  { name: "Oakridge College", code: "OAK654" }
];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schoolVerified, setSchoolVerified] = useState(false);
  const [verifyingSchool, setVerifyingSchool] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    school: '',
    schoolCode: '',
    subject: '',
    classLevel: ''
  });

  // Custom dropdown component to replace the native select
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const classLevelOptions = [
    { value: "elementary", label: "Elementary School" },
    { value: "middle", label: "Middle School" },
    { value: "high", label: "High School" },
    { value: "college", label: "College" }
  ];
  
  const handleClassLevelSelect = (value: string) => {
    setFormData({ ...formData, classLevel: value });
    setIsDropdownOpen(false);
  };

  const verifySchool = () => {
    if (!formData.schoolCode) {
      toast.error('Please enter a school code');
      return;
    }
    
    setVerifyingSchool(true);
    
    // Simulate API verification
    setTimeout(() => {
      const school = registeredSchools.find(s => s.code === formData.schoolCode);
      
      if (school) {
        setSchoolVerified(true);
        setFormData(prev => ({ ...prev, school: school.name }));
        toast.success(`Verified: ${school.name}`);
      } else {
        toast.error('Invalid school code');
      }
      
      setVerifyingSchool(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify student has a valid school
    if (formData.role === 'student' && !schoolVerified) {
      toast.error('Please verify your school code first');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Registration attempt:', { ...formData, password: '***' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get existing users
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      if (users.some((u: any) => u.email === formData.email)) {
        console.error('User already exists:', formData.email);
        toast.error('Email already registered');
        setIsLoading(false);
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify([...users, newUser]));
      
      // Set current user in localStorage (auto-login)
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      toast.success('Account created successfully!');
      
      // Redirect to role-specific dashboard
      const dashboardPath = formData.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
      router.push(dashboardPath as Route);

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated teacher features with grading tests
  const teacherFeatures = [
    "Create complete lesson plans in minutes, not hours",
    "Generate worksheets, quizzes, and activities with one click",
    "Grade tests and assignments in minutes, not hours",
    "Provide personalized feedback for every student automatically",
    "Create engaging presentations and visual aids in seconds",
    "Convert any learning material into interactive games",
    "Create materials adapted for different learning needs"
  ];
  
  // Updated student features with more engaging descriptions
  const studentFeatures = [
    "Get instant help with homework and complex problems",
    "Access personalized learning paths tailored to your style",
    "Practice with fun quizzes and interactive challenges",
    "Receive detailed feedback to improve your understanding",
    "Track your progress with visual analytics across subjects"
  ];

  // Add this useEffect to log when role changes
  useEffect(() => {
    console.log("Role changed to:", formData.role);
    console.log("Features to display:", formData.role === 'teacher' ? teacherFeatures : studentFeatures);
  }, [formData.role]);

  // Add custom styles for the dropdown
  useEffect(() => {
    // Add custom styles to make the dropdown menu match the dark theme
    const style = document.createElement('style');
    style.textContent = `
      select option {
        background-color: #1f2937;
        color: white;
        padding: 12px;
        font-size: 14px;
      }
      select {
        background-color: #111827;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add a useEffect to handle dropdown positioning
  useEffect(() => {
    if (isDropdownOpen) {
      // Force the dropdown to be visible by adding a style to the body
      document.body.style.overflow = 'hidden';
      
      // Clean up when dropdown closes
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isDropdownOpen]);

  return (
    <>
      <GlobalStyles />
      <div className="bg-gradient-to-br from-gray-900 to-black min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row py-8 px-4">
          {/* Left side - Mascot and Features - Hidden on mobile, shown on md screens and up */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="hidden md:flex flex-col items-center justify-center md:w-1/2 md:pr-8 md:sticky md:top-8"
          >
            <div className="text-center w-full mb-8">
              <h1 className="text-5xl font-bold text-white mb-3">Meet <span className="text-[#3ab8fe]">Spark</span></h1>
              <p className="text-2xl text-gray-300">Your ultimate classroom AI copilot</p>
            </div>
            
            <div className="flex flex-col items-center w-full">
              {/* Centered mascot */}
              <div className="w-4/5 mx-auto mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -10, 0]
                  }}
                  transition={{ 
                    scale: { duration: 0.8, type: "spring", delay: 0.3 },
                    opacity: { duration: 0.8, delay: 0.3 },
                    y: { 
                      duration: 3, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      ease: "easeInOut",
                      delay: 1
                    }
                  }}
                  className="cursor-pointer"
                >
                  <SparkMascot className="w-full h-auto" />
                </motion.div>
        </div>

              {/* Chat bubble below mascot */}
              <div className="w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={formData.role}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatBubbleTypingEffect 
                      features={formData.role === 'teacher' ? teacherFeatures : studentFeatures} 
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right side - Registration Form */}
          <div className="md:w-1/2 md:flex md:justify-center md:items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-lg p-4 sm:p-6 pb-4 rounded-3xl border border-gray-700 shadow-2xl w-full max-w-md md:max-w-lg"
            >
              {/* Mobile-only mascot and features */}
              <div className="md:hidden flex flex-col items-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Meet <span className="text-[#3ab8fe]">Spark</span></h1>
                <p className="text-base text-gray-300 mb-4">Your classroom AI copilot</p>
                <div className="w-32 h-32 mb-4">
                  <SparkMascot className="w-full h-full" />
                </div>

                {/* Mobile features display */}
                <div className="bg-[#3ab8fe]/10 p-4 rounded-xl w-full mb-4">
                  <h3 className="text-[#3ab8fe] text-sm font-medium mb-2">
                    {formData.role === 'teacher' ? 'For Teachers:' : 'For Students:'}
                  </h3>
                  <ul className="space-y-2">
                    {(formData.role === 'teacher' ? teacherFeatures : studentFeatures).slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-4 h-4 text-[#3ab8fe] mt-1 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Create your account
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'teacher' })}
                      className={`py-2 px-4 rounded-full text-center transition-all duration-200 ${
                        formData.role === 'teacher'
                          ? 'bg-[#3ab8fe] text-white font-medium'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Teacher
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`py-2 px-4 rounded-full text-center transition-all duration-200 ${
                        formData.role === 'student'
                          ? 'bg-[#3ab8fe] text-white font-medium'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      Student
                    </button>
                  </div>
                </div>

          <div className="space-y-4">
                  {/* Full Name - Floating Label */}
                  <div className="relative">
              <input
                      id="fullName"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                        text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                        transition-all duration-200"
                      placeholder="Full name"
                    />
                    <label 
                      htmlFor="fullName" 
                      className="absolute text-sm text-gray-400 duration-300 transform 
                        -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                        peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                        peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                        peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                    >
                      Full Name
                    </label>
            </div>

                  {/* Email - Floating Label */}
                  <div className="relative">
              <input
                      id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                        text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                        transition-all duration-200"
                      placeholder="Email"
                    />
                    <label 
                      htmlFor="email" 
                      className="absolute text-sm text-gray-400 duration-300 transform 
                        -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                        peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                        peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                        peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                    >
                      Email
                    </label>
            </div>

                  {/* Password - Floating Label */}
                  <div className="relative">
              <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                        text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                        transition-all duration-200"
                      placeholder="Password"
                    />
                    <label 
                      htmlFor="password" 
                      className="absolute text-sm text-gray-400 duration-300 transform 
                        -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                        peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                        peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                        peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Class Level - Styled to Match Other Fields */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                        text-white focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-[#3ab8fe]
                        transition-all duration-200 text-left"
                    >
                      <span className={formData.classLevel ? "text-white" : "text-transparent"}>
                        {formData.classLevel 
                          ? classLevelOptions.find(opt => opt.value === formData.classLevel)?.label 
                          : "Class Level"}
                      </span>
                    </button>
                    
                    <label 
                      htmlFor="classLevel" 
                      className="absolute text-sm text-gray-400 duration-300 transform 
                        -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                        peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                        peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                        peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                    >
                      Class Level
                    </label>
                    
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-[100] w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
                        <ul className="py-1 overflow-auto max-h-60">
                          {classLevelOptions.map((option) => (
                            <li 
                              key={option.value}
                              onClick={() => handleClassLevelSelect(option.value)}
                              className={`px-4 py-3 hover:bg-gray-700 cursor-pointer flex items-center ${
                                formData.classLevel === option.value ? "bg-[#3ab8fe]/10 text-[#3ab8fe]" : "text-white"
                              }`}
                            >
                              {formData.classLevel === option.value && (
                                <svg className="w-4 h-4 mr-2 text-[#3ab8fe]" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {option.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <input
                      type="hidden"
                      id="classLevel"
                      name="classLevel"
                      value={formData.classLevel || ''}
                      required
              />
            </div>

                  {/* Student School Verification */}
                  {formData.role === 'student' && (
                    <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 mt-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">School Verification</h3>
                      <p className="text-xs text-gray-400 mb-4">
                        Students must verify their school to register. Enter your school code below.
                      </p>
                      
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={formData.schoolCode || ''}
                          onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                          disabled={schoolVerified}
                          className="flex-1 px-4 py-2 bg-gray-900/70 border border-gray-700 rounded-xl 
                            text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                            disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                          placeholder="Enter school code"
                        />
                        <button
                          type="button"
                          onClick={verifySchool}
                          disabled={verifyingSchool || schoolVerified}
                          className="px-4 py-2 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90 text-white rounded-xl 
                            font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]
                            disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {verifyingSchool ? 'Verifying...' : schoolVerified ? 'Verified' : 'Verify'}
                        </button>
            </div>

                      {schoolVerified && (
                        <div className="mt-3 flex items-center text-green-400 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Verified: {formData.school}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Teacher-specific fields */}
            {formData.role === 'teacher' && (
                    <div className="space-y-4 mt-4">
                      {/* School Name - Floating Label */}
                      <div className="relative">
                  <input
                          id="school"
                    type="text"
                          required
                    value={formData.school || ''}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                          className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                            text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                            transition-all duration-200"
                          placeholder="School name"
                        />
                        <label 
                          htmlFor="school" 
                          className="absolute text-sm text-gray-400 duration-300 transform 
                            -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                            peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                            peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                        >
                          School Name
                        </label>
                </div>

                      {/* Subject Taught - Floating Label */}
                      <div className="relative">
                  <input
                          id="subject"
                    type="text"
                          required
                    value={formData.subject || ''}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="peer block w-full px-4 py-2.5 sm:py-3 bg-gray-900/70 border border-gray-700 rounded-full
                            text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent
                            transition-all duration-200"
                          placeholder="Subject taught"
                        />
                        <label 
                          htmlFor="subject" 
                          className="absolute text-sm text-gray-400 duration-300 transform 
                            -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-gray-900 px-2 peer-focus:px-2 
                            peer-focus:text-[#3ab8fe] peer-placeholder-shown:scale-100 
                            peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 
                            peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3"
                        >
                          Subject Taught
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-gray-400 mt-2">
                  No credit card required
          </div>

                {/* Create Account Button */}
          <button
            type="submit"
                  disabled={isLoading || (formData.role === 'student' && !schoolVerified)}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90
                    text-white font-bold rounded-full shadow-lg shadow-[#3ab8fe]/20
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Creating Account...' : 'Free Sign Up'}
          </button>
                
                {/* Login Link */}
                <div className="text-center text-sm text-gray-400 mt-4">
                  Already a member? <Link href="/auth/login" className="text-[#3ab8fe] hover:text-[#3ab8fe]/80 transition-colors">Sign in</Link>
                </div>
                
                {/* Terms */}
                <div className="text-center text-xs text-gray-500 mt-4">
                  By registering, you agree to the <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a> and <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
                </div>
        </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}