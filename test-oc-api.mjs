// Quick test to see what data OC returns with your API key
// Usage: OPEN_COLLECTIVE_API_KEY=your_key node test-oc-api.mjs

const API_KEY = process.env.OPEN_COLLECTIVE_API_KEY;
const CLIENT_ID = process.env.OC_CLIENT_ID;
const CLIENT_SECRET = process.env.OC_CLIENT_SECRET;

if (!API_KEY) {
  console.error("Set OPEN_COLLECTIVE_API_KEY env var");
  process.exit(1);
}
console.log("API_KEY:", API_KEY ? "set" : "missing");
console.log("CLIENT_ID:", CLIENT_ID ? "set" : "missing");
console.log("CLIENT_SECRET:", CLIENT_SECRET ? "set" : "missing");

const ORDER_ID_V2 = "k9mbw7y4-8r3zq3oy-y8nq0ej5-lavnodgx";
const LEGACY_ORDER_ID = 937686;

async function query(label, gql, extraHeaders = {}) {
  console.log(`\n=== ${label} ===`);
  const res = await fetch("https://api.opencollective.com/graphql/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": API_KEY,
      ...extraHeaders,
    },
    body: JSON.stringify({ query: gql }),
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  return data;
}

// Test 1: Order lookup by v2 ID (what quick-signin does)
await query("Order lookup by orderIdV2", `{
  order(order: { id: "${ORDER_ID_V2}" }) {
    fromAccount {
      name
      slug
      emails
      ... on Individual { email }
    }
    tier { name }
    status
  }
}`);

// Test 2: Order lookup by legacy ID
await query("Order lookup by legacyId", `{
  order(order: { legacyId: ${LEGACY_ORDER_ID} }) {
    fromAccount {
      name
      slug
      emails
      ... on Individual { email }
    }
    tier { name }
    status
  }
}`);

// Test 3: If we got a slug from test 1/2, try fetching email by slug
// Using guest slug from the logs
await query("Account by slug (guest-a244e5c1)", `{
  account(slug: "guest-a244e5c1") {
    name
    slug
    type
    ... on Individual { email }
    emails
  }
}`);

// Test 4: Order lookup with Client-Id/Client-Secret
if (CLIENT_ID && CLIENT_SECRET) {
  await query("Order lookup with Client-Id/Secret", `{
    order(order: { id: "${ORDER_ID_V2}" }) {
      fromAccount {
        name
        slug
        emails
        ... on Individual { email }
      }
      tier { name }
    }
  }`, { "Client-Id": CLIENT_ID, "Client-Secret": CLIENT_SECRET });

  // Test 5: Account by slug with Client-Id/Client-Secret
  await query("Account by slug with Client-Id/Secret", `{
    account(slug: "guest-a244e5c1") {
      name
      slug
      ... on Individual { email }
      emails
    }
  }`, { "Client-Id": CLIENT_ID, "Client-Secret": CLIENT_SECRET });

  // Test 6: Both API key AND Client-Id/Secret together
  await query("Order lookup with API key + Client-Id/Secret", `{
    order(order: { id: "${ORDER_ID_V2}" }) {
      fromAccount {
        name
        slug
        emails
        ... on Individual { email }
      }
      tier { name }
    }
  }`, { "Client-Id": CLIENT_ID, "Client-Secret": CLIENT_SECRET });
} else {
  console.log("\n=== Skipping Client-Id/Secret tests (not set) ===");
  console.log("Add OC_CLIENT_ID and OC_CLIENT_SECRET to .env.local to test");
}

// Test 7: Personal-Token header (NOT Api-Key)
await query("Order lookup with Personal-Token header", `{
  order(order: { id: "${ORDER_ID_V2}" }) {
    fromAccount {
      name
      slug
      emails
      ... on Individual { email }
    }
    tier { name }
  }
}`, { "Personal-Token": API_KEY });

// Test 8: Account by slug with Personal-Token header
await query("Account by slug with Personal-Token header", `{
  account(slug: "guest-a244e5c1") {
    name
    slug
    ... on Individual { email }
    emails
  }
}`, { "Personal-Token": API_KEY });

// Test 9: Can the token read ANY email? Try "me" query
await query("Me query (token owner's email)", `{
  me {
    name
    slug
    email
    emails
  }
}`, { "Personal-Token": API_KEY });

// Test 10: List collective members — do real (non-guest) members have emails?
await query("Open-coop members (first 5)", `{
  account(slug: "open-coop") {
    members(limit: 5, role: BACKER) {
      nodes {
        account {
          name
          slug
          ... on Individual { email }
          emails
        }
        tier { name }
      }
    }
  }
}`, { "Personal-Token": API_KEY });

// Test 11: Get email via order nested through collective
await query("Order via collective context", `{
  account(slug: "open-coop") {
    orders(filter: INCOMING, limit: 3, status: PAID, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        legacyId
        fromAccount {
          name
          slug
          ... on Individual { email }
        }
        tier { name }
      }
    }
  }
}`, { "Personal-Token": API_KEY });

// Test 12: Get order by ID but with Personal-Token (double check)
await query("Order by ID with Personal-Token (recheck)", `{
  order(order: { id: "${ORDER_ID_V2}" }) {
    fromAccount {
      name
      slug
      ... on Individual { email }
      emails
    }
    tier { name }
  }
}`, { "Personal-Token": API_KEY });

// Test 13: Recent members — NO role filter
const result = await query("Recent members (no role filter)", `{
  account(slug: "open-coop") {
    members(limit: 20, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes {
        role
        account {
          name
          slug
          ... on Individual { email }
        }
        tier { name }
        createdAt
      }
    }
  }
}`, { "Personal-Token": API_KEY });

const members = result?.data?.account?.members?.nodes || [];
const match = members.find(m => m.account.slug === "guest-a244e5c1");
console.log("\nSlug match for guest-a244e5c1:", match ? JSON.stringify(match, null, 2) : "NOT FOUND in last 20");
console.log("All roles present:", [...new Set(members.map(m => m.role))]);

console.log("\nDone.");
