export const setupSocketManager = (io) => {

  const activeOrders = new Map();

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);

    // Merchant joins specific room
    socket.on('join_merchant', () => {
      socket.join('merchant_room');
      console.log('[Socket] Merchant joined');
    });

    // Customer places a new order
    socket.on('new_order', (orderData) => {
      const order = { ...orderData, status: 'Pending', createdAt: new Date() };
      activeOrders.set(order.orderId, order);
      // Notify merchants instantly
      io.to('merchant_room').emit('order_received', order);
      console.log(`[Socket] New order broadcast: ${order.orderId}`);
    });

    // Merchant updates order status
    socket.on('update_order_status', ({ orderId, status }) => {
      const order = activeOrders.get(orderId);
      if (order) {
        order.status = status;
        // Notify all clients (customer can listen to this)
        io.emit('order_status_changed', { orderId, status });
        console.log(`[Socket] Order ${orderId} status updated to ${status}`);
      }
    });

    // Global chat system
    socket.on('send_message', (messageData) => {
      // messageData: { orderId, sender: 'merchant'|'customer', text: '...' }
      io.emit('receive_message', messageData);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });

    // Merchant inventory update broadcast
    socket.on('inventory_changed', ({ shopId }) => {
      // Notify all customers inside this shop's specific room
      io.to(`shop_${shopId}`).emit('inventory_refresh');
      // Also broadcast globally if needed (fallback)
      io.emit(`inventory_refresh_${shopId}`);
    });
  });
};
