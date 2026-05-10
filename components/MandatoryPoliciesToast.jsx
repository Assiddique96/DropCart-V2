"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

const KEY = "shpinx_policies_accepted_v1";

export default function MandatoryPoliciesToast() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(KEY);
    if (!accepted) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const toastId = toast(
      <div className="text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 p-4 rounded-lg max-w-md">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Terms of Use & Privacy Policy
        </h3>
        <p className="text-slate-700 dark:text-slate-200 mb-3">
          By continuing to use Shpinx, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 underline" target="_blank">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline" target="_blank">
            Privacy Policy
          </Link>.
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => {
              localStorage.setItem(KEY, "accepted");
              toast.dismiss(toastId);
            }}
            className="px-4 py-2 rounded-full text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            I Agree
          </button>
        </div>
      </div>,
      {
        duration: Infinity,
        position: "bottom-center",
        id: "mandatory-policies",
        className: "!rounded-xl !border !border-slate-200 dark:!border-slate-700 !bg-white dark:!bg-slate-900 !text-slate-700 dark:!text-slate-200 !shadow-lg",
        style: { maxWidth: "500px" },
      },
    );
  }, [ready]);

  return null;
}
