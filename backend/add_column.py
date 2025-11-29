
from app.database import SessionLocal
from sqlalchemy import text

def add_is_archived_column():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='cv_batches' AND column_name='is_archived'"))
        if result.fetchone():
            print("Column 'is_archived' already exists.")
        else:
            print("Adding 'is_archived' column...")
            db.execute(text("ALTER TABLE cv_batches ADD COLUMN is_archived BOOLEAN DEFAULT FALSE"))
            db.commit()
            print("Column added successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_is_archived_column()
