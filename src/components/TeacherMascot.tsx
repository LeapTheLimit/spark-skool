import React from 'react';

interface TeacherMascotProps {
  className?: string;
  width?: number;
  height?: number;
  blinking?: boolean;
  variant?: 'blue' | 'white' | 'yellow' | 'teal' | 'purple' | 'orange' | 'rose' | 'indigo' | 'emerald' | 'amber';
  toolType?: 'grader' | 'creator' | 'games' | 'homework' | 'feedback' | 'analytics' | 'planner' | 'rubric' | 'default';
}

// This is identical to SparkMascot but with no animation effects at all
const TeacherMascot: React.FC<TeacherMascotProps> = ({
  className = '',
  width = 120,
  height = 120,
  variant = 'blue',
  toolType = 'default'
}) => {
  // Choose color based on variant - copied from original
  const mainColor = 
    variant === 'blue' ? "#3AB7FF" : 
    variant === 'white' ? "#FFFFFF" : 
    variant === 'yellow' ? "#FFD700" :
    variant === 'teal' ? "#0d9488" :
    variant === 'purple' ? "#9333ea" :
    variant === 'orange' ? "#f97316" :
    variant === 'rose' ? "#e11d48" :
    variant === 'indigo' ? "#6366f1" :
    variant === 'emerald' ? "#10b981" :
    variant === 'amber' ? "#f59e0b" : "#3AB7FF";
    
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 570 466" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M69.2003 67.9078C68.9188 64.3843 62.5636 62.9055 60.6693 65.9242C54.9631 75.0061 46.7335 85.9654 37.5897 91.4113C28.4427 96.8572 14.6459 99.0047 3.72044 99.8244C0.090764 100.098 -1.4326 106.264 1.67713 108.106C11.0328 113.645 22.3225 121.631 27.9326 130.51C33.5427 139.389 35.755 152.782 36.5995 163.388C36.881 166.911 43.2329 168.39 45.1306 165.371C50.8367 156.289 59.0631 145.33 68.2101 139.884C77.3572 134.438 91.1506 132.291 102.079 131.471C105.709 131.198 107.232 125.032 104.123 123.19C94.767 117.651 83.474 109.662 77.8672 100.786C72.2571 91.9063 70.0415 78.5134 69.2003 67.9078Z" fill={mainColor} />
      <path d="M459.423 3.55265C459.578 0.0227812 465.602 -1.38207 467.391 1.69773C475.779 16.1548 490.093 37.4176 506.33 47.0845C522.571 56.7515 548.582 59.4937 565.657 60.1977C569.297 60.3488 570.741 66.1966 567.568 67.9326C552.675 76.0757 530.774 89.9701 520.816 105.732C510.857 121.498 508.029 146.747 507.307 163.326C507.152 166.856 501.124 168.257 499.336 165.177C490.947 150.72 476.637 129.461 460.396 119.794C444.158 110.127 418.147 107.385 401.069 106.681C397.431 106.53 395.987 100.679 399.159 98.9459C414.052 90.7995 435.954 76.9083 445.913 61.1429C455.873 45.3806 458.697 20.1315 459.423 3.55265Z" fill={mainColor} />
      <path d="M314.278 118.972L306.845 108.113C278.116 66.138 263.749 45.1505 245.567 47.1851C227.385 49.2193 217.424 72.9276 197.508 120.345L192.355 132.612C186.694 146.087 183.865 152.824 178.889 157.617C173.913 162.41 167.354 164.716 154.239 169.329L142.298 173.528L133.914 176.481C93.3337 190.817 72.8283 199.072 69.2713 217.012C65.4773 236.149 83.4792 253.633 119.483 288.601L128.798 297.648C139.029 307.584 144.144 312.553 146.871 319.103C149.599 325.653 149.626 333.04 149.686 347.82L149.738 361.273C149.943 413.281 150.046 439.284 165.886 449.076C181.722 458.868 202.806 445.965 244.975 420.159L255.887 413.483C267.869 406.151 273.86 402.483 280.522 401.741C287.183 400.995 293.757 403.255 306.911 407.776L318.884 411.892C365.164 427.801 388.306 435.756 401.888 422.672C415.471 409.588 410.502 384.131 400.558 333.214L397.987 320.04C395.163 305.571 393.748 298.337 395.14 291.327C396.528 284.316 400.566 278.325 408.635 266.341L415.98 255.429C444.381 213.256 458.581 192.17 451.138 174.29C443.691 156.411 419.535 153.579 371.222 147.917L358.724 146.452C344.993 144.843 338.129 144.038 332.326 140.451C326.526 136.864 322.443 130.9 314.278 118.972Z" fill={mainColor} />
      <ellipse cx="220" cy="220" rx="25" ry="30" fill="white" />
      <ellipse cx="350" cy="220" rx="25" ry="30" fill="white" />
      
      {/* Eyes - always open, never blinking */}
      <circle cx="220" cy="225" r="15" fill="#333" />
      <circle cx="350" cy="225" r="15" fill="#333" />
      <circle cx="225" cy="215" r="5" fill="white" />
      <circle cx="355" cy="215" r="5" fill="white" />
      
      <path d="M230 300 Q285 350 340 300" stroke="#333" strokeWidth="8" fill="none" strokeLinecap="round" />

      {/* Tool-specific accessories */}
      {toolType === 'grader' && (
        <g>
          {/* Red pen */}
          <rect x="380" y="160" width="60" height="8" rx="2" transform="rotate(45 380 160)" fill="#e32636" />
          <path d="M420 120 L440 140" stroke="#e32636" strokeWidth="8" strokeLinecap="round" />
          
          {/* Checkmark */}
          <path d="M180 170 L200 190 L230 140" stroke="#22c55e" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      
      {toolType === 'creator' && (
        <g>
          <rect x="400" y="100" width="100" height="20" rx="2" transform="rotate(30 400 100)" fill="#fbbf24" />
          <path d="M400 100 L430 115" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M480 130 L495 140" stroke="#7c3aed" strokeWidth="6" strokeLinecap="round" />
        </g>
      )}
      
      {toolType === 'games' && (
        // Game controller for interactive exam games
        <rect x="260" y="120" width="50" height="30" rx="5" fill="#333" />
      )}
      
      {toolType === 'homework' && (
        // Book for homework maker
        <g>
          <rect x="245" y="100" width="80" height="15" rx="2" fill="#333" />
          <path d="M245 100 Q285 85 325 100" stroke="#333" strokeWidth="3" fill="none" />
        </g>
      )}
      
      {toolType === 'feedback' && (
        // Speech bubble for feedback generator
        <path d="M400 160 Q430 140 420 120 Q410 100 390 110 Q370 120 380 140 Z" stroke="#333" strokeWidth="3" fill="none" />
      )}
      
      {toolType === 'analytics' && (
        // Chart bars for analytics
        <g>
          <rect x="450" y="150" width="10" height="30" fill="#333" />
          <rect x="465" y="135" width="10" height="45" fill="#333" />
          <rect x="480" y="160" width="10" height="20" fill="#333" />
        </g>
      )}
      
      {toolType === 'planner' && (
        // Calendar for lesson planner
        <g>
          <rect x="150" y="130" width="40" height="40" stroke="#333" strokeWidth="3" fill="none" />
          <line x1="150" y1="140" x2="190" y2="140" stroke="#333" strokeWidth="2" />
          <line x1="160" y1="130" x2="160" y2="170" stroke="#333" strokeWidth="2" />
          <line x1="170" y1="130" x2="170" y2="170" stroke="#333" strokeWidth="2" />
          <line x1="180" y1="130" x2="180" y2="170" stroke="#333" strokeWidth="2" />
        </g>
      )}
      
      {toolType === 'rubric' && (
        // Checklist for rubric creator
        <g>
          <rect x="140" y="140" width="30" height="40" stroke="#333" strokeWidth="2" fill="none" />
          <line x1="145" y1="150" x2="165" y2="150" stroke="#333" strokeWidth="2" />
          <line x1="145" y1="160" x2="165" y2="160" stroke="#333" strokeWidth="2" />
          <line x1="145" y1="170" x2="165" y2="170" stroke="#333" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};

export default TeacherMascot; 