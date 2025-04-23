const path = require("path");
const { pathToFileURL } = require("url");

function toValidPath(source = "") {
  return pathToFileURL(path.resolve(__dirname, source));
}

module.exports = { toValidPath };
