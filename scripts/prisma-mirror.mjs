// Local Prisma engine mirror — sandbox workaround only.
//
// This VM's egress proxy breaks Prisma's engine downloader (ECONNRESET), so
// `prisma generate` can't fetch from binaries.prisma.sh directly. This tiny
// server serves the already-downloaded engine binaries from
// ~/.cache/prisma-mirror/, and Prisma is pointed at it via:
//
//   PRISMA_ENGINES_MIRROR="http://127.0.0.1:8899" PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
//
// On Vercel / normal networks this is unnecessary — `npx prisma generate`
// works unmodified there.

import http from "http";
import fs from "fs";
import path from "path";
import os from "os";

const root = path.join(os.homedir(), ".cache", "prisma-mirror");

http
  .createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(String(req.url).split("?")[0]));
    fs.stat(p, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404);
        res.end("nf");
        return;
      }
      res.writeHead(200, {
        "Content-Length": st.size,
        "Content-Type": "application/octet-stream",
      });
      fs.createReadStream(p).pipe(res);
    });
  })
  .listen(8899, "127.0.0.1", () => console.log("prisma engine mirror up on 127.0.0.1:8899"));
