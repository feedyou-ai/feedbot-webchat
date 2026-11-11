import { describe, expect, it } from 'vitest';
import { ConnectionStatus, IBotConnection } from 'botframework-directlinejs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ActivityOrID } from './Types';
import { connection } from './Store';

describe('connection reducer', () => {
    it('stores the connection, user and bot on Start_Connection', () => {
        const botConnection = {} as IBotConnection;
        const selectedActivity = new BehaviorSubject<ActivityOrID>({});

        const state = connection(undefined, {
            type: 'Start_Connection',
            botConnection,
            user: { id: 'user-1' },
            bot: { id: 'feedbot-foo', name: 'Chatbot' },
            selectedActivity
        });

        expect(state).toEqual({
            connectionStatus: ConnectionStatus.Uninitialized,
            botConnection,
            user: { id: 'user-1' },
            bot: { id: 'feedbot-foo', name: 'Chatbot' },
            selectedActivity
        });
    });
});
