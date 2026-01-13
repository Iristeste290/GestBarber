import * as React from "react";
import { useNavigate } from "react-router-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type AuthLinkButtonProps = Omit<ButtonProps, "asChild" | "type"> & {
  to?: string;
  children: React.ReactNode;
};

/**
 * Landing-page CTA button that ALWAYS navigates to /auth (by default).
 * Uses imperative navigation for maximum robustness across web/mobile/PWA.
 */
export function AuthLinkButton({
  to = "/auth",
  children,
  onClick,
  ...buttonProps
}: AuthLinkButtonProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // Always navigate to the target route
    console.log("[AuthLinkButton] Navigating to:", to);
    navigate(to);
  };

  return (
    <Button
      type="button"
      {...buttonProps}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
