'use client'
import {
    PackageIcon, Search, ShoppingCart, HeartIcon,
    ChevronDownIcon, MonitorIcon, ShirtIcon, HomeIcon,
    SparklesIcon, ToyBrickIcon, DumbbellIcon, BookOpenIcon,
    UtensilsIcon, PaletteIcon, GridIcon, PlaneIcon, MenuIcon, XIcon,
    StoreIcon, ShieldCheckIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useAuth, useClerk, useUser, UserButton, Show } from "@clerk/nextjs";
import NotificationBell from './NotificationBell';
import axios from "axios";

const CATEGORIES = [
    { name: "Electronics",        icon: MonitorIcon,    color: "text-blue-500",   bg: "bg-blue-50",   desc: "Phones, laptops, gadgets" },
    { name: "Clothing",           icon: ShirtIcon,      color: "text-pink-500",   bg: "bg-pink-50",   desc: "Fashion & apparel" },
    { name: "Home & Kitchen",     icon: HomeIcon,       color: "text-orange-500", bg: "bg-orange-50", desc: "Furniture & appliances" },
    { name: "Beauty & Health",    icon: SparklesIcon,   color: "text-purple-500", bg: "bg-purple-50", desc: "Skincare & wellness" },
    { name: "Toys & Games",       icon: ToyBrickIcon,   color: "text-yellow-500", bg: "bg-yellow-50", desc: "Kids & family" },
    { name: "Sports & Outdoors",  icon: DumbbellIcon,   color: "text-green-500",  bg: "bg-green-50",  desc: "Fitness & outdoor" },
    { name: "Books & Media",      icon: BookOpenIcon,   color: "text-slate-500",  bg: "bg-slate-50",  desc: "Books, music, movies" },
    { name: "Food & Drink",       icon: UtensilsIcon,   color: "text-red-500",    bg: "bg-red-50",    desc: "Groceries & beverages" },
    { name: "Hobbies & Crafts",   icon: PaletteIcon,    color: "text-teal-500",   bg: "bg-teal-50",   desc: "Art & DIY" },
    { name: "Others",             icon: GridIcon,       color: "text-indigo-500", bg: "bg-indigo-50", desc: "Everything else" },
]

const FEATURED_LINKS = [
    { label: "New Arrivals",      href: "/shop?sort=newest",              emoji: "✨" },
    { label: "Best Sellers",      href: "/shop?sort=popular",             emoji: "🔥" },
    { label: "Shipped from Abroad", href: "/shop?origin=abroad",          emoji: "✈️" },
    { label: "Under ₦5,000",      href: "/shop?maxPrice=5000",            emoji: "💰" },
    { label: "Deals & Coupons",   href: "/pricing",                       emoji: "🎟️" },
    { label: "Track Order",       href: "/track",                         emoji: "📦" },
]

