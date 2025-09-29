import axios from "axios";

const BASE_URL =
  /*import.meta.env.VITE_API_URL ||*/ "http://localhost:4200/api/v1";

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    url,
    method: options.method || "get",
    headers: options.headers || {},
    data: options.body || undefined,
    ...options,
  };

  if (!(options.body instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    console.error("Error de axios:", error);
    throw error;
  }
};
