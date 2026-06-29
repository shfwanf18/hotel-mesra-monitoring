import * as ping from 'ping';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PingService {
  async checkHost(ip: string) {
    const res = await ping.promise.probe(ip);
    return {
      alive: res.alive,
      time: res.time,
      host: ip,
    };
  }
}