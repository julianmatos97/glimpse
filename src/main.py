from typing import Generator, List, Optional
from fastapi import FastAPI, Depends, UploadFile, Query, HTTPException, status as status_codes
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker, Session
import os
import logging
import pandas
from .models import Interest, Lead, Source, Status, SalesPerson
from pydantic import BaseModel, Field, EmailStr
import io
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.critical("DATABASE_URL environment variable not set")
    raise RuntimeError("DATABASE_URL environment variable not set.")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "glimpse-key-for-jwt-tokens")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

logger.info(f"Initializing application with ACCESS_TOKEN_EXPIRE_MINUTES={ACCESS_TOKEN_EXPIRE_MINUTES}")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

logger.info("Connecting to database")
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(
    title="Lead Management API",
    description="API for managing leads and salespersons.",
    version="0.1.0",
)
logger.info("FastAPI application initialized")

# Request/Response Schemas
class LeadBase(BaseModel):
    name: str
    contact_information: str
    source: Source
    interest: Interest
    status: Status
    assigned_salesperson_name: str

class LeadRead(LeadBase):
    id: int

    class Config:
        orm_mode = True 

class LoadResult(BaseModel):
    filename: str
    rows_processed: int
    rows_imported: int
    rows_updated: int
    duplicates_found: int
    errors: List[str] = Field(default_factory=list)

# Authentication schemas
class UserBase(BaseModel):
    email: EmailStr


class UserInDB(UserBase):
    hashed_password: str
    

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    logger.debug("Database session created")
    try:
        yield db
    finally:
        db.close()
        logger.debug("Database session closed")

# Password utility functions
def verify_password(plain_password, hashed_password):
    logger.debug("Verifying password")
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    logger.debug("Hashing password")
    return pwd_context.hash(password)

# Token utility functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    logger.debug(f"Creating access token for {data.get('sub', 'unknown user')}")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    logger.debug("Verifying JWT token")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Token missing 'sub' claim")
            return None
        logger.debug(f"Token verified for user: {email}")
        return {"email": email, "exp": payload.get("exp")}
    except jwt.JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        return None

# User authentication functions
def get_user(email: str) -> Optional[UserInDB]:
    logger.debug(f"Looking up user: {email}")
    if email == "admin@example.com":
        logger.debug(f"User found: {email}")
        return UserInDB(
            email=email,
            hashed_password=get_password_hash("password")
        )
    logger.debug(f"User not found: {email}")
    return None

def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    logger.info(f"Authentication attempt for user: {email}")
    user = get_user(email)
    if not user:
        logger.warning(f"Authentication failed: user not found - {email}")
        return None
    if not verify_password(password, user.hashed_password):
        logger.warning(f"Authentication failed: invalid password for {email}")
        return None
    logger.info(f"Authentication successful for {email}")
    return user

