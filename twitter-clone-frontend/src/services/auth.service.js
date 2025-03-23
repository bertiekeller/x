import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true // Important for cookies
});

class AuthService {
  async login(email, password) {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password
    });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data;
  }

  async refreshToken() {
    try {
      const response = await axiosInstance.post('/auth/refresh-token');
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
      }
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
  }

  getCurrentAccessToken() {
    return localStorage.getItem('accessToken');
  }
}

export default new AuthService();