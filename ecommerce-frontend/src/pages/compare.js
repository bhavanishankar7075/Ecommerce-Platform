// Compare.js
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Compare.css';

function Compare() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const products = state?.products || [];

  const handleClearComparison = () => {
    localStorage.setItem('selectedProducts', JSON.stringify([]));
    navigate('/products');
    toast.success('Comparison cleared!', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const handleBackToProducts = () => {
    navigate('/products');
  };

  if (products.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h3>No products selected for comparison</h3>
        <button className="btn-back" onClick={handleBackToProducts}>
          Back to Products
        </button>
      </div>
    );
  }

  // Define the attributes to compare
  const attributes = [
    { key: 'image', label: 'Image', render: (product) => (
      <img
        src={product.image || 'https://via.placeholder.com/100'}
        alt={product.name}
        className="compare-image"
        onError={(e) => (e.target.src = 'https://via.placeholder.com/100')}
      />
    )},
    { key: 'name', label: 'Name', render: (product) => product.name },
    { key: 'price', label: 'Price', render: (product) => `₹${Number(product.price).toFixed(2)}` },
    { key: 'category', label: 'Category', render: (product) => product.category || 'Uncategorized' },
    { key: 'stock', label: 'Stock', render: (product) => (product.stock || 0) > 0 ? 'In Stock' : 'Out of Stock' },
    { key: 'offer', label: 'Discount', render: (product) => product.offer ? `${product.offer}% off` : 'No Discount' },
    { key: 'action', label: 'Action', render: (product) => (
      <button
        className="btn-view-product"
        onClick={() => navigate(`/product/${product._id}`)}
      >
        View Product
      </button>
    )},
  ];

  return (
    <div className="compare-wrapper">
      <div className="container py-5">
        <div className="compare-header">
          <h1>Compare Products</h1>
          <div className="compare-actions">
            <button className="btn-clear" onClick={handleClearComparison}>
              Clear Comparison
            </button>
            <button className="btn-back" onClick={handleBackToProducts}>
              Back to Products
            </button>
          </div>
        </div>

        <div className="compare-table-wrapper">
          <table className="compare-table">
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key}>
                  <td className="attribute-label">{attr.label}</td>
                  {products.map((product, index) => (
                    <td key={index} className="attribute-value">
                      {attr.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Compare;