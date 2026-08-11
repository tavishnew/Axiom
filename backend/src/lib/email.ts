import { Resend } from "resend";
import { getEnv } from "./env";
import { logger } from "./logger";

let resend: Resend | null = null;
function getResend(): Resend | null {
  const env = getEnv();
  if (!env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(env.RESEND_API_KEY);
  return resend;
}

export interface InvitationEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

function formatExpiry(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const TAG_END = "</";

function buildInvitationHtml(p: InvitationEmailParams): string {
  const inviter = escapeHtml(p.inviterName);
  const ws = escapeHtml(p.workspaceName);
  const role = escapeHtml(p.role);
  const url = escapeHtml(p.acceptUrl);
  const exp = escapeHtml(formatExpiry(p.expiresAt));
  const title = "You're invited to join " + ws;
  const introLine1 =
    "<strong>" + inviter + TAG_END + "strong> has invited you to collaborate on " +
    "<strong>" + ws + TAG_END + "strong> as a <strong>" + role + TAG_END + "strong>.";
  const button =
    "<a href=\"" + url + "\" style=\"display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;\">Accept Invitation</a>";
  const expiryNote =
    "This invitation expires on <strong>" + exp + TAG_END + "strong> and can only be used once. " +
    "If the button doesn't work, copy this link into your browser:";
  const tabs = TAG_END + "td" + ">" + TAG_END + "tr" + ">";
  const closeStyle = TAG_END + "td" + ">";
  return [
    "<!doctype html>",
    "<html><body style=\"margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f8fafc;padding:32px 16px;color:#0f172a;\">",
    "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" style=\"max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;\">",
    "<tr><td style=\"padding:32px 32px 16px 32px;\">",
    "<h1 style=\"margin:0;font-size:20px;font-weight:600;color:#0f172a;\">" + title + "</h1>",
    "<p style=\"margin:16px 0 0 0;font-size:15px;line-height:1.55;color:#334155;\">" + introLine1 + TAG_END + "p>",
    "<p style=\"margin:24px 0 0 0;text-align:center;\">" + button + TAG_END + "p>",
    "<p style=\"margin:24px 0 0 0;font-size:13px;color:#64748b;line-height:1.55;\">" + expiryNote + TAG_END + "p>",
    "<p style=\"margin:8px 0 0 0;font-size:12px;word-break:break-all;color:#94a3b8;\">" + url + TAG_END + "p>",
    closeStyle + tabs,
    "<tr><td style=\"padding:16px 32px 32px 32px;border-top:1px solid #e2e8f0;\">",
    "<p style=\"margin:0;font-size:12px;color:#94a3b8;\">If you didn't expect this invitation you can safely ignore this email</p>",
    TAG_END + "td" + ">" + TAG_END + "tr" + ">",
    TAG_END + "table" + ">" + TAG_END + "body" + ">" + TAG_END + "html" + ">",
  ].join("");
}

function buildInvitationText(p: InvitationEmailParams): string {
  return [
    "You're invited to join " + p.workspaceName,
    "",
    p.inviterName + ' has invited you to collaborate on "' + p.workspaceName + '" as a ' + p.role + '.',
    "",
    "Accept the invitation:",
    p.acceptUrl,
    "",
    "This invitation expires on " + formatExpiry(p.expiresAt) + " and can only be used once.",
    "",
    "If you didn't expect this invitation you can safely ignore this email.",
  ].join("\n");
}

export async function sendInvitationEmail(
  params: InvitationEmailParams,
): Promise<{ delivered: boolean; reason?: string }> {
  const env = getEnv();
  const client = getResend();
  const from = env.RESEND_FROM_EMAIL || "noreply@axiom.local";
  const subject = "You're invited to join " + params.workspaceName;

  if (!client) {
    logger.info(
      { to: params.to, subject, acceptUrl: params.acceptUrl, workspace: params.workspaceName, role: params.role },
      "[invitation email - RESEND_API_KEY not set, not delivered]",
    );
    return { delivered: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const result = await client.emails.send({
      from,
      to: params.to,
      subject,
      html: buildInvitationHtml(params),
      text: buildInvitationText(params),
    });
    if ((result as { error?: unknown }).error) {
      const msg = String(
        (result as { error?: { message?: string } }).error?.message || "Resend rejected send",
      );
      logger.error({ to: params.to, error: msg }, "Invitation email failed");
      return { delivered: false, reason: msg };
    }
    return { delivered: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Resend error";
    logger.error({ to: params.to, error: msg }, "Invitation email threw");
    return { delivered: false, reason: msg };
  }
}