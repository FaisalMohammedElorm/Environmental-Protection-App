import axios, { type InternalAxiosRequestConfig } from "axios";
import { supabase } from "@/lib/supabase/client";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

// supabase-js keeps the session's access token fresh in the background
// (auto-refreshing ahead of expiry), so reading it fresh on every request
// is enough — there's no need for our own 401-retry/refresh dance anymore.
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session?.access_token && config.headers) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});
