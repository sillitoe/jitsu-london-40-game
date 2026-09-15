import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(1);
const base = process.env.VITE_BASE_PATH ?? (repositoryName ? `/${repositoryName}/` : "/");

export default defineConfig({
  base,
  server: {
    port: 6066,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
});
