import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/config/routes.constants';
import { cn } from '@/lib/utils';
import { userService, UpdateProfileData } from '@/services/user.service';

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [editedProfile, setEditedProfile] = useState<UpdateProfileData>({});
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userService.getProfile,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update profile');
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handleCancel = () => {
    setEditedProfile({});
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Step 1: Get presigned URL
      const { upload_url, s3_key } = await userService.getAvatarUploadUrl(
        file.name,
        file.type
      );

      // Step 2: Upload to S3
      await axios.put(upload_url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Update profile with S3 key
      await userService.updateProfile({ profile_image_url: s3_key });

      // Invalidate queries to refresh profile
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile image updated successfully');
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDisplayValue = (field: keyof UpdateProfileData, defaultValue: string = '') => {
    if (isEditing) {
      return editedProfile[field] !== undefined ? editedProfile[field] : (profile?.[field] || defaultValue);
    }
    return profile?.[field] || defaultValue;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="relative group">
              {profile?.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Profile"
                  className="h-32 w-32 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-4xl shadow-lg">
                  {profile?.first_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'U'}{profile?.last_name?.[0] || ''}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-5 w-5 animate-spin dark:text-gray-50" />
                ) : (
                  <Camera className="h-5 w-5 dark:text-gray-50" />
                )}
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {profile?.first_name || profile?.last_name ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() : 'No name set'}
                </h2>
                {profile?.job_title && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {profile.job_title}
                  </span>
                )}
              </div>
              {profile?.department && <p className="text-muted-foreground">{profile.department}</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
                {profile?.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {new Date(profile?.created_at || new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <Card className="dark:border-gray-800">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={getDisplayValue('first_name')}
                    onChange={(e) => setEditedProfile({ ...editedProfile, first_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={getDisplayValue('last_name')}
                    onChange={(e) => setEditedProfile({ ...editedProfile, last_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={getDisplayValue('phone_number')}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone_number: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={getDisplayValue('location')}
                  onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={getDisplayValue('bio')}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              {isEditing && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:border-gray-800">
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
              <CardDescription>Your role and department details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={getDisplayValue('job_title')}
                    onChange={(e) => setEditedProfile({ ...editedProfile, job_title: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={getDisplayValue('department')}
                    onChange={(e) => setEditedProfile({ ...editedProfile, department: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
