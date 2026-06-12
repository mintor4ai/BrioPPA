import { useApp } from '../../context/AppContext.jsx';

const ICONS = { success: '✓', error: '✕', warning: '⚠', ia: '✨' };

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tipo}`} onClick={() => removeToast(t.id)} style={{ cursor: 'pointer' }}>
          <span>{ICONS[t.tipo] || '•'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
