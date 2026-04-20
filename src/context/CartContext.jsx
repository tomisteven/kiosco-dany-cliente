import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [discount, setDiscount] = useState(0); // en %

  const addToCart = (product) => {
    const existItem = cartItems.find((x) => x.producto === product._id);
    if (existItem) {
      if (product.stock < existItem.cantidad + 1) {
         return false; // Sin stock
      }
      setCartItems(
        cartItems.map((x) =>
          x.producto === product._id ? { ...existItem, cantidad: existItem.cantidad + 1, subtotal: (existItem.cantidad + 1) * product.precioVenta } : x
        )
      );
    } else {
      if (product.stock < 1) return false;
      setCartItems([...cartItems, {
        producto: product._id,
        nombre: product.nombre,
        sku: product.sku,
        precioVenta: product.precioVenta,
        precioCompra: product.precioCompra,
        cantidad: 1,
        subtotal: product.precioVenta,
        stockMaximo: product.stock
      }]);
    }
    return true;
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return removeFromCart(productId);
    
    setCartItems(
      cartItems.map((x) =>
        x.producto === productId ? { ...x, cantidad: newQuantity, subtotal: newQuantity * x.precioVenta } : x
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((x) => x.producto !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const cartTotal = cartSubtotal - (cartSubtotal * (discount / 100));

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, discount, setDiscount, cartSubtotal, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
