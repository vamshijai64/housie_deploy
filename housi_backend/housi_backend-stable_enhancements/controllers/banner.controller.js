const banner = require('../models/gamebanners.model');
const fileUploader = require('../lib/file-uploader');

class banners {

    async addGameBanner(req,res) {

        if (!req.files) {
            return res.status(400).send({
                status: false,
                msg: 'Please send Banner File'
            })
        }
        const fileName =await fileUploader.saveFile(req.files.bannerFile)
        const createBanner = new banner({
            name: req.body.name,
            bannerFile: fileName
        })
        await createBanner.save();
        return res.status(200).send({
            status: true,
            msg: 'Banner successfully created'
        })
    }

    async updateBanner(req,res) {

        const isBannerExist = await banner.findById(req.params.id).lean();
        // console.log(isBannerExist)
        if (!isBannerExist) {
            return res.status(404).send({
                status: false,
                msg: 'Banner do not exist'
            })
        }
        await fileUploader.deleteFile(isBannerExist.bannerFile);
        const uploadNewFile = await fileUploader.saveFile(req.files.bannerFile);
        await banner.updateOne({_id: req.params.id},{
            name: req.body.name,
            bannerFile: uploadNewFile
        })
        return res.status(200).send({
            status: true,
            msg: 'Banner successfully updated'
        })
    }

    async deleteBannerImage(req,res) {

        const removeFile = await banner.findByIdAndRemove(req.params.id)
        if (removeFile) {
            return res.status(200).send({
                status: true,
                msg: 'Banner image successfully deleted'
            })
        }
    }

    async getBannerImage(req,res) {
        const getFile = await banner.find({}).lean();

        return res.status(200).send({
            status: true,
            result: getFile
        })
    }
}

module.exports = banners