import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../data/store';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function ToastContainer() {
  const { toasts } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <Icon size={18} />
            <span style={{ flex: 1 }}>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
