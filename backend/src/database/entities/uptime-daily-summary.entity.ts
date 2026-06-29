import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('uptime_daily_summary')
@Unique(['deviceId', 'summaryDate'])
export class UptimeDailySummaryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column({ name: 'summary_date', type: 'date' })
  summaryDate: string;

  @Column({ name: 'total_checks', default: 0 })
  totalChecks: number;

  @Column({ name: 'up_checks', default: 0 })
  upChecks: number;

  @Column({ name: 'avg_latency', type: 'float', nullable: true })
  avgLatency: number | null;

  @ManyToOne(() => DeviceEntity, (d) => d.uptimeSummaries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;
}
