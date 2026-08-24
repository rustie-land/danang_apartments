import { useEffect } from 'react';

export default function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '1rem',
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {title && (
          <h2 style={{ margin: 0, padding: '1.25rem 1.5rem 0', fontFamily: 'var(--font-serif)', color: 'var(--color-deep)' }}>
            {title}
          </h2>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'var(--color-bg-alt)',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          ✕
        </button>
        <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>{children}</div>
      </div>
    </div>
  );
}
