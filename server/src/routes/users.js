const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getUserProfile,
  toggleSubscription,
  getWatchHistory,
  getLikedVideos,
  getPlaylists,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist
} = require('../controllers/userController');

// User routes
router.get('/:id', getUserProfile);
router.post('/:id/subscribe', auth, toggleSubscription);

// User's personal routes (require authentication)
router.get('/me/history', auth, getWatchHistory);
router.get('/me/liked', auth, getLikedVideos);
router.get('/me/playlists', auth, getPlaylists);
router.post('/me/playlists', auth, createPlaylist);
router.post('/me/playlists/:playlistId/videos', auth, addToPlaylist);
router.delete('/me/playlists/:playlistId/videos/:videoId', auth, removeFromPlaylist);

module.exports = router; 