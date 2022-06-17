'use strict';

function onload() {
    const main = document.querySelector('.main');

    function processFileList(files) {
        files = Array.from(files);
        console.log(files);

        const inis = [];
        files.forEach(file => {
            file.path = file.filepath || file.webkitRelativePath;
            if (file.name = 'char.ini') {
                inis.push(
                    {
                        charPath: file.path.slice(0, -9),
                        iniFile: file,
                    }
                );
            }
        });
    }

    async function getFilesFromDataTransferItems(dataTransferItems, options = { raw: false }) {
        const readFile = (entry, path = '') => {
            return new Promise((resolve, reject) => {
                entry.file(file => {
                    if (!options.raw) file.filepath = path + file.name // save full path
                    resolve(file)
                }, (err) => {
                    reject(err)
                })
            })
        }

        const dirReadEntries = (dirReader, path) => {
            return new Promise((resolve, reject) => {
                dirReader.readEntries(async entries => {
                    let files = []
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

        const readDir = async (entry, path) => {
            const dirReader = entry.createReader()
            const newPath = path + entry.name + '/'
            let files = []
            let newFiles
            do {
                newFiles = await dirReadEntries(dirReader, newPath)
                files = files.concat(newFiles)
            } while (newFiles.length > 0)
            return files
        }

        const getFilesFromEntry = async (entry, path = '') => {
            if (entry.isFile) {
                const file = await readFile(entry, path)
                return [file]
            }
            if (entry.isDirectory) {
                const files = await readDir(entry, path)
                return files
            }
        }

        let files = []
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
    main.addEventListener("drop", function (event) {
        console.log(event);
        event.preventDefault();
        dragOverlay.classList.add('hidden');
        getFilesFromDataTransferItems(event.dataTransfer.items).then(processFileList);
    });

    const folderInput = document.querySelector('#folder-input');
    folderInput.addEventListener('change', event => {
        processFileList(folderInput.files);
    });
}

window.addEventListener('load', onload);
