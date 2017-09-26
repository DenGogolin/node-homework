const config = require('./config');
const models = require('./models');

import { EventEmitter } from 'events';
import { Importer } from './service/importer'
import { DirWatcher } from './service/dirwatcher';

console.log(config.name);
new models.Product();
new models.User();

let emitter = new EventEmitter();
let dirWatcher = new DirWatcher(emitter);
let importer = new Importer(emitter);

dirWatcher.watch(`./data`, 500);