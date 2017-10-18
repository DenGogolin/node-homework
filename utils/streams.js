#!/usr/bin/env node
import { promisify } from 'util';
import { Readable } from 'stream'
import fs from 'fs';
import path from 'path';

import through2 from 'through2';
import csv from 'csvtojson';
import * as _ from 'lodash';
const request = promisify(require('request')),
    readFileAsync = promisify(fs.readFile),
    readDirAsync = promisify(fs.readdir);


const VERSION = require(`${process.cwd()}/package.json`).version;
const CSS_API_URL = 'https://www.epam.com/etc/clientlibs/foundation/main.min.fc69c13add6eae57cd247a91c7e26a15.css';
const ACTIONS = {
    'io': {
        desc: `to console`,
        func: inputOutput
    },
    'uppercase': {
        desc: `uppercased to console`,
        func: uppercase
    },
    'transform': {
        desc: `csv to json to console`,
        func: transform
    },
    'transform-file': {
        desc: `[name].csv to [name].json`,
        func: transformFile
    },
    'bundle-css': {
        desc: `bundle css`,
        func: bundleCSS
    },
};
const OPTIONS = {
    action: {
        desc: `action to proceed. Possible Options:\n ${_.chain(ACTIONS).map((val, k) => `${k}: ${val.desc}`).join(`\n`)}`,
        alias: `a`,
        demandOption: true,
        choises: Object.keys(ACTIONS),
    },
    file: {
        desc: `path to the file`,
        alias: `f`,
        demandOption: true,
    }
};

function inputOutput(filePath) {
    fs.createReadStream(filePath)
        .pipe(process.stdout)
        .on('error', console.log);
}

function _transform(filePath) {
    return csv().fromFile(filePath);
}

function transform(filePath) {
    _transform(filePath)
        .pipe(process.stdout)
        .on('error', console.log);
}

function transformFile(filePath) {
    const name = `${path.parse(filePath).name}.json`;
    let write = fs.createWriteStream(name)
    _transform(filePath)
        .pipe(write)
        .on('error', console.log);
}


function uppercase(filePath) {
    fs.createReadStream(filePath, { encoding: 'utf8' })
        .pipe(through2(function (chunk, enc, cb) {
            this.push(chunk.toString().toUpperCase());
            cb();
        }))
        .pipe(process.stdout)
        .on('error', console.log);
}


async function bundleCSS(folderPath, output) {
    const path = `${folderPath}/${output}.css`;

    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
    }
    const { body } = await request(CSS_API_URL);
    const css = await concatFiles(folderPath);
    const write = fs.createWriteStream(path);
    let rs = new Readable();
    rs.push(`${css}${body}`);
    rs.push(null);
    rs.pipe(write);
}

async function concatFiles(folderPath, ext = 'css') {
    const files = await readDirAsync(folderPath);
    return files.reduce((content, file) => {
        if (path.extname(file).includes(ext)) {
            const fileContent = fs.readFileSync(`${folderPath}/${file}`);
            content += fileContent.toString();
        }
        return content;
    }, '');
}

function run(argv) {
    const { action, file } = argv;
    if (!Boolean(action)) {
        console.log(`Parameter unspecified: Action`);
        return;
    }
    if (!Boolean(file)) {
        console.log(`Parameter unspecified: File`);
        return;
    }
    const actionItem = ACTIONS[action];
    if (!actionItem) {
        console.log(`Please specify one of the actions: ${Object.keys(ACTIONS)}`);
        return;
    }
    actionItem.func(file);
}

require('yargs').version(VERSION)
    .usage('$0 <cmd> [args]')
    .command(`run ${Object.keys(OPTIONS).map(x=>`[${x}]`).join(' ')}`, 'provide an action against a file', OPTIONS, run)
    .help()
    .argv