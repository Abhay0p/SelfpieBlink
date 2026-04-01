import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

export function useMerchantOrders(shopId) {
  const [activeOrders, setActiveOrders] = useState([]);

  useEffect(() => {
    if (!shopId) return;

    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_merchant');
    
    socket.on('order_received', (order) => { 
        if (order.shopId === shopId) {
            setActiveOrders(prev => [order, ...prev]); 
        }
    });

    return () => socket.disconnect();
  }, [shopId]);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, shopId })
      });
      if(res.ok) {
        setActiveOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status } : o));
        const socket = io(API_BASE_URL, { transports: ['websocket'] });
        socket.emit('update_order_status', { orderId, status });
        return true;
      }
    } catch(e) { console.error('Status check failed', e); }
    return false;
  };

  return { activeOrders, updateOrderStatus };
}
