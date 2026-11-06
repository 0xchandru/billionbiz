import React, { useRef, useState } from 'react';
import { CheckCircle2, ArrowRight, Lock, CreditCard, Banknote, ArrowLeft } from 'lucide-react';
import { useStorefrontCartStore } from '../../../store/storefrontCartStore';
import { apiClient } from '../../../api/client';

interface CheckoutPageViewProps {
  onNavigate?: (path: string) => void;
  brandName?: string;
  storeSlug?: string;
  onlinePaymentsAvailable?: boolean;
}

type PendingOnlineOrder = { orderId: string; orderNumber: string };
type PendingVerification = {
  paymentIntentId: string;
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  environment: 'TEST' | 'LIVE';
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, any>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

async function loadRazorpayCheckout(): Promise<boolean> {
  if (window.Razorpay) return true;
  const source = 'https://checkout.razorpay.com/v1/checkout.js';
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
  if (existing) {
    if (existing.dataset.loaded === 'true') return Boolean(window.Razorpay);
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
    });
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export const CheckoutPageView: React.FC<CheckoutPageViewProps> = ({ onNavigate, brandName = 'Store', storeSlug = '', onlinePaymentsAvailable = false }) => {
  const { items, getSubtotal, clearCart } = useStorefrontCartStore();
  const subtotal = getSubtotal();
  const shipping = 0;
  const total = subtotal + shipping;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [pendingOnlineOrder, setPendingOnlineOrder] = useState<PendingOnlineOrder | null>(null);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const orderRequestKey = useRef<{ storeSlug: string; body: string; key: string } | null>(null);

  const verifyOnlinePayment = async (verification: PendingVerification) => {
    setBusy(true);
    setError('');
    try {
      const result = await apiClient<{ status: string }>('/storefront/by-slug/' + encodeURIComponent(storeSlug) + '/payments/verify', {
        method: 'POST',
        headers: { 'Idempotency-Key': `capture-${verification.paymentIntentId}-${verification.razorpayPaymentId}` },
        body: JSON.stringify(verification)
      });
      if (result.status !== 'CAPTURED') throw new Error('Razorpay has not confirmed this payment yet.');
      setOrderNumber(verification.orderNumber);
      setOrderPlaced(true);
      setPendingOnlineOrder(null);
      setPendingVerification(null);
      clearCart();
    } catch (reason) {
      setPendingVerification(verification);
      setError(reason instanceof Error ? 'Payment was submitted, but the final confirmation is still pending. Retry the status check before paying again.' : 'Payment confirmation is still pending. Retry the status check before paying again.');
    } finally {
      setBusy(false);
    }
  };

  const launchOnlinePayment = async (order: PendingOnlineOrder, customerEmail: string, customerName: string) => {
    setBusy(true);
    setError('');
    try {
      const accountToken = localStorage.getItem(`billionbiz_customer:${storeSlug}`);
      const paymentOrder = await apiClient<{
        paymentIntentId: string;
        razorpayOrderId: string;
        amountMinor: number;
        currency: string;
        keyId: string;
        environment: 'TEST' | 'LIVE';
      }>(`/storefront/by-slug/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(order.orderId)}/payment-intent`, {
        method: 'POST',
        headers: {
          'Idempotency-Key': `online-${order.orderId}`,
          ...(accountToken ? { Authorization: `Bearer ${accountToken}` } : {})
        },
        body: JSON.stringify({ email: customerEmail, orderNumber: order.orderNumber })
      });
      if (!await loadRazorpayCheckout() || !window.Razorpay) throw new Error('The secure payment window could not be loaded. Retry online payment.');

      const checkout = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amountMinor,
        currency: paymentOrder.currency,
        name: brandName,
        description: `Order ${order.orderNumber}`,
        order_id: paymentOrder.razorpayOrderId,
        prefill: { name: customerName, email: customerEmail },
        notes: { order_number: order.orderNumber },
        theme: { color: '#4f46e5' },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError('The payment window was closed. Your order is saved; retry online payment when ready.');
          }
        },
        handler: async (response: any) => {
          const verification: PendingVerification = {
            paymentIntentId: paymentOrder.paymentIntentId,
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            environment: paymentOrder.environment
          };
          setPendingOnlineOrder(order);
          setPendingVerification(verification);
          await verifyOnlinePayment(verification);
        }
      });
      checkout.on('payment.failed', () => {
        setBusy(false);
        setError('Razorpay did not complete the payment. Your order remains unpaid; you can retry online payment.');
      });
      checkout.open();
    } catch (reason) {
      setBusy(false);
      throw reason;
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length || !storeSlug || busy || pendingVerification) return;
    if (paymentMethod === 'online' && !onlinePaymentsAvailable) {
      setError('Online payments are not configured for this store. Choose Cash on Delivery.');
      return;
    }
    setBusy(true);
    setError('');
    let keepBusy = false;
    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
      const accountToken = localStorage.getItem(`billionbiz_customer:${storeSlug}`);
      const orderBody = {
        paymentMethod,
        customerDetails: { email, fullName, firstName, lastName: lastNameParts.join(' ') },
        shippingAddress: { line1: address, city, state: stateName, postalCode, country: 'India' },
        items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))
      };
      const serializedOrderBody = JSON.stringify(orderBody);
      if (orderRequestKey.current?.storeSlug !== storeSlug || orderRequestKey.current?.body !== serializedOrderBody) {
        orderRequestKey.current = {
          storeSlug,
          body: serializedOrderBody,
          key: `storefront-${storeSlug}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        };
      }
      const result = await apiClient<{ orderId: string; orderNumber: string }>('/storefront/by-slug/' + encodeURIComponent(storeSlug) + '/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': orderRequestKey.current.key,
          ...(accountToken ? { Authorization: `Bearer ${accountToken}` } : {})
        },
        body: serializedOrderBody
      });
      setOrderNumber(result.orderNumber);
      if (paymentMethod === 'online') {
        const order = { orderId: result.orderId, orderNumber: result.orderNumber };
        setPendingOnlineOrder(order);
        try {
          await launchOnlinePayment(order, email, fullName.trim());
          keepBusy = true;
        } catch (reason) {
          setError(reason instanceof Error ? `${reason.message} Order ${result.orderNumber} is saved; retry online payment below.` : `Order ${result.orderNumber} is saved; retry online payment below.`);
        }
      } else {
        setOrderPlaced(true);
        clearCart();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not place your order. Please try again.');
    } finally {
      if (!keepBusy) setBusy(false);
    }
  };

  const retryOnlinePayment = async () => {
    if (!pendingOnlineOrder || busy) return;
    try {
      await launchOnlinePayment(pendingOnlineOrder, email, fullName.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Online payment could not be started. Retry in a moment.');
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Order Received</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Thank you, {fullName}. Your order <strong>#{orderNumber}</strong> has been saved at {brandName}.
          </p>
          <p className="text-xs text-slate-400">
            {paymentMethod === 'online' ? 'Your payment has been confirmed. Keep your order number for reference.' : 'Payment is due on delivery. Keep your order number for reference.'}
          </p>
        </div>

        <button
          onClick={() => onNavigate?.('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-bold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
        >
          <span>Return to Homepage</span>
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--theme-border)] pb-4">
        <div className="space-y-1">
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</p>}
          {!items.length && <p role="status" className="rounded-lg bg-slate-100 p-3 text-xs text-slate-600">Your cart is empty. Add a product before checkout.</p>}
          <button
            onClick={() => onNavigate?.('/cart')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition mb-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Return to Cart</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-emerald-500" />
            Secure Express Checkout
          </h1>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Checkout Inputs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Details */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Contact Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="customer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="First and last name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Delivery Address</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Apartment, suite, unit, building, floor"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="560038"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Payment Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                  paymentMethod === 'online'
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'online'}
                  disabled={!onlinePaymentsAvailable || busy || Boolean(pendingVerification)}
                  onChange={() => setPaymentMethod('online')}
                  className="hidden"
                />
                <CreditCard size={20} className="text-indigo-600" />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Online payments</span>
                  <span className="text-xs text-slate-400 block">{onlinePaymentsAvailable ? 'Secure payment with Razorpay' : 'Not configured for this store'}</span>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition ${
                  paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  disabled={busy || Boolean(pendingVerification)}
                  onChange={() => setPaymentMethod('cod')}
                  className="hidden"
                />
                <Banknote size={20} className="text-emerald-600" />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">Cash on Delivery</span>
                  <span className="text-xs text-slate-400 block">Pay cash at time of doorstep delivery</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary Column */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-6 rounded-2xl border border-[var(--theme-border)] h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Order Items ({items.length})</h2>

          <div className="max-h-60 overflow-y-auto divide-y divide-[var(--theme-border)] pr-1">
            {items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-bold text-slate-400">{item.quantity} {item.sellingUnit || 'pcs'}</span>
                  <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs text-slate-500 border-t border-[var(--theme-border)] pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {shipping === 0 ? 'FREE' : `₹${shipping}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline border-t border-[var(--theme-border)] pt-3">
            <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{total.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy || !items.length || !storeSlug}
            className="w-full py-3.5 rounded-xl bg-[var(--theme-btn-primary-bg)] text-[var(--theme-btn-primary-text)] font-bold text-sm shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{busy ? 'Processing…' : paymentMethod === 'online' ? 'Continue to secure payment' : 'Place Cash on Delivery Order'}</span>
            <ArrowRight size={15} />
          </button>
          {pendingOnlineOrder && !pendingVerification && (
            <button type="button" onClick={() => void retryOnlinePayment()} disabled={busy} className="w-full py-2 text-sm font-bold text-indigo-700 disabled:opacity-60">
              Retry online payment for order {pendingOnlineOrder.orderNumber}
            </button>
          )}
          {pendingVerification && (
            <button type="button" onClick={() => void verifyOnlinePayment(pendingVerification)} disabled={busy} className="w-full py-2 text-sm font-bold text-indigo-700 disabled:opacity-60">
              {busy ? 'Checking payment status…' : 'Retry payment confirmation'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

