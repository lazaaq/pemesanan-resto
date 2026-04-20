import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-[576px] px-4 sm:px-5", className)}>
      {children}
    </div>
  );
}
