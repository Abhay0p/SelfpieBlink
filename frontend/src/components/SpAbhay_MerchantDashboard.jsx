import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, QrCode, LogOut, CheckCircle2, MessageSquare, AlertTriangle, PackageCheck, Loader2, Trash2, Edit, X } from 'lucide-react';
import { io } from 'socket.io-client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { API_BASE_URL } from '../config';
import SpAbhay_OrderChat from './SpAbhay_OrderChat';

function AuthView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password, role: 'merchant' } : { email, password, shopName: "My Real Store", role: 'merchant' };
    
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
        onLogin(data);
      } else { alert(data.error); }
    } catch(err) { console.error(err); }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50"><div className="bg-white p-10 rounded-[2.5rem] shadow-2xl"><h2 className="text-3xl font-black">{isLogin ? 'Merchant Login' : 'Register Store'}</h2><form onSubmit={handleSubmit} className="mt-8 space-y-4"><input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-5 py-4 bg-slate-100 rounded-2xl" /><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-5 py-4 bg-slate-100 rounded-2xl" /><button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl">{isLogin?'Login':'Sign Up'}</button><div className="text-center font-bold text-indigo-600 cursor-pointer pt-2" onClick={() => setIsLogin(!isLogin)}>{isLogin?'Create new store account':'Already have an account?'}</div></form></div></div>
  );
}

