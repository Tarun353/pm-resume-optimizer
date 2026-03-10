'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PLANS = [
  {
    key: '1day',
    name: '1 Day Pass',
    price: 19,
    duration: '24 hours',
    popular: false,
    features: ['Unlimited downloads', 'All features included', '24 hour access'],
  },
  {
    key: '10days',
    name: '10 Days Pass',
    price: 49,
    duration: '10 days',
    popular: true,
    features: ['Unlimited downloads', 'All features included', '10 days access', 'Best value!'],
  },
  {
    key: '1month',
    name: '1 Month Pass',
    price: 139,
    duration: '30 days',
    popular: false,
    features: ['Unlimited downloads', 'All features included', '30 days access', 'Maximum flexibility'],
  },
];

function CloseIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { user, dbUser, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('10days');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user || !dbUser) return;

    setLoading(true);
    setError('');

    try {
      const plan = PLANS.find(p => p.key === selectedPlan);
      if (!plan) throw new Error('Invalid plan');

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser?.id) {
        throw new Error('Unauthorized');
      }

      const { data: { session } } = await supabase.auth.getSession();
      // Create order on backend
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          userId: authUser.id,
          plan: selectedPlan,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create order');
      }

      const { orderId, amount, currency } = await res.json();

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: 'ResumeForge',
          description: `${plan.name} - Unlimited Downloads`,
          order_id: orderId,
          prefill: {
            email: user.email,
          },
          theme: {
            color: '#2563eb',
          },
          handler: async (response: any) => {
            try {
              // Verify payment on backend
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planType: plan.key,
                }),
              });

              if (!verifyRes.ok) {
                throw new Error('Payment verification failed');
              }

              // Refresh user data
              await refreshUser();

              // Success!
              onSuccess();
              onClose();
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
            }
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setLoading(false);
      };

      script.onerror = () => {
        setError('Failed to load payment gateway');
        setLoading(false);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-xl">Unlock Unlimited Downloads</h2>
            <p className="text-sm text-slate-500 mt-1">
              You've used your 5 free downloads. Choose a plan to continue!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLANS.map((plan) => (
              <button
                key={plan.key}
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === plan.key
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-4">
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500">{plan.duration}</p>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-slate-900">₹{plan.price}</span>
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-green-500 text-xs">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {selectedPlan === plan.key && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-1">
                  Secure Payment via Razorpay
                </p>
                <p className="text-xs text-slate-600">
                  Supports UPI, Cards, Net Banking, and Wallets. Your payment information is encrypted and secure.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg flex items-center justify-center gap-2">
            {loading ? (
              <>
                <SpinnerIcon />
                Processing...
              </>
            ) : (
              <>
                💳 Proceed to Payment - ₹{PLANS.find(p => p.key === selectedPlan)?.price}
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
