import { NavLink } from 'react-router-dom';

const links = [
  { to: '/products', label: 'Products' },
  { to: '/customers', label: 'Customers' },
  { to: '/orders', label: 'Orders' },
];

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">Inventory&nbsp;&amp;&nbsp;Orders</span>
        </div>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
