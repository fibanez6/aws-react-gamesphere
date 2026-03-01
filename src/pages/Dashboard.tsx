export default function Dashboard() {

  const user = {
    username: "Gamer123",
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="text-gradient">{user?.username}</span>! 👋
          </h1>
          <p className="text-dark-400 mt-1">Here's what's happening in your gaming world</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-dark-400">
          <span>Last updated:</span>
          <span className="text-white">Just now</span>
        </div>
      </div>
    </div>
  );
}