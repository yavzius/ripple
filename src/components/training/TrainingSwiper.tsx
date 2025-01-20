import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsDown, ThumbsUp, Clock, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Mock training cards data
const mockTrainingCards = [
  {
    id: 1,
    question: "Should AI respond with technical details to non-technical users?",
    context: "A non-technical user asked about system architecture",
    currentResponse: "The system uses a microservices architecture with Docker containers...",
  },
  {
    id: 2,
    question: "Is this response empathetic enough?",
    context: "User reported a critical system failure",
    currentResponse: "I understand this is frustrating. Let's work together to resolve this issue quickly.",
  },
  {
    id: 3,
    question: "Should AI use more casual language here?",
    context: "Young user asking about basic features",
    currentResponse: "The requested functionality can be accessed through the designated interface.",
  },
];

export const TrainingSwiper = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");

  const handleAction = (action: 'true' | 'false' | 'later') => {
    const card = mockTrainingCards[currentIndex];
    
    switch(action) {
      case 'true':
        toast({
          title: "Response Approved",
          description: `Feedback recorded for card #${card.id}`,
        });
        break;
      case 'false':
        toast({
          title: "Response Needs Improvement",
          description: `Feedback recorded for card #${card.id}`,
        });
        break;
      case 'later':
        toast({
          title: "Marked for Later",
          description: "You can review this card in your saved items.",
        });
        break;
    }

    if (currentIndex < mockTrainingCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "Training Session Complete",
        description: "Thank you for helping improve our AI!",
      });
    }
  };

  const toggleNotes = () => {
    setShowNotes(!showNotes);
  };

  const currentCard = mockTrainingCards[currentIndex];

  return (
    <div className="relative">
      <div className="flex justify-center mb-4 space-x-4">
        <Button onClick={() => handleAction('later')} variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          Later
        </Button>
        <Button onClick={toggleNotes} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Notes
        </Button>
      </div>

      {showNotes && (
        <div className="mb-4 animate-fadeIn">
          <Textarea
            placeholder="Add your training notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-4 px-16 text-sm text-muted-foreground">
        <div className="flex items-center">
          <ThumbsDown className="mr-2 h-4 w-4 text-destructive" />
          False
        </div>
        <div className="flex items-center">
          True
          <ThumbsUp className="ml-2 h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{currentCard.question}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentCard.context}
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">{currentCard.currentResponse}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            onClick={() => handleAction('false')}
            variant="outline"
            className="w-24"
          >
            <ThumbsDown className="h-6 w-6 text-destructive" />
          </Button>
          <Button
            onClick={() => handleAction('true')}
            variant="outline"
            className="w-24"
          >
            <ThumbsUp className="h-6 w-6 text-primary" />
          </Button>
        </div>
      </div>
    </div>
  );
};