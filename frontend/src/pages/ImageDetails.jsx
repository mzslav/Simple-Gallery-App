import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getImageById, getImageFileUrl } from "../services/api";
import "./ImageDetails.css";

export default function ImageDetails() {
  const { id } = useParams();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    getImageById(id)
      .then((data) => setImage(data.image))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = image.filename.replace("uploads/", ""); 
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download image. CORS issue?");
  }
};

  if (loading) {
    return (
      <main className="details-page page-enter">
        <div className="container">
          <div className="details-loading">
            <div className="spinner" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !image) {
    return (
      <main className="details-page page-enter">
        <div className="container">
          <div className="details-error">
            <h2>Image not found</h2>
            <p>{error || "This image does not exist."}</p>
            <Link to="/gallery" className="details-back">← Back to gallery</Link>
          </div>
        </div>
      </main>
    );
  }

  const fileUrl = getImageFileUrl(image.filename);

  return (
    <main className="details-page page-enter">
      <div className="container">
        <Link to="/gallery" className="details-back">← Back to gallery</Link>

        <div className="details-layout">
          <div className="details-image-wrap">
            {!imgLoaded && <div className="details-image-skeleton" />}
            <img
              src={fileUrl}
              alt={image.title}
              crossOrigin="anonymous"
              className={`details-image ${imgLoaded ? "details-image--loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
            />
          </div>

          <aside className="details-meta">
            <h1 className="details-meta__title">{image.title}</h1>

            <dl className="details-meta__list">
              <div className="details-meta__row">
                <dt>Author</dt>
                <dd>{image.author_email}</dd>
              </div>
              <div className="details-meta__row">
                <dt>Uploaded</dt>
                <dd>
                  {new Date(image.created_at).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
              <div className="details-meta__row">
                <dt>File</dt>
                <dd className="details-meta__filename">{image.filename}</dd>
              </div>
            </dl>

              <button onClick={handleDownload} className="details-download">
                ↓ Download image
              </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
