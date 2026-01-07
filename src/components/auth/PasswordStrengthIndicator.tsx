import { useMemo, useEffect, useState } from "react";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkPasswordBreachDebounced, BreachCheckResult } from "@/lib/password-breach-check";

interface PasswordCriteria {
  label: string;
  met: boolean;
}

interface PasswordStrength {
  level: 0 | 1 | 2 | 3 | 4;
  label: string;
  criteria: PasswordCriteria[];
  isValid: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const criteria: PasswordCriteria[] = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
    { label: "Letra minúscula", met: /[a-z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$%&*)", met: /[!@#$%&*]/.test(password) },
  ];

  const metCount = criteria.filter((c) => c.met).length;

  let level: 0 | 1 | 2 | 3 | 4;
  let label: string;

  if (password.length === 0) {
    level = 0;
    label = "";
  } else if (metCount <= 2) {
    level = 1;
    label = "Fraca";
  } else if (metCount === 3) {
    level = 2;
    label = "Média";
  } else if (metCount === 4) {
    level = 3;
    label = "Boa";
  } else {
    level = 4;
    label = "Forte";
  }

  return {
    level,
    label,
    criteria,
    isValid: level >= 3,
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  onBreachCheck?: (isBreached: boolean) => void;
}

export function PasswordStrengthIndicator({ 
  password, 
  className,
  onBreachCheck 
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => validatePasswordStrength(password), [password]);
  const [breachResult, setBreachResult] = useState<BreachCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (password.length >= 4) {
      setIsChecking(true);
      checkPasswordBreachDebounced(password, (result) => {
        setBreachResult(result);
        setIsChecking(false);
        onBreachCheck?.(result.isBreached);
      }, 800);
    } else {
      setBreachResult(null);
      setIsChecking(false);
      onBreachCheck?.(false);
    }
  }, [password, onBreachCheck]);

  const getSegmentColor = (segmentIndex: number) => {
    if (strength.level === 0 || segmentIndex >= strength.level) {
      return "bg-muted";
    }

    // If password is breached, show red regardless of strength
    if (breachResult?.isBreached) {
      return "bg-red-500";
    }

    switch (strength.level) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-muted";
    }
  };

  const getLabelColor = () => {
    if (breachResult?.isBreached) {
      return "text-red-500";
    }

    switch (strength.level) {
      case 1:
        return "text-red-500";
      case 2:
        return "text-orange-500";
      case 3:
        return "text-yellow-600";
      case 4:
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getLabel = () => {
    if (breachResult?.isBreached) {
      return "Comprometida";
    }
    return strength.label;
  };

  const formatBreachCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  if (password.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Força da senha</span>
          <div className="flex items-center gap-1.5">
            {isChecking && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            <span className={cn("text-xs font-medium", getLabelColor())}>
              {getLabel()}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                getSegmentColor(index)
              )}
            />
          ))}
        </div>
      </div>

      {/* Breach warning */}
      {breachResult?.isBreached && (
        <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-red-500">
              Senha encontrada em vazamentos!
            </p>
            <p className="text-xs text-muted-foreground">
              Esta senha apareceu {formatBreachCount(breachResult.count)} vezes em vazamentos de dados.
              Escolha uma senha diferente.
            </p>
          </div>
        </div>
      )}

      {/* Criteria checklist */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {strength.criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              criterion.met ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {criterion.met ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <X className="h-3 w-3 shrink-0" />
            )}
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
