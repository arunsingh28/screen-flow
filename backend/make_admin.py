import sys
from app.database import SessionLocal
# Import all models to ensure mapper registry is populated
from app.models.user import User, UserRole
from app.models.job import *
from app.models.activity import *
from app.models.jd_builder import *

def make_admin(email: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User with email {email} not found.")
            return

        user.role = UserRole.ADMIN.value
        db.commit()
        print(f"Successfully updated user {email} to ADMIN role.")
    except Exception as e:
        print(f"Error updating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    email = "arun@gmail.com"
    if len(sys.argv) > 1:
        email = sys.argv[1]
    make_admin(email)
