import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllImages } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ImageCard from "../components/ImageCard";
import "./Gallery.css";

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    getAllImages()
      .then((data) => setImages(data.images))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="gallery-page page-enter">
      <div className="container">
        <div className="gallery-header">
          <div>
            <h1 className="gallery-header__title">Gallery</h1>
            <p className="gallery-header__subtitle">
              {images.length > 0
                ? `${images.length} image${images.length !== 1 ? "s" : ""}`
                : "No images yet"}
            </p>
          </div>
          {user && (
            <Link to="/upload" className="gallery-header__btn">
              + Upload image
            </Link>
          )}
        </div>

        {loading && (
          <div className="gallery-loading">
            <div className="spinner" />
          </div>
        )}

        {error && (
          <div className="gallery-error">
            <p>⚠ Failed to load gallery: {error}</p>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="gallery-empty">
            <span className="gallery-empty__icon">◈</span>
            <h2>Nothing here yet</h2>
            <p>
              {user
                ? "Be the first to upload an image."
                : "Sign in to start uploading images."}
            </p>
            {user ? (
              <Link to="/upload" className="gallery-empty__btn">
                Upload your first image
              </Link>
            ) : (
              <Link to="/login" className="gallery-empty__btn">
                Sign in
              </Link>
            )}
          </div>
        )}

        {!loading && !error && images.length > 0 && (
          <div className="gallery-grid">
            {images.map((img) => (
              <ImageCard key={img.id} image={img} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
