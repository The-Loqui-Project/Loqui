"use client";

import { useParams } from "next/navigation";

export default function ProjectPage() {
  const { project } = useParams();
  return (
    <main>
      <h1 className="text-4xl">{project}</h1>
    </main>
  );
}
