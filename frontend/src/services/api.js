import { fetchAuthSession } from "aws-amplify/auth";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getHeaders = async (extra = {}) => {
  let token = null;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString(); 
  } catch (err) {
    console.warn("No active session or failed to get token");
  }

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

export const getAllImages = async () => {
  const res = await fetch(`${BASE_URL}/images`, {
    headers: await getHeaders(),
  });
  return handleResponse(res);
};

export const getImageById = async (id) => {
  const res = await fetch(`${BASE_URL}/images/${id}`, {
    headers: await getHeaders(),
  });
  return handleResponse(res);
};

export const uploadImage = async (title, file) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("image", file);

  const headers = await getHeaders();
  delete headers["Content-Type"]; 

  const res = await fetch(`${BASE_URL}/images/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(res);
};

const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL;

export const getImageFileUrl = (filename) => {
  if (!filename) return "";

  if (filename.startsWith("http")) return filename; 

  const key = filename.startsWith("uploads/") ? filename : `uploads/${filename}`;
  return `${S3_BUCKET_URL}/${key}`;
};