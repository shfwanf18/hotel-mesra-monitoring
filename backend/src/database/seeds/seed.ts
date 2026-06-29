import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DeviceService } from '../../device/device.service';
import { SettingsService } from '../../settings/settings.service';
import { devices } from '../../config/devices';
import { CreateDeviceDto } from '../../device/dto/create-device.dto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const deviceService = app.get(DeviceService);
  const settingsService = app.get(SettingsService);

  console.log('Seeding settings...');
  await settingsService.set('ping_interval_minutes', '1');
  await settingsService.set('fail_threshold', '3');
  await settingsService.set('email_alerts_enabled', 'true');
  console.log('Settings seeded.');

  console.log('Seeding devices...');
  const existingDevices = await deviceService.findAll();
  if (existingDevices.length === 0) {
    for (const dev of devices) {
      const dto = new CreateDeviceDto();
      dto.name = dev.name;
      dto.ip = dev.ip;
      dto.type = dev.type;
      dto.location = dev.location;
      dto.macAddress = dev.macAddress;
      dto.firmware = dev.firmware;
      dto.model = dev.model;
      if (dev.description) {
        dto.description = dev.description;
      }
      
      await deviceService.create(dto);
      console.log(`Seeded device: ${dev.name}`);
    }
  } else {
    console.log('Devices already exist, skipping device seed.');
  }

  await app.close();
}

bootstrap();
