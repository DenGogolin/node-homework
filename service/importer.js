import fs from 'fs';
import path from 'path';
import csvToJson from 'csvtojson';
import deasync from 'deasync';

import { EventName } from './dirwatcher'

export class Importer {

    constructor(emitter) {
        this.emitter = emitter;
        this.emitter.on(EventName, (fileName) => {
            const filePath = `${process.cwd()}/data/${fileName}`;
            console.log(filePath);
            // const result = this.importAsync(filePath);
            // result.then(result => {
            //     console.log("ASYNC");
            //     console.log(result);
            // });

            const resultSync = this.importSync(filePath);
            console.log("SYNC");
            console.log(resultSync);
        });
    }

    importAsync(fileName) {
        return new Promise((res, rej) => {
            this._getConverted(fileName).then(res).catch(rej);
        });
    }

    importSync(fileName) {
        let result,
            done = false,
            promise = this.importAsync(fileName);
        promise.then(data => {
            result = data;
            done = true;
        });
        deasync.loopWhile(() => !done);
        return result;
    }
    
    _getConverted(fileName) {
        return new Promise((res, rej) => {
            let result = [];
            csvToJson().fromFile(fileName)
                .on('json', j => result.push(j))
                .on('done', error => {
                    if (error) {
                        rej(error);
                    } else {
                        res(result);
                    }
                });
        });
    }
}