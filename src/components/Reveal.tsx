"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type CSSProperties, type ReactElement } from "react";

// Fades content in once it scrolls into view. Disabled by prefers-reduced-motion (CSS and here).
// With `stagger` (ms between children) each direct child slides up in turn instead of the whole block.
export function Reveal({
  children,
  className = "",
  delay = 0,
  stagger,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const staggered = stagger !== undefined;
  const kids = staggered
    ? Children.map(children, (c, i) =>
        isValidElement(c)
          ? cloneElement(c as ReactElement<{ style?: CSSProperties }>, {
              style: { ...(c.props as { style?: CSSProperties }).style, "--i": i } as CSSProperties,
            })
          : c,
      )
    : children;
  const style = staggered
    ? ({ "--stagger": `${stagger}ms` } as CSSProperties)
    : delay
      ? ({ "--d": `${delay}ms` } as CSSProperties)
      : undefined;

  return (
    // @ts-expect-error ref type differs per tag; all are HTMLElements
    <Tag ref={ref} className={`${staggered ? "reveal-stagger" : "reveal"} ${className}`} style={style}>
      {kids}
    </Tag>
  );
}
