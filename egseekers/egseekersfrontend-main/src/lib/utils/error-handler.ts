export const handleApiError = (error: any): never => {
  if (error.response) {
    // Server responded with an error
    const status = error.response.status;
    const message = error.response.data.message || error.response.data.error || 'An error occurred';
    
    if (status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (status === 403) {
      throw new Error('You do not have permission to perform this action.');
    } else if (status === 404) {
      throw new Error('The requested resource was not found.');
    } else if (status === 422) {
      throw new Error(`Validation error: ${message}`);
    } else if (status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(message);
    }
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('No response from server. Please check your connection or try again later.');
  } else {
    // Something else happened
    throw new Error(`Error: ${error.message || 'Network error occurred'}`);
  }
}; 