import { defineConfig } from "astro/config";

export default defineConfig({
  base: "./",
  output: "static",
  build: {
    format: "file",
  },
});
