import Link from "next/link";

export function AppNav() {
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/gifts", label: "Gifts" },
    { href: "/theme", label: "Theme of the Year" },
    { href: "/occasions/birthday", label: "Birthday" },
    { href: "/occasions/anniversary", label: "Anniversary" },
    { href: "/occasions/christmas", label: "Christmas" },
    { href: "/occasions/valentines", label: "Valentine's" },
    { href: "/history", label: "History" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar__brand">
        <span className="eyebrow">Gift Tracker</span>
        <h1>Private vault</h1>
      </div>
      <div className="sidebar__links">
        {links.map((link) => (
          <Link key={link.href} href={link.href} prefetch={false} className="sidebar__link">
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
