import { categories } from "@/assets/assets";

const CategoriesMarquee = () => {
  return (
    <div className="relative mx-auto w-full max-w-7xl select-none overflow-hidden bg-white/0 dark:bg-slate-950/0 sm:my-20 group">
      {/* Left gradient fade */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-white dark:from-slate-950 to-transparent" />

      {/* Scrolling content */}
      <div className="flex min-w-[200%] gap-4 animate-[marqueeScroll_10s_linear_infinite] sm:animate-[marqueeScroll_40s_linear_infinite] group-hover:[animation-play-state:paused]">
        {[...categories, ...categories, ...categories, ...categories].map(
          (company, index) => (
            <button
              key={index}
              className="rounded-lg border border-transparent bg-slate-100 px-5 py-2 text-xs text-slate-600 transition-all duration-300 hover:bg-slate-600 hover:text-white active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:text-sm"
              type="button"
            >
              {company}
            </button>
          )
        )}
      </div>

      {/* Right gradient fade */}
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 md:w-40 bg-gradient-to-l from-white dark:from-slate-950 to-transparent" />
    </div>
  );
};

export default CategoriesMarquee;
