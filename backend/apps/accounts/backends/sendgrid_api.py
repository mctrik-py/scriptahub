import requests
from django.core.mail.backends.base import BaseEmailBackend
from django.conf import settings

class SendGridAPIBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        sent_count = 0
        for message in email_messages:
            try:
                data = {
                    "personalizations": [{"to": [{"email": recipient} for recipient in message.to]}],
                    "from": {"email": settings.DEFAULT_FROM_EMAIL},
                    "subject": message.subject,
                    "content": [{"type": "text/plain", "value": message.body}]
                }
                
                response = requests.post(
                    "https://api.sendgrid.com/v3/mail/send",  # <--- Correct URL
                    headers={
                        "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json=data,
                    timeout=15
                )
                
                if response.status_code in [200, 201, 202]:
                    sent_count += 1
                    print(f"✅ Email sent to {message.to}")
                else:
                    print(f"❌ SendGrid Error ({response.status_code}): {response.text}")
            except Exception as e:
                print(f"❌ Exception: {e}")
                if not self.fail_silently:
                    raise
        return sent_count