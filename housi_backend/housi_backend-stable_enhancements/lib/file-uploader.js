var fs = require('fs');
const path = require('path');



async function saveFile(incomingFile) {
    const date = new Date();
    const timestamp = date.getTime();
    const name = timestamp + '.jpg';
    const saveFilePath = path.join(__dirname, `../uploads/documents/${name}`);
    incomingFile.mv(saveFilePath)
    return name
}



async function saveProfileImage(incomingFile) {
    const date = new Date();
    const timestamp = date.getTime();
    const name = timestamp + '.jpg';
    const saveFilePath = path.join(__dirname, `../uploads/profile/${name}`);
    
    incomingFile.mv(saveFilePath)
    return [name, saveFilePath]
}

async function deleteFile(path) {
    // const filePath = path.join(__dirname, `../gameBanners/${path}`);
    fs.unlink(`../gameBanners/${path}`, (err) => {
        if (err) return err
    })
    return true
}

async function deleteProfileImage(img) {
    // const filePath = path.join(__dirname, `../gameBanners/${path}`);
    
    fs.unlink(`./uploads/profile/${img}`, (err) => {
       console.log(err,"errrr")
        
    })
    return true
}

async function saveDocuments(incomingFile) {
    const date = new Date();
    const timestamp = date.getTime();
    const name = timestamp + '.jpg';
    const saveFilePath = path.join(__dirname, `../uploads/documents/${name}`);
    incomingFile.mv(saveFilePath)
    return name
}

async function deleteDocuments(path) {
    // const filePath = path.join(__dirname, `../gameBanners/${path}`);
    fs.unlink(`../uploads/documents/${path}`, (err) => {
        if (err) return err
    })
    return true
}

async function uploadToAWS(image) {
    console.log(image, "imagae")
    const AWS = require('aws-sdk')
    const fs = require('fs')
    const path = require('path')

    //configuring the AWS environment
    AWS.config.update({
        accessKeyId: process.env.accesskeyId,
        secretAccessKey: process.env.SecretAccessKey,
    })

    var s3 = new AWS.S3()
    var filePath = image
    //configuring parameters
    var params = {
        Bucket: 'dreamhousi',
        Body: fs.createReadStream(filePath),
        Key: 'folder/' + Date.now() + '_' + path.basename(filePath),
    }



    return new Promise((resolve, reject) => {

        s3.upload(params, async function (err, data) {
            //handle error
            if (err) {
                console.log('Error', err)
                reject(err)
            }

            //success
            if (data) {
                console.log(data.Location, "data")
                resolve(data.Location)
            }
        })
    })


}
async function uploadPdfBufferToAWS(pdf, invoiceId) {
    // console.log(image, "imagae")
    const AWS = require('aws-sdk')

    //configuring the AWS environment
    AWS.config.update({
        accessKeyId: process.env.accesskeyId,
        secretAccessKey: process.env.SecretAccessKey,
    })

    var s3 = new AWS.S3()
    //configuring parameters
    var params = {
        Bucket: 'dreamhousi',
        Body: pdf,
        Key: 'folder/' + invoiceId + '_' + `invoice.pdf`,
        ContentType: "application/pdf"
    }



    return new Promise((resolve, reject) => {

        s3.upload(params, async function (err, data) {
            //handle error
            if (err) {
                console.log('Error', err)
                reject(err)
            }

            //success
            if (data) {
                console.log(data.Location, "data")
                resolve(data.Location)
            }
        })
    })


}

module.exports = {
    saveFile,
    deleteFile,
    saveProfileImage,
    deleteProfileImage,
    saveDocuments,
    deleteDocuments,
    uploadToAWS,
    uploadPdfBufferToAWS
}