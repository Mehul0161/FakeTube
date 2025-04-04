import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
            src={userProfile.avatar}
            alt={userProfile.displayName}
            className="h-20 w-20 rounded-full"
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

      {/* Bio */}
      <div className="prose max-w-none">
        <p className="text-gray-700">{userProfile.bio}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-primary-500 text-primary-600 py-4 px-1 text-sm font-medium">
            Videos
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
            Playlists
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 py-4 px-1 text-sm font-medium">
            About
          </button>
        </nav>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userProfile.watchHistory.map((item) => (
          <VideoCard key={item.video.id} video={item.video} />
        ))}
      </div>
    </div>
  );
};

export default Profile; 