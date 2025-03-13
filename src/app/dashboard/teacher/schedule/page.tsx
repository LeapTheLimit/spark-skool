'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CalendarIcon, 
  PlusIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  XMarkIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, addDays, subDays, isSameDay, addMonths, subMonths, addYears, subYears, addWeeks } from 'date-fns';

interface ScheduleEvent {
  id: number;
  title: string;
  description: string;
  eventType: 'class' | 'meeting' | 'break' | 'office-hours' | 'other';
  day: string;
  date: Date;
  startTime: string;
  endTime: string;
  students: number;
  room: string;
  color: string;
  isRecurring: boolean;
  recurrencePattern: 'daily' | 'weekly' | 'monthly' | 'none';
  recurrenceEndDate?: Date;
  recurrenceCount?: number;
}

const colorOptions = [
  { label: 'Blue', value: 'bg-blue-100 border-blue-400 text-blue-700' },
  { label: 'Purple', value: 'bg-purple-100 border-purple-400 text-purple-700' },
  { label: 'Green', value: 'bg-green-100 border-green-400 text-green-700' },
  { label: 'Amber', value: 'bg-amber-100 border-amber-400 text-amber-700' },
  { label: 'Rose', value: 'bg-rose-100 border-rose-400 text-rose-700' },
];

export default function SchedulePage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showClassModal, setShowClassModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [classes, setClasses] = useState<ScheduleEvent[]>([]);
  const [nextClass, setNextClass] = useState<ScheduleEvent | null>(null);
  
  // Form state for adding/editing classes
  const [formData, setFormData] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    eventType: 'class',
    day: 'Monday',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:30',
    students: 25,
    room: '',
    color: colorOptions[0].value,
    isRecurring: false,
    recurrencePattern: 'none',
    recurrenceCount: 10
  });

  // Add these new state variables near the top of the component
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [workDayStart, setWorkDayStart] = useState<number>(8); // 8 AM
  const [workDayEnd, setWorkDayEnd] = useState<number>(17); // 5 PM
  const [workingHoursStep, setWorkingHoursStep] = useState<number>(1); // 1 hour increments
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Update all input types with proper styling
  const inputClasses = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black font-medium";

  // Load saved classes from localStorage on component mount
  useEffect(() => {
    try {
      const savedClasses = localStorage.getItem('teacherClasses');
      if (savedClasses) {
        const parsedClasses = JSON.parse(savedClasses);
        // Convert string dates back to Date objects
        const classesWithDates = parsedClasses.map((cls: any) => ({
          ...cls,
          date: new Date(cls.date)
        }));
        setClasses(classesWithDates);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  }, []);

  // Save classes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('teacherClasses', JSON.stringify(classes));
    } catch (error) {
      console.error('Failed to save classes:', error);
    }
  }, [classes]);

  // Find the next upcoming class
  useEffect(() => {
    const now = new Date();
    const upcomingClasses = classes.filter(cls => {
      const classDate = new Date(cls.date);
      const [hours, minutes] = cls.startTime.split(':').map(Number);
      classDate.setHours(hours, minutes);
      return classDate > now;
    });
    
    if (upcomingClasses.length > 0) {
      // Sort by date and time
      upcomingClasses.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const [hoursA, minutesA] = a.startTime.split(':').map(Number);
        const [hoursB, minutesB] = b.startTime.split(':').map(Number);
        dateA.setHours(hoursA, minutesA);
        dateB.setHours(hoursB, minutesB);
        return dateA.getTime() - dateB.getTime();
      });
      
      setNextClass(upcomingClasses[0]);
    } else {
      setNextClass(null);
    }
  }, [classes]);

  // Load schedule settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('teacherScheduleSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.workingDays) setWorkingDays(settings.workingDays);
        if (settings.workDayStart) setWorkDayStart(settings.workDayStart);
        if (settings.workDayEnd) setWorkDayEnd(settings.workDayEnd);
        if (settings.workingHoursStep) setWorkingHoursStep(settings.workingHoursStep);
      }
    } catch (error) {
      console.error('Failed to load schedule settings:', error);
    }
  }, []);

  // Save schedule settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('teacherScheduleSettings', JSON.stringify({
        workingDays,
        workDayStart,
        workDayEnd,
        workingHoursStep
      }));
    } catch (error) {
      console.error('Failed to save schedule settings:', error);
    }
  }, [workingDays, workDayStart, workDayEnd, workingHoursStep]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, date: new Date(e.target.value) }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      eventType: 'class',
      day: 'Monday',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:30',
      students: 25,
      room: '',
      color: colorOptions[0].value,
      isRecurring: false,
      recurrencePattern: 'none',
      recurrenceCount: 10
    });
    setIsEditMode(false);
  };

  const handleAddClass = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    // Generate a day value from the selected date
    const dayOfWeek = format(formData.date || new Date(), 'EEEE');
    
    if (isEditMode && formData.id) {
      // Update existing class
      setClasses(prev => prev.map(cls => 
        cls.id === formData.id ? { ...formData, day: dayOfWeek } as ScheduleEvent : cls
      ));
    } else {
      // Generate a unique base ID
      const baseId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1;
      
      if (formData.isRecurring && formData.recurrencePattern !== 'none') {
        // Create recurring classes
        const newClasses: ScheduleEvent[] = [];
        const baseDate = new Date(formData.date || new Date());
        
        for (let i = 0; i < (formData.recurrenceCount || 10); i++) {
          let nextDate = new Date(baseDate);
          
          // Calculate next date based on recurrence pattern
          if (formData.recurrencePattern === 'daily') {
            nextDate = addDays(baseDate, i);
          } else if (formData.recurrencePattern === 'weekly') {
            nextDate = addWeeks(baseDate, i);
          } else if (formData.recurrencePattern === 'monthly') {
            nextDate = addMonths(baseDate, i);
          }
          
          // Create a new class instance
          newClasses.push({
            ...formData,
            id: baseId + i,
            date: nextDate,
            day: format(nextDate, 'EEEE')
          } as ScheduleEvent);
        }
        
        // Add all recurring instances
        setClasses(prev => [...prev, ...newClasses]);
      } else {
        // Add a single non-recurring class
        setClasses(prev => [
          ...prev, 
          { ...formData, id: baseId, day: dayOfWeek } as ScheduleEvent
        ]);
      }
    }
    
    setShowClassModal(false);
    resetForm();
  };

  const handleEditClass = (id: number) => {
    const classToEdit = classes.find(c => c.id === id);
    if (classToEdit) {
      setFormData(classToEdit);
      setIsEditMode(true);
      setShowClassModal(true);
    }
  };

  const handleDeleteClass = (id: number) => {
    if (confirm('Are you sure you want to delete this class?')) {
      setClasses(prev => prev.filter(cls => cls.id !== id));
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 7) : addDays(currentDate, 7));
    } else if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === 'year') {
      setCurrentDate(direction === 'prev' ? subYears(currentDate, 1) : addYears(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Update daysOfWeek to use the workingDays state
  const allDaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysOfWeek = workingDays;

  // Add back these missing variables
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = workDayStart; hour < workDayEnd; hour += workingHoursStep) {
      slots.push(hour);
    }
    return slots;
  }, [workDayStart, workDayEnd, workingHoursStep]);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Function to get classes for a specific day
  const getClassesForDay = (day: string) => {
    return classes.filter(cls => cls.day === day);
  };

  // Function to get classes for a specific date
  const getClassesForDate = (date: Date) => {
    return classes.filter(cls => 
      isSameDay(new Date(cls.date), date)
    );
  };

  // Remove the dayRangeOptions and handleDayRangeChange function
  // Instead, add this function to toggle individual days
  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day].sort((a, b) => 
        allDaysOfWeek.indexOf(a) - allDaysOfWeek.indexOf(b)
      ));
    }
  };

  // Add event type options
  const eventTypeOptions = [
    { label: 'Class', value: 'class', icon: BookOpenIcon },
    { label: 'Meeting', value: 'meeting', icon: UsersIcon },
    { label: 'Break', value: 'break', icon: ClockIcon },
    { label: 'Office Hours', value: 'office-hours', icon: CalendarIcon },
    { label: 'Other', value: 'other', icon: PlusIcon }
  ];

  // Function to get the icon for an event type
  const getEventIcon = (eventType: string) => {
    const option = eventTypeOptions.find(opt => opt.value === eventType);
    if (option) {
      const Icon = option.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <BookOpenIcon className="w-4 h-4" />; // Default icon
  };

  // Helper function to get the proper event type name
  const getEventTypeName = (eventType: string) => {
    const option = eventTypeOptions.find(opt => opt.value === eventType);
    return option ? option.label : 'Event';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Schedule</h1>
          
          <div className="flex items-center gap-4">
            {/* View controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              {/* View switcher */}
              <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    viewMode === 'week' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    viewMode === 'month' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Month
                </button>
                <button 
                  onClick={() => setViewMode('year')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    viewMode === 'year' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Year
                </button>
              </div>
              
              {/* Add class button */}
              <button 
                onClick={() => {
                  resetForm();
                  setShowClassModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Event</span>
              </button>

              {/* Schedule Settings button */}
              <button
                onClick={() => setShowScheduleSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Schedule Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar navigation */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <CalendarIcon className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="text-lg font-medium text-gray-900">
                {viewMode === 'week' 
                  ? `Week of ${format(currentDate, 'MMMM d, yyyy')}` 
                  : viewMode === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : format(currentDate, 'yyyy')}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleNavigate('prev')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={goToToday}
                className="py-1.5 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-md"
              >
                Today
              </button>
              <button 
                onClick={() => handleNavigate('next')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Google Calendar Integration Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-amber-800 font-medium">Google Calendar Integration Coming Soon</p>
            <p className="text-amber-700 text-sm mt-1">Soon you'll be able to sync your class schedule with Google Calendar and receive reminders!</p>
          </div>
        </div>
        
        {/* No Classes Message (when empty) */}
        {classes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No classes scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first class!</p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowClassModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Your First Class
              </button>
            </div>
          </div>
        )}

        {/* Weekly View */}
        {viewMode === 'week' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Time slots header */}
            <div className={`grid grid-cols-${daysOfWeek.length + 1} border-b`}>
              <div className="p-4 border-r text-center font-medium text-gray-500 bg-gray-50">Time</div>
              {daysOfWeek.map(day => (
                <div key={day} className="p-4 border-r text-center font-medium text-gray-700 bg-gray-50 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Time slots */}
            {timeSlots.map(hour => (
              <div key={hour} className={`grid grid-cols-${daysOfWeek.length + 1} border-b last:border-b-0`}>
                <div className="py-6 px-4 border-r text-center text-sm text-gray-500 bg-gray-50">
                  {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
                </div>
                
                {daysOfWeek.map(day => {
                  const classesForDay = classes.filter(c => 
                    c.day === day && 
                    parseInt(c.startTime.split(':')[0]) === hour
                  );
                  
                  return (
                    <div key={`${day}-${hour}`} className="p-2 border-r last:border-r-0 min-h-[100px] relative">
                      {classesForDay.map(cls => (
                        <div 
                          key={cls.id}
                          className={`absolute inset-2 rounded-lg p-2 ${cls.color} flex flex-col cursor-pointer shadow-sm`}
                          onClick={() => handleEditClass(cls.id)}
                          style={{ border: '1px solid currentColor' }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-bold truncate">{cls.title || "Untitled Event"}</div>
                            {/* Show event type icon */}
                            <div className="flex items-center">
                              {cls.isRecurring && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-current mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              )}
                              {getEventIcon(cls.eventType || 'class')}
                            </div>
                          </div>
                          
                          <div className="text-xs flex items-center mt-1">
                            <ClockIcon className="w-3 h-3 flex-shrink-0 mr-1" />
                            <span className="truncate">{cls.startTime} - {cls.endTime}</span>
                          </div>
                          
                          {cls.room && (
                            <div className="text-xs flex items-center mt-1">
                              <BookOpenIcon className="w-3 h-3 flex-shrink-0 mr-1" />
                              <span className="truncate">{cls.room}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        
        {/* Monthly View */}
        {classes.length > 0 && viewMode === 'month' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b">
              {allDaysOfWeek.map(day => (
                <div key={day} className="p-3 text-center font-medium text-gray-700 bg-gray-50">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {(() => {
                // Get first day of month
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                // Get the day of week (0 = Sunday, 1 = Monday, etc.)
                const firstDayOfWeek = firstDay.getDay();
                // Get last day of month
                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                // Total days to show (including days from previous/next month to fill grid)
                const totalDays = 42; // 6 weeks, 7 days each
                
                // Generate cells for all days
                const cells = [];
                
                // Previous month days
                for (let i = 0; i < firstDayOfWeek; i++) {
                  const prevMonthDay = new Date(firstDay);
                  prevMonthDay.setDate(prevMonthDay.getDate() - (firstDayOfWeek - i));
                  
                  cells.push(
                    <div key={`prev-${i}`} className="border-r border-b p-2 min-h-[100px] bg-gray-50">
                      <div className="text-sm text-gray-400 mb-1">{prevMonthDay.getDate()}</div>
                    </div>
                  );
                }
                
                // Current month days
                for (let day = 1; day <= lastDay.getDate(); day++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const classesForDate = getClassesForDate(date);
                  const isToday = isSameDay(date, new Date());
                  
                  cells.push(
                    <div 
                      key={`current-${day}`} 
                      className={`border-r border-b p-2 min-h-[100px] ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'}`}>
                          {day}
                        </span>
                      </div>
                      
                      <div className="overflow-y-auto max-h-20">
                        {classesForDate.slice(0, 2).map((cls) => (
                          <div 
                            key={cls.id} 
                            className={`mt-1 p-1.5 text-xs ${cls.color} border rounded cursor-pointer`}
                            onClick={() => handleEditClass(cls.id)}
                          >
                            <div className="text-sm font-bold truncate">{cls.title}</div>
                            <div className="flex items-center mt-0.5">
                              <ClockIcon className="w-2.5 h-2.5 flex-shrink-0 mr-0.5" />
                              <span className="truncate">{cls.startTime}</span>
                            </div>
                          </div>
                        ))}
                        {classesForDate.length > 2 && (
                          <div className="mt-1 text-xs text-blue-600 font-medium text-center">
                            +{classesForDate.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Next month days
                const remainingCells = totalDays - cells.length;
                for (let i = 1; i <= remainingCells; i++) {
                  cells.push(
                    <div key={`next-${i}`} className="border-r border-b p-2 min-h-[100px] bg-gray-50">
                      <div className="text-sm text-gray-400 mb-1">{i}</div>
                    </div>
                  );
                }
                
                return cells;
              })()}
            </div>
          </div>
        )}
        
        {/* Yearly View */}
        {classes.length > 0 && viewMode === 'year' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-3 gap-6">
              {months.map((month, monthIndex) => (
                <div key={month} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 p-2 text-center font-medium text-gray-700 border-b">
                    {month}
                  </div>
                  <div className="grid grid-cols-7 text-center text-xs py-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                      <div key={`${month}-${d}`} className="py-1 text-gray-500">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 p-2 text-center text-xs">
                    {/* Mini calendar days */}
                    {Array.from({ length: 35 }, (_, i) => {
                      const date = new Date(currentDate.getFullYear(), monthIndex, i - new Date(currentDate.getFullYear(), monthIndex, 1).getDay() + 1);
                      if (date.getMonth() !== monthIndex) return <div key={`${month}-day-${i}`}></div>;
                      
                      const hasClasses = getClassesForDate(date).length > 0;
                      const isToday = isSameDay(date, new Date());
                      
                      return (
                        <div 
                          key={`${month}-day-${i}`} 
                          className={`rounded-full w-6 h-6 mx-auto flex items-center justify-center ${
                            hasClasses ? 'bg-blue-100 text-blue-700' : isToday ? 'bg-gray-200' : ''
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Update the event list heading and add filtering */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Schedule</h2>
            
            {/* Add event type filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Filter by:</span>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button 
                  onClick={() => setEventTypeFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium ${
                    eventTypeFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                {eventTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setEventTypeFilter(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium flex items-center ${
                      eventTypeFilter === option.value ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <option.icon className="w-3.5 h-3.5 mr-1" />
                    {option.label}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  {eventTypeFilter === 'all' || eventTypeFilter === 'class' ? (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  ) : null}
                  {eventTypeFilter === 'all' || ['class', 'meeting', 'office-hours'].includes(eventTypeFilter) ? (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  ) : null}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes
                  .filter(cls => eventTypeFilter === 'all' || cls.eventType === eventTypeFilter)
                  .map(cls => (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${cls.color.replace('text-', 'bg-').replace(/bg-.*?-100/g, (match) => match.replace('100', '600'))} mr-3`}></div>
                          <div className="flex gap-2 items-center">
                            {getEventIcon(cls.eventType || 'class')}
                            <div>
                              <div className="font-medium text-gray-900">{cls.title}</div>
                              {cls.description && (
                                <div className="text-sm text-gray-500">{cls.description}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {format(new Date(cls.date), 'MMM d, yyyy')} ({cls.day})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cls.startTime} - {cls.endTime}</td>
                      {(eventTypeFilter === 'all' || eventTypeFilter === 'class') && (
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {cls.eventType === 'class' ? cls.students : '-'}
                        </td>
                      )}
                      {(eventTypeFilter === 'all' || ['class', 'meeting', 'office-hours'].includes(eventTypeFilter)) && (
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{cls.room || '-'}</td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditClass(cls.id)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditMode ? `Edit ${getEventTypeName(formData.eventType || 'class')}` : `Add ${getEventTypeName(formData.eventType || 'class')}`}
              </h3>
              <button 
                onClick={() => setShowClassModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleAddClass();
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      {formData.eventType ? `${getEventTypeName(formData.eventType)} Title*` : "Title*"}
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                      placeholder={`e.g. ${formData.eventType === 'class' ? 'Algebra I' : 
                                    formData.eventType === 'meeting' ? 'Team Meeting' : 
                                    formData.eventType === 'break' ? 'Lunch Break' : 
                                    formData.eventType === 'office-hours' ? 'Office Hours' : 'Event Title'}`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                      placeholder="Optional class description"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Date*
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
                      onChange={handleDateChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The day of the week will be automatically determined from this date.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Start Time*
                      </label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        End Time*
                      </label>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">
                      Event Type
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                    >
                      {eventTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Conditionally show fields based on event type */}
                  {formData.eventType === 'class' && (
                    <>
                      {/* Student count field */}
                      <div>
                        <label htmlFor="students" className="block text-sm font-medium text-gray-700">
                          Number of Students
                        </label>
                        <input
                          type="number"
                          id="students"
                          name="students"
                          value={formData.students}
                          onChange={handleInputChange}
                          min="1"
                          max="100"
                          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Room field is relevant for classes, meetings and office hours */}
                  {['class', 'meeting', 'office-hours'].includes(formData.eventType || '') && (
                    <div>
                      <label htmlFor="room" className="block text-sm font-medium text-gray-700">
                        Room
                      </label>
                      <input
                        type="text"
                        id="room"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                        placeholder="e.g. Room 101"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <select
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className={`mt-2 p-2 rounded ${formData.color}`}>
                      Preview
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isRecurring"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
                        Recurring {getEventTypeName(formData.eventType || 'class')}
                      </label>
                    </div>
                    
                    {formData.isRecurring && (
                      <div className="mt-3 space-y-4">
                        <div>
                          <label htmlFor="recurrencePattern" className="block text-sm font-medium text-gray-700">
                            Repeat
                          </label>
                          <select
                            id="recurrencePattern"
                            name="recurrencePattern"
                            value={formData.recurrencePattern}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between">
                            <label htmlFor="recurrenceCount" className="block text-sm font-medium text-gray-700">
                              Number of occurrences
                            </label>
                            <span className="text-sm text-gray-500">
                              Until {format(addWeeks(formData.date || new Date(), formData.recurrenceCount || 0), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <input
                            type="number"
                            id="recurrenceCount"
                            name="recurrenceCount"
                            value={formData.recurrenceCount}
                            onChange={handleInputChange}
                            min="1"
                            max="52"
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowClassModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isEditMode 
                        ? `Update ${getEventTypeName(formData.eventType || 'class')}` 
                        : `Add ${getEventTypeName(formData.eventType || 'class')}`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Settings Modal */}
      {showScheduleSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">Schedule Settings</h3>
              <button 
                onClick={() => setShowScheduleSettings(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Working Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {allDaysOfWeek.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleWorkingDay(day)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          workingDays.includes(day)
                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                            : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-3">Working Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <select
                        value={workDayStart}
                        onChange={(e) => setWorkDayStart(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={`start-${i}`} value={i}>
                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <select
                        value={workDayEnd}
                        onChange={(e) => setWorkDayEnd(parseInt(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={`end-${i}`} value={i+1}>
                            {i+1 === 0 ? '12 AM' : i+1 < 12 ? `${i+1} AM` : i+1 === 12 ? '12 PM' : `${i+1-12} PM`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 