import React, { useEffect, useState } from 'react';
import { Store, ShoppingBag, Calendar, ArrowRight, Star, Clock, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface StorefrontProps {
  slug?: string;
}

export const StorefrontPage: React.FC<StorefrontProps> = ({ slug = 'store' }) => {
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStore() {
      try {
        const data = await apiClient<any>(`/storefront/by-slug/${slug}`);
        setStoreData(data.store);
      } catch {
        // Fallback demo storefront
        setStoreData({
          name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug,
          status: 'LIVE'
        });
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading storefront...</span>
        </div>
      </div>
    );
  }

  const storeName = storeData?.name || 'BillionBiz Store';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">{storeName}</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                Verified Merchant
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Cart (0)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900/40 dark:to-slate-950 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400">
            Welcome to Our Official Store
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {storeName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Discover our curated catalog of products and schedule appointments online with instant confirmation.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href="#products"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition flex items-center gap-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="#booking"
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Book Appointment</span>
            </a>
          </div>
        </div>
      </section>

      {/* Product Highlights Section */}
      <section id="products" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Featured Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">Direct from the merchant inventory</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-10 h-10 opacity-40" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-blue-600">Premium Quality</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">4.9</span>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Sample Offering #{i}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  High quality artisanal goods delivered with speed and care.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white">₹1,499</span>
                  <button className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black dark:bg-blue-600 text-white text-xs font-semibold transition">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
          <h2 className="text-xl font-bold tracking-tight">Book an In-Store Appointment</h2>
          <p className="text-xs text-slate-500">
            Choose your service and pick an available slot with our certified specialists.
          </p>
        </div>

        <div className="max-w-xl mx-auto p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold block">1-on-1 Consultation & Styling</span>
                <span className="text-slate-400">45 mins • In-person</span>
              </div>
            </div>
            <span className="font-bold text-blue-600">₹799</span>
          </div>

          <button className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Select Date & Time</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center text-xs text-slate-400">
        <p>Powered by BillionBiz Platform • {storeName}</p>
      </footer>
    </div>
  );
};

export default StorefrontPage;

