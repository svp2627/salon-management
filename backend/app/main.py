from datetime import datetime
from decimal import Decimal

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr

from app.database import engine, get_db
from app.models.customer import Customer
from app.models.appointment import Appointment
from app.models.service import Service
from app.models.staff import Staff


app = FastAPI(
    title="Salon Management API",
    description="Backend API for ENACT Salon Management",
    version="1.2.0",
)


# Frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================
# REQUEST SCHEMAS
# ==============================

class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    phone_number: str = Field(min_length=5, max_length=20)
    email: EmailStr | None = None


class AppointmentCreate(BaseModel):
    customer_id: int
    service: str = Field(min_length=2, max_length=100)
    staff_name: str = Field(min_length=2, max_length=100)
    appointment_date: datetime
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(min_length=3, max_length=30)


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    price: Decimal = Field(gt=0)
    duration_minutes: int = Field(gt=0)


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0)
    duration_minutes: int | None = Field(default=None, gt=0)
    is_active: bool | None = None


# ==============================
# HOME AND HEALTH
# ==============================

@app.get("/")
def home():
    return {
        "message": "Salon Management API is running!",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Salon Management API",
    }


@app.get("/health/database")
def database_health():
    try:
        with engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT DB_NAME()")
            ).scalar_one()

        return {
            "status": "connected",
            "database": database_name,
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed.",
        )


# ==============================
# CUSTOMER APIs
# ==============================

@app.get("/api/customers")
def get_customers(db: Session = Depends(get_db)):
    customers = (
        db.query(Customer)
        .filter(Customer.is_active == True)
        .order_by(Customer.id.desc())
        .all()
    )

    return [
        {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone_number": customer.phone_number,
            "is_active": customer.is_active,
        }
        for customer in customers
    ]


@app.get("/api/customers/count")
def get_customer_count(db: Session = Depends(get_db)):
    count = (
        db.query(Customer)
        .filter(Customer.is_active == True)
        .count()
    )

    return {"total_customers": count}


@app.get("/api/customers/{customer_id}")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(
        Customer.id == customer_id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return {
        "id": customer.id,
        "full_name": customer.full_name,
        "email": customer.email,
        "phone_number": customer.phone_number,
        "is_active": customer.is_active,
    }


@app.post("/api/customers")
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
):
    existing_phone = db.query(Customer).filter(
        Customer.phone_number == customer_data.phone_number
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=409,
            detail="Phone number already registered",
        )

    if customer_data.email:
        existing_email = db.query(Customer).filter(
            Customer.email == customer_data.email
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=409,
                detail="Email already registered",
            )

    customer = Customer(
        full_name=customer_data.full_name,
        phone_number=customer_data.phone_number,
        email=customer_data.email,
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return {
        "message": "Customer created successfully",
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "phone_number": customer.phone_number,
            "email": customer.email,
        },
    }


# ==============================
# APPOINTMENT APIs
# ==============================

@app.post("/api/appointments")
def create_appointment(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(
        Customer.id == appointment_data.customer_id,
        Customer.is_active == True,
    ).first()

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found or inactive",
        )

    appointment = Appointment(
        customer_id=appointment_data.customer_id,
        service=appointment_data.service,
        staff_name=appointment_data.staff_name,
        appointment_date=appointment_data.appointment_date,
        notes=appointment_data.notes,
    )

    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment created successfully",
        "appointment": {
            "id": appointment.id,
            "customer_id": appointment.customer_id,
            "customer_name": customer.full_name,
            "service": appointment.service,
            "staff_name": appointment.staff_name,
            "appointment_date": appointment.appointment_date,
            "status": appointment.status,
            "notes": appointment.notes,
        },
    }


@app.get("/api/appointments")
def get_appointments(db: Session = Depends(get_db)):
    appointments = (
        db.query(Appointment)
        .order_by(Appointment.id.desc())
        .all()
    )

    return [
        {
            "id": appointment.id,
            "customer_id": appointment.customer_id,
            "customer_name": appointment.customer.full_name,
            "service": appointment.service,
            "staff_name": appointment.staff_name,
            "appointment_date": appointment.appointment_date,
            "status": appointment.status,
            "notes": appointment.notes,
        }
        for appointment in appointments
    ]


@app.get("/api/appointments/{appointment_id}")
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    return {
        "id": appointment.id,
        "customer_id": appointment.customer_id,
        "customer_name": appointment.customer.full_name,
        "service": appointment.service,
        "staff_name": appointment.staff_name,
        "appointment_date": appointment.appointment_date,
        "status": appointment.status,
        "notes": appointment.notes,
    }


