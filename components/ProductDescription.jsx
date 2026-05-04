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
          fill={value >= i + 1 ? "#00C950" : "#4B5563"}
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
      {/* Main product image at ~500px */}
      {product.images?.[0] && (
        <div className="flex justify-center">
          <div className="w-full max-w-[500px]">
            <Image
              src={product.images[0]}
              alt={product.name}
              width={500}
              height={300}
              className="w-full h-auto rounded-[1.5rem] object-contain"
              sizes="(min-width: 1024px) 500px, 100vw"
            />
          </div>
        </div>
      )}

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
      {/* ...rest of your component stays the same... */}
      {/* (omitted here for brevity, but no further changes are required) */}
    </div>
  );
}
