/**
 * __tests__/lib/cartSlice.test.js
 * Tests for the cart Redux slice reducer logic.
 */

const cartReducer = require('../../lib/features/cart/cartSlice').default;
const { addToCart, removeFromCart, deleteItemFromCart, clearCart } = require('../../lib/features/cart/cartSlice');

const initialState = { total: 0, cartItems: {}, items: [] };

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
    const stateWithItem = { total: 1, cartItems: { p1: 1 }, items: [{ productId: 'p1', quantity: 1, variants: {} }] };
    const state = cartReducer(stateWithItem, addToCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBe(2);
    expect(state.total).toBe(2);
  });

  test('removeFromCart decrements count', () => {
    const stateWithItem = { total: 2, cartItems: { p1: 2 }, items: [{ productId: 'p1', quantity: 2, variants: {} }] };
    const state = cartReducer(stateWithItem, removeFromCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBe(1);
    expect(state.total).toBe(1);
  });

  test('removeFromCart removes item when count reaches 0', () => {
    const stateWithItem = { total: 1, cartItems: { p1: 1 }, items: [{ productId: 'p1', quantity: 1, variants: {} }] };
    const state = cartReducer(stateWithItem, removeFromCart({ productId: 'p1' }));
    expect(state.cartItems['p1']).toBeUndefined();
    expect(state.total).toBe(0);
  });

  test('deleteItemFromCart removes product entirely', () => {
    const stateWithItems = {
      total: 5,
      cartItems: { p1: 3, p2: 2 },
      items: [
        { productId: 'p1', quantity: 3, variants: {} },
        { productId: 'p2', quantity: 2, variants: {} },
      ],
    };
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

  test('addToCart creates separate entries for different variants', () => {
    let state = initialState;
    state = cartReducer(state, addToCart({ productId: 'p1', variants: { Color: 'Red' } }));
    state = cartReducer(state, addToCart({ productId: 'p1', variants: { Color: 'Blue' } }));

    expect(state.items).toHaveLength(2);
    expect(state.cartItems['p1']).toBe(2);
  });

  test('removeFromCart decrements the correct variant entry', () => {
    const stateWithItems = {
      total: 2,
      cartItems: { p1: 2 },
      items: [
        { productId: 'p1', quantity: 1, variants: { Color: 'Red' } },
        { productId: 'p1', quantity: 1, variants: { Color: 'Blue' } },
      ],
    };
    const state = cartReducer(stateWithItems, removeFromCart({ productId: 'p1', variants: { Color: 'Red' } }));

    expect(state.items).toHaveLength(1);
    expect(state.cartItems['p1']).toBe(1);
    expect(state.items[0].variants.Color).toBe('Blue');
  });

  test('deleteItemFromCart removes the exact variant line', () => {
    const stateWithItems = {
      total: 2,
      cartItems: { p1: 2 },
      items: [
        { productId: 'p1', quantity: 1, variants: { Color: 'Red' } },
        { productId: 'p1', quantity: 1, variants: { Color: 'Blue' } },
      ],
    };
    const state = cartReducer(stateWithItems, deleteItemFromCart({ productId: 'p1', variants: { Color: 'Blue' } }));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].variants.Color).toBe('Red');
    expect(state.cartItems['p1']).toBe(1);
  });
});
