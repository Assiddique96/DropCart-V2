export const metadata = {
    title: "Cookies Policy — DropCart",
    description: "Cookies Policy describing how DropCart uses cookies and similar technologies.",
}

export default function CookiesPolicyPage() {
    return (
        <div className="min-h-[70vh] mx-6 mb-24">
            <div className="max-w-4xl mx-auto my-16">
                <h1 className="text-3xl font-semibold text-slate-800">Cookies <span className="text-green-500">Policy</span></h1>
                <p className="text-slate-500 mt-3 text-sm">
                    This Policy explains how we use cookies and similar technologies to operate DropCart and improve your experience.
                </p>

                <div className="mt-10 space-y-6 text-sm text-slate-600 leading-relaxed">
                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">What are cookies?</h2>
                        <p>Cookies are small text files stored on your device. They help websites remember preferences and enable core features like sign-in.</p>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">How we use cookies</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><span className="font-medium text-slate-700">Essential</span>: required for authentication, security, and core site functionality.</li>
                            <li><span className="font-medium text-slate-700">Preferences</span>: remember settings like UI choices.</li>
                            <li><span className="font-medium text-slate-700">Analytics</span>: understand usage to improve performance and features.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-slate-800 font-semibold mb-2">Managing cookies</h2>
                        <p>You can control cookies through your browser settings. Disabling certain cookies may impact site functionality (e.g., staying signed in).</p>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                        <h2 className="text-slate-800 font-semibold mb-1">More information</h2>
                        <p>For details on how we handle personal information, see our Privacy Policy.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}

