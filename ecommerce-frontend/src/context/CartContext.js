
// ecommerce-frontend/src/context/CartContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id); // Use _id instead of id
      // Ensure price is a number and normalize product object
      const normalizedProduct = {
        ...product,
        price: Number(product.price) || 0, // Default to 0 if price is invalid
      };
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id)); // Use _id instead of id
  };

  const updateQuantity = (id, quantity) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared!', {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);






























































/* // ecommerce-frontend/src/context/CartContext.js
import { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      if (!token) {
        setCart([]);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/cart');
        const cartData = Array.isArray(res.data) ? res.data : [];
        setCart(cartData.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 1
        })));
      } catch (err) {
        console.error('Fetch Cart Error:', err.response?.data);
        setCart([]);
        toast.error('Failed to load cart', {
          position: 'top-right',
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [token]);

  const addToCart = async (product) => {
    if (!token) {
      toast.error('Please log in to add items to cart', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    try {
      const normalizedProduct = { ...product, price: Number(product.price) };
      const res = await api.post('/cart', {
        productId: normalizedProduct.id,
        quantity: 1,
      });
      const cartData = Array.isArray(res.data) ? res.data : [];
      setCart(cartData.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 1
      })));
      toast.success(`${product.name} added to cart!`, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err) {
      console.error('Add to Cart Error:', err.response?.data);
      toast.error('Failed to add item to cart', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const removeFromCart = async (id) => {
    if (!token) return;
    try {
      const res = await api.delete(`/cart/${id}`);
      const cartData = Array.isArray(res.data) ? res.data : [];
      setCart(cartData.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 1
      })));
    } catch (err) {
      console.error('Remove from Cart Error:', err.response?.data);
      toast.error('Failed to remove item from cart', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (!token) return;
    try {
      const res = await api.put(`/cart/${id}`, { quantity: Math.max(1, quantity) });
      const cartData = Array.isArray(res.data) ? res.data : [];
      setCart(cartData.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 1
      })));
    } catch (err) {
      console.error('Update Quantity Error:', err.response?.data);
      toast.error('Failed to update quantity', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const clearCart = async () => {
    if (!token) return;
    try {
      const res = await api.delete('/cart');
      const cartData = Array.isArray(res.data) ? res.data : [];
      setCart(cartData.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 1
      })));
      toast.info('Cart cleared!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Clear Cart Error:', err.response?.data);
      toast.error('Failed to clear cart', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext); */