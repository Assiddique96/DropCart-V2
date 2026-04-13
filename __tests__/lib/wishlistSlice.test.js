/**
 * __tests__/lib/wishlistSlice.test.js
 * Tests for the wishlist Redux slice (pure reducer logic, no localStorage mock needed).
 */

// Mock localStorage before importing the slice
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const wishlistReducer = require('../../lib/features/wishlist/wishlistSlice').default;
const { toggleWishlist, clearWishlist } = require('../../lib/features/wishlist/wishlistSlice');

const initialState = { items: [] };

describe('wishlist reducer', () => {
  test('starts with empty items', () => {
    const state = wishlistReducer(undefined, { type: '@@INIT' });
    expect(state.items).toEqual([]);
  });

  test('toggleWishlist adds a product id', () => {
    const state = wishlistReducer(initialState, toggleWishlist('product-1'));
    expect(state.items).toContain('product-1');
  });

  test('toggleWishlist removes an existing product id', () => {
    const stateWithItem = { items: ['product-1'] };
    const state = wishlistReducer(stateWithItem, toggleWishlist('product-1'));
    expect(state.items).not.toContain('product-1');
  });

  test('toggleWishlist adds new product without removing others', () => {
    const stateWithItem = { items: ['product-1'] };
    const state = wishlistReducer(stateWithItem, toggleWishlist('product-2'));
    expect(state.items).toContain('product-1');
    expect(state.items).toContain('product-2');
  });

  test('clearWishlist empties the list', () => {
    const stateWithItems = { items: ['product-1', 'product-2'] };
    const state = wishlistReducer(stateWithItems, clearWishlist());
    expect(state.items).toHaveLength(0);
  });

  test('toggle is idempotent: adding twice removes', () => {
    let state = wishlistReducer(initialState, toggleWishlist('product-1'));
    state = wishlistReducer(state, toggleWishlist('product-1'));
    expect(state.items).not.toContain('product-1');
  });

  test('persists to localStorage when toggling', () => {
    localStorageMock.clear();
    wishlistReducer(initialState, toggleWishlist('product-abc'));
    const stored = localStorageMock.getItem('dropcart_wishlist');
    expect(stored).toContain('product-abc');
  });
});
