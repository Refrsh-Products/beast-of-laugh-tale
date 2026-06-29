import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useQuizService } from '@/hooks/useQuizService';
import type { QuizSession, QuizDifficulty } from '@freshr/shared';

type ViewState = 'list' | 'generate' | 'take' | 'review';

export default function QuizScreen() {
  const { notebookId } = useLocalSearchParams<{ notebookId: string }>();
  const quizService = useQuizService();
  
  const [viewState, setViewState] = useState<ViewState>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSession[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);

  // Generate State
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('MEDIUM');
  const [numQuestions, setNumQuestions] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);

  // Take State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId/text

  useEffect(() => {
    if (viewState === 'list' && notebookId) {
      loadQuizzes();
    }
  }, [viewState, notebookId]);

  const loadQuizzes = async () => {
    setIsLoading(true);
    try {
      const data = await quizService.listQuizSessionsByNotebook(notebookId);
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!notebookId) return;
    setIsGenerating(true);
    try {
      const newQuiz = await quizService.createQuizSession({
        notebook: notebookId,
        topic: topic || 'All Topics',
        difficulty,
        num_questions: parseInt(numQuestions) || 5,
        quiz_type: 'PRACTICE',
      });
      setActiveQuiz(newQuiz);
      setAnswers({});
      setCurrentQIndex(0);
      setViewState('take');
    } catch (err: any) {
      console.error('Failed to generate quiz', err);
      Alert.alert('Error', err?.message || 'Failed to generate quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setIsLoading(true);
    try {
      // The answers array structure depends on the backend. 
      // Usually it's an array of { question_id, selected_option } or similar.
      // Assuming a generic submission format for now:
      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        question_id: qId,
        answer: ans,
      }));
      // Note: If the backend submit format is different, this might need tweaking.
      await quizService.submitQuiz(activeQuiz.id as any, formattedAnswers as any);
      
      // Fetch the updated quiz with results
      const updatedQuiz = await quizService.fetchQuizSession(activeQuiz.id as any);
      setActiveQuiz(updatedQuiz);
      setViewState('review');
    } catch (err: any) {
      console.error('Failed to submit quiz', err);
      Alert.alert('Error', 'Failed to submit quiz.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && viewState === 'list') {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen className="flex-1 bg-background">
      <ScrollView contentContainerClassName="p-4 gap-6">
        
        {viewState === 'list' && (
          <View className="gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">Quizzes</Text>
              <Button onPress={() => setViewState('generate')} size="sm">
                <Text>+ New Quiz</Text>
              </Button>
            </View>
            
            {quizzes.length === 0 ? (
              <Text className="text-center text-muted-foreground py-10">No quizzes yet.</Text>
            ) : (
              quizzes.map((q) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle>{q.title || q.topic || 'Quiz'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Text className="text-muted-foreground">Difficulty: {q.difficulty}</Text>
                    <Text className="text-muted-foreground">Score: {q.score !== undefined && q.score !== null ? `${q.score}%` : 'Not completed'}</Text>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onPress={() => {
                        setActiveQuiz(q);
                        if (q.status === 'COMPLETED') {
                          setViewState('review');
                        } else {
                          setAnswers({});
                          setCurrentQIndex(0);
                          setViewState('take');
                        }
                      }}
                    >
                      <Text>{q.status === 'COMPLETED' ? 'Review' : 'Continue'}</Text>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </View>
        )}

        {viewState === 'generate' && (
          <View className="gap-6">
            <View className="flex-row items-center gap-4">
              <Button variant="ghost" size="icon" onPress={() => setViewState('list')}>
                <Text className="text-lg">←</Text>
              </Button>
              <Text className="text-2xl font-bold">Generate Quiz</Text>
            </View>
            
            <View className="gap-2">
              <Text className="font-medium">Topic (Optional)</Text>
              <Input 
                placeholder="e.g. Chapter 3, Photosynthesis" 
                value={topic} 
                onChangeText={setTopic} 
              />
            </View>
            
            <View className="gap-2">
              <Text className="font-medium">Number of Questions</Text>
              <Input 
                keyboardType="numeric" 
                value={numQuestions} 
                onChangeText={setNumQuestions} 
              />
            </View>
            
            <View className="gap-2">
              <Text className="font-medium">Difficulty</Text>
              <View className="flex-row gap-2">
                {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                  <Button 
                    key={level} 
                    variant={difficulty === level ? 'default' : 'outline'}
                    className="flex-1"
                    onPress={() => setDifficulty(level)}
                  >
                    <Text className={difficulty === level ? 'text-primary-foreground' : ''}>{level}</Text>
                  </Button>
                ))}
              </View>
            </View>
            
            <Button className="mt-4" onPress={handleGenerate} disabled={isGenerating}>
              {isGenerating ? <ActivityIndicator color="#fff" /> : <Text>Generate</Text>}
            </Button>
          </View>
        )}

        {viewState === 'take' && activeQuiz && (
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold">Question {currentQIndex + 1} of {activeQuiz.questions?.length || 0}</Text>
              <Button variant="ghost" onPress={() => setViewState('list')}>
                <Text className="text-destructive">Quit</Text>
              </Button>
            </View>
            
            {activeQuiz.questions?.[currentQIndex] ? (
              <Card>
                <CardHeader>
                  <CardTitle>{activeQuiz.questions[currentQIndex].question_text}</CardTitle>
                </CardHeader>
                <CardContent className="gap-3">
                  {activeQuiz.questions[currentQIndex].choices?.map((choice: any, idx: number) => {
                    const isSelected = answers[activeQuiz.questions![currentQIndex].id] === choice.id;
                    return (
                      <Pressable 
                        key={idx}
                        className={`p-4 rounded-xl border ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
                        onPress={() => setAnswers({ ...answers, [activeQuiz.questions![currentQIndex].id]: choice.id })}
                      >
                        <Text>{choice.text}</Text>
                      </Pressable>
                    );
                  })}
                </CardContent>
                <CardFooter className="flex-row justify-between">
                  <Button 
                    variant="outline" 
                    disabled={currentQIndex === 0}
                    onPress={() => setCurrentQIndex(prev => prev - 1)}
                  >
                    <Text>Prev</Text>
                  </Button>
                  
                  {currentQIndex === (activeQuiz.questions?.length || 0) - 1 ? (
                    <Button onPress={handleSubmit} disabled={isLoading}>
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text>Submit</Text>}
                    </Button>
                  ) : (
                    <Button onPress={() => setCurrentQIndex(prev => prev + 1)}>
                      <Text>Next</Text>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Text>No questions found in this quiz.</Text>
            )}
          </View>
        )}

        {viewState === 'review' && activeQuiz && (
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">Quiz Results</Text>
              <Button variant="ghost" onPress={() => setViewState('list')}>
                <Text>Done</Text>
              </Button>
            </View>
            
            <View className="items-center py-6 bg-muted rounded-2xl">
              <Text className="text-4xl font-bold">{activeQuiz.score ?? 0}%</Text>
              <Text className="text-muted-foreground mt-2">Final Score</Text>
            </View>
            
            <View className="gap-4">
              {activeQuiz.questions?.map((q: any, i: number) => (
                <Card key={q.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {i + 1}. {q.question_text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="gap-2">
                    <Text className={q.is_correct ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                      {q.is_correct ? '✅ Correct' : '❌ Incorrect'}
                    </Text>
                    {q.explanation && (
                      <View className="mt-2 p-3 bg-muted rounded-lg">
                        <Text className="text-sm font-semibold">Explanation:</Text>
                        <Text className="text-sm mt-1">{q.explanation}</Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </Screen>
  );
}
