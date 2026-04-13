/**
 * __tests__/lib/cartSlice.test.js
 * Tests for the cart Redux slice reducer logic.
 */

const cartReducer = require('../../lib/features/cart/cartSlice').default;
const { addToCart, removeFromCart, deleteItemFromCart, clearCart } = require('../../lib/features/cart/cartSlice');

const initialState = { total: 0, cartItems: {} };

describe('cart reducer', () => {
  test('initializes with empty cart', () => {
    const state = cartReducer(undefined, { type: '@@INIT' });
    expect(state.cartItems).toEqual({});
    expect(state.total).toBe(0);
  });

  test('addToCart adds a product', () => {
    const state = cartReducer(initialState, addToCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBe(1);
    expect(state.total).toBe(1);
  });

  test('addToCart increments existing product', () => {
    const stateWithItem = { total: 1, cartItems: { p1: 1 } };
    const state = cartReducer(stateWithItem, addToCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBe(2);
    expect(state.total).toBe(2);
  });

  test('removeFromCart decrements count', () => {
    const stateWithItem = { total: 2, cartItems: { p1: 2 } };
    const state = cartReducer(stateWithItem, removeFromCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBe(1);
    expect(state.total).toBe(1);
  });

  test('removeFromCart removes item when count reaches 0', () => {
    const stateWithItem = { total: 1, cartItems: { p1: 1 } };
    const state = cartReducer(stateWithItem, removeFromCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBeUndefined();
    expect(state.total).toBe(0);
  });

  test('deleteItemFromCart removes product entirely', () => {
    const stateWithItems = { total: 5, cartItems: { p1: 3, p2: 2 } };
    const state = cartReducer(stateWithItems, deleteItemFromCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBeUndefined();
    expect(state.cartItems['p2']).toBe(2);
    expect(state.total).toBe(2);
  });

  test('clearCart empties everything', () => {
    const stateWithItems = { total: 5, cartItems: { p1: 3, p2: 2 } };
    const state = cartReducer(stateWithItems, clearCart());
    expect(state.cartItems).toEqual({});
    expect(state.total).toBe(0);
  });

  test('total stays consistent across multiple operations', () => {
    let state = initialState;
    state = cartReducer(state, addToCart({ productId: 'p1' }));
    state = cartReducer(state, addToCart({ productId: 'p1' }));
    state = cartReducer(state, addToCart({ productId: 'p2' }));
    expect(state.total).toBe(3);

    state = cartReducer(state, removeFromCart({ productId: 'p1' }));
    expect(state.total).toBe(2);
  });
});
