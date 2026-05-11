export default function Star({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 1 L13.8 8.2 L21 9 L15.5 14 L17.2 21.5 L12 17.8 L6.8 21.5 L8.5 14 L3 9 L10.2 8.2Z" />
    </svg>
  )
}
