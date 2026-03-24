import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Store, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../store/SpAbhay_useCartStore';

export default function SpAbhay_StoreCheckIn({ onLockedIn }) {
  const [scannedId, setScannedId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const setShopId = useCartStore(state => state.setShopId);

  useEffect(() => {
    let scanner = null;
    if (isScanning) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render((decodedText) => {
        // Assume decodedText is the shopId (Object ID string)
        scanner.clear();
        setIsScanning(false);
        handleSetShop(decodedText);
      }, (error) => {});
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [isScanning]);

  const handleSetShop = (id) => {
    // Basic format check for MongoDB ObjectId or demo string
    if(id.length > 5) {
      setShopId(id);
      onLockedIn(id);
    } else {
      alert("Invalid Store ID format.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-indigo-50 w-full max-w-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-indigo-500">
          <Store className="w-64 h-64" />
        </div>
        
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
           <QrCode className="w-10 h-10 text-indigo-500" />
           <div className="absolute inset-0 bg-indigo-400 opacity-20 rounded-full animate-ping"></div>
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2">Store Check-In</h1>
        <p className="text-slate-500 font-medium mb-8">Scan the store's QR code at the entrance to access live pricing and the Queue-Buster checkout.</p>

        {isScanning ? (
          <div className="mb-6 rounded-3xl overflow-hidden border-2 border-indigo-200">
             <div id="reader" className="w-full"></div>
             <button onClick={() => setIsScanning(false)} className="w-full py-3 bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition">Cancel Scan</button>
          </div>
        ) : (
          <button 
            onClick={() => setIsScanning(true)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <QrCode className="w-5 h-5"/> Scan Entrance QR
          </button>
        )}

        <div className="flex items-center gap-4 text-slate-400 font-bold text-sm uppercase my-6">
          <div className="flex-1 h-px bg-slate-100"></div> OR <div className="flex-1 h-px bg-slate-100"></div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSetShop(scannedId); }}>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Enter 5+ char Store ID manually" 
              value={scannedId}
              onChange={e => setScannedId(e.target.value)}
              className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <button type="submit" className="px-5 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 transition flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
