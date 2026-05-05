import type { RequestFormData, RequestMethod } from "../models/RequestModel";

export type CodeLanguage =
  | "curl"
  | "har"
  | "dart"
  | "javascript-axios"
  | "javascript-fetch"
  | "nodejs-axios"
  | "nodejs-fetch"
  | "kotlin-okhttp3"
  | "python-http.client"
  | "python-requests";

export const CODE_LANGUAGE_OPTIONS: { value: CodeLanguage; label: string }[] = [
  { value: "curl", label: "cURL" },
  { value: "har", label: "HAR" },
  { value: "dart", label: "Dart" },
  { value: "javascript-axios", label: "JavaScript (Axios)" },
  { value: "javascript-fetch", label: "JavaScript (Fetch)" },
  { value: "nodejs-axios", label: "Node.js (Axios)" },
  { value: "nodejs-fetch", label: "Node.js (Fetch)" },
  { value: "kotlin-okhttp3", label: "Kotlin (OkHttp3)" },
  { value: "python-http.client", label: "Python (http.client)" },
  { value: "python-requests", label: "Python (requests)" },
];

function escapeSingleQuotes(s: string): string {
  return s.replace(/'/g, "'\\''");
}

function escapeDoubleQuotes(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function headerEntries(data: RequestFormData): [string, string][] {
  return Object.entries(data.headers).filter(([, v]) => v != null && String(v).trim() !== "");
}

function getFileExtension(lang: CodeLanguage): string {
  switch (lang) {
    case "curl":
      return "sh";
    case "har":
      return "har";
    case "dart":
      return "dart";
    case "javascript-axios":
    case "javascript-fetch":
    case "nodejs-axios":
    case "nodejs-fetch":
      return "js";
    case "kotlin-okhttp3":
      return "kt";
    case "python-http.client":
    case "python-requests":
      return "py";
    default:
      return "txt";
  }
}

export function generateCode(data: RequestFormData, language: CodeLanguage): string {
  const { method, headers, body } = data;
  const url = data.url && String(data.url).trim() !== "" ? data.url : "https://example.com/api";
  const hasBody = body != null && String(body).trim() !== "" && !["GET", "HEAD", "OPTIONS"].includes(method);
  const headerList = headerEntries(data);

  switch (language) {
    case "curl": {
      const lines: string[] = ["curl -X " + method + " " + "'" + escapeSingleQuotes(url) + "'"];
      for (const [k, v] of headerList) {
        lines.push("  -H '" + escapeSingleQuotes(k + ": " + v) + "'");
      }
      if (hasBody) {
        const b = body!.replace(/\\/g, "\\\\").replace(/'/g, "'\\''");
        lines.push("  -d '" + b + "'");
      }
      return lines.join(" \\\n");
    }

    case "har": {
      const har = {
        log: {
          version: "1.2",
          creator: { name: "CallSensei", version: "1.0" },
          entries: [
            {
              request: {
                method,
                url,
                httpVersion: "HTTP/1.1",
                headers: headerList.map(([name, value]) => ({ name, value })),
                queryString: [],
                postData: hasBody
                  ? {
                      mimeType: "application/json",
                      text: body,
                    }
                  : undefined,
              },
            },
          ],
        },
      };
      return JSON.stringify(har, null, 2);
    }

    case "dart": {
      const lines: string[] = [
        "import 'package:http/http.dart' as http;",
        "",
        "void main() async {",
        "  final url = Uri.parse('" + escapeDoubleQuotes(url) + "');",
        "  final headers = {",
        ...headerList.map(([k, v]) => '    "' + escapeDoubleQuotes(k) + '": "' + escapeDoubleQuotes(v) + '",'),
        "  };",
      ];
      if (hasBody) {
        lines.push("  final body = '''" + body!.replace(/\\/g, "\\\\").replace(/'/g, "''") + "''';");
        lines.push("  final response = await http." + method.toLowerCase() + "(url, headers: headers, body: body);");
      } else {
        lines.push("  final response = await http." + method.toLowerCase() + "(url, headers: headers);");
      }
      lines.push("  print(response.statusCode);");
      lines.push("  print(response.body);");
      lines.push("}");
      return lines.join("\n");
    }

    case "javascript-axios": {
      const lines: string[] = [
        "const axios = require('axios');",
        "",
        "const response = await axios." + method.toLowerCase() + "(",
        "  '" + escapeSingleQuotes(url) + "',",
      ];
      if (hasBody) {
        try {
          JSON.parse(body!);
          lines.push("  " + body!.trim() + ",");
        } catch {
          lines.push("  `" + body!.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`,");
        }
      }
      const configParts: string[] = [];
      if (headerList.length > 0) {
        configParts.push("headers: {\n    " + headerList.map(([k, v]) => `"${escapeDoubleQuotes(k)}": "${escapeDoubleQuotes(v)}"`).join(",\n    ") + "\n  }");
      }
      if (configParts.length > 0 || hasBody) {
        lines.push("  { " + configParts.join(", ") + " }");
      }
      lines[lines.length - 1] = lines[lines.length - 1].replace(/,\s*$/, "") + ");";
      lines.push("");
      lines.push("console.log(response.data);");
      return lines.join("\n");
    }

    case "javascript-fetch": {
      const opts: string[] = ['  method: "' + method + '"'];
      if (headerList.length > 0) {
        opts.push(
          "  headers: {\n    " +
            headerList.map(([k, v]) => `"${escapeDoubleQuotes(k)}": "${escapeDoubleQuotes(v)}"`).join(",\n    ") +
            "\n  }"
        );
      }
      if (hasBody) opts.push("  body: " + (isJsonLike(body!) ? "JSON.stringify(" + body!.trim() + ")" : "`" + body!.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`"));
      const lines: string[] = [
        "const response = await fetch('" + escapeSingleQuotes(url) + "', {",
        opts.join(",\n"),
        "});",
        "",
        "const data = await response.json();",
        "console.log(data);",
      ];
      return lines.join("\n");
    }

    case "nodejs-axios": {
      const lines: string[] = [
        "const axios = require('axios');",
        "",
        "const response = await axios." + method.toLowerCase() + "(",
        "  '" + escapeSingleQuotes(url) + "',",
      ];
      if (hasBody) {
        try {
          JSON.parse(body!);
          lines.push("  " + body!.trim() + ",");
        } catch {
          lines.push("  `" + body!.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`,");
        }
      }
      const configParts: string[] = [];
      if (headerList.length > 0) {
        configParts.push("headers: {\n    " + headerList.map(([k, v]) => `"${escapeDoubleQuotes(k)}": "${escapeDoubleQuotes(v)}"`).join(",\n    ") + "\n  }");
      }
      if (configParts.length > 0 || hasBody) {
        lines.push("  { " + configParts.join(", ") + " }");
      }
      lines[lines.length - 1] = lines[lines.length - 1].replace(/,\s*$/, "") + ");";
      lines.push("");
      lines.push("console.log(response.data);");
      return lines.join("\n");
    }

    case "nodejs-fetch": {
      const opts: string[] = ['  method: "' + method + '"'];
      if (headerList.length > 0) {
        opts.push(
          "  headers: {\n    " +
            headerList.map(([k, v]) => `"${escapeDoubleQuotes(k)}": "${escapeDoubleQuotes(v)}"`).join(",\n    ") +
            "\n  }"
        );
      }
      if (hasBody) opts.push("  body: " + (isJsonLike(body!) ? "JSON.stringify(" + body!.trim() + ")" : "`" + body!.replace(/\\/g, "\\\\").replace(/`/g, "\\`") + "`"));
      const lines: string[] = [
        "const fetch = require('node-fetch');",
        "",
        "const response = await fetch('" + escapeSingleQuotes(url) + "', {",
        opts.join(",\n"),
        "});",
        "",
        "const data = await response.json();",
        "console.log(data);",
      ];
      return lines.join("\n");
    }

    case "kotlin-okhttp3": {
      const lines: string[] = [
        "import okhttp3.MediaType.Companion.toMediaType",
        "import okhttp3.OkHttpClient",
        "import okhttp3.Request",
        "import okhttp3.RequestBody.Companion.toRequestBody",
        "",
        "val client = OkHttpClient()",
        "val url = \"" + escapeDoubleQuotes(url) + "\"",
        "val requestBuilder = Request.Builder().url(url)",
      ];
      for (const [k, v] of headerList) {
        lines.push("requestBuilder.addHeader(\"" + escapeDoubleQuotes(k) + "\", \"" + escapeDoubleQuotes(v) + "\")");
      }
      if (hasBody) {
        lines.push("val body = \"" + escapeDoubleQuotes(body!) + "\".toRequestBody(\"application/json; charset=utf-8\".toMediaType())");
        lines.push("requestBuilder.method(\"" + method + "\", body)");
      } else {
        lines.push("requestBuilder.method(\"" + method + "\", null)");
      }
      lines.push("val request = requestBuilder.build()");
      lines.push("val response = client.newCall(request).execute()");
      lines.push("println(response.body?.string())");
      return lines.join("\n");
    }

    case "python-http.client": {
      const u = new URL(url);
      const pathQuery = u.pathname + (u.search || "");
      const isHttps = u.protocol === "https:";
      const connClass = isHttps ? "HTTPSConnection" : "HTTPConnection";
      const lines: string[] = [
        "import http.client",
        "",
        "conn = http.client." + connClass + "(\"" + u.hostname + "\")",
        "headers = {",
        ...headerList.map(([k, v]) => '    "' + escapeDoubleQuotes(k) + '": "' + escapeDoubleQuotes(v) + '",'),
        "}",
        "conn.request(\"" + method + "\", \"" + pathQuery.replace(/"/g, '\\"') + "\", body=" + (hasBody ? '"""' + body!.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"""' : "None") + ", headers=headers)",
        "res = conn.getresponse()",
        "data = res.read()",
        "print(data.decode())",
        "conn.close()",
      ];
      return lines.join("\n");
    }

    case "python-requests": {
      const lines: string[] = [
        "import requests",
        "",
        "url = \"" + escapeDoubleQuotes(url) + "\"",
        "headers = {",
        ...headerList.map(([k, v]) => '    "' + escapeDoubleQuotes(k) + '": "' + escapeDoubleQuotes(v) + '",'),
        "}",
      ];
      if (hasBody) {
        try {
          const parsed = JSON.parse(body!);
          lines.push("payload = " + JSON.stringify(parsed, null, 2));
          lines.push("response = requests." + method.toLowerCase() + "(url, json=payload, headers=headers)");
        } catch {
          lines.push("payload = '''" + body!.replace(/\\/g, "\\\\").replace(/'/g, "''") + "'''");
          lines.push("response = requests." + method.toLowerCase() + "(url, data=payload, headers=headers)");
        }
      } else {
        lines.push("response = requests." + method.toLowerCase() + "(url, headers=headers)");
      }
      lines.push("print(response.text)");
      return lines.join("\n");
    }

    default:
      return generateCode(data, "curl");
  }
}

function isJsonLike(s: string): boolean {
  const t = s.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

export function getDownloadFilename(language: CodeLanguage, defaultName = "request"): string {
  const ext = getFileExtension(language);
  return `${defaultName}.${ext}`;
}