// Runs trendContext and buildVerdict on the mock response and prints the output.
// Usage: YOUCOM_API_KEY=... npx tsx scripts/try-youcom.ts
// Without a key, both functions return the offline fallback.
import { mockResponse } from "../lib/mock-data";
import { buildVerdict, trendContext } from "../lib/youcom";

async function main() {
  const { query, original, similar } = mockResponse;

  console.log("== trendContext ==");
  console.log(JSON.stringify(await trendContext(query), null, 2));

  console.log("\n== buildVerdict ==");
  console.log(JSON.stringify(await buildVerdict({ query, original, similar }), null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
