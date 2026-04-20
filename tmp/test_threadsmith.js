async function testThreadSmith() {
  const payload = {
    input: "AgentBazaar is the premier marketplace for AI security and automation. We are launching on 0G Mainnet soon with ScamSniff and LaunchWatch agents.",
    contentType: "thread",
    tone: "urgent",
    quality: "standard"
  };

  console.log('Sending request to ThreadSmith...');
  try {
    const response = await fetch('http://localhost:3010/api/agents/threadsmith/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ ThreadSmith is WORKING with AI models!');
      console.log('Used Model:', data.model);
      console.log('Content Preview:', data.content.substring(0, 100) + '...');
    } else {
      console.log('\n❌ ThreadSmith failed:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Connection Failed:', error.message);
    console.log('Make sure the server is running on port 3010.');
  }
}

testThreadSmith();
