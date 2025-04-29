import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/ProductManagement.css';

function ProductManagement() {
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    mainImage: null,
    currentMainImage: null,
    existingImages: [],
    newImages: [],
    offer: '',
    sizes: [],
    isActive: true,
    brand: '',
    weight: '',
    model: '',
  });
  const [categories] = useState([
    'Clothing',
    'Slippers',
    'Electronics',
    'Jewelry',
    'Pets',
    'Home',
    'Beauty',
    'Sports',
    'Toys',
    'Books',
    'Furniture',
    'Groceries',
    'Automotive',
    'Health',
    'Kids',
    'Accessories',
  ]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterOffer, setFilterOffer] = useState('');
  const [previewModal, setPreviewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const productsPerPage = 10;
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (err) {
      console.error('Error decoding token:', err);
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      fetchProducts(true);
    }
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
    setShouldFetch(true);
  }, [debouncedSearchQuery, filterCategory, filterPriceMin, filterPriceMax, filterStock, filterOffer]);

  useEffect(() => {
    if (shouldFetch) {
      fetchProducts(true);
    }
  }, [currentPage, shouldFetch]);

  useEffect(() => {
    if (formData.category === 'Clothing' || formData.category === 'Kids') {
      setSizeOptions(formData.category === 'Clothing' ? ['S', 'M', 'L', 'XL', 'XXL'] : ['2T', '3T', '4T', '5T']);
    } else if (formData.category === 'Slippers') {
      setSizeOptions(['6', '7', '8', '9', '10']);
    } else if (formData.category === 'Jewelry') {
      setSizeOptions(['5', '6', '7', '8', '9']);
    } else {
      setSizeOptions([]);
      setFormData((prev) => ({ ...prev, sizes: [] }));
    }
  }, [formData.category]);

  useEffect(() => {
    return () => {
      if (formData.currentMainImage && typeof formData.currentMainImage !== 'string') {
        URL.revokeObjectURL(formData.currentMainImage);
      }
      formData.newImages.forEach((image) => {
        if (typeof image === 'string') {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [formData.currentMainImage, formData.newImages]);

  const fetchProducts = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        category: filterCategory,
        priceMin: filterPriceMin,
        priceMax: filterPriceMax,
        stock: filterStock,
        offer: filterOffer,
        page: currentPage,
        limit: productsPerPage,
        sort: '-createdAt', // Explicitly sort by createdAt descending
      });

      const res = await axios.get(`https://backend-ps76.onrender.com/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const baseUrl = 'https://backend-ps76.onrender.com';
      const productData = res.data.products || res.data || [];
      const initializedProducts = Array.isArray(productData)
        ? productData.map((product) => {
            let processedImage = product.image || '/default-product.jpg';
            let processedImages = product.images || [];

            console.log('Raw product image:', product.image);
            console.log('Raw product images:', product.images);

            if (processedImage && !processedImage.startsWith('http')) {
              processedImage = processedImage.startsWith('/')
                ? `${baseUrl}${processedImage}`
                : `${baseUrl}/${processedImage}`;
            }
            processedImages = processedImages.map((img) =>
              img && !img.startsWith('http')
                ? img.startsWith('/')
                  ? `${baseUrl}${img}`
                  : `${baseUrl}/${img}`
                : img
            );

            return {
              ...product,
              selected: product.selected || false,
              image: processedImage,
              images: processedImages,
            };
          })
        : [];

      setProducts(initializedProducts);
      setTotalPages(res.data.totalPages || Math.ceil((res.data.total || productData.length) / productsPerPage));
      setShouldFetch(false);
    } catch (err) {
      console.error('Error fetching products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load products. Check server or token.');
        setProducts([]);
        setTotalPages(1);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (name === 'mainImage') {
      const file = files[0];
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }
      if (file.size > maxSize) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      setFormData((prev) => {
        if (prev.currentMainImage && typeof prev.currentMainImage !== 'string') {
          URL.revokeObjectURL(prev.currentMainImage);
        }
        const imageUrl = file ? URL.createObjectURL(file) : null;
        console.log('Main image preview URL:', imageUrl);
        return { ...prev, mainImage: file, currentMainImage: imageUrl };
      });
    } else if (name === 'images') {
      const validFiles = Array.from(files).filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid file type for ${file.name}. Please upload JPEG, PNG, or WebP.`);
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });

      setFormData((prev) => {
        const newImages = [...prev.newImages, ...validFiles];
        console.log('New images added:', newImages);
        return { ...prev, newImages };
      });
    }
  };

  const handleSizeChange = (size) => {
    setFormData((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const resetForm = () => {
    if (formData.currentMainImage && typeof formData.currentMainImage !== 'string') {
      URL.revokeObjectURL(formData.currentMainImage);
    }
    formData.newImages.forEach((image) => {
      if (typeof image === 'string') {
        URL.revokeObjectURL(image);
      }
    });

    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      mainImage: null,
      currentMainImage: null,
      existingImages: [],
      newImages: [],
      offer: '',
      sizes: [],
      isActive: true,
      brand: '',
      weight: '',
      model: '',
    });
    setEditingProductId(null);
    const mainImageInput = document.getElementById('mainImageInput');
    const additionalImagesInput = document.getElementById('additionalImagesInput');
    if (mainImageInput) mainImageInput.value = null;
    if (additionalImagesInput) additionalImagesInput.value = null;
    setShowForm(false); // Ensure form is hidden immediately
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setFilterCategory('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStock('');
    setFilterOffer('');
    setCurrentPage(1);
    setShouldFetch(true);
    toast.success('Filters reset successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('price', formData.price);
    form.append('category', formData.category);
    form.append('stock', formData.stock);
    form.append('description', formData.description);
    form.append('offer', formData.offer);
    form.append('sizes', JSON.stringify(formData.sizes));
    form.append('isActive', formData.isActive);
    form.append('brand', formData.brand);

    let weightValue = formData.weight.trim();
    if (weightValue) {
      if (weightValue.toLowerCase().endsWith('g')) {
        weightValue = parseFloat(weightValue.replace(/g/i, '')) / 1000;
      } else if (weightValue.toLowerCase().endsWith('kg')) {
        weightValue = parseFloat(weightValue.replace(/kg/i, ''));
      } else {
        weightValue = parseFloat(weightValue);
      }
      if (isNaN(weightValue) || weightValue <= 0) {
        toast.error('Invalid weight format. Use numbers with "kg" or "g" (e.g., 0.5kg or 500g)');
        setSubmitting(false);
        return;
      }
      form.append('weight', weightValue);
      form.append('weightUnit', weightValue < 1 ? 'g' : 'kg');
    } else {
      form.append('weight', '');
      form.append('weightUnit', 'kg');
    }

    form.append('model', formData.model);
    if (formData.mainImage) form.append('image', formData.mainImage);
    formData.newImages.forEach((image) => {
      if (image instanceof File) {
        form.append('images', image);
      }
    });
    if (editingProductId && formData.existingImages.length > 0) {
      form.append('existingImages', JSON.stringify(formData.existingImages));
    } else if (editingProductId) {
      const token = localStorage.getItem('token');
      const productRes = await axios.get(`https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentImages = productRes.data.product.images.filter((img) => img !== productRes.data.product.image) || [];
      form.append('existingImages', JSON.stringify(currentImages));
    } else if (formData.existingImages.length > 0) {
      form.append('existingImages', JSON.stringify(formData.existingImages));
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      let updatedProduct;
      if (editingProductId) {
        const res = await axios.put(
          `https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`,
          form,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        updatedProduct = res.data.product;
        console.log('Updated product after edit:', updatedProduct);
        const processedImage = updatedProduct.image
          ? updatedProduct.image.startsWith('http')
            ? updatedProduct.image
            : `https://backend-ps76.onrender.com${updatedProduct.image.startsWith('/') ? '' : '/'}${updatedProduct.image}`
          : '/default-product.jpg';
        const processedImages = updatedProduct.images
          ? updatedProduct.images.map((img) =>
              img.startsWith('http')
                ? img
                : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
            )
          : [];
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProductId ? { ...updatedProduct, image: processedImage, images: processedImages } : p
          )
        );
        toast.success('Product updated successfully!');
      } else {
        if (!formData.mainImage) throw new Error('Main image is required when adding a new product');
        await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        setCurrentPage(1); // Stay on page 1 after adding
        setShouldFetch(true); // Trigger re-fetch to update with newest product
        toast.success('Product added successfully!');
      }
      resetForm(); // Reset and hide form after success
    } catch (err) {
      console.error('Error saving product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to save product.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    const additionalImages = Array.isArray(product.images)
      ? product.images.filter((img) => img !== product.image)
      : [];
    console.log('Editing product, additional images:', additionalImages);

    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      mainImage: null,
      currentMainImage: product.image,
      existingImages: additionalImages,
      newImages: [],
      offer: product.offer || '',
      sizes: product.sizes || [],
      isActive: product.isActive,
      brand: product.brand || '',
      weight: product.weight
        ? product.weightUnit === 'g'
          ? `${product.weight * 1000}g`
          : `${product.weight}kg`
        : '',
      model: product.model || '',
    });
    setEditingProductId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      await axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Product deleted successfully!');
      setShouldFetch(true);
    } catch (err) {
      console.error('Error deleting product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      await Promise.all(
        selectedProducts.map((p) =>
          axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${p._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setProducts((prev) => prev.filter((p) => !p.selected));
      toast.success(`${selectedProducts.length} products deleted successfully!`);
      setShouldFetch(true);
    } catch (err) {
      console.error('Error bulk deleting products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to bulk delete products.');
      }
    }
  };

  const handleDuplicate = async (product) => {
    const form = new FormData();
    form.append('name', `${product.name} (Copy)`);
    form.append('price', product.price);
    form.append('category', product.category);
    form.append('stock', product.stock);
    form.append('description', product.description);
    form.append('offer', product.offer || '');
    form.append('sizes', JSON.stringify(product.sizes || []));
    form.append('isActive', product.isActive);
    form.append('brand', product.brand || '');
    form.append('weight', product.weight || '');
    form.append('weightUnit', product.weightUnit || 'kg');
    form.append('model', product.model || '');
    form.append('image', product.image.replace('https://backend-ps76.onrender.com', ''));
    product.images.forEach((img) => form.append('images', img.replace('https://backend-ps76.onrender.com', '')));

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const res = await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newProduct = res.data.product;
      const processedImage = newProduct.image
        ? newProduct.image.startsWith('http')
          ? newProduct.image
          : `https://backend-ps76.onrender.com${newProduct.image.startsWith('/') ? '' : '/'}${newProduct.image}`
        : '/default-product.jpg';
      const processedImages = newProduct.images
        ? newProduct.images.map((img) =>
            img.startsWith('http')
              ? img
              : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
          )
        : [];
      setProducts((prev) => [{ ...newProduct, image: processedImage, images: processedImages }, ...prev].slice(0, productsPerPage));
      setCurrentPage(1);
      const totalCountRes = await axios.get(`https://backend-ps76.onrender.com/api/admin/products/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const totalProducts = totalCountRes.data.count || 0;
      setTotalPages(Math.ceil(totalProducts / productsPerPage));
      toast.success('Product duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to duplicate product.');
      }
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${productId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;
      const processedImage = updatedProduct.image
        ? updatedProduct.image.startsWith('http')
          ? updatedProduct.image
          : `https://backend-ps76.onrender.com${updatedProduct.image.startsWith('/') ? '' : '/'}${updatedProduct.image}`
        : '/default-product.jpg';
      const processedImages = updatedProduct.images
        ? updatedProduct.images.map((img) =>
            img.startsWith('http')
              ? img
              : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
          )
        : [];
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...updatedProduct, image: processedImage, images: processedImages } : p))
      );
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      setShouldFetch(true);
    } catch (err) {
      console.error('Error toggling product status:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to toggle product status.');
      }
    }
  };

  const toggleSelectProduct = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, selected: !p.selected } : p))
    );
  };

  const openPreviewModal = (product) => {
    setPreviewModal(product);
  };

  const closePreviewModal = () => {
    setPreviewModal(null);
  };

  const csvData = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    category: p.category,
    stock: p.stock,
    description: p.description,
    offer: p.offer || '',
    sizes: p.sizes?.join(', ') || '',
    isActive: p.isActive ? 'Yes' : 'No',
    image: p.image,
    images: p.images?.join(', ') || '',
    brand: p.brand || '',
    weight: p.weight || '',
    weightUnit: p.weightUnit || 'kg',
    model: p.model || '',
  }));

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="product-management-container">
      <div className="header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="add-product-section">
        <button className="add-product-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide Form' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <section className="product-form-section">
          <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {sizeOptions.length > 0 && (
              <div className="form-group">
                <label>Sizes</label>
                <div className="size-options">
                  {sizeOptions.map((size) => (
                    <label key={size} className="size-label">
                      <input type="checkbox" checked={formData.sizes.includes(size)} onChange={() => handleSizeChange(size)} />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Offer (e.g., "35% off")</label>
              <input type="text" name="offer" value={formData.offer} onChange={handleInputChange} placeholder="e.g., 35% off" />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Enter brand name" />
            </div>
            <div className="form-group">
              <label>Weight (kg or g)</label>
              <input type="text" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g., 0.5kg or 500g" />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="Enter model name" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <label className="status-toggle">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                Active
              </label>
            </div>
            <div className="form-group">
              <label>Main Image</label>
              <input type="file" id="mainImageInput" name="mainImage" accept="image/*" onChange={handleFileChange} required={!editingProductId} />
              {formData.currentMainImage && (
                <div className="image-preview">
                  <img
                    src={formData.currentMainImage}
                    alt="Main Preview"
                    onError={(e) => {
                      console.error('Main image preview load failed:', e.target.src);
                      e.target.src = '/default-product.jpg';
                      e.target.onerror = null;
                    }}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Additional Images</label>
              <input type="file" id="additionalImagesInput" name="images" accept="image/*" multiple onChange={handleFileChange} />
              <div className="additional-images-preview">
                {formData.existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img
                      src={image}
                      alt={`Existing ${index}`}
                      onError={(e) => {
                        console.error('Additional image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          existingImages: prev.existingImages.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.newImages.map((image, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`New ${index}`}
                      onError={(e) => {
                        console.error('New image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newImages: prev.newImages.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-section">
        <h2>Product List</h2>
        <div className="product-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={filterPriceMin}
            onChange={(e) => setFilterPriceMin(e.target.value)}
            className="filter-input"
            min="0"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
            className="filter-input"
            min="0"
          />
          <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="filter-select">
            <option value="">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (1-5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <select value={filterOffer} onChange={(e) => setFilterOffer(e.target.value)} className="filter-select">
            <option value="">All Offers</option>
            <option value="hasOffer">Has Offer</option>
            <option value="noOffer">No Offer</option>
          </select>
          <button onClick={handleBulkDelete} className="bulk-delete-btn" disabled={!products.some((p) => p.selected)}>
            Bulk Delete
          </button>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset Filters
          </button>
          <CSVLink data={csvData} filename="products.csv" className="export-btn">
            Export to CSV
          </CSVLink>
        </div>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => {
              console.log('Rendering product image:', product.image);
              console.log('Rendering product images:', product.images);
              return (
                <div key={product._id} className="product-card">
                  <input
                    type="checkbox"
                    checked={product.selected || false}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="select-checkbox"
                  />
                  <div className="image-wrapper">
                    <img
                      src={product.image || '/default-product.jpg'}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        console.error('Product image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p>Price: ₹{product.price.toFixed(2)}</p>
                    <p>Category: {product.category}</p>
                    <p>
                      Stock: {product.stock}{' '}
                      {product.stock === 0 ? (
                        <span className="stock-badge out-of-stock">Out of Stock</span>
                      ) : product.stock <= 5 ? (
                        <span className="stock-badge low-stock">Low Stock</span>
                      ) : (
                        <span className="stock-badge in-stock">In Stock</span>
                      )}
                    </p>
                    {product.offer && <p className="offer">Offer: {product.offer}</p>}
                    {product.sizes?.length > 0 && <p>Sizes: {product.sizes.join(', ')}</p>}
                    {product.brand && <p>Brand: {product.brand}</p>}
                    {product.weight && (
                      <p>Weight: {product.weightUnit === 'g' ? `${product.weight * 1000} g` : `${product.weight} kg`}</p>
                    )}
                    {product.model && <p>Model: {product.model}</p>}
                    <p>
                      Status:{' '}
                      <span className={product.isActive ? 'status-active' : 'status-inactive'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => openPreviewModal(product)} className="preview-btn">
                      Preview
                    </button>
                    <button onClick={() => handleEdit(product)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(product)} className="duplicate-btn">
                      Duplicate
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product._id, product.isActive)}
                      className={product.isActive ? 'deactivate-btn' : 'activate-btn'}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </section>

      {previewModal && (
        <div className="preview-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closePreviewModal}>
              ✕
            </button>
            <h2>{previewModal.name}</h2>
            <div className="image-wrapper">
              <img
                src={previewModal.image || '/default-product.jpg'}
                alt={previewModal.name}
                className="modal-image"
                onError={(e) => {
                  console.error('Preview image load failed:', e.target.src);
                  e.target.src = '/default-product.jpg';
                  e.target.onerror = null;
                }}
              />
            </div>
            <p>Price: ₹{previewModal.price.toFixed(2)}</p>
            <p>Category: {previewModal.category}</p>
            <p>
              Stock: {previewModal.stock}{' '}
              {previewModal.stock === 0 ? (
                <span className="stock-badge out-of-stock">Out of Stock</span>
              ) : previewModal.stock <= 5 ? (
                <span className="stock-badge low-stock">Low Stock</span>
              ) : (
                <span className="stock-badge in-stock">In Stock</span>
              )}
            </p>
            {previewModal.offer && <p>Offer: {previewModal.offer}</p>}
            {previewModal.sizes?.length > 0 && <p>Sizes: {previewModal.sizes.join(', ')}</p>}
            {previewModal.brand && <p>Brand: {previewModal.brand}</p>}
            {previewModal.weight && (
              <p>Weight: {previewModal.weightUnit === 'g' ? `${previewModal.weight * 1000} g` : `${previewModal.weight} kg`}</p>
            )}
            {previewModal.model && <p>Model: {previewModal.model}</p>}
            <p>{previewModal.description}</p>
            {previewModal.images?.length > 0 && (
              <div className="additional-images">
                <h3>Additional Images</h3>
                <div className="image-gallery">
                  {previewModal.images.map((img, index) => (
                    <div key={index} className="image-wrapper">
                      <img
                        src={img || '/default-product.jpg'}
                        alt={`Additional ${index}`}
                        className="gallery-image"
                        onError={(e) => {
                          console.error('Additional preview image load failed:', e.target.src);
                          e.target.src = '/default-product.jpg';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;































/* import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/ProductManagement.css';

function ProductManagement() {
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    mainImage: null,
    currentMainImage: null,
    existingImages: [],
    newImages: [],
    offer: '',
    sizes: [],
    isActive: true,
    brand: '',
    weight: '',
    model: '',
  });
  const [categories] = useState([
    'Clothing',
    'Slippers',
    'Electronics',
    'Jewelry',
    'Pets',
    'Home',
    'Beauty',
    'Sports',
    'Toys',
    'Books',
    'Furniture',
    'Groceries',
    'Automotive',
    'Health',
    'Kids',
    'Accessories',
  ]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterOffer, setFilterOffer] = useState('');
  const [previewModal, setPreviewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const productsPerPage = 10;
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (err) {
      console.error('Error decoding token:', err);
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
    } else {
      fetchProducts(true);
    }
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
    setShouldFetch(true);
  }, [debouncedSearchQuery, filterCategory, filterPriceMin, filterPriceMax, filterStock, filterOffer]);

  useEffect(() => {
    if (shouldFetch) {
      fetchProducts(true);
    }
  }, [currentPage, shouldFetch]);

  useEffect(() => {
    if (formData.category === 'Clothing' || formData.category === 'Kids') {
      setSizeOptions(formData.category === 'Clothing' ? ['S', 'M', 'L', 'XL', 'XXL'] : ['2T', '3T', '4T', '5T']);
    } else if (formData.category === 'Slippers') {
      setSizeOptions(['6', '7', '8', '9', '10']);
    } else if (formData.category === 'Jewelry') {
      setSizeOptions(['5', '6', '7', '8', '9']);
    } else {
      setSizeOptions([]);
      setFormData((prev) => ({ ...prev, sizes: [] }));
    }
  }, [formData.category]);

  useEffect(() => {
    return () => {
      if (formData.currentMainImage && typeof formData.currentMainImage !== 'string') {
        URL.revokeObjectURL(formData.currentMainImage);
      }
      formData.newImages.forEach((image) => {
        if (typeof image === 'string') {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [formData.currentMainImage, formData.newImages]);

  const fetchProducts = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        category: filterCategory,
        priceMin: filterPriceMin,
        priceMax: filterPriceMax,
        stock: filterStock,
        offer: filterOffer,
        page: currentPage,
        limit: productsPerPage,
        sort: '-_id', // Sort by _id descending (newest first)
      });

      const res = await axios.get(`https://backend-ps76.onrender.com/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const baseUrl = 'https://backend-ps76.onrender.com';
      const productData = res.data.products || res.data || [];
      const initializedProducts = Array.isArray(productData)
        ? productData.map((product) => {
            let processedImage = product.image || '/default-product.jpg';
            let processedImages = product.images || [];

            console.log('Raw product image:', product.image);
            console.log('Raw product images:', product.images);

            if (processedImage && !processedImage.startsWith('http')) {
              processedImage = processedImage.startsWith('/')
                ? `${baseUrl}${processedImage}`
                : `${baseUrl}/${processedImage}`;
            }
            processedImages = processedImages.map((img) =>
              img && !img.startsWith('http')
                ? img.startsWith('/')
                  ? `${baseUrl}${img}`
                  : `${baseUrl}/${img}`
                : img
            );

            return {
              ...product,
              selected: product.selected || false,
              image: processedImage,
              images: processedImages,
            };
          })
        : [];

      setProducts(initializedProducts);
      setTotalPages(res.data.totalPages || Math.ceil((res.data.total || productData.length) / productsPerPage));
      setShouldFetch(false);
    } catch (err) {
      console.error('Error fetching products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load products. Check server or token.');
        setProducts([]);
        setTotalPages(1);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (name === 'mainImage') {
      const file = files[0];
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }
      if (file.size > maxSize) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      setFormData((prev) => {
        if (prev.currentMainImage && typeof prev.currentMainImage !== 'string') {
          URL.revokeObjectURL(prev.currentMainImage);
        }
        const imageUrl = file ? URL.createObjectURL(file) : null;
        console.log('Main image preview URL:', imageUrl);
        return { ...prev, mainImage: file, currentMainImage: imageUrl };
      });
    } else if (name === 'images') {
      const validFiles = Array.from(files).filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid file type for ${file.name}. Please upload JPEG, PNG, or WebP.`);
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });

      setFormData((prev) => {
        const newImages = [...prev.newImages, ...validFiles];
        console.log('New images added:', newImages);
        return { ...prev, newImages };
      });
    }
  };

  const handleSizeChange = (size) => {
    setFormData((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const resetForm = () => {
    if (formData.currentMainImage && typeof formData.currentMainImage !== 'string') {
      URL.revokeObjectURL(formData.currentMainImage);
    }
    formData.newImages.forEach((image) => {
      if (typeof image === 'string') {
        URL.revokeObjectURL(image);
      }
    });

    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      mainImage: null,
      currentMainImage: null,
      existingImages: [],
      newImages: [],
      offer: '',
      sizes: [],
      isActive: true,
      brand: '',
      weight: '',
      model: '',
    });
    setEditingProductId(null);
    const mainImageInput = document.getElementById('mainImageInput');
    const additionalImagesInput = document.getElementById('additionalImagesInput');
    if (mainImageInput) mainImageInput.value = null;
    if (additionalImagesInput) additionalImagesInput.value = null;
    setShowForm(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setFilterCategory('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStock('');
    setFilterOffer('');
    setCurrentPage(1);
    setShouldFetch(true);
    toast.success('Filters reset successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('price', formData.price);
    form.append('category', formData.category);
    form.append('stock', formData.stock);
    form.append('description', formData.description);
    form.append('offer', formData.offer);
    form.append('sizes', JSON.stringify(formData.sizes));
    form.append('isActive', formData.isActive);
    form.append('brand', formData.brand);

    let weightValue = formData.weight.trim();
    if (weightValue) {
      if (weightValue.toLowerCase().endsWith('g')) {
        weightValue = parseFloat(weightValue.replace(/g/i, '')) / 1000;
      } else if (weightValue.toLowerCase().endsWith('kg')) {
        weightValue = parseFloat(weightValue.replace(/kg/i, ''));
      } else {
        weightValue = parseFloat(weightValue);
      }
      if (isNaN(weightValue) || weightValue <= 0) {
        toast.error('Invalid weight format. Use numbers with "kg" or "g" (e.g., 0.5kg or 500g)');
        setSubmitting(false);
        return;
      }
      form.append('weight', weightValue);
      form.append('weightUnit', weightValue < 1 ? 'g' : 'kg');
    } else {
      form.append('weight', '');
      form.append('weightUnit', 'kg');
    }

    form.append('model', formData.model);
    if (formData.mainImage) form.append('image', formData.mainImage);
    formData.newImages.forEach((image) => {
      if (image instanceof File) {
        form.append('images', image);
      }
    });
    // Send all current existingImages to ensure they are retained
    if (editingProductId && formData.existingImages.length > 0) {
      form.append('existingImages', JSON.stringify(formData.existingImages));
    } else if (editingProductId) {
      // Fetch the latest product data to ensure all images are included
      const token = localStorage.getItem('token');
      const productRes = await axios.get(`https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentImages = productRes.data.product.images.filter((img) => img !== productRes.data.product.image) || [];
      form.append('existingImages', JSON.stringify(currentImages));
    } else if (formData.existingImages.length > 0) {
      form.append('existingImages', JSON.stringify(formData.existingImages));
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      let updatedProduct;
      if (editingProductId) {
        const res = await axios.put(
          `https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`,
          form,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        updatedProduct = res.data.product;
        console.log('Updated product after edit:', updatedProduct);
        const processedImage = updatedProduct.image
          ? updatedProduct.image.startsWith('http')
            ? updatedProduct.image
            : `https://backend-ps76.onrender.com${updatedProduct.image.startsWith('/') ? '' : '/'}${updatedProduct.image}`
          : '/default-product.jpg';
        const processedImages = updatedProduct.images
          ? updatedProduct.images.map((img) =>
              img.startsWith('http')
                ? img
                : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
            )
          : [];
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProductId ? { ...updatedProduct, image: processedImage, images: processedImages } : p
          )
        );
        toast.success('Product updated successfully!');
      } else {
        if (!formData.mainImage) throw new Error('Main image is required when adding a new product');
        const res = await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        updatedProduct = res.data.product;
        console.log('New product response:', updatedProduct);
        const processedImage = updatedProduct.image
          ? updatedProduct.image.startsWith('http')
            ? updatedProduct.image
            : `https://backend-ps76.onrender.com${updatedProduct.image.startsWith('/') ? '' : '/'}${updatedProduct.image}`
          : '/default-product.jpg';
        const processedImages = updatedProduct.images
          ? updatedProduct.images.map((img) =>
              img.startsWith('http')
                ? img
                : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
            )
          : [];
        setProducts((prev) => [{ ...updatedProduct, image: processedImage, images: processedImages }, ...prev].slice(0, productsPerPage));
        setCurrentPage(1);
        const totalCountRes = await axios.get(`https://backend-ps76.onrender.com/api/admin/products/count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const totalProducts = totalCountRes.data.count || 0;
        setTotalPages(Math.ceil(totalProducts / productsPerPage));
        toast.success('Product added successfully!');
      }
      resetForm();
      setShouldFetch(true);
    } catch (err) {
      console.error('Error saving product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to save product.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    // Use all images except main image for existingImages
    const additionalImages = Array.isArray(product.images)
      ? product.images.filter((img) => img !== product.image)
      : [];
    console.log('Editing product, additional images:', additionalImages);

    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      mainImage: null,
      currentMainImage: product.image,
      existingImages: additionalImages,
      newImages: [],
      offer: product.offer || '',
      sizes: product.sizes || [],
      isActive: product.isActive,
      brand: product.brand || '',
      weight: product.weight
        ? product.weightUnit === 'g'
          ? `${product.weight * 1000}g`
          : `${product.weight}kg`
        : '',
      model: product.model || '',
    });
    setEditingProductId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      await axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Product deleted successfully!');
      setShouldFetch(true);
    } catch (err) {
      console.error('Error deleting product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      await Promise.all(
        selectedProducts.map((p) =>
          axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${p._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setProducts((prev) => prev.filter((p) => !p.selected));
      toast.success(`${selectedProducts.length} products deleted successfully!`);
      setShouldFetch(true);
    } catch (err) {
      console.error('Error bulk deleting products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to bulk delete products.');
      }
    }
  };

  const handleDuplicate = async (product) => {
    const form = new FormData();
    form.append('name', `${product.name} (Copy)`);
    form.append('price', product.price);
    form.append('category', product.category);
    form.append('stock', product.stock);
    form.append('description', product.description);
    form.append('offer', product.offer || '');
    form.append('sizes', JSON.stringify(product.sizes || []));
    form.append('isActive', product.isActive);
    form.append('brand', product.brand || '');
    form.append('weight', product.weight || '');
    form.append('weightUnit', product.weightUnit || 'kg');
    form.append('model', product.model || '');
    form.append('image', product.image.replace('https://backend-ps76.onrender.com', ''));
    product.images.forEach((img) => form.append('images', img.replace('https://backend-ps76.onrender.com', '')));

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const res = await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newProduct = res.data.product;
      const processedImage = newProduct.image
        ? newProduct.image.startsWith('http')
          ? newProduct.image
          : `https://backend-ps76.onrender.com${newProduct.image.startsWith('/') ? '' : '/'}${newProduct.image}`
        : '/default-product.jpg';
      const processedImages = newProduct.images
        ? newProduct.images.map((img) =>
            img.startsWith('http')
              ? img
              : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
          )
        : [];
      setProducts((prev) => [{ ...newProduct, image: processedImage, images: processedImages }, ...prev].slice(0, productsPerPage));
      setCurrentPage(1);
      const totalCountRes = await axios.get(`https://backend-ps76.onrender.com/api/admin/products/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const totalProducts = totalCountRes.data.count || 0;
      setTotalPages(Math.ceil(totalProducts / productsPerPage));
      toast.success('Product duplicated successfully!');
    } catch (err) {
      console.error('Error duplicating product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to duplicate product.');
      }
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${productId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;
      const processedImage = updatedProduct.image
        ? updatedProduct.image.startsWith('http')
          ? updatedProduct.image
          : `https://backend-ps76.onrender.com${updatedProduct.image.startsWith('/') ? '' : '/'}${updatedProduct.image}`
        : '/default-product.jpg';
      const processedImages = updatedProduct.images
        ? updatedProduct.images.map((img) =>
            img.startsWith('http')
              ? img
              : `https://backend-ps76.onrender.com${img.startsWith('/') ? '' : '/'}${img}`
          )
        : [];
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...updatedProduct, image: processedImage, images: processedImages } : p))
      );
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      setShouldFetch(true);
    } catch (err) {
      console.error('Error toggling product status:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to toggle product status.');
      }
    }
  };

  const toggleSelectProduct = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, selected: !p.selected } : p))
    );
  };

  const openPreviewModal = (product) => {
    setPreviewModal(product);
  };

  const closePreviewModal = () => {
    setPreviewModal(null);
  };

  const csvData = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    category: p.category,
    stock: p.stock,
    description: p.description,
    offer: p.offer || '',
    sizes: p.sizes?.join(', ') || '',
    isActive: p.isActive ? 'Yes' : 'No',
    image: p.image,
    images: p.images?.join(', ') || '',
    brand: p.brand || '',
    weight: p.weight || '',
    weightUnit: p.weightUnit || 'kg',
    model: p.model || '',
  }));

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="product-management-container">
      <div className="header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="add-product-section">
        <button className="add-product-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide Form' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <section className="product-form-section">
          <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {sizeOptions.length > 0 && (
              <div className="form-group">
                <label>Sizes</label>
                <div className="size-options">
                  {sizeOptions.map((size) => (
                    <label key={size} className="size-label">
                      <input type="checkbox" checked={formData.sizes.includes(size)} onChange={() => handleSizeChange(size)} />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Offer (e.g., "35% off")</label>
              <input type="text" name="offer" value={formData.offer} onChange={handleInputChange} placeholder="e.g., 35% off" />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Enter brand name" />
            </div>
            <div className="form-group">
              <label>Weight (kg or g)</label>
              <input type="text" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g., 0.5kg or 500g" />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="Enter model name" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <label className="status-toggle">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                Active
              </label>
            </div>
            <div className="form-group">
              <label>Main Image</label>
              <input type="file" id="mainImageInput" name="mainImage" accept="image/*" onChange={handleFileChange} required={!editingProductId} />
              {formData.currentMainImage && (
                <div className="image-preview">
                  <img
                    src={formData.currentMainImage}
                    alt="Main Preview"
                    onError={(e) => {
                      console.error('Main image preview load failed:', e.target.src);
                      e.target.src = '/default-product.jpg';
                      e.target.onerror = null;
                    }}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Additional Images</label>
              <input type="file" id="additionalImagesInput" name="images" accept="image/*" multiple onChange={handleFileChange} />
              <div className="additional-images-preview">
                {formData.existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img
                      src={image}
                      alt={`Existing ${index}`}
                      onError={(e) => {
                        console.error('Additional image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          existingImages: prev.existingImages.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.newImages.map((image, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`New ${index}`}
                      onError={(e) => {
                        console.error('New image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newImages: prev.newImages.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-section">
        <h2>Product List</h2>
        <div className="product-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={filterPriceMin}
            onChange={(e) => setFilterPriceMin(e.target.value)}
            className="filter-input"
            min="0"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
            className="filter-input"
            min="0"
          />
          <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="filter-select">
            <option value="">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (1-5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <select value={filterOffer} onChange={(e) => setFilterOffer(e.target.value)} className="filter-select">
            <option value="">All Offers</option>
            <option value="hasOffer">Has Offer</option>
            <option value="noOffer">No Offer</option>
          </select>
          <button onClick={handleBulkDelete} className="bulk-delete-btn" disabled={!products.some((p) => p.selected)}>
            Bulk Delete
          </button>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset Filters
          </button>
          <CSVLink data={csvData} filename="products.csv" className="export-btn">
            Export to CSV
          </CSVLink>
        </div>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => {
              console.log('Rendering product image:', product.image);
              console.log('Rendering product images:', product.images);
              return (
                <div key={product._id} className="product-card">
                  <input
                    type="checkbox"
                    checked={product.selected || false}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="select-checkbox"
                  />
                  <div className="image-wrapper">
                    <img
                      src={product.image || '/default-product.jpg'}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        console.error('Product image load failed:', e.target.src);
                        e.target.src = '/default-product.jpg';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p>Price: ₹{product.price.toFixed(2)}</p>
                    <p>Category: {product.category}</p>
                    <p>
                      Stock: {product.stock}{' '}
                      {product.stock === 0 ? (
                        <span className="stock-badge out-of-stock">Out of Stock</span>
                      ) : product.stock <= 5 ? (
                        <span className="stock-badge low-stock">Low Stock</span>
                      ) : (
                        <span className="stock-badge in-stock">In Stock</span>
                      )}
                    </p>
                    {product.offer && <p className="offer">Offer: {product.offer}</p>}
                    {product.sizes?.length > 0 && <p>Sizes: {product.sizes.join(', ')}</p>}
                    {product.brand && <p>Brand: {product.brand}</p>}
                    {product.weight && (
                      <p>Weight: {product.weightUnit === 'g' ? `${product.weight * 1000} g` : `${product.weight} kg`}</p>
                    )}
                    {product.model && <p>Model: {product.model}</p>}
                    <p>
                      Status:{' '}
                      <span className={product.isActive ? 'status-active' : 'status-inactive'}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => openPreviewModal(product)} className="preview-btn">
                      Preview
                    </button>
                    <button onClick={() => handleEdit(product)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(product)} className="duplicate-btn">
                      Duplicate
                    </button>
                    <button
                      onClick={() => toggleProductStatus(product._id, product.isActive)}
                      className={product.isActive ? 'deactivate-btn' : 'activate-btn'}
                    >
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </section>

      {previewModal && (
        <div className="preview-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closePreviewModal}>
              ✕
            </button>
            <h2>{previewModal.name}</h2>
            <div className="image-wrapper">
              <img
                src={previewModal.image || '/default-product.jpg'}
                alt={previewModal.name}
                className="modal-image"
                onError={(e) => {
                  console.error('Preview image load failed:', e.target.src);
                  e.target.src = '/default-product.jpg';
                  e.target.onerror = null;
                }}
              />
            </div>
            <p>Price: ₹{previewModal.price.toFixed(2)}</p>
            <p>Category: {previewModal.category}</p>
            <p>
              Stock: {previewModal.stock}{' '}
              {previewModal.stock === 0 ? (
                <span className="stock-badge out-of-stock">Out of Stock</span>
              ) : previewModal.stock <= 5 ? (
                <span className="stock-badge low-stock">Low Stock</span>
              ) : (
                <span className="stock-badge in-stock">In Stock</span>
              )}
            </p>
            {previewModal.offer && <p>Offer: {previewModal.offer}</p>}
            {previewModal.sizes?.length > 0 && <p>Sizes: {previewModal.sizes.join(', ')}</p>}
            {previewModal.brand && <p>Brand: {previewModal.brand}</p>}
            {previewModal.weight && (
              <p>Weight: {previewModal.weightUnit === 'g' ? `${previewModal.weight * 1000} g` : `${previewModal.weight} kg`}</p>
            )}
            {previewModal.model && <p>Model: {previewModal.model}</p>}
            <p>{previewModal.description}</p>
            {previewModal.images?.length > 0 && (
              <div className="additional-images">
                <h3>Additional Images</h3>
                <div className="image-gallery">
                  {previewModal.images.map((img, index) => (
                    <div key={index} className="image-wrapper">
                      <img
                        src={img || '/default-product.jpg'}
                        alt={`Additional ${index}`}
                        className="gallery-image"
                        onError={(e) => {
                          console.error('Additional preview image load failed:', e.target.src);
                          e.target.src = '/default-product.jpg';
                          e.target.onerror = null;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;
 */






















/* import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Corrected import: Use named export
import '../styles/ProductManagement.css';

function ProductManagement() {
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    stock: '',
    description: '',
    mainImage: null,
    existingImages: [],
    newImages: [],
    offer: '',
    sizes: [],
    isActive: true,
    brand: '',
    weight: '',
    model: '',
  });
  const [categories] = useState([
    'Clothing',
    'Slippers',
    'Electronics',
    'Jewelry',
    'Pets',
    'Home',
    'Beauty',
    'Sports',
    'Toys',
    'Books',
    'Furniture',
    'Groceries',
    'Automotive',
    'Health',
    'Kids',
    'Accessories',
  ]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [filterOffer, setFilterOffer] = useState('');
  const [previewModal, setPreviewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const productsPerPage = 10;
  const navigate = useNavigate();

  // Function to check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // Current time in seconds
      return decoded.exp < currentTime;
    } catch (err) {
      console.error('Error decoding token:', err);
      return true;
    }
  };

  // Redirect to login if token is expired on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Reset currentPage to 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterPriceMin, filterPriceMax, filterStock, filterOffer]);

  // Fetch products whenever currentPage or filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchQuery, filterCategory, filterPriceMin, filterPriceMax, filterStock, filterOffer]);

  useEffect(() => {
    if (formData.category === 'Clothing' || formData.category === 'Kids') {
      setSizeOptions(formData.category === 'Clothing' ? ['S', 'M', 'L', 'XL', 'XXL'] : ['2T', '3T', '4T', '5T']);
    } else if (formData.category === 'Slippers') {
      setSizeOptions(['6', '7', '8', '9', '10']);
    } else if (formData.category === 'Jewelry') {
      setSizeOptions(['5', '6', '7', '8', '9']);
    } else {
      setSizeOptions([]);
      setFormData((prev) => ({ ...prev, sizes: [] }));
    }
  }, [formData.category]);

  // Cleanup image URLs on change
  useEffect(() => {
    return () => {
      if (formData.mainImage && typeof formData.mainImage !== 'string') {
        URL.revokeObjectURL(formData.mainImage);
      }
      formData.newImages.forEach((image) => {
        if (image && typeof image !== 'string') {
          URL.revokeObjectURL(image);
        }
      });
    };
  }, [formData.mainImage, formData.newImages]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      const params = new URLSearchParams({
        search: searchQuery,
        category: filterCategory,
        priceMin: filterPriceMin,
        priceMax: filterPriceMax,
        stock: filterStock,
        offer: filterOffer,
        page: currentPage,
        limit: productsPerPage,
      });

      console.log('Fetching products with params:', params.toString());
      console.log('Using token:', token);

      const res = await axios.get(`https://backend-ps76.onrender.com/api/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Fetched products response:', res.data);

      const baseUrl = 'https://backend-ps76.onrender.com';
      const productData = res.data.products || res.data || [];
      const initializedProducts = Array.isArray(productData)
        ? productData.map((product) => {
            let processedImage = product.image || '/default-product.jpg';
            let processedImages = product.images || [];

            if (!processedImage.startsWith('http')) {
              processedImage = `${baseUrl}${processedImage.startsWith('/') ? processedImage : '/' + processedImage}`;
            }
            processedImages = processedImages.map((img) =>
              !img.startsWith('http') ? `${baseUrl}${img.startsWith('/') ? img : '/' + img}` : img
            );

            return {
              ...product,
              selected: product.selected || false,
              image: processedImage,
              images: processedImages,
            };
          })
        : [];

      console.log('Initialized products:', initializedProducts);

      setProducts(initializedProducts);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load products. Check server or token.');
        setProducts([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (name === 'mainImage') {
      const file = files[0];
      if (file && !allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image (JPEG, PNG, or WebP)');
        return;
      }
      if (file && file.size > maxSize) {
        toast.error('Image size should not exceed 5MB');
        return;
      }
      setFormData((prev) => {
        if (prev.mainImage && typeof prev.mainImage !== 'string') {
          URL.revokeObjectURL(prev.mainImage);
        }
        return {
          ...prev,
          mainImage: file || null,
        };
      });
    } else if (name === 'images') {
      const validFiles = Array.from(files).filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid file type for ${file.name}. Please upload JPEG, PNG, or WebP.`);
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });
      setFormData((prev) => {
        prev.newImages.forEach((img) => {
          if (img && typeof img !== 'string') URL.revokeObjectURL(img);
        });
        return {
          ...prev,
          newImages: [...prev.newImages, ...validFiles],
        };
      });
    }
  };

  const handleSizeChange = (size) => {
    setFormData((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      stock: '',
      description: '',
      mainImage: null,
      existingImages: [],
      newImages: [],
      offer: '',
      sizes: [],
      isActive: true,
      brand: '',
      weight: '',
      model: '',
    });
    setEditingProductId(null);
    const mainImageInput = document.getElementById('mainImageInput');
    const additionalImagesInput = document.getElementById('additionalImagesInput');
    if (mainImageInput) mainImageInput.value = null;
    if (additionalImagesInput) additionalImagesInput.value = null;
    setShowForm(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCategory('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterStock('');
    setFilterOffer('');
    setCurrentPage(1);
    toast.success('Filters reset successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData();
    form.append('name', formData.name);
    form.append('price', formData.price);
    form.append('category', formData.category);
    form.append('stock', formData.stock);
    form.append('description', formData.description);
    form.append('offer', formData.offer);
    form.append('sizes', JSON.stringify(formData.sizes));
    form.append('isActive', formData.isActive);
    form.append('brand', formData.brand);

    let weightValue = formData.weight.trim();
    if (weightValue) {
      if (weightValue.toLowerCase().endsWith('g')) {
        weightValue = parseFloat(weightValue.replace(/g/i, '')) / 1000;
      } else if (weightValue.toLowerCase().endsWith('kg')) {
        weightValue = parseFloat(weightValue.replace(/kg/i, ''));
      } else {
        weightValue = parseFloat(weightValue);
      }
      if (isNaN(weightValue) || weightValue <= 0) {
        toast.error('Invalid weight format. Use numbers with "kg" or "g" (e.g., 0.5kg or 500g)');
        setSubmitting(false);
        return;
      }
      form.append('weight', weightValue);
      form.append('weightUnit', weightValue < 1 ? 'g' : 'kg');
    } else {
      form.append('weight', '');
      form.append('weightUnit', 'kg');
    }

    form.append('model', formData.model);
    if (formData.mainImage) form.append('image', formData.mainImage);
    formData.newImages.forEach((image) => form.append('images', image));
    if (editingProductId) {
      const cleanedExistingImages = formData.existingImages.map((img) =>
        img.replace('https://backend-ps76.onrender.com', '')
      );
      form.append('existingImages', JSON.stringify(cleanedExistingImages));
    }

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Submitting with token:', token);

      let updatedProduct;
      if (editingProductId) {
        const res = await axios.put(
          `https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`,
          form,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        updatedProduct = res.data.product;
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProductId
              ? { ...updatedProduct, image: `https://backend-ps76.onrender.com${updatedProduct.image}`, images: updatedProduct.images.map((img) => `https://backend-ps76.onrender.com${img}`) }
              : p
          )
        );
        toast.success('Product updated successfully!');
      } else {
        if (!formData.mainImage) throw new Error('Main image is required when adding a new product');
        const res = await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        updatedProduct = res.data.product;
        const processedImage = `https://backend-ps76.onrender.com${updatedProduct.image}`;
        const processedImages = updatedProduct.images.map((img) => `https://backend-ps76.onrender.com${img}`);
        setProducts((prev) => [{ ...updatedProduct, image: processedImage, images: processedImages }, ...prev].slice(0, productsPerPage));
        setCurrentPage(1);
        toast.success('Product added successfully!');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to save product.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      stock: product.stock,
      description: product.description,
      mainImage: null,
      existingImages: product.images || [],
      newImages: [],
      offer: product.offer || '',
      sizes: product.sizes || [],
      isActive: product.isActive,
      brand: product.brand || '',
      weight: product.weight
        ? product.weightUnit === 'g'
          ? `${product.weight * 1000}g`
          : `${product.weight}kg`
        : '',
      model: product.model || '',
    });
    setEditingProductId(product._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Deleting with token:', token);

      const res = await axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Product deleted successfully!');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Bulk deleting with token:', token);

      await Promise.all(
        selectedProducts.map((p) =>
          axios.delete(`https://backend-ps76.onrender.com/api/admin/products/${p._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setProducts((prev) => prev.filter((p) => !p.selected));
      toast.success(`${selectedProducts.length} products deleted successfully!`);
      fetchProducts();
    } catch (err) {
      console.error('Error bulk deleting products:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to bulk delete products.');
      }
    }
  };

  const handleDuplicate = async (product) => {
    const form = new FormData();
    form.append('name', `${product.name} (Copy)`);
    form.append('price', product.price);
    form.append('category', product.category);
    form.append('stock', product.stock);
    form.append('description', product.description);
    form.append('offer', product.offer || '');
    form.append('sizes', JSON.stringify(product.sizes || []));
    form.append('isActive', product.isActive);
    form.append('brand', product.brand || '');
    form.append('weight', product.weight || '');
    form.append('weightUnit', product.weightUnit || 'kg');
    form.append('model', product.model || '');
    form.append('image', product.image.replace('https://backend-ps76.onrender.com', '')); // Send existing image path
    product.images.forEach((img) => form.append('images', img.replace('https://backend-ps76.onrender.com', '')));

    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Duplicating with token:', token);

      const res = await axios.post('https://backend-ps76.onrender.com/api/admin/products', form, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newProduct = res.data.product;
      const processedImage = `https://backend-ps76.onrender.com${newProduct.image}`;
      const processedImages = newProduct.images.map((img) => `https://backend-ps76.onrender.com${img}`);
      setProducts((prev) => [{ ...newProduct, image: processedImage, images: processedImages }, ...prev].slice(0, productsPerPage));
      setCurrentPage(1);
      toast.success('Product duplicated successfully!');
      fetchProducts();
    } catch (err) {
      console.error('Error duplicating product:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to duplicate product.');
      }
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isTokenExpired(token)) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Toggling status with token:', token);

      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${productId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;
      const processedImage = `https://backend-ps76.onrender.com${updatedProduct.image}`;
      const processedImages = updatedProduct.images.map((img) => `https://backend-ps76.onrender.com${img}`);
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...updatedProduct, image: processedImage, images: processedImages } : p))
      );
      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error('Error toggling product status:', err.response ? err.response.data : err.message);
      if (err.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error(err.response?.data?.message || 'Failed to toggle product status.');
      }
    }
  };

  const toggleSelectProduct = (productId) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, selected: !p.selected } : p))
    );
  };

  const openPreviewModal = (product) => {
    setPreviewModal(product);
  };

  const closePreviewModal = () => {
    setPreviewModal(null);
  };

  const csvData = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    category: p.category,
    stock: p.stock,
    description: p.description,
    offer: p.offer || '',
    sizes: p.sizes?.join(', ') || '',
    isActive: p.isActive ? 'Yes' : 'No',
    image: p.image,
    images: p.images?.join(', ') || '',
    brand: p.brand || '',
    weight: p.weight || '',
    weightUnit: p.weightUnit || 'kg',
    model: p.model || '',
  }));

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="product-management-container">
      <div className="header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <button className="dashboard-btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="add-product-section">
        <button className="add-product-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hide Form' : 'Add New Product'}
        </button>
      </div>

      {showForm && (
        <section className="product-form-section">
          <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleInputChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {sizeOptions.length > 0 && (
              <div className="form-group">
                <label>Sizes</label>
                <div className="size-options">
                  {sizeOptions.map((size) => (
                    <label key={size} className="size-label">
                      <input type="checkbox" checked={formData.sizes.includes(size)} onChange={() => handleSizeChange(size)} />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Stock</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Offer (e.g., "35% off")</label>
              <input type="text" name="offer" value={formData.offer} onChange={handleInputChange} placeholder="e.g., 35% off" />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} placeholder="Enter brand name" />
            </div>
            <div className="form-group">
              <label>Weight (kg or g)</label>
              <input type="text" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g., 0.5kg or 500g" />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="Enter model name" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <label className="status-toggle">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} />
                Active
              </label>
            </div>
            <div className="form-group">
              <label>Main Image</label>
              <input type="file" id="mainImageInput" name="mainImage" accept="image/*" onChange={handleFileChange} required={!editingProductId} />
              {formData.mainImage && (
                <div className="image-preview">
                  <img
                    src={typeof formData.mainImage === 'string' ? formData.mainImage : URL.createObjectURL(formData.mainImage)}
                    alt="Main Preview"
                    onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }}
                  />
                </div>
              )}
              {editingProductId && !formData.mainImage && formData.existingImages.length > 0 && (
                <div className="image-preview">
                  <img src={formData.existingImages[0] || '/default-product.jpg'} alt="Current Main" onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Additional Images</label>
              <input type="file" id="additionalImagesInput" name="images" accept="image/*" multiple onChange={handleFileChange} />
              <div className="additional-images-preview">
                {formData.existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img src={image} alt={`Existing ${index}`} onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
                    <button type="button" className="delete-image-btn" onClick={() => setFormData((prev) => ({ ...prev, existingImages: prev.existingImages.filter((_, i) => i !== index) }))}>
                      ✕
                    </button>
                  </div>
                ))}
                {formData.newImages.map((image, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img src={URL.createObjectURL(image)} alt={`New ${index}`} onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
                    <button type="button" className="delete-image-btn" onClick={() => setFormData((prev) => ({ ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }))}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Add Product'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-section">
        <h2>Product List</h2>
        <div className="product-controls">
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input type="number" placeholder="Min Price" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="filter-input" min="0" />
          <input type="number" placeholder="Max Price" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="filter-input" min="0" />
          <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="filter-select">
            <option value="">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (1-5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <select value={filterOffer} onChange={(e) => setFilterOffer(e.target.value)} className="filter-select">
            <option value="">All Offers</option>
            <option value="hasOffer">Has Offer</option>
            <option value="noOffer">No Offer</option>
          </select>
          <button onClick={handleBulkDelete} className="bulk-delete-btn" disabled={!products.some((p) => p.selected)}>
            Bulk Delete
          </button>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset Filters
          </button>
          <CSVLink data={csvData} filename="products.csv" className="export-btn">
            Export to CSV
          </CSVLink>
        </div>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => {
              console.log('Rendering product:', product);
              return (
                <div key={product._id} className="product-card">
                  <input type="checkbox" checked={product.selected || false} onChange={() => toggleSelectProduct(product._id)} className="select-checkbox" />
                  <div className="image-wrapper">
                    <img src={product.image || '/default-product.jpg'} alt={product.name} className="product-image" onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
                  </div>
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p>Price: ₹{product.price.toFixed(2)}</p>
                    <p>Category: {product.category}</p>
                    <p>
                      Stock: {product.stock}{' '}
                      {product.stock === 0 ? <span className="stock-badge out-of-stock">Out of Stock</span> : product.stock <= 5 ? <span className="stock-badge low-stock">Low Stock</span> : <span className="stock-badge in-stock">In Stock</span>}
                    </p>
                    {product.offer && <p className="offer">Offer: {product.offer}</p>}
                    {product.sizes?.length > 0 && <p>Sizes: {product.sizes.join(', ')}</p>}
                    {product.brand && <p>Brand: {product.brand}</p>}
                    {product.weight && <p>Weight: {product.weightUnit === 'g' ? `${product.weight * 1000} g` : `${product.weight} kg`}</p>}
                    {product.model && <p>Model: {product.model}</p>}
                    <p>
                      Status: <span className={product.isActive ? 'status-active' : 'status-inactive'}>{product.isActive ? 'Active' : 'Inactive'}</span>
                    </p>
                  </div>
                  <div className="product-actions">
                    <button onClick={() => openPreviewModal(product)} className="preview-btn">
                      Preview
                    </button>
                    <button onClick={() => handleEdit(product)} className="edit-btn">
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(product)} className="duplicate-btn">
                      Duplicate
                    </button>
                    <button onClick={() => toggleProductStatus(product._id, product.isActive)} className={product.isActive ? 'deactivate-btn' : 'activate-btn'}>
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(product._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </section>

      {previewModal && (
        <div className="preview-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closePreviewModal}>
              ✕
            </button>
            <h2>{previewModal.name}</h2>
            <div className="image-wrapper">
              <img src={previewModal.image || '/default-product.jpg'} alt={previewModal.name} className="modal-image" onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
            </div>
            <p>Price: ₹{previewModal.price.toFixed(2)}</p>
            <p>Category: {previewModal.category}</p>
            <p>
              Stock: {previewModal.stock}{' '}
              {previewModal.stock === 0 ? <span className="stock-badge out-of-stock">Out of Stock</span> : previewModal.stock <= 5 ? <span className="stock-badge low-stock">Low Stock</span> : <span className="stock-badge in-stock">In Stock</span>}
            </p>
            {previewModal.offer && <p>Offer: {previewModal.offer}</p>}
            {previewModal.sizes?.length > 0 && <p>Sizes: {previewModal.sizes.join(', ')}</p>}
            {previewModal.brand && <p>Brand: {previewModal.brand}</p>}
            {previewModal.weight && <p>Weight: {previewModal.weightUnit === 'g' ? `${previewModal.weight * 1000} g` : `${previewModal.weight} kg`}</p>}
            {previewModal.model && <p>Model: {previewModal.model}</p>}
            <p>{previewModal.description}</p>
            {previewModal.images?.length > 0 && (
              <div className="additional-images">
                <h3>Additional Images</h3>
                <div className="image-gallery">
                  {previewModal.images.map((img, index) => (
                    <div key={index} className="image-wrapper">
                      <img src={img || '/default-product.jpg'} alt={`Additional ${index}`} className="gallery-image" onError={(e) => { e.target.src = '/default-product.jpg'; e.target.onerror = null; }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement; */



















































