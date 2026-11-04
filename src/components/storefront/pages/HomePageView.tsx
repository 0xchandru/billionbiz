import React from 'react';
import { ShoppingBag, Calendar, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useStorefrontCartStore } from '../../../store/storefrontCartStore';

interface HomePageViewProps {
  store?: any;
  brand?: any;
  brandName?: string;
  tagline?: string;
  products?: any[];
  categories?: any[];
  offerings?: any[];
  mode?: string;
  onNavigate?: (path: string) => void;
  sections?: any[];
}

export const HomePageView: React.FC<HomePageViewProps> = ({
  store,
  brand,
  brandName,
  tagline: propTagline,
  products = [],
  categories = [],
  offerings = [],
  mode = 'COMMERCE',
  onNavigate,
  sections = []
}) => {
  const { addItem } = useStorefrontCartStore();
  const storeName = brandName || brand?.name || store?.name || 'Our Boutique';
  const tagline = propTagline || brand?.tagline || 'Handcrafted Quality & Direct Commerce';
  const hasServices = mode === 'SERVICES' || mode === 'BOTH' || offerings.length > 0;
  const hasProducts = mode === 'COMMERCE' || mode === 'BOTH' || products.length > 0;

  // Truthful empty canvas when no sections have been added by the merchant
  if (!sections || sections.length === 0) {
    return (
      <div className="min-h-[460px] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center py-16 px-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-xs border border-slate-200 dark:border-slate-700">
            <Sparkles size={22} className="text-amber-500" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Empty Landing Page Canvas</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              No sections added yet. Click <strong>+ Add Section</strong> in the left sidebar to add a Hero, Featured Collection, or custom content block.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 py-20 px-4 sm:px-6 lg:px-8 border-b border-[var(--theme-border)]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Sparkles size={12} className="text-amber-500" />
            Official Online Store
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Welcome to {storeName}
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
            {tagline}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {hasProducts && (
              <button
                onClick={() => onNavigate?.('/shop')}
                className="px-6 py-3 rounded-lg bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-semibold text-sm shadow-md hover:opacity-90 transition flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>Shop Catalogue</span>
              </button>
            )}
            {hasServices && (
              <button
                onClick={() => onNavigate?.('/booking')}
                className="px-6 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Calendar size={16} />
                <span>Book Appointment</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products Collection */}
      {hasProducts && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-end justify-between border-b border-[var(--theme-border)] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Featured Products</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Handpicked items directly from our inventory.</p>
            </div>
            {products.length > 0 && (
              <button
                onClick={() => onNavigate?.('/shop')}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({products.length})</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onNavigate?.(`/shop?category=${cat.id}`)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            /* Truthful Empty State (Never fake seeded items) */
            <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No products published yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Real items added to your Catalogue in the Admin Portal will automatically appear in this storefront collection.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((p) => {
                const price = p.price_minor ? p.price_minor / 100 : 999;
                const comparePrice = p.compare_at_minor ? p.compare_at_minor / 100 : null;
                const img = p.media?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&fit=crop';
                return (
                  <div
                    key={p.id}
                    className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                  >
                    <div
                      className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer relative"
                      onClick={() => onNavigate?.(`/products/${p.handle || p.id}`)}
                    >
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4
                          onClick={() => onNavigate?.(`/products/${p.handle || p.id}`)}
                          className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 cursor-pointer hover:underline"
                        >
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-base font-bold text-slate-900 dark:text-white">
                            ₹{price.toLocaleString('en-IN')}
                          </span>
                          {comparePrice && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{comparePrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => addItem(p)}
                        className="w-full py-2 rounded-lg bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-semibold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag size={14} />
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Featured Services (if applicable) */}
      {hasServices && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-end justify-between border-b border-[var(--theme-border)] pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Our Services &amp; Appointments</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Reserve direct bookings with certified professionals.</p>
            </div>
            {offerings.length > 0 && (
              <button
                onClick={() => onNavigate?.('/booking')}
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all services ({offerings.length})</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {offerings.length === 0 ? (
            /* Truthful Empty State */
            <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Calendar size={22} />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                No active services configured yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Create appointments and services in Admin → Appointments to allow customer bookings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {offerings.slice(0, 6).map((srv) => {
                const price = srv.price_minor ? srv.price_minor / 100 : 1500;
                return (
                  <div
                    key={srv.id}
                    className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between shadow-xs"
                  >
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{srv.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{srv.description}</p>
                      <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>⏱ {srv.duration_minutes || 45} mins</span>
                        <span>₹{price.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate?.('/booking')}
                      className="w-full py-2 rounded-lg bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-semibold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar size={13} />
                      <span>Book Slot</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Brand Trust Badges */}
      <section className="bg-slate-50 dark:bg-slate-900/40 border-y border-[var(--theme-border)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Authentic Craftsmanship</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Every item is verified and directly fulfilled by {storeName}.</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Direct-to-Consumer</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">No intermediary markups. Transparent, honest pricing.</p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Secured Transactions</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Encrypted checkout with real-time parcel and order updates.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

