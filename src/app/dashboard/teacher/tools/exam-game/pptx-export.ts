import pptxgen from 'pptxgenjs';

interface ExportOptions {
  title: string;
  questions: any[];
  teacherName: string;
  schoolName: string;
  includeAnswers: boolean;
  theme: 'light' | 'dark';
}

export const exportToPowerPoint = async (options: ExportOptions) => {
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.author = options.teacherName;
  pptx.company = options.schoolName;
  pptx.title = options.title;

  // Define theme colors
  const colors = options.theme === 'dark' ? {
    background: '1C1C1E',
    text: 'FFFFFF',
    accent: '5856D6'
  } : {
    background: 'FFFFFF',
    text: '000000',
    accent: '5856D6'
  };

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.background };
  titleSlide.addText(options.title, {
    x: '10%',
    y: '40%',
    w: '80%',
    fontSize: 44,
    color: colors.text,
    bold: true,
    align: 'center'
  });
  titleSlide.addText(`Created by ${options.teacherName}\n${options.schoolName}`, {
    x: '10%',
    y: '60%',
    w: '80%',
    fontSize: 20,
    color: colors.text,
    align: 'center'
  });

  // Instructions slide
  const instructionsSlide = pptx.addSlide();
  instructionsSlide.background = { color: colors.background };
  instructionsSlide.addText('Instructions', {
    x: '10%',
    y: '10%',
    w: '80%',
    fontSize: 32,
    color: colors.text,
    bold: true
  });
  instructionsSlide.addText([
    { text: '• Read each question carefully\n', options: { fontSize: 18, color: colors.text } },
    { text: '• Select the best answer for each question\n', options: { fontSize: 18, color: colors.text } },
    { text: '• Some questions may have multiple correct answers\n', options: { fontSize: 18, color: colors.text } },
    { text: '• Take your time and think before answering\n', options: { fontSize: 18, color: colors.text } }
  ], {
    x: '10%',
    y: '30%',
    w: '80%'
  });

  // Question slides
  options.questions.forEach((question, index) => {
    const questionSlide = pptx.addSlide();
    questionSlide.background = { color: colors.background };

    // Question number and text
    questionSlide.addText(`Question ${index + 1}`, {
      x: '10%',
      y: '10%',
      w: '80%',
      fontSize: 24,
      color: colors.accent,
      bold: true
    });

    questionSlide.addText(question.question, {
      x: '10%',
      y: '20%',
      w: '80%',
      fontSize: 20,
      color: colors.text
    });

    // Add image if present
    if (question.imageUrl) {
      questionSlide.addImage({
        path: question.imageUrl,
        x: '10%',
        y: '35%',
        w: '80%',
        h: '30%'
      });
    }

    // Add options
    if (question.options) {
      const optionsY = question.imageUrl ? '70%' : '40%';
      question.options.forEach((option: string, optIndex: number) => {
        const letter = String.fromCharCode(65 + optIndex);
        questionSlide.addText(`${letter}. ${option}`, {
          x: '15%',
          y: `${parseFloat(optionsY) + (optIndex * 8)}%`,
          w: '70%',
          fontSize: 16,
          color: colors.text,
          bullet: true
        });
      });
    }

    // Add answer on a separate slide if enabled
    if (options.includeAnswers) {
      const answerSlide = pptx.addSlide();
      answerSlide.background = { color: colors.background };
      
      answerSlide.addText(`Answer to Question ${index + 1}`, {
        x: '10%',
        y: '10%',
        w: '80%',
        fontSize: 24,
        color: colors.accent,
        bold: true
      });

      answerSlide.addText(question.question, {
        x: '10%',
        y: '20%',
        w: '80%',
        fontSize: 16,
        color: colors.text,
        italic: true
      });

      answerSlide.addText(`Correct Answer: ${question.correctAnswer}`, {
        x: '10%',
        y: '35%',
        w: '80%',
        fontSize: 20,
        color: colors.text,
        bold: true
      });

      if (question.explanation) {
        answerSlide.addText('Explanation:', {
          x: '10%',
          y: '45%',
          w: '80%',
          fontSize: 16,
          color: colors.text,
          bold: true
        });

        answerSlide.addText(question.explanation, {
          x: '10%',
          y: '50%',
          w: '80%',
          fontSize: 16,
          color: colors.text
        });
      }
    }
  });

  // Final slide
  const finalSlide = pptx.addSlide();
  finalSlide.background = { color: colors.background };
  finalSlide.addText('Thank You!', {
    x: '10%',
    y: '40%',
    w: '80%',
    fontSize: 44,
    color: colors.text,
    bold: true,
    align: 'center'
  });

  // Save the presentation
  const fileName = `${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_exam.pptx`;
  await pptx.writeFile({ fileName });
}; 