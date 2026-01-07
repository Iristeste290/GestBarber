import { useEffect, useState } from "react";
import { Scissors } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 1800 }: SplashScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 400);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-br from-primary via-primary/95 to-accent
        transition-opacity duration-400 ease-out
        ${isExiting ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Logo container with animation */}
      <div
        className={`
          relative flex flex-col items-center gap-6
          transition-all duration-500 ease-out
          ${isExiting ? "scale-110 opacity-0" : "scale-100 opacity-100"}
        `}
      >
        {/* Icon with pulse ring */}
        <div className="relative">
          {/* Pulse rings */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20" />
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: "0.3s", animationDuration: "1.5s" }}>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10" />
          </div>
          
          {/* Main icon */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-scale-in">
            <Scissors className="w-12 h-12 sm:w-14 sm:h-14 text-primary" />
          </div>
        </div>

        {/* App name */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            GestBarber
          </h1>
          <p className="text-sm sm:text-base text-white/70 mt-1 font-medium">
            Gestão para Barbearias
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom branding */}
      <div 
        className="absolute bottom-8 text-white/50 text-xs font-medium animate-fade-in"
        style={{ animationDelay: "0.6s" }}
      >
        Carregando...
      </div>
    </div>
  );
};
