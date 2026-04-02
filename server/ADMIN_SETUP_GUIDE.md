# 🛡️ Evacu3D Administrator Setup Guide

This document serves as the complete technical reference for the Evacu3D administrative initialization system.

## 1. System Overview
The administrative setup is the first layer of security for the Evacu3D platform. It ensures that the first user created is a trusted "Master Administrator" who can then approve or reject all future signups.

## 2. Initialization Logic
On every server startup (`npm run dev` or `node index.js`), the following logic executes:
1. The server connects to **MongoDB**.
2. It counts users with the role `admin`.
3. If the count is **0**, it attempts initialization:
   - **Priority 1**: Checks `.env` for `MASTER_ADMIN_EMAIL` and `MASTER_ADMIN_PASSWORD`.
   - **Priority 2**: If no environment variables exist, it generates a **1-hour Setup Key** and saves it to the `systemconfigs` collection in MongoDB.

## 3. Setup Methods

### Method A: Environment Variables
Ideal for production deployments where terminal access is limited.
1. Add these lines to your `.env` file:
   ```env
   MASTER_ADMIN_EMAIL=admin@example.com
   MASTER_ADMIN_PASSWORD=StrongPassword123!
   ```
2. Restart the server.
3. The server will log: `✅ Admin initialized from environment variables`.

### Method B: Web Setup Page (Interactive)
Ideal for standard local setup.
1. Ensure no Admin credentials are in your `.env`.
2. Restart the server and find the **Setup Key** in your terminal logs.
3. Navigate to `http://localhost:5173/setup`.
4. Enter the key and your desired admin credentials.

## 4. Troubleshooting

### "Invalid Setup Key" or "Key Expired"
- **Cause**: The key you entered doesn't match the one in the `systemconfigs` MongoDB collection, or the 60-minute window has passed.
- **Fix**: Restart the server to generate a fresh key and refresh the browser page.

### "Database Error"
- **Cause**: Likely a conflict with an existing user email. 
- **Fix**: Use the "Reset Command" below to clear all users and start fresh.

## 5. Maintenance & Reset
To completely wipe the administration state and start the setup flow from zero, run this command in the `server` directory:

```cmd
npx ts-node -e "import mongoose from 'mongoose'; import dotenv from 'dotenv'; dotenv.config(); import { UserModel, SystemConfigModel } from './models'; const run = async () => { try { await mongoose.connect(process.env.MONGODB_URI!); await UserModel.deleteMany({}); await SystemConfigModel.deleteMany({}); console.log('✅ SYSTEM RESET SUCCESSFUL.'); } finally { process.exit(0); } }; run();"
```

## 6. Password Policy
All administrator and user passwords must meet the following "Hardened" requirements:
- Minimum **8 characters**.
- At least one **Uppercase** letter.
- At least one **Lowercase** letter.
- At least one **Number**.
- At least one **Special Character** (@, $, !, etc).
