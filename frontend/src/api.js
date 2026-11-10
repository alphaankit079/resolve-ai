import axios from 'axios';
import { io } from 'socket.io-client';

// 1. Raw URL lein aur agar aakhiri me '/' ya '/api' ho toh use clean kar dein
const RAW_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

// 2. API ke liye hamesha '/api' jodein, aur Socket ke liye clean root URL rakhein
const API_URL = `${RAW_URL}/api`;
const SOCKET_URL = RAW_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resolve_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
});

export default api;