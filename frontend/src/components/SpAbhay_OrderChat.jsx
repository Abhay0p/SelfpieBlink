import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';

let socket;

import { API_BASE_URL } from '../config';

export default function SpAbhay_OrderChat({ orderId, isMerchant = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // In demo, connect to local socket (Assuming backend runs on 5000)
    socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    
    if (isMerchant) {
      socket.emit('join_merchant');
    }

    socket.on('receive_message', (msgData) => {
      if (msgData.orderId === orderId) {
        setMessages((prev) => [...prev, msgData]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId, isMerchant]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    const msg = {
      orderId,
      sender: isMerchant ? 'merchant' : 'customer',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('send_message', msg);
    setInput('');
  };

  return (
    <div className="mt-4 border border-indigo-100 bg-white rounded-2xl overflow-hidden flex flex-col h-64 shadow-sm">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        <span className="font-bold text-sm text-slate-700 shrink-0">Order Help Chat</span>
        <span className="text-xs text-slate-400 truncate w-full text-right">{orderId}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 pointer-events-auto">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 text-xs mt-10">Start a conversation with the {isMerchant ? 'customer' : 'store'}.</div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender === (isMerchant ? 'merchant' : 'customer');
            return (
              <div key={idx} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${isMine ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={sendMessage} className="p-2 bg-white flex items-center border-t border-slate-100 gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.e.target.value || e.target.value)}
          placeholder={`Message ${isMerchant ? 'customer' : 'store'}...`}
          className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-2 text-sm font-medium outline-none transition-all"
        />
        <button type="submit" className="p-2 min-w-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
