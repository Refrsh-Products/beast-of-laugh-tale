/* 
This hook is used to intercept all the requests and responses from the axios instance.
It is used to add the token to the header of the request.
It handles the 401 error and redirects the user to the login page.
*/

import type { AxiosInstance } from "axios";
import { useEffect } from "react";
import { AuthServiceApiEndpoints } from "../services/freshr-api";
import { redirect } from "react-router-dom";

const useAxiosInterceptor = (api: AxiosInstance, useToken: boolean = true) => {
  const accessToken = sessionStorage.getItem("accessToken");
  const refreshToken = sessionStorage.getItem("refreshToken");
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken && useToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          refreshToken &&
          !originalRequest._retry
        ) {
          originalRequest.__retry == true;

          try {
            const refreshResponse = await api.post(
              AuthServiceApiEndpoints.refreshToken,
              {
                refresh: refreshToken,
              },
            );

            const newAccessToken = refreshResponse.data.access;
            sessionStorage.setItem("token", newAccessToken);

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
          } catch (err) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("refreshToken");
            return redirect("/login");
          }
        }
        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [api, accessToken, refreshToken, useToken]);
  return api;
};

export default useAxiosInterceptor;
