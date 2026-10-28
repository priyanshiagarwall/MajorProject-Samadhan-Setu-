import api from './api';

export const universityService = {
  getProfile: async () => {
    const response = await api.get('/universities/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/universities/profile', profileData);
    return response.data;
  },

  getChallenges: async () => {
    const response = await api.get('/universities/challenges');
    return response.data;
  },

  expressInterest: async (challengeId, notes) => {
    const response = await api.post(`/universities/challenges/${challengeId}/interest`, { notes });
    return response.data;
  },

  acceptChallenge: async (challengeId, facultyData) => {
    const response = await api.post(`/universities/challenges/${challengeId}/accept`, facultyData);
    return response.data;
  },

  declineChallenge: async (challengeId) => {
    const response = await api.post(`/universities/challenges/${challengeId}/decline`);
    return response.data;
  }
};

