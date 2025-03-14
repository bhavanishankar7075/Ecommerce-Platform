  // admin-frontend/src/pages/ProductManagement.js
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ProductManagement.css';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    featured: false,
    brand: '', // New field
    weight: '', // New field
    model: '', // New field
  });
  const [image, setImage] = useState(null); // Main image
  const [images, setImages] = useState([]); // Additional images
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home Appliances',
    'Furniture', 'Books', 'Toys', 'Sports', 'Beauty', 'Jewelry', 'Groceries',
    'Automotive', 'Health', 'Stationery',
  ];

  // Fetch products
  const fetchProducts = useCallback(async (token) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched Products:', res.data);
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching products');
      console.error('Fetch Products Error:', err.response?.data);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load products on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }
    fetchProducts(token);
  }, [navigate, fetchProducts]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Updating ${name} to ${value}`);
    setForm((prev) => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };
      console.log('Updated Form State:', newState);
      return newState;
    });
  };

  // Handle multiple images upload
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
  };

  // Handle form submission (Add/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No valid token. Please log in.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name || '');
    formData.append('price', form.price || '');
    formData.append('stock', form.stock || '');
    formData.append('category', form.category || '');
    formData.append('description', form.description || '');
    formData.append('featured', form.featured);
    formData.append('brand', form.brand || ''); // New field
    formData.append('weight', form.weight || ''); // New field
    formData.append('model', form.model || ''); // New field
    if (image) formData.append('image', image);
    images.forEach((img) => formData.append('images', img));

    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}: ${value}`);
    }

    try {
      setLoading(true);
      let response;
      if (editingId) {
        response = await axios.put(`http://localhost:5001/api/admin/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('PUT Response:', response.data);
      } else {
        response = await axios.post('http://localhost:5001/api/admin/products', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('POST Response:', response.data);
      }
      setForm({
        name: '', price: '', stock: '', category: '', description: '',
        featured: false, brand: '', weight: '', model: '',
      });
      setImage(null);
      setImages([]);
      setEditingId(null);
      if (response.data.product) {
        setProducts((prev) =>
          editingId
            ? prev.map((p) => (p._id === editingId ? response.data.product : p))
            : [...prev, response.data.product]
        );
      }
      fetchProducts(token);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving product');
      console.error('Save Error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No valid token. Please log in.');
      navigate('/login');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:5001/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete Response:', response.data);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting product');
      console.error('Delete Error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    console.log('Editing Product:', product);
    setForm({
      name: product.name || '',
      price: product.price ? product.price.toString() : '',
      stock: product.stock ? product.stock.toString() : '',
      category: product.category || '',
      description: product.description || '',
      featured: product.featured || false,
      brand: product.brand || '', // New field
      weight: product.weight ? product.weight.toString() : '', // New field
      model: product.model || '', // New field
    });
    setEditingId(product._id);
    setImage(null);
    setImages([]);
  };

  return (
    <div className="product-management">
      <div className="header">
        <h2>Manage Products</h2>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="price"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={handleInputChange}
          required
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleInputChange}
        />
        <select
          name="category"
          value={form.category}
          onChange={handleInputChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleInputChange}
          rows="4"
        />
        <input
          type="text"
          name="brand"
          placeholder="Brand"
          value={form.brand}
          onChange={handleInputChange}
        />
        <input
          type="number"
          name="weight"
          step="0.1"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="model"
          placeholder="Model"
          value={form.model}
          onChange={handleInputChange}
        />
        <label>
          Featured:
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleInputChange}
          />
        </label>
        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
          accept="image/*"
        />
        <input
          type="file"
          multiple
          onChange={handleImagesChange}
          accept="image/*"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : editingId ? 'Update' : 'Add'} Product
        </button>
      </form>

      {loading && !error ? <p>Loading products...</p> : null}

      <table>
        <thead>
          <tr>
            <th>Main Image</th>
            <th>Additional Images</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Description</th>
            <th>Brand</th>
            <th>Weight</th>
            <th>Model</th>
            <th>Featured</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    width="50"
                    onError={(e) => {
                      e.target.src = '/no-image.jpg';
                    }}
                  />
                ) : (
                  <img
                    src="/no-image.jpg"
                    alt="Default"
                    width="50"
                    onError={(e) => {
                      e.target.src = 'http://localhost:5001/uploads/default-image.png';
                    }}
                  />
                )}
              </td>
              <td>
                {product.images && product.images.length > 0 ? (
                  product.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Additional ${index}`}
                      width="50"
                      onError={(e) => {
                        e.target.src = '/no-image.jpg';
                      }}
                      style={{ marginRight: '5px' }}
                    />
                  ))
                ) : (
                  '-'
                )}
              </td>
              <td>{product.name}</td>
              <td>₹{Number(product.price).toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>{product.category}</td>
              <td>{product.description || '-'}</td>
              <td>{product.brand || '-'}</td>
              <td>{product.weight ? `${product.weight} kg` : '-'}</td>
              <td>{product.model || '-'}</td>
              <td>{product.featured ? 'Yes' : 'No'}</td>
              <td>{new Date(product.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductManagement;  



















































































































/*  import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ProductManagement.css';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    specifications: '',
    brand: '',
    weight: '',
  });
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Electronics', 'Clothing', 'Footwear', 'Accessories', 'Home Appliances',
    'Furniture', 'Books', 'Toys', 'Sports', 'Beauty', 'Jewelry', 'Groceries',
    'Automotive', 'Health', 'Stationery',
  ];

  // Fetch products
  const fetchProducts = useCallback(async (token) => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched Products:', res.data);
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching products');
      console.error('Fetch Products Error:', err.response?.data);
      if (err.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load products on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found. Please log in.');
      navigate('/login');
      return;
    }
    fetchProducts(token);
  }, [navigate, fetchProducts]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`);
    setForm((prev) => {
      const newState = { ...prev, [name]: value };
      console.log('Updated Form State:', newState);
      return newState;
    });
  };

  // Handle form submission (Add/Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No valid token. Please log in.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value || '');
    });
    if (image) formData.append('image', image);

    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}: ${value}`);
    }

    try {
      setLoading(true);
      let response;
      if (editingId) {
        response = await axios.put(`http://localhost:5001/api/admin/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('PUT Response:', response.data);
      } else {
        response = await axios.post('http://localhost:5001/api/admin/products', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('POST Response:', response.data);
      }
      setForm({
        name: '', price: '', stock: '', category: '', description: '',
        specifications: '', brand: '', weight: '',
      });
      setImage(null);
      setEditingId(null);
      if (response.data.product) {
        setProducts((prev) =>
          editingId
            ? prev.map((p) => (p._id === editingId ? response.data.product : p))
            : [...prev, response.data.product]
        );
      }
      fetchProducts(token);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving product');
      console.error('Save Error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No valid token. Please log in.');
      navigate('/login');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:5001/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete Response:', response.data);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting product');
      console.error('Delete Error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    console.log('Editing Product:', product);
    setForm({
      name: product.name || '',
      price: product.price ? product.price.toString() : '',
      stock: product.stock ? product.stock.toString() : '',
      category: product.category || '',
      description: product.description || '',
      specifications: product.specifications || '',
      brand: product.brand || '',
      weight: product.weight ? product.weight.toString() : '',
    });
    setEditingId(product._id);
  };

  return (
    <div className="product-management">
      <div className="header">
        <h2>Manage Products</h2>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleInputChange} required />
        <input type="number" name="price" step="0.01" placeholder="Price" value={form.price} onChange={handleInputChange} required />
        <input type="number" name="stock" placeholder="Stock" value={form.stock} onChange={handleInputChange} required />
        <select name="category" value={form.category} onChange={handleInputChange} required>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleInputChange} rows="4" />
        <textarea name="specifications" placeholder="Specifications" value={form.specifications} onChange={handleInputChange} rows="4" />
        <input type="text" name="brand" placeholder="Brand" value={form.brand} onChange={handleInputChange} />
        <input type="number" name="weight" step="0.1" placeholder="Weight (kg)" value={form.weight} onChange={handleInputChange} />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : editingId ? 'Update' : 'Add'} Product
        </button>
      </form>

      {loading && !error ? <p>Loading products...</p> : null}

      <table>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
            <th>Description</th>
            <th>Specifications</th>
            <th>Brand</th>
            <th>Weight</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                {product.image ? (
                  <img src={product.image} alt={product.name} width="50" onError={(e) => (e.target.src = 'http://localhost:5001/uploads/default-image.png')} />
                ) : (
                  <img src="http://localhost:5001/uploads/default-image.png" alt="Default" width="50" />
                )}
              </td>
              <td>{product.name}</td>
              <td>₹{Number(product.price).toFixed(2)}</td>
              <td>{product.stock}</td>
              <td>{product.category}</td>
              <td>{product.description || '-'}</td>
              <td>{product.specifications || '-'}</td>
              <td>{product.brand || '-'}</td>
              <td>{product.weight ? `${product.weight} kg` : '-'}</td>
              <td>
                <button onClick={() => handleEdit(product)}>Edit</button>
                <button onClick={() => handleDelete(product._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductManagement;     */