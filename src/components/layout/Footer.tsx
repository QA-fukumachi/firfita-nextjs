export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-8 px-6 flex items-center justify-between border-t border-surface/50 text-sm text-muted font-display tracking-wider mt-auto">
      <div>© {year} FIRFITA. All rights reserved.</div>
      <div className="flex gap-6">
        <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
      </div>
    </footer>
  );
}
