
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
# Import models to ensure they are registered
from app.models.activity import Activity
from app.models.user import User
from app.models.job import CV, CVStatus
from app.tasks.cv_tasks import process_cv_task

def unstuck_cvs():
    db = SessionLocal()
    try:
        # Get user
        user = db.query(User).filter(User.email == "arun@gmail.com").first()
        if not user:
            print("User not found")
            return

        # Get all CVs
        all_cvs = db.query(CV).filter(CV.user_id == user.id).all()
        print(f"Total CVs: {len(all_cvs)}")
        for cv in all_cvs:
            print(f"CV {cv.id} ({cv.filename}): {cv.status}")
            if cv.status == CVStatus.FAILED and cv.error_message:
                print(f"  Error: {cv.error_message}")
            if cv.status == CVStatus.QUEUED or cv.status == CVStatus.PROCESSING or cv.status == CVStatus.FAILED:
                 print(f"  -> Re-enqueuing {cv.status} CV...")
                 process_cv_task.delay(cv_id=str(cv.id), user_id=str(user.id))
        
    except Exception as e:
        print(f"Error: {e}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    unstuck_cvs()
