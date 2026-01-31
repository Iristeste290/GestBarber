import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookingStepperProps {
  currentStep: number;
  steps: { label: string; icon: React.ReactNode }[];
}

export const BookingStepper = ({ currentStep, steps }: BookingStepperProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        
        return (
          <div key={index} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-2 transition-colors duration-300",
                  stepNumber < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
