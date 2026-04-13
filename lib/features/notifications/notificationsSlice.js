/**
 * In-app notification center.
 * Notifications are ephemeral (in-memory only, cleared on refresh).
 * Push persistent notifications via addNotification({ title, message, type, link }).
 *
 * Types: 'order' | 'review' | 'system' | 'payout'
 */
import { createSlice } from '@reduxjs/toolkit'

const MAX = 50

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
    },
    reducers: {
        addNotification: (state, action) => {
            const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                read: false,
                createdAt: new Date().toISOString(),
                type: 'system',
                ...action.payload,
            }
            state.items = [notification, ...state.items].slice(0, MAX)
            state.unreadCount = state.items.filter(n => !n.read).length
        },
        markAsRead: (state, action) => {
            const id = action.payload
            const notif = state.items.find(n => n.id === id)
            if (notif) notif.read = true
            state.unreadCount = state.items.filter(n => !n.read).length
        },
        markAllRead: (state) => {
            state.items.forEach(n => { n.read = true })
            state.unreadCount = 0
        },
        clearNotifications: (state) => {
            state.items = []
            state.unreadCount = 0
        },
    },
})

export const { addNotification, markAsRead, markAllRead, clearNotifications } = notificationsSlice.actions
export default notificationsSlice.reducer
