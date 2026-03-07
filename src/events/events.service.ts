import { Injectable } from '@nestjs/common';
import type { Response } from 'express';

@Injectable()
export class EventsService {
    private clients: Response[] = [];

    addClient(res: Response) {
        this.clients.push(res);
    }

    removeClient(res: Response) {
        this.clients = this.clients.filter(c => c !== res);
    }

    emit(event: string, data: any) {
        for (const client of this.clients) {
            client.write(`event: ${event}\n`);
            client.write(`data: ${JSON.stringify(data)}\n\n`);
        }
    } 
}
