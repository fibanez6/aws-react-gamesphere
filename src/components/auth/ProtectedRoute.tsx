import { Navigate, useLocation } from 'react-router-dom';
import { useAuthenticator } from "@aws-amplify/ui-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const location = useLocation();

  if (authStatus === "configuring") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}


// import { useAuthenticator } from "@aws-amplify/ui-react";
// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children }) {
//   const { authStatus } = useAuthenticator(context => [context.authStatus]);

//   if (authStatus === "configuring") {
//     return <div>Loading...</div>;
//   }

//   if (authStatus !== "authenticated") {
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// }