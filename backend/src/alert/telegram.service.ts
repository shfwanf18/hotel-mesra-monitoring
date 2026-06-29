import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Device } from '../config/devices';
import { Telegraf } from 'telegraf';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;
  private latestChatId: string | null = null;
  
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const token = this.botToken;
    if (token) {
      try {
        this.bot = new Telegraf(token);
        
        this.bot.start((ctx) => {
          this.latestChatId = ctx.chat.id.toString();
          ctx.reply('Welcome to Mesra Network Monitoring! 🌐\n\nI am an automated diagnostic assistant designed to monitor your critical network infrastructure.\n\nUse /chatid to get your Chat ID, or /help to see all commands.');
        });
        
        this.bot.help((ctx) => {
          this.latestChatId = ctx.chat.id.toString();
          ctx.reply('Available commands:\n/start - Show bot information and setup instructions\n/help - Display available commands\n/status - Check bot operational status\n/chatid - Show your Telegram Chat ID\n/test - Send a test notification');
        });
        
        this.bot.command('status', (ctx) => {
          this.latestChatId = ctx.chat.id.toString();
          ctx.reply('🟢 Bot is fully operational and actively listening for alerts from Mesra Network Monitoring system.');
        });
        
        this.bot.command('chatid', (ctx) => {
          this.latestChatId = ctx.chat.id.toString();
          ctx.reply(`Your Telegram Chat ID is:\n\`${ctx.chat.id}\`\n\nYou can copy this ID and paste it in the Settings dashboard.`, { parse_mode: 'Markdown' });
        });
        
        this.bot.command('test', (ctx) => {
          this.latestChatId = ctx.chat.id.toString();
          ctx.reply('🛠️ *TEST NOTIFICATION* 🛠️\n\nMesra Network Monitoring System is connected successfully!\n\nYou will receive alerts here when any critical device goes offline or comes back online.', { parse_mode: 'Markdown' });
        });

        // Fallback to track chat ID on any message
        this.bot.on('message', (ctx) => {
          this.latestChatId = ctx.chat.id.toString();
        });

        this.bot.launch({ dropPendingUpdates: true }).catch((err) => {
          this.logger.warn(`Telegraf polling warning (safe to ignore if restarting): ${err.message}`);
        });
        this.logger.log('Telegraf bot successfully started and polling for commands.');
      } catch (err) {
        this.logger.error('Failed to start Telegraf bot:', err);
      }
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGINT');
    }
  }

  public getLatestChatId() {
    return this.latestChatId;
  }

  private get botToken() {
    return this.configService.get<string>('TELEGRAM_BOT_TOKEN');
  }

  private getChatIds(chatIdInput: string): string[] {
    if (!chatIdInput) return [];
    try {
      const parsed = JSON.parse(chatIdInput);
      if (Array.isArray(parsed)) {
        return parsed.map(item => item.chatId).filter(id => !!id);
      }
    } catch (e) {
      // Fallback
    }
    return chatIdInput.split(',').map(id => id.trim()).filter(id => !!id);
  }

  async sendDownAlert(device: Device, chatIdInput: string, detectedAt = new Date(), failedAttempts = 3) {
    if (!this.botToken || !chatIdInput) {
      this.logger.warn(`Telegram token or chat ID is missing, skipping DOWN alert.`);
      return;
    }

    const dateStr = detectedAt.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
      timeZoneName: 'short',
    });

    const text = `🚨 *CRITICAL ALERT: DEVICE OFFLINE* 🚨\n\n` +
      `*Device Information:*\n` +
      `• *Name:* ${device.name}\n` +
      `• *Type:* ${device.type || 'Unknown'}\n` +
      `• *IP Address:* \`${device.ip}\`\n` +
      `• *Location:* ${device.location || 'Unknown'}\n\n` +
      `*Incident Details:*\n` +
      `• *Status:* 🔴 DOWN (Connection Timeout)\n` +
      `• *Failed Attempts:* ${failedAttempts} consecutive pings\n` +
      `• *Time Detected:* ${dateStr}\n\n` +
      `*Action Required:* Please check power or network cables immediately.`;

    const chatIds = this.getChatIds(chatIdInput);
    for (const chatId of chatIds) {
      await this.sendMessage(chatId, text);
    }
  }

  async sendRecoveryAlert(device: Device, chatIdInput: string, recoveredAt = new Date()) {
    if (!this.botToken || !chatIdInput) {
      this.logger.warn(`Telegram token or chat ID is missing, skipping RECOVERY alert.`);
      return;
    }

    const dateStr = recoveredAt.toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Makassar',
      timeZoneName: 'short',
    });

    const text = `✅ *RECOVERY NOTICE: DEVICE ONLINE* ✅\n\n` +
      `*Device Information:*\n` +
      `• *Name:* ${device.name}\n` +
      `• *Type:* ${device.type || 'Unknown'}\n` +
      `• *IP Address:* \`${device.ip}\`\n` +
      `• *Location:* ${device.location || 'Unknown'}\n\n` +
      `*Recovery Details:*\n` +
      `• *Status:* 🟢 ONLINE (Connection Restored)\n` +
      `• *Time Recovered:* ${dateStr}\n\n` +
      `*Note:* The device is now responding normally to ping requests.`;

    const chatIds = this.getChatIds(chatIdInput);
    for (const chatId of chatIds) {
      await this.sendMessage(chatId, text);
    }
  }

  async sendTestMessage(chatIdInput: string) {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured in the backend environment.');
    }
    if (!chatIdInput) {
      throw new Error('Chat ID is required.');
    }

    const text = `🛠️ *TEST NOTIFICATION* 🛠️\n\n` +
      `Mesra Network Monitoring System is connected successfully!\n\n` +
      `You will receive alerts here when any critical device goes offline or comes back online.`;

    const chatIds = this.getChatIds(chatIdInput);
    for (const chatId of chatIds) {
      await this.sendMessage(chatId, text);
    }
  }

  private async sendMessage(chatId: string, text: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error(`Failed to send Telegram message to ${chatId}: ${errorData}`);
        throw new Error(`Telegram API Error: ${errorData}`);
      }
    } catch (error) {
      this.logger.error(`Error sending Telegram message to ${chatId}:`, error);
      throw error;
    }
  }
}
