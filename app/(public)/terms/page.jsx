export const metadata = {
    title: "Terms of Use — DropCart",
    description: "Terms of Use for DropCart customers and store owners.",
}

export default function TermsPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <h1 className="text-3xl font-semibold text-slate-800">Terms of <span className="text-green-500">Use</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    These Terms govern your use of DropCart. By using the site, you agree to these Terms. If you do not agree, do not use the service.
                </p>

                <div className="mt-10 space-y-6 text-sm text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">1. Accounts</h2>
                        <p>You are responsible for maintaining the confidentiality of your account and for all activities under your account.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">2. Orders and Payments</h2>
                        <p>Prices, availability, and payment methods may change. Orders may be cancelled in cases such as suspected fraud or inventory issues.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">3. Store Owners</h2>
                        <p>Store owners are responsible for product listings, pricing accuracy, fulfillment, and compliance with applicable laws and marketplace rules.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">4. Prohibited Use</h2>
                        <p>Do not misuse the service, interfere with operations, attempt unauthorized access, or violate laws.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">5. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by law, DropCart will not be liable for indirect or consequential damages arising from your use of the service.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">6. Changes</h2>
                        <p>We may update these Terms from time to time. Continued use of the service after changes means you accept the updated Terms.</p>
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

