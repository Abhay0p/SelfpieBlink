import React, { useState, useEffect } from 'react';
import { Camera, Search, MapPin, Store, ChevronRight, Loader2, Sparkles, LogOut, ScanLine, ShoppingCart } from 'lucide-react';
import SpAbhay_SmartScanner from './SpAbhay_SmartScanner';
import SpAbhay_ActiveCart from './SpAbhay_ActiveCart';
import SpAbhay_StoreCheckIn from './SpAbhay_StoreCheckIn';
import SpAbhay_BarcodeScanner from './SpAbhay_BarcodeScanner';
import SpAbhay_ManualItemSelection from './SpAbhay_ManualItemSelection';
import { useCartStore } from '../store/SpAbhay_useCartStore';
import { API_BASE_URL } from '../config';

// -- CUSTOMER AUTHENTICATION VIEW --
function CustomerAuthView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        onLogin(data);
      } else setError(data.error);
    } catch(err) { setError("Server connection failed."); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-[100vh] mt-[-3rem] items-center justify-center bg-slate-50 relative overflow-hidden min-h-screen">
      <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white w-full max-w-md relative z-10">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg text-white mx-auto">
          <Camera className="w-8 h-8"/>
        </div>
        <h2 className="text-3xl font-black text-slate-800 text-center mb-2">{isLogin ? 'Customer Login' : 'Join SelfpieBlink'}</h2>
        <p className="text-center text-slate-500 text-sm mb-6">Skip the billing queue seamlessly.</p>
        
        {error && <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg mb-4 font-bold text-center border border-rose-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full px-5 py-4 bg-slate-100/50 focus:bg-white rounded-2xl font-medium" />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full px-5 py-4 bg-slate-100/50 focus:bg-white rounded-2xl font-medium" />
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:bg-indigo-400">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (isLogin ? 'Login to App' : 'Create Account')}
          </button>
          <div className="text-center text-sm font-bold text-indigo-600 cursor-pointer pt-2" onClick={() => setIsLogin(!isLogin)}>
             {isLogin ? 'Create a new account' : 'Already have an account?'}
          </div>
        </form>
      </div>
    </div>
  );
}

// -- NEARBY SHOPS DISCOVERY --
function NearbyShops({ onSelectShop }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list or qr

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/shops/nearby`)
      .then(res => res.json())
      .then(data => { if(data.success) setShops(data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (mode === 'qr') {
     return (
       <div className="relative">
         <button onClick={() => setMode('list')} className="absolute -top-14 left-4 text-indigo-600 font-bold hover:text-indigo-800 transition flex items-center z-50">
           <ChevronRight className="w-5 h-5 rotate-180 mr-1"/> Back to List
         </button>
         <SpAbhay_StoreCheckIn onLockedIn={onSelectShop} />
       </div>
     );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Nearby Stores</h2>
          <p className="text-slate-500 font-medium">Auto-detected via Geolocation</p>
        </div>
        <button onClick={() => setMode('qr')} className="bg-indigo-50 text-indigo-600 px-4 py-2 font-bold rounded-xl flex items-center hover:bg-indigo-100">
           <Camera className="w-4 h-4 mr-2" /> Scan QR
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="grid gap-4">
          {shops.map((shop, idx) => (
             <div key={shop._id} onClick={() => onSelectShop(shop._id)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition cursor-pointer flex justify-between items-center group">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">{shop.shopName}</h3>
                 <p className="text-emerald-500 text-sm font-bold flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-1" /> {Math.floor(Math.random() * 800) + 100}m away</p>
               </div>
               <div className="w-12 h-12 bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 rounded-2xl flex items-center justify-center transition">
                 <Store className="w-6 h-6" />
               </div>
             </div>
          ))}
          {shops.length === 0 && <p className="text-center font-bold text-slate-400 mt-10">No nearby shops found.</p>}
        </div>
      )}
    </div>
  );
}


export default function SpAbhay_CustomerDashboard() {
  const [showScanner, setShowScanner] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showManualItems, setShowManualItems] = useState(false);
  const { currentShopId, setShopId } = useCartStore();
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('customerToken'));

  if (!isAuthenticated) return <CustomerAuthView onLogin={() => setIsAuthenticated(true)} />;

  if (!currentShopId) {
    return (
      <div className="relative">
         <button onClick={() => { localStorage.clear(); setIsAuthenticated(false); }} className="absolute -top-14 right-4 text-rose-500 font-bold hover:text-rose-600 transition flex items-center z-50">
           <LogOut className="w-4 h-4 mr-1"/> Logout
         </button>
         <NearbyShops onSelectShop={(id) => setShopId(id)} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => { setShopId(null); setShowScanner(false); setShowBarcodeScanner(false); setShowManualItems(false); }}
          className="flex items-center text-slate-500 font-semibold hover:text-slate-800 transition"
        >
          <ChevronRight className="rotate-180 w-5 h-5 mr-1" /> Leave Store
        </button>
        <button onClick={() => { localStorage.clear(); setIsAuthenticated(false); setShopId(null); }} className="flex items-center text-rose-500 font-bold hover:text-rose-600 transition">
          <LogOut className="w-4 h-4 mr-1"/> Logout
        </button>
      </div>
      
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden mb-safe">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Store className="w-64 h-64" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">Live Store Checkout</h1>
        <div className="text-emerald-600 font-bold flex items-center gap-2 mb-8 bg-emerald-50 px-3 py-1 rounded-full w-max text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Store DB Tracking Locked In
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Instant Scan</h3>
            <p className="text-slate-600 mb-6 text-xs flex-1">Scan an item's barcode from your camera for quick add.</p>
            <button onClick={() => setShowBarcodeScanner(true)} className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-auto">
              <ScanLine className="w-4 h-4" /> Scan
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Magic List</h3>
            <p className="text-slate-600 mb-6 text-xs flex-1">Take a picture of your handwritten shopping list.</p>
            <button onClick={() => setShowScanner(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-auto">
              <Sparkles className="w-4 h-4" /> Upload
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-100 flex flex-col items-center justify-center text-center group hover:shadow-md transition-all h-full">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Store Items</h3>
            <p className="text-slate-600 mb-6 text-xs flex-1">Browse all available grocery items manually.</p>
            <button onClick={() => setShowManualItems(true)} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 mt-auto">
              <ShoppingCart className="w-4 h-4" /> Browse
            </button>
          </div>
        </div>
      </div>

      {showScanner && <SpAbhay_SmartScanner onClose={() => setShowScanner(false)} shopId={currentShopId} />}
      {showBarcodeScanner && <SpAbhay_BarcodeScanner onClose={() => setShowBarcodeScanner(false)} shopId={currentShopId} />}
      {showManualItems && <SpAbhay_ManualItemSelection onClose={() => setShowManualItems(false)} shopId={currentShopId} />}
      
      <SpAbhay_ActiveCart />
    </div>
  );
}
