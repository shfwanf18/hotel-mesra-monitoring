import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('ping_history')
export class PingHistoryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column()
  alive: boolean;

  @Column({ name: 'latency_ms', type: 'float', nullable: true })
  latencyMs: number | null;

  @CreateDateColumn({ name: 'checked_at' })
  checkedAt: Date;

  @ManyToOne(() => DeviceEntity, (d) => d.pingHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;
}
