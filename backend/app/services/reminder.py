"""AR Invoice Reminder Service — 연체 인보이스 자동 이메일 리마인더"""
import smtplib
import logging
from datetime import datetime, timezone, date, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.invoice import CustomerInvoice
from app.models.setting import Setting

logger = logging.getLogger("freight_broker.reminder")
settings = get_settings()


def _get_setting(db: Session, key: str, default: str = "") -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    return (row.value or "").strip() if row else default


def _send_reminder_email(to_email: str, invoice: CustomerInvoice, company_name: str) -> bool:
    if not settings.smtp_host or not settings.from_email:
        logger.warning("SMTP not configured — skipping reminder for %s", invoice.invoice_number)
        return False
    try:
        customer_name = invoice.customer.name if invoice.customer else "Valued Customer"
        load_number = invoice.load.load_number if invoice.load else "-"
        days_overdue = (date.today() - invoice.due_date).days if invoice.due_date else 0

        html = f"""
<html><body style="font-family: sans-serif; max-width: 600px; margin: 20px;">
  <h2 style="color: #dc2626;">Payment Reminder — Invoice {invoice.invoice_number}</h2>
  <p>Dear {customer_name},</p>
  <p>This is a friendly reminder that the following invoice is <strong>{days_overdue} day(s) overdue</strong>.</p>
  <table border="1" cellpadding="8" style="border-collapse:collapse; width:100%;">
    <tr style="background:#f3f4f6;"><th>Invoice #</th><th>Load #</th><th>Amount</th><th>Due Date</th></tr>
    <tr>
      <td>{invoice.invoice_number}</td>
      <td>{load_number}</td>
      <td>${float(invoice.amount):,.2f} CAD</td>
      <td>{invoice.due_date}</td>
    </tr>
  </table>
  <p>Please arrange payment at your earliest convenience.</p>
  <p>If you have any questions, please contact us.</p>
  <br/>
  <p>Best regards,<br/><strong>{company_name or 'FreightBroker Pro'}</strong></p>
</body></html>
"""
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Payment Reminder: Invoice {invoice.invoice_number} ({days_overdue} days overdue)"
        msg["From"] = settings.from_email
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.from_email, [to_email], msg.as_string())

        logger.info("Reminder sent for invoice %s to %s", invoice.invoice_number, to_email)
        return True
    except Exception as e:
        logger.error("Failed to send reminder for %s: %s", invoice.invoice_number, e)
        return False


def run_reminder_job() -> dict:
    """
    연체 인보이스 리마인더 실행.
    Settings에서 ar_reminder_days(초기 발송 기준일)와
    ar_reminder_repeat_days(반복 발송 간격)를 읽어 동작.
    """
    db: Session = SessionLocal()
    sent = 0
    skipped = 0
    try:
        reminder_days = int(_get_setting(db, "ar_reminder_days", "0") or "0")
        repeat_days = int(_get_setting(db, "ar_reminder_repeat_days", "0") or "0")
        company_name = _get_setting(db, "company_name", "")

        if reminder_days <= 0:
            logger.info("AR reminder disabled (ar_reminder_days=0)")
            return {"sent": 0, "skipped": 0, "reason": "disabled"}

        today = date.today()
        threshold = today - timedelta(days=reminder_days)

        overdue = (
            db.query(CustomerInvoice)
            .options(joinedload(CustomerInvoice.customer), joinedload(CustomerInvoice.load))
            .filter(
                CustomerInvoice.status.in_(["draft", "sent"]),
                CustomerInvoice.due_date != None,
                CustomerInvoice.due_date < today,
                CustomerInvoice.due_date <= threshold,
            )
            .all()
        )

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        for inv in overdue:
            # 반복 발송 간격 체크
            if inv.last_reminder_sent_at and repeat_days > 0:
                next_due = inv.last_reminder_sent_at + timedelta(days=repeat_days)
                if now < next_due:
                    skipped += 1
                    continue

            # 수신 이메일: 고객 contact_email
            to_email = None
            if inv.customer and inv.customer.contact_email:
                to_email = inv.customer.contact_email.strip()

            if not to_email:
                skipped += 1
                continue

            ok = _send_reminder_email(to_email, inv, company_name)
            if ok:
                inv.last_reminder_sent_at = now
                inv.reminder_sent_count = (inv.reminder_sent_count or 0) + 1
                sent += 1
            else:
                skipped += 1

        db.commit()
        logger.info("Reminder job done: sent=%d, skipped=%d", sent, skipped)
        return {"sent": sent, "skipped": skipped}
    except Exception as e:
        logger.error("Reminder job error: %s", e)
        db.rollback()
        return {"sent": 0, "skipped": 0, "error": str(e)}
    finally:
        db.close()
