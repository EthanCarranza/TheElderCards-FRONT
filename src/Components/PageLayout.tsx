import type { PropsWithChildren } from "react";

type ClassValue = string | false | null | undefined;

const classNames = (...classes: ClassValue[]) =>
  classes.filter(Boolean).join(" ");

const COLUMN_WIDTH_CLASSES = "w-[200px] lg:w-[220px] xl:w-[260px]";

interface PageLayoutProps extends PropsWithChildren {
  wallpaperImage?: string;
  contentClassName?: string;
  containerClassName?: string;
  hideWallpaperOnMobile?: boolean;
  wallpaperSize?: string;
  wallpaperPosition?: string;
}

const PageLayout = ({
  children,
  wallpaperImage = "/bg.webp",
  contentClassName,
  containerClassName,
  hideWallpaperOnMobile = true,
  wallpaperSize = "cover",
  wallpaperPosition = "center",
}: PageLayoutProps) => {
  const showWallpaperOnMobile = !hideWallpaperOnMobile;

  return (
    <div
      className={classNames(
        "relative min-h-screen bg-black text-white",
        containerClassName
      )}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[2800px] px-4">
        <WallpaperColumn
          image={wallpaperImage}
          side="left"
          showOnMobile={showWallpaperOnMobile}
          size={wallpaperSize}
          position={wallpaperPosition}
        />
        <main
          className={classNames(
            "relative z-10 flex min-h-screen w-full flex-1 flex-col bg-zinc-950 pb-10",
            contentClassName
          )}
        >
          {children}
        </main>
        <WallpaperColumn
          image={wallpaperImage}
          side="right"
          showOnMobile={showWallpaperOnMobile}
          size={wallpaperSize}
          position={wallpaperPosition}
        />
      </div>
    </div>
  );
};

interface WallpaperColumnProps {
  image: string;
  side: "left" | "right";
  showOnMobile: boolean;
  size: string;
  position: string;
}

const WallpaperColumn = ({
  image,
  side,
  showOnMobile,
  size,
  position,
}: WallpaperColumnProps) => {
  const visibilityClass = showOnMobile ? "block" : "hidden lg:block";
  const horizontalGradient =
    side === "left"
      ? "bg-gradient-to-r from-black via-black/70 to-transparent"
      : "bg-gradient-to-l from-black via-black/70 to-transparent";

  return (
    <div
      aria-hidden
      className={classNames(
        "relative flex-shrink-0",
        COLUMN_WIDTH_CLASSES,
        visibilityClass
      )}
    >
      <div className="pointer-events-none sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${image}')`,
            backgroundSize: size,
            backgroundPosition: position,
          }}
        />
        <div className={classNames("absolute inset-0", horizontalGradient)} />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>
    </div>
  );
};

export default PageLayout;
