import { NavLink } from 'react-router-dom';
import { useStore } from '../lib/store';

export default function Navbar() {
  const { people, dates } = useStore();
  return (
    <div className="nav">
      <div className="nav-in">
        <div className="logo">un<b>date</b></div>
        <div className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Harness</NavLink>
          <NavLink to="/tour" className={({ isActive }) => isActive ? 'active' : ''}>▶ Tour</NavLink>
          <NavLink to="/profiles" className={({ isActive }) => isActive ? 'active' : ''}>Profiles · {people.length}</NavLink>
          <NavLink to="/arena" className={({ isActive }) => isActive ? 'active' : ''}>Dates · {dates.length}</NavLink>
          <NavLink to="/rankings" className={({ isActive }) => isActive ? 'active' : ''}>Rankings</NavLink>
          <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>+ Add</NavLink>
        </div>
      </div>
    </div>
  );
}
