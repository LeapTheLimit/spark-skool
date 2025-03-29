// Helper function to trigger updates
export const triggerDashboardUpdate = async () => {
  try {
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear localStorage cache
      localStorage.removeItem('dashboardData');
      // Clear sessionStorage cache
      sessionStorage.removeItem('dashboardData');
      // Force a page reload to fetch fresh data
      window.location.reload();
    }
  } catch (error) {
    console.error('Error triggering dashboard update:', error);
  }
};

// Helper function to save grades
export const saveGrade = async (grade: any) => {
  try {
    const response = await fetch('/api/grades/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(grade),
    });

    if (!response.ok) {
      throw new Error('Failed to save grade');
    }

    const data = await response.json();
    
    // Trigger a cache invalidation
    await triggerDashboardUpdate();
    
    return data;
  } catch (error) {
    console.error('Error saving grade:', error);
    throw error;
  }
}; 