interface Props {
  className?: string
}

export default function CheckerboardStripe({ className = '' }: Props) {
  return (
    <div
      className={`h-4 flex-shrink-0 ${className}`}
      style={{
        backgroundImage: 'repeating-conic-gradient(#6B7A2A 0% 25%, #8A9E35 0% 50%)',
        backgroundSize: '16px 16px',
      }}
    />
  )
}
