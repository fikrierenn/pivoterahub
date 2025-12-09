export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
      <div className="px-6 flex items-center justify-between text-sm text-gray-600">
        <div>
          <p>© 2024 ClientBrain. Tüm hakları saklıdır.</p>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-blue-600">Dokümantasyon</a>
          <a href="#" className="hover:text-blue-600">Destek</a>
          <a href="#" className="hover:text-blue-600">API</a>
        </div>
      </div>
    </footer>
  );
}
