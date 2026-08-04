"use client";
import React, { useRef, useState, useEffect } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.85, 0.95] : [1.02, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.8], [isMobile ? 10 : 20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.8], [0, -60]);

  return (
    <div
      className="h-[60rem] sm:h-[70rem] md:h-[82rem] lg:h-[90rem] flex items-center justify-center relative px-4 sm:px-6 md:px-12 lg:px-16"
      ref={containerRef}
    >
      <div
        className="py-6 sm:py-10 md:py-20 w-full relative max-w-[1400px] mx-auto"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-7xl mx-auto text-center z-10 relative"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 20px 50px -12px rgba(8, 43, 97, 0.15), 0 10px 25px -5px rgba(230, 79, 20, 0.1)",
      }}
      className="max-w-5xl -mt-6 sm:-mt-10 md:-mt-14 mx-auto min-h-[25rem] sm:min-h-[32rem] md:min-h-[38rem] lg:min-h-[44rem] w-full border-2 sm:border-4 border-white p-2 sm:p-4 md:p-6 bg-slate-50/95 rounded-[24px] sm:rounded-[36px] shadow-2xl overflow-hidden"
    >
      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-white p-1 sm:p-3 md:p-4 border border-slate-200/80">
        {children}
      </div>
    </motion.div>
  );
};
