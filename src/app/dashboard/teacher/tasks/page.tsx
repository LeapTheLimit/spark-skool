'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CalendarIcon,
  InformationCircleIcon,
  TrashIcon,
  ClipboardIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

<<<<<<< HEAD
// Make the types available for import in other files
export type TaskCategory = 'general' | 'grading' | 'call' | 'note';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  category: TaskCategory;
  createdAt: string;
}

=======
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
// Add Tooltip component
const Tooltip = ({ children, text }: { children: React.ReactNode, text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div className="absolute z-10 w-64 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2">
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 bottom-[-4px] left-1/2 -translate-x-1/2"></div>
        </div>
      )}
    </div>
  );
};

export default function TasksPage() {
  const { t } = useLanguage();
<<<<<<< HEAD
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [taskCategory, setTaskCategory] = useState<'grading' | 'call' | 'general'>('general');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
=======
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  const [taskCategory, setTaskCategory] = useState<'grading' | 'call' | 'general'>('general');
  const [taskPriority, setTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
  const [taskDeadline, setTaskDeadline] = useState<string>('');
  const [activeTaskFilter, setActiveTaskFilter] = useState('active');

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('teacherTasks');
    if (savedTasks) {
<<<<<<< HEAD
      // Filter out notes and ensure proper typing
      const parsedTasks = JSON.parse(savedTasks);
      const onlyTasks = parsedTasks
        .filter((task: Task) => task.category !== 'note')
        .map((task: any) => ({
          ...task,
          status: task.status as 'pending' | 'completed'
        })) as Task[];
=======
      // Filter out notes as they'll be on the notes page
      const parsedTasks = JSON.parse(savedTasks);
      const onlyTasks = parsedTasks.filter((task: any) => task.category !== 'note');
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
      setTasks(onlyTasks);
    }
  }, []);

  // Task functions
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
<<<<<<< HEAD
    const task: Task = {
      id: Date.now().toString(),
      title: newTask,
      status: 'pending',
      createdAt: new Date().toISOString(),
      category: taskCategory,
      priority: taskPriority,
      dueDate: taskDeadline || undefined
=======
    const task = {
      id: Date.now().toString(),
      content: newTask,
      completed: false,
      createdAt: new Date().toISOString(),
      category: taskCategory,
      priority: taskPriority,
      deadline: taskDeadline || undefined
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    };
    
    // Get all existing tasks and notes
    const savedTasks = localStorage.getItem('teacherTasks');
    const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
    
    // Add the new task
    const updatedAllTasks = [...allTasks, task];
    localStorage.setItem('teacherTasks', JSON.stringify(updatedAllTasks));
    
<<<<<<< HEAD
    // Update the current view
    setTasks([...tasks, task]);
    
    // Reset form
    setNewTask('');
    setTaskCategory('general');
    setTaskPriority('medium');
=======
    // Update the current view (only if it's not a note)
    if (task.category !== 'note') {
      setTasks([...tasks, task]);
    }
    
    setNewTask('');
    setTaskCategory('general');
    setTaskPriority('Medium');
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    setTaskDeadline('');
  };
  
  const toggleTaskComplete = (id: string) => {
<<<<<<< HEAD
    // Update UI with proper typing
    const updatedTasks = tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            status: task.status === 'completed' ? 'pending' : 'completed' 
          } as Task // Assert the type
        : task
    );
    setTasks(updatedTasks);
    
    // Update localStorage with proper typing
    const savedTasks = localStorage.getItem('teacherTasks');
    const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const updatedAllTasks = allTasks.map((task: Task) => 
      task.id === id 
        ? { 
            ...task, 
            status: task.status === 'completed' ? 'pending' : 'completed' 
          } as Task
        : task
=======
    // Update UI
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    // Update localStorage with all tasks
    const savedTasks = localStorage.getItem('teacherTasks');
    const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const updatedAllTasks = allTasks.map((task: any) => 
      task.id === id ? { ...task, completed: !task.completed } : task
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    );
    localStorage.setItem('teacherTasks', JSON.stringify(updatedAllTasks));
  };
  
  const deleteTask = (id: string) => {
    // Update UI
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    
    // Update localStorage with all tasks
    const savedTasks = localStorage.getItem('teacherTasks');
    const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
    const updatedAllTasks = allTasks.filter((task: any) => task.id !== id);
    localStorage.setItem('teacherTasks', JSON.stringify(updatedAllTasks));
  };

  // Improved filtering based on completion status and category
  const filteredTasks = useMemo(() => {
    // Start by separating completed and active tasks
<<<<<<< HEAD
    const activeTasks = tasks.filter(task => task.status === 'pending');
    const completedTasks = tasks.filter(task => task.status === 'completed');
=======
    const activeTasks = tasks.filter(task => !task.completed);
    const completedTasks = tasks.filter(task => task.completed);
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    
    // Then filter by category if needed
    if (activeTaskFilter === 'completed') {
      return completedTasks;
    } else if (activeTaskFilter === 'active') {
      return activeTasks;
    } else if (activeTaskFilter === 'all') {
      return tasks;
    } else {
      // Filter by specific category, respecting active state
      return activeTasks.filter(task => task.category === activeTaskFilter);
    }
  }, [tasks, activeTaskFilter]);

  // Get count of tasks by status for the filter badges
  const taskCounts = useMemo(() => {
    const counts = {
      all: tasks.length,
<<<<<<< HEAD
      active: tasks.filter(task => task.status === 'pending').length,
      completed: tasks.filter(task => task.status === 'completed').length,
      grading: tasks.filter(task => task.category === 'grading' && task.status === 'pending').length,
      call: tasks.filter(task => task.category === 'call' && task.status === 'pending').length,
      general: tasks.filter(task => task.category === 'general' && task.status === 'pending').length
=======
      active: tasks.filter(task => !task.completed).length,
      completed: tasks.filter(task => task.completed).length,
      grading: tasks.filter(task => task.category === 'grading' && !task.completed).length,
      call: tasks.filter(task => task.category === 'call' && !task.completed).length,
      general: tasks.filter(task => task.category === 'general' && !task.completed).length
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    };
    return counts;
  }, [tasks]);

  // Task category icon mapping
  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'grading':
        return <CheckCircleIcon className="w-5 h-5 text-red-600" />;
      case 'call':
        return <ClockIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckIcon className="w-5 h-5 text-green-600" />;
    }
  };

  // Priority icon mapping