@app.patch("/api/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
):
    allowed_statuses = [
        "Scheduled",
        "Completed",
        "Cancelled",
        "No Show",
    ]

    if status_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid appointment status",
        )

    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    appointment.status = status_data.status
    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment status updated successfully",
        "id": appointment.id,
        "status": appointment.status,
    }


@app.delete("/api/appointments/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found",
        )

    db.delete(appointment)
    db.commit()

    return {
        "message": "Appointment deleted successfully",
        "id": appointment_id,
    }


# ==============================
# SERVICE APIs
# ==============================

def service_response(service):
    return {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "price": service.price,
        "duration_minutes": service.duration_minutes,
        "is_active": service.is_active,
    }


# Get all services
@app.get("/api/services")
def get_services(db: Session = Depends(get_db)):
    services = (
        db.query(Service)
        .order_by(Service.id.desc())
        .all()
    )

    return [
        service_response(service)
        for service in services
    ]


# Add a new service
@app.post("/api/services")
def create_service(
    service_data: ServiceCreate,
    db: Session = Depends(get_db),
):
    existing_service = db.query(Service).filter(
        Service.name == service_data.name
    ).first()

    if existing_service:
        raise HTTPException(
            status_code=409,
            detail="Service name already exists",
        )

    service = Service(
        name=service_data.name,
        description=service_data.description,
        price=service_data.price,
        duration_minutes=service_data.duration_minutes,
    )

    db.add(service)
    db.commit()
    db.refresh(service)

    return {
        "message": "Service created successfully",
        "service": service_response(service),
    }


# Edit an existing service
@app.patch("/api/services/{service_id}")
def update_service(
    service_id: int,
    service_data: ServiceUpdate,
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    update_data = service_data.model_dump(exclude_unset=True)

    for field in ["name", "price", "duration_minutes", "is_active"]:
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=400,
                detail=f"{field} cannot be empty",
            )

    if "name" in update_data:
        existing_service = db.query(Service).filter(
            Service.name == update_data["name"],
            Service.id != service_id,
        ).first()

        if existing_service:
            raise HTTPException(
                status_code=409,
                detail="Another service already uses this name",
            )

    for field, value in update_data.items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)

    return {
        "message": "Service updated successfully",
        "service": service_response(service),
    }


# Delete a service
@app.delete("/api/services/{service_id}")
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found",
        )

    db.delete(service)
    db.commit()

    return {
        "message": "Service deleted successfully",
        "id": service_id,
    }
    # STAFF MANAGEMENT APIs

from pydantic import BaseModel, Field
from decimal import Decimal


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str | None = None
    phone_number: str | None = None
    role: str = "Stylist"
    salary: Decimal | None = Field(default=None, gt=0)


class StaffUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    email: str | None = None
    phone_number: str | None = None
    role: str | None = None
    salary: Decimal | None = Field(default=None, gt=0)
    is_active: bool | None = None


def staff_response(staff):
    return {
        "id": staff.id,
        "full_name": staff.full_name,
        "email": staff.email,
        "phone_number": staff.phone_number,
        "role": staff.role,
        "salary": staff.salary,
        "is_active": staff.is_active,
    }


@app.get("/api/staff")
def get_staff(db: Session = Depends(get_db)):
    staff_members = db.query(Staff).order_by(Staff.id.desc()).all()
    return [staff_response(member) for member in staff_members]


@app.post("/api/staff")
def create_staff(data: StaffCreate, db: Session = Depends(get_db)):
    if data.email and db.query(Staff).filter(Staff.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    if data.phone_number and db.query(Staff).filter(
        Staff.phone_number == data.phone_number
    ).first():
        raise HTTPException(status_code=400, detail="Phone number already exists")

    member = Staff(**data.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "message": "Staff created successfully",
        "staff": staff_response(member)
    }


@app.patch("/api/staff/{staff_id}")
def update_staff(staff_id: int, data: StaffUpdate, db: Session = Depends(get_db)):
    member = db.query(Staff).filter(Staff.id == staff_id).first()

    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if value is None and field in ("full_name", "role"):
            raise HTTPException(status_code=400, detail=f"{field} cannot be empty")

    if updates.get("email") and db.query(Staff).filter(
        Staff.email == updates["email"], Staff.id != staff_id
    ).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    if updates.get("phone_number") and db.query(Staff).filter(
        Staff.phone_number == updates["phone_number"], Staff.id != staff_id
    ).first():
        raise HTTPException(status_code=400, detail="Phone number already exists")

    for field, value in updates.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)

    return {
        "message": "Staff updated successfully",
        "staff": staff_response(member)
    }


@app.delete("/api/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    member = db.query(Staff).filter(Staff.id == staff_id).first()

    if not member:
        raise HTTPException(status_code=404, detail="Staff not found")

    db.delete(member)
    db.commit()

    return {"message": "Staff deleted successfully"}