# SALOON admin website

Run these commands inside `admin/`:

```powershell
npm install
npm run dev
```

Open http://localhost:3000 for the public salon landing page. Staff sign in at http://localhost:3000/workspace. If `.env.local` is missing, copy `.env.example` to it. `NEXT_PUBLIC_API_URL` points to the backend API (normally `http://localhost:4000/api`). Start the database and backend in separate terminals first.

The public page includes category filters, service details, stylists, opening hours, and booking guidance. Services, staff, prices, and salon policies come from the API. Customers submit bookings through SALOON BOOK; the landing page does not create bookings. Editorial photos are stored in `public/images`; replace these with the salon's own photography when available.

Use `npm run lint` and `npm run build` to check the website. On PowerShell systems that block script execution, use `npm.cmd`.

See [the project setup guide](../backend/README.md) for development login credentials, API startup, salon policies and the acceptance checklist. Dependencies, environment files, and formatting configuration live within this folder.
