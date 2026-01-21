"""Seed database with initial test data"""
import uuid
from datetime import datetime, timedelta
from src.database import SessionLocal, init_db
from src.models.user import User, UserRole
from src.models.event import Event, EventStatus
from src.models.registration import Registration, RegistrationStatus
from src.core.security import get_password_hash


def seed_database():
    """Create initial test data for development"""
    print("Initializing database...")
    init_db()

    db = SessionLocal()

    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Creating test users...")

        # Create test users
        users = [
            User(
                id="u1",
                email="member@company.com",
                display_name="Alice Member",
                hashed_password=get_password_hash("password123"),
                role=UserRole.MEMBER
            ),
            User(
                id="u2",
                email="org@company.com",
                display_name="Bob Organizer",
                hashed_password=get_password_hash("password123"),
                role=UserRole.ORGANIZER
            ),
            User(
                id="u3",
                email="admin@company.com",
                display_name="Charlie Admin",
                hashed_password=get_password_hash("password123"),
                role=UserRole.ADMIN
            ),
        ]

        for user in users:
            db.add(user)

        print("Creating test events...")

        # Create test events
        now = datetime.utcnow()
        events = [
            Event(
                id="e1",
                organizer_id="u2",
                title="Q1 All-Hands Meeting",
                description="Company wide updates and quarterly goals review.",
                start_at=now + timedelta(days=5, hours=10),
                end_at=now + timedelta(days=5, hours=12),
                location="Main Auditorium",
                capacity=200,
                registered_count=2,
                status=EventStatus.PUBLISHED
            ),
            Event(
                id="e2",
                organizer_id="u3",
                title="Tech Talk: AWS Serverless",
                description="Deep dive into Lambda, Fargate and Aurora.",
                start_at=now + timedelta(days=10, hours=14),
                end_at=now + timedelta(days=10, hours=15, minutes=30),
                location="Meeting Room 301",
                capacity=50,
                registered_count=1,
                status=EventStatus.PUBLISHED
            ),
            Event(
                id="e3",
                organizer_id="u2",
                title="Team Building Workshop",
                description="Collaborative problem-solving and team bonding activities.",
                start_at=now + timedelta(days=15, hours=9),
                end_at=now + timedelta(days=15, hours=17),
                location="Outdoor Venue",
                capacity=30,
                registered_count=0,
                status=EventStatus.REJECTED
            ),
            Event(
                id="e4",
                organizer_id="u2",
                title="Pending Workshop",
                description="Awaiting approval from admin.",
                start_at=now + timedelta(days=20, hours=10),
                end_at=now + timedelta(days=20, hours=12),
                location="Room B",
                capacity=25,
                registered_count=0,
                status=EventStatus.PENDING
            ),
        ]

        for event in events:
            db.add(event)

        print("Creating test registrations...")

        # Create test registrations
        registrations = [
            Registration(
                id="r1",
                event_id="e1",
                user_id="u1",
                event_title="Q1 All-Hands Meeting",
                event_start_at=events[0].start_at,
                status=RegistrationStatus.REGISTERED,
                qr_code=f"QR-e1-u1-{uuid.uuid4().hex[:4]}",
                created_at=now - timedelta(days=2)
            ),
            Registration(
                id="r2",
                event_id="e1",
                user_id="u3",
                event_title="Q1 All-Hands Meeting",
                event_start_at=events[0].start_at,
                status=RegistrationStatus.CHECKED_IN,
                qr_code=f"QR-e1-u3-{uuid.uuid4().hex[:4]}",
                created_at=now - timedelta(days=1)
            ),
            Registration(
                id="r3",
                event_id="e2",
                user_id="u1",
                event_title="Tech Talk: AWS Serverless",
                event_start_at=events[1].start_at,
                status=RegistrationStatus.REGISTERED,
                qr_code=f"QR-e2-u1-{uuid.uuid4().hex[:4]}",
                created_at=now - timedelta(hours=12)
            ),
        ]

        for registration in registrations:
            db.add(registration)

        db.commit()

        print("\n" + "=" * 50)
        print("✓ Database seeded successfully!")
        print("=" * 50)
        print("\nTest Accounts:")
        print("-" * 50)
        print("Member Account:")
        print("  Email: member@company.com")
        print("  Password: password123")
        print("  Role: member")
        print()
        print("Organizer Account:")
        print("  Email: org@company.com")
        print("  Password: password123")
        print("  Role: organizer")
        print()
        print("Admin Account:")
        print("  Email: admin@company.com")
        print("  Password: password123")
        print("  Role: admin")
        print("=" * 50)

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
