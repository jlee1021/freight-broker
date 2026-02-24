import smtplib
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.config import get_settings
from app.core.database import get_db
from app.models.setting import Setting
from app.models.user import User
from app.schemas.setting import SettingUpdate, SettingResponse

settings = get_settings()

router = APIRouter(prefix="/settings", tags=["settings"])

DEFAULT_KEYS = ["tax_code_default", "default_fsc_percent", "company_name", "company_address", "company_mc", "company_dot", "default_equipment_types", "company_logo_url"]
DEFAULTS = {
    "tax_code_default": "GST",
    "default_fsc_percent": "0",
    "company_name": "",
    "company_address": "",
    "company_mc": "",
    "company_dot": "",
    "default_equipment_types": "Dry Van,Reefer,Flatbed,Step Deck",
    "company_logo_url": "",
}


def _get_value(db: Session, key: str) -> str:
    row = db.query(Setting).filter(Setting.key == key).first()
    if row and row.value is not None:
        return row.value
    return DEFAULTS.get(key, "")


@router.get("", response_model=SettingResponse)
def get_settings(db: Session = Depends(get_db)):
    return SettingResponse(
        tax_code_default=_get_value(db, "tax_code_default"),
        default_fsc_percent=_get_value(db, "default_fsc_percent"),
        company_name=_get_value(db, "company_name"),
        company_address=_get_value(db, "company_address"),
        company_mc=_get_value(db, "company_mc"),
        company_dot=_get_value(db, "company_dot"),
        default_equipment_types=_get_value(db, "default_equipment_types"),
        company_logo_url=_get_value(db, "company_logo_url"),
    )


@router.put("", response_model=SettingResponse)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        if key not in DEFAULT_KEYS:
            continue
        row = db.query(Setting).filter(Setting.key == key).first()
        str_val = str(value) if value is not None else ""
        if row:
            row.value = str_val
        else:
            db.add(Setting(key=key, value=str_val))
    db.commit()
    return get_settings(db)


class TestEmailBody(BaseModel):
    to_email: str


@router.post("/test-email")
def test_email(payload: TestEmailBody, _user: User = Depends(require_roles(["admin"]))):
    """Send a test email to verify SMTP configuration."""
    if not payload.to_email or "@" not in payload.to_email:
        return {"sent": False, "message": "Valid to_email required"}
    if not settings.smtp_host or not settings.from_email:
        return {"sent": False, "message": "SMTP not configured. Set SMTP_HOST, FROM_EMAIL in .env"}
    try:
        msg = MIMEText("This is a test email from Freight Broker. SMTP is working.", "plain", "utf-8")
        msg["Subject"] = "Freight Broker – Test Email"
        msg["From"] = settings.from_email
        msg["To"] = payload.to_email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.from_email, [payload.to_email], msg.as_string())
        return {"sent": True, "message": "Test email sent"}
    except Exception as e:
        return {"sent": False, "message": str(e)}
