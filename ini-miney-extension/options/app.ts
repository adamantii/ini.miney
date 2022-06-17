'use strict';

interface File {
    relativePath: string;
}

interface AOCharacter {
    iniFile: File,
    charPath: string,
}

function load() {
    const main = document.querySelector('.main');

    function processFileList(files: Array<File> | FileList) {
        files = Array.from(files);
        console.log(files);

        const inis: AOCharacter[] = [];
        files.forEach(file => {
            file.relativePath = file.relativePath || file.webkitRelativePath;
            if (file.name === 'char.ini') {
                const iniData: AOCharacter = {
                    charPath: file.relativePath.slice(0, -9),
                    iniFile: file,
                };
                inis.push(iniData);
            }
        });
    }

    async function getFilesFromDataTransferItems(dataTransferItems: DataTransferItemList) {
        const readFile = function(entry: FileSystemFileEntry, path = ''): Promise<File> {
            return new Promise((resolve, reject) => {
                entry.file(file => {
                    file.relativePath = path + file.name;
                    resolve(file)
                }, (err) => {
                    reject(err)
                })
            })
        }

        const dirReadEntries = function(dirReader: FileSystemDirectoryReader, path: string): Promise<File[]> {
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
        
        const readDir = async function(entry: FileSystemDirectoryEntry, path: string): Promise<File[]> {
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

        const getFilesFromEntry = async function(entry: FileSystemEntry, path = ''): Promise<File[]> {
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
}

window.addEventListener('load', load);
