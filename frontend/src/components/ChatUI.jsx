import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, MessageSquare, Database, ChevronLeft, ChevronRight, PlusCircle, Trash2, Box } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChatUI = () => {
    const { user } = useAuth();
    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('global');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your CareerForge AI assistant. I've analyzed your document vault and I'm ready to help you with your career strategy. What would you like to discuss today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await axios.get('http://localhost:5000/resumes');
                setResumes(res.data);
            } catch (err) {
                console.error("Failed to fetch resumes:", err);
            }
        };
        fetchResumes();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const endpoint = selectedResumeId === 'global' ? '/global-chat' : `/chat/${selectedResumeId}`;
            const payload = { question: input };
            if (selectedResumeId === 'global') payload.resume_id = null;

            const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: res.data.answer,
                context: res.data.context_used
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I apologize, but I encountered an error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] w-full">
            <div className="flex flex-grow bg-white rounded-2xl border border-subtle shadow-premium overflow-hidden">
                {/* Sidebar: Document Context */}
                <motion.aside 
                    initial={false}
                    animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
                    className="bg-brand-50/30 border-r border-brand-100 flex flex-col relative"
                >
                    <div className="p-4 flex flex-col h-full min-w-[260px]">
                        <div className="flex items-center space-x-2 mb-6 px-1">
                            <Box className="w-4 h-4 text-brand-900" />
                            <span className="text-[11px] font-bold text-brand-900 uppercase tracking-widest">Context Vault</span>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                            <button
                                onClick={() => setSelectedResumeId('global')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex items-center space-x-3 ${
                                    selectedResumeId === 'global' 
                                    ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/20' 
                                    : 'text-brand-500 hover:bg-brand-100/50'
                                }`}
                            >
                                <Sparkles className="w-4 h-4" />
                                <span className="font-bold">Global Intelligence</span>
                            </button>
                            
                            <div className="py-2">
                                <div className="h-px bg-brand-100 mx-2"></div>
                            </div>

                            {resumes.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedResumeId(r.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex flex-col space-y-1 group ${
                                        selectedResumeId === r.id 
                                        ? 'bg-white border border-brand-200 text-brand-900 shadow-sm' 
                                        : 'text-brand-500 hover:bg-brand-100/50'
                                    }`}
                                >
                                    <span className="font-bold truncate w-full">{r.filename}</span>
                                    <span className="text-[10px] opacity-40 font-mono">ID: {r.id}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-brand-100">
                            <button 
                                onClick={() => setMessages([{ role: 'assistant', content: "Conversation reset. How can I assist you today?" }])}
                                className="flex items-center space-x-2 text-brand-400 hover:text-brand-900 transition-colors text-[11px] font-bold uppercase tracking-widest px-1"
                            >
                                <PlusCircle className="w-4 h-4" />
                                <span>New Chat</span>
                            </button>
                        </div>
                    </div>
                </motion.aside>

                {/* Sidebar Toggle Button */}
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-brand-100 p-1 rounded-r-lg shadow-subtle hover:bg-brand-50 transition-colors"
                    style={{ marginLeft: sidebarOpen ? 260 : 0 }}
                >
                    {sidebarOpen ? <ChevronLeft className="w-4 h-4 text-brand-400" /> : <ChevronRight className="w-4 h-4 text-brand-400" />}
                </button>

                {/* Main Chat Area */}
                <div className="flex-grow flex flex-col bg-white relative">
                    {/* Messages Container */}
                    <div 
                        ref={scrollRef} 
                        className="flex-grow overflow-y-auto px-6 py-8 space-y-8 scroll-smooth scrollbar-hide"
                    >
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex space-x-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-subtle border ${
                                            msg.role === 'user' ? 'bg-white border-brand-100' : 'bg-brand-900 border-brand-900'
                                        }`}>
                                            {msg.role === 'user' ? <User className="w-5 h-5 text-brand-400" /> : <Bot className="w-5 h-5 text-white" />}
                                        </div>
                                        <div className="space-y-2">
                                            <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                                                msg.role === 'user' 
                                                ? 'bg-brand-50 text-brand-900 border-brand-100 rounded-tr-none' 
                                                : 'bg-slate-50/50 text-brand-700 border-brand-100/50 rounded-tl-none'
                                            }`}>
                                                {msg.role === 'assistant' ? (
                                                    <div className="space-y-4">
                                                        {msg.content.split('\n').map((line, lidx) => {
                                                            const trimmed = line.trim();
                                                            if (!trimmed) return <div key={lidx} className="h-1" />;
                                                            const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed);
                                                            return (
                                                                <div key={lidx} className={`${isBullet ? 'flex items-start space-x-2 pl-1' : ''}`}>
                                                                    {isBullet && <span className="text-brand-900 font-black mt-1.5 shrink-0 scale-125">·</span>}
                                                                    <span>{isBullet ? trimmed.replace(/^[•\-\d+\.]\s*/, '') : trimmed}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : msg.content}
                                            </div>
                                            {msg.context && (
                                                <div className="flex items-center space-x-2 px-3">
                                                    <Database className="w-3 h-3 text-brand-300" />
                                                    <p className="text-[10px] text-brand-400 font-mono italic truncate max-w-sm">
                                                        Reference: {msg.context}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-brand-50 px-5 py-3 rounded-2xl rounded-tl-none border border-brand-100 flex items-center space-x-2">
                                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Bottom Input Area */}
                    <div className="p-6 bg-white border-t border-brand-50 shrink-0">
                        <form onSubmit={handleSend} className="relative group w-full">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedResumeId === 'global' ? "Ask CareerForge anything..." : `Ask about ${resumes.find(r => r.id === selectedResumeId)?.filename || 'this resume'}...`}
                                className="w-full bg-brand-50/50 border border-brand-100 rounded-xl px-5 py-3 pr-14 text-xs text-brand-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-brand-900/5 focus:border-brand-900/20 transition-all shadow-subtle group-hover:bg-white"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-900 text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-brand-300 font-bold uppercase tracking-tight mt-4">
                            AI-Powered Career Intelligence • Powered by Llama 3
                        </p>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ChatUI;
