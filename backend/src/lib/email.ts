import { Resend } from "resend";
import { getEnv } from "./env";
import { logger } from "./logger";

export interface InvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

export interface PasswordResetEmailParams {
  to: string;
  recipientName: string;
  resetUrl: string;
  expiresAt: Date;
}

export type EmailResult = {
  delivered: boolean;
  status: "sent" | "failed" | "not_configured";
  providerMessageId?: string;
  reason?: string;
};

export function toPersistedDeliveryStatus(status: EmailResult["status"]): "pending" | "sent" | "failed" | "configuration_error" {
  switch (status) {
    case "sent":
      return "sent";
    case "failed":
      return "failed";
    case "not_configured":
      return "configuration_error";
    default:
      return "pending";
  }
}

let resendClient: Resend | null | undefined;

function getResendClient(): Resend | null {
  if (resendClient !== undefined) return resendClient;

  const env = getEnv();
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    resendClient = null;
    return resendClient;
  }

  resendClient = new Resend(env.RESEND_API_KEY);
  return resendClient;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatExpiry(value: Date): string {
  return value.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function buildEmailShell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;padding:32px 16px;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;">${title}</h1>
      ${body}
    </main>
  </body>
</html>`;
}

function buildActionButton(label: string, url: string): string {
  return `<p style="margin:24px 0;text-align:center;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">${escapeHtml(label)}</a></p>`;
}

function buildInvitationHtml(params: InvitationEmailParams): string {
  const inviter = escapeHtml(params.inviterName);
  const workspace = escapeHtml(params.workspaceName);
  const role = escapeHtml(params.role);
  const acceptUrl = escapeHtml(params.acceptUrl);
  const expiry = escapeHtml(formatExpiry(params.expiresAt));

  return buildEmailShell(
    `You are invited to join ${workspace}`,
    `<p style="margin:0;font-size:15px;line-height:1.6;"><strong>${inviter}</strong> has invited you to collaborate in <strong>${workspace}</strong> as a <strong>${role}</strong>.</p>
     ${buildActionButton("Accept invitation", params.acceptUrl)}
     <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">This invitation expires on <strong>${expiry}</strong> and can only be used once. If the button does not work, copy this link into your browser:</p>
     <p style="margin:8px 0 0;word-break:break-all;font-size:12px;color:#64748b;">${acceptUrl}</p>
     <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">If you were not expecting this invitation, you can safely ignore this email.</p>`,
  );
}

function buildInvitationText(params: InvitationEmailParams): string {
  return [
    `You are invited to join ${params.workspaceName}`,
    "",
    `${params.inviterName} has invited you to collaborate in ${params.workspaceName} as a ${params.role}.`,
    "",
    "Accept the invitation:",
    params.acceptUrl,
    "",
    `This invitation expires on ${formatExpiry(params.expiresAt)} and can only be used once.`,
    "",
    "If you were not expecting this invitation, you can safely ignore this email.",
  ].join("\n");
}

function buildPasswordResetHtml(params: PasswordResetEmailParams): string {
  const recipientName = escapeHtml(params.recipientName);
  const resetUrl = escapeHtml(params.resetUrl);
  const expiry = escapeHtml(formatExpiry(params.expiresAt));

  return buildEmailShell(
    "Reset your Axiom password",
    `<p style="margin:0;font-size:15px;line-height:1.6;">Hello ${recipientName},</p>
     <p style="font-size:15px;line-height:1.6;">We received a request to reset your Axiom password. Use the link below to choose a new password.</p>
     ${buildActionButton("Reset password", params.resetUrl)}
     <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">This link expires on <strong>${expiry}</strong> and can only be used once. If the button does not work, copy this link into your browser:</p>
     <p style="margin:8px 0 0;word-break:break-all;font-size:12px;color:#64748b;">${resetUrl}</p>
     <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>`,
  );
}

function buildPasswordResetText(params: PasswordResetEmailParams): string {
  return [
    "Reset your Axiom password",
    "",
    `Hello ${params.recipientName},`,
    "",
    "We received a request to reset your Axiom password. Use the link below to choose a new password:",
    params.resetUrl,
    "",
    `This link expires on ${formatExpiry(params.expiresAt)} and can only be used once.`,
    "",
    "If you did not request a password reset, you can safely ignore this email.",
  ].join("\n");
}

async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const env = getEnv();
  const client = getResendClient();

  if (!client || !env.RESEND_FROM_EMAIL) {
    logger.warn({ to: input.to, subject: input.subject }, "Email delivery is not configured");
    return { delivered: false, status: "not_configured", reason: "Email delivery is not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error || !data?.id) {
      const reason = error?.message || "Resend did not return a delivery identifier";
      logger.error({ to: input.to, error: reason }, "Resend delivery failed");
      return { delivered: false, status: "failed", reason };
    }

    return { delivered: true, status: "sent", providerMessageId: data.id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Resend error";
    logger.error({ to: input.to, error: reason }, "Resend delivery failed");
    return { delivered: false, status: "failed", reason };
  }
}

export function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  return sendMail({
    to: params.to,
    subject: `You are invited to join ${params.workspaceName}`,
    html: buildInvitationHtml(params),
    text: buildInvitationText(params),
  });
}

export function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<EmailResult> {
  return sendMail({
    to: params.to,
    subject: "Reset your Axiom password",
    html: buildPasswordResetHtml(params),
    text: buildPasswordResetText(params),
  });
}
