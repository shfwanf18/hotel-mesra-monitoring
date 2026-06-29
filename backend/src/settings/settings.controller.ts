import { Controller, Get, Patch, Body, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { SettingsService } from './settings.service';
import { TelegramService } from '../alert/telegram.service';
import { MailService } from '../alert/mail.service';



@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly telegramService: TelegramService,
    private readonly mailService: MailService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @Patch()
  async updateSettings(@Body() updates: Record<string, string>) {
    for (const [key, value] of Object.entries(updates)) {
      await this.settingsService.set(key, value);
    }
    return { message: 'Settings updated successfully' };
  }

  @Post('telegram/test')
  async testTelegramNotification(@Body() body: { chatId: string }) {
    if (!body.chatId) {
      throw new HttpException('Chat ID is required', HttpStatus.BAD_REQUEST);
    }
    try {
      await this.telegramService.sendTestMessage(body.chatId);
      return { message: 'Test message requested' };
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to send test message', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('email/test')
  async testEmailNotification(@Body() body: { email: string }) {
    if (!body.email) {
      throw new HttpException('Email address is required', HttpStatus.BAD_REQUEST);
    }
    try {
      await this.mailService.sendTestEmail(body.email);
      return { message: 'Test email sent successfully' };
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to send test email', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('telegram/check')
  async checkTelegramChatId() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new HttpException('TELEGRAM_BOT_TOKEN not configured in .env', HttpStatus.BAD_REQUEST);
    }
    
    const chatId = this.telegramService.getLatestChatId();
    if (chatId) {
      return { chatId: chatId, type: 'private' };
    }
    
    return { chatId: null, message: 'No recent messages found. Please send /chatid to the bot first.' };
  }

  @Get('system-status')
  async getSystemStatus() {
    // 1. API Server — always operational if this endpoint responds
    const apiServer = { status: 'operational' as const, label: 'Operational' };

    // 2. Database
    let database: { status: 'connected' | 'disconnected'; label: string };
    try {
      await this.dataSource.query('SELECT 1');
      database = { status: 'connected', label: 'Connected' };
    } catch {
      database = { status: 'disconnected', label: 'Disconnected' };
    }

    // 3. WebSocket — gateway is always up if the NestJS server is running
    const websocket = { status: 'connected' as const, label: 'Connected' };

    // 4. Telegram Bot
    let telegram: { status: 'connected' | 'failed' | 'unknown'; label: string };
    const teleToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!teleToken) {
      telegram = { status: 'unknown', label: 'Not Configured' };
    } else {
      try {
        const res = await fetch(`https://api.telegram.org/bot${teleToken}/getMe`);
        const data = await res.json();
        telegram = data.ok
          ? { status: 'connected', label: 'Connected' }
          : { status: 'failed', label: 'Invalid Token' };
      } catch {
        telegram = { status: 'failed', label: 'Failed' };
      }
    }

    // 5. Email Service
    let email: { status: 'connected' | 'failed' | 'unknown'; label: string };
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    if (!mailUser || !mailPass) {
      email = { status: 'unknown', label: 'Not Configured' };
    } else {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: mailUser, pass: mailPass },
        });
        await transporter.verify();
        email = { status: 'connected', label: 'Connected' };
      } catch {
        email = { status: 'failed', label: 'Failed' };
      }
    }

    // Uptime from Node.js process
    const uptimeSec = process.uptime();
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    const uptime = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return {
      services: {
        apiServer,
        database,
        websocket,
        telegram,
        email,
      },
      meta: {
        uptime,
        version: 'v1.2.0',
      },
    };
  }
}
