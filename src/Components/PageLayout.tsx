import type { PropsWithChildren, ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

type ClassValue = string | false | null | undefined;

const classNames = (...classes: ClassValue[]) =>
  classes.filter(Boolean).join(" ");

const COLUMN_WIDTH_CLASSES = "lg:w-[220px] xl:w-[260px] 2xl:w-[320px]";

interface PageLayoutProps extends PropsWithChildren {
  wallpaperImage?: string;
  containerClassName?: string;
  contentClassName?: string;
  mainClassName?: string;
  hideWallpaperOnMobile?: boolean;
  wallpaperSize?: string;
  wallpaperPosition?: string;
  overlay?: ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
}

const PageLayout = ({
  children,
  wallpaperImage = "/bg.webp",
  containerClassName,
  contentClassName,
  mainClassName,
  hideWallpaperOnMobile = true,
  wallpaperSize = "cover",
  wallpaperPosition = "center",
  overlay,
  showNavbar = true,
  showFooter = true,
}: PageLayoutProps) => {
  const showWallpaperOnMobile = !hideWallpaperOnMobile;

  return (
    <div
      className={classNames(
        "relative min-h-screen bg-black text-white",
        containerClassName
      )}
    >
      {overlay}
      <div className="mx-auto flex min-h-screen w-full max-w-[2800px] flex-col px-4 sm:px-6 lg:flex-row lg:px-8 lg:gap-6">
        <WallpaperColumn
          image={wallpaperImage}
          side="left"
          showOnMobile={showWallpaperOnMobile}
          size={wallpaperSize}
          position={wallpaperPosition}
        />
        <main
          className={classNames(
            "relative z-10 flex min-h-screen w-full flex-1 flex-col bg-zinc-950",
            mainClassName
          )}
        >
          {showNavbar && <Navbar />}
          <div className={classNames("flex-1", contentClassName)}>
            {children}
          </div>
          {showFooter && <Footer />}
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
  const visibilityClass = showOnMobile ? "flex" : "hidden lg:flex";
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
