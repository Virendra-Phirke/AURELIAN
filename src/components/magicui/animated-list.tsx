import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  reverse?: boolean;
}

export const AnimatedList = React.memo(
  ({ className, children, delay = 200, reverse = false }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    useEffect(() => {
      if (index < childrenArray.length - 1) {
        const timeout = setTimeout(() => {
          setIndex((prevIndex) => prevIndex + 1);
        }, delay);

        return () => clearTimeout(timeout);
      }
    }, [index, delay, childrenArray.length]);

    const itemsToShow = useMemo(() => {
      const slice = childrenArray.slice(0, index + 1);
      return reverse ? slice.reverse() : slice;
    }, [index, childrenArray, reverse]);

    return (
      <div className={cn("flex flex-col items-center gap-2 sm:gap-2.5 w-full", className)}>
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";

export function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  key?: React.Key;
  className?: string;
}) {
  const animations = {
    initial: { scale: 0.94, opacity: 0, y: 12 },
    animate: { scale: 1, opacity: 1, y: 0, originY: 0 },
    exit: { scale: 0.94, opacity: 0, y: -12 },
    transition: { type: "spring" as const, stiffness: 350, damping: 30 },
  };

  return (
    <motion.div {...animations} layout className={cn("mx-auto w-full", className)}>
      {children}
    </motion.div>
  );
}
