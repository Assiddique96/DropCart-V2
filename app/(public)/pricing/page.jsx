import { PricingTable } from "@clerk/nextjs"

export const metadata = {
    title: "Pricing — DropCart",
    description: "Choose the plan that works for you. Plus members get free shipping and exclusive coupons.",
}

export default function PricingPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-slate-800">Simple, Transparent <span className="text-green-500">Pricing</span></h1>
                    <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
                        Free for buyers. Plus members enjoy free shipping on every order and access to exclusive member-only coupons.
                    </p>
                </div>

                {/* Clerk managed pricing table */}
                <PricingTable />

                {/* Feature comparison */}
                <div className="mt-16 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Feature</th>
                                <th className="px-6 py-4 text-center">Free</th>
                                <th className="px-6 py-4 text-center text-green-700">Plus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {[
                                ["Browse & shop all products", true, true],
                                ["Order tracking", true, true],
                                ["Product reviews", true, true],
                                ["Wishlist", true, true],
                                ["Standard shipping fee", "Charged", "Free"],
                                ["Member-only coupons", false, true],
                                ["Priority support", false, true],
                            ].map(([feature, free, plus], i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 font-medium">{feature}</td>
                                    <td className="px-6 py-3 text-center">
                                        {free === true ? <span className="text-green-500">✓</span>
                                            : free === false ? <span className="text-slate-300">—</span>
                                                : <span className="text-slate-500 text-xs">{free}</span>}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {plus === true ? <span className="text-green-500 font-bold">✓</span>
                                            : plus === false ? <span className="text-slate-300">—</span>
                                                : <span className="text-green-600 font-semibold text-xs">{plus}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
