import React, { useState } from 'react';
import { useCartStore } from '../store/SpAbhay_useCartStore';
import { Camera, Upload, X, Loader2, ListOrdered, CheckCircle2, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function SpAbhay_SmartScanner({ onClose, shopId }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const addToCart = useCartStore((state) => state.addToCart);

  const handleUpload = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('listImage', file);

      // Actual API Integration
      const res = await fetch(`${API_BASE_URL}/api/ai-match/${shopId}`, {
         method: 'POST',
         body: formData,
      });
      
      const result = await res.json();
      
      if (result.success && result.data.length > 0) {
        result.data.forEach(item => {
          addToCart({
            id: item.matchedId || item._id, 
            name: item.name, 
            price: item.price, 
            quantity: item.requestedQuantity || 1
          });
        });
        onClose();
      } else if (result.success && result.data.length === 0) {
        setError("AI could not read the handwriting or no matching inventory was found.");
      } else {
        setError(result.message || "Failed to process the list using AI.");
      }
    } catch (err) {
      console.error(err);
      setError("AI engine unavailable right now. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        <div className="absolute top-4 right-4 z-20">
          <button onClick={onClose} className="p-2 bg-slate-100/50 rounded-full hover:bg-slate-200 text-slate-500 backdrop-blur-sm transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 md:p-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl flex items-center justify-center border border-indigo-100 mb-6 shadow-sm">
            <Camera className="w-10 h-10 text-indigo-600" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Scan Handwritten List</h2>
          <p className="text-slate-500 mb-8 font-medium leading-relaxed">Take a clear picture of your paper list. Our Gemini AI model maps it dynamically to this store's live inventory.</p>

          {!file ? (
            <label className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100 transition-all group">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:-translate-y-2 transition-transform duration-300">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <span className="font-bold text-slate-800 text-lg">Tap to upload picture</span>
              <span className="text-slate-400 text-sm mt-2 font-medium">JPG, PNG strictly under 2MB</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            </label>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div className="relative rounded-3xl overflow-hidden border border-slate-100 aspect-video bg-slate-100 shadow-inner group">
                <img src={URL.createObjectURL(file)} alt="List Preview" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 drop-shadow-lg" />
                  <span className="text-white font-bold drop-shadow text-lg tracking-tight">Image Captured</span>
                  <button onClick={() => setFile(null)} className="absolute bottom-4 text-xs font-bold text-white/80 hover:text-white underline underline-offset-4">Retake Photo</button>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-rose-500" />
                  <div className="text-sm font-semibold">{error}</div>
                </div>
              )}

              <button 
                onClick={handleUpload}
                disabled={isProcessing}
                className="w-full py-4 bg-slate-900 focus:ring-4 focus:ring-slate-200 hover:bg-black disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" /> Analyzing with Gemini...
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                  </>
                ) : (
                  <>
                    <ListOrdered className="w-5 h-5" /> Generate Magic Cart
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
