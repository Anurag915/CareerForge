import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, MessageSquare, Database } from 'lucide-react';

const ChatUI = () => {
    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('global');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your CareerForge AI. Ask me anything about your uploaded documents or your career strategy." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
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
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error processing your request." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 h-[700px]">
            {/* Sidebar: Resume Selector */}
            <div className="bg-white border border-brand-100 rounded-2xl p-4 flex flex-col shadow-subtle overflow-hidden">
                <div className="flex items-center space-x-2 px-2 mb-4">
                    <Database className="w-4 h-4 text-brand-900" />
                    <span className="text-sm font-bold text-brand-900 uppercase tracking-wider">Context Source</span>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto pr-1">
                    <button
                        onClick={() => setSelectedResumeId('global')}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center space-x-2 ${
                            selectedResumeId === 'global' 
                            ? 'bg-brand-900 text-white shadow-md' 
                            : 'text-brand-500 hover:bg-brand-50'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="font-semibold">Global Knowledge</span>
                    </button>
                    
                    <div className="h-px bg-brand-50 my-2 mx-2"></div>
                    
                    {resumes.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedResumeId(r.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex flex-col ${
                                selectedResumeId === r.id 
                                ? 'bg-brand-50 border border-brand-200 text-brand-900' 
                                : 'text-brand-500 hover:bg-brand-50 border border-transparent'
                            }`}
                        >
                            <span className="font-semibold truncate w-full">{r.filename}</span>
                            <span className="text-[10px] opacity-60 font-mono mt-0.5">ID: {r.id}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="md:col-span-3 bg-white border border-brand-100 rounded-2xl shadow-subtle flex flex-col overflow-hidden relative">
                {/* Chat Header */}
                <div className="p-4 border-b border-brand-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="bg-brand-50 p-2 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-brand-900" />
                        </div>
                        <div>
                            <h3 className="font-bold text-brand-900 leading-none">Career Assistant</h3>
                            <p className="text-[10px] text-brand-400 font-bold uppercase tracking-wider mt-1.5">
                                Mode: {selectedResumeId === 'global' ? 'Multi-Doc RAG' : 'Specific Resume Chat'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-6 scroll-smooth">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] flex space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-subtle ${
                                        msg.role === 'user' ? 'bg-white border-brand-100' : 'bg-brand-900 border-brand-900'
                                    }`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4 text-brand-500" /> : <Bot className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className={`space-y-2`}>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                            ? 'bg-brand-50 text-brand-900 rounded-tr-none border border-brand-100' 
                                            : 'bg-white text-brand-700 rounded-tl-none border border-brand-100 shadow-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        {msg.context && (
                                            <div className="text-[10px] text-brand-400 font-mono italic px-2">
                                                Source: {msg.context}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-brand-50 px-4 py-3 rounded-2xl rounded-tl-none border border-brand-100 flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-brand-50/50 border-t border-brand-100">
                    <form onSubmit={handleSend} className="relative group">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={selectedResumeId === 'global' ? "Ask about any candidate..." : "Ask about this resume..."}
                            className="w-full bg-white border border-brand-200 rounded-xl px-5 py-3.5 pr-12 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-900/10 focus:border-brand-900 transition-all shadow-subtle group-focus-within:shadow-md"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-900 text-white rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-black transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-brand-300 font-medium mt-3">
                        CareerForge AI may hallucinate. Verify critical information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ChatUI;
