import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany
} from 'typeorm';
import { PingHistoryEntity } from './ping-history.entity';
import { DeviceEventEntity } from './device-event.entity';
import { UptimeDailySummaryEntity } from './uptime-daily-summary.entity';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ type: 'varchar', length: 10 })
  type: 'AP' | 'Router' | 'Server';

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ name: 'mac_address', type: 'varchar', length: 17, nullable: true })
  macAddress: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firmware: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PingHistoryEntity, (p) => p.device)
  pingHistory: PingHistoryEntity[];

  @OneToMany(() => DeviceEventEntity, (e) => e.device)
  events: DeviceEventEntity[];

  @OneToMany(() => UptimeDailySummaryEntity, (u) => u.device)
  uptimeSummaries: UptimeDailySummaryEntity[];
}
