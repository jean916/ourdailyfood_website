/* eslint-disable @next/next/no-img-element */

export default function Avatar({
  url,
  name,
  size = 40,
}: {
  url?: string;
  name?: string;
  size?: number;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";

  if (url) {
    return (
      <img
        src={url}
        alt={name ? `${name} profile photo` : "Profile photo"}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-full bg-yellow-400 font-bold text-black"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}
