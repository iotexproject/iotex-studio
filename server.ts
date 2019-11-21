import express from "express";
import serveStatic from "serve-static";
import path from "path";
const app = express();
app.use(serveStatic(__dirname + "/dist"));

var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