const Navbar = () => {
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const { getToken } = useAuth()
    const router = useRouter()

    const [search, setSearch] = useState('')
    const [megaOpen, setMegaOpen] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const cartCount = useSelector(state => state.cart.total)
    const wishlistCount = useSelector(state => state.wishlist.items.length)
    const megaRef = useRef()
    const mobileRef = useRef()

    // Close mega menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (megaRef.current && !megaRef.current.contains(e.target)) setMegaOpen(false)
            if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    // Close on route change
    useEffect(() => { setMegaOpen(false); setMobileOpen(false) }, [])

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

                const [adminRes, sellerRes] = await Promise.allSettled([
                    axios.get("/api/admin/is-admin", { headers }),
                    axios.get("/api/store/is-seller", { headers }),
                ])

                if (!active) return

                setIsAdmin(adminRes.status === "fulfilled" ? Boolean(adminRes.value?.data?.isAdmin) : false)
                setIsSeller(sellerRes.status === "fulfilled" ? Boolean(sellerRes.value?.data?.isSeller) : false)
            } catch {
                if (!active) return
                setIsAdmin(false)
                setIsSeller(false)
            }
        }

        fetchRoles()
        return () => { active = false }
    }, [user, getToken])

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/shop?search=${search}`)
        setMegaOpen(false)
        setMobileOpen(false)
    }

    const goToCategory = (cat) => {
        router.push(`/shop?category=${encodeURIComponent(cat)}`)
        setMegaOpen(false)
        setMobileOpen(false)
    }

    const storeCta = isSeller
        ? { label: "Store Dashboard", href: "/store", emoji: "🏪" }
        : { label: "Create a Store", href: "/create-store", emoji: "🏪" }

    const featuredLinks = [...FEATURED_LINKS, storeCta]

    return (
        <nav className="relative bg-white z-50" ref={megaRef}>
            {/* ─── Main bar ─── */}
            <div className="mx-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto py-4">

                    {/* Logo */}
                    <Link href="/" className="relative text-4xl font-semibold text-slate-400 shrink-0" onClick={() => setMobileOpen(false)}>
                        <span className="text-gray-600">Drop</span>Cart<span className="text-gray-600 text-5xl leading-0">.</span>
                        <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 py-0.5 rounded-full text-white bg-gray-500">.NG</p>
                        <Show when={{ plan: 'plus' }}>
                            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 py-0.5 rounded-full text-white bg-indigo-500">Plus</p>
                        </Show>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden sm:flex items-center gap-4 lg:gap-6 text-slate-600 text-sm">
                        <Link href="/" className="hover:text-slate-900 transition">Home</Link>

                        {/* Categories mega menu trigger */}
                        <button
                            onClick={() => setMegaOpen(v => !v)}
                            className={`flex items-center gap-1 hover:text-slate-900 transition font-medium ${megaOpen ? 'text-slate-900' : ''}`}
                        >
                            Shop
                            <ChevronDownIcon size={14} className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
                        <Link href="/contact" className="hover:text-slate-900 transition">Contact</Link>
                        {isSeller && (
                            <Link href="/store" className="hover:text-slate-900 transition font-medium">
                                Store Dashboard
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 transition text-white text-sm font-semibold"
                            >
                                Admin Dashboard
                            </Link>
                        )}

                        <Link href="/wishlist" className="relative flex items-center gap-1.5 hover:text-slate-900 transition">
                            <HeartIcon size={16} />
                            Wishlist
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1.5 left-2.5 text-[8px] text-white bg-red-500 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="hidden xl:flex items-center text-sm gap-2 bg-slate-100 px-4 py-2.5 rounded-full min-w-48">
                            <Search size={15} className="text-slate-500 shrink-0" />
                            <input
                                className="w-full bg-transparent outline-none placeholder-slate-400 text-slate-700"
                                type="text" placeholder="Search products..."
                                value={search} onChange={e => setSearch(e.target.value)} required
                            />
                        </form>

                        {/* Cart */}
                        <Link href="/cart" className="relative flex items-center gap-1.5 hover:text-slate-900 transition">
                            <ShoppingCart size={16} />
                            Cart
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 left-2 text-[8px] text-white bg-slate-700 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Auth */}
                        {!user ? (
                            <button onClick={openSignIn}
                                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full text-sm">
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
                    </div>

                    {/* Mobile controls */}
                    <div className="sm:hidden flex items-center gap-2">
                        {user && <NotificationBell />}
                        <button onClick={() => setMobileOpen(v => !v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-600">
                            {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200" />

            {/* ─── Mega menu (desktop) ─── */}
            {megaOpen && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-slate-100 z-50">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="grid grid-cols-12 gap-8">

                            {/* Categories grid */}
                            <div className="col-span-7">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Browse by Category</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button key={cat.name} onClick={() => goToCategory(cat.name)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left group">
                                            <div className={`p-2 rounded-lg ${cat.bg} shrink-0`}>
                                                <cat.icon size={16} className={cat.color} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{cat.name}</p>
                                                <p className="text-xs text-slate-400">{cat.desc}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Featured + search */}
                            <div className="col-span-5 border-l border-slate-100 pl-8">
                                {/* Search in mega menu */}
                                <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-full mb-6">
                                    <Search size={15} className="text-slate-400 shrink-0" />
                                    <input
                                        className="w-full bg-transparent outline-none placeholder-slate-400 text-sm text-slate-700"
                                        type="text" placeholder="Search products..."
                                        value={search} onChange={e => setSearch(e.target.value)} required
                                    />
                                </form>

                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Quick Links</p>
                                <div className="space-y-1">
                                    {featuredLinks.map(link => (
                                        <Link key={link.href} href={link.href}
                                            onClick={() => setMegaOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition group">
                                            <span className="text-base">{link.emoji}</span>
                                            <span className="text-sm text-slate-600 group-hover:text-slate-900">{link.label}</span>
                                        </Link>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                    <p className="text-sm font-semibold text-indigo-800 mb-1">🚀 Sell on DropCart</p>
                                    <p className="text-xs text-indigo-600 mb-3">Reach thousands of buyers across Nigeria</p>
                                    <Link href={storeCta.href} onClick={() => setMegaOpen(false)}
                                        className="text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-full transition inline-block">
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
                <div className="sm:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 z-50 max-h-[85vh] overflow-y-auto" ref={mobileRef}>
                    <div className="p-4 space-y-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-full">
                            <Search size={15} className="text-slate-400 shrink-0" />
                            <input
                                className="w-full bg-transparent outline-none placeholder-slate-400 text-sm"
                                type="text" placeholder="Search products..."
                                value={search} onChange={e => setSearch(e.target.value)} required
                            />
                        </form>

                        {/* Top links */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: "Cart", href: "/cart", badge: cartCount, icon: ShoppingCart },
                                { label: "Wishlist", href: "/wishlist", badge: wishlistCount, icon: HeartIcon },
                                { label: "Orders", href: "/orders", icon: PackageIcon },
                                { label: "Track", href: "/track", icon: Search },
                            ].map(item => (
                                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                                    className="relative flex flex-col items-center gap-1 p-3 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition">
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
                                    <Link href="/store" onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl text-slate-700 hover:bg-slate-100 transition text-sm font-medium">
                                        <StoreIcon size={16} />
                                        Store Dashboard
                                    </Link>
                                )}
                                {isAdmin && (
                                    <Link href="/admin" onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-center gap-2 p-3 bg-green-500 rounded-xl text-white hover:bg-green-600 transition text-sm font-semibold">
                                        <ShieldCheckIcon size={16} />
                                        Admin Dashboard
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Auth */}
                        {!user ? (
                            <button onClick={() => { openSignIn(); setMobileOpen(false) }}
                                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition">
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
                                <p className="text-sm text-slate-600">Hi, {user.firstName || "there"}!</p>
                            </div>
                        )}

                        {/* Categories */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Categories</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                {CATEGORIES.map(cat => (
                                    <button key={cat.name} onClick={() => goToCategory(cat.name)}
                                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-left">
                                        <div className={`p-1.5 rounded-lg ${cat.bg} shrink-0`}>
                                            <cat.icon size={13} className={cat.color} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 leading-tight">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick links */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Quick Links</p>
                            <div className="space-y-0.5">
                                {featuredLinks.map(link => (
                                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition">
                                        <span>{link.emoji}</span>
                                        <span className="text-sm text-slate-600">{link.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                            <p className="text-sm font-semibold text-indigo-800">🚀 Sell on DropCart</p>
                            <p className="text-xs text-indigo-600 mt-0.5 mb-3">Reach buyers across Nigeria</p>
                            <Link href={storeCta.href} onClick={() => setMobileOpen(false)}
                                className="text-xs font-semibold text-white bg-indigo-500 px-4 py-1.5 rounded-full inline-block">
                                {isSeller ? "Go to dashboard →" : "Open your store →"}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Navbar
