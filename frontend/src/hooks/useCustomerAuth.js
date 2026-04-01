import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export function useCustomerAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('customerToken'));
  }, []);

  const login = async (email, password, isLogin) => {
    setIsLoading(true);
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = { email, password, role: 'customer' };
    
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.token) {
        localStorage.setItem('customerToken', data.token);
        localStorage.setItem('customerId', data.id);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        setError(data.error);
        return { success: false };
      }
    } catch(err) { 
        console.error(err);
        setError("Server connection failed."); 
        return { success: false };
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerId');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout, isLoading, error, setIsAuthenticated };
}
