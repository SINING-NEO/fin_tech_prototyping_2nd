import { createServer } from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const preferredPort = Number(process.env.PORT) || 3000;
const maxAttempts = 50;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

function runNextStart(port) {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

    const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
      cwd: projectRoot,
      stdio: ["inherit", "pipe", "pipe"],
      env: { ...process.env, PORT: String(port) },
    });

    let settled = false;
    let stderr = "";

    child.stdout?.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr?.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(chunk);

      if (!settled && /EADDRINUSE|address already in use/i.test(text)) {
        settled = true;
        child.kill();
        resolve("EADDRINUSE");
      }
    });

    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;

      if (/EADDRINUSE|address already in use/i.test(stderr)) {
        resolve("EADDRINUSE");
        return;
      }

      process.exit(code ?? 0);
    });

    process.on("SIGINT", () => child.kill("SIGINT"));
    process.on("SIGTERM", () => child.kill("SIGTERM"));
  });
}

for (let offset = 0; offset < maxAttempts; offset += 1) {
  const port = preferredPort + offset;

  if (!(await isPortAvailable(port))) {
    continue;
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is in use. Trying http://localhost:${port} ...`);
  } else {
    console.log(`Starting production server at http://localhost:${port}`);
  }

  const result = await runNextStart(port);

  if (result !== "EADDRINUSE") {
    break;
  }

  console.log(`Port ${port} became unavailable. Trying next port...`);
}
