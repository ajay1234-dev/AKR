@echo off
echo 🚀 Starting Prisma Migration Process...

cd server

echo 🔧 Generating Prisma client...
npx prisma generate

echo 💾 Creating database tables...
npx prisma migrate dev --name init

if %errorlevel% == 0 (
    echo ✅ Database migration completed successfully!
    echo 📊 You can now run Prisma Studio:
    echo    npx prisma studio
) else (
    echo ❌ Database migration failed!
    echo Please check your PostgreSQL connection and try again.
)

cd ..
pause