# LifeLine Hospital Console

A TanStack Start + React + TypeScript hospital console for emergency blood requests and live donor approval.

## 1. Install and configure

You need Node.js 22+ and npm.

```powershell
npm install
```

Copy `.env.example` to `.env` in the project root. In `.env`, add your MongoDB Atlas connection string and a new private session secret.

Example structure (replace the placeholders; do not share this file):

```env
MONGODB_URI=mongodb+srv://DB_USERNAME:URL_ENCODED_PASSWORD@cluster0.vkif1y4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DATABASE=lifeline_hospital
AUTH_SESSION_SECRET=your_private_random_secret_at_least_32_characters
```

The app explicitly selects the `lifeline_hospital` database through `MONGODB_DATABASE`, even when the Atlas URI has no database name after `.net/`.

In MongoDB Atlas, make sure:

- Your database user has read/write access to `lifeline_hospital`.
- Network Access allows your current public IP address.
- The username and password are the Atlas **database user** credentials, not your Atlas website login.
- If the password contains special characters, URL-encode it before putting it in the URI.

Generate a session secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep `.env` private. It is ignored by Git.

## 2. Test the Atlas connection

Before starting the website, run:

```powershell
npm run test:mongodb
```

A successful test prints `SUCCESS: Connected to MongoDB Atlas`, the database name, and the cluster host. The script disconnects after the test.

## 3. Start the application

```powershell
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:3000).

## 4. MongoDB-backed features

- Authentication: registration and login users are stored in MongoDB; passwords are hashed with Node.js `scrypt`.
- Patients: list, create, retrieve, update, and delete operations use the `patients` collection.
- Blood requests: create, list, donor simulation actions, cancellation, and completed history use the `bloodrequests` collection.
- Relationships: each blood request stores a required MongoDB ObjectId reference to a patient.

The donor names and responses in this project are simulated demo data. The app persists those demo donor states with each blood request; it does not connect to a real donor-notification service.

## 5. API endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Patients

- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/:patientId`
- `PUT /api/patients/:patientId`
- `DELETE /api/patients/:patientId`

### Blood requests

- `GET /api/blood-requests`
- `POST /api/blood-requests`
- `PATCH /api/blood-requests` — donor actions and cancellation

## 6. Verify patient database operations

Start the app in one terminal. In a second terminal, run:

```powershell
npm run test:database
npm run test:get-api
npm run test:post-api
npm run test:put-api
```

These verification scripts create temporary patient records and clean them up where applicable.

## 7. Production build

```powershell
npm run build
npm run preview
```
