interface CommentListSkeletonProps {
  count: number;
}

const CommentListSkeleton = ({ count }: CommentListSkeletonProps) => (
  <div aria-hidden className="flex animate-pulse flex-col gap-8 md:gap-10">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          <div className="size-5 rounded-full bg-muted/20" />
          <div className="h-4 w-14 rounded-md bg-muted/20 md:h-5" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-5 w-full rounded-md bg-muted/20 md:h-6" />
          <div className="h-4 w-18 rounded-md bg-muted/20 md:h-5" />
        </div>
      </div>
    ))}
  </div>
);

export default CommentListSkeleton;
