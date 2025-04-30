import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products when the provider mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { category, subcategory, nestedCategory } = filters;
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      if (nestedCategory) params.append('nestedCategory', nestedCategory);

      const res = await axios.get(`https://backend-ps76.onrender.com/api/products?${params.toString()}`);
      console.log('Raw product data from backend:', res.data);
      const fetchedProducts = res.data.map((item) => {
        // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise use a placeholder
        const image =
          item.image && typeof item.image === 'string'
            ? item.image.startsWith('http://') || item.image.startsWith('https://')
              ? item.image
              : 'https://placehold.co/150?text=No+Image'
            : 'https://placehold.co/150?text=No+Image';

        // Handle additional images: Same logic as main image
        const images =
          item.images && Array.isArray(item.images)
            ? item.images.map((img) =>
                typeof img === 'string'
                  ? img.startsWith('http://') || img.startsWith('https://')
                    ? img
                    : 'https://placehold.co/150?text=No+Image'
                  : 'https://placehold.co/150?text=No+Image'
              )
            : [];

        // Handle variant images
        const variants =
          item.variants && Array.isArray(item.variants)
            ? item.variants.map((variant) => ({
                variantId: variant.variantId || '',
                mainImage:
                  variant.mainImage && typeof variant.mainImage === 'string'
                    ? variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://')
                      ? variant.mainImage
                      : 'https://placehold.co/150?text=No+Image'
                    : 'https://placehold.co/150?text=No+Image',
                additionalImages:
                  variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string'
                          ? img.startsWith('http://') || img.startsWith('https://')
                            ? img
                            : 'https://placehold.co/150?text=No+Image'
                          : 'https://placehold.co/150?text=No+Image'
                      )
                    : [],
                specifications: variant.specifications || {},
              }))
            : [];

        // Ensure sizes is an array
        const sizes = Array.isArray(item.sizes) ? item.sizes : [];

        return {
          _id: item._id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          discountedPrice: Number(item.discountedPrice) || 0,
          stock: Number(item.stock) || 0,
          image,
          images,
          variants, // Include variants with their images and specs
          category: item.category || 'Uncategorized',
          subcategory: item.subcategory || '',
          nestedCategory: item.nestedCategory || '',
          featured: item.featured || false,
          description: item.description || '',
          brand: item.brand || '',
          weight: Number(item.weight) || 0,
          weightUnit: item.weightUnit || 'kg',
          model: item.model || '',
          offer: item.offer || '',
          sizes,
          isActive: item.isActive !== undefined ? item.isActive : true,
          dealTag: item.dealTag || '',
          seller: item.seller || '',
          specifications: item.specifications || {},
          warranty: item.warranty || '',
          packOf: item.packOf || '',
        };
      });
      console.log('Processed products:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single product by ID (useful for ProductDetails.js)
  const fetchProductById = async (productId) => {
    try {
      const res = await axios.get(`https://backend-ps76.onrender.com/api/products/${productId}`);
      console.log('Raw product data for ID', productId, ':', res.data);
      const item = res.data;

      // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise use a placeholder
      const image =
        item.image && typeof item.image === 'string'
          ? item.image.startsWith('http://') || item.image.startsWith('https://')
            ? item.image
            : 'https://placehold.co/150?text=No+Image'
          : 'https://placehold.co/150?text=No+Image';

      // Handle additional images: Same logic as main image
      const images =
        item.images && Array.isArray(item.images)
          ? item.images.map((img) =>
              typeof img === 'string'
                ? img.startsWith('http://') || img.startsWith('https://')
                  ? img
                  : 'https://placehold.co/150?text=No+Image'
                : 'https://placehold.co/150?text=No+Image'
            )
          : [];

      // Handle variant images
      const variants =
        item.variants && Array.isArray(item.variants)
          ? item.variants.map((variant) => ({
              variantId: variant.variantId || '',
              mainImage:
                variant.mainImage && typeof variant.mainImage === 'string'
                  ? variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://')
                    ? variant.mainImage
                    : 'https://placehold.co/150?text=No+Image'
                  : 'https://placehold.co/150?text=No+Image',
              additionalImages:
                variant.additionalImages && Array.isArray(variant.additionalImages)
                  ? variant.additionalImages.map((img) =>
                      typeof img === 'string'
                        ? img.startsWith('http://') || img.startsWith('https://')
                          ? img
                          : 'https://placehold.co/150?text=No+Image'
                        : 'https://placehold.co/150?text=No+Image'
                    )
                  : [],
              specifications: variant.specifications || {},
            }))
          : [];

      const sizes = Array.isArray(item.sizes) ? item.sizes : [];

      const product = {
        _id: item._id || '',
        name: item.name || '',
        price: Number(item.price) || 0,
        discountedPrice: Number(item.discountedPrice) || 0,
        stock: Number(item.stock) || 0,
        image,
        images,
        variants, // Include variants with their images and specs
        category: item.category || 'Uncategorized',
        subcategory: item.subcategory || '',
        nestedCategory: item.nestedCategory || '',
        featured: item.featured || false,
        description: item.description || '',
        brand: item.brand || '',
        weight: Number(item.weight) || 0,
        weightUnit: item.weightUnit || 'kg',
        model: item.model || '',
        offer: item.offer || '',
        sizes,
        isActive: item.isActive !== undefined ? item.isActive : true,
        dealTag: item.dealTag || '',
        seller: item.seller || '',
        specifications: item.specifications || {},
        warranty: item.warranty || '',
        packOf: item.packOf || '',
      };

      console.log('Processed product:', product);
      return product;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch product');
    }
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);













































/* import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products when the provider mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('https://backend-ps76.onrender.com/api/products');
      console.log('Raw product data from backend:', res.data);
      const fetchedProducts = res.data.map((item) => {
        // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise prepend backend URL
        const image =
          item.image && typeof item.image === 'string'
            ? item.image.startsWith('http://') || item.image.startsWith('https://')
              ? item.image
              : `https://backend-ps76.onrender.com${item.image}`
            : 'https://placehold.co/150?text=No+Image';

        // Handle additional images: Same logic as main image
        const images =
          item.images && Array.isArray(item.images)
            ? item.images.map((img) =>
                typeof img === 'string'
                  ? img.startsWith('http://') || img.startsWith('https://')
                    ? img
                    : `https://backend-ps76.onrender.com${img}`
                  : 'https://placehold.co/150?text=No+Image'
              )
            : [];

        // Ensure sizes is an array
        const sizes = Array.isArray(item.sizes) ? item.sizes : [];

        return {
          _id: item._id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          image,
          images,
          category: item.category || 'Uncategorized',
          featured: item.featured || false,
          description: item.description || '',
          brand: item.brand || '',
          weight: Number(item.weight) || 0,
          model: item.model || '',
          offer: item.offer || '',
          sizes,
          isActive: item.isActive !== undefined ? item.isActive : true,
        };
      });
      console.log('Processed products:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single product by ID (useful for ProductDetails.js)
  const fetchProductById = async (productId) => {
    try {
      const res = await axios.get(`https://backend-ps76.onrender.com/api/products/${productId}`);
      console.log('Raw product data for ID', productId, ':', res.data);
      const item = res.data;

      // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise prepend backend URL
      const image =
        item.image && typeof item.image === 'string'
          ? item.image.startsWith('http://') || item.image.startsWith('https://')
            ? item.image
            : `https://backend-ps76.onrender.com${item.image}`
          : 'https://placehold.co/150?text=No+Image';

      // Handle additional images: Same logic as main image
      const images =
        item.images && Array.isArray(item.images)
          ? item.images.map((img) =>
              typeof img === 'string'
                ? img.startsWith('http://') || img.startsWith('https://')
                  ? img
                  : `https://backend-ps76.onrender.com${img}`
                : 'https://placehold.co/150?text=No+Image'
            )
          : [];

      const sizes = Array.isArray(item.sizes) ? item.sizes : [];

      const product = {
        _id: item._id || '',
        name: item.name || '',
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        image,
        images,
        category: item.category || 'Uncategorized',
        featured: item.featured || false,
        description: item.description || '',
        brand: item.brand || '',
        weight: Number(item.weight) || 0,
        model: item.model || '',
        offer: item.offer || '',
        sizes,
        isActive: item.isActive !== undefined ? item.isActive : true,
      };

      console.log('Processed product:', product);
      return product;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch product');
    }
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById, // Expose this function for ProductDetails.js
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);
 */
















/*   import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products when the provider mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('https://backend-ps76.onrender.com/api/products');
      console.log('Raw product data from backend:', res.data);
      const fetchedProducts = res.data.map((item) => {
        // Ensure image is a string and prepend base URL if it exists
        const image =
          item.image && typeof item.image === 'string'
            ? `https://backend-ps76.onrender.com${item.image}`
            : 'https://placehold.co/150?text=No+Image';

        // Ensure images array contains valid URLs
        const images =
          item.images && Array.isArray(item.images)
            ? item.images.map((img) =>
                typeof img === 'string' ? `https://backend-ps76.onrender.com${img}` : 'https://placehold.co/150?text=No+Image'
              )
            : [];

        // Ensure sizes is an array
        const sizes = Array.isArray(item.sizes) ? item.sizes : [];

        return {
          _id: item._id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          image,
          images,
          category: item.category || 'Uncategorized',
          featured: item.featured || false,
          description: item.description || '',
          brand: item.brand || '',
          weight: Number(item.weight) || 0,
          model: item.model || '',
          offer: item.offer || '',
          sizes,
          isActive: item.isActive !== undefined ? item.isActive : true,
        };
      });
      console.log('Processed products:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single product by ID (useful for ProductDetails.js)
  const fetchProductById = async (productId) => {
    try {
      const res = await axios.get(`https://backend-ps76.onrender.com/api/products/${productId}`);
      console.log('Raw product data for ID', productId, ':', res.data);
      const item = res.data;

      const image =
        item.image && typeof item.image === 'string'
          ? `https://backend-ps76.onrender.com${item.image}`
          : 'https://placehold.co/150?text=No+Image';

      const images =
        item.images && Array.isArray(item.images)
          ? item.images.map((img) =>
              typeof img === 'string' ? `https://backend-ps76.onrender.com${img}` : 'https://placehold.co/150?text=No+Image'
            )
          : [];

      const sizes = Array.isArray(item.sizes) ? item.sizes : [];

      const product = {
        _id: item._id || '',
        name: item.name || '',
        price: Number(item.price) || 0,
        stock: Number(item.stock) || 0,
        image,
        images,
        category: item.category || 'Uncategorized',
        featured: item.featured || false,
        description: item.description || '',
        brand: item.brand || '',
        weight: Number(item.weight) || 0,
        model: item.model || '',
        offer: item.offer || '',
        sizes,
        isActive: item.isActive !== undefined ? item.isActive : true,
      };

      console.log('Processed product:', product);
      return product;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch product');
    }
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById, // Expose this function for ProductDetails.js
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);  */

















































































/* import { createContext, useState, useEffect, useContext } from 'react';
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

export const useProducts = () => useContext(ProductContext); */



















































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











































































