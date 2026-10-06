import "server-only";

// Transactional email. Sends through Resend (https://resend.com/docs/api-reference/emails/send-email)
// when RESEND_API_KEY is set; otherwise prints the message to the server log
// so every flow (password reset, receipts…) still works in development.

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** Never throws: an email failure must not undo the action that triggered it. */
export async function sendEmail(email: Email): Promise<boolean> {
  const from = process.env.MAIL_FROM || "EMPEESS <onboarding@resend.dev>";
  if (!mailConfigured()) {
    console.info(`\n[mail] (not sent: RESEND_API_KEY is empty)\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email.to], subject: email.subject, html: email.html, text: email.text, reply_to: email.replyTo }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error("[mail] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[mail] send failed", error);
    return false;
  }
}

const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/+$/, "");
export const absoluteUrl = (path: string) => `${appUrl()}${path}`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * One branded layout for every email: heading, paragraphs, optional button and
 * optional pre-rendered rows (e.g. order lines). Inline styles only.
 */
export function layout(input: { heading: string; paragraphs: string[]; button?: { label: string; url: string }; rowsHtml?: string; footnote?: string }) {
  const p = input.paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46">${esc(t)}</p>`).join("");
  const button = input.button
    ? `<p style="margin:24px 0"><a href="${esc(input.button.url)}" style="display:inline-block;background:#1c45c2;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600">${esc(input.button.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#111">EMPEESS</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;letter-spacing:-0.02em;color:#111">${esc(input.heading)}</h1>
${p}${input.rowsHtml ?? ""}${button}
${input.footnote ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#71717a">${esc(input.footnote)}</p>` : ""}
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#a1a1aa">EMPEESS · Lagos, Nigeria</p>
</td></tr></table></body></html>`;
  const text = [input.heading, "", ...input.paragraphs, input.button ? `\n${input.button.label}: ${input.button.url}` : "", input.footnote ? `\n${input.footnote}` : ""]
    .filter((l) => l !== undefined)
    .join("\n");
  return { html, text };
}

export { esc as escapeHtml };
