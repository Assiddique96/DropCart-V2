import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const MAX = 100

const countUnread = (items) => items.filter((item) => !item.read).length

export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async () => {
        const { data } = await axios.get('/api/notifications')
        return data.notifications || []
    }
)

export const createNotification = createAsyncThunk(
    'notifications/createNotification',
    async (payload) => {
        const { data } = await axios.post('/api/notifications', payload)
        return data.notification
    }
)

export const markNotificationAsRead = createAsyncThunk(
    'notifications/markNotificationAsRead',
    async (id) => {
        await axios.patch(`/api/notifications/${id}`)
        return id
    }
)

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllNotificationsRead',
    async () => {
        await axios.patch('/api/notifications')
        return true
    }
)

export const clearAllNotifications = createAsyncThunk(
    'notifications/clearAllNotifications',
    async () => {
        await axios.delete('/api/notifications')
        return true
    }
)

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        unreadCount: 0,
        loaded: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.items = (action.payload || []).slice(0, MAX)
                state.unreadCount = countUnread(state.items)
                state.loaded = true
            })
            .addCase(createNotification.fulfilled, (state, action) => {
                if (!action.payload) return
                state.items = [action.payload, ...state.items.filter((item) => item.id !== action.payload.id)].slice(0, MAX)
                state.unreadCount = countUnread(state.items)
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const item = state.items.find((notif) => notif.id === action.payload)
                if (item) item.read = true
                state.unreadCount = countUnread(state.items)
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach((item) => { item.read = true })
                state.unreadCount = 0
            })
            .addCase(clearAllNotifications.fulfilled, (state) => {
                state.items = []
                state.unreadCount = 0
            })
    },
})

export default notificationsSlice.reducer
