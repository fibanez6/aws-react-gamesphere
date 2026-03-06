import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useUser } from '../context/UserContext';

export default function MainLayout() {
  const { loading, error } = useUser();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-dark-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-950">
        <div className="text-center">
          <p className="text-red-400 text-lg">Failed to load profile</p>
          <p className="text-dark-400 mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-dark-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
