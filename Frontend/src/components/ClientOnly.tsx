import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";

export function clientOnly<TProps extends object>(
  factory: () => Promise<{ default: ComponentType<TProps> }>,
) {
  const LazyComponent = lazy(factory);
  return (props: TProps) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return (
      <Suspense fallback={null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
