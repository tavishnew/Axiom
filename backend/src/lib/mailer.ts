import { Resend } from "resend";
import { getEnv } from "./env";
import { logger } from "./logger";

export type MailerResult = {
  status: "sent" | "not_configured" | "failed";
  error?: string;
};

function getResendClient(): Resend | null {
  const env = getEnv();
  if (!env.RESEND_API_KEY) return null;
  return new Resend(env.RESEND_API_KEY);
}

function getBaseUrl(envKey: "INVITE_BASE_URL" | "PASSWORD_RESET_BASE_URL"): string {
  const env = getEnv();
  const configured = env[envKey] ?? env.FRONTEND_URL ?? "http://localhost:3002";
  return configured.replace(/\/$/, "");
}

async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
}): Promise<MailerResult> {
  const client = getResendClient();
  if (!client || !from) {
    return { status: "not_configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from,
      to: [to],
      subject,
      html,
      text,
    });

    if (error || !data?.id) {
      const message = error?.message ?? "Resend returned no delivery identifier";
      logger.error({ to, subject, error: message }, "Resend email send failed");
      return { status: "failed", error: message };
    }

    return { status: "sent" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend error";
    logger.error({ to, subject, error: message }, "Resend email send crashed");
    return { status: "failed", error: message };
  }
}

export async function sendInviteEmail(to: string, inviteToken: string): Promise<MailerResult> {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { status: "not_configured" };
  }

  const inviteUrl = `${getBaseUrl("INVITE_BASE_URL")}/accept-invite?token=${encodeURIComponent(inviteToken)}`;
  const html = `
    <p>Hello,</p>
    <p>You have been invited to join Axiom.</p>
    <p><a href="${inviteUrl}">Accept invite</a></p>
    <p>Or open this link: ${inviteUrl}</p>
  `;

  return sendEmail({
    to,
    subject: "You are invited to join Axiom",
    html,
    text: `You have been invited to join Axiom. Accept the invite: ${inviteUrl}`,
    from: env.RESEND_FROM_EMAIL,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<MailerResult> {
  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { status: "not_configured" };
  }

  const resetUrl = `${getBaseUrl("PASSWORD_RESET_BASE_URL")}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const html = `
    <p>Hello,</p>
    <p>You requested a password reset for Axiom.</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>Or open this link: ${resetUrl}</p>
  `;

  return sendEmail({
    to,
    subject: "Reset your Axiom password",
    html,
    text: `Reset your Axiom password: ${resetUrl}`,
    from: env.RESEND_FROM_EMAIL,
  });
}
