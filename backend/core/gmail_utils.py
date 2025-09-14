def send_gmail_message(to, subject, body, is_html=False, from_email=None):
    """
    Wrapper for sending Gmail messages, supporting HTML and plain text.
    Args:
        to (str): Recipient email address
        subject (str): Email subject
        body (str): Email body (HTML or plain text)
        is_html (bool): If True, send as HTML
        from_email (str, optional): Sender email address
    Returns:
        dict: API response
    """
    if is_html:
        message = MIMEText(body, 'html')
    else:
        message = MIMEText(body, 'plain')
    message['to'] = to
    message['subject'] = subject
    if from_email:
        message['from'] = from_email
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build('gmail', 'v1', credentials=creds)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    message_body = {'raw': raw}
    try:
        sent_message = service.users().messages().send(userId='me', body=message_body).execute()
        return sent_message
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
import os
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Path to your token.json and client_secret.json
TOKEN_PATH = os.path.join(os.path.dirname(__file__), 'token.json')
CLIENT_SECRET_PATH = os.path.join(os.path.dirname(__file__), 'client_secret_1011117020190-g3nog0sf0093lfrh745g1gu8f94bvr3b.apps.googleusercontent.com.json')

# Write token.json from env variable if missing, with logging
if not os.path.exists(TOKEN_PATH):
    token_content = os.environ.get("GMAIL_TOKEN_JSON")
    if token_content:
        with open(TOKEN_PATH, "w") as f:
            f.write(token_content)
        print(f"[GMAIL] token.json created from environment variable.")
    else:
        print(f"[GMAIL] GMAIL_TOKEN_JSON environment variable is missing!")
else:
    print(f"[GMAIL] token.json found at {TOKEN_PATH}.")

# Write client_secret.json from env variable if missing, with logging
if not os.path.exists(CLIENT_SECRET_PATH):
    secret_content = os.environ.get("GMAIL_CLIENT_SECRET_JSON")
    if secret_content:
        with open(CLIENT_SECRET_PATH, "w") as f:
            f.write(secret_content)
        print(f"[GMAIL] client_secret.json created from environment variable.")
    else:
        print(f"[GMAIL] GMAIL_CLIENT_SECRET_JSON environment variable is missing!")
else:
    print(f"[GMAIL] client_secret.json found at {CLIENT_SECRET_PATH}.")

SCOPES = ['https://www.googleapis.com/auth/gmail.send']


def send_gmail_api_email(to, subject, body, from_email=None):
    """
    Send an email using Gmail API.
    Args:
        to (str): Recipient email address
        subject (str): Email subject
        body (str): Email body (plain text)
        from_email (str, optional): Sender email address. If None, uses authenticated user.
    Returns:
        dict: API response
    """
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build('gmail', 'v1', credentials=creds)

    message = MIMEText(body)
    message['to'] = to
    message['subject'] = subject
    if from_email:
        message['from'] = from_email

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    message_body = {'raw': raw}

    try:
        sent_message = service.users().messages().send(userId='me', body=message_body).execute()
        return sent_message
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
