import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadImage } from "../services/api";
import "./Upload.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024;

export default function Upload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (selectedFile) => {
    setError("");
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Only JPG, JPEG, and PNG files are allowed.");
      return;
    }
    if (selectedFile.size > MAX_SIZE) {
      setError("File size must not exceed 5 MB.");
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select an image.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (title.trim().length > 100) {
      setError("Title must not exceed 100 characters.");
      return;
    }

    setLoading(true);
    try {
      const data = await uploadImage(title.trim(), file);
      navigate(`/images/${data.image.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="upload-page page-enter">
      <div className="container">
        <div className="upload-layout">
          <div className="upload-header">
            <h1 className="upload-header__title">Upload image</h1>
            <p className="upload-header__subtitle">
              JPG or PNG · max 5 MB
            </p>
          </div>

          <form className="upload-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="upload-form__error">{error}</div>}

            {/* Drop zone */}
            <div
              className={`upload-dropzone ${dragOver ? "upload-dropzone--over" : ""} ${file ? "upload-dropzone--has-file" : ""}`}
              onClick={() => !file && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="upload-dropzone__preview" />
                  <button
                    type="button"
                    className="upload-dropzone__remove"
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <div className="upload-dropzone__placeholder">
                  <span className="upload-dropzone__icon">⊕</span>
                  <p className="upload-dropzone__text">
                    Drag & drop or <span>click to browse</span>
                  </p>
                  <p className="upload-dropzone__hint">JPG, JPEG, PNG · up to 5 MB</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {/* Title field */}
            <div className="upload-form__field">
              <label className="upload-form__label" htmlFor="title">
                Image title
              </label>
              <input
                id="title"
                type="text"
                className="upload-form__input"
                placeholder="Give your image a title…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <span className="upload-form__char-count">
                {title.length}/100
              </span>
            </div>

            <button
              type="submit"
              className="upload-form__submit"
              disabled={loading}
            >
              {loading ? "Uploading…" : "Upload image"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
