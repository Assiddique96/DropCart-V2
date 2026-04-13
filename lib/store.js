import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import addressReducer from './features/address/addressSlice'
import ratingReducer from './features/rating/ratingSlice'
import wishlistReducer from './features/wishlist/wishlistSlice'
import recentlyViewedReducer from './features/recentlyViewed/recentlyViewedSlice'
import notificationsReducer from './features/notifications/notificationsSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            cart: cartReducer,
            product: productReducer,
            address: addressReducer,
            rating: ratingReducer,
            wishlist: wishlistReducer,
            recentlyViewed: recentlyViewedReducer,
            notifications: notificationsReducer,
        },
    })
}