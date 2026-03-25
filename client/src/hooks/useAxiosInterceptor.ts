/* 
This hook is used to intercept all the requests and responses from the axios instance.
It is used to add the token to the header of the request.
It handles the 401 error and redirects the user to the login page.
*/

import axios, { type AxiosInstance } from "axios";
import { useEffect } from "react";
import { AuthServiceApiEndpoints } from "../services/freshr-api";

const useAxiosInterceptor = (api: AxiosInstance, useToken: boolean = true) => {
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (useToken) {
          const token = sessionStorage.getItem("accessToken");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (
          error.response?.status === 401 &&
          refreshToken &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}${AuthServiceApiEndpoints.refreshToken}`,
              { refresh: refreshToken },
            );

            const newAccessToken = refreshResponse.data.access;
            sessionStorage.setItem("accessToken", newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
          } catch (err) {
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(err);
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, useToken]);
  return api;
};

export default useAxiosInterceptor;
