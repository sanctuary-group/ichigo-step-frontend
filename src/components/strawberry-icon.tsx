import { cn } from "@/lib/utils";

export function StrawberryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      {/* leaves */}
      <path
        d="M12 2.5 L9.2 5.3 L7 4 L7.8 6.8 L5 7.5 L7.8 8.5 L7 11 L9.5 9.5 L12 11 L14.5 9.5 L17 11 L16.2 8.5 L19 7.5 L16.2 6.8 L17 4 L14.8 5.3 Z"
        fill="#16a34a"
      />
      {/* stem */}
      <rect x="11.4" y="2" width="1.2" height="2.5" rx="0.5" fill="#15803d" />
      {/* body */}
      <path
        d="M12 9.5 C16 9.5 18.5 12 18.5 15 C18.5 18.8 15.5 22 12 22 C8.5 22 5.5 18.8 5.5 15 C5.5 12 8 9.5 12 9.5 Z"
        fill="#dc2626"
      />
      {/* seeds */}
      <g fill="#fde68a">
        <ellipse cx="9" cy="13" rx="0.55" ry="0.85" />
        <ellipse cx="12" cy="12.3" rx="0.55" ry="0.85" />
        <ellipse cx="15" cy="13" rx="0.55" ry="0.85" />
        <ellipse cx="7.8" cy="15.3" rx="0.55" ry="0.85" />
        <ellipse cx="10.5" cy="15" rx="0.55" ry="0.85" />
        <ellipse cx="13.5" cy="15" rx="0.55" ry="0.85" />
        <ellipse cx="16.2" cy="15.3" rx="0.55" ry="0.85" />
        <ellipse cx="9" cy="17.5" rx="0.55" ry="0.85" />
        <ellipse cx="12" cy="17.8" rx="0.55" ry="0.85" />
        <ellipse cx="15" cy="17.5" rx="0.55" ry="0.85" />
        <ellipse cx="10.5" cy="19.8" rx="0.55" ry="0.85" />
        <ellipse cx="13.5" cy="19.8" rx="0.55" ry="0.85" />
      </g>
    </svg>
  );
}
