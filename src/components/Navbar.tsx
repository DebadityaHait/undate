import { NavLink } from 'react-router-dom';
import { useStore } from '../lib/store';

export default function Navbar() {
  const { people, dates } = useStore();
  return (
    <div className="nav">
      <div className="nav-in">
        <div className="logo">un<b>date</b> <span style={{fontSize:12, fontWeight:600, color:'#8f739f'}}>· agentic dating harness</span></div>
        <div className="nav-links">
          <NavLink to="/" className={({isActive})=>isActive?'active':''}>Harness</NavLink>
          <NavLink to="/profiles" className={({isActive})=>isActive?'active':''}>Profiles · {people.length}</NavLink>
          <NavLink to="/arena" className={({isActive})=>isActive?'active':''}>Dating · {dates.length}</NavLink>
          <NavLink to="/rankings" className={({isActive})=>isActive?'active':''}>Rankings</NavLink>
          <NavLink to="/add" className={({isActive})=>isActive?'active':''}>+ Add person</NavLink>
        </div>
      </div>
    </div>
  );
}
