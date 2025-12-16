/**
 * Clears all authentication-related data from localStorage
 */
export function clearAuthData() {
  if (typeof window !== 'undefined') {
    // Clear authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    
    // Clear any other auth-related items
    localStorage.removeItem('user');
    localStorage.removeItem('auth');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    console.log('All authentication data has been cleared from localStorage');
    
    // Redirect to login page
    window.location.href = '/';
  }
} 