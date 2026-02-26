import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Verse {
  id: string;
  text: string;
  reference: string;
}

export default function DailyVerse() {
  const { data: verseData, isLoading } = useQuery<{ verse: Verse | null }>({
    queryKey: ['/api/verse'],
  });

  if (isLoading || !verseData?.verse) {
    return (
      <Card className="max-w-4xl mx-auto p-12 md:p-16 lg:p-20" data-testid="card-daily-verse">
        <div className="text-center space-y-8">
          <div className="flex items-center justify-center gap-4">
            <Separator className="w-12 md:w-20" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">
              assim diz o soberano
            </span>
            <Separator className="w-12 md:w-20" />
          </div>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">carregando...</div>
          </div>
        </div>
      </Card>
    );
  }

  const currentVerse = verseData?.verse;

  return (
    <Card className="max-w-4xl mx-auto p-12 md:p-16 lg:p-20" data-testid="card-daily-verse">
      <div className="text-center flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-4">
          <Separator className="w-12 md:w-20" />
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-light">
            assim diz o soberano
          </span>
          <Separator className="w-12 md:w-20" />
        </div>
        
        <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light lowercase text-foreground leading-relaxed px-4 md:px-8 py-8">
          "{currentVerse.text}"
        </blockquote>
        
        <cite className="block text-sm uppercase tracking-[0.15em] text-muted-foreground font-light">
          {currentVerse.reference}
        </cite>
      </div>
    </Card>
  );
}
