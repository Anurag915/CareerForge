import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(localStorage.getItem('chat_active_sid') || null);
    const [messages, setMessages] = useState([]);
    const [loadingSessionId, setLoadingSessionId] = useState(null);
    const [fetchingHistory, setFetchingHistory] = useState(false);

    // 1. Load sidebar sessions list on initialization
    const fetchSessions = useCallback(async () => {
        try {
            const response = await api.get('/api/chat/sessions');
            const userSessions = response.data;
            setSessions(userSessions);
            
            // [SECURITY/STATE FIX]: Verify current session belongs to this list
            // Prevents legacy localStorage IDs from other users/older accounts polluting active state
            const isCurrentSessionValid = userSessions.some(s => s.id === activeSessionId);
            
            if (activeSessionId && !isCurrentSessionValid) {
                console.warn("Detected detached or stale Session ID. Purging automatically.");
                // Fallback to latest session available or fresh state
                if (userSessions.length > 0) {
                    switchSession(userSessions[0].id);
                } else {
                    switchSession(null);
                }
                return;
            }

            // If totally empty state and user has items, default select first one
            if (!activeSessionId && userSessions.length > 0) {
                switchSession(userSessions[0].id);
            }
        } catch (e) {
            console.error("Failed to fetch chat sessions", e);
        }
    }, [activeSessionId]);

    // 2. Load messages for a specific session
    const fetchHistory = async (sid) => {
        if (!sid) return;
        setFetchingHistory(true);
        try {
            const response = await api.get(`/api/chat/sessions/${sid}`);
            setMessages(response.data.messages || []);
        } catch (e) {
            console.error("Failed to load chat history", e);
            setMessages([]);
        } finally {
            setFetchingHistory(false);
        }
    };

    // 3. Change Active Session
    const switchSession = (sid) => {
        setActiveSessionId(sid);
        if (sid) {
            localStorage.setItem('chat_active_sid', sid);
            fetchHistory(sid);
        } else {
            localStorage.removeItem('chat_active_sid');
            setMessages([]);
        }
    };

    // 4. Create a Fresh Session
    const createNewSession = async (title = "New Conversation", skipHistoryFetch = false) => {
        try {
            const res = await api.post('/api/chat/sessions', { title });
            const newSid = res.data.id;
            
            // Prepend locally instantly
            setSessions(prev => [{ id: newSid, title, created_at: new Date() }, ...prev]);
            
            if (skipHistoryFetch) {
                // Only bind IDs, DO NOT trigger an async axios cycle that resets messages back to empty
                setActiveSessionId(newSid);
                localStorage.setItem('chat_active_sid', newSid);
            } else {
                switchSession(newSid);
            }
            return newSid;
        } catch (e) {
            console.error("Could not generate session", e);
            return null;
        }
    };

    // 5. Delete Session
    const deleteSession = async (sid) => {
        try {
            await api.delete(`/api/chat/sessions/${sid}`);
            setSessions(prev => prev.filter(s => s.id !== sid));
            if (activeSessionId === sid) {
                // Fallback to null or next available
                switchSession(null);
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    };

    // 6. Send Dispatcher
    const sendMessage = async (prompt, contextResumeId = null) => {
        // 1. ABSOLUTE FIRST STEP: Optimistic Render (Zero Lag, Instant UI feedback)
        const userMsg = { role: 'user', content: prompt, created_at: new Date() };
        setMessages(prev => [...prev, userMsg]);
        
        let currentSid = activeSessionId;
        
        // 2. Auto-create session if user typed into a null void
        if (!currentSid) {
            setLoadingSessionId("creating"); // Generic block during create
            // Pass true to explicitly inhibit the 'switchSession' fetch cycle that might overwrite our local state
            currentSid = await createNewSession("New Conversation", true);
            if (!currentSid) {
                setLoadingSessionId(null);
                return;
            }
        }
        
        setLoadingSessionId(currentSid);

        try {
            const response = await api.post(`/api/chat/sessions/${currentSid}/message`, {
                prompt,
                resume_id: contextResumeId
            });

            // Append final server-confirmed bot response
            setMessages(prev => [...prev, response.data]);
            
            // Refresh sidebar just in case the title got automatically renamed
            fetchSessions();
        } catch (e) {
            console.error("Chat transmission fail", e.response?.data || e.message);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `Connection interrupted. Please verify server connectivity and retry. (Details: ${e.response?.data?.error || 'Unexpected Network Fault'})` 
            }]);
        } finally {
            setLoadingSessionId(null);
        }
    };

    // Load initial context list on initial app mount once
    useEffect(() => {
        fetchSessions();
        if (activeSessionId) {
            fetchHistory(activeSessionId);
        }
    }, []); // Runs once per hard boot

    return (
        <ChatContext.Provider value={{
            sessions,
            activeSessionId,
            messages,
            loadingSessionId,
            fetchingHistory,
            switchSession,
            createNewSession,
            deleteSession,
            sendMessage,
            refreshSessions: fetchSessions
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be utilized inside an active ChatProvider wrapper.");
    }
    return context;
};
