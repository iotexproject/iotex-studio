import express from "express";
import serveStatic from "serve-static";
import path from "path";
import compression from "compression";
const app = express();
app.use(compression()).use(serveStatic(__dirname + "/dist", { maxAge: 86400 * 1000 }));

var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
