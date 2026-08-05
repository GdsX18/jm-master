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
    return isMobile ? [0.9, 0.98] : [1.01, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.8], [isMobile ? 4 : 8, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.8], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 0.8], [0, -35]);

  return (
    <div
      className="h-[48rem] sm:h-[56rem] md:h-[64rem] lg:h-[70rem] flex items-center justify-center relative px-4 sm:px-6 md:px-12 lg:px-16"
      ref={containerRef}
    >
      <div
        className="py-4 sm:py-8 md:py-14 w-full relative max-w-[1400px] mx-auto"
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
        willChange: "transform",
        boxShadow:
          "0 15px 35px -10px rgba(8, 43, 97, 0.1), 0 8px 18px -4px rgba(230, 79, 20, 0.08)",
      }}
      className="max-w-5xl -mt-6 sm:-mt-10 md:-mt-14 mx-auto min-h-[22rem] sm:min-h-[28rem] md:min-h-[34rem] lg:min-h-[38rem] w-full border-2 sm:border-4 border-white p-2 sm:p-4 md:p-6 bg-slate-50/95 rounded-[24px] sm:rounded-[36px] shadow-xl overflow-hidden"
    >
      <div className="h-full w-full overflow-hidden rounded-xl sm:rounded-2xl bg-white p-1 sm:p-3 md:p-4 border border-slate-200/80">
        {children}
      </div>
    </motion.div>
  );
};
