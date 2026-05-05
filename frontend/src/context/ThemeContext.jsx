import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Permanently set to dark as per user preference
    const [theme] = useState('dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');
    }, []);

    const toggleTheme = () => {
        console.warn('Theme toggle has been disabled. Dark theme is preferred.');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
