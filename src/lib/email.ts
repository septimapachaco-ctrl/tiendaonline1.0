import "server-only";
import nodemailer from "nodemailer";
import { site } from "./site";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] (SMTP no configurado) Para: ${to} | Asunto: ${subject}`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || site.name, to, subject, html });
  } catch (err) {
    console.error("[email] Error enviando a", to, err);
  }
}
