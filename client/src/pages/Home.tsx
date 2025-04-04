import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { fetchVideos } from '../features/videos/videoSlice';
import VideoCard from '../components/VideoCard';
import { toast } from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

function Home() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { videos, isLoading, error, totalPages, currentPage } = useSelector(
    (state: RootState) => state.videos
  );
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<string>('date');
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Check if YouTube API key is configured
    const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) {
      setApiError('YouTube API key is not configured. Please check your .env file.');
      toast.error('YouTube API key is not configured');
      return;
    }

    // Check if we're coming from a search page
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('q');
    
    if (searchQuery) {
      // If we have a search query, use it as the category
      setCategory(searchQuery);
      dispatch(fetchVideos({ page: 1, category: searchQuery, sort: 'relevance' }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching videos:', error);
          setApiError(error.message || 'Failed to load videos');
          toast.error(error.message || 'Failed to load videos');
        });
    } else {
      // Otherwise, fetch videos based on the selected category
      dispatch(fetchVideos({ page: 1, category, sort }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching videos:', error);
          setApiError(error.message || 'Failed to load videos');
          toast.error(error.message || 'Failed to load videos');
        });
    }
  }, [dispatch, category, sort, location.search]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchVideos({ page: currentPage + 1, category, sort }))
        .unwrap()
        .catch((error) => {
          toast.error(error.message || 'Failed to load more videos');
        });
    }
  };

  const categories = [
    'All',
    'Music',
    'Gaming',
    'News',
    'Sports',
    'Technology',
    'Education',
    'Entertainment',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                category === (cat === 'All' ? '' : cat)
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="date">Latest</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : error && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">{error}</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>

          {currentPage < totalPages && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home; 