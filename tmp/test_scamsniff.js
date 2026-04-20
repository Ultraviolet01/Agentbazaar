const http = require('http');

const data = JSON.stringify({
  pageContext: {
    url: "https://unisvvap.org",
    domain: "unisvvap.org",
    protocol: "https:",
    title: "Uniswap | Swap tokens",
    suspiciousPhrases: ["urgent action required", "connect your wallet immediately"],
    contractAddresses: ["0x123...abc"],
    socialHandles: { twitter: "uniswap" }
  }
});

const options = {
  hostname: 'localhost',
  port: 3010,
  path: '/api/agents/scamsniff/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('--- Status:', res.statusCode);
    console.log('--- Response:', JSON.parse(body));
  });
});

req.on('error', (error) => {
  console.error('--- Error:', error);
});

req.write(data);
req.end();
