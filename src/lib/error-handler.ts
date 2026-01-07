import { toast } from "sonner";

interface ErrorOptions {
  title?: string;
  description?: string;
  logError?: boolean;
}

export const handleError = (error: unknown, options: ErrorOptions = {}) => {
  const {
    title = "Erro",
    description,
    logError = true
  } = options;

  // Log error for debugging (only in development)
  if (logError && process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
  }

  // Extract error message
  let errorMessage = description || "Ocorreu um erro inesperado. Tente novamente.";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object' && 'message' in error) {
    errorMessage = String(error.message);
  }

  // Show toast notification
  toast.error(title, {
    description: errorMessage,
  });

  return errorMessage;
};

export const handleSuccess = (title: string, description?: string) => {
  toast.success(title, {
    description,
  });
};
