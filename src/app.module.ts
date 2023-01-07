/* eslint-disable no-console */
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import configuration from './config';
import * as winston from 'winston';
import { LoggerMiddleware } from './middlewares/logger-middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const esTransport = new ElasticsearchTransport({
          index: process.env.LOGGING_GROUP,
          clientOpts: {
            node: process.env.LOGGING_URL,
            // auth: {
            //   apiKey: process.env.LOG_API_KEY,
            // },
            tls: {
              rejectUnauthorized: false,
            },
          },
        });
        esTransport.on('error', (error) => {
          console.log('Error in sending logs to elastic search ', error);
        });
        return {
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(winston.format.timestamp(), winston.format.ms(), nestWinstonModuleUtilities.format.nestLike()),
            }),
            esTransport,
          ],
          format: winston.format.uncolorize(),
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
