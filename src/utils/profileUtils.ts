export const isProfileComplete = (profile: any) => {
  if (!profile) return false;
  
  // Check for required fields
  if (!profile.name || !profile.email || !profile.school) return false;
  
  // Check if subjects array exists and has at least one subject
  if (!Array.isArray(profile.subjects) || profile.subjects.length === 0) return false;
  
  // Check if class levels are defined
  if (!profile.classLevel || 
     (Array.isArray(profile.classLevel) && profile.classLevel.length === 0)) {
    return false;
  }
  
  return true;
};

// Save profile completion status to localStorage
export const markProfileComplete = () => {
  try {
    const onboardingStatus = JSON.parse(localStorage.getItem('onboardingStatus') || '{}');
    onboardingStatus.profileComplete = true;
    localStorage.setItem('onboardingStatus', JSON.stringify(onboardingStatus));
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
};

// Get profile completion status from localStorage
export const getProfileStatus = () => {
  try {
    const onboardingStatus = JSON.parse(localStorage.getItem('onboardingStatus') || '{}');
    return onboardingStatus.profileComplete || false;
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return false;
  }
}; 