const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

router.post("/", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: "No code provided",
    });
  }

  try {
    // Create temp directory if not exists
    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const filePath = path.join(tempDir, "temp.js");

    fs.writeFileSync(filePath, code);

    // Convert Windows path for Docker
    const dockerPath = filePath.replace(/\\/g, "/");

    const command = `docker run --rm -v "${dockerPath}:/app/temp.js" node:18-alpine node /app/temp.js`;
    console.log("FILE PATH:", filePath);
    console.log("DOCKER PATH:", dockerPath);
    console.log("COMMAND:", command);
    exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
      console.log("ERROR:", error);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        return res.json({
          output: stderr || error.message,
        });
      }

      return res.json({
        output: stdout,
      });
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
