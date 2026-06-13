"use client"
import Image from "next/image";
import {
  PackageIcon, Search, ShoppingCart, HeartIcon,
  ChevronDownIcon, MonitorIcon, ShirtIcon, HomeIcon,
  SparklesIcon, ToyBrickIcon, DumbbellIcon, BookOpenIcon,
  UtensilsIcon, PaletteIcon, GridIcon, PlaneIcon, MenuIcon, XIcon,
  StoreIcon, ShieldCheckIcon, CarIcon, BabyIcon, BriefcaseIcon, WrenchIcon, Camera,
  UserIcon, MapPinIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth, useClerk, useUser, UserButton } from "@clerk/nextjs";
import NotificationBell from './NotificationBell';
import axios from "axios";
import ThemeToggle from "./ThemeToggle";
import shpinxLogo from "@/assets/logo.png";

const CATEGORIES = [
  { name: "Electronics", icon: MonitorIcon, color: "text-blue-500", desc: "Phones, laptops, gadgets" },
  { name: "Clothing", icon: ShirtIcon, color: "text-rose-400", desc: "Fashion & apparel" },
  { name: "Home & Garden", icon: HomeIcon, color: "text-amber-500", desc: "Furniture & appliances" },
  { name: "Beauty & Health", icon: SparklesIcon, color: "text-violet-400", desc: "Skincare & wellness" },
  { name: "Toys & Games", icon: ToyBrickIcon, color: "text-yellow-500", desc: "Kids & family" },
  { name: "Sports & Outdoors", icon: DumbbellIcon, color: "text-emerald-500", desc: "Fitness & outdoor" },
  { name: "Books & Media", icon: BookOpenIcon, color: "text-slate-500", desc: "Books, music, movies" },
  { name: "Food & Beverage", icon: UtensilsIcon, color: "text-red-500", desc: "Groceries & beverages" },
  { name: "Hobbies & Crafts", icon: PaletteIcon, color: "text-teal-500", desc: "Art & DIY" },
  { name: "Automotive", icon: CarIcon, color: "text-cyan-500", desc: "Car parts & accessories" },
  { name: "Baby & Kids", icon: BabyIcon, color: "text-pink-400", desc: "Baby products & toys" },
  { name: "Pet Supplies", icon: HeartIcon, color: "text-emerald-500", desc: "Pet food & accessories" },
  { name: "Office Supplies", icon: BriefcaseIcon, color: "text-indigo-500", desc: "Office & stationery" },
  { name: "Industrial & Scientific", icon: WrenchIcon, color: "text-stone-500", desc: "Tools & equipment" },
  { name: "Travel & Luggage", icon: PlaneIcon, color: "text-indigo-500", desc: "Travel gear" },
  { name: "Others", icon: GridIcon, color: "text-gray-500", desc: "Everything else" },
]

const FEATURED_LINKS = [
  { label: "New Arrivals", href: "/shop?sort=newest", emoji: "✨" },
  { label: "Best Sellers", href: "/shop?sort=popular", emoji: "🔥" },
  { label: "Shipped from Abroad", href: "/shop?origin=abroad", emoji: "✈️" },
  { label: "Under ₦5,000", href: "/shop?maxPrice=5000", emoji: "💰" },
  { label: "Track Order", href: "/track", emoji: "📦" },
]

