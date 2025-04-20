
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number; // 0-1 value that determines how much of the element should be visible
  delay?: number; // delay in ms
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: string; // e.g. "20px"
  duration?: number; // duration in ms
  once?: boolean; // whether to only trigger the animation once
}

export function ScrollReveal({
  children,
  className,
  threshold = 0.1,
  delay = 0,
  direction = "up",
  distance = "20px",
  duration = 700,
  once = true,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Define transform based on direction
  let transform = "";
  switch(direction) {
    case "up":
      transform = `translateY(${distance})`;
      break;
    case "down":
      transform = `translateY(-${distance})`;
      break;
    case "left":
      transform = `translateX(${distance})`;
      break;
    case "right":
      transform = `translateX(-${distance})`;
      break;
    default:
      transform = "none";
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once && ref.current) {
            observer.unobserve(ref.current);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, once]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : transform,
        transition: `opacity ${duration}ms ease-out ${delay}ms, transform ${duration}ms ease-out ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
