import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = useCallback(() => {
        // Immediately clear local state for snappy UX
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeTab'); // Wipe view state
        setUser(null);
        delete api.defaults.headers.common['Authorization'];

        // Fire and forget server logout to invalidate session
        api.post('/logout').catch(() => {});
    }, []);

    const login = useCallback((accessToken, userData) => {
        localStorage.setItem('accessToken', accessToken);
        setUser(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }, []);

    // Standard Persistent & Silent Refresh Engine
    useEffect(() => {
        const initializeAuth = async () => {
            const currentToken = localStorage.getItem('accessToken');

            if (currentToken) {
                try {
                    const decoded = jwtDecode(currentToken);
                    // Pre-emptive expire check
                    if (decoded.exp * 1000 > Date.now()) {
                        setUser({
                            id: decoded.user_id,
                            name: decoded.name,
                            email: decoded.email,
                            role: decoded.role
                        });
                        api.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Malformed token state", e);
                }
            }

            // Fallback / Initial Mount: Ping Refresh for Silent Handshake
            try {
                const { data } = await api.post('/refresh');
                login(data.accessToken, data.user);
            } catch (err) {
                // No valid cookie found, session clean slate
                localStorage.removeItem('accessToken');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, [login]);

    // Subscribes to Global Hook Invalidation broadcasts
    useEffect(() => {
        const handleAuthExpired = () => {
            setUser(null);
            toast.error("Your session has expired. Please log in again.", { duration: 5000 });
        };
        window.addEventListener('auth:expired', handleAuthExpired);
        return () => window.removeEventListener('auth:expired', handleAuthExpired);
    }, []);

    return (
        <AuthContext.Provider value={{ 
            user, 
            token: localStorage.getItem('accessToken'), 
            login, 
            logout, 
            loading,
            isAuthenticated: !!user 
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
