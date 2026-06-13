"use client";
import Image from "next/image";
import {
  PackageIcon, Search, ShoppingCart, HeartIcon,
  ChevronDownIcon, MonitorIcon, ShirtIcon, HomeIcon,
  SparklesIcon, ToyBrickIcon, DumbbellIcon, BookOpenIcon,
  UtensilsIcon, PaletteIcon, GridIcon, PlaneIcon, MenuIcon, XIcon,
  StoreIcon, ShieldCheckIcon, CarIcon, BabyIcon, BriefcaseIcon, WrenchIcon, Camera,
  MapPinIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth, useClerk, useUser, UserButton, Show } from "@clerk/nextjs";
import NotificationBell from "./NotificationBell";
import axios from "axios";
import ThemeToggle from "./ThemeToggle";
import shpinxLogo from "@/assets/logo.png";

const CATEGORIES = [
  { name: "Electronics",        icon: MonitorIcon,    color: "text-blue-500",   desc: "Phones, laptops, gadgets" },
  { name: "Clothing",           icon: ShirtIcon,      color: "text-rose-400",   desc: "Fashion & apparel" },
  { name: "Home & Garden",      icon: HomeIcon,       color: "text-amber-500",  desc: "Furniture & appliances" },
  { name: "Beauty & Health",    icon: SparklesIcon,   color: "text-violet-400", desc: "Skincare & wellness" },
  { name: "Toys & Games",       icon: ToyBrickIcon,   color: "text-yellow-500", desc: "Kids & family" },
  { name: "Sports & Outdoors",  icon: DumbbellIcon,   color: "text-emerald-500",desc: "Fitness & outdoor" },
  { name: "Books & Media",      icon: BookOpenIcon,   color: "text-slate-500",  desc: "Books, music, movies" },
  { name: "Food & Beverage",    icon: UtensilsIcon,   color: "text-red-500",    desc: "Groceries & beverages" },
  { name: "Hobbies & Crafts",   icon: PaletteIcon,    color: "text-teal-500",   desc: "Art & DIY" },
  { name: "Automotive",         icon: CarIcon,        color: "text-cyan-500",   desc: "Car parts & accessories" },
  { name: "Baby & Kids",        icon: BabyIcon,       color: "text-pink-400",   desc: "Baby products & toys" },
  { name: "Pet Supplies",       icon: HeartIcon,      color: "text-emerald-500",desc: "Pet food & accessories" },
  { name: "Office Supplies",    icon: BriefcaseIcon,  color: "text-indigo-500", desc: "Office & stationery" },
  { name: "Industrial & Scientific", icon: WrenchIcon, color: "text-stone-500", desc: "Tools & equipment" },
  { name: "Travel & Luggage",   icon: PlaneIcon,      color: "text-indigo-500", desc: "Travel gear" },
  { name: "Others",             icon: GridIcon,       color: "text-gray-500",   desc: "Everything else" },
];

