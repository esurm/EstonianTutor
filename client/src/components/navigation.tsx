import { useCEFRTracking } from "@/hooks/use-cefr-tracking";
import { Button } from "@/components/ui/button";
import { User, Minus, Plus } from "lucide-react";
import { Link } from "wouter";

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

  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">AE</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aprende Estonio</h1>
                <p className="text-xs text-gray-500">Cargando...</p>
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Aprende Estonio</h1>
              <p className="text-xs text-gray-500">Tutor Inteligente de Idiomas</p>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
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
            
            <Button variant="outline" size="sm" className="w-8 h-8 p-0 relative overflow-hidden">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name || 'User Profile'} 
                  className="w-full h-full object-cover rounded-sm"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    // Fallback to default icon if image fails to load
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
          </div>
        </div>
      </div>
    </nav>
  );
}
