export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-sand-50">
      <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} CraftBox. Visi teisės saugomos.</p>
        <p>Rankų darbo 3D dekoro objektai.</p>
      </div>
    </footer>
  );
}
