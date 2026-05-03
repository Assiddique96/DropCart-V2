import { createSlice } from '@reduxjs/toolkit'
import { createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';

let debounceTimer = null;

const serializeVariants = (variants = {}) => {
  return JSON.stringify(Object.keys(variants).sort().reduce((acc, key) => {
    acc[key] = variants[key];
    return acc;
  }, {}));
};

const findCartItemIndex = (items, productId, variants = {}) => {
  const variantKey = serializeVariants(variants);
  return items.findIndex(item => item.productId === productId && serializeVariants(item.variants) === variantKey);
};

// API call to fetch cart items from backend and add to cart
export const uploadCart = createAsyncThunk
('cart/uploadCart',
async ({getToken}, thunkAPI) => {
    try {
        clearTimeout(debounceTimer);
        return await new Promise((resolve) => {
            debounceTimer = setTimeout(async () => {
                try {
                    const {items} = thunkAPI.getState().cart;
                    const token = await getToken();

                    if (!token) {
                        resolve(thunkAPI.rejectWithValue('Unauthorized'));
                        return;
                    }

                    await axios.post('/api/cart', {cart: items}, {
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
        items: [],  // array of { productId, quantity, variants? }
        cartItems: {},
        total: 0,
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, variants = {} } = action.payload
            const existingIndex = findCartItemIndex(state.items, productId, variants)
            if (existingIndex >= 0) {
                state.items[existingIndex].quantity++
            } else {
                state.items.push({ productId, quantity: 1, variants })
            }
            state.total = state.items.reduce((sum, item) => sum + item.quantity, 0)
            state.cartItems = state.items.reduce((obj, item) => {
                obj[item.productId] = (obj[item.productId] || 0) + item.quantity
                return obj
            }, {})
        },
        removeFromCart: (state, action) => {
            const { productId, variants = {} } = action.payload
            const existingIndex = findCartItemIndex(state.items, productId, variants)
            if (existingIndex >= 0) {
                state.items[existingIndex].quantity--
                if (state.items[existingIndex].quantity === 0) {
                    state.items.splice(existingIndex, 1)
                }
            }
            state.total = state.items.reduce((sum, item) => sum + item.quantity, 0)
            state.cartItems = state.items.reduce((obj, item) => {
                obj[item.productId] = (obj[item.productId] || 0) + item.quantity
                return obj
            }, {})
        },
        deleteItemFromCart: (state, action) => {
            const { productId, variants = {} } = action.payload
            state.items = state.items.filter(item => 
                !(item.productId === productId && serializeVariants(item.variants) === serializeVariants(variants))
            )
            state.total = state.items.reduce((sum, item) => sum + item.quantity, 0)
            state.cartItems = state.items.reduce((obj, item) => {
                obj[item.productId] = (obj[item.productId] || 0) + item.quantity
                return obj
            }, {})
        },
        clearCart: (state) => {
            state.items = []
            state.cartItems = {}
            state.total = 0
        },
    },
        extraReducers: (builder) => {
        builder.addCase(fetchCart.fulfilled, (state, action) => {
            const cartData = action.payload.cart || []
            if (Array.isArray(cartData)) {
                state.items = cartData
            } else {
                state.items = Object.entries(cartData).map(([productId, quantity]) => ({
                    productId,
                    quantity,
                    variants: {}
                }))
            }
            state.total = state.items.reduce((sum, item) => sum + item.quantity, 0)
            state.cartItems = state.items.reduce((obj, item) => {
                obj[item.productId] = (obj[item.productId] || 0) + item.quantity
                return obj
            }, {})
        });
        
    }
});

export const { addToCart, removeFromCart, clearCart, deleteItemFromCart } = cartSlice.actions

export default cartSlice.reducer
