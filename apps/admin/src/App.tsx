import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlatformAuthProvider, usePlatformAuth } from './context/PlatformAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar, TabType } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { PlatformDashboardPage } from './pages/PlatformDashboardPage';
import { EventOverviewPage } from './pages/EventOverviewPage';
import { GuestListPage } from './pages/GuestListPage';
import { InvitationsPage } from './pages/InvitationsPage';
import { LiveCheckinPage } from './pages/LiveCheckinPage';
import { Event } from './types';

const AppRouter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isPlatformAuthenticated } = usePlatformAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  // If Superadmin is logged in, show Superadmin Portal
  if (isPlatformAuthenticated) {
    return <PlatformDashboardPage />;
  }

  // If Couple / Tenant Admin is logged in, show Wedding Dashboard
  if (isAuthenticated) {
    return (
      <div className="admin-layout">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="main-content">
          {activeTab === 'overview' && (
            <EventOverviewPage
              currentEvent={currentEvent}
              onEventSelected={(evt) => setCurrentEvent(evt)}
            />
          )}
          {activeTab === 'guests' && <GuestListPage event={currentEvent} />}
          {activeTab === 'invitations' && <InvitationsPage event={currentEvent} />}
          {activeTab === 'checkins' && <LiveCheckinPage event={currentEvent} />}
        </main>
      </div>
    );
  }

  // Otherwise show Login / Portal Switcher
  return <LoginPage />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PlatformAuthProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </PlatformAuthProvider>
    </ThemeProvider>
  );
};
