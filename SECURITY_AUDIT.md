# Axiom Backend Security Audit

**Audit scope:** Authentication, public registration, invitation acceptance, organization roles, tenant-scoped routes, API keys, billing, webhooks, sessions, and background cleanup.  
**Audit date:** 2026-08-13  
**Status:** Confirmed findings in scope have been remediated and validated against the local preview database.

## Role model after remediation

| Role | Intended capabilities | Enforced server-side |
|---|---|---|
| **Owner** | Create a workspace, manage its organization settings, billing, team, invitations, API keys, policies, entities, resources, and assignments. | Yes |
| **Admin** | Manage team invitations, API keys, policies, entities, resources, and assignments. | Yes |
| **Member** | Read organization workspace data and use permitted evaluation flows. Members cannot change workspace records, organization settings, API keys, billing, team membership, or policy assignments. | Yes |

> **Trust boundary:** A person may select a role on the public sign-up screen, but the server remains authoritative. Public registration creates only a new owner workspace. Admin and member roles are issued only through an existing organization’s invitation token.

## Confirmed findings and fixes

| ID | Severity | Finding | Remediation |
|---|---:|---|---|
| AX-01 | High | Authenticated members could create, modify, and delete policies, entities, resources, API keys, and policy assignments because those routes required only a valid session. | Added a workspace-manager guard (`owner` or `admin`) to all workspace-mutating routes and API-key routes. |
| AX-02 | High | Any member in an organization could modify organization settings and initiate billing actions. | Restricted organization updates and all billing reads/actions to owners. |
| AX-03 | High | `GET /policies/:id/versions` did not verify that the policy belonged to the caller’s organization, allowing a guessed cross-tenant policy identifier to disclose version history. | Added a tenant-scoped policy lookup before returning versions; unauthorized and missing records return `404`. |
| AX-04 | High | Policy-assignment read and mutation routes did not verify that the target entity was in the caller’s organization. | Added tenant-scoped entity and policy checks before listing, creating, or removing assignments; assignment mutations now require owner/admin. |
| AX-05 | Medium | Public registration created a new organization but relied on the database default `member` role, leaving the creator without owner capability. | Registration now uses validated input, creates the organization and founder atomically, explicitly persists the founder as `owner`, and emits an audit event. |
| AX-06 | Medium | The frontend role selector in team settings could imply that roles were freely self-service and exposed management controls to members. | Moved the visible role selection to sign-up, rendered current roles as badges in settings, and hid invite/removal controls from members. Invitation role is displayed but locked. |
| AX-07 | Medium | The signed Stripe webhook could receive an already-parsed body because JSON middleware ran first, which breaks signature verification. | Registered a raw-body parser for `/api/billing/webhook` before JSON parsing and removed the unnecessary URL-encoded API body parser. |
| AX-08 | Low | The cleanup endpoint used web-standard request types in an Express handler, causing compile errors and incorrect `headers.get()` usage. Invitation route parameters also had incorrect union typing. | Corrected cleanup handler types/returns and Express header access; corrected invitation route parameter typing. The backend typecheck now passes. |

## Validation evidence

| Scenario | Expected | Observed |
|---|---:|---:|
| Public owner registration | `201` | `201` |
| Public request for `admin` role | `403` | `403` |
| Owner creates policy | `200` | `200` |
| Owner invites a member | `201` | `201` |
| Invited member accepts token | `201` | `201` |
| Accepted member attempts entity mutation | `403` | `403` |
| Accepted member attempts policy mutation | `403` | `403` |
| Accepted member retrieves session | `200`, role `member` | `200`, role `member` |
| Another organization requests policy-version history by ID | `404` | `404` |
| Backend TypeScript validation | No errors | Passed |
| Frontend production build | Successful bundle | Passed (2,249 modules transformed) |

All test organizations, accounts, invitations, policies, sessions, and associated records created during the audit were removed after validation.

## Operational recommendations

The application should keep deployment secrets (`DATABASE_URL`, cookie/JWT secrets, Resend, and Stripe credentials) in the hosting platform’s secret manager, not source control. Production should use HTTPS and a narrowly scoped `FRONTEND_URL`. Database migrations should be applied before each deployment, and the invitation/password-reset URL configuration should point only to approved frontend origins.

This audit validates the in-scope routes and role boundaries. It does not replace periodic dependency scanning, infrastructure review, application penetration testing, or a formal independent security assessment.
