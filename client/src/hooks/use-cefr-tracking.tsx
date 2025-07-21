import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export function useCEFRTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
    refetchInterval: 30000, // Refetch every 30 seconds to track changes
  });

  const { data: recommendations } = useQuery({
    queryKey: ["/api/cefr/recommendations"],
    refetchInterval: 60000, // Refetch every minute
  });

  const adjustLevelMutation = useMutation({
    mutationFn: (direction: "increase" | "decrease") => api.adjustCEFRLevel(direction),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cefr/recommendations"] });
      
      const levelNames = {
        A1: "Principiante",
        A2: "Principiante Alto",
        B1: "Intermedio",
        B2: "Intermedio Alto",
        C1: "Avanzado",
        C2: "Maestría"
      };

      toast({
        title: "Nivel Actualizado",
        description: `Tu nivel CEFR ahora es ${data.newLevel} (${levelNames[data.newLevel as keyof typeof levelNames]})`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo ajustar el nivel. Intentá de nuevo.",
        variant: "destructive",
      });
    }
  });

  const increaseDifficulty = useCallback(() => {
    adjustLevelMutation.mutate("increase");
  }, [adjustLevelMutation]);

  const decreaseDifficulty = useCallback(() => {
    adjustLevelMutation.mutate("decrease");
  }, [adjustLevelMutation]);

  const getLevelInfo = useCallback((level: string) => {
    const levelInfo = {
      A1: { 
        name: "Principiante", 
        description: "Conceptos básicos",
        color: "bg-green-500",
        textColor: "text-green-700"
      },
      A2: { 
        name: "Principiante Alto", 
        description: "Comunicación simple",
        color: "bg-green-600",
        textColor: "text-green-700"
      },
      B1: { 
        name: "Intermedio", 
        description: "Independiente",
        color: "bg-blue-500",
        textColor: "text-blue-700"
      },
      B2: { 
        name: "Intermedio Alto", 
        description: "Usuario competente",
        color: "bg-blue-600",
        textColor: "text-blue-700"
      },
      C1: { 
        name: "Avanzado", 
        description: "Dominio operativo",
        color: "bg-purple-500",
        textColor: "text-purple-700"
      },
      C2: { 
        name: "Maestría", 
        description: "Prácticamente nativo",
        color: "bg-purple-600",
        textColor: "text-purple-700"
      }
    };

    return levelInfo[level as keyof typeof levelInfo] || levelInfo.B1;
  }, []);

  const getProgressToNextLevel = useCallback((currentLevel: string) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return { nextLevel: null, progress: 100 };
    }

    // This is a simplified calculation - in a real app you'd base this on actual performance metrics
    const baseProgress = 65; // Default progress percentage
    return {
      nextLevel: levels[currentIndex + 1],
      progress: baseProgress
    };
  }, []);

  const canAdjustLevel = useCallback((direction: "increase" | "decrease", currentLevel: string) => {
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const currentIndex = levels.indexOf(currentLevel);
    
    if (direction === "increase") {
      return currentIndex < levels.length - 1;
    } else {
      return currentIndex > 0;
    }
  }, []);

  return {
    user,
    recommendations,
    isLoading,
    isAdjusting: adjustLevelMutation.isPending,
    increaseDifficulty,
    decreaseDifficulty,
    getLevelInfo,
    getProgressToNextLevel,
    canAdjustLevel,
  };
}
