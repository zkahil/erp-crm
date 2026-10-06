import fs from "node:fs";
import crypto from "node:crypto";

if (!fs.existsSync(".env") && fs.existsSync(".env.example")) fs.copyFileSync(".env.example", ".env");
let s = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
if (!/^AUTH_SECRET=.+/m.test(s)) {
  s = s.replace(/^AUTH_SECRET=.*\r?\n?/m, "");
  if (s && !s.endsWith("\n")) s += "\n";
  s += `AUTH_SECRET=${crypto.randomBytes(32).toString("base64")}\n`;
  fs.writeFileSync(".env", s);
  console.log("AUTH_SECRET généré dans .env");
}
