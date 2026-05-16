import { Outlet, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/">
              <h1 className="text-2xl font-bold">ARC3</h1>
            </Link>
            <nav className="flex gap-6">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Auditorias
              </Link>
              <a href="https://github.com" className="text-sm text-muted-foreground hover:text-foreground">
                GitHub
              </a>
            </nav>
          </div>
          <Link to="/nova-auditoria">
            <Button>Nova Auditoria</Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>ARC3 — Framework de Auditoria por Davi Conceição & Raphael Almeida</p>
        </div>
      </footer>
    </div>
  );
}
