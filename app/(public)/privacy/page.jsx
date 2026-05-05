import { getSiteContent } from "@/lib/siteContent"

export const metadata = {
    title: "Privacy Policy — DropCart",
    description: "Privacy Policy explaining how DropCart collects, uses, and protects your personal information.",
}

const DEFAULT_PRIVACY_CONTENT = (
    <>
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
            <h2 className="text-slate-800 font-semibold mb-2">Security and Breaches</h2>
            <p>Technical measures (encryption, access controls) protect data per NDPA section 39. Breaches reported to Nigeria Data Protection Commission (NDPC) within 72 hours.</p>
        </section>

        <section>
            <h2 className="text-slate-800 font-semibold mb-2">Data retention</h2>
            <p>We keep information as long as necessary for the purposes described above, and as required by law.</p>
        </section>

        <section>
            <h2 className="text-slate-800 font-semibold mb-2">Your rights</h2>
            <p>You can access and update certain account details in your profile. You may also contact us with privacy-related requests.</p>
        </section>

        <section>
            <h2 className="text-slate-800 font-semibold mb-2">Additional Data</h2>
            <p>Includes business name, CAC registration, NIN/passport details, facial verification, address. Camera/microphone/location used for verification only.</p>
        </section>

        <section>
            <h2 className="text-slate-800 font-semibold mb-2">Processing Basis</h2>
            <p>Necessary for legitimate interests like fraud prevention and regulatory compliance (NDPA section 25). Consent obtained for sensitive processing.</p>
        </section>

        <section>
            <h2 className="text-slate-800 font-semibold mb-2">Enhanced Protections</h2>
            <p>Data Protection Officer oversees compliance; impact assessments conducted for high-risk processing.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-slate-800 font-semibold mb-1">Questions</h2>
            <p>If you have questions about this Privacy Policy, please contact us via the Contact page.</p>
        </section>
    </>
)

export default async function PrivacyPolicyPage() {
    const { privacyPolicy } = await getSiteContent()
    const policyContent = privacyPolicy ? (
        <div className="whitespace-pre-line text-sm text-slate-600 leading-relaxed">{privacyPolicy}</div>
    ) : (
        <div className="mt-10 space-y-6 text-sm text-slate-600 leading-relaxed">{DEFAULT_PRIVACY_CONTENT}</div>
    )

    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <h1 className="text-3xl font-semibold text-slate-800">Privacy <span className="text-green-500">Policy</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    This Privacy Policy explains how DropCart collects, uses, and protects your personal information.
                </p>

                {policyContent}
            </div>
        </div>
    )
}

