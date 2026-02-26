import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import compression from "compression";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./prod";
import path from "path";
import fs from "fs";
import { initSEO } from "./seo-inject";

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());

const behindProxy = !!(
  process.env.REPL_ID ||
  process.env.TRUST_PROXY === "true" ||
  process.env.NODE_ENV === "production"
);
if (behindProxy) {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Validate critical environment variables
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error(
    "❌ ERRO CRÍTICO: SESSION_SECRET não configurado ou muito fraco (mínimo 32 caracteres)",
  );
  process.exit(1);
}

// Configure session middleware with MemoryStore
const MemoryStore = createMemoryStore(session);

const isProduction = process.env.NODE_ENV === "production";

const sessionStore = new MemoryStore({
  checkPeriod: 86400000,
});

app.use(
  session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: sessionStore,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: "lax",
      path: "/",
    },
  }),
);

app.use(
  "/attached_assets",
  express.static(path.resolve(import.meta.dirname, "../attached_assets"), {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }),
);
app.use(
  "/uploads",
  express.static(path.resolve(import.meta.dirname, "../public/uploads"), {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }),
);
app.use(
  "/reviews",
  express.static(path.resolve(import.meta.dirname, "../public/reviews"), {
    maxAge: "7d",
    etag: true,
    lastModified: true,
  }),
);

// Middleware to restore session from x-session-id header
// The frontend stores the sessionId in localStorage and sends it via header
// This ensures the session is restored even if cookies are lost (e.g., after server restart)
app.use((req, res, next) => {
  const headerSessionId = req.headers["x-session-id"] as string;
  if (headerSessionId && !req.session?.isAdmin) {
    sessionStore.get(headerSessionId, (err, sess) => {
      if (!err && sess && (sess as any).isAdmin) {
        req.sessionID = headerSessionId;
        req.session = Object.assign(req.session || {}, sess) as any;
      }
      next();
    });
  } else {
    next();
  }
});

// Request logging middleware (without sensitive data)
app.use((req, res, next) => {
  if (
    req.path.startsWith("/api/admin") &&
    process.env.NODE_ENV === "development"
  ) {
    console.log("🔵 Admin Request:", req.method, req.path, {
      sessionID: req.sessionID.substring(0, 8) + "...",
      hasSession: !!req.session,
      isAdmin: req.session?.isAdmin,
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  await initSEO();

  // Product OG middleware - intercepts product URLs for social media crawlers
  const { injectProductOG } = await import("./seo-inject");

  app.use(async (req, res, next) => {
    const url = req.path;
    const productMatch = url.match(/^\/produto\/([^/]+)\/?$/);
    if (!productMatch) return next();

    const productId = productMatch[1];
    try {
      let templatePath: string;
      if (process.env.NODE_ENV === "development") {
        templatePath = path.resolve(
          import.meta.dirname,
          "..",
          "client",
          "index.html",
        );
      } else {
        templatePath = path.resolve(
          import.meta.dirname,
          "public",
          "index.html",
        );
      }

      if (!fs.existsSync(templatePath)) return next();

      let html = fs.readFileSync(templatePath, "utf-8");
      const modified = await injectProductOG(html, productId);
      if (!modified) return next();

      if (process.env.NODE_ENV === "development") {
        const viteMod = "./vite";
        try {
          const viteInstance = (app as any).__viteDevServer;
          if (viteInstance) {
            const page = await viteInstance.transformIndexHtml(url, modified);
            return res
              .status(200)
              .set({ "Content-Type": "text/html" })
              .end(page);
          }
        } catch {}
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(modified);
    } catch (err) {
      console.error("Product OG middleware error:", err);
      next();
    }
  });

  if (process.env.NODE_ENV === "development") {
    const viteMod = "./vite";
    const { setupVite } = await import(viteMod);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
