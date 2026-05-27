import { renameSync, existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

// Signal next.config.ts to use static-export mode
process.env.NEXT_PUBLIC_TAURI_BUILD = "1";

const apiDir = join(process.cwd(), "src", "app", "api");
const tempDir = join(process.cwd(), "src", "_server_api_routes");

if (existsSync(apiDir)) {
  renameSync(apiDir, tempDir);
  console.log("Moved src/app/api → src/_server_api_routes for static export");
}

// Run next build with the env var set (cross-platform via pnpm)
const result = spawnSync("pnpm", ["next", "build"], { stdio: "inherit", shell: true });

// Restore API routes regardless of build result
if (existsSync(tempDir)) {
  renameSync(tempDir, apiDir);
  console.log("Restored src/app/api");
}

process.exit(result.status ?? 0);
