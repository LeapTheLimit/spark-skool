// Helper function to trigger updates
export const triggerDashboardUpdate = () => {
  // Dispatch custom event to update all components
  window.dispatchEvent(new CustomEvent('localDataUpdate'));
};

// Helper function to save grades
export const saveGrade = async (grade: any) => {
  try {
    // Get existing grades
    const grades = JSON.parse(localStorage.getItem('gradedExams') || '[]');
    
    // Add new grade
    grades.push({
      id: Date.now(),
      student: grade.student,
      title: grade.title,
      grade: grade.score,
      gradedAt: new Date()
    });
    
    // Save back to localStorage
    localStorage.setItem('gradedExams', JSON.stringify(grades));
    
    // Trigger dashboard update
    triggerDashboardUpdate();
    
    return true;
  } catch (error) {
    console.error('Failed to save grade:', error);
    throw error;
  }
}; 