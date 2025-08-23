const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function sendSlackNotification(text: string) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL is not set');
    return;
  }
  try {
    console.log("Sending Slack notification:", text);
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error('Failed to send Slack notification:', await res.text());
    }
  } catch (err) {
    console.error('Error sending Slack notification:', err);
  }
} 