import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { readFileSync } from "fs";

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account key JSON path"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(
  readFileSync(serviceAccountPath, "utf-8")
) as ServiceAccount;

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Create MCP server
const server = new McpServer({
  name: "journal",
  version: "1.0.0",
});

server.tool(
  "get_entries_by_date",
  "Fetch journal entries by creation date. Provide a single date to get that day's entries, or a date range.",
  {
    date: z
      .string()
      .optional()
      .describe("Single date to fetch entries for (YYYY-MM-DD)"),
    startDate: z
      .string()
      .optional()
      .describe("Start of date range inclusive (YYYY-MM-DD)"),
    endDate: z
      .string()
      .optional()
      .describe("End of date range inclusive (YYYY-MM-DD)"),
  },
  async ({ date, startDate, endDate }) => {
    let start: Date;
    let end: Date;

    if (date) {
      start = new Date(date + "T00:00:00");
      end = new Date(date + "T23:59:59.999");
    } else if (startDate && endDate) {
      start = new Date(startDate + "T00:00:00");
      end = new Date(endDate + "T23:59:59.999");
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: "Provide either 'date' for a single day, or both 'startDate' and 'endDate' for a range.",
          },
        ],
      };
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Invalid date format. Use YYYY-MM-DD.",
          },
        ],
      };
    }

    const startTs = Timestamp.fromDate(start);
    const endTs = Timestamp.fromDate(end);

    const snapshot = await db
      .collection("entries")
      .where("createdAt", ">=", startTs)
      .where("createdAt", "<=", endTs)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No journal entries found for the specified date(s).`,
          },
        ],
      };
    }

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "(untitled)",
        content: data.plainText || data.content || "",
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.().toISOString() ?? null,
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(entries, null, 2),
        },
      ],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
