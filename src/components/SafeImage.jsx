import { useState } from 'react';

export default function SafeImage({ src, alt, style }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="img-fallback" style={style} role="img" aria-label={alt}>
        Фото недоступно
      </div>
    );
  }

  return <img src={src} alt={alt} style={style} onError={() => setFailed(true)} loading="lazy" />;
}