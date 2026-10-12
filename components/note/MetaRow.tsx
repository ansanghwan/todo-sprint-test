type Props = {
  icon: string;
  label: string;
  children: React.ReactNode;
};

export default function MetaRow({ icon, label, children }: Props) {
  return (
    <div className="flex min-w-0 items-center">
      <dt className="mr-4 flex shrink-0 items-center text-nowrap text-grayscale-400">
        <span className={`material-symbols-rounded mr-1 text-lg! font-light`}>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center">{children}</dd>
    </div>
  );
}
