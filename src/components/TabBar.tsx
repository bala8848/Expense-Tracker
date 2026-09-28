import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, BarChart3, Plus, Wallet, Repeat } from 'lucide-react';

export default function TabBar() {
  return (
    <nav className="tab-bar">
      <NavLink to="/" end className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Home size={22} strokeWidth={2} />
        <span className="tab-item-label">Home</span>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <CalendarDays size={22} strokeWidth={2} />
        <span className="tab-item-label">History</span>
      </NavLink>
      <NavLink to="/budget" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Wallet size={22} strokeWidth={2} />
        <span className="tab-item-label">Income</span>
      </NavLink>
      <NavLink to="/recurring" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Repeat size={22} strokeWidth={2} />
        <span className="tab-item-label">Default Spends</span>
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <BarChart3 size={22} strokeWidth={2} />
        <span className="tab-item-label">Stats</span>
      </NavLink>
      <NavLink to="/add-expense" className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}>
        <Plus size={22} strokeWidth={2.5} />
        <span className="tab-item-label">Add</span>
      </NavLink>
    </nav>
  );
}
