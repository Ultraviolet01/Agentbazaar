import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '8KacZje6wdR9Ow7cL4cgpRc5DlyKjmUioiuThaD74ZI');
const userId = 'cm9f7n4m100001ff56323149c';

async function generateToken() {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret);
}

async function runTests() {
  const token = await generateToken();
  console.log('🎫 Generated Test Token');

  // Trigger credit top-up via API
  console.log('🔄 Triggering Credit Top-up...');
  try {
    await fetch('http://127.0.0.1:3006/credits/balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (e) {
    console.log('Credit top-up trigger failed, continuing anyway...');
  }

  // 1. Test ThreadSmith
  console.log('\n🧵 Testing ThreadSmith...');
  const threadResponse = await fetch('http://127.0.0.1:3010/api/agents/threadsmith/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${token}`
    },
    body: JSON.stringify({
      input: "AgentBazaar is scaling to 0G Mainnet with native AI integration.",
      contentType: "tweet",
      tone: "professional",
      quality: "standard"
    })
  });

  const threadData = await threadResponse.json();
  console.log('ThreadSmith Status:', threadResponse.status);
  console.log('ThreadSmith Result:', JSON.stringify(threadData, null, 2));

  // 2. Test LaunchWatch
  console.log('\n📡 Testing LaunchWatch Setup...');
  const lwResponse = await fetch('http://127.0.0.1:3010/api/agents/launchwatch/setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `accessToken=${token}`
    },
    body: JSON.stringify({
      monitoringType: 'project',
      notificationEmail: 'test@agentbazaar.ai',
      projectUrl: 'https://0g.ai',
      monitorSocial: true,
      monitorWebsite: true,
      checkFrequency: 'HOURLY'
    })
  });

  const lwData = await lwResponse.json();
  console.log('LaunchWatch Status:', lwResponse.status);
  console.log('LaunchWatch Result:', JSON.stringify(lwData, null, 2));
}

runTests().catch(console.error);
