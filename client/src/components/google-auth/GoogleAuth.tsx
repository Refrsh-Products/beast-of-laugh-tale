import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

export default function GoogleAuth() {
  const clientId = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          console.log(credentialResponse);
        }}
        onError={() => {
          console.log("Login Failed");
        }}
      />
    </GoogleOAuthProvider>
  );
}
