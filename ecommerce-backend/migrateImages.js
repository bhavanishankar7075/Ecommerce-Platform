const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Product = require('./models/Product'); // Adjust the path to your Product model
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configure Cloudinary using CLOUDINARY_URL from .env
cloudinary.config({
  url: process.env.CLOUDINARY_URL,
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Utility to upload an image to Cloudinary
const uploadToCloudinary = async (filePath, publicId) => {
  try {
    console.log(`Uploading file to Cloudinary: ${filePath}`);
    const result = await cloudinary.uploader.upload(filePath, {
      public_id: publicId,
      folder: 'products',
      overwrite: true,
    });
    console.log(`Successfully uploaded ${filePath} to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    console.error(`Error uploading ${filePath} to Cloudinary:`, err.message);
    return null;
  }
};

// Migration function
const migrateImages = async () => {
  try {
    await connectDB();

    // Fetch all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate`);

    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`Checking for image files in: ${uploadsDir}`);

    // Check if uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.error('Uploads directory does not exist. Please ensure the images are in the uploads/ directory.');
      process.exit(1);
    }

    for (const product of products) {
      console.log(`\nProcessing product: ${product.name} (${product._id})`);

      let updated = false;

      // Migrate main image
      if (product.image && product.image.startsWith('/uploads/')) {
        const imageFileName = path.basename(product.image);
        const imagePath = path.join(uploadsDir, imageFileName);

        if (fs.existsSync(imagePath)) {
          console.log(`Uploading main image (file) for product: ${product.name}`);
          const publicId = `main_${product._id}_${imageFileName.split('.')[0]}`;
          const cloudinaryUrl = await uploadToCloudinary(imagePath, publicId);

          if (cloudinaryUrl) {
            product.image = cloudinaryUrl;
            updated = true;
            console.log(`Main image updated to: ${cloudinaryUrl}`);
          } else {
            console.log(`Failed to upload main image for ${product.name}, keeping placeholder`);
            product.image = 'https://placehold.co/150';
            updated = true;
          }
        } else {
          console.log(`Main image file not found: ${imagePath}, setting to placeholder`);
          product.image = 'https://placehold.co/150';
          updated = true;
        }
      } else if (!product.image || product.image === 'https://via.placeholder.com/150') {
        console.log(`Main image for ${product.name} is invalid or placeholder, setting to new placeholder`);
        product.image = 'https://placehold.co/150';
        updated = true;
      } else {
        console.log(`Main image for ${product.name} already appears to be a Cloudinary URL or valid: ${product.image}`);
      }

      // Migrate additional images
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const updatedImages = [];
        for (let i = 0; i < product.images.length; i++) {
          const img = product.images[i];
          if (img && img.startsWith('/uploads/')) {
            const imageFileName = path.basename(img);
            const imagePath = path.join(uploadsDir, imageFileName);

            if (fs.existsSync(imagePath)) {
              console.log(`Uploading additional image ${i + 1} for product: ${product.name}`);
              const publicId = `additional_${product._id}_${i}_${imageFileName.split('.')[0]}`;
              const cloudinaryUrl = await uploadToCloudinary(imagePath, publicId);

              if (cloudinaryUrl) {
                updatedImages.push(cloudinaryUrl);
                console.log(`Additional image ${i + 1} updated to: ${cloudinaryUrl}`);
              } else {
                console.log(`Failed to upload additional image ${i + 1} for ${product.name}, using placeholder`);
                updatedImages.push('https://placehold.co/150');
              }
            } else {
              console.log(`Additional image file not found: ${imagePath}, setting to placeholder`);
              updatedImages.push('https://placehold.co/150');
            }
          } else if (img && img.includes('cloudinary')) {
            console.log(`Additional image ${i + 1} for ${product.name} is already a Cloudinary URL: ${img}`);
            updatedImages.push(img);
          } else {
            console.log(`Additional image ${i + 1} for ${product.name} is invalid, setting to placeholder`);
            updatedImages.push('https://placehold.co/150');
          }
        }
        if (updatedImages.length > 0) {
          product.images = updatedImages;
          updated = true;
        }
      } else {
        console.log(`No additional images to migrate for ${product.name}`);
        product.images = [];
      }

      // Save the updated product
      if (updated) {
        await product.save();
        console.log(`Product ${product.name} updated successfully in the database`);
      } else {
        console.log(`No updates needed for ${product.name}`);
      }
    }

    console.log('\nMigration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the migration
migrateImages();