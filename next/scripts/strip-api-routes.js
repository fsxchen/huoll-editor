import { renameSync, existsSync } from "fs";
import { join } from "path";

// Signal next.config.ts to use static-export mode
process.env.NEXT_PUBLIC_TAURI_BUILD = "1";

const apiDir = join(process.cwd(), "src", "app", "api");
const tempDir = join(process.cwd(), "src", "_server_api_routes");

if (existsSync(apiDir)) {
  renameSync(apiDir, tempDir);
  console.log("Moved src/app/api → src/_server_api_routes for static export");
}
