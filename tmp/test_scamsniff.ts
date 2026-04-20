import fetch from 'node-fetch';

async function testScamSniff() {
  const payload = {
    pageContext: {
      url: "https://unisvvap.org",
      domain: "unisvvap.org",
      protocol: "https:",
      title: "Uniswap | Swap tokens",
      suspiciousPhrases: ["urgent action required", "connect your wallet immediately"],
      contractAddresses: ["0x123...abc"],
      socialHandles: { twitter: "uniswap" }
    }
  };

  try {
    console.log('--- Sending ScamSniff Request...');
    const response = await fetch('http://localhost:3010/api/agents/scamsniff/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('--- Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('--- TEST PASSED: Successfully generated security report.');
      console.log('--- Risk Level:', data.riskLevel);
      console.log('--- Spoken Verdict:', data.spokenVerdict);
      console.log('--- 0G Storage CID:', data.storageCid);
    } else {
      console.error('--- TEST FAILED:', data.error);
    }
  } catch (error) {
    console.error('--- ERROR:', error);
  }
}

testScamSniff();
