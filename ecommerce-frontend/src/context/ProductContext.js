import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:5001/api/products');
      console.log('Raw product data from backend:', res.data); // Debug raw data
      const fetchedProducts = res.data.map((item) => {
        // Ensure image is a string and prepend base URL if it exists
        const image = item.image && typeof item.image === 'string'
          ? `http://localhost:5001${item.image}`
          : 'https://placehold.co/150?text=No+Image';

        // Ensure images array contains valid URLs
        const images = item.images && Array.isArray(item.images)
          ? item.images.map(img => typeof img === 'string' ? `http://localhost:5001${img}` : 'https://placehold.co/150?text=No+Image')
          : [];

        return {
          _id: item._id,
          name: item.name,
          price: Number(item.price) || 0,
          stock: item.stock || 0,
          image,
          images,
          category: item.category || 'Uncategorized',
          featured: item.featured || false,
          description: item.description || '',
          brand: item.brand || '',
          weight: item.weight || 0,
          model: item.model || '',
        };
      });
      console.log('Processed products:', fetchedProducts); // Debug processed data
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);



















































/* // ecommerce-frontend/src/context/ProductContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://localhost:5001/api/products');
      console.log('Raw product data from backend:', res.data); // Debug raw data
      const fetchedProducts = res.data.map((item) => ({
        _id: item._id,
        name: item.name,
        price: Number(item.price) || 0,
        stock: item.stock || 0,
        image: item.image ? `http://localhost:5001${item.image}` : '', // Prepend base URL
        images: item.images ? item.images.map(img => `http://localhost:5001${img}`) : [],
        category: item.category || 'Uncategorized',
        featured: item.featured || false,
        description: item.description || '',
        brand: item.brand || '',
        weight: item.weight || 0,
        model: item.model || '',
      }));
      console.log('Processed products:', fetchedProducts); // Debug processed data
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{ products, loading, error, fetchProducts }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext);
 */











































































/* // ecommerce-frontend/src/context/ProductContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        const fetchedProducts = res.data.map((item) => ({
          id: item._id, // MongoDB uses _id
          name: item.name || (item.title ? item.title.slice(0, 10) : 'Unnamed Product'),
          price: Number(item.price) || Math.floor(Math.random() * 1000) + 50,
          stock: item.stock === undefined ? true : Boolean(Number(item.stock) > 0),
          image: item.image || item.thumbnailUrl || 'https://via.placeholder.com/150',
          category: item.category || 'Uncategorized',
          featured: item.featured || false,
          specifications: item.specifications || {},
          description: item.description || 'No description available.',
          images: item.images || [],
        }));
        console.log('Fetched and processed products:', fetchedProducts);
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error fetching products:', err.response?.data || err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => useContext(ProductContext); */