import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = stored || 'dark';
    
    if (!stored) {
      localStorage.setItem('theme', 'dark');
    }
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    document.documentElement.style.colorScheme = initialTheme;
    // Forçar fundo escuro no body para evitar flash branco
    document.body.style.backgroundColor = initialTheme === 'dark' ? '#141517' : '#fafafa';

    const handleExternalToggle = () => {
      toggleTheme();
    };

    window.addEventListener('toggle-theme', handleExternalToggle);
    return () => window.removeEventListener('toggle-theme', handleExternalToggle);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    document.documentElement.style.colorScheme = newTheme;
    document.body.style.backgroundColor = newTheme === 'dark' ? '#141517' : '#fafafa';
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="h-9 w-9"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="sr-only">alternar tema</span>
    </Button>
  );
}