const FEATURED_LINKS = [
  { label: "New Arrivals",        href: "/shop?sort=newest",     emoji: "✨" },
  { label: "Best Sellers",        href: "/shop?sort=popular",    emoji: "🔥" },
  { label: "Shipped from Abroad", href: "/shop?origin=abroad",   emoji: "✈️" },
  { label: "Under ₦5,000",        href: "/shop?maxPrice=5000",   emoji: "💰" },
  { label: "Track Order",         href: "/track",                emoji: "📦" },
];

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [imageSearching, setImageSearching] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);    // left sidebar like WB
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  // Location & currency
  const [locationLabel, setLocationLabel] = useState("Detecting…");
  const [currency, setCurrency] = useState("NGN");
  const [currencySymbol, setCurrencySymbol] = useState("₦");
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [availableCurrencies] = useState([
    { code: "NGN", symbol: "₦", label: "Nigeria" },
    { code: "USD", symbol: "$", label: "United States" },
    { code: "EUR", symbol: "€", label: "Euro area" },
    { code: "GBP", symbol: "£", label: "United Kingdom" },
  ]);

  const cartCount = useSelector((state) => state.cart.total);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);

  const catalogRef = useRef(null);
  const mobileRef = useRef(null);
  const currencyRef = useRef(null);

  // Close catalog, mobile and currency menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target)) {
        setCatalogOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(e.target)) {
        setCurrencyMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch roles
  useEffect(() => {
    let active = true;

    const fetchRoles = async () => {
      if (!user) {
        if (!active) return;
        setIsAdmin(false);
        setIsSeller(false);
        return;
      }

      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

        const sellerRes = await axios.get("/api/store/is-seller", { headers });
        if (!active) return;

        setIsSeller(Boolean(sellerRes.data?.isSeller));
      } catch {
        if (!active) return;
        setIsSeller(false);
      }
    };

    fetchRoles();
    return () => {
      active = false;
    };
  }, [user, getToken]);

  // Detect approximate location (IP-based) and set default currency
  useEffect(() => {
    let cancelled = false;

    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        if (cancelled) return;

        const city = data.city;
        const country = data.country_name;
        const countryCode = data.country || "NG";

        setLocationLabel(
          [city, country].filter(Boolean).join(", ") || "Select location"
        );

        const countryCurrencyMap = {
          NG: "NGN",
          US: "USD",
          GB: "GBP",
          DE: "EUR",
          FR: "EUR",
          IT: "EUR",
          ES: "EUR",
          NL: "EUR",
          PT: "EUR",
          IE: "EUR",
          BE: "EUR",
          AT: "EUR",
        };

        const detectedCurrency = countryCurrencyMap[countryCode] || "NGN";
        const found = availableCurrencies.find(
          (c) => c.code === detectedCurrency
        );

        setCurrency(found?.code || "NGN");
        setCurrencySymbol(found?.symbol || "₦");

        if (typeof window !== "undefined") {
          localStorage.setItem("shpinx_currency", found?.code || "NGN");
        }
      } catch (e) {
        if (cancelled) return;
        setLocationLabel("Select location");
        setCurrency("NGN");
        setCurrencySymbol("₦");
      }
    };

    // Restore from localStorage if present
    if (typeof window !== "undefined") {
      const storedCurrency = localStorage.getItem("shpinx_currency");
      const found = availableCurrencies.find(
        (c) => c.code === storedCurrency
      );
      if (found) {
        setCurrency(found.code);
        setCurrencySymbol(found.symbol);
      }
    }

    detectLocation();

    return () => {
      cancelled = true;
    };
  }, [availableCurrencies]);

  const handleCurrencyChange = (code) => {
    const found = availableCurrencies.find((c) => c.code === code);
    if (!found) return;
    setCurrency(found.code);
    setCurrencySymbol(found.symbol);
    setCurrencyMenuOpen(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("shpinx_currency", found.code);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
    setCatalogOpen(false);
    setMobileOpen(false);
  };

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSearching(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = String(reader.result).split(",")[1];

        const response = await axios.post("/api/search-by-image", {
          image: base64,
          mimeType: file.type,
        });

        const description = response.data.description;
        router.push(`/shop?search=${encodeURIComponent(description)}`);
        setCatalogOpen(false);
        setMobileOpen(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image search failed:", error);
      router.push(`/shop?search=image`);
    }
    setImageSearching(false);
    e.target.value = "";
  };

  const goToCategory = (cat) => {
    router.push(`/shop?category=${encodeURIComponent(cat)}`);
    setCatalogOpen(false);
    setMobileOpen(false);
  };

  const storeCta = isSeller
    ? { label: "Store Dashboard", href: "/store", emoji: "🏪" }
    : { label: "Create a Store", href: "/create-store", emoji: "🏪" };

  const featuredLinks = [...FEATURED_LINKS, storeCta];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 shadow-sm">
      {/* Top utility bar (like WB top strip but Shpinx colors) */}
      <div className="hidden md:flex items-center justify-between px-6 lg:px-10 h-9 text-xs bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-300">
        <div className="flex items-center gap-4">
          {/* Location (IP-based) */}
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white"
          >
            <MapPinIcon className="w-3.5 h-3.5" />
            <span className="max-w-[180px] truncate">
              {locationLabel}
            </span>
          </button>

          {/* Currency dropdown */}
          <div className="relative" ref={currencyRef}>
            <button
              type="button"
              onClick={() => setCurrencyMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-white"
            >
              <span className="font-semibold">{currencySymbol}</span>
              <span className="uppercase">{currency}</span>
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {currencyMenuOpen && (
              <div className="absolute left-0 mt-2 w-44 rounded-lg border border-slate-100 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50">
                {availableCurrencies.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCurrencyChange(c.code)}
                    className="flex w-full items-center justify-between px-3 py-2 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="flex flex-col text-left">
                      <span className="font-medium">
                        {c.symbol} {c.code}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.label}
                      </span>
                    </span>
                    {currency === c.code && (
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href="/track" className="hover:text-slate-800 dark:hover:text-white">
            Track order
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Main bar: logo, search, cart/account (like WB main row) */}
      <div className="px-4 lg:px-10 py-3 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="relative flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src={shpinxLogo}
              alt="Shpinx"
              width={36}
              height={36}
              className="w-9 h-9"
            />
            <div className="hidden sm:block leading-tight">
              <span className="text-3xl font-semibold text-slate-700 dark:text-slate-100">
                Shp<span className="text-slate-400">inx</span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Nigeria&apos;s marketplace
              </p>
            </div>
            <p className="absolute -top-1 -right-5 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white bg-gray-500">
              .NG
            </p>
            <Show when={{ plan: "plus" }}>
              <p className="absolute -bottom-3 left-0 text-[9px] font-semibold px-2 py-0.5 rounded-full text-white bg-indigo-500">
                Plus
              </p>
            </Show>
          </Link>

          {/* Catalog button (desktop) */}
          <button
            onClick={() => setCatalogOpen((v) => !v)}
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 text-sm font-semibold"
          >
            <MenuIcon size={18} />
            <span>Catalog</span>
          </button>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 sm:px-4 py-2 rounded-full border border-transparent dark:border-slate-800"
          >
            <Search size={18} className="text-slate-500 shrink-0" />
            <input
              className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
              type="text"
              placeholder="Search on Shpinx"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              required
            />
            <label
              className={`hidden sm:inline-flex cursor-pointer ${
                imageSearching ? "opacity-50" : ""
              }`}
            >
              <Camera
                size={18}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSearch}
                disabled={imageSearching}
                className="hidden"
              />
            </label>
          </form>

          {/* Account / cart / wishlist (desktop) */}
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-600 dark:text-slate-200">
            <Link
              href="/wishlist"
              className="relative flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white"
            >
              <HeartIcon size={20} />
              <span className="text-[11px]">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] text-white bg-red-500 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white"
            >
              <ShoppingCart size={20} />
              <span className="text-[11px]">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] text-white bg-slate-700 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserButton>
                  <UserButton.MenuItems>
                    {isSeller && (
                      <UserButton.Action
                        labelIcon={<StoreIcon size={16} />}
                        label="Store Dashboard"
                        onClick={() => router.push("/store")}
                      />
                    )}
                    {isAdmin && (
                      <UserButton.Action
                        labelIcon={<ShieldCheckIcon size={16} />}
                        label="Admin Dashboard"
                        onClick={() => router.push("/admin")}
                      />
                    )}
                    <UserButton.Action
                      labelIcon={<PackageIcon size={16} />}
                      label="My Orders"
                      onClick={() => router.push("/orders")}
                    />
                    <UserButton.Action
                      labelIcon={<HeartIcon size={16} />}
                      label="Wishlist"
                      onClick={() => router.push("/wishlist")}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button
                onClick={openSignIn}
                className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Right: mobile controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-100"
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Second row: horizontal category shortcuts (like WB main menu row) */}
      <div className="hidden md:block border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 flex items-center gap-5 h-10 text-xs font-medium text-slate-600 dark:text-slate-200 overflow-x-auto no-scrollbar">
          <Link href="/shop?sort=promo" className="text-red-500 font-semibold">
            SALE
          </Link>
          <Link href="/shop?origin=abroad" className="hover:text-slate-900 dark:hover:text-white">
            Shipped from abroad
          </Link>
          <Link href="/shop?sort=popular" className="hover:text-slate-900 dark:hover:text-white">
            Best sellers
          </Link>
          <Link href="/shop?sort=newest" className="hover:text-slate-900 dark:hover:text-white">
            New arrivals
          </Link>
          <Link href="/shop?category=Electronics" className="hover:text-slate-900 dark:hover:text-white">
            Electronics
          </Link>
          <Link href="/shop?category=Clothing" className="hover:text-slate-900 dark:hover:text-white">
            Fashion
          </Link>
          <Link href="/shop?category=Home%20%26%20Garden" className="hover:text-slate-900 dark:hover:text-white">
            Home & living
          </Link>
          <Link href="/shop?category=Beauty%20%26%20Health" className="hover:text-slate-900 dark:hover:text-white">
            Beauty
          </Link>
          <Link href="/create-store" className="ml-auto hover:text-slate-900 dark:hover:text-white">
            Sell on Shpinx
          </Link>
        </div>
      </div>

      {/* Desktop left catalog sidebar (like WB) */}
      {catalogOpen && (
        <div
          ref={catalogRef}
          className="hidden md:block absolute top-[118px] left-0 z-40"
        >
          <div className="flex">
            {/* Left narrow column with categories */}
            <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 shadow-xl">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => goToCategory(cat.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <cat.icon size={16} className={cat.color} />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Right panel for quick links / promo */}
            <div className="w-[420px] bg-slate-50 dark:bg-slate-900 shadow-xl border border-l-0 border-slate-100 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick links
              </p>
              <div className="space-y-1">
                {featuredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setCatalogOpen(false)}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-200"
                  >
                    <span>{link.emoji}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm">
                <p className="font-semibold mb-1">🚀 Sell on Shpinx</p>
                <p className="text-xs opacity-90 mb-3">
                  List your gadgets and products, reach buyers all across Nigeria.
                </p>
                <Link
                  href={storeCta.href}
                  onClick={() => setCatalogOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20"
                >
                  {isSeller ? "Go to dashboard →" : "Open your store →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu (full screen) */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 shadow-xl border-t border-slate-100 dark:border-slate-800 z-40 max-h-[85vh] overflow-y-auto"
        >
          <div className="p-4 space-y-4">
            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-full border border-transparent dark:border-slate-800"
            >
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
                type="text"
                placeholder="Search on Shpinx"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              />
            </form>

            {/* Quick tiles */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { label: "Cart", href: "/cart", badge: cartCount, icon: ShoppingCart },
                { label: "Wishlist", href: "/wishlist", badge: wishlistCount, icon: HeartIcon },
                { label: "Orders", href: "/orders", icon: PackageIcon },
                { label: "Track", href: "/track", icon: Search },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="relative flex flex-col items-center gap-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-100"
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] text-white bg-red-500 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Categories list (mobile) */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => goToCategory(cat.name)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <cat.icon size={14} className={cat.color} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auth */}
            {!user ? (
              <button
                onClick={() => {
                  openSignIn();
                  setMobileOpen(false);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium"
              >
                Login / Sign up
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton>
                  <UserButton.MenuItems>
                    {isSeller && (
                      <UserButton.Action
                        labelIcon={<StoreIcon size={16} />}
                        label="Store Dashboard"
                        onClick={() => router.push("/store")}
                      />
                    )}
                    {isAdmin && (
                      <UserButton.Action
                        labelIcon={<ShieldCheckIcon size={16} />}
                        label="Admin Dashboard"
                        onClick={() => router.push("/admin")}
                      />
                    )}
                    <UserButton.Action
                      labelIcon={<PackageIcon size={16} />}
                      label="My Orders"
                      onClick={() => router.push("/orders")}
                    />
                    <UserButton.Action
                      labelIcon={<HeartIcon size={16} />}
                      label="Wishlist"
                      onClick={() => router.push("/wishlist")}
                    />
                  </UserButton.MenuItems>
                </UserButton>
                <p className="text-sm text-slate-600 dark:text-slate-200">
                  Hi, {user.firstName || "there"}!
                </p>
              </div>
            )}

            {/* Sell CTA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700 text-sm">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                🚀 Sell on Shpinx
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 mb-3">
                List your products and reach buyers nationwide.
              </p>
              <Link
                href={storeCta.href}
                onClick={() => setMobileOpen(false)}
                className="text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-500 px-4 py-1.5 rounded-full inline-block"
              >
                {isSeller ? "Go to dashboard →" : "Open your store →"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
