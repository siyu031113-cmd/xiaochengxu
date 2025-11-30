
import React from 'react';
import { Home, Briefcase, User, LayoutGrid, PlusCircle, ClipboardList, BookOpen, Users } from 'lucide-react';
import { Role } from '../types';

interface TabBarProps {
  role: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ role, activeTab, onTabChange }) => {
  const isActive = (tab: string) => activeTab === tab;
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-400 hover:text-gray-500";

  if (role === 'admin') {
    return (
      <div className="h-[84px] bg-white border-t border-gray-100 flex items-start pt-4 justify-around px-2 pb-6 shrink-0 z-10">
        <button onClick={() => onTabChange('admin-home')} className={`flex flex-col items-center space-y-1 w-14 transition-colors ${isActive('admin-home') ? activeClass : inactiveClass}`}>
          <LayoutGrid size={24} strokeWidth={isActive('admin-home') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">Jobs</span>
        </button>
        
        <button onClick={() => onTabChange('admin-students')} className={`flex flex-col items-center space-y-1 w-14 transition-colors ${isActive('admin-students') ? activeClass : inactiveClass}`}>
          <Users size={24} strokeWidth={isActive('admin-students') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">Students</span>
        </button>

        <button onClick={() => onTabChange('post-job')} className="flex flex-col items-center justify-center -mt-8 group w-14">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-300 text-white group-active:scale-95 transition-transform">
            <PlusCircle size={24} />
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-2">Post</span>
        </button>

        <button onClick={() => onTabChange('admin-review')} className={`flex flex-col items-center space-y-1 w-14 transition-colors ${isActive('admin-review') ? activeClass : inactiveClass}`}>
          <ClipboardList size={24} strokeWidth={isActive('admin-review') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">Review</span>
        </button>
        
         <button onClick={() => onTabChange('profile')} className={`flex flex-col items-center space-y-1 w-14 transition-colors ${isActive('profile') ? activeClass : inactiveClass}`}>
          <User size={24} strokeWidth={isActive('profile') ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-wide">Admin</span>
        </button>
      </div>
    );
  }

  // Student Tab Bar
  return (
    <div className="h-[84px] bg-white border-t border-gray-100 flex items-start pt-4 justify-around px-2 pb-6 shrink-0 z-10">
      <button onClick={() => onTabChange('jobs')} className={`flex flex-col items-center space-y-1 w-16 transition-colors ${isActive('jobs') ? activeClass : inactiveClass}`}>
        <Home size={26} strokeWidth={isActive('jobs') ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide">Jobs</span>
      </button>
      <button onClick={() => onTabChange('applications')} className={`flex flex-col items-center space-y-1 w-16 transition-colors ${isActive('applications') ? activeClass : inactiveClass}`}>
        <Briefcase size={26} strokeWidth={isActive('applications') ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide">Internship</span>
      </button>
      <button onClick={() => onTabChange('services')} className={`flex flex-col items-center space-y-1 w-16 transition-colors ${isActive('services') ? activeClass : inactiveClass}`}>
        <BookOpen size={26} strokeWidth={isActive('services') ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide">Services</span>
      </button>
      <button onClick={() => onTabChange('profile')} className={`flex flex-col items-center space-y-1 w-16 transition-colors ${isActive('profile') ? activeClass : inactiveClass}`}>
        <User size={26} strokeWidth={isActive('profile') ? 2.5 : 2} />
        <span className="text-[10px] font-bold tracking-wide">Me</span>
      </button>
    </div>
  );
};

export default TabBar;
