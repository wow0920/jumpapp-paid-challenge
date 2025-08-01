import "./App.css";
import Dashboard from "./components/pages/Dashboard";
import Login from "./components/pages/Login";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const { isAuthenticated } = useSession();
  return <>{isAuthenticated ? <Dashboard /> : <Login />}</>;
}

export default App;
