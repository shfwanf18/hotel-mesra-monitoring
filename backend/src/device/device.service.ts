import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../database/entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly repo: Repository<DeviceEntity>,
  ) {}

  findAll(): Promise<DeviceEntity[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<DeviceEntity> {
    const device = await this.repo.findOne({ where: { id, isActive: true } });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  async create(dto: CreateDeviceDto): Promise<DeviceEntity> {
    const existingActive = await this.repo.findOne({ where: { ip: dto.ip, isActive: true } });
    if (existingActive) {
      throw new BadRequestException(`Device with IP ${dto.ip} already exists and is active`);
    }

    const existingInactive = await this.repo.findOne({ where: { ip: dto.ip, isActive: false } });
    if (existingInactive) {
      // Reactivate soft-deleted device
      existingInactive.isActive = true;
      existingInactive.name = dto.name;
      existingInactive.type = dto.type;
      existingInactive.location = dto.location;
      existingInactive.macAddress = dto.macAddress ?? null;
      existingInactive.firmware = dto.firmware ?? null;
      existingInactive.model = dto.model ?? null;
      existingInactive.description = dto.description ?? null;
      return this.repo.save(existingInactive);
    }

    const device = this.repo.create({
      name: dto.name,
      ip: dto.ip,
      type: dto.type,
      location: dto.location,
      macAddress: dto.macAddress ?? null,
      firmware: dto.firmware ?? null,
      model: dto.model ?? null,
      description: dto.description ?? null,
    });
    return this.repo.save(device);
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<DeviceEntity> {
    const device = await this.findOne(id);
    if (dto.ip && dto.ip !== device.ip) {
      const existingActive = await this.repo.findOne({ where: { ip: dto.ip, isActive: true } });
      if (existingActive) {
        throw new BadRequestException(`Device with IP ${dto.ip} already exists and is active`);
      }
    }
    Object.assign(device, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.ip !== undefined && { ip: dto.ip }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.macAddress !== undefined && { macAddress: dto.macAddress }),
      ...(dto.firmware !== undefined && { firmware: dto.firmware }),
      ...(dto.model !== undefined && { model: dto.model }),
      ...(dto.description !== undefined && { description: dto.description }),
    });
    return this.repo.save(device);
  }

  async remove(id: string): Promise<{ message: string }> {
    const device = await this.findOne(id);
    device.isActive = false;
    await this.repo.save(device);
    return { message: `Device "${device.name}" has been deactivated` };
  }
}
