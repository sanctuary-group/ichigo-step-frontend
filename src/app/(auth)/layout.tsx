import { StrawberryIcon } from "@/components/strawberry-icon";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-muted/30 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-primary/15"
        style={{ clipPath: "polygon(55% 100%, 100% 0%, 100% 100%)" }}
        aria-hidden
      />

      <div className="relative w-full flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="grid place-items-center size-10 rounded-xl bg-primary/10">
            <StrawberryIcon className="size-5" />
          </div>
          <div className="text-xl font-bold">ichigo-step</div>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
