// Dev helper: exercises the storefront signup endpoint against a locally running app.
// Requires the backend to be running with ALLOW_DUMMY_OTP=true (development only).
// Usage: node scripts/test-signup.js <store-slug>
async function run() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: node scripts/test-signup.js <store-slug>');
    process.exit(1);
  }

  const res = await fetch('http://localhost:3000/api/v1/store/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      fullName: 'Test User',
      phoneNumber: '+911234567891',
      password: 'SomeTestPass123!',
      idToken: 'dummy_token',
    }),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

run();
