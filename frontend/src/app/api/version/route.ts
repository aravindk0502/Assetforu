export const runtime = 'nodejs';

function envTrue(raw: string | undefined) {
  if (!raw) return false;
  return ['true', '1', 'yes', 'y', 'on'].includes(raw.trim().toLowerCase());
}

export async function GET() {
  return Response.json({
    ok: true,
    vercel: {
      git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      git_commit_message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    },
    config: {
      admin_phones_configured: Boolean(process.env.ADMIN_PHONES),
      dev_otp_enabled: envTrue(process.env.DEV_OTP_ENABLED),
      dev_otp_code_configured: Boolean(process.env.DEV_OTP_CODE),
      msg91_configured: Boolean(process.env.MSG91_API_KEY && process.env.MSG91_TEMPLATE_ID),
    },
  });
}

