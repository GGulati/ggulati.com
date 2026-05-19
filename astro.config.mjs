import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://ggulati.com",
  base: "./",
  output: "static",
  build: {
    format: "file",
  },
});
