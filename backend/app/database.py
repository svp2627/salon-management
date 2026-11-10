
import os

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load environment variables
load_dotenv()


# SQLAlchemy Base class
class Base(DeclarativeBase):
    pass


# SQL Server connection configuration
connection_url = URL.create(
    "mssql+pyodbc",
    username=os.getenv("DB_USERNAME"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_SERVER"),
    port=int(os.getenv("DB_PORT", "1433")),
    database=os.getenv("DB_NAME"),
    query={
        "driver": os.getenv("DB_DRIVER"),
        "Encrypt": "yes",
        "TrustServerCertificate": "yes",
    },
)


# Create database engine
engine = create_engine(
    connection_url,
    pool_pre_ping=True,
)


# Database session configuration
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
