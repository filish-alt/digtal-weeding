import React from 'react';
import {
  Calendar,
  Users,
  Mail,
  ShieldCheck,
  Activity,
  LogOut,
  Heart,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export type TabType = 'overview' | 'guests' | 'invitations' | 'checkins';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Event Overview', icon: <Calendar size={18} /> },
    { id: 'guests', label: 'Guest List', icon: <Users size={18} /> },
    { id: 'invitations', label: 'Invitations', icon: <Mail size={18} /> },
    { id: 'checkins', label: 'Live Check-in', icon: <Activity size={18} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <Heart className="brand-heart" size={24} />
        <span>Wedding Admin</span>
      </div>

      <ul className="nav-list">
        {navItems.map((item) => (
          <li
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className="user-footer">
        <div className="user-info">
          <div className="user-name">Tenant Admin</div>
          <div className="user-email">Active Session</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="logout-btn"
            onClick={logout}
            title="Log out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};

