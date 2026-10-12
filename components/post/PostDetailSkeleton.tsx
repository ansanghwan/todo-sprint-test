const PostDetailSkeleton = () => (
  <div aria-hidden className="flex animate-pulse flex-col gap-4 md:gap-6">
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 border-b border-subtle pb-4 md:gap-4 md:pb-6">
          <div className="h-6 w-3/4 rounded-md bg-muted/20 md:h-8" />
          <div className="flex items-center gap-1 md:gap-2">
            <div className="size-5 rounded-full bg-muted/20 md:size-6" />
            <div className="h-4 w-16 rounded-md bg-muted/20 md:h-6" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-5 w-full rounded-md bg-muted/20 md:h-6" />
          <div className="h-5 w-full rounded-md bg-muted/20 md:h-6" />
          <div className="h-5 w-2/3 rounded-md bg-muted/20 md:h-6" />
        </div>
      </div>
      <div className="size-37.5 rounded-[1.25rem] bg-muted/20 md:size-58 md:rounded-3xl" />
    </div>
    <div className="h-4 w-28 rounded-md bg-muted/20 md:h-5" />
  </div>
);

export default PostDetailSkeleton;
