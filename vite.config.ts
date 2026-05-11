import vue from "@vitejs/plugin-vue";
import { telefunc } from "telefunc/vite";
import tailwindcss from "@tailwindcss/vite";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __APP_VERSION__: JSON.stringify(pkg.version ?? "1.0.0"),
  },
  plugins: [vike(), tailwindcss(), telefunc(), vue()],
  server: {
    watch: {
      ignored: ["**/.wrangler/**", "**/dist/**", "**/generated/**"],
    },
  },
});
