require('dotenv').config({ path: '.env' });
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Sending test email to meedex42@gmail.com...');
  const { data, error } = await resend.emails.send({
    from: 'AgentBazaar <onboarding@resend.dev>',
    to: ['meedex42@gmail.com'],
    subject: 'AgentBazaar Test Email',
    text: 'If you receive this, the email service is working.',
  });

  if (error) {
    console.error('Email failed:', error);
  } else {
    console.log('Email sent successfully:', data);
  }
}

testEmail();
