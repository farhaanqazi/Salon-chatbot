"""
Test script to isolate Supabase connection issues with asyncpg + SQLAlchemy.
Run this directly to verify connection before starting Uvicorn.
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent.parent / "Beauty_Parlour_chatbot-"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Test Configuration - Load from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ ERROR: DATABASE_URL not found in .env file")
    print("   Please copy .env.example to .env and add your Supabase database URL")
    sys.exit(1)

# Mask password for display
def mask_db_url(url):
    import re
    return re.sub(r'://postgres:([^@]+)@', '://postgres:***@', url)

print("=" * 60)
print("SUPABASE CONNECTION TEST")
print("=" * 60)
print(f"Database URL: {mask_db_url(DATABASE_URL)}")
print()


async def test_raw_asyncpg():
    """Test 1: Raw asyncpg connection (bypasses SQLAlchemy)"""
    print("Test 1: Raw asyncpg connection...")
    try:
        import asyncpg

        # Convert asyncpg URL format (remove +asyncpg prefix)
        raw_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(raw_url)
        result = await conn.fetchval("SELECT current_user")
        await conn.close()
        print(f"  ✅ SUCCESS - Connected as: {result}")
        return True
    except Exception as e:
        print(f"  ❌ FAILED - {type(e).__name__}: {e}")
        return False


async def test_sqlalchemy_asyncpg():
    """Test 2: SQLAlchemy asyncpg engine"""
    print("\nTest 2: SQLAlchemy + asyncpg engine...")
    try:
        engine = create_async_engine(
            DATABASE_URL,
            future=True,
            pool_pre_ping=True,
            echo=True,  # Show SQL statements
        )
        
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_user"))
            user = result.scalar()
            print(f"  ✅ SUCCESS - Connected as: {user}")
            
            # Test SSL connection property (Supabase-compatible)
            ssl_result = await conn.execute(text("SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid() LIMIT 1"))
            ssl_used = ssl_result.scalar()
            print(f"  SSL Active: {ssl_used is True}")
            
        await engine.dispose()
        return True
    except Exception as e:
        print(f"  ❌ FAILED - {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_session_factory():
    """Test 3: Full session factory (as used in app)"""
    print("\nTest 3: Session factory (app/db/session.py pattern)...")
    try:
        engine = create_async_engine(
            DATABASE_URL,
            future=True,
            pool_pre_ping=True,
            echo=False,
        )
        SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with SessionLocal() as session:
            result = await session.execute(text("SELECT current_database()"))
            db_name = result.scalar()
            print(f"  ✅ SUCCESS - Database: {db_name}")
            
        await engine.dispose()
        return True
    except Exception as e:
        print(f"  ❌ FAILED - {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_supabase_tables():
    """Test 4: Query actual tables"""
    print("\nTest 4: Query Supabase tables (salons, users, appointments)...")
    try:
        engine = create_async_engine(DATABASE_URL, future=True, pool_pre_ping=True, echo=False)
        SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with SessionLocal() as session:
            # Test salons table
            result = await session.execute(text("SELECT COUNT(*) FROM salons"))
            salon_count = result.scalar()
            print(f"  - Salons table: {salon_count} rows")
            
            # Test users table
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"  - Users table: {user_count} rows")
            
            # Test appointments table
            result = await session.execute(text("SELECT COUNT(*) FROM appointments"))
            appt_count = result.scalar()
            print(f"  - Appointments table: {appt_count} rows")
            
        await engine.dispose()
        print(f"  ✅ All tables accessible")
        return True
    except Exception as e:
        print(f"  ❌ FAILED - {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    results = {
        "raw_asyncpg": await test_raw_asyncpg(),
        "sqlalchemy_engine": await test_sqlalchemy_asyncpg(),
        "session_factory": await test_session_factory(),
        "table_queries": await test_supabase_tables(),
    }
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test}")
    
    all_passed = all(results.values())
    print()
    if all_passed:
        print("🎉 ALL TESTS PASSED - Backend is ready to connect to Supabase!")
    else:
        print("⚠️ SOME TESTS FAILED - See errors above for diagnosis")
        print()
        print("Troubleshooting steps:")
        print("1. Verify Supabase project is active")
        print("2. Check DATABASE_URL password is correct")
        print("3. Ensure SSL is required: ?ssl=require")
        print("4. Try psycopg2 instead of asyncpg if SNI issues persist")
        print("5. Kill all Uvicorn processes and restart after .env changes")
    
    return all_passed


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
