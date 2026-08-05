import { useGoogleLogin } from "@react-oauth/google";
import { isAxiosError } from "axios";
import createFreshrApiInstance, {
  AuthServiceApiEndpoints,
  UserServiceApiEndpoints,
} from "../../services/freshr-api";
import {
  startSession,
  saveGoogleProfile,
  saveUser,
  saveAccount,
} from "../../storage";
import type { StoredAccount } from "@freshr/shared";
import type { AccountMeResponse } from "@freshr/shared";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import useAxiosInterceptor from "../../hooks/useAxiosInterceptor";
import type { GoogleLoginResponse } from "@freshr/shared";
import GoogleGlyph from "./GoogleGlyph";
import { Button } from "@/components/ui/button";

export default function GoogleAuthBtn() {
  if (import.meta.env.VITE_USE_MOCK === "true") return null;

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const api = createFreshrApiInstance();
  const apiInceptor = useAxiosInterceptor(api, false);
  const { fetchData } = useFetch(apiInceptor);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log("[GoogleAuth] onSuccess fired", tokenResponse);
      console.log("[GoogleAuth] access_token:", tokenResponse.access_token);
      setError("");
      setIsLoading(true);
      try {
        console.log("[GoogleAuth] Sending token to backend...");
        const response = await fetchData(
          AuthServiceApiEndpoints.googleLogin,
          "POST",
          { token: tokenResponse.access_token },
        );
        console.log("[GoogleAuth] Backend response:", response);
        const data = response as GoogleLoginResponse;
        sessionStorage.setItem("accessToken", data.tokens.access ?? "");
        sessionStorage.setItem("refreshToken", data.tokens.refresh ?? "");
        sessionStorage.setItem("userId", data.user.id ?? "");
        sessionStorage.setItem("email", data.user.email ?? "");
        saveUser({
          id: data.user.id,
          email: data.user.email,
          is_active: data.user.is_active,
          created_at: data.user.created_at,
        });
        if (data.new_user) {
          saveGoogleProfile(data.profile);
          startSession();
          navigate("/onboarding");
        } else {
          try {
            const accountResp = await fetchData<AccountMeResponse>(
              UserServiceApiEndpoints.accountMe,
              "GET",
              null,
              { headers: { Authorization: `Bearer ${data.tokens.access}` } },
            );
            const account: StoredAccount = {
              id: accountResp.id,
              first_name: accountResp.first_name,
              last_name: accountResp.last_name,
              profile_picture_url: accountResp.profile_picture_url,
              address1: accountResp.address1,
              address2: accountResp.address2 ?? "",
              city: accountResp.city,
              postal_code: accountResp.postal_code,
              phone: accountResp.phone,
              tier_plan: accountResp.tier_plan,
              billing_interval: accountResp.billing_interval,
              subscription_status: accountResp.subscription_status,
            };
            saveAccount(account);
          } catch (err) {
            console.error("[GoogleAuth] Failed to fetch account:", err);
          }
          startSession();
          console.log("[GoogleAuth] NAVIGATING TO DASHBOARD");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("[GoogleAuth] Backend call failed:", err);
        const backendMessage = isAxiosError<{ error?: string }>(err)
          ? err.response?.data?.error
          : undefined;
        setError(backendMessage || "Google sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      console.error("[GoogleAuth] Google popup error:", error);
      setError("Google sign-in failed. Please try again.");
    },
  });

  return (
    <>
      {error && (
        <p role="alert" className="text-destructive mb-4 text-sm">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mb-6 w-full"
        onClick={() => googleLogin()}
        disabled={isLoading}
      >
        <GoogleGlyph />
        {isLoading ? "Signing in…" : "Continue with Google"}
      </Button>
    </>
  );
}
