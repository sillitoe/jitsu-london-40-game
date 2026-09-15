import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(1);
const configuredBase = process.env.VITE_BASE_PATH?.trim();
const base = configuredBase || (repositoryName ? `/${repositoryName}/` : "/");

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
