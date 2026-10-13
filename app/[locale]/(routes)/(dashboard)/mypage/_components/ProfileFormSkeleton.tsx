const ProfileFormSkeleton = () => (
  <div
    aria-hidden
    className="flex animate-pulse flex-col items-center gap-8 md:gap-12"
  >
    <div className="size-33 rounded-full bg-muted/20" />
    <div className="flex w-full flex-col gap-8 md:gap-12">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-12 rounded-md bg-muted/20" />
          <div className="h-14.5 rounded-2xl bg-muted/20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-10 rounded-md bg-muted/20" />
          <div className="h-14.5 rounded-2xl bg-muted/20" />
        </div>
      </div>
      <div className="h-12 rounded-full bg-muted/20 md:h-14" />
    </div>
  </div>
);

export default ProfileFormSkeleton;
