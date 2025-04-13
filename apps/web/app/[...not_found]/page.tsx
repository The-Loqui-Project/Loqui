import Link from "next/link";

export default function NotFoundCatchAll() {
  return (
    <main className="flex-1 container py-8 flex flex-col space-y-10 items-center justify-center">
      <div className="flex flex-col space-y-2 items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
          404
        </h1>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          Page not found
        </p>
      </div>
      <div className="flex flex-col items-center justify-center">
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          The page you were looking for does not seem to exist.
        </p>
        <p className="max-w-[600px] text-muted-foreground md:text-xl">
          Please check if the URL is correct.
        </p>
      </div>
      <Link
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-8"
        href="/"
      >
        Return Home
      </Link>
    </main>
  );
}
