import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "لام — منصّة الحضور المهنيّ",
    short_name: "لام",
    description: "اجعل خبرتك مرئيّة، قابلةً للاكتشاف، وموثوقة.",
    start_url: "/",
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: "#0a192f",
    theme_color: "#0a192f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
