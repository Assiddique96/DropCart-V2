import { createSlice } from '@reduxjs/toolkit'

const KEY = 'dropcart_recently_viewed'
const MAX = 8

const load = () => {
    try {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(KEY)
        return stored ? JSON.parse(stored) : []
    } catch { return [] }
}

const save = (ids) => {
    try {
        if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {}
}

const recentlyViewedSlice = createSlice({
    name: 'recentlyViewed',
    initialState: { ids: [] },
    reducers: {
        initRecentlyViewed: (state) => {
            state.ids = load()
        },
        addRecentlyViewed: (state, action) => {
            const id = action.payload
            const filtered = state.ids.filter(i => i !== id)
            state.ids = [id, ...filtered].slice(0, MAX)
            save(state.ids)
        },
        clearRecentlyViewed: (state) => {
            state.ids = []
            save([])
        },
    },
})

export const { initRecentlyViewed, addRecentlyViewed, clearRecentlyViewed } = recentlyViewedSlice.actions
export default recentlyViewedSlice.reducer
