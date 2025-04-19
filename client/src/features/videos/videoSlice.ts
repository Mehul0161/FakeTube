import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// YouTube API response interfaces
interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  channelTitle: string;
}

interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: YouTubeVideoSnippet;
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoItem[];
}

// Our app's video interface
interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  views: number;
  uploader: {
    id: string;
    displayName: string;
    avatar: string;
  };
  createdAt: string;
}

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: VideoState = {
  videos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

// Helper function to format duration from YouTube API
const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  let result = '';
  if (hours) result += `${hours}:`;
  result += `${minutes.padStart(2, '0')}:`;
  result += seconds.padStart(2, '0');
  
  return result;
};

// Helper function to format view count
const formatViewCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async ({ page = 1, category = '', sort = 'date' }: { page?: number; category?: string; sort?: string }, { rejectWithValue }) => {
    try {
      const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!API_KEY) {
        throw new Error('YouTube API key is not configured');
      }

      // Map our sort parameter to YouTube API valid order parameters
      let orderParam = 'date'; // Default to date
      if (sort === 'trending') {
        orderParam = 'viewCount'; // Use viewCount for trending videos
      } else if (sort === 'date') {
        orderParam = 'date';
      } else if (sort === 'relevance') {
        orderParam = 'relevance';
      } else if (sort === 'rating') {
        orderParam = 'rating';
      } else if (sort === 'title') {
        orderParam = 'title';
      }

      // Build search parameters
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: category || 'music', // Default to 'music' if category is empty
        type: 'video',
        maxResults: '10',
        order: orderParam,
        key: API_KEY,
      });

      // Add pagination token if needed
      if (page > 1 && localStorage.getItem('nextPageToken')) {
        searchParams.append('pageToken', localStorage.getItem('nextPageToken') || '');
      }

      console.log('Fetching videos with params:', searchParams.toString());
      
      // Fetch video list from YouTube API
      const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          throw new Error('YouTube API access denied. Please check your API key configuration or quota limits.');
        }
        throw new Error(errorData.error?.message || 'Failed to fetch videos');
      }

      const data = await response.json();
      
      // Store next page token for pagination
      if (data.nextPageToken) {
        localStorage.setItem('nextPageToken', data.nextPageToken);
      }

      // Map YouTube data to our format
      const videos = await Promise.all(data.items.map(async (item: any) => {
        try {
          // Get video details including statistics
          const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${item.id.videoId}&key=${API_KEY}`
          );
          
          if (!detailsResponse.ok) {
            throw new Error('Failed to fetch video details');
          }
          
          const detailsData = await detailsResponse.json();
          const videoDetails = detailsData.items[0];

          return {
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            duration: videoDetails?.contentDetails?.duration || 'N/A',
            views: parseInt(videoDetails?.statistics?.viewCount || '0'),
            createdAt: item.snippet.publishedAt,
            uploader: {
              id: item.snippet.channelId,
              displayName: item.snippet.channelTitle,
              avatar: `https://placehold.co/40?text=${item.snippet.channelTitle.charAt(0)}`,
            },
          };
        } catch (error) {
          console.error('Error fetching video details:', error);
          return null;
        }
      }));

      // Filter out any null values from failed detail fetches
      const validVideos = videos.filter((video): video is Video => video !== null);

      return {
        videos: validVideos,
        totalPages: Math.ceil(data.pageInfo.totalResults / 10),
        nextPageToken: data.nextPageToken,
      };
    } catch (error: any) {
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchVideoById = createAsyncThunk(
  'videos/fetchVideoById',
  async (id: string) => {
    try {
      const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      
      if (!YOUTUBE_API_KEY) {
        throw new Error('YouTube API key is not configured');
      }
      
      // Fetch video details
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${id}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items.length === 0) {
        throw new Error('Video not found');
      }
      
      const video = data.items[0];
      
      // Map to our app's format
      return {
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.high.url,
        duration: formatDuration(video.contentDetails.duration),
        views: parseInt(video.statistics.viewCount, 10),
        uploader: {
          id: video.snippet.channelId,
          displayName: video.snippet.channelTitle,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(video.snippet.channelTitle)}&background=random`,
        },
        createdAt: video.snippet.publishedAt,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch video');
    }
  }
);

// These functions would still use your backend API
export const uploadVideo = createAsyncThunk(
  'videos/uploadVideo',
  async (videoData: FormData) => {
    const response = await api.post('/videos', videoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const toggleLike = createAsyncThunk(
  'videos/toggleLike',
  async (videoId: string) => {
    const response = await api.post(`/videos/${videoId}/like`);
    return response.data;
  }
);

const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos;
        state.totalPages = action.payload.totalPages;
        state.currentPage++;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        toast.error(state.error || 'Failed to fetch videos');
      })
      // Fetch Video by ID
      .addCase(fetchVideoById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentVideo = action.payload;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch video';
      })
      // Upload Video
      .addCase(uploadVideo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos.unshift(action.payload);
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload video';
      })
      // Toggle Like
      .addCase(toggleLike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.currentVideo && state.currentVideo.id === action.payload.id) {
          state.currentVideo = action.payload;
        }
        const videoIndex = state.videos.findIndex(v => v.id === action.payload.id);
        if (videoIndex !== -1) {
          state.videos[videoIndex] = action.payload;
        }
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to toggle like';
      });
  },
});

export const { clearError } = videoSlice.actions;
export default videoSlice.reducer; 