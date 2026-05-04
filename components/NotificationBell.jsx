"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from "@/lib/features/notifications/notificationsSlice";
import {
  BellIcon,
  PackageIcon,
  StarIcon,
  CircleDollarSignIcon,
  InfoIcon,
  CheckCheckIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

const TYPE_ICONS = {
  order: {
    Icon: PackageIcon,
    color:
      "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/15",
  },
  review: {
    Icon: StarIcon,
    color:
      "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15",
  },
  payout: {
    Icon: CircleDollarSignIcon,
    color:
      "text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-500/15",
  },
  system: {
    Icon: InfoIcon,
    color:
      "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/40",
  },
};

export default function NotificationBell() {
  const { user } = useUser();
  const dispatch = useDispatch();
  const { items, unreadCount, loaded } = useSelector(
    (state) => state.notifications
  );
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (!loaded) dispatch(fetchNotifications());

    const id = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    return () => clearInterval(id);
  }, [dispatch, loaded, user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !(ref.current as HTMLElement).contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (user) dispatch(fetchNotifications());
    setOpen((v) => !v);
  };

  const handleClick = (notif) => {
    if (!notif.read) dispatch(markNotificationAsRead(notif.id));
    setOpen(false);
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        title="Notifications"
        type="button"
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Notifications
            </p>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => dispatch(markAllNotificationsRead())}
                  className="flex items-center gap-1 text-xs text-blue-500 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  type="button"
                >
                  <CheckCheckIcon size={12} /> Mark all read
                </button>
              )}
              {items.length > 0 && (
                <button
                  onClick={() => dispatch(clearAllNotifications())}
                  className="text-xs text-slate-400 transition hover:text-red-500 dark:text-slate-300"
                  type="button"
                >
                  <Trash2Icon size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-300">
                <BellIcon size={28} className="mb-2 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              items.map((notif) => {
                const { Icon, color } =
                  TYPE_ICONS[notif.type] || TYPE_ICONS.system;
                const inner = (
                  <div
                    className={`flex cursor-pointer gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 ${
                      !notif.read
                        ? "bg-blue-50/40 dark:bg-blue-500/10"
                        : ""
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    <div
                      className={`h-fit shrink-0 rounded-full p-2 ${color}`}
                    >
                      <Icon size={13} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs font-semibold ${
                          notif.read
                            ? "text-slate-500 dark:text-slate-300"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="mt-0.5 leading-4 text-xs text-slate-500 dark:text-slate-300">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-300 dark:text-slate-400">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
                return notif.link ? (
                  <Link key={notif.id} href={notif.link}>
                    {inner}
                  </Link>
                ) : (
                  <div key={notif.id}>{inner}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
