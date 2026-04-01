import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export function useMerchantAuth() {
  const [authData, setAuthData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('merchantToken');
    const shopId = localStorage.getItem('merchantShopId');
    if (token && shopId) setAuthData({ token, shopId });
  }, []);

  const login = async (email, password, isLogin, shopName, location) => {
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password, role: 'merchant' } : { email, password, shopName, role: 'merchant', location };
    
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.token) {
        localStorage.setItem('merchantToken', data.token);
        localStorage.setItem('merchantShopId', data.id);
        setAuthData({ token: data.token, shopId: data.id });
        return { success: true };
      } else { 
        return { success: false, error: data.error };
      }
    } catch(err) { 
        return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('merchantToken');
    localStorage.removeItem('merchantShopId');
    setAuthData(null);
  };

  return { authData, login, logout, setAuthData };
}
