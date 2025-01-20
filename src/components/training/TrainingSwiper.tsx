import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  const [api, setApi] = useState<any>();

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const handleSwipe = (approved: boolean) => {
    const card = mockTrainingCards[currentIndex];
    toast({
      title: approved ? "Response Approved" : "Response Needs Improvement",
      description: `Feedback recorded for card #${card.id}`,
    });

    if (currentIndex < mockTrainingCards.length - 1) {
      api?.scrollNext();
    } else {
      toast({
        title: "Training Session Complete",
        description: "Thank you for helping improve our AI!",
      });
    }
  };

  return (
    <div className="relative">
      <Carousel setApi={setApi} className="w-full max-w-md mx-auto">
        <CarouselContent>
          {mockTrainingCards.map((card) => (
            <CarouselItem key={card.id}>
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{card.question}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {card.context}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{card.currentResponse}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          onClick={() => handleSwipe(false)}
          className="h-12 w-12 -left-16"
        >
          <ThumbsDown className="h-6 w-6 text-destructive" />
        </CarouselPrevious>
        <CarouselNext
          onClick={() => handleSwipe(true)}
          className="h-12 w-12 -right-16"
        >
          <ThumbsUp className="h-6 w-6 text-primary" />
        </CarouselNext>
      </Carousel>
    </div>
  );
};