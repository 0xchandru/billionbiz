import React, { useEffect, useState } from 'react';
import { 
  Store, 
  ShoppingBag, 
  Calendar, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  ExternalLink,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../api/client';
import { getPortalUrl } from '../utils/subdomain';

interface StorefrontProps {
  slug?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const StorefrontPage: React.FC<StorefrontProps> = ({ slug = 'shoum' }) => {
  const [storeData, setStoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await apiClient<any>(`/storefront/by-slug/${slug}`);
        if (!data || !data.store) {
          setNotFound(true);
        } else {
          setStoreData(data);
        }
      } catch (err: any) {
        // P0 Requirement: Never render a fallback demo store on unknown host
        console.warn(`[Storefront] Failed to load store '${slug}':`, err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) {
      loadStore();
    }
  }, [slug]);

  const addToCart = (product: any) => {
    const price = product.price_minor ? product.price_minor / 100 : 999;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Resolving storefront release...</span>
        </div>
      </div>
    );
  }

  // P0 Launch Gate: Dedicated 404 Store Not Found UI (Never a fake demo store)
  if (notFound || !storeData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-600 dark:text-amber-400">
              404 • Storefront Not Found
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              No Active Store Found
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              There is no active or published store registered at <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{slug}.stores.chandraprakash.codes</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 text-left space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Are you the store owner?</p>
            <p>1. Sign in to your Merchant Admin console.</p>
            <p>2. Complete Online Store setup and click <strong>Publish</strong>.</p>
            <p>3. Verify that your custom domain or store slug matches this URL.</p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={getPortalUrl('admin', '/login')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-semibold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Merchant Admin Login</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={getPortalUrl('root')}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
            >
              Explore BillionBiz Platform
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { store, products = [], offerings = [], activeRelease } = storeData;
  const storeName = store?.name || 'BillionBiz Merchant';
  const currency = store?.currency === 'INR' ? '₹' : (store?.currency || '$');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">{storeName}</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">
                Active Storefront
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-emerald-50/50 to-white dark:from-slate-900/40 dark:to-slate-950 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Store</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {storeName}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            {activeRelease?.notes || 'Discover our curated catalog of products and schedule appointments online with instant confirmation.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {products.length > 0 && (
              <a
                href="#products"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition flex items-center gap-2"
              >
                <span>Browse Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            {offerings.length > 0 && (
              <a
                href="#booking"
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Book Appointment</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Catalogue & Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">Directly sourced from {storeName}</p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
            <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Catalogue is being curated</p>
            <p className="text-xs text-slate-400">Products added by this merchant will appear here in real time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => {
              const price = product.price_minor ? product.price_minor / 100 : 0;
              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 opacity-30" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-600 uppercase tracking-wider text-[10px]">
                        {product.product_type || 'Product'}
                      </span>
                      {product.sku && <span className="text-[10px] text-slate-400">{product.sku}</span>}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    )}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {currency}{price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Services / Bookings Section */}
      {offerings.length > 0 && (
        <section id="booking" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
            <h2 className="text-xl font-bold tracking-tight">Services & Appointments</h2>
            <p className="text-xs text-slate-500">
              Schedule a dedicated session with certified specialists at {storeName}.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-3">
            {offerings.map((offering: any) => {
              const price = offering.price_minor ? offering.price_minor / 100 : 0;
              return (
                <div
                  key={offering.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold block text-sm">{offering.name}</span>
                      <span className="text-slate-400">
                        {offering.duration_minutes} mins • Instant confirmation
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-emerald-600">
                      {currency}{price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedOffering(offering);
                        setBookingSuccess(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white font-semibold transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Booking Modal */}
      {selectedOffering && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Book Appointment</h3>
              <button
                onClick={() => setSelectedOffering(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Appointment Confirmed!</h4>
                <p className="text-xs text-slate-500">
                  Your reservation for <strong>{selectedOffering.name}</strong> has been booked. A confirmation email has been dispatched.
                </p>
                <button
                  onClick={() => setSelectedOffering(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="font-semibold">{selectedOffering.name}</div>
                  <div className="text-slate-500">{selectedOffering.duration_minutes} minutes • {currency}{(selectedOffering.price_minor || 0) / 100}</div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Full Name</label>
                  <input
                    type="text"
                    defaultValue="Valued Customer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Email Address</label>
                  <input
                    type="email"
                    defaultValue="client@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  onClick={() => setBookingSuccess(true)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Confirm Booking
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm">Your Cart</span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <ShoppingBag className="w-8 h-8 opacity-40 mx-auto" />
                  <p>Your shopping cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                      <div>
                        <span className="font-semibold block">{item.name}</span>
                        <span className="text-slate-500">{currency}{item.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQty(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Subtotal</span>
                  <span className="text-base text-emerald-600">{currency}{cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => alert(`Checkout initiated for ${storeName} totaling ${currency}${cartTotal.toLocaleString()}`)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8 px-4 text-center text-xs text-slate-400">
        <p>Powered by BillionBiz Platform • {storeName}</p>
      </footer>
    </div>
  );
};

export default StorefrontPage;
