import * as nodemailer from 'nodemailer';
import * as path from 'path';
import { Injectable } from '@nestjs/common';
import { Device } from '../config/devices';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  constructor(private settingsService: SettingsService) {}

  private async getEmailRecipients(): Promise<string> {
    const raw = await this.settingsService.get('email_recipients');
    if (!raw) return process.env.MAIL_TO || '';
    
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(r => r.email).filter(Boolean).join(', ');
      }
    } catch {
      return raw;
    }
    return process.env.MAIL_TO || '';
  }

  private getEmailTemplate(title: string, banner: string, content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background-color: #000000; padding: 40px 20px; margin: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; background-color: #101828; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .header { padding: 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; }
    .banner { padding: 24px 32px; }
    .content { padding: 32px; }
    .card { background-color: rgba(0,0,0,0.35); border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,0.05); }
    .footer { padding: 24px 32px; background-color: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05); text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    td.label { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; width: 40%; }
    td.value { color: #ffffff; font-size: 14px; font-weight: bold; text-align: right; }
    
    @media only screen and (max-width: 600px) {
      body { padding: 0 !important; }
      .container { width: 100% !important; border-radius: 0 !important; border: none !important; }
      .header, .banner, .content, .footer { padding: 20px !important; }
      .card { padding: 16px !important; }
      td { display: block; width: 100% !important; text-align: left !important; padding: 6px 0 !important; border-bottom: none !important; }
      td.label { padding-bottom: 0 !important; }
      td.value { padding-top: 2px !important; padding-bottom: 16px !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; text-align: left !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 20px; color: #ffffff; letter-spacing: 0.5px; display: flex; align-items: center; justify-content: center;">
        <img src="cid:mesra-logo" alt="Mesra Logo" style="width: 28px; height: 28px; margin-right: 12px; border-radius: 6px;" />
        Mesra Network Monitoring
      </h1>
      <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">Network Alert System</p>
    </div>
    ${banner}
    <div class="content">
      <div class="card">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0; font-size: 11px; color: #475569;">Automated diagnostic message from Mesra Network Monitoring.</p>
    </div>
  </div>
</body>
</html>`;
  }

  async sendDownAlert(device: Device, detectedAt = new Date(), failedAttempts = 3) {
    const to = await this.getEmailRecipients();
    if (!to) return;

    const dateStr = detectedAt.toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar', timeZoneName: 'short',
    });

    const banner = `
      <div class="banner" style="background-color: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444;">
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #ef4444; text-transform: uppercase;">Critical Alert</div>
        <h2 style="margin: 6px 0 0; font-size: 22px; color: #ef4444; letter-spacing: 0.5px;">DEVICE OFFLINE</h2>
        <p style="margin: 8px 0 0; font-size: 14px; color: #e2e8f0;">The device stopped responding to ping requests.</p>
      </div>`;

    const content = `
      <table>
        <tr><td class="label">Device Name</td><td class="value">${device.name}</td></tr>
        <tr><td class="label">Device Type</td><td class="value" style="color: #e2e8f0; font-size: 13px;">${device.type || 'Unknown'}</td></tr>
        <tr><td class="label">IP Address</td><td class="value" style="color: #3b82f6; font-family: monospace;">${device.ip}</td></tr>
        <tr><td class="label">Location</td><td class="value" style="color: #e2e8f0; font-size: 13px;">${device.location || 'Unknown'}</td></tr>
        <tr><td class="label">Status</td><td class="value"><span style="background-color: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: bold; letter-spacing: 1px; border: 1px solid rgba(239, 68, 68, 0.3);">DOWN (Timeout)</span></td></tr>
        <tr><td class="label">Failed Pings</td><td class="value" style="color: #ef4444; font-size: 13px;">${failedAttempts} consecutive attempts</td></tr>
        <tr><td class="label" style="border-bottom: none;">Time Detected</td><td class="value" style="border-bottom: none; color: #e2e8f0; font-size: 13px;">${dateStr}</td></tr>
      </table>`;

    const html = this.getEmailTemplate('Device Offline', banner, content);

    await this.transporter.sendMail({
      from: `"Mesra Network Monitoring" <${process.env.MAIL_USER}>`,
      to,
      subject: `[DOWN] ${device.name} is Offline`,
      html,
      attachments: [{ filename: 'favicon.png', path: path.join(process.cwd(), 'src/assets/favicon.png'), cid: 'mesra-logo' }]
    });
  }

  async sendRecoveryAlert(device: Device, recoveredAt = new Date()) {
    const to = await this.getEmailRecipients();
    if (!to) return;

    const dateStr = recoveredAt.toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar', timeZoneName: 'short',
    });

    const banner = `
      <div class="banner" style="background-color: rgba(34, 197, 94, 0.08); border-left: 4px solid #22c55e;">
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #22c55e; text-transform: uppercase;">Recovery Notice</div>
        <h2 style="margin: 6px 0 0; font-size: 22px; color: #22c55e; letter-spacing: 0.5px;">DEVICE ONLINE</h2>
        <p style="margin: 8px 0 0; font-size: 14px; color: #e2e8f0;">The device has recovered and is now responding normally.</p>
      </div>`;

    const content = `
      <table>
        <tr><td class="label">Device Name</td><td class="value">${device.name}</td></tr>
        <tr><td class="label">Device Type</td><td class="value" style="color: #e2e8f0; font-size: 13px;">${device.type || 'Unknown'}</td></tr>
        <tr><td class="label">IP Address</td><td class="value" style="color: #3b82f6; font-family: monospace;">${device.ip}</td></tr>
        <tr><td class="label">Location</td><td class="value" style="color: #e2e8f0; font-size: 13px;">${device.location || 'Unknown'}</td></tr>
        <tr><td class="label">Status</td><td class="value"><span style="background-color: rgba(34, 197, 94, 0.15); color: #22c55e; padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: bold; letter-spacing: 1px; border: 1px solid rgba(34, 197, 94, 0.3);">ONLINE (Recovered)</span></td></tr>
        <tr><td class="label" style="border-bottom: none;">Time Recovered</td><td class="value" style="border-bottom: none; color: #e2e8f0; font-size: 13px;">${dateStr}</td></tr>
      </table>`;

    const html = this.getEmailTemplate('Device Recovered', banner, content);

    await this.transporter.sendMail({
      from: `"Mesra Network Monitoring" <${process.env.MAIL_USER}>`,
      to,
      subject: `[UP] ${device.name} has Recovered`,
      html,
      attachments: [{ filename: 'favicon.png', path: path.join(process.cwd(), 'src/assets/favicon.png'), cid: 'mesra-logo' }]
    });
  }

  async sendTestEmail(to: string) {
    const banner = `
      <div class="banner" style="background-color: rgba(59, 130, 246, 0.08); border-left: 4px solid #3b82f6;">
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #3b82f6; text-transform: uppercase;">Test Message</div>
        <h2 style="margin: 6px 0 0; font-size: 22px; color: #3b82f6; letter-spacing: 0.5px;">SYSTEM CHECK</h2>
        <p style="margin: 8px 0 0; font-size: 14px; color: #e2e8f0;">This is a test email to verify your notification settings.</p>
      </div>`;

    const content = `
      <div style="text-align: center; padding: 20px 0;">
        <p style="font-size: 16px; color: #e2e8f0; margin: 0; font-weight: bold;">Your email configuration is working perfectly!</p>
        <p style="font-size: 13px; color: #94a3b8; margin: 10px 0 0;">You will now receive network alerts at this address.</p>
      </div>`;

    const html = this.getEmailTemplate('Test Notification', banner, content);

    await this.transporter.sendMail({
      from: `"Mesra Network Monitoring" <${process.env.MAIL_USER}>`,
      to,
      subject: `[TEST] Mesra Network Monitoring Alert`,
      html,
      attachments: [{ filename: 'favicon.png', path: path.join(process.cwd(), 'src/assets/favicon.png'), cid: 'mesra-logo' }]
    });
  }
}
