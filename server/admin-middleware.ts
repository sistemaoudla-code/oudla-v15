import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";

// Track failed login attempts for brute force protection
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutos

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') {
    console.log("🔒 Admin check:", {
      hasSession: !!req.session,
      isAdmin: req.session?.isAdmin
    });
  }
  
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Não autorizado. Admin apenas." });
  }
  
  next();
}

export async function loginAdmin(username: string, password: string): Promise<boolean> {
  try {
    // Sanitizar entrada
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3 || cleanUsername.length > 50) {
      return false;
    }
    
    // Verificar rate limiting por IP/username
    const attemptKey = cleanUsername;
    const now = Date.now();
    const attempt = loginAttempts.get(attemptKey);
    
    if (attempt && now - attempt.timestamp < ATTEMPT_WINDOW) {
      if (attempt.count >= MAX_ATTEMPTS) {
        console.warn(`⚠️ Muitas tentativas de login para: ${cleanUsername}`);
        return false;
      }
    } else {
      loginAttempts.set(attemptKey, { count: 0, timestamp: now });
    }
    
    // Buscar admin no banco de dados
    const admin = await storage.getAdminByUsername(cleanUsername);
    
    if (!admin) {
      // Incrementar tentativas mesmo que usuário não exista (timing attack prevention)
      const current = loginAttempts.get(attemptKey) || { count: 0, timestamp: now };
      current.count++;
      loginAttempts.set(attemptKey, current);
      return false;
    }
    
    if (!admin.isActive) {
      return false;
    }
    
    // Verificar senha com bcrypt (timing-safe comparison)
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    
    if (isValid) {
      // Limpar tentativas de login bem-sucedidas
      loginAttempts.delete(attemptKey);
      // Atualizar último login
      await storage.updateAdminLastLogin(cleanUsername);
      return true;
    } else {
      // Incrementar tentativas falhadas
      const current = loginAttempts.get(attemptKey) || { count: 0, timestamp: now };
      current.count++;
      loginAttempts.set(attemptKey, current);
    }
    
    return false;
  } catch (error) {
    console.error("❌ Login admin error:", error);
    return false;
  }
}

export function setAdminSession(req: Request, username: string) {
  if (req.session) {
    req.session.isAdmin = true;
    req.session.userId = 'admin';
    req.session.adminUsername = username;
    
    req.session.save();
    
    if (process.env.NODE_ENV === 'development') {
      console.log("📝 Sessão admin definida para:", username.substring(0, 3) + "***");
    }
  }
}

export function clearAdminSession(req: Request) {
  if (req.session) {
    req.session.isAdmin = false;
    delete req.session.userId;
    delete req.session.adminUsername;
  }
}
