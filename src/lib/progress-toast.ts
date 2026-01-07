import { toast as sonnerToast } from "sonner";

interface ProgressToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

class ProgressToastManager {
  private toastId: string | number | undefined;

  start({ title, description }: ProgressToastOptions) {
    this.toastId = sonnerToast.loading(title, {
      description,
    });
    return this.toastId;
  }

  success(title: string, description?: string) {
    if (this.toastId) {
      sonnerToast.success(title, {
        id: this.toastId,
        description,
      });
    }
  }

  error(title: string, description?: string) {
    if (this.toastId) {
      sonnerToast.error(title, {
        id: this.toastId,
        description,
      });
    }
  }

  update(title: string, description?: string) {
    if (this.toastId) {
      sonnerToast.loading(title, {
        id: this.toastId,
        description,
      });
    }
  }

  dismiss() {
    if (this.toastId) {
      sonnerToast.dismiss(this.toastId);
    }
  }
}

export function createProgressToast() {
  return new ProgressToastManager();
}
