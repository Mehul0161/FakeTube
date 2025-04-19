import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchUserProfile, toggleSubscription } from '../features/users/userSlice';
import VideoCard from '../components/videos/VideoCard';
import toast from 'react-hot-toast';

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const { userProfile, isLoading } = useSelector((state: RootState) => state.users);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  // Redirect to home if no ID is provided
  if (!id) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    if (id) {
      dispatch(fetchUserProfile(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (userProfile && currentUser) {
      setIsSubscribed(userProfile.subscribers.includes(currentUser.id));
    }
  }, [userProfile, currentUser]);

  const handleSubscribe = async () => {
    if (id && currentUser) {
      try {
        await dispatch(toggleSubscription(id)).unwrap();
        setIsSubscribed(!isSubscribed);
        toast.success(isSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully');
      } catch (error) {
        toast.error('Failed to update subscription');
      }
    }
  };

  const renderTabContent = () => {
    if (!userProfile) return null;

    switch (activeTab) {
      case 'videos':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {userProfile.watchHistory && userProfile.watchHistory.length > 0 ? (
              userProfile.watchHistory.map((item) => (
                <VideoCard key={item.video.id} video={item.video} />
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                No videos found
              </div>
            )}
          </div>
        );
      case 'playlists':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProfile.playlists && userProfile.playlists.length > 0 ? (
              userProfile.playlists.map((playlist) => (
                <div key={playlist.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{playlist.name}</h3>
                    <p className="text-sm text-gray-500">{playlist.videos.length} videos</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-gray-500">
                No playlists found
              </div>
            )}
          </div>
        );
      case 'about':
        return (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">About {userProfile.displayName}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{userProfile.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bio</h3>
                <p>{userProfile.bio || 'No bio available'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Joined</h3>
                <p>{new Date(userProfile.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Subscribers</h3>
                <p>{userProfile.subscribers.length}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading || !userProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <img
            src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.displayName)}&background=random`}
            alt={userProfile.displayName}
            className="h-20 w-20 rounded-full object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{userProfile.displayName}</h1>
            <p className="text-gray-500">{userProfile.subscribers.length} subscribers</p>
          </div>
        </div>
        {currentUser && currentUser.id !== userProfile.id && (
          <button
            onClick={handleSubscribe}
            className={`btn ${
              isSubscribed ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`py-4 px-1 text-sm font-medium ${
              activeTab === 'videos'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Videos
          </button>
          <button 
            onClick={() => setActiveTab('playlists')}
            className={`py-4 px-1 text-sm font-medium ${
              activeTab === 'playlists'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Playlists
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className={`py-4 px-1 text-sm font-medium ${
              activeTab === 'about'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            About
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default Profile; 