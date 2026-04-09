const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};


export const register = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const getMe = async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: headers(),
  });
  return handleResponse(res);
};



export const getAllImages = async () => {
  const res = await fetch(`${BASE_URL}/images`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const getImageById = async (id) => {
  const res = await fetch(`${BASE_URL}/images/${id}`, {
    headers: headers(),
  });
  return handleResponse(res);
};

export const uploadImage = async (title, file) => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/images/upload`, {
    method: "POST",
    headers: {
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: formData,
  });
  return handleResponse(res);
};

export const getImageFileUrl = (filename) =>
  `${BASE_URL}/images/file/${filename}`;
