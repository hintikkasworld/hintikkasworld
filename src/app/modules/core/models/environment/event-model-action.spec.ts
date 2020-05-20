import { EventModelAction } from './event-model-action';

describe('EventModelAction', () => {
    it('should create an instance', () => {
        expect(new EventModelAction({ name: 'Hello', eventModel: undefined })).toBeTruthy();
    });
});
