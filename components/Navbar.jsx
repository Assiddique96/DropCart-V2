"use client"
import Image from "next/image";
import {
  PackageIcon, Search, ShoppingCart, HeartIcon,
  ChevronDownIcon, MonitorIcon, ShirtIcon, HomeIcon,
  SparklesIcon, ToyBrickIcon, DumbbellIcon, BookOpenIcon,
  UtensilsIcon, PaletteIcon, GridIcon, PlaneIcon, MenuIcon, XIcon,
  StoreIcon, ShieldCheckIcon, CarIcon, BabyIcon, BriefcaseIcon, WrenchIcon, Camera
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
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  const cartCount = useSelector((state) => state.cart.total);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);

  const megaRef = useRef(null);
  const mobileRef = useRef(null);

  // Close mega and mobile on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !(megaRef.current as HTMLElement).contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (mobileRef.current && !(mobileRef.current as HTMLElement).contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on mount/route change (simple reset)
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop?search=${search}`);
    setMegaOpen(false);
    setMobileOpen(false);
  };

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageSearching(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];

        const response = await axios.post("/api/search-by-image", {
          image: base64,
          mimeType: file.type,
        });

        const description = response.data.description;
        router.push(`/shop?search=${encodeURIComponent(description)}`);
        setMegaOpen(false);
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

  const goToCategory = (cat: string) => {
    router.push(`/shop?category=${encodeURIComponent(cat)}`);
    setMegaOpen(false);
    setMobileOpen(false);
  };

  const storeCta = isSeller
    ? { label: "Store Dashboard", href: "/store", emoji: "🏪" }
    : { label: "Create a Store", href: "/create-store", emoji: "🏪" };

  const featuredLinks = [...FEATURED_LINKS, storeCta];

  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80"
      ref={megaRef}
    >
      {/* Top bar: neutral (matches theme toggle) */}
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4">
          {/* Logo */}
          <Link
            href="/"
            className="relative flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src={shpinxLogo}
              alt="Shpinx"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-4xl font-semibold text-slate-400 hidden sm:inline">
              <span className="text-gray-600 dark:text-gray-300">Shp</span>
              inx
              <span className="text-gray-600 dark:text-gray-300 text-5xl leading-0">
                .
              </span>
            </span>
            <p className="absolute text-xs font-semibold -top-1 sm:-right-8 -right-6 px-3 py-0.5 rounded-full text-white bg-gray-500">
              .NG
            </p>
            <Show when={{ plan: "plus" }}>
              <p className="absolute text-xs font-semibold -top-1 sm:-right-8 -right-6 px-3 py-0.5 rounded-full text-white bg-indigo-500">
                Plus
              </p>
            </Show>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4 xl:gap-6 text-slate-600 dark:text-slate-300 text-sm">
            <div className="flex items-center gap-3 lg:gap-4">
              <Link
                href="/"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                Home
              </Link>

              {/* Mega menu trigger - now behaves like Wildberries "catalog" */}
              <button
                onClick={() => setMegaOpen((v) => !v)}
                className={`flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition font-medium ${
                  megaOpen ? "text-slate-900 dark:text-white" : ""
                }`}
              >
                Shop
                <ChevronDownIcon
                  size={14}
                  className={`transition-transform duration-200 ${
                    megaOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <Link
                href="/contact"
                className="hover:text-slate-900 dark:hover:text-white transition"
              >
                Contact
              </Link>
              {isSeller && (
                <Link
                  href="/store"
                  className="hover:text-slate-900 dark:hover:text-white transition font-medium whitespace-nowrap"
                >
                  Store Dashboard
                </Link>
              )}
            </div>

            {/* Search (desktop) */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex items-center text-sm gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-full w-56 xl:w-72 border border-transparent dark:border-slate-800"
            >
              <Search size={15} className="text-slate-500 shrink-0" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-400 text-slate-700 dark:text-slate-200"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              />
              <label
                className={`cursor-pointer ${
                  imageSearching ? "opacity-50" : ""
                }`}
              >
                <Camera
                  size={15}
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

            {/* Right side icons + profile */}
            <div className="flex items-center gap-2 xl:gap-3">
              <Link
                href="/wishlist"
                className="relative flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap"
              >
                <HeartIcon size={16} />
                <span className="hidden xl:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 left-2.5 text-[8px] text-white bg-red-500 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/cart"
                className="relative flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition whitespace-nowrap"
              >
                <ShoppingCart size={16} />
                <span className="hidden xl:inline">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 left-2 text-[8px] text-white bg-slate-700 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              <ThemeToggle />

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden xl:inline-flex px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 transition text-white text-sm font-semibold whitespace-nowrap"
                >
                  Admin Dashboard
                </Link>
              )}

              {!user ? (
                <button
                  onClick={openSignIn}
                  className="px-5 xl:px-6 py-2 bg-slate-900 hover:bg-slate-800 transition text-white rounded-full text-sm whitespace-nowrap"
                >
                  Login
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
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
              )}
            </div>
          </div>

          {/* Mobile controls */}
          <div className="sm:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <ThemeToggle compact />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-200"
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-800" />

      {/* ─── Mega menu (desktop) ─── */}
      {megaOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-950 shadow-2xl border-t border-slate-100 dark:border-slate-800 z-50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-12 gap-8">
              {/* Categories grid (as left panel) */}
              <div className="col-span-7">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
                  Browse by Category
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => goToCategory(cat.name)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition text-left group"
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 shrink-0">
                        <cat.icon size={16} className={cat.color} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                          {cat.name}
                        </p>
                        <p className="text-xs text-slate-400">{cat.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured + search */}
              <div className="col-span-5 border-l border-slate-100 dark:border-slate-800 pl-8">
                {/* Search in mega menu */}
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-full mb-6"
                >
                  <Search size={15} className="text-slate-400 shrink-0" />
                  <input
                    className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    required
                  />
                </form>

                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                  Quick Links
                </p>
                <div className="space-y-1">
                  {featuredLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition group"
                    >
                      <span className="text-base">{link.emoji}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                        {link.label}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                    🚀 Sell on Shpinx
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Reach thousands of buyers across Nigeria
                  </p>
                  <Link
                    href={storeCta.href}
                    onClick={() => setMegaOpen(false)}
                    className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-4 py-1.5 rounded-full transition inline-block"
                  >
                    {isSeller ? "Go to dashboard →" : "Open your store →"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-950 shadow-xl border-t border-slate-100 dark:border-slate-800 z-50 max-h-[85vh] overflow-y-auto" ref={mobileRef}>
          <div className="p-4 space-y-4">
            {/* Search */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-full border border-transparent dark:border-slate-800"
            >
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700 dark:text-slate-200"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                required
              />
            </form>

            {/* Top links */}
            <div className="grid grid-cols-4 gap-2">
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
                  className="relative flex flex-col items-center gap-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <item.icon size={18} />
                  <span className="text-xs">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 text-[9px] text-white bg-red-500 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {(isSeller || isAdmin) && (
              <div className="grid grid-cols-2 gap-2">
                {isSeller && (
                  <Link
                    href="/store"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium"
                  >
                    <StoreIcon size={16} />
                    Store Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 p-3 bg-green-500 rounded-xl text-white hover:bg-green-600 transition text-sm font-semibold"
                  >
                    <ShieldCheckIcon size={16} />
                    Admin Dashboard
                  </Link>
                )}
              </div>
            )}

            {/* Auth */}
            {!user ? (
              <button
                onClick={() => {
                  openSignIn();
                  setMobileOpen(false);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition"
              >
                Login / Sign Up
              </button>
            ) : (
              <div className="flex items-center gap-3 px-1">
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

            {/* Categories */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => goToCategory(cat.name)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      <cat.icon size={13} className={cat.color} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Quick Links
              </p>
              <div className="space-y-0.5">
                {featuredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    <span>{link.emoji}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-200">
                      {link.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-transparent dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                🚀 Sell on Shpinx
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 mb-3">
                Reach buyers across Nigeria
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
    </nav>
  );
};

export default Navbar;
