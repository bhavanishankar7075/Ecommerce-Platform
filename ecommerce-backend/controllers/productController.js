// backend/controllers/productController.js (example)
const addProduct = async (req, res) => {
  const { name, price, category, stock, description, offer, sizes, isActive, brand, weight, weightUnit, model } = req.body;
  const mainImage = req.files['image'][0]; // Main image from 'image' field
  const additionalImages = req.files['images'] || []; // Additional images from 'images' field

  const product = new Product({
    name,
    price,
    category,
    stock,
    description,
    image: `${process.env.BASE_URL}/uploads/${mainImage.filename}`, // Main image URL
    images: additionalImages.map(file => `${process.env.BASE_URL}/uploads/${file.filename}`), // Additional images URLs
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