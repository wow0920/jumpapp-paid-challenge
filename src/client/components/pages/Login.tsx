import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function Login() {
  const handleLogin = async (response: any) => {
    const idToken = response.credential;
    await axios.post("/api/google-login", { idToken }, { withCredentials: true });
    window.location.reload(); // or re-fetch session
  };

  return <GoogleLogin onSuccess={handleLogin} onError={() => console.error("Google Sign-In failed")} />;
}
