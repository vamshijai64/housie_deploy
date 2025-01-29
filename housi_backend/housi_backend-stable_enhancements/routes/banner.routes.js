const banners = require('../controllers/banner.controller');
const router = require("express").Router();
const banner = new banners()

router.post('/', banner.addGameBanner);

router.put('/:id', banner.updateBanner);

router.get('/', banner.getBannerImage);

router.delete('/:id', banner.deleteBannerImage);

module.exports = router
