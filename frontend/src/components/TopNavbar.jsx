import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Sun, Moon, Bell, Settings, CreditCard, LogOut, User, Shield 
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const parseDateTime = (str) => {
    if (!str) return new Date();
    if (!str.includes('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
};

const TopNavbar = ({ user, logout, theme, toggleTheme, onTabClick }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const menuRef = useRef(null);
    const notifRef = useRef(null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Handle Click Outside and Escape Key
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsUserMenuOpen(false);
                setNotifOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    // Intelligent Caching: Fetch unread counts with lazy revalidation
    const { data: unreadCountData } = useQuery({
        queryKey: ['unread-count', user?.user_id],
        queryFn: async () => {
            const res = await api.get('/api/notifications/unread-count');
            return res.data.count;
        },
        enabled: !!user,
        staleTime: 30000,
    });
    const unreadCount = unreadCountData ?? 0;

    // Dynamic Ingestion: Lazy-loading notifications ONLY when the user opens the dropdown tray
    const { data: notifications = [], refetch: fetchNotifications } = useQuery({
        queryKey: ['notifications', user?.user_id],
        queryFn: async () => {
            const res = await api.get('/api/notifications');
            return res.data;
        },
        enabled: !!user && notifOpen,
    });

    const markReadMutation = useMutation({
        mutationFn: async (id) => {
            await api.post(`/api/notifications/${id}/read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unread-count', user?.user_id] });
            queryClient.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
        }
    });

    const handleMarkAsRead = (id) => {
        markReadMutation.mutate(id);
    };

    useEffect(() => {
        if (!user) return;
        const socket = io(import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000');
        socket.emit('join', { user_id: user.user_id });

        socket.on('notification:new', () => {
            queryClient.invalidateQueries({ queryKey: ['unread-count', user?.user_id] });
            if (notifOpen) {
                queryClient.invalidateQueries({ queryKey: ['notifications', user?.user_id] });
            }
        });

        return () => socket.disconnect();
    }, [user, notifOpen, queryClient]);

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 shrink-0 z-40">
            {/* Left: Global Search Placeholder */}
            <div className="flex-1 flex items-center">
                <div className="relative w-full max-w-md hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search candidates, reports, or jobs..." 
                        className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-slate-400"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 md:gap-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => {
                            setNotifOpen(!notifOpen);
                            if (!notifOpen) fetchNotifications();
                        }}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
                        )}
                    </button>

                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-[350px] max-w-[calc(100vw-32px)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] overflow-hidden"
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
                                                            onClick={(e) => { e.stopPropagation(); onTabClick('history'); setNotifOpen(false); }}
                                                            className="text-[9px] font-black text-blue-500 hover:underline uppercase tracking-widest"
                                                        >
                                                            View
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

                {/* Profile */}
                {user ? (
                    <div className="relative pl-4 border-l border-slate-200 dark:border-slate-800" ref={menuRef}>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-2 p-1 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-slate-500" />
                                )}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:block truncate max-w-[100px]">
                                {user.name?.split(' ')[0] || 'Account'}
                            </span>
                        </motion.button>

                        <AnimatePresence>
                            {isUserMenuOpen && (
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
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center space-x-3">
                        <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-600 dark:text-slate-400">Sign In</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default TopNavbar;
