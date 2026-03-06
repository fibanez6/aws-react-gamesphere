import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Friends from './pages/Friends';
import Leaderboard from './pages/Leaderboard';
import LiveSession from './pages/LiveSession';
import Login from './pages/Login';
import Profile from './pages/Profile';
import TopGames from './pages/TopGames';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:playerId" element={<Profile />} />
          <Route path="friends" element={<Friends />} />
          <Route path="games" element={<TopGames />} />
          <Route path="games/:playerId" element={<TopGames />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="live" element={<LiveSession />} />
        </Route>
      </Routes>
      {/* <EnvironmentBadge /> */}
    </>
  );
}

export default App;
