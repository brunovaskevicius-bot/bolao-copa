"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "⭐ Meus Palpites" },
  { href: "/resultados", label: "⚽ Resultados" },
  { href: "/enviar", label: "📤 Enviar Palpite" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-green-700 text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4">
        <div className="py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              🌍 Bolão da Copa 2026
            </h1>
            <p className="text-green-200 text-xs mt-0.5">Carlita &amp; Amigos</p>
          </div>
        </div>
        <nav className="flex gap-1 pb-0">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                  isActive
                    ? "bg-slate-50 text-green-800"
                    : "text-green-100 hover:bg-green-600"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
