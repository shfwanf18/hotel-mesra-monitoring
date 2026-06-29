import { Module, forwardRef } from '@nestjs/common';
import { MailService } from './mail.service';
import { TelegramService } from './telegram.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  providers: [MailService, TelegramService],
  exports: [MailService, TelegramService],
})
export class AlertModule {}
