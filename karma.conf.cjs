const fs = require("node:fs");
const path = require("node:path");
// Chrome se detecta automáticamente; CHROME_BIN permite indicar otra instalación.
if (!process.env.CHROME_BIN) {
  const candidates = [
    process.env.PROGRAMFILES &&
      path.join(
        process.env.PROGRAMFILES,
        "Google/Chrome/Application/chrome.exe",
      ),
    process.env["PROGRAMFILES(X86)"] &&
      path.join(
        process.env["PROGRAMFILES(X86)"],
        "Microsoft/Edge/Application/msedge.exe",
      ),
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  process.env.CHROME_BIN = candidates.find((p) => p && fs.existsSync(p)) || "";
}
function JsonReporter() {
  const cases = [];
  this.onSpecComplete = (_browser, r) =>
    cases.push({
      suite: r.suite.join(" / "),
      name: r.description,
      success: r.success,
      skipped: r.skipped,
      timeMs: r.time,
      log: r.log,
    });
  this.onRunComplete = (_b, r) => {
    fs.mkdirSync("coverage", { recursive: true });
    fs.writeFileSync(
      "coverage/test-results.json",
      JSON.stringify(
        { date: new Date().toISOString(), result: r, cases },
        null,
        2,
      ),
    );
  };
}
module.exports = (config) =>
  config.set({
    frameworks: ["jasmine"],
    files: [".test-build/tests.js"],
    reporters: ["progress", "coverage", "jsonResults"],
    plugins: [
      "karma-jasmine",
      "karma-chrome-launcher",
      "karma-coverage",
      { "reporter:jsonResults": ["type", JsonReporter] },
    ],
    browsers: [
      process.env.KARMA_NO_SANDBOX === "1"
        ? "ChromeHeadlessRestricted"
        : "ChromeHeadless",
    ],
    customLaunchers: {
      ChromeHeadlessRestricted: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--disable-gpu"],
      },
    },
    singleRun: false,
    autoWatch: true,
    client: { jasmine: { random: false } },
    coverageReporter: {
      dir: "coverage",
      subdir: ".",
      reporters: [
        { type: "html" },
        { type: "text-summary" },
        { type: "json-summary" },
      ],
    },
    browserNoActivityTimeout: 60000,
  });
