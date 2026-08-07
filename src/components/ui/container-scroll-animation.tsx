"use client";

import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

interface ContainerScrollProps {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}

const ContainerScrollContent: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}> = ({ containerRef, titleComponent, children }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport, { passive: true });
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef as React.RefObject<HTMLDivElement>,
    offset: ["start start", "end end"],
  });

  const rotate = useTransform(scrollYProgress, [0, 0.8], [isDesktop ? 6 : 0, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [isDesktop ? 1.02 : 1, 1]);
  const translate = useTransform(scrollYProgress, [0, 0.8], [0, isDesktop ? -25 : 0]);

  return (
    <div
      className="py-6 sm:py-10 md:py-14 w-full relative max-w-[1400px] mx-auto"
      style={{
        perspective: isDesktop ? "1000px" : "none",
      }}
    >
      <Header translate={translate} isDesktop={isDesktop} titleComponent={titleComponent} />
      <Card rotate={rotate} translate={translate} scale={scale} isDesktop={isDesktop}>
        {children}
      </Card>
    </div>
  );
};

export const ContainerScroll: React.FC<ContainerScrollProps> = ({
  titleComponent,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="flex items-center justify-center relative px-3 sm:px-6 md:px-8 lg:px-12 w-full"
      ref={containerRef}
    >
      {mounted ? (
        <ContainerScrollContent
          containerRef={containerRef}
          titleComponent={titleComponent}
        >
          {children}
        </ContainerScrollContent>
      ) : (
        <div className="py-6 sm:py-10 md:py-14 w-full relative max-w-[1400px] mx-auto">
          <div className="max-w-7xl mx-auto text-center z-10 relative mb-6 sm:mb-8">
            {titleComponent}
          </div>
          <div className="max-w-5xl mx-auto w-full border border-white/90 sm:border-2 md:border-4 p-1.5 sm:p-3 md:p-5 bg-slate-50/90 rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-lg overflow-hidden">
            <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2 sm:p-4 md:p-5 border border-slate-200/70">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const Header = ({
  translate,
  isDesktop,
  titleComponent,
}: {
  translate: MotionValue<number>;
  isDesktop: boolean;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: isDesktop ? translate : 0,
      }}
      className="max-w-7xl mx-auto text-center z-10 relative mb-6 sm:mb-8"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  isDesktop,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  isDesktop: boolean;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: isDesktop ? rotate : 0,
        scale: isDesktop ? scale : 1,
        willChange: isDesktop ? "transform" : "auto",
        boxShadow:
          "0 15px 35px -10px rgba(8, 43, 97, 0.08), 0 8px 18px -4px rgba(230, 79, 20, 0.06)",
      }}
      className="transform-gpu max-w-5xl mx-auto w-full border border-white/90 sm:border-2 md:border-4 p-1.5 sm:p-3 md:p-5 bg-slate-50/90 rounded-2xl sm:rounded-3xl md:rounded-[32px] shadow-lg sm:shadow-xl overflow-hidden"
    >
      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-white p-2 sm:p-4 md:p-5 border border-slate-200/70">
        {children}
      </div>
    </motion.div>
  );
};