function DashboardHome({ activeOrders, shopId, onUpdateStatus, onChatOpen }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
         <div>
            <h2 className="text-3xl font-black text-slate-800">Live Dashboard Overview</h2>
            <p className="text-slate-500 font-medium">Blinkit-style Floor Management Tracker.</p>
         </div>
         <div className="hidden md:flex flex-col items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 mb-2 tracking-widest uppercase">Print Entrance QR</h4>
            <div className="bg-indigo-50 p-3 rounded-2xl"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${shopId}&color=4f46e5&bgcolor=f5f3ff`} alt="QR" className="mix-blend-multiply" /></div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Total Sales Today', value: '₹12,450', color: 'from-emerald-400 to-emerald-600' },
          { title: 'Items in Stock', value: '1,204', color: 'from-purple-400 to-purple-600' },
          { title: 'Pending Exits', value: activeOrders.length, color: 'from-rose-400 to-rose-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl`}></div>
            <p className="text-slate-500 font-bold uppercase mb-2">{stat.title}</p>
            <h3 className="text-4xl font-black text-slate-800">{stat.value}</h3>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">Active Floor Queue</h3>
      <div className="space-y-4">
        {activeOrders.map((o, idx) => (
          <div key={idx} className="bg-white border text-left p-6 rounded-3xl shadow-sm border-slate-200">
             <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg text-sm mr-2">{o.orderId}</span>
                  <span className={`px-3 py-1 font-bold text-xs rounded-full ${o.status === 'Pending' ? 'bg-amber-100 text-amber-700' : o.status === 'Accepted' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{o.status}</span>
                  <p className="text-slate-800 font-black mt-3">₹{o.total} <span className="text-slate-400 font-medium text-sm ml-2">({o.items.length} items to pick)</span></p>
               </div>
               <button onClick={() => onChatOpen(o.orderId)} className="w-10 h-10 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-full flex items-center justify-center transition-colors"><MessageSquare className="w-5 h-5" /></button>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4 max-h-32 overflow-auto">
               <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Customer Cart</p>
               <ul className="text-sm text-slate-700 font-medium space-y-1">
                 {o.items.map((i, idxx) => <li key={idxx}>• {i.quantity}x {i.name}</li>)}
               </ul>
             </div>

             <div className="flex gap-3">
               {o.status === 'Pending' && (
                 <>
                   <button onClick={() => onUpdateStatus(o.orderId, 'Accepted')} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Accept Order</button>
                   <button onClick={() => onUpdateStatus(o.orderId, 'Rejected')} className="px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition">Decline</button>
                 </>
               )}
               {o.status === 'Accepted' && (
                 <button onClick={() => onUpdateStatus(o.orderId, 'Ready for Pickup')} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition flex justify-center items-center gap-2"><PackageCheck className="w-5 h-5"/> Mark Ready for Pickup</button>
               )}
               {o.status === 'Ready for Pickup' && (
                  <p className="text-emerald-600 font-bold bg-emerald-50 w-full p-3 rounded-xl text-center">Customer Gate Pass Unlocked. Waiting safely at Exits.</p>
               )}
             </div>
          </div>
        ))}
        {activeOrders.length === 0 && <div className="text-center py-10 font-bold text-slate-400">No active queue. Relax!</div>}
      </div>
    </div>
  );
}

function InventoryManager({ shopId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', barcode: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${shopId}`);
      const result = await res.json();
      if(result.success) setItems(result.data);
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_BASE_URL}/api/inventory/${shopId}/${editingId}` : `${API_BASE_URL}/api/inventory/${shopId}`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, price: Number(formData.price), stock: Number(formData.stock) }) });
      if(res.ok) { 
        setFormData({ name: '', price: '', stock: '', barcode: '' }); setEditingId(null); fetchInventory(); 
        const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
        socket.emit('inventory_changed', { shopId });
      }
    } catch(err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete item?")) return;
    try { 
      await fetch(`${API_BASE_URL}/api/inventory/${shopId}/${id}`, { method: 'DELETE' }); 
      fetchInventory(); 
      const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
      socket.emit('inventory_changed', { shopId });
    } 
    catch(err) { console.error(err); }
  };

  const toggleStock = async (item) => {
    const newStock = item.stock > 0 ? 0 : 50; // Just flip to 50 if zero for demo simplicity
    try {
      await fetch(`${API_BASE_URL}/api/inventory/${shopId}/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: newStock }) });
      fetchInventory();
      const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
      socket.emit('inventory_changed', { shopId });
    } catch(err) { console.error(err); }
  };

  if(loading) return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" /></div>;

  return (
    <div className="animate-in fade-in py-4">
      <h2 className="text-3xl font-black text-slate-800 mb-8">Inventory Catalog</h2>
      <form onSubmit={handleSave} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 flex flex-wrap gap-4 items-end shadow-sm">
         <div className="flex-1 min-w-[200px]"><label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Name</label><input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
         <div className="w-32"><label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Price (₹)</label><input type="number" required min="0" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
         <div className="w-32"><label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Stock</label><input type="number" required min="0" value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
         <div className="flex-1 min-w-[150px]"><label className="text-xs font-bold text-slate-500 ml-1 mb-1 block uppercase">Barcode</label><input type="text" value={formData.barcode} onChange={e=>setFormData({...formData, barcode:e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200" /></div>
         <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">{editingId?'Update':'Add Item'}</button>
      </form>

      <table className="w-full text-left border-collapse bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <thead><tr className="bg-slate-50 text-slate-500 font-bold uppercase text-xs"><th className="p-4">Product</th><th className="p-4">Pricing</th><th className="p-4 text-center">Fast Status Toggle</th><th className="p-4 text-right">Actions</th></tr></thead>
        <tbody>
          {items.map(i => (
            <tr key={i._id} className="border-t border-slate-50">
              <td className="p-4 font-bold text-slate-800">{i.name} <div className="text-slate-400 font-mono text-xs font-normal">{i.barcode||'No barcode'}</div></td>
              <td className="p-4 font-black tracking-tight">₹{i.price}</td>
              <td className="p-4 text-center">
                 <button onClick={()=>toggleStock(i)} className={`px-4 py-2 font-bold text-xs rounded-xl shadow-sm transition-all focus:scale-95 ${i.stock > 0 ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700' : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-700'}`}>
                   {i.stock > 0 ? `In Stock (${i.stock})` : 'Out of Stock'}
                 </button>
              </td>
              <td className="p-4 text-right">
                <button onClick={()=>{setFormData({name:i.name,price:i.price,stock:i.stock,barcode:i.barcode});setEditingId(i._id);}} className="p-2 text-slate-400 hover:text-indigo-600"><Edit className="w-4 h-4" /></button>
                <button onClick={()=>handleDelete(i._id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExitApproval({ shopId }) {
  const [scannedId, setScannedId] = useState('');
  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("door-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((decodedText) => { scanner.clear(); setIsScanning(false); handleAPIValidation(decodedText); }, () => {});
    }
    return () => { if (scanner) scanner.clear().catch(e=>e); };
  }, [isScanning]);

  const handleAPIValidation = async (orderIdString) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/exit-validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderIdString, shopId }) });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch(err) { setResult({ success: false, message: 'Server error processing exit logic.' }); }
  };

  return (
    <div className="max-w-2xl mx-auto text-center animate-in fade-in py-10">
      <h2 className="text-3xl font-black text-slate-800 mb-4">Gatekeeper QR Scanner</h2>
      {isScanning ? <div className="mb-8 p-4 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"><div id="door-reader"></div></div> : <button onClick={() => { setIsScanning(true); setResult(null); }} className="px-6 py-3 bg-slate-800 text-white rounded-xl mb-6 font-bold shadow-lg">Scan Another Pass</button>}
      {result && <div className={`p-6 rounded-3xl font-bold border text-lg ${result.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm'}`}>{result.message}</div>}
    </div>
  );
}

export default function SpAbhay_MerchantDashboard() {
  const [authData, setAuthData] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [chatModal, setChatModal] = useState(null); // active chat orderId
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('merchantToken');
    const shopId = localStorage.getItem('merchantShopId');
    if (token && shopId) setAuthData({ token, shopId });
    
    const socket = io(API_BASE_URL, { transports: ['websocket', 'polling'] });
    socket.emit('join_merchant');
    
    socket.on('order_received', (order) => { if (order.shopId === (shopId || localStorage.getItem('merchantShopId'))) setActiveOrders(prev => [order, ...prev]); });
    return () => socket.disconnect();
  }, [authData?.shopId]);

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, shopId: authData.shopId })
      });
      if(res.ok) {
        setActiveOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status } : o));
        // Crucial blinkit-flow emit to sync user UI
        const socket = io(API_BASE_URL, { transports: ['websocket'] });
        socket.emit('update_order_status', { orderId, status });
      }
    } catch(e) { console.error('Status failed', e); }
  };

  if (!authData) return <AuthView onLogin={setAuthData} />;

  const navItems = [{ name: 'Live Queue', path: '/merchant', icon: LayoutDashboard }, { name: 'Gate Exit Scanner', path: '/merchant/exit', icon: QrCode }, { name: 'Inventory DB', path: '/merchant/inventory', icon: PackageSearch }];

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-700 pt-4 relative">
      <aside className="w-64 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col shrink-0 overflow-hidden">
        <div className="px-6 pt-10 pb-6 text-xl font-black tracking-tight flex flex-col items-center border-b border-indigo-50">Store Configuration<div className="mt-4 p-2 bg-slate-50 rounded-2xl border border-slate-100 w-full text-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${authData.shopId}&color=1e293b&bgcolor=f8fafc`} alt="QR" className="mx-auto mix-blend-multiply rounded-xl" /><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-3">Entrance ID</p></div></div>
        <div className="p-6">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/merchant');
              const Icon = item.icon;
              return (
                <Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <Icon className={`w-5 h-5 ${isActive?'text-indigo-600':''}`} /> {item.name}
                  {item.name === 'Live Queue' && activeOrders.length > 0 && <span className="ml-auto w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-xs animate-bounce">{activeOrders.length}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6"><button onClick={()=>{localStorage.clear(); setAuthData(null);}} className="flex items-center gap-3 text-rose-500 font-bold px-4 py-3 w-full rounded-2xl hover:bg-rose-50"><LogOut className="w-5 h-5" /> Logout</button></div>
      </aside>

      <main className="flex-1 bg-white rounded-[2.5rem] border border-slate-100/50 p-8 overflow-y-auto shadow-sm relative">
        <Routes>
          <Route path="/" element={<DashboardHome activeOrders={activeOrders} shopId={authData.shopId} onUpdateStatus={handleUpdateStatus} onChatOpen={setChatModal} />} />
          <Route path="/exit" element={<ExitApproval shopId={authData.shopId} />} />
          <Route path="/inventory" element={<InventoryManager shopId={authData.shopId} />} />
        </Routes>
      </main>

      {/* Customer Chat Support Modal */}
      {chatModal && (
         <div className="absolute top-8 right-8 w-96 bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 z-50 animate-in slide-in-from-right-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><MessageSquare className="w-6 h-6 text-indigo-500"/> Direct Chat</h3>
              <button onClick={() => setChatModal(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="h-64 mb-2 -mx-4 border-y border-slate-100 overflow-hidden relative">
               <SpAbhay_OrderChat orderId={chatModal} isMerchant={true} />
            </div>
         </div>
      )}
    </div>
  );
}
