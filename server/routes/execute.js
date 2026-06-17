const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const languageConfig = {
  javascript: {
    extension: "js",
    image: "node:18-alpine",
    command: "node /app/temp.js",
  },

  python: {
    extension: "py",
    image: "python:3.12-alpine",
    command: "python /app/temp.py",
  },

  java: {
    fileName: "Main.java",
    image: "eclipse-temurin:21",
    command: 'sh -c "javac /app/Main.java && java -cp /app Main"',
  },

  cpp: {
    extension: "cpp",
    image: "gcc:latest",
    command: 'sh -c "g++ /app/temp.cpp -o /app/temp && /app/temp"',
  },
};
router.post("/", async (req, res) => {
  const { code, language } = req.body;
  console.log("LANGUAGE RECEIVED:", language);
  if (!code) {
    return res.status(400).json({
      error: "No code provided",
    });
  }
  if (!languageConfig[language]) {
    return res.status(400).json({
      error: "Unsupported language",
    });
  }
  try {
    // Create temp directory if not exists
    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const config = languageConfig[language];

    const filename =
      language === "java" ? "Main.java" : `temp.${config.extension}`;

    const filePath = path.join(tempDir, filename);

    fs.writeFileSync(filePath, code);

    // Convert Windows path for Docker
    const dockerTempDir = tempDir.replace(/\\/g, "/");

    const command =
      `docker run --rm ` +
      `-v "${dockerTempDir}:/app" ` +
      `${config.image} ${config.command}`;
    console.log("FILE PATH:", filePath);
    console.log("DOCKER PATH:", dockerTempDir);
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
    console.log("COMMAND:", command);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
