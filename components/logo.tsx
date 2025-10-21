"use client"

import Image from "next/image"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className = "", size = 60 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <Image src="/ukuqala-logo.jpg" alt="Ukuqala Medicals" width={size} height={size} className="object-contain" />
      </div>
      <span className="text-2xl font-bold text-foreground font-[family-name:var(--font-heading)]">
        Ukuqala Medicals
      </span>
    </div>
  )
}
