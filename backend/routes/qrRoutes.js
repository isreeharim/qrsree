const express = require('express');
const { createQr, getAllQr, getQrById, updateQr, deleteQr } = require('../controllers/qrController');
const { getScanHistory } = require('../controllers/scanController');
const { createQrRules, updateQrRules, validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Every route below requires a valid admin JWT.
router.use(protect);

router.route('/').get(getAllQr).post(createQrRules, validate, createQr);

router.route('/:id').get(getQrById).put(updateQrRules, validate, updateQr).delete(deleteQr);

router.get('/:id/scans', getScanHistory);

module.exports = router;
