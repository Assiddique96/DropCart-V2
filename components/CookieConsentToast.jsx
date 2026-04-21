"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

const KEY = "dropcart_cookie_consent_v1";

export default function CookieConsentToast() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(KEY);
    if (!accepted) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const toastId = toast(
      <div className="text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-1 rounded-lg">
        <p className="text-slate-700 dark:text-slate-200">
          We use cookies to improve your experience.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link href="/cookies" className="text-xs underline text-slate-500 dark:text-slate-300">
            Learn more
          </Link>
          <button
            onClick={() => {
              localStorage.setItem(KEY, "accepted");
              toast.dismiss(toastId);
            }}
            className="px-3 py-1 rounded-full text-xs bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Accept
          </button>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "bottom-right",
        id: "cookie-consent",
        className: "!rounded-xl !border !border-slate-200 dark:!border-slate-700 !bg-white dark:!bg-slate-900 !text-slate-700 dark:!text-slate-200 !shadow-lg",
      },
    );
  }, [ready]);

  return null;
}
