import os
import sys

# Add backend directory to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import os
import sys

# Add backend directory to path so we can import app modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import create_engine, text

def fix_enum():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not found in environment")
        return

    # Replace postgres host with localhost for local execution
    database_url = database_url.replace("@postgres", "@localhost")

    print(f"Connecting to {database_url}")
    engine = create_engine(database_url)
    
    # We need to use isolation_level="AUTOCOMMIT" to run ALTER TYPE
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        # Check existing values
        try:
            result = conn.execute(text("SELECT unnest(enum_range(NULL::cvstatus))")).fetchall()
            existing = [r[0] for r in result]
            print(f"Existing enum values: {existing}")
        except Exception as e:
            print(f"Could not fetch enum values (might not exist yet): {e}")
            existing = []

        # Add 'shortlisted'
        if 'shortlisted' not in existing:
            try:
                print("Adding 'shortlisted' to cvstatus...")
                conn.execute(text("ALTER TYPE cvstatus ADD VALUE 'shortlisted'"))
                print("Success.")
            except Exception as e:
                print(f"Failed to add shortlisted: {e}")
        else:
            print("'shortlisted' already exists.")

        # Add 'rejected'
        if 'rejected' not in existing:
            try:
                print("Adding 'rejected' to cvstatus...")
                conn.execute(text("ALTER TYPE cvstatus ADD VALUE 'rejected'"))
                print("Success.")
            except Exception as e:
                print(f"Failed to add rejected: {e}")
        else:
            print("'rejected' already exists.")

if __name__ == "__main__":
    fix_enum()
