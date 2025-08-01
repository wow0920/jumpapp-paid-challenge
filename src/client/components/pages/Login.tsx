import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useSession } from "../providers/SessionProvider";

export default function Login() {
  const { refreshUser } = useSession();

  const handleLogin = async (response: any) => {
    const idToken = response.credential;
    await axios.post("/api/google-login", { idToken }, { withCredentials: true });
    refreshUser();
  };

  return <GoogleLogin onSuccess={handleLogin} onError={() => console.error("Google Sign-In failed")} />;
}
