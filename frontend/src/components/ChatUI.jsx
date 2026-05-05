import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Bot,
  Sparkles,
  MessageSquare,
  Database,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  Box,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ChatUI = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("global");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await axios.get("http://localhost:5000/resumes");
        setResumes(res.data);
      } catch (err) {
        console.error("Failed to fetch resumes:", err);
      }
    };

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await axios.get(
          `http://localhost:5000/chat/history?resume_id=${selectedResumeId}`,
        );
        if (res.data.length > 0) {
          setMessages(
            res.data.map((msg) => ({
              role: msg.role,
              content: msg.content,
              created_at: msg.created_at,
            })),
          );
        } else {
          setMessages([
            {
              role: "assistant",
              content:
                selectedResumeId === "global"
                  ? "Hello! I'm your CareerForge AI assistant. I've analyzed your document vault and I'm ready to help you with your career strategy. What would you like to discuss today?"
                  : `Hello! I'm ready to help you analyze this specific resume (${resumes.find((r) => r.id === selectedResumeId)?.filename || "loading..."}). What would you like to know?`,
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your CareerForge AI assistant. How can I help you today?",
          },
        ]);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchResumes();
    fetchHistory();
  }, [selectedResumeId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, historyLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const endpoint =
        selectedResumeId === "global"
          ? "/global-chat"
          : `/chat/${selectedResumeId}`;
      const payload = { question: input };
      if (selectedResumeId === "global") payload.resume_id = null;

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          context: res.data.context_used,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full theme-transition">
      <div className="flex flex-grow bg-white dark:bg-slate-900 overflow-hidden relative">
        {/* Sidebar: Document Context */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 260 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          className="bg-slate-50/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-800 flex flex-col relative"
        >
          <div className="p-4 flex flex-col h-full min-w-[260px]">
            <div className="flex items-center space-x-2 mb-6 px-1">
              <Box className="w-4 h-4 text-slate-900 dark:text-slate-100" />
              <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                Context Vault
              </span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
              <button
                onClick={() => setSelectedResumeId("global")}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex items-center space-x-3 ${
                  selectedResumeId === "global"
                    ? "bg-slate-900 dark:bg-accent-600 text-white shadow-lg shadow-slate-900/20 dark:shadow-accent-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-bold">Global Intelligence</span>
              </button>

              <div className="py-2">
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2"></div>
              </div>

              {resumes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs transition-all flex flex-col space-y-1 group ${
                    selectedResumeId === r.id
                      ? "bg-slate-100 dark:bg-slate-800 border border-slate-900/10 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="font-bold truncate w-full">
                    {r.filename}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">
                    ID: {r.id}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() =>
                  setMessages([
                    {
                      role: "assistant",
                      content:
                        "Conversation reset. How can I assist you today?",
                    },
                  ])
                }
                className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-[11px] font-bold uppercase tracking-widest px-1"
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-r-lg shadow-subtle hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          style={{ marginLeft: sidebarOpen ? 260 : 0 }}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          )}
        </button>

        {/* Main Chat Area */}
        <div className="flex-grow flex flex-col bg-white dark:bg-slate-900 relative">
          {/* Chat Header */}
          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  AI Career Intelligence
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    Session Active
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50">
                Powered by Llama 3
              </span>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={scrollRef}
            className="flex-grow overflow-y-auto px-8 py-10 space-y-10 scroll-smooth custom-scrollbar bg-slate-50/20 dark:bg-slate-950/20"
          >
            <AnimatePresence initial={false}>
              {historyLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full space-y-4"
                >
                  <div className="w-8 h-8 border-2 border-slate-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                    Restoring Context...
                  </p>
                </motion.div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex space-x-5 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
                          msg.role === "user"
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                            : "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-500 text-white shadow-blue-500/10"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-5 h-5" />
                        ) : (
                          <Bot className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div
                          className={`p-5 rounded-[24px] text-[13px] leading-relaxed shadow-sm border theme-transition ${
                            msg.role === "user"
                              ? "bg-slate-200/40 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-tr-none"
                              : "bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 border-slate-200/60 dark:border-slate-800/60 rounded-tl-none backdrop-blur-sm"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="space-y-4">
                              {msg.content.split("\n").map((line, lidx) => {
                                const trimmed = line.trim();
                                if (!trimmed)
                                  return <div key={lidx} className="h-1" />;
                                const isBullet =
                                  trimmed.startsWith("•") ||
                                  trimmed.startsWith("-") ||
                                  /^\d+\./.test(trimmed);
                                return (
                                  <div
                                    key={lidx}
                                    className={`${isBullet ? "flex items-start space-x-3 pl-1" : ""}`}
                                  >
                                    {isBullet && (
                                      <span className="text-blue-500 dark:text-blue-400 font-black mt-1.5 shrink-0 scale-125">
                                        ·
                                      </span>
                                    )}
                                    <span className="font-medium">
                                      {isBullet
                                        ? trimmed.replace(/^[•\-\d+\.]\s*/, "")
                                        : trimmed}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="font-medium">{msg.content}</span>
                          )}
                        </div>
                        {msg.context && (
                          <div className="flex items-center space-x-2 px-4 animate-in fade-in slide-in-from-left-2 duration-700">
                            <Database className="w-3 h-3 text-blue-500" />
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter truncate max-w-sm">
                              Context Source: {msg.context}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {loading && (
              <div className="flex justify-start pl-15 animate-pulse">
                <div className="bg-slate-100/50 dark:bg-slate-800/50 px-6 py-4 rounded-3xl rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 flex items-center space-x-2 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Bottom Input Area */}
          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={handleSend}
              className="relative group max-w-4xl mx-auto w-full"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  selectedResumeId === "global"
                    ? "Ask CareerForge intelligence anything..."
                    : `Query context from ${resumes.find((r) => r.id === selectedResumeId)?.filename || "this profile"}...`
                }
                className="w-full bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-[20px] px-6 py-4 pr-16 text-[13px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all shadow-inner group-hover:bg-white dark:group-hover:bg-slate-800/50 font-medium"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-[16px] flex items-center justify-center transition-all shadow-xl active:scale-95
                                    ${
                                      loading || !input.trim()
                                        ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                                        : "bg-slate-900 dark:bg-blue-600 text-white hover:bg-black dark:hover:bg-blue-500 shadow-blue-500/20"
                                    }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-4 opacity-50">
              <span className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                AI Intelligence Cluster
              </p>
              <span className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default ChatUI;
