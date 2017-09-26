import fs from 'fs';
import path from 'path';

export const EventName = `dirwatcher:changed`;

export class DirWatcher {

    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    watch(pathString, delay) {
        fs.watch(
            path.resolve(pathString),
            {
                recursive: true
            },
            (eventName, fileName) => {
                setTimeout(() => {
                    this.eventEmitter.emit(EventName, fileName);
                }, delay || 0);
            }
        );
    }
}
