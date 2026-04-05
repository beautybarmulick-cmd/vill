const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

function ensureDataStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, "[]", "utf8");
  }
}

function sendJson(response, statusCode, payload) {
  if (response.writableEnded) {
    return;
  }

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(response, 500, { success: false, message: "Unable to load requested file." });
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function serveStatic(request, response) {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const safePath = path.normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    sendJson(response, 403, { success: false, message: "Forbidden." });
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendJson(response, 404, { success: false, message: "Page not found." });
      return;
    }

    sendFile(response, filePath);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString();

      if (body.length > 1_000_000) {
        reject(new Error("Request too large."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function parseRequestPayload(request, rawBody) {
  if (!rawBody) {
    return {};
  }

  const contentType = String(request.headers["content-type"] || "").split(";")[0].trim().toLowerCase();

  if (contentType === "application/json") {
    return JSON.parse(rawBody);
  }

  if (contentType === "application/x-www-form-urlencoded") {
    return Object.fromEntries(new URLSearchParams(rawBody).entries());
  }

  return JSON.parse(rawBody);
}

function validateSubmission(payload) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const message = String(payload.message || "").trim();

  if (!name || !email || !message) {
    return { valid: false, message: "Name, email, and message are required." };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  return {
    valid: true,
    submission: {
      id: Date.now(),
      name,
      email,
      phone,
      message,
      submittedAt: new Date().toISOString()
    }
  };
}

function saveSubmission(submission) {
  ensureDataStore();
  const existing = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf8"));
  existing.unshift(submission);
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2), "utf8");
}

async function handleContact(request, response) {
  try {
    const rawBody = await readRequestBody(request);
    const payload = parseRequestPayload(request, rawBody);
    const result = validateSubmission(payload);

    if (!result.valid) {
      sendJson(response, 400, { success: false, message: result.message });
      return;
    }

    saveSubmission(result.submission);
    sendJson(response, 200, {
      success: true,
      message: `Thank you, ${result.submission.name}. Your inquiry has been received.`
    });
  } catch (error) {
    console.error("Contact form error:", error);
    sendJson(response, 500, {
      success: false,
      message: "Something went wrong while sending your message."
    });
  }
}

ensureDataStore();

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/contact") {
    handleContact(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { success: false, message: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(`Vill Farm Fresh server running at http://localhost:${PORT}`);
});
