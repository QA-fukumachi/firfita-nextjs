export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-8 px-6 flex flex-col md:flex-row items-center justify-between border-t border-surface/50 text-sm text-muted font-display tracking-wider mt-auto gap-4 md:gap-0">
      <div>© {year} FIRFITA. All rights reserved.</div>
      
      <div className="flex gap-6 items-center">
        <div className="flex gap-4">
          <a href="https://www.instagram.com/__firfita?igsh=MThpcmcwb29mNTlkaw==" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61579155432767" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
        </div>
        <a href="/Terms%20and%20Conditions/Terms%20and%20conditions.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Terms & Conditions</a>
      </div>
    </footer>
  );
}
