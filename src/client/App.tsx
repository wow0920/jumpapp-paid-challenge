import "./App.css";
import Dashboard from "./components/pages/Dashboard";
import Login from "./components/pages/Login";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const { isAuthenticated } = useSession();

  return (
    <main className="w-screen h-screen overflow-auto flex flex-col">
      {isAuthenticated ? <Dashboard /> : <Login />}
      <div className="fixed bottom-5 w-full text-center pointer-events-none">
        2025© Made with ❤️ by{" "}
        <a target="_blank" href="mailto:frcarlton95@gmail.com" className="pointer-events-auto">
          Forrest Carlton
        </a>
      </div>
    </main>
  );
}

export default App;
