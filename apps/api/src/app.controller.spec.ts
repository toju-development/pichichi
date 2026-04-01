import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return status ok with a timestamp', () => {
      const result = appController.healthCheck();

      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
      });
    });
  });
});
