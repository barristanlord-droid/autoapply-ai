"""
Seed script for Careerly database.
Creates a test user, profile, skills, sample job listings, applications, and notifications.

Usage:
    cd apps/api
    python -m scripts.seed
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session, engine, Base
from app.core.security import hash_password
from app.models import (
    User, Profile, Skill, UserSkill, WorkExperience, Education,
    Resume, JobListing, SavedJob, Application,
    Subscription, CreditBalance, CreditTransaction,
    Notification,
)

now = datetime.now(timezone.utc)


def uid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Fixed IDs so we can reference them across entities
# ---------------------------------------------------------------------------
USER_ID = uid()
PROFILE_ID = uid()

# Job IDs
JOB_IDS = [uid() for _ in range(15)]

# Skill IDs will be auto-incremented ints

# ---------------------------------------------------------------------------
# DATA
# ---------------------------------------------------------------------------

SKILLS_DATA = [
    # Technical
    ("Python", "technical"), ("JavaScript", "technical"), ("TypeScript", "technical"),
    ("React", "technical"), ("Next.js", "technical"), ("Node.js", "technical"),
    ("FastAPI", "technical"), ("Django", "technical"), ("PostgreSQL", "technical"),
    ("MongoDB", "technical"), ("Redis", "technical"), ("Docker", "technical"),
    ("Kubernetes", "technical"), ("AWS", "technical"), ("GCP", "technical"),
    ("GraphQL", "technical"), ("REST APIs", "technical"), ("Git", "technical"),
    ("CI/CD", "technical"), ("Machine Learning", "technical"),
    ("TensorFlow", "technical"), ("PyTorch", "technical"),
    ("SQL", "technical"), ("HTML/CSS", "technical"), ("Tailwind CSS", "technical"),
    ("Vue.js", "technical"), ("Go", "technical"), ("Rust", "technical"),
    ("Java", "technical"), ("C#", "technical"),
    # Soft skills
    ("Communication", "soft"), ("Leadership", "soft"), ("Problem Solving", "soft"),
    ("Teamwork", "soft"), ("Agile/Scrum", "soft"), ("Project Management", "soft"),
    # Languages
    ("English", "language"), ("Spanish", "language"), ("French", "language"),
    ("Mandarin", "language"),
]

JOBS_DATA = [
    {
        "id": JOB_IDS[0],
        "source": "linkedin",
        "source_id": "linkedin-001",
        "title": "Senior Full-Stack Engineer",
        "company_name": "TechVista Inc.",
        "company_logo_url": "https://logo.clearbit.com/techvista.com",
        "description": "We are looking for a Senior Full-Stack Engineer to join our growing team. You will be responsible for building and maintaining web applications using React, Next.js, and Python/FastAPI. The ideal candidate has 5+ years of experience, strong knowledge of cloud infrastructure, and a passion for clean code.\n\nResponsibilities:\n- Design and implement new features across the full stack\n- Write clean, maintainable, and well-tested code\n- Collaborate with product and design teams\n- Mentor junior developers\n- Participate in code reviews and architecture discussions\n\nRequirements:\n- 5+ years of professional software development experience\n- Strong proficiency in Python and JavaScript/TypeScript\n- Experience with React, Next.js, or similar frameworks\n- Experience with RESTful APIs and database design\n- Familiarity with cloud services (AWS/GCP)\n- Bachelor's degree in Computer Science or equivalent",
        "location": "San Francisco, CA",
        "is_remote": True,
        "country": "US",
        "salary_min": 150000,
        "salary_max": 200000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "JavaScript", "TypeScript", "React", "Next.js", "FastAPI"]),
        "preferred_skills": json.dumps(["AWS", "Docker", "PostgreSQL", "Redis"]),
        "min_years_experience": 5,
        "education_requirement": "Bachelor's in CS or equivalent",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=2),
    },
    {
        "id": JOB_IDS[1],
        "source": "indeed",
        "source_id": "indeed-002",
        "title": "Frontend Developer",
        "company_name": "DesignFlow",
        "company_logo_url": "https://logo.clearbit.com/designflow.io",
        "description": "DesignFlow is hiring a Frontend Developer to help us build beautiful and performant user interfaces. You'll work closely with our design team to implement pixel-perfect UIs using React and Tailwind CSS.\n\nWhat you'll do:\n- Build responsive, accessible web applications\n- Implement design system components\n- Optimize frontend performance\n- Write unit and integration tests\n\nWhat we need:\n- 3+ years of frontend development experience\n- Expert-level knowledge of React and TypeScript\n- Experience with Tailwind CSS or similar utility-first CSS\n- Understanding of web accessibility (WCAG)\n- Eye for design and attention to detail",
        "location": "New York, NY",
        "is_remote": False,
        "country": "US",
        "salary_min": 110000,
        "salary_max": 145000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Technology",
        "required_skills": json.dumps(["React", "TypeScript", "Tailwind CSS", "HTML/CSS"]),
        "preferred_skills": json.dumps(["Next.js", "Testing", "Figma"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's degree preferred",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(days=1),
    },
    {
        "id": JOB_IDS[2],
        "source": "linkedin",
        "source_id": "linkedin-003",
        "title": "Machine Learning Engineer",
        "company_name": "NeuralPath AI",
        "company_logo_url": "https://logo.clearbit.com/neuralpath.ai",
        "description": "NeuralPath AI is seeking a Machine Learning Engineer to develop and deploy ML models at scale. You'll work on cutting-edge problems in NLP and computer vision.\n\nResponsibilities:\n- Design, train, and deploy ML models for production\n- Build data pipelines for model training\n- Optimize model performance and latency\n- Collaborate with research scientists\n\nRequirements:\n- MS or PhD in Computer Science, ML, or related field\n- 3+ years of production ML experience\n- Strong Python skills (PyTorch or TensorFlow)\n- Experience with MLOps (MLflow, Kubeflow, etc.)\n- Familiarity with cloud ML platforms (SageMaker, Vertex AI)",
        "location": "Remote",
        "is_remote": True,
        "country": "US",
        "salary_min": 160000,
        "salary_max": 220000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "Artificial Intelligence",
        "required_skills": json.dumps(["Python", "PyTorch", "TensorFlow", "Machine Learning"]),
        "preferred_skills": json.dumps(["Kubernetes", "AWS", "NLP", "Computer Vision"]),
        "min_years_experience": 3,
        "education_requirement": "Master's or PhD",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=3),
    },
    {
        "id": JOB_IDS[3],
        "source": "company",
        "source_id": "stripe-004",
        "title": "Backend Engineer - Payments",
        "company_name": "Stripe",
        "company_logo_url": "https://logo.clearbit.com/stripe.com",
        "description": "Join Stripe's Payments team to build the financial infrastructure that powers the internet economy. You'll design APIs and systems handling billions of dollars in transactions.\n\nWhat you'll do:\n- Build highly reliable, scalable payment processing systems\n- Design and implement APIs used by millions of developers\n- Work on distributed systems handling high throughput\n- Collaborate across teams on platform-wide initiatives\n\nRequirements:\n- 4+ years of backend engineering experience\n- Strong proficiency in a systems language (Go, Java, or similar)\n- Experience with distributed systems and databases\n- Understanding of financial systems or payment processing\n- Strong CS fundamentals",
        "location": "Seattle, WA",
        "is_remote": True,
        "country": "US",
        "salary_min": 170000,
        "salary_max": 250000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "FinTech",
        "required_skills": json.dumps(["Go", "Java", "SQL", "Distributed Systems"]),
        "preferred_skills": json.dumps(["Kubernetes", "AWS", "PostgreSQL", "Redis"]),
        "min_years_experience": 4,
        "education_requirement": "Bachelor's in CS",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=5),
    },
    {
        "id": JOB_IDS[4],
        "source": "indeed",
        "source_id": "indeed-005",
        "title": "DevOps Engineer",
        "company_name": "CloudNine Solutions",
        "company_logo_url": "https://logo.clearbit.com/cloudnine.dev",
        "description": "CloudNine Solutions is looking for a DevOps Engineer to help us build and maintain our cloud infrastructure. You'll work with Kubernetes, Terraform, and CI/CD pipelines.\n\nResponsibilities:\n- Manage Kubernetes clusters and container orchestration\n- Build and maintain CI/CD pipelines\n- Implement infrastructure as code with Terraform\n- Monitor system health and respond to incidents\n- Automate repetitive operational tasks\n\nRequirements:\n- 3+ years of DevOps/SRE experience\n- Strong knowledge of Kubernetes and Docker\n- Experience with Terraform or Pulumi\n- AWS or GCP certification preferred\n- Scripting skills (Python, Bash)",
        "location": "Austin, TX",
        "is_remote": True,
        "country": "US",
        "salary_min": 130000,
        "salary_max": 175000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Technology",
        "required_skills": json.dumps(["Docker", "Kubernetes", "AWS", "CI/CD", "Python"]),
        "preferred_skills": json.dumps(["Terraform", "GCP", "Prometheus", "Grafana"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's degree",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(days=1),
    },
    {
        "id": JOB_IDS[5],
        "source": "linkedin",
        "source_id": "linkedin-006",
        "title": "Junior Software Developer",
        "company_name": "GreenLeaf Tech",
        "company_logo_url": "https://logo.clearbit.com/greenleaftech.com",
        "description": "GreenLeaf Tech is looking for a Junior Software Developer to join our team. This is a great opportunity for someone starting their career in tech. You'll work with experienced engineers and grow your skills.\n\nWhat you'll do:\n- Write clean, tested code in Python and JavaScript\n- Fix bugs and improve existing features\n- Learn from senior engineers through pair programming\n- Participate in sprint planning and retrospectives\n\nRequirements:\n- 0-2 years of development experience\n- Knowledge of Python or JavaScript\n- Familiarity with Git and version control\n- Eagerness to learn and grow\n- CS degree or bootcamp graduate",
        "location": "Chicago, IL",
        "is_remote": False,
        "country": "US",
        "salary_min": 65000,
        "salary_max": 85000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "entry",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "JavaScript", "Git"]),
        "preferred_skills": json.dumps(["React", "SQL", "Docker"]),
        "min_years_experience": 0,
        "education_requirement": "Bachelor's or bootcamp",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(hours=12),
    },
    {
        "id": JOB_IDS[6],
        "source": "company",
        "source_id": "google-007",
        "title": "Software Engineer, Cloud Platform",
        "company_name": "Google",
        "company_logo_url": "https://logo.clearbit.com/google.com",
        "description": "Google Cloud Platform is looking for a Software Engineer to build the next generation of cloud infrastructure. You'll work on distributed systems that serve millions of users worldwide.\n\nResponsibilities:\n- Design and implement scalable cloud services\n- Work on performance optimization of distributed systems\n- Contribute to open-source projects\n- Write technical documentation\n\nMinimum qualifications:\n- Bachelor's in CS or equivalent\n- 2+ years software development experience\n- Experience in C++, Java, Go, or Python\n- Knowledge of data structures and algorithms",
        "location": "Mountain View, CA",
        "is_remote": False,
        "country": "US",
        "salary_min": 140000,
        "salary_max": 210000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "Go", "Java", "Distributed Systems"]),
        "preferred_skills": json.dumps(["GCP", "Kubernetes", "C++"]),
        "min_years_experience": 2,
        "education_requirement": "Bachelor's in CS",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=4),
    },
    {
        "id": JOB_IDS[7],
        "source": "indeed",
        "source_id": "indeed-008",
        "title": "Data Engineer",
        "company_name": "DataStream Analytics",
        "company_logo_url": "https://logo.clearbit.com/datastream.io",
        "description": "DataStream Analytics needs a Data Engineer to build and maintain our data infrastructure. You'll work with large-scale data pipelines and warehousing solutions.\n\nResponsibilities:\n- Build and optimize data pipelines using Apache Spark and Airflow\n- Design data warehouse schemas\n- Ensure data quality and reliability\n- Collaborate with data scientists and analysts\n\nRequirements:\n- 3+ years of data engineering experience\n- Strong SQL skills\n- Experience with Python and Apache Spark\n- Knowledge of data warehousing concepts\n- Experience with cloud data platforms (Snowflake, BigQuery, Redshift)",
        "location": "Denver, CO",
        "is_remote": True,
        "country": "US",
        "salary_min": 125000,
        "salary_max": 165000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Data & Analytics",
        "required_skills": json.dumps(["Python", "SQL", "Apache Spark", "Airflow"]),
        "preferred_skills": json.dumps(["Snowflake", "AWS", "Docker", "Terraform"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's in CS or related",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(days=2),
    },
    {
        "id": JOB_IDS[8],
        "source": "linkedin",
        "source_id": "linkedin-009",
        "title": "React Native Developer",
        "company_name": "MobileFirst Labs",
        "company_logo_url": "https://logo.clearbit.com/mobilefirst.io",
        "description": "MobileFirst Labs is looking for a React Native Developer to build cross-platform mobile apps. Join our team of talented engineers building products used by millions.\n\nWhat you'll do:\n- Develop cross-platform mobile apps with React Native\n- Implement native modules when needed\n- Optimize app performance and bundle size\n- Write comprehensive tests\n\nRequirements:\n- 2+ years of React Native experience\n- Strong JavaScript/TypeScript skills\n- Published apps on App Store or Google Play\n- Understanding of native iOS/Android concepts\n- Familiarity with mobile CI/CD",
        "location": "Miami, FL",
        "is_remote": True,
        "country": "US",
        "salary_min": 110000,
        "salary_max": 150000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Mobile Development",
        "required_skills": json.dumps(["React", "JavaScript", "TypeScript", "React Native"]),
        "preferred_skills": json.dumps(["iOS", "Android", "GraphQL"]),
        "min_years_experience": 2,
        "education_requirement": "Bachelor's preferred",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(days=1),
    },
    {
        "id": JOB_IDS[9],
        "source": "company",
        "source_id": "meta-010",
        "title": "Production Engineer",
        "company_name": "Meta",
        "company_logo_url": "https://logo.clearbit.com/meta.com",
        "description": "Meta's Production Engineering team bridges software and systems engineering. You'll ensure that our services are reliable, scalable, and efficient.\n\nResponsibilities:\n- Build tools and automation for large-scale infrastructure\n- Design systems for monitoring and alerting\n- Respond to and manage production incidents\n- Optimize system performance at massive scale\n\nRequirements:\n- 3+ years of production/systems engineering experience\n- Proficiency in Python, C++, or Rust\n- Deep understanding of Linux internals\n- Experience with distributed systems\n- Strong debugging and troubleshooting skills",
        "location": "Menlo Park, CA",
        "is_remote": False,
        "country": "US",
        "salary_min": 155000,
        "salary_max": 230000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "C++", "Linux", "Distributed Systems"]),
        "preferred_skills": json.dumps(["Rust", "Kubernetes", "Terraform"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's in CS",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=6),
    },
    {
        "id": JOB_IDS[10],
        "source": "indeed",
        "source_id": "indeed-011",
        "title": "Python Developer - Contract",
        "company_name": "CodeCraft Solutions",
        "company_logo_url": None,
        "description": "CodeCraft Solutions is seeking a Python Developer for a 6-month contract working on a Django-based web application.\n\nResponsibilities:\n- Develop and maintain Django web applications\n- Write RESTful APIs\n- Implement database models and queries\n- Write unit and integration tests\n\nRequirements:\n- 2+ years of Python experience\n- Experience with Django or Flask\n- Knowledge of SQL databases\n- Good communication skills",
        "location": "Remote",
        "is_remote": True,
        "country": "US",
        "salary_min": 70,
        "salary_max": 95,
        "salary_currency": "USD",
        "salary_period": "hourly",
        "job_type": "contract",
        "experience_level": "mid",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "Django", "SQL", "REST APIs"]),
        "preferred_skills": json.dumps(["Docker", "PostgreSQL", "Redis"]),
        "min_years_experience": 2,
        "education_requirement": None,
        "visa_sponsorship": False,
        "posted_at": now - timedelta(hours=6),
    },
    {
        "id": JOB_IDS[11],
        "source": "linkedin",
        "source_id": "linkedin-012",
        "title": "Software Engineering Intern",
        "company_name": "Microsoft",
        "company_logo_url": "https://logo.clearbit.com/microsoft.com",
        "description": "Microsoft is looking for Software Engineering Interns for our Summer 2026 internship program. You'll work on real projects that impact millions of users.\n\nWhat you'll do:\n- Work on a meaningful project in a product team\n- Collaborate with experienced engineers\n- Attend tech talks and intern events\n- Present your work at the end of the program\n\nRequirements:\n- Currently pursuing a Bachelor's or Master's in CS\n- Strong coding skills in at least one language\n- Understanding of data structures and algorithms\n- Available for 12-week summer internship",
        "location": "Redmond, WA",
        "is_remote": False,
        "country": "US",
        "salary_min": 8000,
        "salary_max": 10000,
        "salary_currency": "USD",
        "salary_period": "monthly",
        "job_type": "internship",
        "experience_level": "entry",
        "industry": "Technology",
        "required_skills": json.dumps(["Python", "Java", "C#"]),
        "preferred_skills": json.dumps(["Azure", "TypeScript", "React"]),
        "min_years_experience": 0,
        "education_requirement": "Pursuing Bachelor's or Master's",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=7),
    },
    {
        "id": JOB_IDS[12],
        "source": "company",
        "source_id": "spotify-013",
        "title": "Backend Engineer - Content Platform",
        "company_name": "Spotify",
        "company_logo_url": "https://logo.clearbit.com/spotify.com",
        "description": "Spotify's Content Platform team is looking for a Backend Engineer to build systems that manage and deliver content to hundreds of millions of users.\n\nWhat you'll do:\n- Build microservices in Java and Python\n- Design and implement event-driven architectures\n- Work with large-scale data processing\n- Contribute to system design decisions\n\nWho you are:\n- 3+ years of backend development experience\n- Proficient in Java or Python\n- Experience with microservices and event-driven systems\n- Knowledge of cloud platforms (GCP preferred)\n- Passionate about music and audio",
        "location": "New York, NY",
        "is_remote": True,
        "country": "US",
        "salary_min": 140000,
        "salary_max": 195000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "mid",
        "industry": "Entertainment",
        "required_skills": json.dumps(["Java", "Python", "Microservices", "GCP"]),
        "preferred_skills": json.dumps(["Kafka", "Kubernetes", "GraphQL"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's in CS or equivalent",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=3),
    },
    {
        "id": JOB_IDS[13],
        "source": "indeed",
        "source_id": "indeed-014",
        "title": "Security Engineer",
        "company_name": "CyberShield Corp",
        "company_logo_url": None,
        "description": "CyberShield Corp is hiring a Security Engineer to help protect our clients from cyber threats. You'll work on penetration testing, security audits, and incident response.\n\nResponsibilities:\n- Conduct security assessments and penetration testing\n- Review code for security vulnerabilities\n- Design security architecture and protocols\n- Respond to security incidents\n- Develop security policies and training\n\nRequirements:\n- 4+ years of security engineering experience\n- Knowledge of OWASP Top 10 and common vulnerabilities\n- Experience with security tools (Burp Suite, Metasploit)\n- Strong networking and systems knowledge\n- Security certifications (CISSP, CEH) preferred",
        "location": "Washington, DC",
        "is_remote": False,
        "country": "US",
        "salary_min": 135000,
        "salary_max": 180000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "Cybersecurity",
        "required_skills": json.dumps(["Python", "Networking", "Security"]),
        "preferred_skills": json.dumps(["AWS", "Linux", "Kubernetes"]),
        "min_years_experience": 4,
        "education_requirement": "Bachelor's in CS or Cybersecurity",
        "visa_sponsorship": False,
        "posted_at": now - timedelta(days=4),
    },
    {
        "id": JOB_IDS[14],
        "source": "linkedin",
        "source_id": "linkedin-015",
        "title": "AI/ML Product Engineer",
        "company_name": "Anthropic",
        "company_logo_url": "https://logo.clearbit.com/anthropic.com",
        "description": "Anthropic is looking for an AI/ML Product Engineer to help build safe and beneficial AI products. You'll work at the intersection of ML research and product engineering.\n\nWhat you'll do:\n- Build product features powered by large language models\n- Design and implement evaluation frameworks\n- Optimize inference pipelines for production\n- Collaborate with researchers on productizing research\n\nRequirements:\n- 3+ years of software engineering experience\n- Experience with ML systems and LLMs\n- Strong Python skills\n- Understanding of ML evaluation methodologies\n- Passion for AI safety and alignment",
        "location": "San Francisco, CA",
        "is_remote": True,
        "country": "US",
        "salary_min": 180000,
        "salary_max": 280000,
        "salary_currency": "USD",
        "salary_period": "yearly",
        "job_type": "full-time",
        "experience_level": "senior",
        "industry": "Artificial Intelligence",
        "required_skills": json.dumps(["Python", "Machine Learning", "LLMs", "REST APIs"]),
        "preferred_skills": json.dumps(["PyTorch", "TypeScript", "React", "Kubernetes"]),
        "min_years_experience": 3,
        "education_requirement": "Bachelor's or Master's in CS",
        "visa_sponsorship": True,
        "posted_at": now - timedelta(days=1),
    },
]


async def seed_database():
    print("=" * 60)
    print("  Careerly - Database Seeder")
    print("=" * 60)

    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("\n[!] Database already has data. Clearing and re-seeding...")
            # Delete in dependency order
            for table in reversed(Base.metadata.sorted_tables):
                await session.execute(table.delete())
            await session.commit()

        # 1. Create test user
        print("\n[1/8] Creating test user...")
        user = User(
            id=USER_ID,
            email="demo@careerly.ai",
            hashed_password=hash_password("password123"),
            full_name="Alex Johnson",
            avatar_url=None,
            auth_provider="email",
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            tier="free",
            last_login_at=now,
        )
        session.add(user)
        print(f"    -> User: {user.email} / password123")

        # 2. Create profile
        print("[2/8] Creating user profile...")
        profile = Profile(
            id=PROFILE_ID,
            user_id=USER_ID,
            headline="Full-Stack Software Engineer | Python & React Specialist",
            summary="Experienced software engineer with 4+ years of expertise in building web applications using Python, FastAPI, React, and Next.js. Passionate about clean code, scalable architectures, and leveraging AI to solve real-world problems. Previously worked at a fast-growing SaaS startup and a mid-sized fintech company.",
            years_of_experience=4,
            current_location="San Francisco, CA",
            preferred_locations=json.dumps(["San Francisco, CA", "New York, NY", "Seattle, WA", "Remote"]),
            open_to_remote=True,
            open_to_relocation=True,
            desired_job_titles=json.dumps(["Software Engineer", "Full-Stack Engineer", "Backend Engineer", "Senior Software Engineer"]),
            desired_industries=json.dumps(["Technology", "FinTech", "AI/ML", "SaaS"]),
            desired_salary_min=130000,
            desired_salary_max=200000,
            salary_currency="USD",
            job_type_preferences=json.dumps(["full-time"]),
            requires_visa_sponsorship=False,
        )
        session.add(profile)

        # 3. Create skills and user-skill associations
        print("[3/8] Creating skills taxonomy & user skills...")
        skill_objects = {}
        for name, category in SKILLS_DATA:
            skill = Skill(name=name, category=category)
            session.add(skill)
            skill_objects[name] = skill

        await session.flush()  # Get auto-incremented IDs

        # User's skills with proficiency levels
        user_skills_data = [
            ("Python", "advanced", 4.0),
            ("JavaScript", "advanced", 4.0),
            ("TypeScript", "advanced", 3.5),
            ("React", "advanced", 3.0),
            ("Next.js", "intermediate", 2.0),
            ("FastAPI", "advanced", 2.5),
            ("PostgreSQL", "intermediate", 3.0),
            ("Docker", "intermediate", 2.0),
            ("AWS", "intermediate", 2.0),
            ("Git", "advanced", 4.0),
            ("REST APIs", "advanced", 4.0),
            ("Redis", "beginner", 1.0),
            ("Node.js", "intermediate", 2.5),
            ("SQL", "advanced", 4.0),
            ("HTML/CSS", "advanced", 4.0),
            ("Tailwind CSS", "intermediate", 1.5),
            ("CI/CD", "intermediate", 2.0),
            ("Communication", "advanced", None),
            ("Problem Solving", "advanced", None),
            ("Agile/Scrum", "advanced", 3.0),
        ]

        for skill_name, prof, years in user_skills_data:
            user_skill = UserSkill(
                profile_id=PROFILE_ID,
                skill_id=skill_objects[skill_name].id,
                proficiency=prof,
                years=years,
                source="parsed",
            )
            session.add(user_skill)

        # 4. Work experience
        print("[4/8] Creating work experience...")
        experiences = [
            WorkExperience(
                profile_id=PROFILE_ID,
                company="PayFlow Technologies",
                title="Software Engineer",
                location="San Francisco, CA",
                start_date="2022-06",
                end_date=None,
                is_current=True,
                description="Building payment processing microservices and customer-facing dashboards for a growing fintech startup.",
                highlights=json.dumps([
                    "Architected and built a real-time transaction monitoring system handling 50K+ events/sec",
                    "Reduced API response times by 40% through caching strategies and query optimization",
                    "Led migration from monolith to microservices architecture using FastAPI and Docker",
                    "Mentored 2 junior developers and led technical design reviews",
                ]),
            ),
            WorkExperience(
                profile_id=PROFILE_ID,
                company="CloudStack SaaS",
                title="Junior Software Developer",
                location="New York, NY",
                start_date="2020-08",
                end_date="2022-05",
                is_current=False,
                description="Full-stack development on a B2B SaaS platform for project management.",
                highlights=json.dumps([
                    "Built React-based dashboard components used by 10K+ daily active users",
                    "Developed RESTful APIs in Django handling user authentication and project management",
                    "Implemented automated testing pipeline reducing bug escape rate by 35%",
                    "Contributed to migration from JavaScript to TypeScript across the frontend codebase",
                ]),
            ),
            WorkExperience(
                profile_id=PROFILE_ID,
                company="TechBridge Consulting",
                title="Software Engineering Intern",
                location="Boston, MA",
                start_date="2020-01",
                end_date="2020-06",
                is_current=False,
                description="Internship focused on building internal tools and data pipelines.",
                highlights=json.dumps([
                    "Built a Python-based ETL pipeline processing 500K+ records daily",
                    "Created an internal admin dashboard using React and Material UI",
                ]),
            ),
        ]
        for exp in experiences:
            session.add(exp)

        # 5. Education
        print("[5/8] Creating education records...")
        edu = Education(
            profile_id=PROFILE_ID,
            institution="University of California, Berkeley",
            degree="Bachelor of Science",
            field_of_study="Computer Science",
            start_date="2016-09",
            end_date="2020-05",
            gpa=3.7,
        )
        session.add(edu)

        # 6. Create job listings
        print("[6/8] Creating 15 job listings...")
        for job_data in JOBS_DATA:
            job = JobListing(**job_data)
            session.add(job)

        # 7. Subscription & Credits
        print("[7/8] Setting up subscription & credits...")
        subscription = Subscription(
            user_id=USER_ID,
            plan="free",
            status="active",
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
        session.add(subscription)

        credit_balance = CreditBalance(
            user_id=USER_ID,
            auto_apply_credits=5,
            ai_generation_credits=20,
            last_refill_at=now,
        )
        session.add(credit_balance)

        # Initial credit transaction
        await session.flush()
        credit_tx = CreditTransaction(
            user_id=USER_ID,
            credit_type="auto_apply",
            amount=5,
            reason="subscription_refill",
            balance_after=5,
        )
        session.add(credit_tx)

        credit_tx2 = CreditTransaction(
            user_id=USER_ID,
            credit_type="ai_generation",
            amount=20,
            reason="subscription_refill",
            balance_after=20,
        )
        session.add(credit_tx2)

        # 8. Sample applications & notifications
        print("[8/8] Creating sample applications & notifications...")

        # Application 1 - Submitted (created 2 days ago)
        app1 = Application(
            user_id=USER_ID,
            job_id=JOB_IDS[0],  # Senior Full-Stack at TechVista
            status="submitted",
            match_score=0.92,
            submitted_at=now - timedelta(days=1),
            submission_method="auto",
            notes="Great match for my experience with React and FastAPI.",
            created_at=now - timedelta(days=2),
            status_history=json.dumps([
                {"status": "draft", "timestamp": (now - timedelta(days=2)).isoformat(), "note": "Application created"},
                {"status": "ready", "timestamp": (now - timedelta(days=2, hours=-1)).isoformat(), "note": "Materials generated"},
                {"status": "submitted", "timestamp": (now - timedelta(days=1)).isoformat(), "note": "Auto-applied"},
            ]),
        )
        session.add(app1)

        # Application 2 - Interview (created 8 days ago — previous week)
        app2 = Application(
            user_id=USER_ID,
            job_id=JOB_IDS[6],  # Google SWE
            status="interview",
            match_score=0.85,
            submitted_at=now - timedelta(days=7),
            submission_method="manual",
            notes="Recruiter reached out after application.",
            created_at=now - timedelta(days=8),
            status_history=json.dumps([
                {"status": "draft", "timestamp": (now - timedelta(days=8)).isoformat(), "note": "Application created"},
                {"status": "submitted", "timestamp": (now - timedelta(days=7)).isoformat(), "note": "Applied manually"},
                {"status": "viewed", "timestamp": (now - timedelta(days=5)).isoformat(), "note": "Application viewed by recruiter"},
                {"status": "interview", "timestamp": (now - timedelta(days=2)).isoformat(), "note": "Phone screen scheduled for next week"},
            ]),
        )
        session.add(app2)

        # Application 3 - Draft (created today)
        app3 = Application(
            user_id=USER_ID,
            job_id=JOB_IDS[3],  # Stripe Backend
            status="draft",
            match_score=0.78,
            created_at=now,
            status_history=json.dumps([
                {"status": "draft", "timestamp": now.isoformat(), "note": "Application created"},
            ]),
        )
        session.add(app3)

        # Application 4 - Rejected (created 18 days ago — 3 weeks back)
        app4 = Application(
            user_id=USER_ID,
            job_id=JOB_IDS[9],  # Meta Production Engineer
            status="rejected",
            match_score=0.72,
            submitted_at=now - timedelta(days=17),
            submission_method="auto",
            created_at=now - timedelta(days=18),
            status_history=json.dumps([
                {"status": "draft", "timestamp": (now - timedelta(days=18)).isoformat(), "note": ""},
                {"status": "submitted", "timestamp": (now - timedelta(days=17)).isoformat(), "note": "Auto-applied"},
                {"status": "rejected", "timestamp": (now - timedelta(days=10)).isoformat(), "note": "Position filled"},
            ]),
        )
        session.add(app4)

        # Saved/swiped jobs
        saved_jobs = [
            SavedJob(user_id=USER_ID, job_id=JOB_IDS[2], action="liked", match_score=0.88),
            SavedJob(user_id=USER_ID, job_id=JOB_IDS[4], action="saved", match_score=0.81),
            SavedJob(user_id=USER_ID, job_id=JOB_IDS[7], action="liked", match_score=0.76),
            SavedJob(user_id=USER_ID, job_id=JOB_IDS[14], action="saved", match_score=0.95),
            SavedJob(user_id=USER_ID, job_id=JOB_IDS[5], action="disliked", match_score=0.45),
        ]
        for sj in saved_jobs:
            session.add(sj)

        # Notifications
        notifications = [
            Notification(
                user_id=USER_ID,
                type="new_match",
                title="New job match: AI/ML Product Engineer at Anthropic",
                body="We found a new job that matches your profile with a 95% match score!",
                data=json.dumps({"job_id": JOB_IDS[14]}),
                is_read=False,
                created_at=now - timedelta(hours=2),
            ),
            Notification(
                user_id=USER_ID,
                type="application_update",
                title="Interview scheduled at Google",
                body="Great news! Your application for Software Engineer, Cloud Platform at Google has moved to the interview stage.",
                data=json.dumps({"job_id": JOB_IDS[6]}),
                is_read=False,
                created_at=now - timedelta(days=1),
            ),
            Notification(
                user_id=USER_ID,
                type="application_update",
                title="Application viewed by TechVista Inc.",
                body="Your application for Senior Full-Stack Engineer has been viewed by the hiring team.",
                data=json.dumps({"job_id": JOB_IDS[0]}),
                is_read=True,
                read_at=now - timedelta(hours=12),
                created_at=now - timedelta(days=1, hours=6),
            ),
            Notification(
                user_id=USER_ID,
                type="system",
                title="Welcome to Careerly!",
                body="Your account is set up. Start by uploading your resume to get personalized job matches.",
                is_read=True,
                read_at=now - timedelta(days=5),
                created_at=now - timedelta(days=7),
            ),
        ]
        for notif in notifications:
            session.add(notif)

        await session.commit()

    print("\n" + "=" * 60)
    print("  Seeding complete!")
    print("=" * 60)
    print(f"""
  Summary:
  --------
  - 1 test user (demo@careerly.ai / password123)
  - 1 profile with headline, summary & preferences
  - {len(SKILLS_DATA)} skills in the taxonomy
  - {len(user_skills_data)} user skills with proficiency levels
  - 3 work experiences
  - 1 education record
  - {len(JOBS_DATA)} job listings (various companies & roles)
  - 4 applications (submitted, interview, draft, rejected)
  - 5 saved/swiped jobs
  - 4 notifications
  - 1 subscription (free tier)
  - 1 credit balance (5 auto-apply, 20 AI generation)

  Login credentials:
  ------------------
  Email:    demo@careerly.ai
  Password: password123
""")


if __name__ == "__main__":
    asyncio.run(seed_database())
