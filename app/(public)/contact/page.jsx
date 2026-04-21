'use client'
import { useState } from "react"
import toast from "react-hot-toast"
import { MailIcon, MapPinIcon, PhoneIcon, SendIcon } from "lucide-react"

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        // Simulate send — replace with your email API (Resend, etc.)
        await new Promise(r => setTimeout(r, 900))
        setSubmitted(true)
        setSubmitting(false)
        toast.success("Message sent! We'll get back to you soon.")
    }

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6 mb-24">
            <div className="max-w-5xl mx-auto my-16">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">About & <span className="text-green-500">Contact</span></h1>
                    <p className="text-slate-500 dark:text-slate-300 mt-3 max-w-xl mx-auto text-sm">
                        Shpinx is a multi-vendor marketplace helping verified sellers reach customers across Nigeria with secure checkout and fast delivery.
                    </p>
                    <p className="text-slate-500 dark:text-slate-300 mt-3 max-w-md mx-auto text-sm">
                        Have a question, partnership inquiry, or need support? We'd love to hear from you.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    {/* Info */}
                    <div>
                        <h2 className="text-lg font-medium text-slate-700 dark:text-slate-100 mb-6">Contact Information</h2>
                        <div className="space-y-5 text-slate-500 dark:text-slate-300 text-sm">
                            {[
                                { icon: MailIcon, label: "Email", value: "support@dropcart.ng" },
                                { icon: PhoneIcon, label: "Phone", value: "+234 800 000 0000" },
                                { icon: MapPinIcon, label: "Address", value: "Abuja, Nigeria" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-4">
                                    <div className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 mt-0.5">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 dark:text-slate-400 mb-0.5">{label}</p>
                                        <p className="text-slate-700 dark:text-slate-100 font-medium">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-300">
                            <p className="font-medium text-slate-700 dark:text-slate-100 mb-1">Support hours</p>
                            <p>Monday – Friday: 9am – 6pm WAT</p>
                            <p>Saturday: 10am – 2pm WAT</p>
                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-400">We typically respond within 24 hours.</p>
                        </div>

                        <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-300">
                            <p className="font-medium text-slate-700 dark:text-slate-100 mb-2">What we do</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Connect buyers with verified independent sellers.</li>
                                <li>Provide secure payments and marketplace-level support.</li>
                                <li>Help sellers grow with analytics, order management, and payouts.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Form */}
                    <div>
                        {submitted ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-16">
                                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                                    <SendIcon size={28} className="text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Message Sent!</h3>
                                <p className="text-slate-500 dark:text-slate-300 text-sm mb-6">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                                    className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition">
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Your Name *</label>
                                        <input type="text" required value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="John Doe"
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">Email Address *</label>
                                        <input type="email" required value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="john@example.com"
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Subject *</label>
                                    <input type="text" required value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        placeholder="How can we help?"
                                        className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-slate-400 transition" />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Message *</label>
                                    <textarea required value={form.message} rows={5}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us more about your inquiry..."
                                        className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none resize-none focus:border-slate-400 transition" />
                                </div>
                                <button type="submit" disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-lg text-sm hover:bg-slate-900 transition disabled:opacity-50">
                                    <SendIcon size={15} /> {submitting ? "Sending..." : "Send Message"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
