"use client";

import Image from "next/image";
import { Box } from "lucide-react";

interface ProjectIconProps {
  imageUrl: string | null;
  title: string;
  size?: "sm" | "md" | "lg";
}

export function ProjectIcon({
  imageUrl,
  title,
  size = "md",
}: ProjectIconProps) {
  const dimensions = {
    sm: { width: 24, height: 24, containerClass: "w-6 h-6" },
    md: { width: 48, height: 48, containerClass: "w-12 h-12" },
    lg: { width: 64, height: 64, containerClass: "w-16 h-16" },
  };

  const { width, height, containerClass } = dimensions[size];

  return (
    <div
      className={`${containerClass} relative rounded-md overflow-hidden flex-shrink-0`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`Icon for ${title}`}
          width={width}
          height={height}
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
          <Box
            className="text-gray-500 dark:text-gray-400"
            size={size === "sm" ? 16 : size === "md" ? 32 : 40}
          />
        </div>
      )}
    </div>
  );
}
