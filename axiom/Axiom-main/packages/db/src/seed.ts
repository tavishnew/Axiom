// Seed script for development
// Run with: bun run db:seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create a demo organization
    const org = await prisma.organization.upsert({
        where: { slug: 'demo-org' },
        update: {},
        create: {
            name: 'Demo Organization',
            slug: 'demo-org',
        },
    });

    console.log(`✅ Created organization: ${org.name} (${org.id})`);

    // Create a demo user
    const user = await prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
            email: 'admin@demo.com',
            name: 'Demo Admin',
            role: 'admin',
            organizationId: org.id,
        },
    });

    console.log(`✅ Created user: ${user.email} (${user.id})`);

    // Create a demo API key (hashed with SHA256)
    const apiKeyPrefix = 'pmx_demo';
    const hashedKey = 'demo_hashed_key_for_development_only';

    const apiKey = await prisma.apiKey.upsert({
        where: { hashedKey },
        update: {},
        create: {
            name: 'Demo API Key',
            prefix: apiKeyPrefix,
            hashedKey,
            organizationId: org.id,
        },
    });

    console.log(`✅ Created API key: ${apiKey.name} (prefix: ${apiKey.prefix})`);

    // Create demo resources
    const resources = [
        { type: 'document', name: 'public-docs', description: 'Public documentation' },
        { type: 'document', name: 'private-docs', description: 'Private documentation' },
        { type: 'api', name: 'users-api', description: 'Users management API' },
        { type: 'api', name: 'billing-api', description: 'Billing API' },
        { type: 'feature', name: 'analytics', description: 'Analytics dashboard' },
        { type: 'feature', name: 'export', description: 'Data export feature' },
    ];

    for (const resource of resources) {
        await prisma.resource.upsert({
            where: {
                organizationId_type_name: {
                    organizationId: org.id,
                    type: resource.type,
                    name: resource.name,
                },
            },
            update: {},
            create: {
                ...resource,
                organizationId: org.id,
            },
        });
    }

    console.log(`✅ Created ${resources.length} demo resources`);

    // Create demo entities
    const entities = [
        { externalId: 'user-free-1', type: 'user', attributes: { plan: 'free', role: 'member' } },
        { externalId: 'user-pro-1', type: 'user', attributes: { plan: 'pro', role: 'member' } },
        { externalId: 'user-enterprise-1', type: 'user', attributes: { plan: 'enterprise', role: 'admin' } },
        { externalId: 'service-internal', type: 'service', attributes: { environment: 'production' } },
    ];

    for (const entity of entities) {
        await prisma.entity.upsert({
            where: {
                organizationId_externalId_type: {
                    organizationId: org.id,
                    externalId: entity.externalId,
                    type: entity.type,
                },
            },
            update: {},
            create: {
                ...entity,
                organizationId: org.id,
            },
        });
    }

    console.log(`✅ Created ${entities.length} demo entities`);

    // Create demo policies
    const policies = [
        {
            name: 'allow-free-read',
            description: 'Allow free users to read public resources',
            effect: 'allow',
            priority: 10,
            conditions: [
                { field: 'entity.attributes.plan', operator: 'eq', value: 'free' },
                { field: 'action', operator: 'eq', value: 'read' },
                { field: 'resource.type', operator: 'eq', value: 'document' },
            ],
        },
        {
            name: 'allow-pro-all',
            description: 'Allow pro users full access to most resources',
            effect: 'allow',
            priority: 20,
            conditions: [
                { field: 'entity.attributes.plan', operator: 'in', value: ['pro', 'enterprise'] },
            ],
        },
        {
            name: 'deny-billing-non-admin',
            description: 'Deny billing API access to non-admins',
            effect: 'deny',
            priority: 100,
            conditions: [
                { field: 'resource.name', operator: 'eq', value: 'billing-api' },
                { field: 'entity.attributes.role', operator: 'neq', value: 'admin' },
            ],
        },
    ];

    for (const policy of policies) {
        await prisma.policy.upsert({
            where: {
                organizationId_name: {
                    organizationId: org.id,
                    name: policy.name,
                },
            },
            update: {},
            create: {
                ...policy,
                organizationId: org.id,
            },
        });
    }

    console.log(`✅ Created ${policies.length} demo policies`);

    console.log('\n🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
