import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registra o Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registrado com sucesso:", registration.scope);
        
        // Verifica atualizações ao iniciar
        registration.update();
      })
      .catch((error) => {
        console.log("[SW] Falha ao registrar:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
