import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../store/SpAbhay_useCartStore';
import { API_BASE_URL } from '../config';

export default function SpAbhay_BarcodeScanner({ onClose, shopId }) {
  const [isScanning, setIsScanning] = useState(true);
  const [scannedItem, setScannedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    if (!isScanning) return;

    let isMounted = true;
    let html5QrCode;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("barcode-reader");
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 100 } },
          (decodedText) => {
            if (!isMounted) return;
            // Stop scanning visually immediately, let the cleanup handle the actual hardware stop
            setIsScanning(false);
            fetchItemDetails(decodedText);
          },
          (errorMessage) => {
            // Ignore parsing errors
          }
        );

        if (!isMounted && html5QrCode.isScanning) {
          // Unmounted while starting
          await html5QrCode.stop();
          html5QrCode.clear();
        }
      } catch (err) {
        if (isMounted) console.error("Failed to start scanner", err);
      }
    };

    // Small delay to prevent React StrictMode double mount from locking camera
    const timeoutId = setTimeout(startScanner, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => html5QrCode.clear())
          .catch(err => console.error("Error stopping scanner", err));
      }
    };
  }, [isScanning]);

  const fetchItemDetails = async (barcode) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/scan/${shopId}/${barcode}`);
      const result = await res.json();
      if (result.success) {
         setScannedItem(result.data);
      } else {
         setError("Item not found in store's database.");
      }
    } catch (err) {
      setError("Failed to fetch product details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if(!scannedItem) return;
    addToCart({ id: scannedItem._id, name: scannedItem.name, price: scannedItem.price, quantity: 1, stock: scannedItem.stock });
    setScannedItem(null);
    setIsScanning(true); // resume scanning natively
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative z-10">
        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 bg-slate-100/80 rounded-full hover:bg-slate-200 text-slate-600 transition backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-slate-900 aspect-[4/3] flex flex-col items-center justify-center text-white relative">
           <div id="barcode-reader" className={`w-full h-full [&>div]:border-none [&>div>video]:w-full [&>div>video]:h-full [&>div>video]:object-cover ${!isScanning ? 'hidden' : ''}`}></div>
           {!isScanning && !loading && !scannedItem && !error && <div className="absolute inset-0 bg-slate-900/80"></div>}
           {loading && <Loader2 className="w-10 h-10 animate-spin text-indigo-400 absolute" />}
        </div>
        
        <div className="p-6">
          {!scannedItem && !loading && !error && (
            <div className="text-center">
              <Camera className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-lg">Point at a Barcode</h3>
              <p className="text-slate-500 text-sm">Scan a product to view the live price and stock.</p>
            </div>
          )}

          {error && (
            <div className="text-center">
              <div className="bg-rose-50 text-rose-600 p-4 rounded-xl font-bold mb-4">{error}</div>
              <button onClick={() => setIsScanning(true)} className="w-full py-3 bg-slate-100 font-bold rounded-xl text-slate-600 hover:bg-slate-200">Try Again</button>
            </div>
          )}

          {scannedItem && !loading && (
            <div className="animate-in fade-in zoom-in-95">
              <div className="border border-slate-100 bg-slate-50 p-4 rounded-2xl mb-4 text-center">
                <h3 className="font-black text-xl text-slate-800 mb-1">{scannedItem.name}</h3>
                <div className="text-2xl font-black text-indigo-600 mb-2">₹{scannedItem.price}</div>
                <div className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full inline-block border border-slate-200">
                  {scannedItem.stock} items left in aisle
                </div>
              </div>
              <button onClick={handleAddToCart} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Toss in Virtual Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
