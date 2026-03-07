import { Controller, Get, Res } from '@nestjs/common';
import { EventsService } from './events.service';
import type { Response } from 'express';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  sse(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    this.eventsService.addClient(res);

    res.on('close', () => {
      this.eventsService.removeClient(res);
      res.end();
    });
  }
}
