import api from '../services/api';

// Menu Items API
export const getAllMenuItems = async () => {
  const response = await api.get('/api/menu');
  return response.data;
};

export const getMenuItemById = async (id) => {
  const response = await api.get(`/api/menu/${id}`);
  return response.data;
};

// Reviews API
export const getReviewsByMenuItem = async (menuItemId) => {
  const response = await api.get(`/api/reviews/menu/${menuItemId}`);
  return response.data;
};

export const createReview = async (reviewData) => {
  // If reviewData is FormData (for file uploads), send with proper headers
  const config = reviewData instanceof FormData 
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : {};
  
  const response = await api.post('/api/reviews', reviewData, config);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/api/reviews/${id}`);
  return response.data;
};

export const markReviewHelpful = async (id) => {
  const response = await api.put(`/api/reviews/${id}/helpful`);
  return response.data;
};

// Hours / status
export const getDiningStatus = async () => {
  const response = await api.get('/api/hours/status');
  return response.data;
};
