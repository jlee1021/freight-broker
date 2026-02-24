"""
모의 운영용 테스트 데이터 시드.

Ubuntu 서버에서 실행 예 (가상환경 필수):
  cd ~/freight-broker/backend
  source .venv/bin/activate
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/freight_broker"
  export PYTHONPATH=.
  python scripts/seed_test_data.py

자세한 절차: backend/scripts/README.md
"""
import sys
from pathlib import Path
from datetime import date, datetime, time, timedelta

# backend/app 를 import 하기 위해
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.partner import Partner
from app.models.load import (
    Load,
    ShipperStop,
    ConsigneeStop,
    CarrierSegment,
)
from app.models.invoice import CustomerInvoice, CarrierPayable

TEST_PASSWORD = "test1234"


def seed():
    db = SessionLocal()
    try:
        # 1) 테스트 사용자 (없을 때만 생성)
        for email, full_name, role in [
            ("admin@test.com", "테스트 관리자", "admin"),
            ("dispatcher@test.com", "테스트 디스패처", "dispatcher"),
        ]:
            if db.query(User).filter(User.email == email).first():
                print(f"User already exists: {email}")
                continue
            db.add(User(
                email=email,
                hashed_password=hash_password(TEST_PASSWORD),
                full_name=full_name,
                role=role,
            ))
        db.commit()
        print("Users: admin@test.com / dispatcher@test.com (password: test1234)")

        # 2) 파트너 (고객 2, 캐리어 2)
        customers = []
        carriers = []
        for name, ptype in [
            ("테스트 고객 A", "customer"),
            ("테스트 고객 B", "customer"),
            ("테스트 캐리어 X", "carrier"),
            ("테스트 캐리어 Y", "carrier"),
        ]:
            existing = db.query(Partner).filter(Partner.name == name).first()
            if existing:
                (customers if ptype == "customer" else carriers).append(existing)
                continue
            p = Partner(
                name=name,
                type=ptype,
                contact_email=f"{name.replace(' ', '').lower()}@example.com",
                address="123 Test St",
                city="Calgary",
                province="AB",
                country="CANADA",
                postal_code="T2P 0A1",
            )
            db.add(p)
            db.flush()
            (customers if ptype == "customer" else carriers).append(p)
        db.commit()
        if not customers:
            customers = list(db.query(Partner).filter(Partner.type == "customer").limit(2))
        if not carriers:
            carriers = list(db.query(Partner).filter(Partner.type == "carrier").limit(2))
        print("Partners: 2 customers, 2 carriers")

        # 3) 로드 2~3개 (shipper, consignee, carrier segment)
        admin_user = db.query(User).filter(User.email == "admin@test.com").first()
        dispatcher_user = db.query(User).filter(User.email == "dispatcher@test.com").first()
        loads_created = []
        for i, load_num in enumerate(["MOCK-1001", "MOCK-1002", "MOCK-1003"]):
            if db.query(Load).filter(Load.load_number == load_num).first():
                continue
            cust = customers[i % len(customers)]
            carrier = carriers[i % len(carriers)]
            load = Load(
                load_number=load_num,
                status="assigned" if i < 2 else "in_transit",
                customer_id=cust.id,
                dispatcher_id=dispatcher_user.id if dispatcher_user else admin_user.id,
                rate=2500.00 + i * 200,
                fsc_percent=10,
                tax_code="GST",
                equipment_type="Dry Van",
                weight=44000,
                weight_unit="lbs",
                commodity="General freight",
                revenue=2750.00 + i * 220,
                cost=2200.00 + i * 180,
                created_at=date.today() - timedelta(days=5 - i),
            )
            db.add(load)
            db.flush()

            db.add(ShipperStop(
                load_id=load.id,
                sequence=1,
                name="Shipper Co " + load_num,
                address="500 Pickup Ave",
                city="Edmonton",
                province="AB",
                country="CANADA",
                postal_code="T5J 0K1",
                pickup_date=date.today() - timedelta(days=4 - i),
                time_start=time(8, 0),
                time_end=time(17, 0),
            ))
            db.add(ConsigneeStop(
                load_id=load.id,
                sequence=1,
                name="Consignee Co " + load_num,
                address="700 Delivery Rd",
                city="Vancouver",
                province="BC",
                country="CANADA",
                postal_code="V6B 1A1",
                due_date=date.today() - timedelta(days=3 - i),
            ))
            seg = CarrierSegment(
                load_id=load.id,
                carrier_id=carrier.id,
                rate=2200.00 + i * 180,
                total=2420.00 + i * 198,
                load_status=load.status,
            )
            db.add(seg)
            db.flush()
            load.cost = float(seg.total or 0)
            load.revenue = float(load.revenue or 0)
            load.total_with_gst = round(load.revenue * 1.05, 2)
            load.gst = round(load.revenue * 0.05, 2)
            loads_created.append((load, seg))
        db.commit()
        print("Loads: MOCK-1001, MOCK-1002, MOCK-1003 (with shipper/consignee/carrier)")

        # 4) 고객 인보이스·캐리어 페이어블 (로드당 1개씩, 최대 2개 로드)
        from sqlalchemy.orm import joinedload
        loads_for_inv = db.query(Load).options(
            joinedload(Load.carrier_segments),
            joinedload(Load.customer),
        ).filter(Load.load_number.in_(["MOCK-1001", "MOCK-1002", "MOCK-1003"])).limit(2).all()
        for load in loads_for_inv:
            if db.query(CustomerInvoice).filter(CustomerInvoice.load_id == load.id).first():
                continue
            db.add(CustomerInvoice(
                load_id=load.id,
                customer_id=load.customer_id,
                invoice_number=f"INV-{load.load_number}",
                amount=float(load.revenue or 0),
                status="sent" if load.load_number == "MOCK-1001" else "draft",
                due_date=date.today() + timedelta(days=30),
            ))
            for seg in (load.carrier_segments or [])[:1]:
                if db.query(CarrierPayable).filter(CarrierPayable.carrier_segment_id == seg.id).first():
                    continue
                db.add(CarrierPayable(
                    carrier_segment_id=seg.id,
                    amount=float(seg.total or 0),
                    invoice_number=f"PAY-{load.load_number}",
                    status="draft",
                ))
        db.commit()
        print("Invoices: customer + carrier payables for test loads")

        print("Seed done. Use admin@test.com / test1234 or dispatcher@test.com / test1234 for mock run.")
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
