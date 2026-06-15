const fs = require("fs");

const filePath = "/app/temp.js";

try {
  const output = require(filePath);
} catch (err) {
  console.error(err.message);
}
