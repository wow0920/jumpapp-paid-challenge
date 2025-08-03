import "./App.css";
import Dashboard from "./components/pages/Dashboard";
import Login from "./components/pages/Login";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const { isAuthenticated } = useSession();

  return (
    <main className="w-screen h-screen overflow-auto flex flex-col">
      {isAuthenticated ? <Dashboard /> : <Login />}
      <div className="fixed bottom-5 text-center pointer-events-none backdrop-blur-xl px-5 py-2.5 rounded-full left-[50%] translate-x-[-50%] shadow-2xl z-10">
        2025© Made with ❤️ by{" "}
        <a target="_blank" href="mailto:frcarlton95@gmail.com" className="pointer-events-auto">
          Forrest Carlton
        </a>
      </div>
    </main>
  );
}

export default App;
