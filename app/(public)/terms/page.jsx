export const metadata = {
  title: "Terms of Use — Shpinx",
  description: "Terms of Use for Shpinx customers and store owners.",
};

export default function TermsPage() {
  return (
    <div className="min-h-[70vh] mx-6 mb-24">
      <div className="mx-auto my-16 max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
          General Terms of <span className="text-green-500">Use</span>
        </h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
          These Terms govern your use of Shpinx. By using the site, you agree to
          these Terms. If you do not agree, do not use the service. By using
          Shpinx, you agree to these terms governed by Nigerian law, including
          NDPA 2023. Platform for e-commerce shopping; age 18+.
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              1. User Obligations
            </h2>
            <p>
              Provide accurate data; no misuse, spam, or illegal activity.
              Comply with permissions for camera/location.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              2. Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              3. Orders and Payments
            </h2>
            <p>
              Prices, availability, and payment methods may change. Orders may
              be cancelled in cases such as suspected fraud or inventory issues.
              We facilitate purchases; not liable for seller issues. Payments
              secure; refunds per policy. Termination possible for violations.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              4. Prohibited Use
            </h2>
            <p>
              Do not misuse the service, interfere with operations, attempt
              unauthorized access, or violate laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              5. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Shpinx will not be liable
              for indirect or consequential damages arising from your use of the
              service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              6. Changes
            </h2>
            <p>
              We may update these Terms from time to time. Continued use of the
              service after changes means you accept the updated Terms.
            </p>
          </section>

          <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
            Seller&apos;s Terms of <span className="text-green-500">Use</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
            Store owners must verify business via CAC/NIN/facial scan, agreeing
            to enhanced responsibilities under Nigerian cyber laws. Separate
            from general terms. Platform for e-commerce shopping; age 18+.
          </p>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              1. Store Owners
            </h2>
            <p>
              Store owners are responsible for product listings, pricing
              accuracy, fulfillment, and compliance with applicable laws and
              marketplace rules.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              2. Onboarding Requirements
            </h2>
            <p>
              Submit verifiable KYC data; maintain accurate listings. Liable for
              product compliance, taxes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              3. Platform Rules
            </h2>
            <p>
              No prohibited items; honor orders. Fees apply; payouts
              post-verification. IP rights retained by you; we license for
              display.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-1 font-semibold text-slate-800 dark:text-white">
              Contact
            </h2>
            <p>
              If you have questions about these Terms, please contact us via the
              Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
