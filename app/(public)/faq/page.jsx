import { getSiteContent } from "@/lib/siteContent"

export const metadata = {
    title: "FAQs — Shpinx",
    description: "Frequently asked questions about shopping, orders, payments, returns, and store accounts on Sphinx.",
}

const DEFAULT_FAQS = [
    {
        question: "What is Shpinx?",
        answer: "Shpinx is Nigeria’s multi-vendor marketplace that connects small and medium-sized businesses with customers who want quality gadgets and products at trusted prices.",
    },
    {
        question: "Who can shop on Shpinx?",
        answer: "Individuals and businesses anywhere in Nigeria can place orders from the comfort of their home or office and have items delivered nationwide.",
    },
    {
        question: "How do I get started?",
        answer: "Simply create an account (or log in), browse products, add items to your cart, and complete checkout using your preferred payment method.",
    },
    {
        question: "What types of products are available?",
        answer: "Shpinx offers a wide range of gadgets and other products curated for small and medium businesses, with new listings added regularly.",
    },
    {
        question: "How much does shipping cost?",
        answer: "Shpinx currently offers free shipping on all orders nationwide, with no minimum spend required.",
    },
     {
        question: "How long does delivery take?",
        answer: "Delivery times vary by location and logistics partners, but most orders within major cities are delivered within 2–5 business days. You’ll receive tracking updates after checkout.",
    },
    {
        question: "What is the return policy?",
        answer: "Shpinx offers a 7-day easy-return policy. If you’re not satisfied, you can return most eligible items within 7 days of delivery.",
    },
    {
        question: "Are there any conditions for returns?",
        answer: "Items must be unused, in original packaging, and accompanied by the receipt or order confirmation. Refunds are processed once the returned item is inspected and accepted.",
    },
    {
        question: "Which payment methods are accepted?",
        answer: "You can pay securely using major Nigerian payment gateways (card, bank transfer, USSD, and other supported options). The exact list depends on your selected vendor and current integrations.",
    },
    {
        question: "Is my payment information safe?",
        answer: "All payment pages use industry-standard encryption and are processed via certified payment partners to protect your card and personal data.",
    },
    {
        question: "Is there 24/7 customer support?",
        answer: "Shpinx offers 24/7 customer support via in-app chat, email, or phone so you can get help with orders, payments, and general questions.",
    },
    {
        question: "What do I need to register as a vendor?",
        answer: "You need a valid email and phone number, your business or personal details, a pickup/warehouse address, and a bank account for payouts. In some cases, we may request CAC registration or a valid ID for verification.",
    },
]

const renderFaqItems = (items) => (
    items.map((item) => (
        <details key={item.question} className="group rounded-xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer list-none select-none flex items-start justify-between gap-4">
                <span className="font-medium text-slate-800">{item.question}</span>
                <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.answer}</p>
        </details>
    ))
)

export default async function FaqPage() {
    const { faqItems } = await getSiteContent()
    const items = faqItems.length > 0 ? faqItems : DEFAULT_FAQS

    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-slate-800">Frequently Asked <span className="text-green-500">Questions</span></h1>
                    <p className="text-slate-500 mt-3 text-sm max-w-xl mx-auto">
                        Quick answers to common questions about Shpinx. If you can’t find what you need, please reach out via our Contact page.
                    </p>
                </div>

                <div className="space-y-4">
                    {renderFaqItems(items)}
                </div>
            </div>
        </div>
    )
}

