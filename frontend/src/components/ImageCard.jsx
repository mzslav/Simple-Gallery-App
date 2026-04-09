import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getImageFileUrl } from "../services/api";
import "./ImageCard.css";

export default function ImageCard({ image }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <Link to={`/images/${image.id}`} className="image-card">
      <div className="image-card__thumb">
        {!loaded && !error && <div className="image-card__skeleton" />}
        {error ? (
          <div className="image-card__error">
            <span>⚠</span>
          </div>
        ) : (
          <img
            src={getImageFileUrl(image.filename)}
            alt={image.title}
            className={`image-card__img ${loaded ? "image-card__img--loaded" : ""}`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        )}
        <div className="image-card__overlay">
          <span className="image-card__view">View →</span>
        </div>
      </div>
      <div className="image-card__info">
        <h3 className="image-card__title">{image.title}</h3>
        <p className="image-card__meta">
          {image.author_email} ·{" "}
          {new Date(image.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
