const ImageModel = require("../models/imageModel");

const getAllImages = async (req, res) => {
  try {
    const images = await ImageModel.findAll();
    res.json({ images });
  } catch (err) {
    console.error("GetAllImages error:", err);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};

const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) return res.status(400).json({ error: "Invalid image ID" });

    const image = await ImageModel.findById(id);
    if (!image) return res.status(404).json({ error: "Image not found" });

    res.json({ image });
  } catch (err) {
    console.error("GetImageById error:", err);
    res.status(500).json({ error: "Failed to fetch image" });
  }
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const { title } = req.body;
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return res.status(400).json({ error: "Invalid title length" });
    }

    // req.file.location містить публічний URL картинки на S3 (генерується multer-s3)
    const imageUrl = req.file.location; 
    
    const image = await ImageModel.create(title.trim(), imageUrl, req.user.id);

    res.status(201).json({
      message: "Image uploaded successfully",
      image,
    });
  } catch (err) {
    console.error("UploadImage error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

module.exports = { getAllImages, getImageById, uploadImage };