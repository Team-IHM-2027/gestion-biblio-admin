import React, { useState, useEffect } from 'react';
import { Edit, Save, X, User, Mail, Phone, Building, FileText } from 'lucide-react';
import type { UserProfile, ProfileFormData } from '../../types/profile';
import useI18n from '../../hooks/useI18n';

interface ProfileFormProps {
  profile: UserProfile;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: (data: ProfileFormData) => Promise<void>;
  className?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  isEditing,
  onToggleEdit,
  onSave,
  className = ''
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: profile.name ?? '',
    email: profile.email ?? '',
    gender: profile.gender ?? '',
    phone: profile.phone ?? '',
    department: profile.department ?? '',
    bio: profile.bio ?? ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});

  useEffect(() => {
    setFormData({
      name: profile.name ?? '',
      email: profile.email ?? '',
      gender: profile.gender ?? '',
      phone: profile.phone ?? '',
      department: profile.department ?? '',
      bio: profile.bio ?? ''
    });
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const newErrors: Partial<ProfileFormData> = {};
    if (!formData.name.trim()) newErrors.name = t('components:form_validation.name_is_required');
    if (!formData.email.trim()) newErrors.email = t('components:form_validation.email_is_required');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t('components:form_validation.email_format_invalid');
    if (formData.phone && formData.phone.length < 8) newErrors.phone = t('components:form_validation.phone_format_invalid');
    if (formData.bio && formData.bio.length > 500) newErrors.bio = t('components:form_validation.bio_exceeds_limit');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onToggleEdit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name ?? '',
      email: profile.email ?? '',
      gender: profile.gender ?? '',
      phone: profile.phone ?? '',
      department: profile.department ?? '',
      bio: profile.bio ?? ''
    });
    setErrors({});
    onToggleEdit();
  };

  const FormField = ({
    icon: Icon,
    label,
    value,
    onChange,
    type = 'text',
    options = null,
    error = ''
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    options?: { value: string; label: string }[] | null;
    error?: string;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700">
        <Icon className="w-4 h-4 mr-2 text-gray-500" />
        {label}
      </label>

      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${!isEditing ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white border-gray-300'}
            ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
        >
          <option value="">Sélectionner</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing}
          rows={3}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-md shadow-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${!isEditing ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white border-gray-300'}
            ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          placeholder={isEditing ? t('components:input_placeholders.enter_bio') : ''}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing}
          className={`w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${!isEditing ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-white border-gray-300'}
            ${error ? 'border-red-500 ring-1 ring-red-500' : ''}`}
          placeholder={isEditing ? t('components:common.enter_value', { defaultValue: `Entrez ${label.toLowerCase()}` }) : ''}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {type === 'textarea' && isEditing && (
        <p className="text-xs text-gray-500 text-right">{value.length}/500 caractères</p>
      )}
    </div>
  );

  const genderOptions = [
    { value: 'Male', label: t('components:gender_options.male_option') },
    { value: 'Female', label: t('components:gender_options.female_option') }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{t('components:profile.personal_info')}</h3>
        {!isEditing ? (
          <button onClick={onToggleEdit} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md">
            <Edit className="w-4 h-4" />
            <span>{t('components:action_buttons.edit_profile')}</span>
          </button>
        ) : (
          <button type="button" onClick={handleCancel} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            <X className="w-4 h-4" />
            <span>{t('components:action_buttons.cancel_edit')}</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField icon={User} label={t('components:profile.full_name')} value={formData.name} onChange={(v) => handleInputChange('name', v)} error={errors.name ?? ''} />
          <FormField icon={Mail} label={t('components:profile.email_address')} value={formData.email} onChange={(v) => handleInputChange('email', v)} type="email" error={errors.email ?? ''} />
          <FormField icon={Phone} label={t('components:profile.phone_number')} value={formData.phone ?? ''} onChange={(v) => handleInputChange('phone', v)} error={errors.phone ?? ''} />
          <FormField icon={User} label={t('components:profile.user_gender')} value={formData.gender ?? ''} onChange={(v) => handleInputChange('gender', v)} options={genderOptions} />
          <FormField icon={Building} label={t('components:profile.user_department')} value={formData.department ?? ''} onChange={(v) => handleInputChange('department', v)} />
          <FormField icon={FileText} label={t('components:profile.user_bio')} value={formData.bio ?? ''} onChange={(v) => handleInputChange('bio', v)} type="textarea" error={errors.bio ?? ''} />
        </div>

        {isEditing && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? t('components:user_messages.currently_saving') : t('components:action_buttons.save_modifications')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileForm;
