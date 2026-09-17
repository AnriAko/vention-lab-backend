import { z } from 'zod';

import { CommonErrors } from '~/common/errors/common-errors';

import { buildChatRoomName } from './build-chat-room-name';
import { buildMessageDedupeKey } from './build-message-dedupe-key';
import { parseInput } from './parse-input';
import { parsePagination } from './parse-pagination';
import { toChatMemberResponse } from './to-chat-member-response';
import { toChatResponse } from './to-chat-response';
import { toMessageResponse } from './to-message-response';

describe('Chat utils', () => {
    describe('buildChatRoomName', () => {
        it('should build chat room name from chat id', () => {
            expect(buildChatRoomName('chat-123')).toBe('chat:chat-123');
        });

        it('should handle empty chat id', () => {
            expect(buildChatRoomName('')).toBe('chat:');
        });
    });

    describe('buildMessageDedupeKey', () => {
        it('should build deduplication key from user, chat and client message ids', () => {
            expect(
                buildMessageDedupeKey({
                    userId: 'user-123',
                    chatId: 'chat-456',
                    clientMessageId: 'message-789',
                })
            ).toBe('user-123:chat-456:message-789');
        });

        it('should preserve the exact values in the key', () => {
            expect(
                buildMessageDedupeKey({
                    userId: 'user',
                    chatId: 'chat',
                    clientMessageId: 'client-message',
                })
            ).toBe('user:chat:client-message');
        });
    });

    describe('parseInput', () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
        });

        it('should return parsed data for valid input', () => {
            const input = {
                name: 'John',
                age: 25,
            };

            expect(parseInput(schema, input)).toEqual(input);
        });

        it('should throw AppException for invalid input', () => {
            expect(() =>
                parseInput(schema, {
                    name: 'John',
                    age: '25',
                })
            ).toThrow();
        });

        it('should throw validation error for invalid input', () => {
            expect(() =>
                parseInput(schema, {
                    name: 'John',
                    age: '25',
                })
            ).toThrow(CommonErrors.VALIDATION_ERROR.message);
        });
    });

    describe('parsePagination', () => {
        it('should use default pagination values', () => {
            expect(parsePagination({})).toEqual({
                page: 1,
                limit: 20,
            });
        });

        it('should return provided pagination values', () => {
            expect(
                parsePagination({
                    page: 3,
                    limit: 50,
                })
            ).toEqual({
                page: 3,
                limit: 50,
            });
        });

        it('should use defaults for undefined values', () => {
            expect(
                parsePagination({
                    page: undefined,
                    limit: undefined,
                })
            ).toEqual({
                page: 1,
                limit: 20,
            });
        });

        it('should throw for invalid pagination values', () => {
            expect(() =>
                parsePagination({
                    page: 0,
                    limit: 20,
                })
            ).toThrow();
        });
    });

    describe('toChatMemberResponse', () => {
        it('should map chat member user to response', () => {
            const user = {
                id: 'user-123',
                email: 'john@example.com',
                name: 'John Doe',
                image: 'https://example.com/avatar.jpg',
            };

            expect(toChatMemberResponse(user)).toEqual({
                id: 'user-123',
                email: 'john@example.com',
                name: 'John Doe',
                image: 'https://example.com/avatar.jpg',
            });
        });
    });

    describe('toChatResponse', () => {
        it('should map chat record to response', () => {
            const chat = {
                id: 'chat-123',
                organizationId: 'organization-456',
                users: [
                    {
                        userId: 'user-1',
                        user: {
                            id: 'user-1',
                            email: 'john@example.com',
                            name: 'John',
                            image: 'john.jpg',
                        },
                    },
                    {
                        userId: 'user-2',
                        user: {
                            id: 'user-2',
                            email: 'jane@example.com',
                            name: 'Jane',
                            image: 'jane.jpg',
                        },
                    },
                ],
            };

            expect(toChatResponse(chat)).toEqual({
                id: 'chat-123',
                organizationId: 'organization-456',
                members: [
                    {
                        id: 'user-1',
                        email: 'john@example.com',
                        name: 'John',
                        image: 'john.jpg',
                    },
                    {
                        id: 'user-2',
                        email: 'jane@example.com',
                        name: 'Jane',
                        image: 'jane.jpg',
                    },
                ],
            });
        });

        it('should return an empty members array when chat has no users', () => {
            const chat = {
                id: 'chat-123',
                organizationId: 'organization-456',
                users: [],
            };

            expect(toChatResponse(chat)).toEqual({
                id: 'chat-123',
                organizationId: 'organization-456',
                members: [],
            });
        });
    });

    describe('toMessageResponse', () => {
        it('should map message record to response', () => {
            const createdAt = new Date('2026-09-08T12:00:00.000Z');

            const message = {
                id: 'message-123',
                chatId: 'chat-456',
                senderId: 'user-789',
                content: 'Hello world',
                createdAt,
                sender: {
                    id: 'user-789',
                    email: 'john@example.com',
                    name: 'John Doe',
                    image: 'avatar.jpg',
                },
            };

            expect(toMessageResponse(message)).toEqual({
                id: 'message-123',
                chatId: 'chat-456',
                senderId: 'user-789',
                content: 'Hello world',
                createdAt,
                sender: {
                    id: 'user-789',
                    email: 'john@example.com',
                    name: 'John Doe',
                    image: 'avatar.jpg',
                },
            });
        });
    });
});
