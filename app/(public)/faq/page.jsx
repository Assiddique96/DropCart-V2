export const metadata = {
    title: "FAQs — DropCart",
    description: "Frequently asked questions about shopping, orders, payments, returns, and store accounts on DropCart.",
}

const FAQS = [
    {
        q: "What is DropCart?",
        a: "DropCart is an online marketplace where you can browse products from multiple stores, place orders, and track delivery in one place.",
    },
    {
        q: "How do I place an order?",
        a: "Add items to your cart, proceed to checkout, provide your delivery details, and complete payment. You can track your order from the Orders page.",
    },
    {
        q: "What payment methods are supported?",
        a: "Payment options can vary by checkout configuration, but typically include card and bank transfer via supported payment providers.",
    },
    {
        q: "Can I return an item?",
        a: "Return eligibility depends on the item and the store’s return policy. If a return is available, you can request it from your Orders page.",
    },
    {
        q: "How do I become a store owner?",
        a: "Visit the Create Store page and complete the application. Once approved, you’ll be able to manage products and orders from your Store dashboard.",
    },
]

export default function FaqPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-slate-800">Frequently Asked <span className="text-green-500">Questions</span></h1>
                    <p className="text-slate-500 mt-3 text-sm max-w-xl mx-auto">
                        Quick answers to common questions about DropCart. If you can’t find what you need, please reach out via our Contact page.
                    </p>
                </div>

                <div className="space-y-4">
                    {FAQS.map((item) => (
                        <details key={item.q} className="group rounded-xl border border-slate-200 bg-white p-5">
                            <summary className="cursor-pointer list-none select-none flex items-start justify-between gap-4">
                                <span className="font-medium text-slate-800">{item.q}</span>
                                <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
                            </summary>
                            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    )
}

