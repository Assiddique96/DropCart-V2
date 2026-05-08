"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { MailIcon, MapPinIcon, PhoneIcon, SendIcon } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate send — replace with your email API (Resend, etc.)
    await new Promise((r) => setTimeout(r, 900));
    setSubmitted(true);
    setSubmitting(false);
    toast.success("Message sent! We'll get back to you soon.");
  };

  return (
    <div className="min-h-[70vh] mx-4 mb-24 sm:mx-6">
      <div className="mx-auto my-16 max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
            About & <span className="text-green-500">Contact</span>
          </h1>
          <p className="mt-3 mx-auto max-w-xl text-sm text-slate-500 dark:text-slate-300">
            Shpinx is a multi-vendor marketplace helping verified businesses
            reach businesses across Nigeria with secure checkout and fast
            delivery.
          </p>
          <p className="mt-3 mx-auto max-w-md text-sm text-slate-500 dark:text-slate-300">
            Do you have any question, partnership inquiry, or need support? We'd
            love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Info */}
          <div>
            <h2 className="mb-6 text-lg font-medium text-slate-700 dark:text-slate-100">
              Contact Information
            </h2>
            <div className="space-y-5 text-sm text-slate-500 dark:text-slate-300">
              {[
                {
                  icon: MailIcon,
                  label: "Email",
                  value: "support@shpinx.ng",
                },
                {
                  icon: PhoneIcon,
                  label: "Phone",
                  value: "+234 800 000 0000",
                },
                {
                  icon: MapPinIcon,
                  label: "Address",
                  value: "Abuja, Nigeria",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-full bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs text-slate-400 dark:text-slate-400">
                      {label}
                    </p>
                    <p className="font-medium text-slate-700 dark:text-slate-100">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <p className="mb-1 font-medium text-slate-700 dark:text-slate-100">
                Support hours
              </p>
              <p>Monday – Friday: 9am – 6pm WAT</p>
              <p>Saturday: 10am – 2pm WAT</p>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-400">
                We typically respond within 24 hours.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <p className="mb-2 font-medium text-slate-700 dark:text-slate-100">
                What we do
              </p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Connect buyers with verified independent sellers.</li>
                <li>Provide secure payments and marketplace-level support.</li>
                <li>
                  Help sellers grow with analytics, order management, and
                  payouts.
                </li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div>
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
                  <SendIcon size={28} className="text-green-500" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Message Sent!
                </h3>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-300">
                  Thanks for reaching out. We'll get back to you within 24
                  hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      name: "",
                      email: "",
                      subject: "",
                      message: "",
                    });
                  }}
                  className="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  type="button"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) =>
                      setForm({ ...form, subject: e.target.value })
                    }
                    placeholder="How can we help?"
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    placeholder="Tell us more about your inquiry..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <SendIcon size={15} />{" "}
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
