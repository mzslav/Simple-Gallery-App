const path = require("path");
const fs = require("fs");
const ImageModel = require("../models/imageModel");
const { UPLOAD_DIR } = require("../services/imageService");

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

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid image ID" });
    }

    const image = await ImageModel.findById(id);
    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

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

    if (!title) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Title is required" });
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Title must be at least 3 characters" });
    }

    if (trimmedTitle.length > 100) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Title must not exceed 100 characters" });
    }

    const image = await ImageModel.create(trimmedTitle, req.file.filename, req.user.id);

    res.status(201).json({
      message: "Image uploaded successfully",
      image,
    });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error("UploadImage error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
};

const serveFile = async (req, res) => {
  try {
    const { filename } = req.params;

    if (filename.includes("/") || filename.includes("..")) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("ServeFile error:", err);
    res.status(500).json({ error: "Failed to serve file" });
  }
};

module.exports = { getAllImages, getImageById, uploadImage, serveFile };
