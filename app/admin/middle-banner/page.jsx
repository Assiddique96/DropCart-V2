"use client";

import { useState } from "react";

export default function MiddleBannerAdminPage() {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    ctaText: "",
    position: 0,
    isActive: true,
    countryCode: "",
    startsAt: "",
    endsAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/middle-banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create banner");
      }

      setMessage("Middle banner created successfully.");

      setForm({
        title: "",
        subtitle: "",
        imageUrl: "",
        linkUrl: "",
        ctaText: "",
        position: 0,
        isActive: true,
        countryCode: "",
        startsAt: "",
        endsAt: "",
      });
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Middle Banner Manager</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create and manage the banner shown in the middle row of the homepage.
        </p>

        {message && (
          <div className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Example: Flash Deals"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Example: Limited time offers"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Image URL</label>
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Link URL</label>
            <input
              type="text"
              name="linkUrl"
              value={form.linkUrl}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="/shop or https://..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CTA Text</label>
            <input
              type="text"
              name="ctaText"
              value={form.ctaText}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              placeholder="Shop now"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Position</label>
              <input
                type="number"
                name="position"
                value={form.position}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Country Code</label>
              <input
                type="text"
                name="countryCode"
                value={form.countryCode}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                placeholder="NG, MT, RU"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Starts At</label>
              <input
                type="datetime-local"
                name="startsAt"
                value={form.startsAt}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ends At</label>
              <input
                type="datetime-local"
                name="endsAt"
                value={form.endsAt}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="h-4 w-4"
            />
            Active
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Create Banner"}
          </button>
        </form>
      </div>
    </div>
  );
}
