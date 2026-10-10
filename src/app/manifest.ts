import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Overs/Unders",
    short_name: "Overs/Unders",
    description: "Draft NBA teams. Count their wins or losses. Most points wins.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b1a",
    theme_color: "#0b0b1a",
    icons: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
