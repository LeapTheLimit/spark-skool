export const generateLessonPlan = async (lessonData: {
  topic: string;
  gradeLevel: string;
  duration: string;
  objectives: string[];
  revisionRequest?: string;
}) => {
  try {
    console.log('Generating lesson with:', lessonData);
    const response = await fetch('/api/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData)
    });
    
    const data = await response.json();
    console.log('Generation Response:', data);
    return data;
  } catch (error) {
    console.error('Generation Error:', error);
    return null;
  }
};

export const processUploadedFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch('/api/process-files', {
    method: 'POST',
    body: formData
  });
  return response.text();
}; 