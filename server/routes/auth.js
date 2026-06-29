const router   = require('express').Router();
const multer   = require('multer');
const ctrl     = require('../controllers/authController');
const auth     = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','application/pdf'].includes(file.mimetype);
    cb(null, ok);
  },
});

router.post('/register',           authLimiter, ctrl.register);
router.post('/check-email',        authLimiter, ctrl.checkEmail);
router.post('/login',              authLimiter, ctrl.login);
router.post('/refresh',            ctrl.refresh);
router.post('/logout',             auth, ctrl.logout);
router.get('/me',                  auth, ctrl.me);
router.post('/send-verification',  auth, ctrl.sendVerification);
router.post('/verify-email',       auth, ctrl.verifyEmail);
router.post('/upload-id',          auth, upload.single('document'), ctrl.uploadId);

module.exports = router;
