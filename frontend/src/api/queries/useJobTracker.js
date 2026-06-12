import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import api from '../../services/api';
import { toast } from 'sonner';

export const JOB_QUEUE_QUERY_KEY = ['processingQueue'];

// Helper for date parsing
const parseDateTime = (str) => {
  if (!str) return new Date();
  if (!str.includes("Z") && !str.includes("+")) {
    return new Date(str.replace(" ", "T") + "Z");
  }
  return new Date(str);
};

// Singleton socket connection to prevent StrictMode double-mounting disconnects
let globalSocket = null;

export const useJobTracker = () => {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  
  // Track listeners to avoid duplicate subscriptions
  const activeListenersRef = useRef(new Set());

  // Load active jobs from localStorage initially, useQuery to fetch their current states
  const { data: queue = [], isLoading } = useQuery({
    queryKey: JOB_QUEUE_QUERY_KEY,
    queryFn: async () => {
      const savedJobIds = JSON.parse(localStorage.getItem("activeJobIds") || "[]");
      if (savedJobIds.length === 0) return [];

      const token = localStorage.getItem("accessToken");
      if (!token) return [];

      const recoveredTasks = [];
      const updatedJobIds = [];

      for (const jobId of savedJobIds) {
        try {
          const res = await api.get(`/api/job/${jobId}`);
          const job = res.data;
          const createdTime = parseDateTime(job.created_at);
          const isStale = new Date() - createdTime > 60 * 60 * 1000; // 1 hour threshold

          if (!isStale && ["completed", "failed", "cancelled"].indexOf(job.status) === -1) {
            recoveredTasks.push({
              id: job.id,
              name: `Recovered Task (${job.id.substr(0, 4)})`,
              status: job.status,
              progress: job.progress,
              message: job.message || "Resuming tracking...",
            });
            updatedJobIds.push(job.id);
          }
        } catch (err) {
          console.error(`Failed to recover job ${jobId}`, err);
        }
      }
      
      localStorage.setItem("activeJobIds", JSON.stringify(updatedJobIds));
      return recoveredTasks;
    },
    staleTime: Infinity,
    gcTime: Infinity, // Formerly cacheTime in v5
  });

  useEffect(() => {
    if (!globalSocket) {
        globalSocket = io(import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");
    }
    socketRef.current = globalSocket;
  }, []); // Only initialize on mount, never disconnect to preserve singleton lifecycle

  // Re-attach socket listeners for any recovered or new jobs
  useEffect(() => {
    queue.forEach(job => {
       if (["completed", "failed", "cancelled"].indexOf(job.status) === -1) {
          attachSocketListener(job.id, job.name);
       }
    });
  }, [queue]); // Run safely when queue changes without dropping the socket

  const attachSocketListener = (jobId, fileName) => {
    if (!socketRef.current) return;
    if (activeListenersRef.current.has(jobId)) return;

    activeListenersRef.current.add(jobId);
    socketRef.current.on(`job:${jobId}`, (update) => {
      // Temporary diagnostic toast to prove reception
      toast.info(`WS EVENT RECEIVED for ${jobId.substring(0,4)}: ${JSON.stringify(update).substring(0, 50)}...`);
      
      // DEFENSIVE PARSING: Handle potential stringification or array wrapping from RedisManager
      let payload = update;
      if (typeof update === 'string') {
        try { payload = JSON.parse(update); } catch (e) { console.error('Parse error', e); }
      } else if (Array.isArray(update) && update.length > 0) {
        payload = update[0];
      }
      
      if (payload && typeof payload === 'object' && payload.data) {
        // Fallback for nested socket.io structures
        payload = payload.data.status ? payload.data : payload;
      }

      // Safeguard against null/undefined
      if (!payload || !payload.status) return;

      queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prevQueue = []) => {
        return prevQueue.map((t) => (t.id === jobId ? { ...t, ...payload } : t));
      });

      if (["completed", "failed", "cancelled"].includes(payload.status)) {
        if (payload.status === "completed") {
            toast.success(`Analysis complete for "${fileName}"!`);
        } else if (payload.status === "failed") {
            toast.error(`Analysis failed for "${fileName}".`);
        } else if (payload.status === "cancelled") {
            toast.info(`Terminated processing for "${fileName}".`);
        }
        removeJobFromPersistence(jobId);
        socketRef.current.off(`job:${jobId}`);
        activeListenersRef.current.delete(jobId);
      }
    });
  };

  const saveJobToPersistence = (jobId) => {
    const saved = JSON.parse(localStorage.getItem("activeJobIds") || "[]");
    if (!saved.includes(jobId)) {
      localStorage.setItem("activeJobIds", JSON.stringify([...saved, jobId]));
    }
  };

  const removeJobFromPersistence = (jobId) => {
    const saved = JSON.parse(localStorage.getItem("activeJobIds") || "[]");
    localStorage.setItem(
      "activeJobIds",
      JSON.stringify(saved.filter((id) => id !== jobId))
    );
  };

  const addJobToQueue = (jobId, fileName) => {
    saveJobToPersistence(jobId);
    
    const newTask = {
      id: jobId,
      name: fileName,
      status: "Upload",
      progress: 10,
      message: "Initializing...",
    };

    queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prev = []) => [...prev, newTask]);
    attachSocketListener(jobId, fileName);
  };

  const addOptimisticJob = (tempId, fileName) => {
    const newTask = {
      id: tempId,
      name: fileName,
      status: "uploading",
      progress: 5,
      message: "Uploading & Initializing...",
      isOptimistic: true
    };
    queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prev = []) => [...prev, newTask]);
  };

  const upgradeOptimisticJob = async (tempId, realJobId, fileName) => {
    // Replace temp job with real job ID
    queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prev = []) => {
      return prev.map(t => t.id === tempId ? { ...t, id: realJobId, isOptimistic: false, status: "Upload", progress: 10, message: "Initializing analysis..." } : t);
    });
    
    saveJobToPersistence(realJobId);
    attachSocketListener(realJobId, fileName);

    // FIX RACE CONDITION: Fetch the latest status from the server immediately 
    // in case the job processed so fast that we missed the WebSocket events!
    try {
        const res = await api.get(`/api/job/${realJobId}`);
        const job = res.data;
        queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prevQueue = []) => {
            return prevQueue.map((t) => {
                if (t.id === realJobId) {
                    // SAFEGUARD: Only apply the REST API snapshot if it's newer than our current state!
                    // This prevents a delayed HTTP response from reverting fast WebSocket updates.
                    const isNewerOrEqual = (job.progress || 0) >= (t.progress || 0) || ["completed", "failed", "cancelled"].includes(job.status);
                    if (isNewerOrEqual) {
                        return { ...t, ...job };
                    }
                }
                return t;
            });
        });

        // Re-check state after potential update
        const updatedQueue = queryClient.getQueryData(JOB_QUEUE_QUERY_KEY) || [];
        const currentJobState = updatedQueue.find(t => t.id === realJobId);

        if (currentJobState && ["completed", "failed", "cancelled"].includes(currentJobState.status)) {
            if (currentJobState.status === "completed") {
                toast.success(`Analysis complete for "${fileName}"!`);
            }
            removeJobFromPersistence(realJobId);
            if (socketRef.current) {
                socketRef.current.off(`job:${realJobId}`);
            }
            activeListenersRef.current.delete(realJobId);
        }
    } catch (err) {
        console.error("Failed to fetch initial job state to prevent race condition", err);
    }
  };

  const removeOptimisticJob = (tempId) => {
    queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prev = []) => prev.filter(t => t.id !== tempId));
  };

  return { queue, isLoading, addJobToQueue, addOptimisticJob, upgradeOptimisticJob, removeOptimisticJob, removeJobFromPersistence };
};
