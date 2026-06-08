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
    if (!socketRef.current) {
        socketRef.current = io(import.meta.env.VITE_API_URL || "http://127.0.0.1:5000");
    }

    // Re-attach socket listeners for any recovered jobs
    queue.forEach(job => {
       if (["completed", "failed", "cancelled"].indexOf(job.status) === -1) {
          attachSocketListener(job.id, job.name);
       }
    });

    return () => {
      if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
      }
    };
  }, [queue.length]);

  const attachSocketListener = (jobId, fileName) => {
    if (!socketRef.current) return;
    if (activeListenersRef.current.has(jobId)) return;

    activeListenersRef.current.add(jobId);
    socketRef.current.on(`job:${jobId}`, (update) => {
      queryClient.setQueryData(JOB_QUEUE_QUERY_KEY, (prevQueue = []) => {
        return prevQueue.map((t) => (t.id === jobId ? { ...t, ...update } : t));
      });

      if (["completed", "failed", "cancelled"].includes(update.status)) {
        if (update.status === "completed") {
            toast.success(`Analysis complete for "${fileName}"!`);
        } else if (update.status === "failed") {
            toast.error(`Analysis failed for "${fileName}".`);
        } else if (update.status === "cancelled") {
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

  return { queue, isLoading, addJobToQueue, removeJobFromPersistence };
};
