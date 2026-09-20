# AAA Data Solutions — Comprehensive End-to-End QA Testing Suite

> **Document Version:** 1.0  
> **Environment:** Local / Staging / Production (`onedashboard.aaadatasolutions.com`)  
> **Target Roles:** Super Admin, Client Admin, Client Member, Invitee  

---

## 📋 Table of Contents
1. [Pre-Testing Database Reset](#phase-0--database-clean-slate--setup)
2. [Test Personas & Test Credentials](#test-personas)
3. [Phase 1: Super Admin Portal Initial Verification](#phase-1-super-admin-portal-initial-verification)
4. [Phase 2: Organization Creation & Onboarding](#phase-2-organization-creation--onboarding)
5. [Phase 3: Property & Service Provisioning](#phase-3-property--service-provisioning)
6. [Phase 4: Firelines & Elevator Emergency Lines](#phase-4-firelines--elevator-emergency-lines)
7. [Phase 5: Porting Request & Activation Flow](#phase-5-porting-request--activation-flow)
8. [Phase 6: Support Ticket Lifecycle & Live Comments](#phase-6-support-ticket-lifecycle--live-comments)
9. [Phase 7: E911 & Ray Baum / Kary's Law Compliance](#phase-7-e911--ray-baum--karys-law-compliance)
10. [Phase 8: Team Invitations & Link Acceptance](#phase-8-team-invitations--link-acceptance)
11. [Phase 9: Role-Based Access Control & Security Guards](#phase-9-role-based-access-control--security-guards)
12. [Phase 10: Audit Trail & Activity Logs](#phase-10-audit-trail--activity-logs)

---

## Phase 0: Database Clean Slate & Setup

### SQL Query to Wipe All Data Except Profiles & Auth
Run the following SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- ==============================================================================
-- AAA Data Solutions — Full Data Reset (Preserving Profiles & Auth Users)
-- ==============================================================================
BEGIN;

-- 1. Clear Notifications & Audit Logs
DELETE FROM public.notifications;
DELETE FROM public.audit_logs;

-- 2. Clear Invitations
DELETE FROM public.invitations;

-- 3. Clear Support Tickets & Comments
DELETE FROM public.ticket_comments;
DELETE FROM public.ticket_attachments;
DELETE FROM public.tickets;

-- 4. Clear Porting Requests & Attachments
DELETE FROM public.porting_attachments;
DELETE FROM public.porting_requests;

-- 5. Clear Onboarding Workflows
DELETE FROM public.onboardings;

-- 6. Clear Compliance & Emergency Lines
DELETE FROM public.ray_baum_records;
DELETE FROM public.fire_lines;
DELETE FROM public.elevator_lines;

-- 7. Clear Property Services & Services
DELETE FROM public.organization_property_services;
DELETE FROM public.services;

-- 8. Clear Property Relationships & Properties
DELETE FROM public.property_contacts;
DELETE FROM public.organization_properties;
DELETE FROM public.properties;

-- 9. Clear Organization Members & Organizations
DELETE FROM public.organization_members;
DELETE FROM public.organizations;

COMMIT;

-- Verify Clean Slate:
SELECT 'organizations' as tbl, count(*) FROM public.organizations
UNION ALL SELECT 'properties', count(*) FROM public.properties
UNION ALL SELECT 'tickets', count(*) FROM public.tickets
UNION ALL SELECT 'porting_requests', count(*) FROM public.porting_requests
UNION ALL SELECT 'invitations', count(*) FROM public.invitations
UNION ALL SELECT 'profiles (PRESERVED)', count(*) FROM public.profiles;
```

---

## Test Personas

| Persona | Role | Email | Expected Access |
|---|---|---|---|
| **Super Admin** | `SUPER_ADMIN` | `admin@aaadatasolutions.com` | Full platform control, `/admin/*` routes |
| **Client Org Admin** | `CLIENT_USER` (Org `ADMIN`) | `client.owner@hotelgroup.com` | Organization billing, properties, invites, tickets |
| **Client Staff** | `CLIENT_USER` (Org `USER`) | `staff@hotelgroup.com` | View properties, submit tickets, view services |
| **New Invitee** | Unregistered / New Email | `teammate@hotelgroup.com` | Accepts invite URL, joins organization |

---

## Phase 1: Super Admin Portal Initial Verification

### Test 1.1: Super Admin Login
- [ ] Navigate to `/login`.
- [ ] Enter Super Admin credentials (`admin@aaadatasolutions.com`).
- [ ] **Expected Result:** Login succeeds without delay; automatically redirects to `/admin`.
- [ ] Admin Sidebar is visible showing: Overview, Organizations, Properties, Services (Services & Lines, Firelines, Elevator Lines), Onboarding, Porting, E911 Compliance, Support Tickets, Finances, Audit Logs, System Settings.

### Test 1.2: System Settings & Profile Update
- [ ] Navigate to `/admin/settings`.
- [ ] Edit **Full Name** and **Phone Number** in the Profile Settings tab.
- [ ] Click **Save Changes**.
- [ ] **Expected Result:** Success toast appears; reload page to confirm updated values persist.

### Test 1.3: Admin Team Invite Flow
- [ ] On `/admin/settings`, switch to **Admin Team Members** tab.
- [ ] Click **Invite Admin** button.
- [ ] Enter a test email: `subadmin.test@aaadatasolutions.com`, Role: `Admin`.
- [ ] Click **Send Invitation**.
- [ ] **Expected Result:** 
  - Modal **stays open** and displays **"Invitation Link Ready"**.
  - Direct invitation URL (`/invite/<token>`) is shown in the text field.
  - Delivery status indicates email status (or manual copy mode if test SMTP is active).
  - Click **Copy Link** -> toast confirms "Invitation URL copied to clipboard".
  - Click **Done** to close the modal.

---

## Phase 2: Organization Creation & Onboarding

### Test 2.1: Client Account Registration
- [ ] Open an Incognito window / separate browser.
- [ ] Navigate to `/signup`.
- [ ] Fill in:
  - Name: `Jordan Blake`
  - Email: `client.owner@hotelgroup.com`
  - Password: `Password123!`
  - Select: **Create Organization**
- [ ] Click **Continue to Organization Setup**.
- [ ] **Expected Result:** Account is registered; user is taken to the Organization Setup modal / page.

### Test 2.2: Initial Organization Setup
- [ ] Enter Organization details:
  - Organization Name: `Grand Horizon Hospitality Group`
  - Address: `1200 Ocean Boulevard`
  - City: `Miami`, State: `FL`, Zip: `33139`
  - Phone: `(305) 555-0199`
- [ ] Complete setup.
- [ ] **Expected Result:**
  - Organization is created in database (`organizations` & `organization_members` as `ADMIN`).
  - User lands on `/dashboard` with organization name displayed in the top navbar and sidebar.

### Test 2.3: Admin Verification of New Organization
- [ ] Switch to the Super Admin window.
- [ ] Navigate to `/admin/organizations`.
- [ ] **Expected Result:**
  - `Grand Horizon Hospitality Group` is listed with status `ACTIVE` or `PENDING_ONBOARDING`.
  - Metrics update: Total Organizations = 1.
- [ ] Click on the organization card to view `/admin/organizations/[id]`.
- [ ] Verify primary contact shows `Jordan Blake` (`client.owner@hotelgroup.com`).

---

## Phase 3: Property & Service Provisioning

### Test 3.1: Admin Creates First Property
- [ ] As Super Admin, navigate to `/admin/properties`.
- [ ] Click **Add Property**.
- [ ] Fill in:
  - Property Name: `The Grand Horizon Miami Resort`
  - Organization: Select `Grand Horizon Hospitality Group`
  - Street Address: `1200 Ocean Blvd`
  - City: `Miami`, State: `FL`, Zip: `33139`
  - General Manager Phone: `(305) 555-0101`
  - General Manager Email: `gm.miami@hotelgroup.com`
  - Ray Baum Status: `ACTIVE`
- [ ] Click **Save Property**.
- [ ] **Expected Result:** Property created and linked to `Grand Horizon Hospitality Group` in `organization_properties`.

### Test 3.2: Client Dashboard Property Verification
- [ ] As Client Admin (`client.owner@hotelgroup.com`), navigate to `/dashboard/properties`.
- [ ] **Expected Result:**
  - `The Grand Horizon Miami Resort` is visible in the client property list.
  - Property address, GM contact, and details match what Admin entered.

### Test 3.3: Provisioning Voice & Cloud PBX Service
- [ ] As Super Admin, navigate to `/admin/services`.
- [ ] Click **Add New Service**.
- [ ] Select Service Type: `Voice & Cloud PBX`.
- [ ] Select Property: `The Grand Horizon Miami Resort`.
- [ ] Enter Details:
  - Service Name: `Primary SIP Trunking & 100 DIDs`
  - Monthly Recurring Charge (MRC): `$450.00`
  - Status: `ACTIVE`
- [ ] Save Service.
- [ ] **Expected Result:** Service is created and mapped to property.
- [ ] Switch to Client: `/dashboard/services` -> verify Cloud PBX service is listed.

---

## Phase 4: Firelines & Elevator Emergency Lines

### Test 4.1: Adding a Dedicated Fire Alarm Line
- [ ] As Super Admin, navigate to `/admin/firelines`.
- [ ] Click **Add Fireline**.
- [ ] Fill in:
  - Property: `The Grand Horizon Miami Resort`
  - Device Type: `DACT Dual-Path Cellular / IP Communicator`
  - Circuit Phone Number: `(305) 555-FIRE (3473)`
  - Serial Number: `FL-MIA-99201`
  - Description: `Main North Tower Fire Alarm Control Panel`
- [ ] Click **Save Fireline**.
- [ ] **Expected Result:** Fireline appears in the Admin firelines table with active status.

### Test 4.2: Adding an Elevator Emergency Phone
- [ ] As Super Admin, navigate to `/admin/elevator-lines`.
- [ ] Click **Add Elevator Line**.
- [ ] Fill in:
  - Property: `The Grand Horizon Miami Resort`
  - Phone Number: `(305) 555-ELEV (3538)`
  - Extension: `Cab #4 (Guest West)`
  - Status: `ACTIVE`
  - Description: `Emergency hands-free auto-dialer compliant with ASME A17.1`
- [ ] Click **Save Elevator Line**.
- [ ] **Expected Result:** Elevator line saved and rendered in the table.

### Test 4.3: Client Side Emergency Line Visibility
- [ ] As Client, navigate to `/dashboard/services`.
- [ ] Expand Firelines and Elevator sections (or relevant service cards).
- [ ] **Expected Result:** Both emergency circuits display correctly with phone numbers and monitoring descriptors.

---

## Phase 5: Porting Request & Activation Flow

### Test 5.1: Client Submits Porting Request
- [ ] As Client Admin, navigate to `/dashboard/porting`.
- [ ] Click **Submit Porting Request**.
- [ ] Form details:
  - Property Name: `Grand Horizon Key West Resort`
  - Property Address: `501 Duval Street, Key West, FL 33040`
  - Main Billing Phone Number: `(305) 555-8800`
  - Current Carrier: `AT&T Business`
  - Upload LOA / Bill Attachment: Attach a test PDF or image (`test_bill.pdf`).
- [ ] Click **Submit Request**.
- [ ] **Expected Result:**
  - Success toast confirms porting request created.
  - Request appears in `/dashboard/porting` with status `SUBMITTED`.
  - Notification sent to Super Admin.

### Test 5.2: Super Admin Reviews Porting & Uploads FOC
- [ ] As Super Admin, navigate to `/admin/porting`.
- [ ] Locate the request for `Grand Horizon Key West Resort`.
- [ ] Click on the request to view details and download the attached bill/LOA.
- [ ] Advance Status: `SUBMITTED` → `SOF_REVIEW` → `FOC_CONFIRMED`.
- [ ] Enter FOC Cutover Date (e.g. 7 days from today).
- [ ] **Expected Result:** Status badge changes to `FOC Confirmed`; client sees real-time status update on their porting desk.

### Test 5.3: Property Activation from Porting Request
- [ ] In the porting detail view on Super Admin, mark status as `COMPLETED`.
- [ ] Click the **Activate Property** button.
- [ ] **Expected Result:**
  - System automatically creates a brand new property `Grand Horizon Key West Resort` under `Grand Horizon Hospitality Group`.
  - An onboarding record is initialized with 7 stage milestones.
  - Client property list `/dashboard/properties` now shows 2 properties.

---

## Phase 6: Support Ticket Lifecycle & Live Comments

### Test 6.1: Client Creates a Support Ticket
- [ ] As Client, navigate to `/dashboard/tickets`.
- [ ] Click **Create Ticket**.
- [ ] Fill in:
  - Property: `The Grand Horizon Miami Resort`
  - Category: `Voice / PBX Issue`
  - Priority: `HIGH`
  - Subject: `Front Desk SIP Phone Line 2 Static`
  - Description: `Front desk agents report crackling on extension 102 when receiving inbound guest calls.`
- [ ] Click **Submit Ticket**.
- [ ] **Expected Result:**
  - Ticket is created with status `OPEN`.
  - In-app notification bell rings for Super Admin.

### Test 6.2: Admin Replies via Conversation Drawer
- [ ] As Super Admin, navigate to `/admin/tickets`.
- [ ] Click on the newly created ticket to open the **Ticket Conversation Drawer**.
- [ ] Review client information, organization name, and property details.
- [ ] Type reply:
  - *"Our tier-2 telecom engineer is running a packet capture on SBC-02. Please verify if extension 103 is also affected."*
- [ ] Click **Send Reply**.
- [ ] Change ticket status to `IN_PROGRESS`.
- [ ] **Expected Result:** Comment is added with Admin badge; client receives update.

### Test 6.3: Client Verification & Ticket Resolution
- [ ] As Client, open the ticket drawer on `/dashboard/tickets`.
- [ ] Verify admin's comment appears immediately.
- [ ] Type client reply: *"Issue resolved after rebooting the phone switch. Thank you!"*
- [ ] As Admin, change status to `RESOLVED` and then `CLOSED`.
- [ ] **Expected Result:** Ticket moves to Closed filter; metrics recalculate resolved tickets count.

---

## Phase 7: E911 & Ray Baum / Kary's Law Compliance

### Test 7.1: Super Admin Compliance Audit
- [ ] As Super Admin, navigate to `/admin/e911`.
- [ ] Check top metrics:
  - Total Compliant Properties
  - Missing Dispatchable Locations
  - Active Ray Baum Records
- [ ] Locate `The Grand Horizon Miami Resort`.
- [ ] Click **Manage Records**.
- [ ] Add room-to-phone dispatchable location:
  - Phone Number: `(305) 555-0100 ext 401`
  - Room / Area: `Suite 401 - North Tower Presidential`
  - Location: `4th Floor, North Wing, 1200 Ocean Blvd`
- [ ] Save record.
- [ ] **Expected Result:** Ray Baum record saved; property compliance score remains 100%.

### Test 7.2: Client E911 View
- [ ] As Client, navigate to `/dashboard/e911`.
- [ ] Verify compliance badge displays **"Fully Compliant"** with FCC Ray Baum's Act and Kari's Law guidelines.

---

## Phase 8: Team Invitations & Link Acceptance

### Test 8.1: Client Admin Invites Organization Teammate
- [ ] As Client Admin (`client.owner@hotelgroup.com`), navigate to `/dashboard/account`.
- [ ] In the **Team Members** section, click **Invite Team Member**.
- [ ] Enter:
  - Email: `assistant.manager@hotelgroup.com`
  - Role: `User` (Staff / Operational Access)
- [ ] Click **Generate Invitation**.
- [ ] **Expected Result:**
  - Success message appears with the generated invite URL (`https://onedashboard.aaadatasolutions.com/invite/<token>`).
  - Click **Copy Link**.

### Test 8.2: Invitee Accepts Link in Clean Browser Session
- [ ] In a new private/incognito window, paste the copied invite URL:
  `http://localhost:3000/invite/<token>` (or `https://onedashboard.aaadatasolutions.com/invite/<token>`).
- [ ] **Expected Result:**
  - Page verifies the token and displays:
    - Organization Name: `Grand Horizon Hospitality Group`
    - Target Role: `Team Member`
    - Pre-filled Email: `assistant.manager@hotelgroup.com`
- [ ] Fill in Full Name: `Alex Rivera` and set Password: `Password123!`.
- [ ] Click **Accept Invitation & Create Account**.
- [ ] **Expected Result:**
  - Account is created in `auth.users` and `profiles`.
  - Member is automatically enrolled in `organization_members` with role `USER`.
  - Automatically logged in and directed to `/dashboard`.
  - Verify restricted permissions: Cannot see billing / organization invite settings reserved for `ADMIN`.

---

## Phase 9: Role-Based Access Control & Security Guards

### Test 9.1: Client User Attempting Admin Route
- [ ] While logged in as `assistant.manager@hotelgroup.com` (Client User):
- [ ] Manually navigate in the browser URL bar to: `/admin`.
- [ ] **Expected Result:**
  - Access is denied.
  - Middleware intercepts and redirects user back to `/dashboard` or shows 403 Forbidden.
- [ ] Try `/admin/finances`, `/admin/settings`, `/admin/tickets`.
- [ ] **Expected Result:** All `/admin/*` routes are blocked for non-super-admins.

### Test 9.2: Unauthenticated Access Guard
- [ ] Log out of all accounts.
- [ ] Try to open `/dashboard` directly.
- [ ] **Expected Result:** Redirected immediately to `/login`.
- [ ] Try to open `/admin` directly.
- [ ] **Expected Result:** Redirected immediately to `/login`.

---

## Phase 10: Audit Trail & Activity Logs

### Test 10.1: Super Admin Audit Log Review
- [ ] Log back in as Super Admin (`admin@aaadatasolutions.com`).
- [ ] Navigate to `/admin/audit-logs`.
- [ ] Filter by Action / Category:
  - `INVITATION_SENT`
  - `PROPERTY_CREATED`
  - `SERVICE_PROVISIONED`
  - `TICKET_STATUS_CHANGED`
- [ ] **Expected Result:**
  - Every action executed throughout Phase 1 to Phase 8 is chronologically recorded.
  - Each log shows: Timestamp, Actor Email, Action Type, Target Entity, and Changes JSON diff.

---

## ✅ QA Sign-Off Checklist

| # | Feature Area | Status | Tested By | Date | Notes |
|---|---|:---:|---|---|---|
| 1 | Database Clean Reset Query | [ ] | | | |
| 2 | Super Admin Auth & Navigation | [ ] | | | |
| 3 | Admin Settings & Team Invite Link Generator | [ ] | | | |
| 4 | Client Sign-up & Organization Creation | [ ] | | | |
| 5 | Property Creation & Organization Linking | [ ] | | | |
| 6 | Services (Cloud PBX, Firelines, Elevator) | [ ] | | | |
| 7 | Porting Request Submission & Activation | [ ] | | | |
| 8 | Support Ticket Drawer & Live Conversation | [ ] | | | |
| 9 | E911 & Ray Baum Phone-to-Room Mapping | [ ] | | | |
| 10 | Invite Link Acceptance Flow | [ ] | | | |
| 11 | Role Guards & Route Protection | [ ] | | | |
| 12 | Audit Logging of Administrative Actions | [ ] | | | |
