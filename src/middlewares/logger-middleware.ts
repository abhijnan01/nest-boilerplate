import { Header, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    res['License_Plate'] = `${uuidv4().substring(9, 13)}-${uuidv4().substring(9, 13)}-${uuidv4().substring(9, 13)}-${uuidv4().substring(
      9,
      13,
    )}`;
    next();
  }
}
