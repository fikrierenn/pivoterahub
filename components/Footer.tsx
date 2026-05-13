export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-3 mt-auto">
      <div className="px-6 flex items-center justify-between text-xs text-zinc-500">
        <p>© 2026 PivotaraHub</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-zinc-900 transition-colors">Dokümantasyon</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">Destek</a>
          <a href="#" className="hover:text-zinc-900 transition-colors">API</a>
        </div>
      </div>
    </footer>
  );
}
