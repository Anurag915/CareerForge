import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // Force inclusion of Http-Only Cookies cross-origin
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attaches token immediately before dispatch
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Secure Response Recovery Interceptor (401 Self-Healing Loop)
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Catch expired signatures, skipping recursive loop triggers on /login /refresh
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/login') && !originalRequest.url.includes('/refresh')) {
            
            if (isRefreshing) {
                // Queue subsequent parallel requests until first refresh finishes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Run background handshake - relies entirely on secure cookie
                const { data } = await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true });
                const { accessToken } = data;

                localStorage.setItem('accessToken', accessToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                processQueue(null, accessToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Session truly dead. Clear user state!
                localStorage.removeItem('accessToken');
                // Dispatch global event so AuthContext can log out UI
                window.dispatchEvent(new Event('auth:expired'));
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
