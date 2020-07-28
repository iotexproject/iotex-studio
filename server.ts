import express from "express";
import serveStatic from "serve-static";
import compression from "shrink-ray-current";
import { redirectToHTTPS } from "express-http-to-https";
const app = express();
app
  .use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301))
  .use(compression())
  .use(serveStatic(__dirname + "/dist", { maxAge: 86400 * 1000 }));

var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
