declare module "canvas-confetti" {
  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: { x?: number; y?: number };
    shapes?: string[];
    colors?: string[];
    scalar?: number;
  }

  // Properly typed default export
  export default function confetti(options?: ConfettiOptions): void;
}
