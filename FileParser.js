const fs = require('fs');
const path = require('path');

module.exports = class FileParser {
    allFilesSync(dir, fileList = []) {
        fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file)
        
            fileList.push(
                fs.statSync(filePath).isDirectory()
                    ? {[file]: this.allFilesSync(filePath)}
                    : file
            )
        })
        return fileList
    }    
}