'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useUIStore } from '@/store';
import { formatCurrency } from '@/lib/currency';
import BackNavigation from '@/components/BackNavigation';

export default function CartPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const { items, totalCredits, removeFromCart, clearCart } = useCartStore();
    const { walletBalance, setWalletBalance, addTransaction, addActivity, openSignupModal, currency } = useUIStore();
    const isAuthed = !!user || !!token;
    const campaignItems = items.filter((item) => item.type === 'campaign');
    const nonCampaignItems = items.filter((item) => item.type !== 'campaign');

    const handleCheckoutStore = () => {
        if (nonCampaignItems.length === 0) return;
        if (!isAuthed) {
            openSignupModal(() => router.push('/cart'));
            return;
        }
        if (!walletBalance || walletBalance < nonCampaignItems.reduce((sum, i) => sum + i.subtotal, 0)) {
            alert('Insufficient Asset Credits for store checkout. Please top up your wallet.');
            return;
        }

        const storeTotal = nonCampaignItems.reduce((sum, i) => sum + i.subtotal, 0);
        const updatedBalance = walletBalance - storeTotal;
        setWalletBalance(updatedBalance);
        addTransaction({ type: 'debit', description: 'Checkout store items', credits: storeTotal });
        nonCampaignItems.forEach((item) => {
            addActivity({
                campaignId: item.item_id,
                campaignName: item.title,
                creditsUsed: item.subtotal,
                status: 'Active Campaign',
                ticketCount: undefined,
            });
        });
        clearCart();
        router.push('/store');
        alert('Store checkout complete.');
    };

    const handleCheckoutCampaign = () => {
        if (campaignItems.length === 0) return;
        if (!isAuthed) {
            openSignupModal(() => router.push('/cart'));
            return;
        }
        const first = campaignItems[0];
        router.push(`/campaigns/${first.item_id}?qty=${first.quantity || 1}`);
    };

    return (
        <div className="page-enter mx-auto max-w-7xl px-6 py-10">
            <BackNavigation />
            <h1 className="text-3xl font-black">Cart</h1>
            <p className="text-slate-600 mt-1">Review selected items and complete Asset Credits checkout.</p>

            {items.length === 0 ? (
                <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                    Your cart is empty. Explore the <button onClick={() => router.push('/store')} className="text-primary-700 underline">Asset Store</button>.
                </div>
            ) : (
                <div className="mt-8 space-y-4">
                    {campaignItems.length > 0 && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Campaign purchases must be completed by buying credits. Stored credits are only for Asset Store.
                            <div className="mt-3 flex flex-wrap gap-2">
                                {campaignItems.map((item) => (
                                    <button
                                        key={item.item_id}
                                        type="button"
                                        onClick={() => router.push(`/campaigns/${item.item_id}?qty=${item.quantity || 1}`)}
                                        className="rounded-xl bg-primary-700 text-white px-4 py-2 text-xs font-bold"
                                    >
                                        Continue with {item.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {items.map((item) => (
                        <div key={item.item_id} className="flex flex-wrap items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                            <div>
                                <h2 className="text-lg font-semibold">{item.title}</h2>
                                <p className="text-sm text-slate-500">{item.description}</p>
                                <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">{formatCurrency(item.subtotal, currency)} credits</p>
                                <button onClick={() => removeFromCart(item.item_id)} className="text-red-600 text-sm mt-1 hover:underline">Remove</button>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xl font-black">Total Credit Cost: {formatCurrency(totalCredits, currency)}</p>
                        <div className="flex flex-wrap gap-2">
                            {nonCampaignItems.length > 0 && (
                                <button onClick={handleCheckoutStore} className="btn-primary px-6 py-2">Checkout Store Items</button>
                            )}
                            {campaignItems.length > 0 && (
                                <button onClick={handleCheckoutCampaign} className="rounded-lg border border-primary-700 text-primary-700 px-6 py-2 font-bold">Buy Campaign Credits</button>
                            )}
                            <button onClick={() => clearCart()} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Clear Cart</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
