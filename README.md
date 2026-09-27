# SALOON admin website

Run these commands inside `admin/`:

```powershell
npm install
npm run dev
```

Open http://localhost:3000. If `.env.local` is missing, copy `.env.example` to it. `NEXT_PUBLIC_API_URL` points to the backend API (normally `http://localhost:4000/api`). Start the database and backend in separate terminals first.

Use `npm run lint` and `npm run build` to check the website. On PowerShell systems that block script execution, use `npm.cmd`.

See [the project setup guide](../backend/README.md) for development login credentials, API startup, salon policies and the acceptance checklist. Dependencies, environment files, and formatting configuration live within this folder.
