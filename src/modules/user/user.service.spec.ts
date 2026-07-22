import { Test, type TestingModule } from '@nestjs/testing';
import { UsersService } from './user.service';
import { PrismaService } from '~/infrastructure/database';
import { LoggerService } from '~/infrastructure/logging';

describe('UserService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                        },
                    },
                },
                {
                    provide: LoggerService,
                    useValue: {
                        log: jest.fn(),
                        error: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
