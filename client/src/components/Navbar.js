import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        HRMS
      </Link>
      
      <ul className="navbar-nav">
        <li>
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/employees" className={`nav-link ${isActive('/employees')}`}>
            Employees
          </Link>
        </li>
        <li>
          <Link to="/attendance" className={`nav-link ${isActive('/attendance')}`}>
            Attendance
          </Link>
        </li>
        <li>
          <Link to="/performance" className={`nav-link ${isActive('/performance')}`}>
            Performance
          </Link>
        </li>
        {user.role === 'HR_ADMIN' && (
          <li>
            <Link to="/payroll" className={`nav-link ${isActive('/payroll')}`}>
              Payroll
            </Link>
          </li>
        )}
        <li>
          <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
            Reports
          </Link>
        </li>
      </ul>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-name">{user.username}</div>
          <div className="user-role">{user.role.replace('_', ' ')}</div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
