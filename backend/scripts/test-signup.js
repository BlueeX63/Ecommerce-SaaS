const fetch = require('node-fetch');

async function run() {
  const res = await fetch("http://localhost:3000/api/v1/store/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug: "Fakeslug123", fullName: "Test User", phoneNumber: "+911234567891", password: "somepass", idToken: "dummy_token" }),
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

run();
