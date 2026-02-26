import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

interface AdminSaveContextType {
  registerSave: (fn: (() => Promise<void>) | null) => void;
  hasSave: boolean;
  isSaving: boolean;
  save: () => Promise<void>;
}

const AdminSaveContext = createContext<AdminSaveContextType>({
  registerSave: () => {},
  hasSave: false,
  isSaving: false,
  save: async () => {},
});

export function AdminSaveProvider({ children }: { children: React.ReactNode }) {
  const saveFnRef = useRef<(() => Promise<void>) | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const registerSave = useCallback((fn: (() => Promise<void>) | null) => {
    saveFnRef.current = fn;
    setHasSave(fn !== null);
  }, []);

  const save = useCallback(async () => {
    if (!saveFnRef.current) return;
    setIsSaving(true);
    try {
      await saveFnRef.current();
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <AdminSaveContext.Provider value={{ registerSave, hasSave, isSaving, save }}>
      {children}
    </AdminSaveContext.Provider>
  );
}

export function useAdminSave(saveFn: (() => Promise<void>) | null) {
  const ctx = useContext(AdminSaveContext);
  const fnRef = useRef(saveFn);
  fnRef.current = saveFn;
  const stableRef = useRef<(() => Promise<void>) | null>(null);

  if (saveFn && !stableRef.current) {
    stableRef.current = () => fnRef.current!();
  }
  if (!saveFn && stableRef.current) {
    stableRef.current = null;
  }

  useEffect(() => {
    ctx.registerSave(stableRef.current);
    return () => ctx.registerSave(null);
  }, [ctx.registerSave, !!saveFn]);

  return ctx;
}

export { AdminSaveContext };
