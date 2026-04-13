/**
 * emailService.js — Radanaras order email service
 *
 * Current state: fully structured, PDF-ready, SMTP stubbed.
 * To activate sending: install nodemailer + puppeteer, fill .env, remove TODO stubs.
 *
 * Activate:
 *   npm install nodemailer puppeteer
 *
 * Required .env variables (when ready):
 *   SMTP_HOST=smtp.example.com
 *   SMTP_PORT=587
 *   SMTP_USER=your@email.com
 *   SMTP_PASS=yourpassword
 *   SMTP_FROM_NAME=Radanaras MB
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ─── Data helpers ────────────────────────────────────────────────────────────

const dataRoot = path.join(__dirname, "data");

function readBucket(name) {
  const file = path.join(dataRoot, `${name}.json`);
  if (!fs.existsSync(file)) return name === "settings" ? {} : [];
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch { return name === "settings" ? {} : []; }
}

// ─── PDF generation ───────────────────────────────────────────────────────────

/**
 * Converts an HTML string to a PDF Buffer using Puppeteer.
 * Returns null if Puppeteer is not installed (graceful degradation).
 */
async function htmlToPdfBuffer(html) {
  // TODO: uncomment when `npm install puppeteer` has been run
  //
  // const puppeteer = require("puppeteer");
  // const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  // const page = await browser.newPage();
  // await page.setContent(html, { waitUntil: "networkidle0" });
  // const pdf = await page.pdf({ format: "A4", printBackground: true });
  // await browser.close();
  // return pdf;

  return null; // stub — returns null until Puppeteer is installed
}

// ─── Email body template ──────────────────────────────────────────────────────

function buildEmailBody({ orderNumber, carrierName, companyName, loadingDate, unloadingDate, route, carrierPrice }) {
  return `Gerbiamas Vežėjau,

Siunčiame transporto užsakymą Nr. ${orderNumber}.

Užsakymo detalės:
  Maršrutas:      ${route || "—"}
  Pakrovimo data: ${loadingDate || "—"}
  Iškrovimo data: ${unloadingDate || "—"}
  Frachtas:       ${carrierPrice || "—"}

Prašome patvirtinti užsakymo gavimą ir vykdymą atsakant į šį laišką.

Dokumentas pridėtas kaip PDF priedas${carrierPrice ? "" : " (bus atsiųstas atskirai)"}.

Pagarbiai,
${companyName || "Radanaras MB"}

──────────────────────────────────────
Šis laiškas sugeneruotas automatiškai.
Atsakykite tiesiogiai į šį adresą.`.trim();
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Prepares and (when SMTP is configured) sends the order document to the carrier.
 *
 * @param {object} options
 * @param {string} options.orderId       - Order ID to look up in orders.json
 * @param {string} options.documentHtml  - Fully rendered HTML of the document (tokens already replaced)
 * @param {string} [options.toEmail]     - Override carrier email (falls back to carrier record)
 * @returns {Promise<{success: boolean, message: string, payload: object}>}
 */
async function sendOrderToCarrier({ orderId, documentHtml, toEmail }) {
  // ── 1. Load data ────────────────────────────────────────────────────────────
  const orders   = readBucket("orders");
  const carriers = readBucket("carriers");
  const settings = readBucket("settings");

  const order = orders.find((o) => String(o.id) === String(orderId));
  if (!order) return { success: false, message: `Užsakymas ID ${orderId} nerastas.`, payload: null };

  const carrier = carriers.find((c) => String(c.id) === String(order.carrierId));

  // ── 2. Resolve addresses ────────────────────────────────────────────────────
  const recipientEmail = toEmail || carrier?.email || order.carrierEmail || null;
  if (!recipientEmail) {
    return { success: false, message: "Vežėjo el. paštas nenurodytas.", payload: null };
  }

  const senderEmail    = settings?.email?.from_address || null;
  const senderName     = settings?.email?.from_name    || settings?.company?.name || "Radanaras MB";
  const companyName    = settings?.company?.name       || "Radanaras MB";

  // ── 3. Generate PDF ─────────────────────────────────────────────────────────
  const pdfBuffer = documentHtml ? await htmlToPdfBuffer(documentHtml) : null;

  // ── 4. Assemble email payload ───────────────────────────────────────────────
  const subject = `Transporto užsakymas ${order.orderNumber || order.id}`;
  const body    = buildEmailBody({
    orderNumber:  order.orderNumber || order.id,
    carrierName:  carrier?.name     || order.carrierName || "Vežėjas",
    companyName,
    loadingDate:  order.loadingDate,
    unloadingDate: order.unloadingDate,
    route:        order.route,
    carrierPrice: order.carrierPrice ? `${Number(order.carrierPrice).toFixed(2)} EUR` : null,
  });

  const emailPayload = {
    from:    senderEmail ? `"${senderName}" <${senderEmail}>` : null,
    to:      recipientEmail,
    subject,
    text:    body,
    attachments: pdfBuffer
      ? [{ filename: `uzsakymas_${order.orderNumber || order.id}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
      : [],
  };

  // ── 5. Send via SMTP ────────────────────────────────────────────────────────
  // TODO: uncomment when nodemailer is installed and .env is configured
  //
  // if (!senderEmail) return { success: false, message: "SMTP siuntėjo adresas nenurodytas nustatymuose.", payload: emailPayload };
  //
  // const nodemailer = require("nodemailer");
  // const transporter = nodemailer.createTransport({
  //   host:   process.env.SMTP_HOST,
  //   port:   Number(process.env.SMTP_PORT) || 587,
  //   secure: Number(process.env.SMTP_PORT) === 465,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // await transporter.sendMail(emailPayload);

  // ── 6. Return result ────────────────────────────────────────────────────────
  return {
    success: true,
    message: `Paruošta (SMTP dar neprijungtas). Gavėjas: ${recipientEmail}`,
    payload: {
      ...emailPayload,
      // Don't leak the PDF buffer in API responses — just confirm it was generated
      attachments: emailPayload.attachments.map((a) => ({ filename: a.filename, size: a.content?.length ?? 0 })),
    },
  };
}

module.exports = { sendOrderToCarrier };
