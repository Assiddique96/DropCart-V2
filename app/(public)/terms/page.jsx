export const metadata = {
    title: "Terms of Use — DropCart",
    description: "Terms of Use for DropCart customers and store owners.",
}

export default function TermsPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <h1 className="text-3xl font-semibold text-slate-800">General Terms of <span className="text-green-500">Use</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    These Terms govern your use of Shpinx. By using the site, you agree to these Terms. If you do not agree, do not use the service.
                    By using Shpinx, you agree to these terms governed by Nigerian law, including NDPA 2023. Platform for e-commerce shopping; age 18+.
                </p>

                <div className="mt-10 space-y-6 text-sm text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">1. User Obligations</h2>
                        <p>Provide accurate data; no misuse, spam, or illegal activity. Comply with permissions for camera/location.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">2. Accounts</h2>
                        <p>You are responsible for maintaining the confidentiality of your account and for all activities under your account.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">3. Orders and Payments</h2>
                        <p>Prices, availability, and payment methods may change. Orders may be cancelled in cases such as suspected fraud or inventory issues.
                        We facilitate purchases; not liable for seller issues. Payments secure; refunds per policy. Termination possible for violations.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">4. Prohibited Use</h2>
                        <p>Do not misuse the service, interfere with operations, attempt unauthorized access, or violate laws.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">5. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by law, Shpinx will not be liable for indirect or consequential damages arising from your use of the service.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">6. Changes</h2>
                        <p>We may update these Terms from time to time. Continued use of the service after changes means you accept the updated Terms.</p>
                    </section>

                <h1 className="text-3xl font-semibold text-slate-800">Seller's Terms of <span className="text-green-500">Use</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    Store owners must verify business via CAC/NIN/facial scan, agreeing to enhanced responsibilities under Nigerian cyber laws. Separate from general terms. 
                    Platform for e-commerce shopping; age 18+.
                </p>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">1. Store Owners</h2>
                        <p>Store owners are responsible for product listings, pricing accuracy, fulfillment, and compliance with applicable laws and marketplace rules.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">2. Onboarding Requirements</h2>
                        <p>Submit verifiable KYC data; maintain accurate listings. Liable for product compliance, taxes.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">3. Platform Rules</h2>
                        <p>No prohibited items; honor orders. Fees apply; payouts post-verification. IP rights retained by you; we license for display.</p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-slate-800 font-semibold mb-1">Contact</h2>
                        <p>If you have questions about these Terms, please contact us via the Contact page.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}

