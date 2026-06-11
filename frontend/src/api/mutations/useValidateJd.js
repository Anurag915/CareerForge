import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

export const useValidateJd = () => {
  return useMutation({
    mutationFn: async (jobDescription) => {
      const response = await api.post('/validate-jd', { job_description: jobDescription });
      return response.data;
    },
  });
};
