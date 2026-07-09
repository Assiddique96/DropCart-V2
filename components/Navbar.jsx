"use client";
import Image from "next/image";
import {
  PackageIcon, Search, ShoppingCart, HeartIcon,
  ChevronDownIcon, MonitorIcon, ShirtIcon, HomeIcon,
  SparklesIcon, ToyBrickIcon, DumbbellIcon, BookOpenIcon,
  UtensilsIcon, PaletteIcon, GridIcon, PlaneIcon, MenuIcon, XIcon,
  StoreIcon, ShieldCheckIcon, CarIcon, BabyIcon, BriefcaseIcon, WrenchIcon, Camera,
  MapPinIcon, LayoutDashboardIcon,
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
import { getSubdomainFromHost, isStoreSubdomain, buildRootDomainUrl } from "@/lib/subdomain";

const CATEGORIES = [
  { name: "Electronics", icon: MonitorIcon, color: "text-cyan-500 dark:text-cyan-400", desc: "Phones, laptops, gadgets" },
  { name: "Clothing", icon: ShirtIcon, color: "text-fuchsia-500 dark:text-fuchsia-400", desc: "Fashion & apparel" },
  { name: "Home & Garden", icon: HomeIcon, color: "text-amber-500 dark:text-amber-400", desc: "Furniture & appliances" },
  { name: "Beauty & Health", icon: SparklesIcon, color: "text-violet-500 dark:text-violet-400", desc: "Skincare & wellness" },
  { name: "Toys & Games", icon: ToyBrickIcon, color: "text-yellow-500 dark:text-yellow-400", desc: "Kids & family" },
  { name: "Sports & Outdoors", icon: DumbbellIcon, color: "text-emerald-500 dark:text-emerald-400", desc: "Fitness & outdoor" },
  { name: "Books & Media", icon: BookOpenIcon, color: "text-sky-500 dark:text-sky-400", desc: "Books, music, movies" },
  { name: "Food & Beverage", icon: UtensilsIcon, color: "text-red-500 dark:text-red-400", desc: "Groceries & beverages" },
  { name: "Hobbies & Crafts", icon: PaletteIcon, color: "text-teal-500 dark:text-teal-400", desc: "Art & DIY" },
  { name: "Automotive", icon: CarIcon, color: "text-blue-500 dark:text-blue-400", desc: "Car parts & accessories" },
  { name: "Baby & Kids", icon: BabyIcon, color: "text-pink-500 dark:text-pink-400", desc: "Baby products & toys" },
  { name: "Pet Supplies", icon: HeartIcon, color: "text-green-500 dark:text-green-400", desc: "Pet food & accessories" },
  { name: "Office Supplies", icon: BriefcaseIcon, color: "text-indigo-500 dark:text-indigo-400", desc: "Office & stationery" },
  { name: "Industrial & Scientific", icon: WrenchIcon, color: "text-lime-500 dark:text-lime-400", desc: "Tools & equipment" },
  { name: "Travel & Luggage", icon: PlaneIcon, color: "text-purple-500 dark:text-purple-400", desc: "Travel gear" },
  { name: "Others", icon: GridIcon, color: "text-gray-500 dark:text-gray-400", desc: "Everything else" },
];

const FEATURED_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=newest", emoji: "✨" },
  { label: "Best Sellers", href: "/shop?sort=popular", emoji: "🔥" },
  { label: "Shipped from Abroad", href: "/shop?origin=abroad", emoji: "✈️" },
  { label: "Under ₦5,000", href: "/shop?maxPrice=5000", emoji: "💰" },
  { label: "Wholesale", href: "/wholesale", emoji: "📦" },
  { label: "Track Order", href: "/track", emoji: "🚚" },
];

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [imageSearching, setImageSearching] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Whether we're currently rendering on a store's subdomain (e.g.
  // adaelectronics.shpinx.com). Starts false to match SSR output, then
  // resolves after mount — avoids a hydration mismatch on link hrefs.
  const [onStoreSubdomain, setOnStoreSubdomain] = useState(false);

  useEffect(() => {
    setOnStoreSubdomain(isStoreSubdomain(getSubdomainFromHost(window.location.host)));
  }, []);

  /** Cart, wishlist, dashboards, auth, and cross-store browsing always live on the root domain. */
  const toRoot = (path) => (onStoreSubdomain ? buildRootDomainUrl(path) : path);

  /** Same as toRoot, but for imperative onClick navigation (router.push can't cross a real origin). */
  const goRoot = (path) => {
    if (onStoreSubdomain) {
      window.location.href = buildRootDomainUrl(path);
    } else {
      router.push(path);
    }
  };
  const [isSeller, setIsSeller] = useState(false);

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

  useEffect(() => {
    const handler = (e) => {
      if (catalogRef.current && !catalogRef.current.contains(e.target)) setCatalogOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
        const [sellerRes, adminRes] = await Promise.allSettled([
          axios.get("/api/store/is-seller", { headers }),
          axios.get("/api/admin/is-admin", { headers }),
        ]);
        if (!active) return;
        setIsSeller(sellerRes.status === "fulfilled" && Boolean(sellerRes.value.data?.isSeller));
        setIsAdmin(adminRes.status === "fulfilled" && Boolean(adminRes.value.data?.isAdmin));
      } catch {
        if (!active) return;
        setIsSeller(false);
        setIsAdmin(false);
      }
    };
    fetchRoles();
    return () => { active = false; };
  }, [user, getToken]);

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
        setLocationLabel([city, country].filter(Boolean).join(", ") || "Select location");
        const countryCurrencyMap = { NG: "NGN", US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", PT: "EUR", IE: "EUR", BE: "EUR", AT: "EUR" };
        const detectedCurrency = countryCurrencyMap[countryCode] || "NGN";
        const found = availableCurrencies.find((c) => c.code === detectedCurrency);
        setCurrency(found?.code || "NGN");
        setCurrencySymbol(found?.symbol || "₦");
        if (typeof window !== "undefined") localStorage.setItem("shpinx_currency", found?.code || "NGN");
      } catch {
        if (cancelled) return;
        setLocationLabel("Select location");
      }
    };
    if (typeof window !== "undefined") {
      const storedCurrency = localStorage.getItem("shpinx_currency");
      const found = availableCurrencies.find((c) => c.code === storedCurrency);
      if (found) { setCurrency(found.code); setCurrencySymbol(found.symbol); }
    }
    detectLocation();
    return () => { cancelled = true; };
  }, [availableCurrencies]);

  const handleCurrencyChange = (code) => {
    const found = availableCurrencies.find((c) => c.code === code);
    if (!found) return;
    setCurrency(found.code);
    setCurrencySymbol(found.symbol);
    setCurrencyMenuOpen(false);
    if (typeof window !== "undefined") localStorage.setItem("shpinx_currency", found.code);
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
        const response = await axios.post("/api/search-by-image", { image: base64, mimeType: file.type });
        const description = response.data.description;
        router.push(`/shop?search=${encodeURIComponent(description)}`);
        setCatalogOpen(false);
        setMobileOpen(false);
      };
      reader.readAsDataURL(file);
    } catch {
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

  /** Dashboard link based on role */
  const dashboardHref = isAdmin ? "/admin" : isSeller ? "/store" : null;
  const dashboardLabel = isAdmin ? "Admin Dashboard" : "Store Dashboard";

  const storeCta = isSeller
    ? { label: "Store Dashboard", href: toRoot("/store"), emoji: "🏪" }
    : { label: "Create a Store", href: toRoot("/create-store"), emoji: "🏪" };
  const featuredLinks = [...FEATURED_LINKS, storeCta];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-950 shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

      {/* Top bar */}
      <div className="hidden md:flex items-center justify-between px-6 lg:px-10 h-12 text-xs bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-6">
          <button type="button" className="inline-flex items-center gap-2 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 group">
            <div className="relative">
              <MapPinIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400 group-hover:animate-bounce" />
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full animate-ping" />
            </div>
            <span className="max-w-[180px] truncate text-slate-600 dark:text-slate-300 group-hover:text-cyan-500 font-medium">{locationLabel}</span>
          </button>

          <div className="relative" ref={currencyRef}>
            <button type="button" onClick={() => setCurrencyMenuOpen((v) => !v)} className="inline-flex items-center gap-2 hover:text-fuchsia-500 transition-all duration-300 group bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <span className="font-bold text-lg text-fuchsia-500 dark:text-fuchsia-400">{currencySymbol}</span>
              <span className="uppercase text-slate-700 dark:text-slate-200 font-bold">{currency}</span>
              <ChevronDownIcon className="w-4 h-4 text-cyan-500 group-hover:rotate-180 transition-transform duration-300" />
            </button>
            {currencyMenuOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-slate-200 dark:border-slate-600/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-lg z-50 overflow-hidden">
                {availableCurrencies.map((c, idx) => (
                  <button key={c.code} type="button" onClick={() => handleCurrencyChange(c.code)}
                    className={`flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all ${idx !== availableCurrencies.length - 1 ? "border-b border-slate-100 dark:border-slate-700/30" : ""}`}>
                    <span className="flex flex-col text-left">
                      <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span className="text-fuchsia-500">{c.symbol}</span>{c.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{c.label}</span>
                    </span>
                    {currency === c.code && <span className="text-cyan-500 font-bold animate-pulse">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link href={toRoot("/track")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 text-slate-600 dark:text-slate-300">
            Track order
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Main navbar row */}
      <div className="px-4 lg:px-10 py-4 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex items-center gap-4 md:gap-6">
          {/* Logo */}
          <Link href="/" className="relative flex items-center gap-3 shrink-0 group hover:scale-105 transition-all duration-300" onClick={() => setMobileOpen(false)}>
            <div className="relative">
              <Image src={shpinxLogo} alt="Shpinx" width={36} height={36} className="w-11 h-11 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.4)] group-hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] transition-all duration-300" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/20 animate-pulse" />
            </div>
            <div className="hidden sm:block leading-tight">
              <span className="text-4xl font-semibold text-slate-700 dark:text-slate-100">
                Shp<span className="text-slate-400 dark:text-slate-400">inx</span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                Nigeria&apos;s marketplace
              </p>
            </div>
            <p className="absolute -top-1 -right-5 text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-cyan-500 to-fuchsia-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]">
              .NG
            </p>
            <Show when={{ plan: "plus" }}>
              <p className="absolute -bottom-3 left-0 text-[9px] font-bold px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-indigo-500 to-purple-500">
                Plus
              </p>
            </Show>
          </Link>

          {/* Catalog button */}
          <button onClick={() => setCatalogOpen((v) => !v)}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105 border border-slate-200 dark:border-slate-700/50 font-bold shadow-sm">
            <MenuIcon size={18} />
            <span>Catalog</span>
          </button>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex-1 flex items-stretch bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/50 hover:border-cyan-400/50 transition-all duration-300">
            <div className="flex flex-1 items-center gap-3 px-4 sm:px-5">
              <Search size={20} className="text-slate-400 shrink-0" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
                type="text" placeholder="Search for products, brands and categories"
                value={search} onChange={(e) => setSearch(e.target.value)} required
              />
            </div>
            <label className={`hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 border-l border-slate-200/70 dark:border-slate-700/50 cursor-pointer bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 transition-all duration-300 ${imageSearching ? "opacity-50 cursor-wait" : ""}`}>
              <Camera size={20} className="text-slate-400" />
              <span className="hidden md:inline text-[11px] font-bold text-slate-500 dark:text-slate-300">Search by photo</span>
              <input type="file" accept="image/*" onChange={handleImageSearch} disabled={imageSearching} className="hidden" />
            </label>
            <label className={`sm:hidden inline-flex items-center justify-center px-3 border-l border-slate-200/70 dark:border-slate-700/50 cursor-pointer ${imageSearching ? "opacity-50 cursor-wait" : ""}`}>
              <Camera size={20} className="text-slate-400" />
              <input type="file" accept="image/*" onChange={handleImageSearch} disabled={imageSearching} className="hidden" />
            </label>
          </form>

          {/* Desktop right icons */}
          <div className="hidden md:flex items-center gap-5 text-sm text-slate-600 dark:text-slate-300">
            {/* Dashboard link – shown if admin or seller */}
            {dashboardHref && (
              <Link
                href={toRoot(dashboardHref)}
                title={dashboardLabel}
                className="relative flex flex-col items-center gap-1 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110 group"
              >
                <div className="relative">
                  {isAdmin ? (
                    <ShieldCheckIcon size={22} className="group-hover:animate-pulse text-fuchsia-500" />
                  ) : (
                    <LayoutDashboardIcon size={22} className="group-hover:animate-pulse" />
                  )}
                </div>
                <span className="text-[11px] font-medium">{isAdmin ? "Admin" : "Dashboard"}</span>
              </Link>
            )}

            <Link href={toRoot("/wishlist")} className="relative flex flex-col items-center gap-1 hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-all duration-300 hover:scale-110 group">
              <div className="relative">
                <HeartIcon size={22} className="group-hover:animate-pulse" />
              </div>
              <span className="text-[11px] font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] text-white bg-gradient-to-r from-fuchsia-500 to-pink-500 min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href={toRoot("/cart")} className="relative flex flex-col items-center gap-1 hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-110 group">
              <div className="relative">
                <ShoppingCart size={22} className="group-hover:animate-pulse" />
              </div>
              <span className="text-[11px] font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] text-white bg-gradient-to-r from-cyan-500 to-blue-500 min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <UserButton>
                  <UserButton.MenuItems>
                    {isSeller && (
                      <UserButton.Action labelIcon={<StoreIcon size={16} />} label="Store Dashboard" onClick={() => router.push("/store")} />
                    )}
                    {isAdmin && (
                      <UserButton.Action labelIcon={<ShieldCheckIcon size={16} />} label="Admin Dashboard" onClick={() => router.push("/admin")} />
                    )}
                    <UserButton.Action labelIcon={<PackageIcon size={16} />} label="My Orders" onClick={() => router.push("/orders")} />
                    <UserButton.Action labelIcon={<HeartIcon size={16} />} label="Wishlist" onClick={() => router.push("/wishlist")} />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button onClick={openSignIn} className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105">
                Sign in
              </button>
            )}
          </div>

          {/* Mobile right icons */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle compact />
            {/* Dashboard icon – mobile only shows icon */}
            {dashboardHref && user && (
              <Link href={toRoot(dashboardHref)} title={dashboardLabel}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
                {isAdmin
                  ? <ShieldCheckIcon size={20} className="text-fuchsia-500" />
                  : <LayoutDashboardIcon size={20} />
                }
              </Link>
            )}
            {user && <NotificationBell />}
            <button onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
              {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sub-nav */}
      <div className="hidden md:block border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/70 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 flex items-center gap-6 h-12 text-xs font-bold text-slate-600 dark:text-slate-300 overflow-x-auto no-scrollbar">
          <Link href={toRoot("/shop?sort=discount")} className="text-fuchsia-500 font-bold hover:scale-110 transition-all animate-pulse">SALE</Link>
          <Link href={toRoot("/shop?origin=abroad")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-105">Shipped from abroad</Link>
          <Link href={toRoot("/shop?sort=popular")} className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-all duration-300 hover:scale-105">Best sellers</Link>
          <Link href={toRoot("/shop?sort=newest")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-105">New arrivals</Link>
          <Link href={toRoot("/shop?category=Electronics")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-105">Electronics</Link>
          <Link href={toRoot("/shop?category=Clothing")} className="hover:text-fuchsia-500 dark:hover:text-fuchsia-400 transition-all duration-300 hover:scale-105">Fashion</Link>
          <Link href={toRoot("/shop?category=Home%20%26%20Garden")} className="hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-300 hover:scale-105">Home & living</Link>
          <Link href={toRoot("/shop?category=Beauty%20%26%20Health")} className="hover:text-violet-500 dark:hover:text-violet-400 transition-all duration-300 hover:scale-105">Beauty</Link>
          <Link href="/wholesale" className="hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-300 hover:scale-105">Wholesale</Link>
          <Link href={toRoot("/create-store")} className="ml-auto hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-300 hover:scale-105">Sell on Shpinx</Link>
        </div>
      </div>

      {/* Catalog dropdown */}
      {catalogOpen && (
        <div ref={catalogRef} className="hidden md:block absolute top-[140px] left-0 z-40">
          <div className="flex">
            <div className="w-64 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-700/50 shadow-xl max-h-[calc(100vh-160px)] overflow-y-auto">
              {CATEGORIES.map((cat) => (
                <button key={cat.name} onClick={() => goToCategory(cat.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-300 border-l-2 border-transparent hover:border-cyan-400">
                  <cat.icon size={18} className={cat.color} />
                  <span className="font-medium">{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="w-[420px] bg-slate-50 dark:bg-slate-900 shadow-xl border border-l-0 border-slate-100 dark:border-slate-700/50 p-5 max-h-[calc(100vh-160px)] overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 mb-3 flex items-center gap-2">
                <SparklesIcon size={14} /> Quick links
              </p>
              <div className="space-y-2">
                {featuredLinks.map((link) => (
                  <Link key={link.href} href={toRoot(link.href)} onClick={() => setCatalogOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                    <span className="text-lg">{link.emoji}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>
              <div className="mt-5 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white text-sm border border-slate-700/50 relative overflow-hidden">
                <p className="font-bold mb-2 text-lg flex items-center gap-2">🚀 Sell on Shpinx</p>
                <p className="text-xs opacity-90 mb-3">List your gadgets and products, reach buyers all across Nigeria.</p>
                <Link href={storeCta.href} onClick={() => setCatalogOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-300">
                  {isSeller ? "Go to dashboard →" : "Open your store →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div ref={mobileRef} className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 shadow-xl border-t border-slate-100 dark:border-slate-700/50 z-40 max-h-[85vh] overflow-y-auto">
          <div className="p-5 space-y-5">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700/50">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
                type="text" placeholder="Search on Shpinx" value={search} onChange={(e) => setSearch(e.target.value)} required />
            </form>

            <div className="grid grid-cols-4 gap-3 text-xs">
              {[
                { label: "Cart", href: "/cart", badge: cartCount, icon: ShoppingCart },
                { label: "Wishlist", href: "/wishlist", badge: wishlistCount, icon: HeartIcon },
                { label: "Orders", href: "/orders", icon: PackageIcon },
                { label: "Track", href: "/track", icon: Search },
              ].map((item) => (
                <Link key={item.href} href={toRoot(item.href)} onClick={() => setMobileOpen(false)}
                  className="relative flex flex-col items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700/50">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] text-white bg-gradient-to-r from-fuchsia-500 to-pink-500 min-w-[18px] h-4 px-1 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400 mb-3 flex items-center gap-2">
                <GridIcon size={14} /> Categories
              </p>
              <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.name} onClick={() => goToCategory(cat.name)}
                    className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700/50 text-left">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <cat.icon size={16} className={cat.color} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {!user ? (
              <button onClick={() => { openSignIn(); setMobileOpen(false); }}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white text-sm font-bold hover:bg-slate-800 transition-all rounded-xl">
                Login / Sign up
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <UserButton>
                  <UserButton.MenuItems>
                    {isSeller && <UserButton.Action labelIcon={<StoreIcon size={16} />} label="Store Dashboard" onClick={() => goRoot("/store")} />}
                    {isAdmin && <UserButton.Action labelIcon={<ShieldCheckIcon size={16} />} label="Admin Dashboard" onClick={() => goRoot("/admin")} />}
                    <UserButton.Action labelIcon={<PackageIcon size={16} />} label="My Orders" onClick={() => goRoot("/orders")} />
                    <UserButton.Action labelIcon={<HeartIcon size={16} />} label="Wishlist" onClick={() => goRoot("/wishlist")} />
                  </UserButton.MenuItems>
                </UserButton>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Hi, {user.firstName || "there"}!
                </p>
              </div>
            )}

            <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-sm">
              <p className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">🚀 Sell on Shpinx</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-3">List your products and reach buyers nationwide.</p>
              <Link href={storeCta.href} onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-fuchsia-600 px-5 py-2 rounded-full hover:from-cyan-500 hover:to-fuchsia-500 transition-all">
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
