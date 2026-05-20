const express = require("express");
const router = express.Router();
const { getAllImages, getImageById, uploadImage } = require("../controllers/imageController");
const authenticate = require("../middleware/auth");
const { upload } = require("../services/imageService");

router.get("/", getAllImages);
router.get("/:id", getImageById);

router.post(
  "/upload",
  authenticate,
  upload.single("image"),
  (err, req, res, next) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  },
  uploadImage
);

module.exports = router;