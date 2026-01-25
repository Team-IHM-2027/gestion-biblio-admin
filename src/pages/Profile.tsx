import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Common Components
import LoadingSpinner from '../components/common/LoadingSpinner';
import Notification from '../components/common/Notification';

// Profile Components
import ProfileAvatar from '../components/profile/ProfileAvatar';
import ProfileForm from '../components/profile/ProfileForm';

// Hooks
import { useProfile } from '../hooks/useProfile';
import useI18n from '../hooks/useI18n';
import { useAuth } from '../context/AuthContext';

// Types
import type { ProfileFormData, UserProfile } from '../types/profile';

interface NotificationState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

const Profile: React.FC = () => {
  const { t } = useI18n();
  // @ts-ignore
  const navigate = useNavigate();

  const { admin, loading: authLoading } = useAuth();
  const userId = admin?.uid ?? '';

  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: 'success',
    message: ''
  });

  const emptyProfile: UserProfile = {
    id: '',
    name: '',
    email: '',
    gender: '',
    phone: '',
    department: '',
    bio: '',
    image: '',
    role: undefined,
    created_at: undefined,
    updated_at: undefined,
    isActive: false,
    lastLoginAt: undefined
  };

  const profileHook = useProfile(userId);

  const profile = profileHook.profile ?? emptyProfile;

  const loading = authLoading || (userId ? profileHook.loading : false);

  const realIsEditing = userId ? profileHook.isEditing : isEditing;
  const realSetIsEditing = userId ? profileHook.setIsEditing : setIsEditing;
  const realIsImageUploading = userId ? profileHook.isImageUploading : false;
  const realNotification = userId ? profileHook.notification : notification;

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (userId && profileHook.showNotification) {
      profileHook.showNotification(type, message);
    } else {
      setNotification({ visible: true, type, message });
      setTimeout(() => {
        setNotification({ visible: false, type: 'success', message: '' });
      }, 3000);
    }
  };

  const handleImageChange = async (file: File) => {
    if (!userId) {
      showNotification('error', t('user_messages.login_required'));
      return;
    }
    await profileHook.updateProfileImage?.(file, t);
  };

  const handleProfileSave = async (formData: ProfileFormData) => {
    if (!userId) {
      showNotification('error', t('user_messages.login_required'));
      return;
    }
    await profileHook.updateProfile?.(formData, t);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {!userId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>{t('profile.not_connected')}</strong> – {t('profile.not_connected_info')}
          </p>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white rounded-xl p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ProfileAvatar
            imageUrl={profile.image}
            isUploading={realIsImageUploading}
            onImageChange={handleImageChange}
            size="lg"
            editable={!!userId}
          />

          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl font-bold">
              {profile.name || t('profile.status.unnamed_user')}
            </h1>
            <p className="opacity-90 text-lg">
              {profile.email || 'email@exemple.com'}
            </p>

            {profile.department && <p>{profile.department}</p>}
            {profile.bio && <p className="mt-2 italic">{profile.bio}</p>}

            <span className="inline-block mt-3 px-3 py-1 rounded-full text-sm bg-white/20">
              {profile.role === 'admin'
                ? t('user_status.role_administrator')
                : profile.role === 'user'
                  ? t('user_status.role_user')
                  : t('user_status.role_librarian')} 
            </span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-4xl mx-auto">
        <ProfileForm
          profile={profile}
          isEditing={realIsEditing}
          onToggleEdit={() => realSetIsEditing(!realIsEditing)}
          onSave={handleProfileSave}
        />
      </div>

      <Notification
        visible={realNotification.visible}
        type={realNotification.type}
        message={realNotification.message}
        onClose={() =>
          userId
            ? profileHook.showNotification?.('success', '')
            : setNotification({ ...notification, visible: false })
        }
      />
    </div>
  );
};

export default Profile;
