export const metadata = {
    title: "Privacy Policy — DropCart",
    description: "Privacy Policy explaining how DropCart collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <h1 className="text-3xl font-semibold text-slate-800">Privacy <span className="text-green-500">Policy</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    This Policy explains what information we collect and how we use it. It applies to visitors, customers, and store owners using DropCart.
                </p>

                <div className="mt-10 space-y-6 text-sm text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">Information we collect</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Account information (e.g., name, email, profile image).</li>
                            <li>Order and delivery details (e.g., items purchased, shipping address).</li>
                            <li>Payment-related metadata from payment providers (we do not store full card details).</li>
                            <li>Usage data (e.g., pages visited, device/browser data) for analytics and security.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">How we use information</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>To provide and improve the service (checkout, order tracking, support).</li>
                            <li>To prevent fraud, abuse, and security incidents.</li>
                            <li>To communicate important updates about orders or your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">Sharing</h2>
                        <p>We may share information with service providers (e.g., payments, analytics) and stores for order fulfillment, only as needed to provide the service.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">Data retention</h2>
                        <p>We keep information as long as necessary for the purposes described above, and as required by law.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">Your choices</h2>
                        <p>You can access and update certain account details in your profile. You may also contact us with privacy-related requests.</p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-slate-800 font-semibold mb-1">Questions</h2>
                        <p>If you have questions about this Privacy Policy, please contact us via the Contact page.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}

