import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import Cinzel font for the OUDLA logo
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

createRoot(document.getElementById("root")!).render(<App />);
