"use client";
import {
  ArrowRight,
  StarIcon,
  PencilIcon,
  Trash2Icon,
  MessageSquareIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";

const StarRow = ({ count, total, label }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-3 text-slate-400 dark:text-slate-500">{label}★</span>
    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-400 rounded-full transition-all"
        style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
      />
    </div>
    <span className="w-4 text-slate-400 dark:text-slate-500 text-right">
      {count}
    </span>
  </div>
);

const StarDisplay = ({ value, size = 16 }) => (
  <div className="flex">
    {Array(5)
      .fill("")
      .map((_, i) => (
        <StarIcon
          key={i}
          size={size}
          className="text-transparent"
          fill={value >= i + 1 ? "#00C950" : "#4B5563"} // slightly brighter gray on dark bg
        />
      ))}
  </div>
);

export default function ProductDescription({ product }) {
  const [selectedTab, setSelectedTab] = useState("Description");
  const { user } = useUser();
  const { getToken } = useAuth();
  const userRatings = useSelector((state) => state.rating.ratings);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, review: "" });
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [localRatings, setLocalRatings] = useState(product.rating || []);
  const [submitting, setSubmitting] = useState(false);

  const total = localRatings.length;
  const avg =
    total > 0
      ? localRatings.reduce((s, r) => s + r.rating, 0) / total
      : 0;
  const breakdown = [5, 4, 3, 2, 1].map((n) => ({
    label: n,
    count: localRatings.filter((r) => r.rating === n).length,
  }));

  const saveEdit = async (ratingId) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.patch(
        "/api/rating",
        { ratingId, rating: editForm.rating, review: editForm.review },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocalRatings((prev) =>
        prev.map((r) => (r.id === ratingId ? { ...r, ...data.rating } : r))
      );
      setEditingId(null);
      toast.success("Review updated.");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
    setSubmitting(false);
  };

  const deleteRating = async (ratingId) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      const token = await getToken();
      await axios.delete(`/api/rating?ratingId=${ratingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalRatings((prev) => prev.filter((r) => r.id !== ratingId));
      toast.success("Review deleted.");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
  };

  const saveResponse = async (ratingId) => {
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/store/review-response",
        { ratingId, response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLocalRatings((prev) =>
        prev.map((r) =>
          r.id === ratingId
            ? { ...r, sellerResponse: data.rating.sellerResponse }
            : r
        )
      );
      setRespondingId(null);
      setResponseText("");
      toast.success("Response saved.");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
    setSubmitting(false);
  };

  const deleteResponse = async (ratingId) => {
    try {
      const token = await getToken();
      await axios.delete(`/api/store/review-response?ratingId=${ratingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocalRatings((prev) =>
        prev.map((r) =>
          r.id === ratingId ? { ...r, sellerResponse: null } : r
        )
      );
      toast.success("Response removed.");
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message);
    }
  };

  return (
    <div className="my-16 space-y-10 text-slate-700 dark:text-slate-200">
      {/* Overview card */}
      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Product overview
            </p>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Product highlights
            </h2>
            <p className="leading-7 text-slate-700 dark:text-slate-200">
              {product.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            {[
              {
                label: "Category",
                value: product.category || "Others",
              },
              {
                label: "Manufacturer",
                value: product.manufacturer || "Not specified",
              },
              {
                label: "Origin",
                value: product.madeIn || "Unknown",
              },
              {
                label: "Shipping",
                value:
                  product.origin === "ABROAD" ? "International" : "Local",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {product.tags?.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs + content */}
      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/70 p-4">
          {["Description", `Reviews (${total})`].map((tab, i) => {
            const key = tab.startsWith("Reviews") ? "Reviews" : "Description";
            const isActive = selectedTab === key;
            return (
              <button
                key={i}
                onClick={() => setSelectedTab(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {selectedTab === "Description" && (
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    label: "Category",
                    value: product.category || "Others",
                  },
                  {
                    label: "Manufacturer",
                    value: product.manufacturer || "Not specified",
                  },
                  {
                    label: "Origin",
                    value: product.madeIn || "Unknown",
                  },
                  {
                    label: "Shipping",
                    value:
                      product.origin === "ABROAD"
                        ? "International"
                        : "Local",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-200">
                <p>{product.description}</p>
              </div>
            </div>
          )}

          {selectedTab === "Reviews" && (
            <div className="space-y-8">
              {total > 0 ? (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="text-center lg:text-left">
                      <p className="text-5xl font-bold text-slate-900 dark:text-white">
                        {avg.toFixed(1)}
                      </p>
                      <div className="mt-2 flex justify-center lg:justify-start">
                        <StarDisplay
                          value={Math.round(avg)}
                          size={14}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {total} review{total !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {breakdown.map(({ label, count }) => (
                        <StarRow
                          key={label}
                          label={label}
                          count={count}
                          total={total}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 text-center text-slate-500 dark:text-slate-400">
                  No reviews yet. Be the first to share your experience.
                </div>
              )}

              {localRatings.length > 0 && (
                <div className="space-y-6">
                  {localRatings.map((item) => {
                    const isOwner = user?.id === item.userId;
                    const isEditing = editingId === item.id;
                    const isResponding = respondingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6"
                      >
                        <div className="flex gap-4">
                          <Image
                            src={item.user?.image}
                            alt=""
                            className="size-10 rounded-full shrink-0 object-cover"
                            width={40}
                            height={40}
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {item.user?.name}
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                  <StarDisplay
                                    value={item.rating}
                                    size={13}
                                  />
                                  <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {new Date(
                                      item.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              {isOwner && !isEditing && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingId(item.id);
                                      setEditForm({
                                        rating: item.rating,
                                        review: item.review,
                                      });
                                    }}
                                    className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition"
                                    title="Edit review"
                                  >
                                    <PencilIcon size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteRating(item.id)
                                    }
                                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition"
                                    title="Delete review"
                                  >
                                    <Trash2Icon size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="mt-4 space-y-3">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() =>
                                        setEditForm((f) => ({
                                          ...f,
                                          rating: n,
                                        }))
                                      }
                                      className="p-0.5"
                                    >
                                      <StarIcon
                                        size={20}
                                        className="text-transparent"
                                        fill={
                                          editForm.rating >= n
                                            ? "#00C950"
                                            : "#4B5563"
                                        }
                                      />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={editForm.review}
                                  rows={3}
                                  onChange={(e) =>
                                    setEditForm((f) => ({
                                      ...f,
                                      review: e.target.value,
                                    }))
                                  }
                                  className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 outline-none"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => saveEdit(item.id)}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                                  >
                                    <CheckIcon size={14} />{" "}
                                    {submitting
                                      ? "Saving..."
                                      : "Save"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setEditingId(null)
                                    }
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                                  >
                                    <XIcon size={14} /> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="mt-4 leading-7 text-slate-700 dark:text-slate-200">
                                  {item.review}
                                </p>
                                {item.reviewImages?.length > 0 && (
                                  <div className="mt-4 grid grid-cols-3 gap-3">
                                    {item.reviewImages.map(
                                      (src, imgIdx) => (
                                        <a
                                          key={imgIdx}
                                          href={src}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Image
                                            src={src}
                                            alt={`Review image ${
                                              imgIdx + 1
                                            }`}
                                            width={80}
                                            height={80}
                                            className="h-20 w-full rounded-2xl border border-slate-200 dark:border-slate-700 object-cover"
                                          />
                                        </a>
                                      )
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {item.sellerResponse && !isResponding && (
                              <div className="mt-5 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                    <MessageSquareIcon size={12} />{" "}
                                    Seller Response
                                  </p>
                                  {product.store?.userId ===
                                    user?.id && (
                                    <div className="flex gap-2 text-slate-400 dark:text-slate-500">
                                      <button
                                        onClick={() => {
                                          setRespondingId(
                                            item.id
                                          );
                                          setResponseText(
                                            item.sellerResponse
                                          );
                                        }}
                                        className="hover:text-blue-500 transition"
                                      >
                                        <PencilIcon size={14} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          deleteResponse(item.id)
                                        }
                                        className="hover:text-red-500 transition"
                                      >
                                        <Trash2Icon size={14} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-200">
                                  {item.sellerResponse}
                                </p>
                              </div>
                            )}

                            {product.store?.userId === user?.id &&
                              !item.sellerResponse &&
                              !isResponding && (
                                <button
                                  onClick={() => {
                                    setRespondingId(item.id);
                                    setResponseText("");
                                  }}
                                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition"
                                >
                                  <MessageSquareIcon size={14} /> Reply
                                  to review
                                </button>
                              )}

                            {isResponding && (
                              <div className="mt-4 space-y-3">
                                <textarea
                                  value={responseText}
                                  rows={3}
                                  onChange={(e) =>
                                    setResponseText(e.target.value)
                                  }
                                  placeholder="Write your response..."
                                  className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm text-slate-700 dark:text-slate-200 outline-none"
                                />
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() =>
                                      saveResponse(item.id)
                                    }
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50"
                                  >
                                    <CheckIcon size={14} />{" "}
                                    {submitting
                                      ? "Saving..."
                                      : "Post Response"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setRespondingId(null)
                                    }
                                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                                  >
                                    <XIcon size={14} /> Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Store card */}
      <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {product.store?.logo ? (
            <Image
              src={product.store.logo}
              alt={product.store.name}
              className="size-11 rounded-full object-cover ring ring-slate-200 dark:ring-slate-700"
              width={44}
              height={44}
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold ring ring-slate-200 dark:ring-slate-700 uppercase">
              {product.store?.name?.charAt(0) || "S"}
            </div>
          )}
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              Product by {product.store?.name || "Unknown Store"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Trusted seller with verified store ratings.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Link
            href={`/shop/${product.store?.username || "#"}`}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            View store <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
