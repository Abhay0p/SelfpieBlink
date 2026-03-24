import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Plus, ShoppingCart } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useCartStore } from '../store/SpAbhay_useCartStore';
import { io } from 'socket.io-client';

export default function SpAbhay_ManualItemSelection({ onClose, shopId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, cartItems } = useCartStore();

  useEffect(() => {
    const fetchInventory = () => {
      fetch(`${API_BASE_URL}/api/inventory/${shopId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setItems(data.data);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchInventory();

    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    socket.on(`inventory_refresh_${shopId}`, () => {
      fetchInventory();
    });

    return () => socket.disconnect();
  }, [shopId]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center sm:items-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl h-[85vh] sm:h-[80vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            Browse Items
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search for groceries, essentials..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 content-scroll">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-slate-500 font-medium text-sm">Loading store inventory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="h-full flex items-center justify-center flex-col text-center p-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-800 font-bold text-lg mb-1">No items found</p>
              <p className="text-slate-500 text-sm">Try searching for something else.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredItems.map(item => {
                const cartItem = cartItems.find(i => i.id === item._id);
                const quantity = cartItem ? cartItem.quantity : 0;
                
                return (
                  <div key={item._id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-100 hover:shadow-md transition-all group">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-1" title={item.name}>{item.name}</h3>
                      <p className="text-emerald-600 font-bold mt-1 text-sm bg-emerald-50 w-max px-2 py-0.5 rounded-md">₹{item.price}</p>
                    </div>
                    {quantity > 0 ? (
                      <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-indigo-100 whitespace-nowrap">
                        {quantity} <span className="hidden sm:inline">added</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => addToCart({ id: item._id, name: item.name, price: item.price })}
                        disabled={item.stock < 1}
                        className={`p-2 rounded-xl transition flex items-center justify-center shrink-0 ${
                          item.stock < 1 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white group-hover:scale-105'
                        }`}
                        title={item.stock < 1 ? "Out of stock" : "Add to cart"}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
