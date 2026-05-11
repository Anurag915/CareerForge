import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Layers, Search, MessageSquare, TrendingUp, Columns, FolderOpen, 
    History, Sun, Moon, Bell, Command, ChevronDown, Settings, 
    CreditCard, LogOut, User, Menu, X, Shield, Loader2, Activity 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

import { useTheme } from '../context/ThemeContext';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const Navbar = ({ activeTab, onTabClick, user, logout, processingQueue = [] }) => {
    const activeTasks = processingQueue.filter(t => t.status !== 'completed' && t.status !== 'failed');
    const hasActiveTasks = activeTasks.length > 0;
    const { theme, toggleTheme } = useTheme();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Phase 8: Notifications Logic
    useEffect(() => {
        if (!user) return;

        const fetchInitialData = async () => {
            try {
                const countRes = await axios.get('http://127.0.0.1:5000/api/notifications/unread-count', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setUnreadCount(countRes.data.count);
            } catch (err) { console.error("Notif error", err); }
        };

        fetchInitialData();
    }, [user]);

    // Handle Socket notifications
    useEffect(() => {
        if (!user) return;
        const socket = io('http://127.0.0.1:5000');
        
        socket.emit('join', { user_id: user.user_id });

        socket.on('notification:new', (data) => {
            setUnreadCount(prev => prev + 1);
            if (notifOpen) fetchNotifications();
        });

        return () => socket.disconnect();
    }, [user, notifOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:5000/api/notifications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNotifications(res.data);
        } catch (err) { console.error("Fetch notifs error", err); }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await axios.post(`http://127.0.0.1:5000/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        } catch (err) { console.error("Mark read error", err); }
    };

    // Scroll detection for shadow and glass effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = React.useMemo(() => [
        { id: 'analyze', label: 'Dashboard', icon: Search },
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        ...(user?.role === 'candidate' ? [{ id: 'abtest', label: 'Optimization', icon: TrendingUp }] : []),
        ...(user?.role === 'hiring_manager' ? [{ id: 'compare', label: 'Comparison', icon: Columns }] : []),
        { id: 'resumes', label: 'Library', icon: FolderOpen },
        { id: 'history', label: 'History', icon: History },
        { id: 'jobs', label: 'Queue', icon: Activity },
    ], [user?.role]);

    const NavItem = ({ item, isMobile = false }) => {
        const isActive = activeTab === item.id;
        return (
            <button
                onClick={() => {
                    onTabClick(item.id);
                    if (isMobile) setIsMobileMenuOpen(false);
                }}
                className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 group
                    ${isActive 
                        ? 'text-blue-700 dark:text-blue-400 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                    ${isMobile ? 'w-full justify-start py-4 text-base' : ''}
                `}
            >
                {/* Sliding Background Active Pill */}
                {!isMobile && isActive && (
                    <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'opacity-70'}`} />
                <span className="relative z-10">{item.label}</span>

                {/* Subtle Hover Glow for inactive only */}
                {!isMobile && !isActive && (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50 opacity-0 group-hover:opacity-100 rounded-xl -z-10 transition-opacity duration-200" />
                )}
            </button>
        );
    };

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 h-16 flex items-center
            ${isScrolled 
                ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm' 
                : 'bg-transparent'
            }
        `}>
            <div className="max-w-[1800px] mx-auto px-6 lg:px-12 w-full flex justify-between items-center">
                
                {/* Left: Logo - Fixed click behavior */}
                <div className="flex items-center space-x-12">
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            navigate('/');
                            onTabClick('analyze');
                        }}
                        className="flex items-center space-x-2.5 cursor-pointer group"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 bg-slate-900 dark:bg-accent-600 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative bg-slate-900 dark:bg-accent-600 p-2 rounded-xl shadow-lg">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">CareerForge</span>
                    </motion.div>

                    {/* Center: Desktop Nav Links */}
                    {user && (
                        <div className="hidden lg:flex items-center space-x-2">
                            {navLinks.map(link => (
                                <NavItem key={link.id} item={link} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Actions & User Menu */}
                <div className="flex items-center space-x-4">
                    
                    {/* Desktop Extras */}
                    <div className="hidden md:flex items-center space-x-4 mr-4 border-r border-slate-200 dark:border-slate-800 pr-4">
                        <div className="flex items-center space-x-2 md:space-x-4">


                            <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative">
                                <button 
                                    onClick={() => {
                                        setNotifOpen(!notifOpen);
                                        if (!notifOpen) fetchNotifications();
                                    }}
                                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors relative"
                                >
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[7px] font-black text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Notification Dropdown [PHASE 8] */}
                                <AnimatePresence>
                                    {notifOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-3 w-[calc(100vw-32px)] sm:w-[350px] max-w-[350px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Notifications</h3>
                                                <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                                    {unreadCount} New
                                                </span>
                                            </div>
                                            <div className="max-h-[250px] overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                                        <p className="text-xs text-slate-500 font-medium">Your inbox is clear</p>
                                                    </div>
                                                ) : (
                                                    notifications.slice(0, 5).map(n => (
                                                        <div 
                                                            key={n.id} 
                                                            className={`p-4 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${!n.is_read ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                                                            onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                                                        >
                                                            {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full" />}
                                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed pr-6 break-words">
                                                                {n.message}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                                    {parseDateTime(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {n.job_id && (
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); onTabClick('jobs'); setNotifOpen(false); }}
                                                                        className="text-[9px] font-black text-blue-500 hover:underline uppercase tracking-widest"
                                                                    >
                                                                        View Job
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {!user ? (
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                            >
                                Sign In
                            </button>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="px-6 py-2.5 text-sm font-bold bg-slate-900 dark:bg-accent-600 text-white rounded-xl shadow-lg hover:shadow-accent-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center space-x-2 p-0.5 pr-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:block truncate max-w-[100px]">
                                    {user.name?.split(' ')[0] || 'Account'}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </motion.button>

                            {/* User Dropdown */}
                            <AnimatePresence>
                                {isUserMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-slate-100 dark:border-slate-900">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-accent-600 flex items-center justify-center text-white font-bold">
                                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                            {user.name || 'Anonymous User'}
                                                        </p>
                                                        {/* Fixed Email Display */}
                                                        {user.email ? (
                                                            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                                                        ) : (
                                                            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mt-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-2">
                                                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all">
                                                    <Settings className="w-4 h-4" />
                                                    <span>Profile Settings</span>
                                                </button>
                                                {user.role === 'hiring_manager' && (
                                                    <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all">
                                                        <Shield className="w-4 h-4" />
                                                        <span>Admin Dashboard</span>
                                                    </button>
                                                )}
                                                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white transition-all">
                                                    <CreditCard className="w-4 h-4" />
                                                    <span>Billing & Plans</span>
                                                </button>
                                            </div>

                                            <div className="p-2 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/30">
                                                <button 
                                                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                                                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Mobile Menu Trigger */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Slide-in Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-[320px] bg-white dark:bg-slate-950 z-[120] shadow-2xl p-8 flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-12">
                                <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-slate-100">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
                                    <X className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {navLinks.map(link => (
                                    <NavItem key={link.id} item={link} isMobile />
                                ))}
                            </div>

                            <div className="mt-auto space-y-4 pt-8 border-t border-slate-100 dark:border-slate-900">

                                {!user && (
                                    <button 
                                        onClick={() => { navigate('/signup'); setIsMobileMenuOpen(false); }}
                                        className="w-full py-4 bg-slate-900 dark:bg-accent-600 text-white rounded-2xl font-bold shadow-lg"
                                    >
                                        Get Started
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
