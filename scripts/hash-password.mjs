import { pbkdf2Sync, randomBytes } from "node:crypto";

const ITERATIONS = 210_000;
const KEY_LENGTH = 32;

async function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8").trimEnd();
  }

  process.stdout.write("New admin password: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();

  return new Promise((resolve, reject) => {
    let password = "";
    const onData = (chunk) => {
      const value = chunk.toString("utf8");
      if (value === "\u0003") {
        process.stdin.setRawMode(false);
        reject(new Error("Cancelled."));
        return;
      }
      if (value === "\r" || value === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(password);
        return;
      }
      if (value === "\u007f") {
        if (password.length) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      password += value;
      process.stdout.write("*");
    };
    process.stdin.on("data", onData);
  });
}

const password = await readPassword();
if (password.length < 12) {
  throw new Error("Use at least 12 characters.");
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");
process.stdout.write(`pbkdf2-sha256$${ITERATIONS}$${salt.toString("base64url")}$${hash.toString("base64url")}\n`);
