// Using Resend 
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject,
      html
    });

    if (error) {
      throw error;
    }

    console.log('Email sent:', data);
    return data;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
