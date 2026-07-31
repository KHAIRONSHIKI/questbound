import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL API Backend Laravel. Ubah IP ini ke IP lokal komputer Anda (IPv4) jika ditest di perangkat fisik,
// atau biarkan 10.0.2.2 jika menggunakan Android Emulator.
export const API_URL = 'http://192.168.100.57:8000/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
