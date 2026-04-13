import { createSlice } from '@reduxjs/toolkit'
import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';

let debounceTimer = null;


// API call to fetch cart items from backend and add to cart
export const uploadCart = createAsyncThunk
('cart/uploadCart',
async ({getToken}, thunkAPI) => {
    try {
        clearTimeout(debounceTimer);
        return await new Promise((resolve) => {
            debounceTimer = setTimeout(async () => {
                try {
                    const {cartItems} = thunkAPI.getState().cart;
                    const token = await getToken();

                    if (!token) {
                        resolve(thunkAPI.rejectWithValue('Unauthorized'));
                        return;
                    }

                    await axios.post('/api/cart', {cart: cartItems}, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    resolve({ success: true });
                } catch (error) {
                    resolve(thunkAPI.rejectWithValue(error.response?.data?.error || error.message));
                }
            }, 1000);
        });
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
    }
}
)

// fetch products from api and add to cart
export const fetchCart = createAsyncThunk
('cart/fetchCart',
async ({getToken}, thunkAPI) => {
    try {
        const token = await getToken();
        const {data} = await axios.get('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.error || error.message)
    }
}
)

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]++
            } else {
                state.cartItems[productId] = 1
            }
            state.total += 1
        },
        removeFromCart: (state, action) => {
            const { productId } = action.payload
            if (state.cartItems[productId]) {
                state.cartItems[productId]--
                if (state.cartItems[productId] === 0) {
                    delete state.cartItems[productId]
                }
            }
            state.total -= 1
        },
        deleteItemFromCart: (state, action) => {
            const { productId } = action.payload
            state.total -= state.cartItems[productId] ? state.cartItems[productId] : 0
            delete state.cartItems[productId]
        },
        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        },
    },
        extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            state.cartItems = action.payload.cart || {};
            state.total = Object.values(state.cartItems).reduce((acc, item) => acc + item, 0);
        });
    }
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
