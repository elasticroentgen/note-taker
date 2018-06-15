#!/usr/bin/env node
'use strict';
const iq = require('inquirer');
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const homedir = require('os').homedir();
const notesDir = path.join(homedir,".note-taker");

function createNote(title) {
    const fullDate = new Date().toISOString();
    const date = fullDate.split('T')[0];
    const time = fullDate.split('T')[1].split('.')[0].replace(/:/g,'-');
    const filename = "note_" + date + "_" + time + "_" + title.replace(/\s/g,'-') + ".txt";

    const fullPath = path.join(notesDir, filename);

    // create file
    fs.writeFileSync(fullPath,title + "\n" + "=".repeat(title.length) + "\n");
    return fullPath;
}

function getNoteList() {

    let fileList = [];

    fs.readdirSync(notesDir).forEach(file => {
        if(file.startsWith('note_')) {
            const parts = file.split('_');
            if(parts.length < 4) {
                return;
            }
            fileList.push({
                date: parts[1],
                time: parts[2],
                title: parts[3].split('.')[0].replace(/-/g,' '),
                filename: path.join(notesDir, file)
            });
        }
    });

    return fileList;
}

function showNoteList() {
    const files = getNoteList();
    const foo = files.map((x,idx) => "[" + (idx+1) + "] " + x.title + " (" + x.date + " - " + x.time + ")")
    iq.prompt([
        {
            type: 'list',
            name: 'note',
            message: 'What scroll shall it be, master?',
            choices: foo
        }
    ]).then(answers => {
        const noteIdx = parseInt(answers.note.split(']')[0].replace('[','')) - 1;
        const noteToOpen = getNoteList()[noteIdx];
        spawnEditor(noteToOpen.filename);
    });
}

function spawnEditor(file, opts, cb) {
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (!opts) opts = {};
    
    var ed = /^win/.test(process.platform) ? 'notepad' : 'vim';
    var editor = opts.editor || process.env.VISUAL || process.env.EDITOR || ed;
    var args = editor.split(/\s+/);
    var bin = args.shift();
    
    var ps = spawn(bin, args.concat([ file ]), { stdio: 'inherit' });
    
    ps.on('exit', function (code, sig) {
        if (typeof cb === 'function') cb(code, sig)
    });
};

// Check if we have our directory
if (!fs.existsSync(notesDir)){
    fs.mkdirSync(notesDir);
}

const mode = process.argv[2];
switch(mode) {
    case 'new':
        let title = "New Note";
        if(process.argv.length == 4) {
            title = process.argv[3];
        }
        const filename = createNote(title);
        spawnEditor(filename);
        break;
    default:
        showNoteList();
}