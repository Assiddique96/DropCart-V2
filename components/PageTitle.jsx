"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

const PageTitle = ({ heading, text, path = "/", linkText }) => {
  return (
    <div className="my-6">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
        {heading}
      </h2>

      <div className="mt-1 flex items-center gap-3">
        <p className="text-slate-600 dark:text-slate-300">{text}</p>

        {linkText && (
          <Link
            href={path}
            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300"
          >
            {linkText} <ArrowRightIcon size={14} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PageTitle;