# JWT token validation
async def get_current_user(token: str = Depends(oauth2_scheme)):
    logger.debug("Getting current user from token")
    credentials_exception = HTTPException(
        status_code=status_codes.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        logger.warning("Token verification failed")
        raise credentials_exception
    
    email: str = payload.get("email")
    if email is None:
        logger.warning("Email not found in token payload")
        raise credentials_exception
    
    user = get_user(email)
    if user is None:
        logger.warning(f"User not found: {email}")
        raise credentials_exception
    
    logger.debug(f"User authenticated: {email}")
    return user



@app.get("/leads", response_model=tuple[List[LeadRead], int])
def get_leads(
    source: Optional[Source] = Query(None, description="Filter by lead source"),
    interest: Optional[Interest] = Query(None, description="Filter by interest level"),
    status: Optional[Status] = Query(None, description="Filter by lead status"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=100, description="Limit for pagination"),
    db: Session = Depends(get_db),
):
    """
    Retrieve a list of leads with optional filtering and pagination.
    """
    logger.info(f"Fetching leads with filters: source={source}, interest={interest}, status={status}, offset={offset}, limit={limit}")
    # Build the base query with filters
    query = select(Lead)
    filters = []
    
    if source:
        filters.append(Lead.source == source)
    if interest:
        filters.append(Lead.interest == interest)
    if status:
        filters.append(Lead.status == status)
    
    # Apply all filters to both queries
    if filters:
        query = query.where(*filters)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Create count query with the same filters
    count_query = select(func.count()).select_from(Lead)
    if filters:
        count_query = count_query.where(*filters)
    
    # Get total count
    total_leads = db.execute(count_query).scalar()
    logger.info(f"Total leads matching filters: {total_leads}")
    try:
        result = db.execute(query)
        leads = result.scalars().all()
        logger.info(f"Successfully retrieved {len(leads)} leads")
        return leads, total_leads
    except Exception as e:
        logger.error(f"Error fetching leads: {e}", exc_info=True)
        raise HTTPException(
            status_code=status_codes.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not fetch leads from the database."
        )

@app.post("/load_file", response_model=LoadResult)
async def load_data_file(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Load lead data from an uploaded CSV file.
    Expects columns: 'Lead ID', 'Lead Name', 'Contact Information', 'Source', 'Interest Level', 'Status', 'Assigned Salesperson'
    """
    logger.info(f"Processing file upload: {file.filename} by user: {current_user.email}")
    if not file.filename.endswith(".csv"):
        logger.warning(f"Invalid file type uploaded: {file.filename}")
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    content = await file.read()
    file_stream = io.StringIO(content.decode("utf-8"))

    leads_to_insert = []
    leads_to_update = []
    errors = []
    rows_processed = 0
    duplicates_found = 0

    try:
        logger.debug("Reading CSV file")
        df = pandas.read_csv(file_stream, dtype=str).fillna('') 
        rows_processed = len(df)
        logger.info(f"CSV file contains {rows_processed} rows")

        required_columns = ['Lead Name', 'Contact Information', 'Source', 'Interest Level', 'Status', 'Assigned Salesperson']
        if not all(col in df.columns for col in required_columns):
            missing = [col for col in required_columns if col not in df.columns]
            logger.error(f"CSV missing required columns: {missing}")
            raise HTTPException(status_code=400, detail=f"Missing required columns in CSV: {', '.join(missing)}")
        
        unique_salespersons = df['Assigned Salesperson'].unique()
        logger.info(f"Found {len(unique_salespersons)} unique salespersons in CSV")
        
        salesperson_map = {}
        
        # Check which salespersons already exist in the database
        for salesperson_name in unique_salespersons:
            if not salesperson_name:
                continue
                
            # Look up existing salesperson
            existing_salesperson = db.query(SalesPerson).filter(SalesPerson.name == salesperson_name).first()
            
            if existing_salesperson:
                salesperson_map[salesperson_name] = existing_salesperson.id
            else:
                # Create new salesperson with a temporary password (should be changed later)
                new_salesperson = SalesPerson(
                    name=salesperson_name,
                    hashed_password="temporary_hash" 
                )
                db.add(new_salesperson)
                db.flush() 
                salesperson_map[salesperson_name] = new_salesperson.id
                logger.info(f"Created new salesperson: {salesperson_name}")

        # Get all existing contact information to check for duplicates
        existing_contacts = {contact[0] for contact in db.query(Lead.contact_information).all()}
        logger.info(f"Found {len(existing_contacts)} existing contacts in database")

        for index, row in df.iterrows():
            try:
                contact_info = row['Contact Information']
                salesperson_name = row['Assigned Salesperson']
                salesperson_id = salesperson_map.get(salesperson_name) if salesperson_name else None
                
                # Map CSV columns to model fields, handling potential errors
                lead_data = {
                    "name": row['Lead Name'],
                    "contact_information": contact_info,
                    "source": Source(row['Source']),    
                    "interest": Interest(row['Interest Level']),  
                    "status": Status(row['Status']),  
                    "assigned_salesperson_name": salesperson_name,
                    "salesperson_id": salesperson_id
                }
                
                if not lead_data["name"] or not lead_data["contact_information"]:
                    error_msg = f"Row {index + 2}: Missing required field (Name or Contact Info)."
                    logger.warning(error_msg)
                    errors.append(error_msg)
                    continue

                # Check if this contact already exists
                if contact_info in existing_contacts:
                    duplicates_found += 1
                    existing_lead = db.query(Lead).filter(Lead.contact_information == contact_info).first()
                    if existing_lead:
                        lead_data["id"] = existing_lead.id  
                        leads_to_update.append(lead_data)
                else:
                    leads_to_insert.append(lead_data)
                    # Add to existing contacts set to track duplicates within the file itself
                    existing_contacts.add(contact_info)

            except ValueError as ve:
                # Handle errors during enum conversion
                error_msg = f"Row {index + 2}: Invalid enum value - {ve}"
                logger.warning(error_msg)
                errors.append(error_msg)
            except Exception as e:
                error_msg = f"Row {index + 2}: Error processing row - {e}"
                logger.warning(error_msg)
                errors.append(error_msg)

    except pandas.errors.EmptyDataError:
        logger.error("CSV file is empty")
        raise HTTPException(status_code=400, detail="CSV file is empty.")
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Error processing CSV file: {e}")
    finally:
        file_stream.close()  # Ensure the stream is closed
        logger.debug("File stream closed")

    rows_imported = 0
    rows_updated = 0

    # Transaction for database operations
    try:
        # Insert new leads
        if leads_to_insert:
            logger.info(f"Attempting to insert {len(leads_to_insert)} new leads into database")
            db.bulk_insert_mappings(Lead, leads_to_insert)
            rows_imported = len(leads_to_insert)
            
        # Update existing leads
        if leads_to_update:
            logger.info(f"Attempting to update {len(leads_to_update)} existing leads")
            for lead_data in leads_to_update:
                lead_id = lead_data.pop("id")  # Remove ID from the update values
                db.query(Lead).filter(Lead.id == lead_id).update(lead_data)
            rows_updated = len(leads_to_update)
            
        db.commit()
        logger.info(f"Successfully processed {rows_imported} new leads and updated {rows_updated} existing leads")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during bulk operations: {e}", exc_info=True)
        errors.append(f"Database error prevented import: {e}")
        rows_imported = 0
        rows_updated = 0

    return LoadResult(
        filename=file.filename,
        rows_processed=rows_processed,
        rows_imported=rows_imported,
        rows_updated=rows_updated,
        duplicates_found=duplicates_found,
        errors=errors
    )

@app.post("/auth/login", response_model=Token)
async def login(formData: LoginRequest):
    """
    Authenticate a user and return a JWT token.
    """
    logger.info(f"Login attempt for user: {formData.email}")
    user = authenticate_user(formData.email, formData.password)
    if not user:
        logger.warning(f"Login failed for user: {formData.email}")
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    logger.info(f"Login successful for user: {formData.email}")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/verify-token")
async def verify_auth_token(token: str = Query(..., description="JWT token to verify")):
    """
    Verify a JWT token and return user information if valid.
    """
    logger.info("Token verification request received")
    payload = verify_token(token)
    if not payload:
        logger.warning("Token verification failed: invalid or expired token")
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user(payload["email"])
    if not user:
        logger.warning(f"Token verification failed: user not found - {payload['email']}")
        raise HTTPException(
            status_code=status_codes.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    logger.info(f"Token successfully verified for user: {user.email}")
    return {"valid": True, "email": user.email}
