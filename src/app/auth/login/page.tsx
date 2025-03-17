'use client';

import { useState, useEffect } from 'react';
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Features to display in the chat bubble
  const features = [
    "Welcome back to your AI classroom assistant",
    "Access all your personalized learning materials",
    "Continue where you left off with your students",
    "Check student progress and performance analytics",
    "Generate new lesson plans and activities in seconds",
    "Get instant help with grading and feedback"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Login attempt:', { email });
      
      // Check if user exists in localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);

      if (!user) {
        console.error('User not found:', email);
        toast.error('User not found');
        setIsLoading(false);
        return;
      }

      if (user.password !== password) {
        console.error('Invalid password for:', email);
        toast.error('Invalid password');
        setIsLoading(false);
        return;
      }

      // Store user in both localStorage and cookies
      localStorage.setItem('currentUser', JSON.stringify(user));
      document.cookie = `currentUser=${JSON.stringify(user)}; path=/`;
      
      // Force page reload to dashboard
      if (user.role === 'teacher') {
        window.location.href = '/dashboard/teacher';
      } else {
        window.location.href = '/dashboard/student';
      }

      // Show success message after redirect is initiated
      toast.success('Login successful!');
      return; // Immediate return after redirect

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      setIsLoading(false);
    }
  };

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
            className="hidden md:flex flex-col items-center justify-center md:w-1/2 md:pr-8"
          >
            <div className="text-center w-full mb-8">
              <h1 className="text-5xl font-bold text-white mb-3">Welcome <span className="text-[#3ab8fe]">Back</span></h1>
              <p className="text-2xl text-gray-300">Sign in to your AI copilot</p>
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
                    key="features"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatBubbleTypingEffect features={features} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <div className="md:w-1/2 md:flex md:justify-center md:items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-lg p-4 sm:p-6 pb-4 rounded-3xl border border-gray-700 shadow-2xl w-full max-w-md"
            >
              {/* Mobile-only mascot and features */}
              <div className="md:hidden flex flex-col items-center mb-6">
                <div className="w-32 h-32 mb-4">
                  <SparkMascot className="w-full h-full" />
                </div>
                
                {/* Mobile title */}
                <h1 className="text-3xl font-bold text-white mb-2">Welcome <span className="text-[#3ab8fe]">Back</span></h1>
                <p className="text-base text-gray-300 mb-4">Sign in to your AI copilot</p>
              </div>

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Sign in to your account
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email - Floating Label */}
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Remember me / Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-[#3ab8fe] focus:ring-[#3ab8fe] border-gray-700 rounded bg-gray-900/70"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-[#3ab8fe] hover:text-[#3ab8fe]/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="text-center text-sm text-gray-400 mt-2">
                  No credit card required
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#3ab8fe] hover:bg-[#3ab8fe]/90
                    text-white font-bold rounded-full shadow-lg shadow-[#3ab8fe]/20
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3ab8fe]
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
                
                {/* Register Link */}
                <div className="text-center text-sm text-gray-400 mt-4">
                  Don't have an account? <Link href="/auth/register" className="text-[#3ab8fe] hover:text-[#3ab8fe]/80 transition-colors">Sign up</Link>
                </div>
                
                {/* Terms - reduced bottom margin */}
                <div className="text-center text-xs text-gray-500 mt-4">
                  By signing in, you agree to the <a href="#" className="text-gray-400 hover:text-white">Terms of Use</a> and <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}