import { Timestamp } from 'firebase/firestore';
import { Profile, MemorialProfile, PersonalProfile } from '@/types/profile';

interface ProfileDisplayProps {
  profile: Profile;
}

const isMemorialProfile = (profile: Profile): profile is MemorialProfile => {
  return profile.type === 'memorial';
};

const isPersonalProfile = (profile: Profile): profile is PersonalProfile => {
  return profile.type === 'personal';
};

export const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ profile }) => {
  const formatDate = (date: Date | Timestamp | null | undefined): string => {
    if (!date) return 'Not specified';
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return 'Invalid date';
  };

  const getPhotoUrl = (profile: Profile): string | undefined => {
    if (isMemorialProfile(profile)) {
      return profile.basicInfo?.photo;
    }
    if (isPersonalProfile(profile)) {
      return profile.photoURL;
    }
    return undefined;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        {getPhotoUrl(profile) && (
          <img
            src={getPhotoUrl(profile)}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {isMemorialProfile(profile) && (
            <div className="text-gray-600">
              <p>Born: {formatDate(profile.basicInfo?.dateOfBirth)}</p>
              <p>Died: {formatDate(profile.basicInfo?.dateOfDeath)}</p>
            </div>
          )}
        </div>
      </div>
      
      {isMemorialProfile(profile) && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Life Story</h2>
          <p className="text-gray-700">{profile.lifeStory?.content}</p>
        </div>
      )}
      
      {isPersonalProfile(profile) && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Bio</h2>
          <p className="text-gray-700">{profile.bio}</p>
        </div>
      )}
    </div>
  );
}; 