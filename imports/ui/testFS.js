
const fs = require('fs')
const path = require('path')

const files = fs.readdirSync(__dirname, { withFileTypes: true })
console.log(files)

 files.filter(file => (file.indexOf('.') !== 0) && (file.slice(-4) === '.jsx'))
 .forEach((file) => {
   console.log(file)
 })

 const crawl = ({ folder, type, list=[] }) => {
  const addToList = (contents) => {
    console.log("contents:", contents)
    
    contents.forEach(item => {
      if (item.charAt(0 !== ".")) {
        const itemPath = path.join(folder, item)

        console.log("itemPath:", itemPath)

        if (path.extname(itemPath) === type) {
          list.push(itemPath)

        } else {
          crawl({
           folder: itemPath
         , type
         , list
         })
        }
      }
    })
  }

  const checkContents = (folder) => {
    console.log("folder:", folder)
    const data = fs.statSync(folder)
    if (data.isDirectory()){
      const contents = fs.readdirSync(folder)
      addToList(contents)
    }
  }

  checkContents(folder)
  return list
}

console.log(crawl({
  folder: __dirname
, type: ".json"
, list: []
}))