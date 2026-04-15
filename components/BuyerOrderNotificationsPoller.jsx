'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { addNotification } from '@/lib/features/notifications/notificationsSlice'
import { buildBuyerOrderNotifications } from '@/lib/orderChangeNotifications'

const POLL_MS = 45_000

/**
 * Polls buyer orders and pushes in-app notifications when status or refund changes.
 */
export default function BuyerOrderNotificationsPoller() {
    const { getToken, isSignedIn } = useAuth()
    const dispatch = useDispatch()
    const snapshotRef = useRef(null)
    const initializedRef = useRef(false)

    useEffect(() => {
        if (!isSignedIn) {
            snapshotRef.current = null
            initializedRef.current = false
            return
        }

        let cancelled = false

        const tick = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/orders', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (cancelled) return
                const orders = data.orders || []
                const previous = snapshotRef.current || {}
                const initialized = initializedRef.current
                const { notifications, map } = buildBuyerOrderNotifications(previous, orders, initialized)
                snapshotRef.current = map
                initializedRef.current = true
                for (const n of notifications) {
                    dispatch(addNotification(n))
                }
            } catch {
                /* ignore — session or network */
            }
        }

        tick()
        const id = setInterval(tick, POLL_MS)
        return () => {
            cancelled = true
            clearInterval(id)
        }
    }, [isSignedIn, getToken, dispatch])

    return null
}
