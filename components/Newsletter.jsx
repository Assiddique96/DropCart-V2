import React from "react";
import Title from "./Title";

const Newsletter = () => {
  return (
    <div className="flex flex-col items-center mx-4 my-36">
      <Title
        title="Join Newsletter"
        description="Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week."
        visibleButton={false}
      />

      <div className="flex w-full max-w-xl my-10 rounded-full border border-slate-300 bg-white p-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <input
          className="flex-1 rounded-full bg-transparent pl-5 outline-none text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
          type="text"
          placeholder="Enter your email address"
        />
        <button className="rounded-full bg-slate-900 px-7 py-3 font-medium text-white transition hover:scale-[1.03] active:scale-95 dark:bg-white dark:text-slate-900">
          Get Updates
        </button>
      </div>
    </div>
  );
};

export default Newsletter;
