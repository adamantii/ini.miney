'use strict';

interface File {
    relativePath: string;
}

interface AOCharacter {
    dirPath?: string,
    iniFile?: File,
    iniData?: { [key: string]: any },
}

interface OLCharacter {
    // id: number,
    name: string,
    namePlate: string,
    side: 'defense' | 'prosecution' | 'witness' | 'counsel' | 'judge',
    blipUrl: string,
    iconUrl: string | null,
    galleryImageUrl: string | null,
    galleryAJImageUrl: string | null,
    backgroundId: number,
    limitWidth: boolean, // false
    alignment: string | null,
    offsetX: number,
    offsetY: number,
    poses: [
        {
            // id: number,
            name: string,
            idleImageUrl: string,
            speakImageUrl: string,
            isSpeedlines: boolean,
            iconUrl: string,
            states: [
                {
                    imageUrl: string,
                    nextPoseDelay: number,
                    noSpeakDelay: boolean,
                }
            ],
            audioTicks: [
                {
                    fileName: string,
                    volume: number,
                    time: number,
                }
            ],
            functionTicks: [
                {
                    functionName: "Shake" | "Flash",
                    functionParam: "s" | "m" | "l",
                    time: number,
                }
            ],
        }
    ],
    bubbles: [
        {
            "name": string,
            "imageUrl": string,
            "soundUrl": string,
            "duration": number,
            "shake": boolean,
        }
    ],
}

function load() {
    const main = document.querySelector('.main');

    function testRegex(str: string, re: RegExp): false | RegExpMatchArray {
        const match = str.match(re);
        if (!match) return false;
        if (match[0] != match.input) return false;
        return match;
    }

    function parseINI(str: string) {
        const regex = {
            section: /^\s*\[\s*([^\]]*)\s*\]\s*$/,
            param: /^\s*([^=]+?)\s*=\s*(.*?)\s*$/,
            comment: /^\s*;.*$/
        };
        const value: { [key: string]: any } = {};
        const lines = str.split(/[\r\n]+/);
        let section: string = null;
        lines.forEach(function (line) {
            if (regex.comment.test(line)) {
                return;
            } else if (regex.param.test(line)) {
                const match = line.match(regex.param);
                if (section) {
                    value[section][match[1]] = match[2];
                } else {
                    value[match[1]] = match[2];
                }
            } else if (regex.section.test(line)) {
                const match = line.match(regex.section);
                value[match[1]] = {};
                section = match[1];
            } else if (line.length == 0 && section) {
                section = null;
            };
        });
        return value;
    }

    async function processFileList(files: Array<File> | FileList) {
        files = Array.from(files);
        console.log(files);

        const inis: AOCharacter[] = [];
        for (let file of files) {
            file.relativePath = file.relativePath || file.webkitRelativePath;
            if (file.name === 'char.ini') {
                const characterData: AOCharacter = {
                    dirPath: file.relativePath.slice(0, -9),
                    iniFile: file,
                };

                const text = await file.text();
                characterData.iniData = parseINI(text);

                inis.push(characterData);
            }
        }

        console.log(inis);
    }

    async function getFilesFromDataTransferItems(dataTransferItems: DataTransferItemList) {
        const readFile = function (entry: FileSystemFileEntry, path = ''): Promise<File> {
            return new Promise((resolve, reject) => {
                entry.file(file => {
                    file.relativePath = path + file.name;
                    resolve(file);
                }, (err) => {
                    reject(err);
                })
            })
        }

        const dirReadEntries = function (dirReader: FileSystemDirectoryReader, path: string): Promise<File[]> {
            return new Promise((resolve, reject) => {
                dirReader.readEntries(async entries => {
                    let files: File[] = []
                    for (let entry of entries) {
                        const itemFiles = await getFilesFromEntry(entry, path)
                        files = files.concat(itemFiles)
                    }
                    resolve(files)
                }, (err) => {
                    reject(err)
                })
            })
        }

        const readDir = async function (entry: FileSystemDirectoryEntry, path: string): Promise<File[]> {
            const dirReader = entry.createReader()
            const newPath = path + entry.name + '/'
            let files: File[] = []
            let newFiles
            do {
                newFiles = await dirReadEntries(dirReader, newPath)
                files = files.concat(newFiles)
            } while (newFiles.length > 0)
            return files
        }

        const getFilesFromEntry = async function (entry: FileSystemEntry, path = ''): Promise<File[]> {
            if (entry.isFile) {
                const file = await readFile(entry as FileSystemFileEntry, path)
                return [file]
            }
            if (entry.isDirectory) {
                const files = await readDir(entry as FileSystemDirectoryEntry, path)
                return files
            }
        }

        let files: File[] = []
        let entries = []

        for (let i = 0, ii = dataTransferItems.length; i < ii; i++) {
            entries.push(dataTransferItems[i].webkitGetAsEntry())
        }

        for (let entry of entries) {
            const newFiles = await getFilesFromEntry(entry)
            files = files.concat(newFiles)
        }

        return files
    }

    const hoverOverlay = document.querySelector('.hover-overlay');
    const dragOverlay = document.querySelector('.drag-overlay');
    main.addEventListener("dragover", event => {
        dragOverlay.classList.remove('hidden');
        event.preventDefault();
    });
    main.addEventListener("dragleave", event => {
        dragOverlay.classList.add('hidden');
    });
    main.addEventListener("drop", function (event: DragEvent) {
        console.log(event);
        event.preventDefault();
        dragOverlay.classList.add('hidden');
        getFilesFromDataTransferItems(event.dataTransfer.items).then(processFileList);
    });

    const folderInput = document.querySelector('#folder-input') as HTMLInputElement;
    folderInput.addEventListener('change', event => {
        processFileList(folderInput.files);
    });

    const dialogueText = document.querySelector('.dialogue-text') as HTMLElement;
    function setDialogueFontSize() {
        dialogueText.style.setProperty('--dialogue-font-size', main.getClientRects()[0].height / 16 + 'px');
    }
    setDialogueFontSize();
    window.addEventListener('resize', setDialogueFontSize);
}

window.addEventListener('load', load);