const Navbar = () => {
  const { user } = useUser()
  const { openSignIn } = useClerk()
  const { getToken } = useAuth()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [imageSearching, setImageSearching] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const cartCount = useSelector(state => state.cart.total)
  const wishlistCount = useSelector(state => state.wishlist.items.length)
  const sidebarRef = useRef()
  const mobileRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) setSidebarOpen(false)
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => { setSidebarOpen(false); setMobileOpen(false) }, [])

  useEffect(() => {
    let active = true

    const fetchRoles = async () => {
      if (!user) {
        if (!active) return
        setIsAdmin(false)
        setIsSeller(false)
        return
      }

      try {
        const token = await getToken()
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        const sellerRes = await axios.get("/api/store/is-seller", { headers })
        if (!active) return

        setIsSeller(Boolean(sellerRes.data?.isSeller))
      } catch {
        if (!active) return
        setIsSeller(false)
      }
    }

    fetchRoles()
    return () => { active = false }
  }, [user, getToken])

  const handleSearch = (e) => {
    e.preventDefault()
    router.push(`/shop?search=${search}`)
    setSidebarOpen(false)
    setMobileOpen(false)
  }

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageSearching(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]

        const response = await axios.post('/api/search-by-image', {
          image: base64,
          mimeType: file.type
        })

        const description = response.data.description
        router.push(`/shop?search=${encodeURIComponent(description)}`)
        setSidebarOpen(false)
        setMobileOpen(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image search failed:', error)
      router.push(`/shop?search=image`)
    }
    setImageSearching(false)
    e.target.value = ''
  }

  const goToCategory = (cat) => {
    router.push(`/shop?category=${encodeURIComponent(cat)}`)
    setSidebarOpen(false)
    setMobileOpen(false)
  }

  const storeCta = isSeller
    ? { label: "Store Dashboard", href: "/store", emoji: "🏪" }
    : { label: "Create a Store", href: "/create-store", emoji: "🏪" }

  const featuredLinks = [...FEATURED_LINKS, storeCta]

  return (
    <nav className="relative z-50" ref={sidebarRef}>
      {/* ─── Header: neutral, matches theme toggle ─── */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            
            {/* Logo & Sidebar Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg transition text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Open menu"
              >
                <MenuIcon size={24} />
              </button>
              
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <Image 
                  src={shpinxLogo} 
                  alt="Shpinx" 
                  width={36} 
                  height={36}
                  className="w-9 h-9 rounded-lg"
                />
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 hidden sm:inline">
                  Shpinx<span className="text-slate-400">.NG</span>
                </span>
              </Link>
            </div>

            {/* Location selector */}
            <div className="hidden lg:flex items-center gap-1.5 text-slate-600 dark:text-slate-200 text-sm px-3 py-2 rounded-lg cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <MapPinIcon size={16} />
              <span>Нигерия</span>
              <ChevronDownIcon size={14} />
            </div>

            {/* Central search bar */}
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 rounded-full px-4 py-2.5 w-full max-w-xl mx-4"
            >
              <Search size={18} className="text-slate-500 shrink-0" />
              <input
                className="w-full bg-transparent outline-none placeholder-slate-400 text-slate-800 dark:text-slate-100 text-sm"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                required
              />
              abel className={`cursor-pointer ${imageSearching ? 'opacity-50' : ''} hidden md:block`}>
                <Camera size={18} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSearch}
                  disabled={imageSearching}
                  className="hidden"
                />
              </label>
            </form>

            {/* Right icons + theme toggle */}
            <div className="flex items-center gap-2 lg:gap-4">
              <div className="hidden md:flex items-center gap-1 text-slate-600 dark:text-slate-200 text-xs px-2 py-1.5 rounded-lg cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <MapPinIcon size={14} />
                <span className="hidden lg:inline">NG</span>
              </div>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative flex items-center justify-center p-2 rounded-lg transition text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <HeartIcon size={22} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center justify-center p-2 rounded-lg transition text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-[9px] text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Theme toggle (kept neutral) */}
              <ThemeToggle />

              {/* Profile */}
              {!user ? (
                <button
                  onClick={openSignIn}
                  className="hidden lg:flex px-4 py-2 bg-slate-900 text-white rounded-lg transition text-sm font-semibold whitespace-nowrap hover:bg-slate-800"
                >
                  Войти
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <NotificationBell className="text-slate-600 dark:text-slate-200" />
                  <UserButton>
                    <UserButton.MenuItems>
                      {isSeller && (
                        <UserButton.Action
                          labelIcon={<StoreIcon size={16} />}
                          label="Store Dashboard"
                          onClick={() => router.push('/store')}
                        />
                      )}
                      {isAdmin && (
                        <UserButton.Action
                          labelIcon={<ShieldCheckIcon size={16} />}
                          label="Admin Dashboard"
                          onClick={() => router.push('/admin')}
                        />
                      )}
                      <UserButton.Action labelIcon={<PackageIcon size={16} />} label="My Orders" onClick={() => router.push('/orders')} />
                      <UserButton.Action labelIcon={<HeartIcon size={16} />} label="Wishlist" onClick={() => router.push('/wishlist')} />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className="sm:hidden p-2 rounded-lg transition text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Secondary navigation bar (neutral) ─── */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/"
                className="text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
              >
                Home
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition font-medium"
              >
                <ShirtIcon size={16} />
                Categories
                <ChevronDownIcon size={14} />
              </button>
              <Link
                href="/contact"
                className="text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition"
              >
                Contact
              </Link>
              {isSeller && (
                <Link
                  href="/store"
                  className="text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition font-medium"
                >
                  Store Dashboard
                </Link>
              )}
            </div>

            <div className="hidden sm:block">
              {/* You can keep a mini CTA or leave empty for ultra-minimal */}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sidebar dropdown (neutral) ─── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" />
          
          <div className="absolute left-0 top-0 h-full w-80 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl overflow-y-auto">
            {/* Sidebar header */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Image 
                  src={shpinxLogo} 
                  alt="Shpinx" 
                  width={32} 
                  height={32}
                  className="w-8 h-8 rounded-lg"
                />
                <span className="text-lg font-bold">Shpinx</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg transition text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XIcon size={22} />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                    <UserIcon size={20} className="text-slate-700 dark:text-slate-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {user.firstName || "User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Quick Links</p>
              <div className="space-y-1">
                {featuredLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                  >
                    <span className="text-base">{link.emoji}</span>
                    <span className="text-sm">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Categories</p>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => goToCategory(cat.name)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition text-left"
                  >
                    at.icon size={18} className={cat.color} />
                    <div>
                      <p className="text-sm font-medium">{cat.name}</p>
                      <p className="text-xs text-slate-400">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboards */}
            {(isSeller || isAdmin) && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Dashboards</p>
                <div className="space-y-1">
                  {isSeller && (
                    <Link
                      href="/store"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                    >
                      <StoreIcon size={18} className="text-indigo-500" />
                      <span className="text-sm">Store Dashboard</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                    >
                      <ShieldCheckIcon size={18} className="text-emerald-500" />
                      <span className="text-sm">Admin Dashboard</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Auth */}
            {!user && (
              <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => { openSignIn(); setSidebarOpen(false) }}
                  className="w-full py-2.5 bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-semibold transition"
                >
                  Войти / Sign Up
                </button>
              </div>
            )}

            {/* Sell promo */}
            <div className="px-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">🚀 Sell on Shpinx</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-3">Reach thousands of buyers across Nigeria</p>
                <Link
                  href={storeCta.href}
                  onClick={() => setSidebarOpen(false)}
                  className="text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg inline-block transition"
                >
                  {isSeller ? "Go to dashboard →" : "Open your store →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile menu (neutral) ─── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50" ref={mobileRef}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 top-0 h-full w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Search */}
              <form
                onSubmit={handleSearch}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 rounded-full"
              >
                <Search size={18} className="text-slate-500 shrink-0" />
                <input
                  className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-800 dark:text-slate-100"
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="relative flex flex-col items-center gap-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <item.icon size={20} />
                    <span className="text-xs">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 text-[9px] text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Categories</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.name}
                      onClick={() => goToCategory(cat.name)}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                    >
                      at.icon size={16} className={cat.color} />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Quick Links</p>
                <div className="space-y-0.5">
                  {featuredLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <span>{link.emoji}</span>
                      <span className="text-sm text-slate-700 dark:text-slate-100">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Auth */}
              {!user ? (
                <button
                  onClick={() => { openSignIn(); setMobileOpen(false) }}
                  className="w-full py-2.5 bg-slate-900 dark:bg-indigo-500 hover:bg-slate-800 dark:hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition"
                >
                  Login / Sign Up
                </button>
              ) : (
                <div className="flex items-center gap-3 px-1">
                  <UserButton>
                    <UserButton.MenuItems>
                      {isSeller && (
                        <UserButton.Action labelIcon={<StoreIcon size={16} />} label="Store Dashboard" onClick={() => router.push('/store')} />
                      )}
                      {isAdmin && (
                        <UserButton.Action labelIcon={<ShieldCheckIcon size={16} />} label="Admin Dashboard" onClick={() => router.push('/admin')} />
                      )}
                      <UserButton.Action labelIcon={<PackageIcon size={16} />} label="My Orders" onClick={() => router.push('/orders')} />
                      <UserButton.Action labelIcon={<HeartIcon size={16} />} label="Wishlist" onClick={() => router.push('/wishlist')} />
                    </UserButton.MenuItems>
                  </UserButton>
                  <p className="text-sm text-slate-700 dark:text-slate-200">Hi, {user.firstName || "there"}!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
