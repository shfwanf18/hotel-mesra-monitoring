import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettingsEntity } from '../database/entities/app-settings.entity';

@Injectable()
export class SettingsService implements OnModuleInit {
  private cache: Record<string, string> = {};
  private lastFetched = 0;
  private readonly CACHE_TTL_MS = 30000; // 30 seconds cache

  constructor(
    @InjectRepository(AppSettingsEntity)
    private settingsRepo: Repository<AppSettingsEntity>,
  ) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  private async refreshCache() {
    const settings = await this.settingsRepo.find();
    for (const s of settings) {
      this.cache[s.key] = s.value;
    }
    this.lastFetched = Date.now();
  }

  async getAll() {
    if (Date.now() - this.lastFetched > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }
    return this.cache;
  }

  async get(key: string): Promise<string | undefined> {
    if (Date.now() - this.lastFetched > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }
    return this.cache[key];
  }

  async set(key: string, value: string): Promise<void> {
    let setting = await this.settingsRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingsRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    await this.settingsRepo.save(setting);
    this.cache[key] = value; // invalidate local cache for this key
  }

  async getPingIntervalMs(): Promise<number> {
    const minutes = await this.get('ping_interval_minutes');
    const mins = parseInt(minutes || '1', 10);
    return (isNaN(mins) || mins < 1 ? 1 : mins) * 60000;
  }
}
