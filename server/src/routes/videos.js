const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleLike
} = require('../controllers/videoController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Video routes
router.post('/', auth, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), uploadVideo);

router.get('/', getAllVideos);
router.get('/:id', getVideoById);

router.patch('/:id', auth, upload.single('thumbnail'), updateVideo);
router.delete('/:id', auth, deleteVideo);
router.post('/:id/like', auth, toggleLike);

module.exports = router; 