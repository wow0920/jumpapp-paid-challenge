import "./App.css";
import Dashboard from "./components/pages/Dashboard";
import Login from "./components/pages/Login";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const { isAuthenticated } = useSession();

  return (
    <main className="w-screen h-screen overflow-auto flex flex-col">
      <div aria-hidden="true" className="fixed hidden dark:md:block dark:opacity-100 -bottom-[30%] -left-[30%] z-0">
        <img
          className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large"
          alt="docs left background"
          src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/images/docs-left.png"
          data-loaded="true"
        />
      </div>
      <div
        aria-hidden="true"
        className="fixed hidden dark:md:block dark:opacity-70 -top-[50%] -right-[60%] 2xl:-top-[60%] 2xl:-right-[45%] z-0 rotate-12"
      >
        <img
          className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large"
          alt="docs right background"
          src="https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/images/docs-right.png"
          data-loaded="true"
        />
      </div>
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
