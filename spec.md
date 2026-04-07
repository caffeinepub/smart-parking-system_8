# Smart Parking System

## Current State
Project has scaffolded files and authorization component selected. No application logic exists yet.

## Requested Changes (Diff)

### Add
- Admin authentication (username: admin, password: admin)
- Customer registration and login
- Parking slot management (add/remove, vehicle type: 2-wheeler or 4-wheeler)
- Pricing settings (₹ per hour for 2-wheeler and 4-wheeler)
- Vehicle entry/exit session tracking with timestamps
- Real-time session timer for active parkings
- Receipt generation (vehicle number, entry time, exit time, duration, cost)
- Admin dashboard with KPIs: Today's Income, Monthly Income, Active Sessions
- Parking slot grid (green = available, red = occupied)
- Session history table for admin (all sessions)
- Customer history (own sessions only)
- Income reporting: today and month totals

### Modify
- Nothing (fresh build)

### Remove
- Nothing

## Implementation Plan
1. Backend: slots store, pricing store, sessions store, users store
2. Backend APIs: admin CRUD for slots/pricing, session start/end, receipt fetch, income reports
3. Frontend: Login/Register page, Admin dashboard (slots grid, KPIs, sessions table, slot mgmt, pricing), Customer dashboard (available slots, active session timer, receipt, history)
