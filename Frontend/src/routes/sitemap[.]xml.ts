import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

const paths = [
  { path: "/", priority: "1.0", changefreq: "weekly" as const },
  { path: "/report", priority: "0.9", changefreq: "monthly" as const },
  { path: "/my-reports", priority: "0.7", changefreq: "weekly" as const },
  { path: "/assistant", priority: "0.7", changefreq: "monthly" as const },
  { path: "/ward", priority: "0.5", changefreq: "weekly" as const },
  { path: "/police", priority: "0.5", changefreq: "weekly" as const },
  { path: "/city-admin", priority: "0.5", changefreq: "weekly" as const },
  { path: "/login", priority: "0.4", changefreq: "yearly" as const },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = paths
          .map(
            (p) =>
              `  <url>\n    <loc>${BASE_URL}${p.path}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
