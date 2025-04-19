import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useOutletContext } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { fetchVideos } from '../features/videos/videoSlice';
import VideoCard from '../components/VideoCard';
import { toast } from 'react-hot-toast';

const Search: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { videos, isLoading, error, totalPages, currentPage } = useSelector(
    (state: RootState) => state.videos
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Get category from context with a default empty string if context is null
  const context = useOutletContext<{ 
    currentCategory: string; 
    setCurrentCategory: (category: string) => void 
  }>();
  const setCurrentCategory = context?.setCurrentCategory || (() => {});

  useEffect(() => {
    // Get search term from URL query parameter
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    
    if (query) {
      setSearchTerm(query);
      
      // Update the category in the context to match the search term
      setCurrentCategory(query);
      
      // Fetch videos based on search term
      dispatch(fetchVideos({ 
        page: 1, 
        category: query,
        sort: 'relevance'
      }))
        .unwrap()
        .catch((error) => {
          console.error('Error fetching search results:', error);
          setApiError(error.message || 'Failed to load search results');
          toast.error(error.message || 'Failed to load search results');
        });
    }
  }, [dispatch, location.search, setCurrentCategory]);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      dispatch(fetchVideos({ 
        page: currentPage + 1, 
        category: searchTerm,
        sort: 'relevance'
      }))
        .unwrap()
        .catch((error) => {
          console.error('Error loading more results:', error);
          toast.error(error.message || 'Failed to load more results');
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{searchTerm}"
      </h1>
      
      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : error && videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">{error}</div>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">No videos found for "{searchTerm}"</div>
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
};

export default Search; 