<<<<<<< HEAD
  const getPriorityIcon = (priority: string | undefined) => {
    switch(priority) {
      case 'high':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-600" />;
      case 'medium':
=======
  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'High':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-600" />;
      case 'Medium':
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
        return <ExclamationCircleIcon className="w-4 h-4 text-yellow-600" />;
      default:
        return <ExclamationCircleIcon className="w-4 h-4 text-green-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/30 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Tasks</h1>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold text-[#3ab8fe]">
                Add New Task
              </h2>
              <Tooltip text="Create tasks to keep track of your work. Tasks can be categorized, prioritized, and given deadlines.">
                <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-[#3ab8fe] cursor-help" />
              </Tooltip>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4 bg-[#f8fafc] p-4 rounded-xl border border-gray-100">
              <div>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="What do you need to do?"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#3ab8fe] focus:border-transparent text-gray-800 font-medium placeholder-gray-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Category selector with tooltip */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <Tooltip text="General: Regular tasks. Grading: Tasks related to student assessments. Call: Meetings and appointments.">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-[#3ab8fe] cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setTaskCategory('general')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskCategory === 'general' 
                          ? 'bg-green-50 border-green-300 text-green-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CheckIcon className="w-4 h-4" />
                      Task
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTaskCategory('grading')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskCategory === 'grading' 
                          ? 'bg-red-50 border-red-300 text-red-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Grading
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTaskCategory('call')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskCategory === 'call' 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ClockIcon className="w-4 h-4" />
                      Call
                    </button>
                  </div>
                </div>
                
                {/* Priority selector with tooltip */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">Priority</label>
                    <Tooltip text="High: Urgent tasks that need immediate attention. Medium: Important but not urgent. Low: Tasks that can wait.">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-[#3ab8fe] cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
<<<<<<< HEAD
                      onClick={() => setTaskPriority('high')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'high' 
=======
                      onClick={() => setTaskPriority('High')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'High' 
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                          ? 'bg-red-50 border-red-300 text-red-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ExclamationCircleIcon className="w-4 h-4" />
                      High
                    </button>
                    <button 
                      type="button"
<<<<<<< HEAD
                      onClick={() => setTaskPriority('medium')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'medium' 
=======
                      onClick={() => setTaskPriority('Medium')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'Medium' 
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                          ? 'bg-yellow-50 border-yellow-300 text-yellow-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ExclamationCircleIcon className="w-4 h-4" />
                      Medium
                    </button>
                    <button 
                      type="button"
<<<<<<< HEAD
                      onClick={() => setTaskPriority('low')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'low' 
=======
                      onClick={() => setTaskPriority('Low')}
                      className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-1 text-sm ${
                        taskPriority === 'Low' 
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                          ? 'bg-green-50 border-green-300 text-green-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ExclamationCircleIcon className="w-4 h-4" />
                      Low
                    </button>
                  </div>
                </div>
                
                {/* Deadline selector with tooltip */}
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-sm font-medium text-gray-700">Deadline (Optional)</label>
                    <Tooltip text="Set a due date for your task. Tasks past their deadline will be highlighted.">
                      <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-[#3ab8fe] cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                    <div className="bg-gray-100 p-2 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <input
                      type="date"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                      className="w-full p-2 border-0 bg-white focus:outline-none focus:ring-0 text-gray-800"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3ab8fe] text-white rounded-lg hover:bg-[#0099e5] transition-colors flex items-center gap-2"
                  disabled={!newTask.trim()}
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Task
                </button>
              </div>
            </form>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                {activeTaskFilter === 'completed' ? (
                  <>
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    Completed Tasks
                  </>
                ) : activeTaskFilter === 'active' ? (
                  <>
                    <ClipboardIcon className="w-5 h-5 text-blue-500" />
                    Active Tasks
                  </>
                ) : activeTaskFilter === 'all' ? (
                  <>
                    <ClipboardDocumentIcon className="w-5 h-5 text-gray-500" />
                    All Tasks
                  </>
                ) : (
                  <>
                    {activeTaskFilter === 'grading' && <CheckCircleIcon className="w-5 h-5 text-red-500" />}
                    {activeTaskFilter === 'call' && <ClockIcon className="w-5 h-5 text-blue-500" />}
                    {activeTaskFilter === 'general' && <CheckIcon className="w-5 h-5 text-green-500" />}
                    {activeTaskFilter.charAt(0).toUpperCase() + activeTaskFilter.slice(1)} Tasks
                  </>
                )}
              </h3>
              
              <div className="ml-auto">
                {activeTaskFilter === 'completed' && taskCounts.completed > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all completed tasks?')) {
<<<<<<< HEAD
                        const updatedTasks = tasks.filter(task => task.status !== 'completed');
=======
                        const updatedTasks = tasks.filter(task => !task.completed);
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                        setTasks(updatedTasks);
                        
                        // Update localStorage
                        const savedTasks = localStorage.getItem('teacherTasks');
                        const allTasks = savedTasks ? JSON.parse(savedTasks) : [];
<<<<<<< HEAD
                        const updatedAllTasks = allTasks.filter((task: Task) => 
                          task.status !== 'completed' || task.category === 'note'
                        );
=======
                        const updatedAllTasks = allTasks.filter((task: any) => !task.completed || task.category === 'note');
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                        localStorage.setItem('teacherTasks', JSON.stringify(updatedAllTasks));
                      }
                    }}
                    className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear completed
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced filter/category tabs with count badges */}
            <div className="flex flex-wrap space-x-2 mb-6 overflow-x-auto pb-2 gap-y-2">
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'active' ? 'bg-[#3ab8fe] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTaskFilter('active')}
              >
                <CheckIcon className="w-4 h-4" />
                Active Tasks
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.active}
                </span>
              </button>
              
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'completed' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
                onClick={() => setActiveTaskFilter('completed')}
              >
                <CheckCircleIcon className="w-4 h-4" />
                Completed
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.completed}
                </span>
              </button>
              
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTaskFilter('all')}
              >
                All Tasks
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.all}
                </span>
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div> {/* Divider */}
              
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'grading' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                onClick={() => setActiveTaskFilter('grading')}
              >
                <CheckCircleIcon className="w-4 h-4" />
                Grading
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.grading}
                </span>
              </button>
              
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'call' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                onClick={() => setActiveTaskFilter('call')}
              >
                <ClockIcon className="w-4 h-4" />
                Calls & Meetings
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.call}
                </span>
              </button>
              
              <button 
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                  activeTaskFilter === 'general' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
                onClick={() => setActiveTaskFilter('general')}
              >
                <CheckIcon className="w-4 h-4" />
                General
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {taskCounts.general}
                </span>
              </button>
            </div>

            {/* Display tasks with improved styling for completed tasks */}
            <div className="grid grid-cols-1 gap-3">
              {filteredTasks.length > 0 ? (
                <>
                  {/* Tasks with improved animation and styling */}
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`relative ${
<<<<<<< HEAD
                        task.status === 'completed' 
=======
                        task.completed 
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                          ? 'bg-gray-50 border border-gray-200 animate-fadeIn' 
                          : (
                            task.category === 'grading'
                              ? 'bg-white border-l-4 border-red-500 shadow-sm hover:shadow' 
                              : task.category === 'call'
                                ? 'bg-white border-l-4 border-blue-500 shadow-sm hover:shadow'
                                : 'bg-white border-l-4 border-green-500 shadow-sm hover:shadow'
                          )
                      } p-4 rounded-lg transition-all duration-300`}
                    >
                      {/* Task content */}
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTaskComplete(task.id)}
                          className={`p-2 rounded-lg flex-shrink-0 transition-colors duration-300 ${
<<<<<<< HEAD
                            task.status === 'completed' 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          aria-label={task.status === 'completed' ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.status === 'completed' ? (
=======
                            task.completed 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.completed ? (
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-400 rounded-lg" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className={`font-medium text-lg transition-all duration-300 ${
<<<<<<< HEAD
                              task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {task.title}
                            </p>
                            <div className="flex gap-1">
                              {task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date() && (
=======
                              task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {task.content}
                            </p>
                            <div className="flex gap-1">
                              {!task.completed && task.deadline && new Date(task.deadline) < new Date() && (
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-medium flex items-center">
                                  <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                                  Overdue
                                </span>
                              )}
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Delete task"
                              >
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Rest of the task display with badges and dates */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                            {/* Better spaced badge layouts */}
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Category badge with clearer labels */}
                              <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                                task.category === 'grading' 
                                  ? 'bg-red-100 text-red-800' 
                                  : task.category === 'call' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {getCategoryIcon(task.category)}
                                <span className="font-medium">
                                  {task.category === 'grading' ? 'Grading' :
                                  task.category === 'call' ? 'Call/Meeting' :
                                  'Task'}
                                </span>
                              </span>
                              
                              {/* Priority badge with improved contrast */}
                              <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${
<<<<<<< HEAD
                                task.priority === 'high'
                                  ? 'bg-red-50 text-red-800 border border-red-200' 
                                  : task.priority === 'medium'
=======
                                task.priority === 'High'
                                  ? 'bg-red-50 text-red-800 border border-red-200' 
                                  : task.priority === 'Medium'
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                                    ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                                    : 'bg-green-50 text-green-800 border border-green-200'
                              }`}>
                                {getPriorityIcon(task.priority)}
<<<<<<< HEAD
                                <span className="font-medium">
                                  {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
                                </span>
=======
                                <span className="font-medium">{task.priority}</span>
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                              </span>
                            </div>
                            
                            {/* Create separate row for dates for better spacing */}
                            <div className="flex items-center gap-3 mt-1 w-full">
                              {/* Deadline with improved visibility */}
<<<<<<< HEAD
                              {task.dueDate && (
                                <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                                  new Date(task.dueDate) < new Date() 
=======
                              {task.deadline && (
                                <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${
                                  new Date(task.deadline) < new Date() 
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                                    ? 'bg-red-50 text-red-800 border border-red-200' 
                                    : 'bg-gray-50 text-gray-800 border border-gray-200'
                                }`}>
                                  <CalendarIcon className="w-4 h-4" />
<<<<<<< HEAD
                                  <span className="font-medium">Due: {format(new Date(task.dueDate), 'MMM d')}</span>
=======
                                  <span className="font-medium">Due: {format(new Date(task.deadline), 'MMM d')}</span>
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
                                </span>
                              )}
                              
                              {/* Created date in more subtle styling */}
                              <span className="text-gray-500 text-sm ml-auto">
                                Created: {format(new Date(task.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="bg-white shadow-sm w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    {activeTaskFilter === 'completed' ? (
                      <CheckCircleIcon className="w-8 h-8 text-green-300" />
                    ) : (
                      <CheckIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <h3 className="text-gray-700 font-medium">
                    {activeTaskFilter === 'completed' 
                      ? 'No completed tasks yet' 
                      : `No ${activeTaskFilter !== 'all' && activeTaskFilter !== 'active' ? activeTaskFilter : ''} tasks`}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                    {activeTaskFilter === 'completed' 
                      ? 'When you complete tasks, they will appear here'
                      : `Add your first ${activeTaskFilter !== 'all' && activeTaskFilter !== 'active' ? activeTaskFilter : ''} task to keep track of your to-dos`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 