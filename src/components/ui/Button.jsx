export default function Button({ children, onClick, variant = 'primary', type = 'button', style, ...rest }) {
  const base = {
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };
  const variants = {
    primary: { backgroundColor: 'var(--color-deep)', color: '#fff' },
    accent: { backgroundColor: 'var(--color-accent)', color: '#fff' },
    ghost: { backgroundColor: 'transparent', color: 'var(--color-deep)', border: '1px solid var(--color-border)' },
  };
  return (
    <button type={type} onClick={onClick} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}
