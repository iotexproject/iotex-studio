import express from "express";
import serveStatic from "serve-static";
import compression from "shrink-ray-current";
import { redirectToHTTPS } from "express-http-to-https";
import axios from "axios";
import cors from "cors";

const app = express();

app.get("/wasm/:version", async (req, res, next) => {
  const version = req.params["version"];
  axios.get(`https://solc-bin.ethereum.org/wasm/${version}`, { responseType: "stream" }).then((response) => {
    res.set({
      ...response.headers,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
      "Cache-Control": "public, max-age=31557600",
    });
    response.data.pipe(res);
  });
});

app
  .use(cors())
  .use(redirectToHTTPS([/localhost:(\d{4})/], [/\/insecure/], 301))
  .use(compression())
  .use(serveStatic(__dirname + "/dist", { maxAge: 86400 * 1000 }));

var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
