import React from "react";
import ReactDOM from "react-dom/client";
import { Amplify } from "aws-amplify";
import App from "./App.jsx";
import "./index.css";

// Конфігурація AWS Amplify для роботи з Cognito
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "REGION_XXXXX",
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "XXXXXXXXXXXX",
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);