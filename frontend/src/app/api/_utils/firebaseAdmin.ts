import * as admin from 'firebase-admin';
import { getServerEnv, requireServerEnv } from '@/app/api/_utils/security';

type FirebaseServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function parseServiceAccount(): FirebaseServiceAccount | null {
  const raw = getServerEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (raw) {
    try {
      const json = JSON.parse(raw) as Partial<FirebaseServiceAccount>;
      if (json?.project_id && json?.client_email && json?.private_key) {
        return {
          project_id: json.project_id,
          client_email: json.client_email,
          private_key: String(json.private_key).replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // ignore JSON parse errors and try split envs below
    }
  }

  const projectId = getServerEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getServerEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = getServerEnv('FIREBASE_PRIVATE_KEY');
  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: String(privateKey).replace(/\\n/g, '\n'),
  };
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
    // Accept either JSON blob or split env credentials.
    const hasJson = Boolean(getServerEnv('FIREBASE_SERVICE_ACCOUNT_JSON'));
    const hasSplit = Boolean(getServerEnv('FIREBASE_PROJECT_ID') && getServerEnv('FIREBASE_CLIENT_EMAIL') && getServerEnv('FIREBASE_PRIVATE_KEY'));
    if (!hasJson && !hasSplit) {
      requireServerEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
    }
    throw new Error('Firebase Admin is not configured');
  }
  return app;
}
