'use client'
import { PlusIcon, SquarePenIcon, XIcon, CreditCardIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Show, useAuth, useUser } from '@clerk/nextjs';
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';
import { cartBlocksCod } from '@/lib/codAvailability';

const ALL_PAYMENT_METHODS = [
    { id: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
    { id: 'STRIPE', label: 'Card (Stripe)', description: 'Visa, Mastercard, Amex' },
    { id: 'PAYSTACK', label: 'Paystack', description: 'Cards, bank transfer, USSD' },
    { id: 'FLUTTERWAVE', label: 'Flutterwave', description: 'Cards, mobile money, bank' },
]


const OrderSummary = ({ totalPrice, items }) => {
    // Detect if cart has any ABROAD items (for COD block and shipping fee display)
    const allProducts = useSelector(state => state.product.list)
    const hasAbroadItems = items?.some(item => {
        const product = allProducts.find(p => p.id === item.id)
        return product?.origin === 'ABROAD'
    }) ?? false

    const codBlocked = cartBlocksCod(allProducts, items)

    const PAYMENT_METHODS = codBlocked
        ? ALL_PAYMENT_METHODS.filter(m => m.id !== 'COD')
        : ALL_PAYMENT_METHODS

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [shippingFees, setShippingFees] = useState({ local: 7000, abroad: 15000 });

    useEffect(() => {
        if (codBlocked && paymentMethod === 'COD') {
            setPaymentMethod('STRIPE');
        }
    }, [codBlocked, paymentMethod]);
    const { user } = useUser();
    const { getToken } = useAuth();
    const dispatch = useDispatch();
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₦';
    const router = useRouter();

    const addressList = useSelector(state => state.address.list);
    const shippingFee = hasAbroadItems ? shippingFees.abroad : shippingFees.local;

    // Load dynamic shipping fees
    useEffect(() => {
        axios.get('/api/config').then(({ data }) => {
            setShippingFees({
                local: data.shipping_base_fee ?? 7000,
                abroad: data.shipping_abroad_fee ?? 15000,
            });
        }).catch(() => { });
    }, []);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if (!user) { toast.error('You need to be signed in to apply a coupon'); return; }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupon(data.coupon);
            toast.success('Coupon applied successfully');
        } catch (error) {
            toast.error(error.response?.data?.error || error.message)
        }
    }

    const redirectToPayment = async (orderIds, token) => {
        const endpointMap = {
            STRIPE: { url: '/api/stripe', key: 'session', urlKey: 'url' },
            PAYSTACK: { url: '/api/paystack', key: 'authorization_url', urlKey: null },
            FLUTTERWAVE: { url: '/api/flutterwave', key: 'payment_link', urlKey: null },
        };
        const ep = endpointMap[paymentMethod];
        const { data } = await axios.post(ep.url, { orderIds }, { headers: { Authorization: `Bearer ${token}` } });
        const redirectUrl = ep.urlKey ? data[ep.key]?.[ep.urlKey] : data[ep.key];
        if (!redirectUrl) throw new Error('Payment session URL not received');
        window.location.href = redirectUrl;
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            if (!user) { toast.error('You need to be signed in to place an order'); return; }
            if (!selectedAddress) { toast.error('Please select a delivery address'); return; }

            const token = await getToken();
            const orderData = {
                addressId: selectedAddress.id,
                paymentMethod,
                items,
                notes: orderNotes || null,
            };
            if (coupon) orderData.couponCode = coupon.code;

            const { data } = await axios.post('/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (paymentMethod === 'COD') {
                toast.success(data.message);
                router.push('/orders');
                dispatch(fetchCart({ getToken }));
            } else {
                await redirectToPayment(data.orderIds, token);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    }

    const couponDiscount = coupon ? (coupon.discount / 100 * totalPrice) : 0;

    return (
        <div className='w-full max-w-lg lg:max-w-[360px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-6'>
            <h2 className='text-xl font-medium text-slate-700 mb-5'>Order Summary</h2>

            {/* Payment Method */}
            <p className='text-slate-400 text-xs uppercase tracking-wider mb-3'>Payment Method</p>
            <div className='space-y-2 mb-5'>
                {PAYMENT_METHODS.map(method => (
                    <label key={method.id}
                        className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition ${paymentMethod === method.id ? 'border-slate-700 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="radio" name="payment" value={method.id}
                            checked={paymentMethod === method.id}
                            onChange={() => setPaymentMethod(method.id)}
                            className='accent-slate-700' />
                        <div>
                            <p className={`font-medium text-xs ${paymentMethod === method.id ? 'text-slate-800' : 'text-slate-600'}`}>{method.label}</p>
                            <p className='text-slate-400 text-xs'>{method.description}</p>
                        </div>
                    </label>
                ))}
            </div>

            {/* Address */}
            <div className='py-4 border-y border-slate-200 mb-4'>
                <p className='text-slate-400 text-xs uppercase tracking-wider mb-2'>Delivery Address</p>
                {selectedAddress ? (
                    <div className='flex gap-2 items-start'>
                        <div className='flex-1'>
                            <p className='text-slate-700 font-medium text-xs'>{selectedAddress.name}</p>
                            <p className='text-xs text-slate-400'>{selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}</p>
                        </div>
                        <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer shrink-0 text-slate-400 hover:text-slate-600 transition' size={15} />
                    </div>
                ) : (
                    <div>
                        {addressList.length > 0 && (
                            <select className='border border-slate-200 p-2 w-full my-2 outline-none rounded-lg text-sm' onChange={(e) => setSelectedAddress(addressList[e.target.value])}>
                                <option value="">Select address...</option>
                                {addressList.map((address, index) => (
                                    <option key={index} value={index}>{address.name}, {address.city}, {address.state}</option>
                                ))}
                            </select>
                        )}
                        <button className='flex items-center gap-1 text-slate-500 hover:text-slate-700 text-xs transition' onClick={() => setShowAddressModal(true)}>
                            <PlusIcon size={14} /> Add new address
                        </button>
                    </div>
                )}
            </div>

            {/* Price breakdown */}
            <div className='space-y-2 pb-4 border-b border-slate-200 mb-4'>
                <div className='flex justify-between text-slate-500'>
                    <span>Subtotal</span>
                    <span>{currency}{totalPrice.toLocaleString()}</span>
                </div>
                <div className='flex justify-between text-slate-500'>
                    <span>Shipping{hasAbroadItems ? ' ✈️' : ''}</span>
                    <span>
                        <Show when={{ plan: 'plus' }} fallback={`${currency}${shippingFee.toLocaleString()}`}>
                            <span className='text-green-600 font-medium'>Free (Plus)</span>
                        </Show>
                    </span>
                </div>
                {hasAbroadItems && (
                    <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                        ✈️ Your cart includes items <span className="font-semibold">Shipped from Abroad</span>. Higher shipping rate applies. Delivery in <span className="font-semibold">20–25 days</span>. COD not available.
                    </div>
                )}
                {!hasAbroadItems && codBlocked && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        At least one local product in your cart does not accept Cash on Delivery. Please pay online or adjust your cart.
                    </div>
                )}
                {!hasAbroadItems && !codBlocked && (
                    <p className="text-xs text-slate-400">🏠 Local shipping · Delivery in 7–10 days</p>
                )}
                {coupon && (
                    <div className='flex justify-between text-green-600'>
                        <span>Coupon ({coupon.code})</span>
                        <span>-{currency}{couponDiscount.toFixed(2)}</span>
                    </div>
                )}

                {/* Coupon input */}
                {!coupon ? (
                    <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking...' })} className='flex gap-2 mt-3'>
                        <input onChange={e => setCouponCodeInput(e.target.value)} value={couponCodeInput}
                            type="text" placeholder='Coupon code'
                            className='border border-slate-200 p-2 rounded-lg w-full outline-none text-xs' />
                        <button className='bg-slate-700 text-white px-3 rounded-lg hover:bg-slate-800 active:scale-95 transition text-xs whitespace-nowrap'>Apply</button>
                    </form>
                ) : (
                    <div className='flex items-center justify-between text-xs bg-green-50 border border-green-100 rounded-lg px-3 py-2'>
                        <span className='text-green-700'>{coupon.description}</span>
                        <XIcon size={14} onClick={() => setCoupon('')} className='text-green-500 hover:text-red-500 cursor-pointer transition' />
                    </div>
                )}
            </div>

            {/* Total */}
            <div className='flex justify-between font-semibold text-slate-800 text-base mb-4'>
                <span>Total</span>
                <span>
                    <Show when={{ plan: 'plus' }}
                        fallback={`${currency}${(totalPrice + shippingFee - couponDiscount).toFixed(2)}`}>
                        {`${currency}${(totalPrice - couponDiscount).toFixed(2)}`}
                    </Show>
                </span>
            </div>

            {/* Order notes */}
            <div className='mb-4'>
                <p className='text-slate-400 text-xs mb-1'>Notes <span className='text-slate-300'>(optional)</span></p>
                <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    placeholder='Special delivery instructions...'
                    rows={2} maxLength={500}
                    className='border border-slate-200 rounded-lg w-full p-2 text-xs outline-none resize-none text-slate-600 placeholder-slate-300' />
            </div>

            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'Placing order...' })}
                className='w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-900 active:scale-95 transition font-medium'>
                <CreditCardIcon size={16} />
                {paymentMethod === 'COD' ? 'Place Order' : 'Pay Now'}
            </button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}
        </div>
    )
}

export default OrderSummary
