export function Skeleton({
  w,
  h = 14,
  className,
}: {
  w?: number | string;
  h?: number;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${className ?? ''}`}
      style={{ width: w ?? '100%', height: h }}
      aria-hidden="true"
    />
  );
}

/** Standard page-loading skeleton: header line + card blocks. */
export function PageSkeleton() {
  return (
    <div className="stack" aria-hidden="true">
      <Skeleton w="30%" h={22} />
      <div className="grid-3">
        <div className="card stack" style={{ gap: 10 }}>
          <Skeleton w="40%" />
          <Skeleton w="70%" h={26} />
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <Skeleton w="40%" />
          <Skeleton w="70%" h={26} />
        </div>
        <div className="card stack" style={{ gap: 10 }}>
          <Skeleton w="40%" />
          <Skeleton w="70%" h={26} />
        </div>
      </div>
      <div className="card stack" style={{ gap: 10 }}>
        <Skeleton w="25%" />
        <Skeleton h={44} />
        <Skeleton h={44} />
        <Skeleton h={44} />
      </div>
    </div>
  );
}
