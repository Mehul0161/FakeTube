const Video = require('../models/Video');
const User = require('../models/User');
const { uploadVideo: uploadVideoToCloud, uploadThumbnail } = require('../config/cloudinary');

// Upload video
const uploadVideo = async (req, res) => {
  try {
    const { title, description, category, tags, isPublic } = req.body;
    let videoUrl = '';
    let thumbnailUrl = '';

    // Upload video file
    if (req.files.video) {
      videoUrl = await uploadVideoToCloud(req.files.video[0].path);
    }

    // Upload thumbnail
    if (req.files.thumbnail) {
      thumbnailUrl = await uploadThumbnail(req.files.thumbnail[0].path);
    }

    // Create video document
    const video = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic,
      creator: req.user._id
    });

    await video.save();

    // Add video to user's videos
    await User.findByIdAndUpdate(req.user._id, {
      $push: { videos: video._id }
    });

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
};

// Get all videos
const getAllVideos = async (req, res) => {
  try {
    const { category, sort, page = 1, limit = 10 } = req.query;
    const query = { isPublic: true };

    if (category) {
      query.category = category;
    }

    let sortOption = {};
    switch (sort) {
      case 'trending':
        sortOption = { views: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const videos = await Video.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('creator', 'displayName avatar')
      .exec();

    const total = await Video.countDocuments(query);

    res.json({
      videos,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
};

// Get video by ID
const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'displayName avatar subscribers')
      .populate('comments.user', 'displayName avatar');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Increment view count
    video.views += 1;
    await video.save();

    // Add to user's watch history
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          watchHistory: {
            video: video._id,
            watchedAt: new Date()
          }
        }
      });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video', error: error.message });
  }
};

// Update video
const updateVideo = async (req, res) => {
  try {
    const { title, description, category, tags, isPublic } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (tags) updates.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) updates.isPublic = isPublic;

    // Upload new thumbnail if provided
    if (req.files?.thumbnail) {
      updates.thumbnailUrl = await uploadThumbnail(req.files.thumbnail[0].path);
    }

    const video = await Video.findOneAndUpdate(
      { _id: req.params.id, creator: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!video) {
      return res.status(404).json({ message: 'Video not found or unauthorized' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error updating video', error: error.message });
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found or unauthorized' });
    }

    // Remove video from user's videos
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { videos: video._id }
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
};

// Like/Unlike video
const toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const likeIndex = video.likes.indexOf(req.user._id);
    if (likeIndex === -1) {
      video.likes.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, {
        $push: { likedVideos: video._id }
      });
    } else {
      video.likes.splice(likeIndex, 1);
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { likedVideos: video._id }
      });
    }

    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling like', error: error.message });
  }
};

module.exports = {
  uploadVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleLike
}; 