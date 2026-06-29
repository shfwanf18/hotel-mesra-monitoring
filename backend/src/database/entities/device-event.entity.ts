import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('device_events')
export class DeviceEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId: string;

  @Column({ name: 'device_name', type: 'varchar', length: 100 })
  deviceName: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  message: string | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;

  @ManyToOne(() => DeviceEntity, (d) => d.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;
}
