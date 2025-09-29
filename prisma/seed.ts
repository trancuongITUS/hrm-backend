/**
 * Database seeding script
 * Populates the database with initial authentication data for development and testing
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting authentication database seeding...');

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            username: 'admin',
            firstName: 'System',
            lastName: 'Administrator',
            password: hashedAdminPassword,
            isActive: true,
            role: 'ADMIN',
        },
    });

    console.log('✅ Created admin user');

    // Create sample regular users
    console.log('👥 Creating sample users...');
    const sampleUsers = [
        {
            email: 'john.doe@example.com',
            username: 'john.doe',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER' as const,
        },
        {
            email: 'jane.smith@example.com',
            username: 'jane.smith',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'USER' as const,
        },
        {
            email: 'bob.wilson@example.com',
            username: 'bob.wilson',
            firstName: 'Bob',
            lastName: 'Wilson',
            role: 'USER' as const,
        },
    ];

    const createdUsers: Array<{ id: string; email: string }> = [];
    for (const userData of sampleUsers) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {},
            create: {
                email: userData.email,
                username: userData.username,
                firstName: userData.firstName,
                lastName: userData.lastName,
                password: hashedPassword,
                isActive: true,
                role: userData.role,
            },
        });
        
        createdUsers.push({ id: user.id, email: user.email });
    }

    console.log(`✅ Created ${createdUsers.length} sample users`);

    // Create sample user sessions (for demonstration)
    console.log('🔑 Creating sample user sessions...');
    const sampleSession = await prisma.userSession.create({
        data: {
            userId: adminUser.id,
            refreshToken: 'sample-refresh-token-admin-' + Date.now(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
    });

    console.log('✅ Created sample user session');

    console.log('🎉 Authentication database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • 1 admin user created`);
    console.log(`   • ${createdUsers.length} regular users created`);
    console.log(`   • 1 sample session created`);
    console.log('\n🔐 Authentication credentials:');
    console.log('   Admin:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('\n   Regular Users:');
    console.log('   Email: john.doe@example.com, jane.smith@example.com, bob.wilson@example.com');
    console.log('   Password: password123');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
