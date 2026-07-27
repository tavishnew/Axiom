#!/usr/bin/env node
/**
 * Seed script for Axiom - creates demo organizations, policies, entities, and resources
 * Usage: node scripts/seed.mjs
 */

const API = process.env.API_URL || 'http://localhost:80/api';

async function main() {
  console.log('Seeding Axiom demo data...\n');

  // Create organization
  const orgRes = await fetch(`${API}/organizations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Acme Corp', slug: 'acme-corp' }),
  });
  const org = await orgRes.json();
  const orgId = org.id;
  console.log(`✅ Organization: ${org.name} (${orgId.slice(0, 8)}...)`);

  // Create policies
  const policies = [
    {
      name: 'allow-pro-features',
      description: 'Allow pro/enterprise plans to access premium features',
      effect: 'allow', priority: 100, active: true,
      conditions: [{ field: 'plan', operator: 'in', value: ['pro', 'enterprise'] }, { field: 'action', operator: 'not_equals', value: 'admin' }],
      organizationId: orgId,
    },
    {
      name: 'deny-free-export',
      description: 'Deny free plan access to export feature',
      effect: 'deny', priority: 90, active: true,
      conditions: [{ field: 'plan', operator: 'equals', value: 'free' }, { field: 'action', operator: 'equals', value: 'export' }],
      organizationId: orgId,
    },
    {
      name: 'allow-admin-all',
      description: 'Allow admin role full access to all resources',
      effect: 'allow', priority: 200, active: true,
      conditions: [{ field: 'role', operator: 'equals', value: 'admin' }],
      organizationId: orgId,
    },
  ];

  for (const p of policies) {
    const res = await fetch(`${API}/policies`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    });
    const created = await res.json();
    console.log(`✅ Policy: ${created.name}`);
  }

  // Create entities
  const entities = [
    { externalId: 'user-123', type: 'user', attributes: { plan: 'pro', role: 'admin', email: 'alice@acme.com' }, organizationId: orgId },
    { externalId: 'service-api', type: 'service', attributes: { environment: 'production', version: '2.1.0' }, organizationId: orgId },
  ];

  for (const e of entities) {
    const res = await fetch(`${API}/entities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e),
    });
    const created = await res.json();
    console.log(`✅ Entity: ${created.externalId} (${created.type})`);
  }

  // Create resources
  const resources = [
    { type: 'document', name: 'Q4 Report', description: 'Quarterly financial report', attributes: { department: 'finance', sensitivity: 'confidential' }, organizationId: orgId },
    { type: 'api', name: 'v1/evaluate', description: 'Policy evaluation endpoint', attributes: { rate_limit: '1000/min' }, organizationId: orgId },
  ];

  for (const r of resources) {
    const res = await fetch(`${API}/resources`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r),
    });
    const created = await res.json();
    console.log(`✅ Resource: ${created.name} (${created.type})`);
  }

  console.log('\n🎉 Seed complete! All demo data created.');
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
