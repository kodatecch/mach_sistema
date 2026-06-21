import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  User,
  Organization,
  Project,
  ProjectMember,
  OrgConfig,
  MemberProjectVisibility,
  ProjectRole,
  UserTabPermissions,
} from './types';

import LoginPage from './components/LoginPage';
import SetupWizard from './components/SetupWizard';
import LegacyApp from './components/LegacyApp';
import Workspace from './components/Workspace';

/* ───────────────────────── App (Router) ───────────────────────── */

export default function App() {
  /* ── Persisted state ── */
  const [users, setUsers] = useState<User[]>(() => {
    const d = localStorage.getItem('mach_users');
    return d ? JSON.parse(d) : [];
  });

  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    const d = localStorage.getItem('mach_orgs');
    return d ? JSON.parse(d) : [];
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const d = localStorage.getItem('mach_projects');
    return d ? JSON.parse(d) : [];
  });

  const [memberships, setMemberships] = useState<ProjectMember[]>(() => {
    const d = localStorage.getItem('mach_memberships');
    return d ? JSON.parse(d) : [];
  });

  const [config, setConfig] = useState<OrgConfig>(() => {
    const d = localStorage.getItem('mach_config');
    return d
      ? JSON.parse(d)
      : { orgName: '', primaryColor: 'red', theme: 'dark', setupComplete: false };
  });

  const [visibility, setVisibility] = useState<MemberProjectVisibility>(() => {
    const d = localStorage.getItem('mach_visibility');
    return d ? JSON.parse(d) : {};
  });

  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const d = localStorage.getItem('mach_active_user');
    return d ? JSON.parse(d) : null;
  });

  /* ── Sync to localStorage ── */
  useEffect(() => { localStorage.setItem('mach_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('mach_orgs', JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem('mach_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('mach_memberships', JSON.stringify(memberships)); }, [memberships]);
  useEffect(() => { localStorage.setItem('mach_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('mach_visibility', JSON.stringify(visibility)); }, [visibility]);
  useEffect(() => {
    if (activeUser) localStorage.setItem('mach_active_user', JSON.stringify(activeUser));
    else localStorage.removeItem('mach_active_user');
  }, [activeUser]);

  /* ── Apply theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
    document.documentElement.setAttribute('data-color', config.primaryColor);
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme, config.primaryColor]);

  /* ── Auth handlers ── */
  const handleLogin = (user: User) => {
    setActiveUser(user);
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('mach_active_user');
  };

  const handleSetupComplete = (payload: {
    user: User;
    org: Organization;
    projects: Project[];
    memberships: ProjectMember[];
    config: OrgConfig;
    visibility: MemberProjectVisibility;
    extraUsers: User[];
  }) => {
    setUsers([payload.user, ...payload.extraUsers]);
    setOrganizations([payload.org]);
    setProjects(payload.projects);
    setMemberships(payload.memberships);
    setConfig(payload.config);
    setVisibility(payload.visibility);
    setActiveUser(payload.user);
  };

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/"
        element={
          activeUser && config.setupComplete ? (
            <Navigate to="/app" replace />
          ) : (
            <LoginPage users={users} onLogin={handleLogin} />
          )
        }
      />

      {/* Setup Wizard */}
      <Route
        path="/setup"
        element={<SetupWizard onComplete={handleSetupComplete} />}
      />

      {/* Main Workspace */}
      <Route
        path="/app"
        element={
          activeUser ? (
            <Workspace
              activeUser={activeUser}
              users={users}
              setUsers={setUsers}
              organizations={organizations}
              projects={projects}
              setProjects={setProjects}
              memberships={memberships}
              setMemberships={setMemberships}
              config={config}
              setConfig={setConfig}
              visibility={visibility}
              setVisibility={setVisibility}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Legacy system */}
      <Route path="/completo" element={<LegacyApp />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
