import { createSlice } from '@reduxjs/toolkit'

// Safely load wishlist from localStorage (client-only)
const loadWishlist = () => {
    try {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem('dropcart_wishlist')
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

const saveWishlist = (items) => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dropcart_wishlist', JSON.stringify(items))
        }
    } catch {}
}

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: [], // array of product IDs
    },
    reducers: {
        initWishlist: (state) => {
            state.items = loadWishlist()
        },
        toggleWishlist: (state, action) => {
            const productId = action.payload
            const index = state.items.indexOf(productId)
            if (index === -1) {
                state.items.push(productId)
            } else {
                state.items.splice(index, 1)
            }
            saveWishlist(state.items)
        },
        clearWishlist: (state) => {
            state.items = []
            saveWishlist([])
        },
    },
})

export const { initWishlist, toggleWishlist, clearWishlist } = wishlistSlice.actions
export default wishlistSlice.reducer
