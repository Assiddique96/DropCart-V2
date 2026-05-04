export const metadata = {
  title: "Cookies Policy — DropCart",
  description:
    "Cookies Policy describing how DropCart uses cookies and similar technologies.",
};

export default function CookiesPolicyPage() {
  return (
    <div className="mx-6 mb-24 min-h-[70vh]">
      <div className="mx-auto my-16 max-w-4xl">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-white">
          Cookies <span className="text-green-500">Policy</span>
        </h1>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">
          We use cookies and similar technologies to enhance user experience in
          our platform. This policy complies with the Nigeria Data Protection
          Act (NDPA) 2023, ensuring transparent collection and use of data like
          name, email, mobile number, and device permissions (camera,
          microphone, location, contacts).
        </p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              What are cookies?
            </h2>
            <p>
              Cookies are small text files stored on your device. They help
              websites remember preferences and enable core features like
              sign-in.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              Types of Data Collected
            </h2>
            <p>
              We collect essential data for functionality, verification, and
              security:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Personal identifiers
                </span>
                : name, email, mobile number, business name, house/business
                address.
              </li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Verification data
                </span>
                : NIN/International passport data page and number, CAC
                registration, facial verification.
              </li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Device permissions
                </span>
                : camera access, microphone access, location access, contact
                access.
              </li>
            </ul>
            <p>
              These are processed only with consent or for contract performance,
              as required under NDPA sections 24-25.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              How we use cookies
            </h2>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Essential
                </span>
                : required for authentication, security, and core site
                functionality.
              </li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Preferences
                </span>
                : remember settings like UI choices.
              </li>
              <li>
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Analytics
                </span>
                : understand usage to improve performance and features.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              Purposes and Legal Basis
            </h2>
            <p>
              Data supports user registration, KYC for store owners, facial
              verification, and location-based services. Lawful bases include
              explicit consent and necessity for service provision per NDPA.
              Cookies store session data securely, expiring after use or as
              specified.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-slate-800 dark:text-white">
              Managing cookies
            </h2>
            <p>
              Users can manage permissions via device settings or account
              preferences. Withdraw consent anytime without affecting prior
              processing; we honor NDPA rights to access, rectify, or erase
              data.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-1 font-semibold text-slate-800 dark:text-white">
              More information
            </h2>
            <p>
              For details on how we handle personal information, see our
              Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
