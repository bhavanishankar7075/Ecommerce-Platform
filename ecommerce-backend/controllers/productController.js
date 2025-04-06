// backend/controllers/productController.js (example)
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

const addProduct = async (req, res) => {
  const { name, price, category, stock, description, offer, sizes, isActive, brand, weight, weightUnit, model } = req.body;
  const mainImage = req.file; // Assuming multer handles the main image
  const additionalImages = req.files; // Assuming multer handles multiple images

  // Save product to database with image paths
  const product = new Product({
    name,
    price,
    category,
    stock,
    description,
    image: `${BASE_URL}/uploads/${mainImage.filename}`, // Adjust path based on your upload logic
    images: additionalImages.map((file) => `${BASE_URL}/uploads/${file.filename}`),
    offer,
    sizes: JSON.parse(sizes),
    isActive,
    brand,
    weight,
    weightUnit,
    model,
  });

  await product.save();
  res.status(201).json({ product });
};