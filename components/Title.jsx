"use client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

const Title = ({ title, description, visibleButton = true, href = "" }) => {
  const Wrapper = href ? Link : "div";

  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>

      <Wrapper
        href={href || undefined}
        className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300"
      >
        <p className="max-w-lg">{description}</p>

        {visibleButton && href && (
          <button className="flex items-center gap-1 text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
            View more <ArrowRight size={14} />
          </button>
        )}
      </Wrapper>
    </div>
  );
};

export default Title;
