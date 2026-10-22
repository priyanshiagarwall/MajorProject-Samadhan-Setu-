import api from './api';

export const problemService = {
  getMyProblems: async () => {
    const response = await api.get('/problems/my');
    return response.data;
  },

  getProblemById: async (id) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },

  getSavedProblems: async () => {
    const response = await api.get('/problems/saved');
    return response.data;
  },

  toggleSaveProblem: async (id) => {
    const response = await api.post(`/problems/${id}/save`);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};
