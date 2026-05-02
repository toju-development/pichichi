import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway.js';

interface MockSocket {
  id: string;
  handshake: {
    auth: { token?: string };
    headers: Record<string, string | undefined>;
  };
  data: Record<string, unknown>;
  disconnect: jest.Mock;
}

const buildSocket = (
  overrides: Partial<MockSocket['handshake']> = {},
): MockSocket => ({
  id: 'socket-test-id',
  handshake: {
    auth: overrides.auth ?? {},
    headers: overrides.headers ?? {},
  },
  data: {},
  disconnect: jest.fn(),
});

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('test-secret') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('disconnects when no token is provided', async () => {
      const client = buildSocket();

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(client.data.userId).toBeUndefined();
    });

    it('disconnects when the token cannot be verified', async () => {
      const client = buildSocket({ auth: { token: 'invalid-token' } });
      jwtService.verifyAsync.mockRejectedValueOnce(new Error('jwt malformed'));

      await gateway.handleConnection(client as never);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
        secret: 'test-secret',
      });
      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.userId).toBeUndefined();
    });

    it('disconnects when payload is missing required claims', async () => {
      const client = buildSocket({ auth: { token: 'incomplete-token' } });
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: '', email: '' });

      await gateway.handleConnection(client as never);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(client.data.userId).toBeUndefined();
    });

    it('keeps the socket connected and stores the user payload when the token is valid', async () => {
      const client = buildSocket({ auth: { token: 'valid-token' } });
      jwtService.verifyAsync.mockResolvedValueOnce({
        sub: 'user-123',
        email: 'user@example.com',
      });

      await gateway.handleConnection(client as never);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.userId).toBe('user-123');
      expect(client.data.user).toEqual({
        sub: 'user-123',
        email: 'user@example.com',
      });
    });

    it('falls back to the Authorization Bearer header when handshake.auth is empty', async () => {
      const client = buildSocket({
        headers: { authorization: 'Bearer header-token' },
      });
      jwtService.verifyAsync.mockResolvedValueOnce({
        sub: 'user-456',
        email: 'header@example.com',
      });

      await gateway.handleConnection(client as never);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('header-token', {
        secret: 'test-secret',
      });
      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.userId).toBe('user-456');
    });
  });

  describe('emitMatchUpdated', () => {
    it('broadcasts match:updated through the server instance', () => {
      const emit = jest.fn();
      const gatewayWithServer = gateway as unknown as {
        server: { emit: jest.Mock };
      };
      gatewayWithServer.server = { emit };

      gateway.emitMatchUpdated('match-1');

      expect(emit).toHaveBeenCalledWith('match:updated', {
        matchId: 'match-1',
      });
    });
  });
});
