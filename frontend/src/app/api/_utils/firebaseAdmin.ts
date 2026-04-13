import * as admin from 'firebase-admin';
import { requireServerEnv } from '@/app/api/_utils/security';

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccount(): FirebaseServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = JSON.parse(raw) as Partial<FirebaseServiceAccount>;
    if (!json?.project_id || !json?.client_email || !json?.private_key) return null;
    return json as FirebaseServiceAccount;
  } catch {
    return null;
  }
}

export function getFirebaseAdminApp(): admin.app.App | null {
  const svc = parseServiceAccount();
  if (!svc) return null;

  const existing = admin.apps?.[0];
  if (existing) return existing;

  try {
    const projectId = svc.project_id;
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail: svc.client_email,
        privateKey: svc.private_key,
      }),
      projectId,
    });
  } catch {
    return admin.apps?.[0] || null;
  }
}

export function requireFirebaseAdminApp(): admin.app.App {
  const app = getFirebaseAdminApp();
  if (!app) {
    requireServerEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
    throw new Error('Firebase Admin is not configured');
  }
  return app;
}

