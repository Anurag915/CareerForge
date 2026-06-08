import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

export const useUploadResumes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, jobDescription }) => {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('job_description', jobDescription);

      const response = await api.post('/analyze-advanced', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { data: response.data, file };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};
