import { useState, type ImgHTMLAttributes } from "react";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
};

export function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className={`${className ?? ""} bg-secondary`} role={alt ? "img" : undefined} aria-label={alt} />;
  }

  return <img {...props} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}