import os
from typing import List, Optional, Dict, Any
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from pydantic import EmailStr
from jinja2 import Environment, select_autoescape, FileSystemLoader
import logging
from pathlib import Path

# Logger einrichten
logger = logging.getLogger(__name__)

class EmailService:
    """
    Service-Klasse für den Versand von E-Mails
    """
    
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "localhost")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
        self.smtp_use_ssl = os.getenv("SMTP_USE_SSL", "False").lower() == "true"
        self.from_email = os.getenv("FROM_EMAIL", "noreply@example.com")
        self.from_name = os.getenv("FROM_NAME", "AI Bot Dashboard")
        
        # Jinja2-Umgebung einrichten
        template_dir = Path(__file__).parent.parent / "templates" / "emails"
        template_dir.mkdir(parents=True, exist_ok=True)
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
    def send_email(
        self,
        to_emails: List[EmailStr],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc: Optional[List[EmailStr]] = None,
        bcc: Optional[List[EmailStr]] = None,
        reply_to: Optional[EmailStr] = None
    ) -> bool:
        """
        Sendet eine E-Mail an die angegebenen Empfänger
        """
        if not text_content:
            # Einfachen Text aus HTML extrahieren
            text_content = html_content.replace('<br>', '\n').replace('</p>', '\n').replace('</div>', '\n')
            for tag in ['<.*?>']:
                text_content = text_content.replace(tag, '')
        
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = f"{self.from_name} <{self.from_email}>"
        message['To'] = ', '.join(to_emails)
        
        if cc:
            message['Cc'] = ', '.join(cc)
        if reply_to:
            message['Reply-To'] = reply_to
            
        # Text- und HTML-Teile hinzufügen
        part1 = MIMEText(text_content, 'plain')
        part2 = MIMEText(html_content, 'html')
        message.attach(part1)
        message.attach(part2)
        
        # Alle Empfänger sammeln
        all_recipients = to_emails.copy()
        if cc:
            all_recipients.extend(cc)
        if bcc:
            all_recipients.extend(bcc)
            
        try:
            # E-Mail-Server verbinden und E-Mail senden
            if self.smtp_use_ssl:
                server = smtplib.SMTP_SSL(self.smtp_server, self.smtp_port)
            else:
                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                
            if self.smtp_use_tls:
                server.starttls()
                
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
                
            server.sendmail(self.from_email, all_recipients, message.as_string())
            server.quit()
            
            logger.info(f"E-Mail erfolgreich gesendet an: {', '.join(to_emails)}")
            return True
        
        except Exception as e:
            logger.error(f"Fehler beim Senden der E-Mail: {str(e)}")
            return False

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Rendert eine E-Mail-Vorlage mit Jinja2
        """
        try:
            template = self.env.get_template(f"{template_name}.html")
            return template.render(**context)
        except Exception as e:
            logger.error(f"Fehler beim Rendern der E-Mail-Vorlage {template_name}: {str(e)}")
            # Fallback-Template
            return f"""
            <html>
                <body>
                    <h1>{context.get('title', 'Mitteilung')}</h1>
                    <p>{context.get('message', 'Keine Nachricht verfügbar.')}</p>
                </body>
            </html>
            """

    def send_password_reset_email(
        self, 
        email: EmailStr,
        reset_token: str,
        name: str
    ) -> bool:
        """
        Sendet eine E-Mail mit einem Link zum Zurücksetzen des Passworts
        """
        context = {
            'reset_token': reset_token,
            'name': name,
            'reset_url': f"https://example.com/reset-password?token={reset_token}"
        }
        
        try:
            html_content = self.render_template('password_reset.html', context)
            return self.send_email(
                to_emails=[email],
                subject="Zurücksetzen Ihres Passworts",
                html_content=html_content
            )
        except Exception as e:
            logger.error(f"Fehler beim Generieren der Passwort-Reset-E-Mail: {str(e)}")
            return False
    
    def send_welcome_email(
        self,
        email: EmailStr,
        name: str,
        password: Optional[str] = None
    ) -> bool:
        """
        Sendet eine Willkommens-E-Mail an einen neu erstellten Benutzer
        """
        context = {
            'name': name,
            'password': password,
            'login_url': 'https://example.com/login'
        }
        
        try:
            html_content = self.render_template('welcome.html', context)
            return self.send_email(
                to_emails=[email],
                subject="Willkommen beim KI-Bot-System",
                html_content=html_content
            )
        except Exception as e:
            logger.error(f"Fehler beim Generieren der Willkommens-E-Mail: {str(e)}")
            return False

# Singleton-Instanz erstellen
email_service = EmailService() 