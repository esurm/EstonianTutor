import { useCEFRTracking } from "@/hooks/use-cefr-tracking";
import { Button } from "@/components/ui/button";
import { User, Minus, Plus, LogOut } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export function Navigation() {
  const { 
    user, 
    isLoading, 
    increaseDifficulty, 
    decreaseDifficulty, 
    getLevelInfo,
    canAdjustLevel,
    isAdjusting 
  } = useCEFRTracking();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = () => {
    setIsAuthenticating(true);
    // Redirect to Google OAuth
    window.location.href = "/auth/google";
  };

  const handleLogout = async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AE</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Aprende Estonio</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Cargando...</p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const levelInfo = getLevelInfo(user?.cefrLevel || "B1");

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AE</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Aprende Estonio</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Tutor Inteligente de Idiomas</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-600">Nivel Actual</span>
              {user?.profileImage && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Conectado con Google</span>
                </div>
              )}
            </div>
            
            {/* Difficulty Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={decreaseDifficulty}
                disabled={isAdjusting || !canAdjustLevel("decrease", user?.cefrLevel || "B1")}
                className="w-8 h-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[2rem] text-center">
                {user?.cefrLevel}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={increaseDifficulty}
                disabled={isAdjusting || !canAdjustLevel("increase", user?.cefrLevel || "B1")}
                className="w-8 h-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* User Authentication */}
            <div className="flex items-center space-x-2">
              {user?.email && user.email !== "demo@example.com" ? (
                // Authenticated user - show profile and logout
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-8 h-8 p-0 relative overflow-hidden"
                    title={`Logged in as ${user.name || user.email}`}
                  >
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt={user.name || 'User Profile'} 
                        className="w-full h-full object-cover rounded-sm"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const icon = parent.querySelector('.user-icon');
                            if (icon) (icon as HTMLElement).style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <User className={`h-4 w-4 user-icon ${user?.profileImage ? 'hidden' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-8 h-8 p-0"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                // Not authenticated - show login button
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogin}
                  disabled={isAuthenticating}
                  className="px-3 h-8"
                  title="Login with Google"
                >
                  {isAuthenticating ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-1" />
                      Login
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
