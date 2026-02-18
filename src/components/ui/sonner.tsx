import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      {/* Força animação de cima para baixo no mobile */}
      <style>{`
        [data-sonner-toaster][data-x-position="center"] {
          --toast-close-button-start: auto;
        }
        [data-sonner-toast] {
          animation-name: sonner-slide-in-from-top !important;
        }
        @keyframes sonner-slide-in-from-top {
          from { opacity: 0; transform: translateY(-100%) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        position="top-center"
        expand={false}
        richColors
        offset={8}
        gap={6}
        toastOptions={{
          duration: 3500,
          style: {
            maxWidth: '280px',
            fontSize: '12px',
            padding: '8px 12px',
          },
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:py-2 group-[.toaster]:px-3",
            title: "group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:leading-snug",
            description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] group-[.toast]:leading-snug",
            actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs",
            cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          },
        }}
        {...props}
      />
    </>
  );
};

export { Toaster, toast };
