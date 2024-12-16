"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface Slogan {
  text: string;
  language: string;
  flag: string;
}

interface ScrollingRowProps {
  slogans: Slogan[];
  direction: "left" | "right";
}

export default function ScrollingRow({
  slogans,
  direction,
}: ScrollingRowProps) {
  const containerVariants = {
    animate: {
      x: direction === "left" ? [0, -1920] : [-1920, 0],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 30,
          ease: "linear",
        },
      },
    },
  };

  return (
    <div className="relative overflow-hidden whitespace-nowrap">
      <div className="absolute top-0 bottom-0 left-0 w-32 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
      <motion.div
        className="inline-block"
        variants={containerVariants}
        animate="animate"
      >
        {[...slogans, ...slogans].map((slogan, index) => (
          <Card key={index} className="inline-block mx-4 shadow-md">
            <CardContent className="p-4 flex items-start space-x-4">
              <span
                className="text-2xl flex-shrink-0"
                role="img"
                aria-label={`${slogan.language} flag`}
              >
                {slogan.flag}
              </span>
              <div>
                <h2 className="text-lg font-semibold mb-1">
                  {slogan.language}
                </h2>
                <p className="whitespace-normal">{slogan.text}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
      <div className="absolute top-0 bottom-0 right-0 w-32 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
    </div>
  );
}
