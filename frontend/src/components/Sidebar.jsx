import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, FolderOpen, History, Columns, MessageSquare, 
    User, ChevronLeft, ChevronRight, Layers, LogOut, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, onTabClick, user, collapsed, onToggle }) => {
    const navigate = useNavigate();

    const mainNav = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'library', label: 'Resume Library', icon: FolderOpen },
        { id: 'history', label: 'Analysis History', icon: History },
        { id: 'compare', label: 'Compare Resumes', icon: Columns },
        { id: 'copilot', label: 'Resume Copilot', icon: MessageSquare },
    ];

    const bottomNav = [
        { id: 'profile', label: 'Profile', icon: User, placeholder: true },
    ];

    const NavItem = ({ item }) => {
        const isActive = activeTab === item.id;
        return (
            <button
                onClick={() => !item.placeholder && onTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }
                    ${item.placeholder ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={collapsed ? item.label : ''}
            >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                
                <AnimatePresence>
                    {!collapsed && (
                        <motion.span 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-sm font-semibold truncate whitespace-nowrap"
                        >
                            {item.label}
                        </motion.span>
                    )}
                </AnimatePresence>

                {isActive && collapsed && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-200 rounded-l-full" />
                )}
            </button>
        );
    };

    return (
        <motion.aside
            animate={{ width: collapsed ? 80 : 260 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-screen bg-white dark:bg-[#0f1117] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 relative z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none"
        >
            {/* Header Area with Logo and Toggle */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-900 shrink-0">
                {/* Logo - Hidden when collapsed */}
                <div 
                    onClick={() => { navigate('/'); onTabClick('dashboard'); }}
                    className={`items-center gap-3 cursor-pointer group overflow-hidden ${collapsed ? 'hidden' : 'flex'}`}
                >
                    <motion.img 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        src="/logo.svg" 
                        alt="CareerForge Icon" 
                        className="h-12 w-12 object-contain group-hover:scale-105 transition-transform dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" 
                    />
                    <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-[1.1rem] font-extrabold tracking-tight truncate whitespace-nowrap font-outfit"
                    >
                        <span className="text-slate-900 dark:text-white">Career</span><span className="text-blue-500 dark:text-blue-400">Forge</span>
                    </motion.span>
                </div>

                {/* Toggle Button */}
                <button 
                    onClick={onToggle}
                    className={`transition-all flex items-center justify-center ${collapsed ? 'mx-auto hover:scale-105 active:scale-95' : 'p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl'}`}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {collapsed ? <img src="/logo.svg" alt="CareerForge" className="w-12 h-12 object-contain dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] dark:brightness-125" /> : <PanelLeftClose className="w-5 h-5" />}
                </button>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 flex flex-col">
                <div className="space-y-1">
                    {!collapsed && <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0">Menu</p>}
                    {mainNav.map(item => <NavItem key={item.id} item={item} />)}
                </div>

                <div className="mt-auto space-y-0.5 pt-3 border-t border-slate-100 dark:border-slate-900">
                    {!collapsed && <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0">System</p>}
                    {bottomNav.map(item => <NavItem key={item.id} item={item} />)}
                </div>
            </div>
            
        </motion.aside>
    );
};

export default Sidebar;
