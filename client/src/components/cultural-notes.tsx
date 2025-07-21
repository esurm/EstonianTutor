import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { useToast } from "@/hooks/use-toast";
import { Flag, Play, Pause, Volume2, Globe, Info } from "lucide-react";

interface CulturalNote {
  id: string;
  title: string;
  content: string;
  estonianPhrase: string;
  spanishTranslation: string;
  comparison?: string;
  imageUrl?: string;
}

const culturalNotes: CulturalNote[] = [
  {
    id: "digital-estonia",
    title: "Estonia Digital",
    content: "Estonia es uno de los países más digitales del mundo. El 99% de los servicios gubernamentales están disponibles en línea.",
    estonianPhrase: "Digitaalne riik",
    spanishTranslation: "Estado digital",
    comparison: "En Honduras, 'gobierno digital' sería más común que 'estado digital'.",
  },
  {
    id: "song-festival",
    title: "Festival de la Canción",
    content: "Cada cinco años, Estonia celebra el Festival de la Canción donde participan más de 30,000 cantantes.",
    estonianPhrase: "Laulupidu",
    spanishTranslation: "Festival de la canción",
    comparison: "Similar a los festivales folclóricos hondureños, pero mucho más masivo.",
  },
  {
    id: "sauna-culture",
    title: "Cultura del Sauna",
    content: "El sauna es parte integral de la cultura estonia. Cada familia tiene acceso a uno.",
    estonianPhrase: "Saunakultuur",
    spanishTranslation: "Cultura del sauna",
    comparison: "En Honduras no tenemos esta tradición debido al clima tropical.",
  },
  {
    id: "forest-coverage",
    title: "Bosques de Estonia",
    content: "Más del 50% de Estonia está cubierto de bosques. Es un país muy verde y natural.",
    estonianPhrase: "Roheline riik",
    spanishTranslation: "País verde",
    comparison: "Similar a Honduras en la abundancia de naturaleza, pero con diferentes ecosistemas.",
  }
];

export function CulturalNotes() {
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [isPlayingPhrase, setIsPlayingPhrase] = useState(false);
  const { playAudio, synthesizeSpeech } = useSpeech();
  const { toast } = useToast();

  const currentNote = culturalNotes[currentNoteIndex];

  const handlePlayPhrase = async () => {
    if (isPlayingPhrase) return;
    
    try {
      setIsPlayingPhrase(true);
      const tts = await synthesizeSpeech(currentNote.estonianPhrase, "et-EE");
      await playAudio(tts.audioUrl);
    } catch (error) {
      toast({
        title: "Error de Audio",
        description: "No se pudo reproducir el audio.",
        variant: "destructive",
      });
    } finally {
      setIsPlayingPhrase(false);
    }
  };

  const nextNote = () => {
    setCurrentNoteIndex((prev) => (prev + 1) % culturalNotes.length);
  };

  const prevNote = () => {
    setCurrentNoteIndex((prev) => (prev - 1 + culturalNotes.length) % culturalNotes.length);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Flag className="h-5 w-5 text-primary" />
          <span>Nota Cultural</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cultural Image/Background */}
        <div className="relative rounded-lg overflow-hidden h-32 bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center">
              <Globe className="h-8 w-8 text-white mx-auto mb-2" />
              <h4 className="text-white font-semibold">{currentNote.title}</h4>
            </div>
          </div>
        </div>

        {/* Cultural Content */}
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>¿Sabías que...</strong> {currentNote.content}
          </p>
          
          {/* Estonian Phrase */}
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Frase del día:</strong>
            </p>
            <p className="text-primary font-medium text-lg mb-1">
              "{currentNote.estonianPhrase}"
            </p>
            <p className="text-gray-600 italic text-sm mb-2">
              {currentNote.spanishTranslation}
            </p>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPhrase}
              disabled={isPlayingPhrase}
              className="flex items-center space-x-1 text-primary hover:text-primary/80 p-0 h-auto"
            >
              {isPlayingPhrase ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="text-xs">
                {isPlayingPhrase ? "Reproduciendo..." : "Escuchar pronunciación"}
              </span>
            </Button>
          </div>
          
          {/* Cultural Comparison */}
          {currentNote.comparison && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  <strong>Comparación:</strong> {currentNote.comparison}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Dots */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevNote}
            disabled={culturalNotes.length <= 1}
          >
            Anterior
          </Button>
          
          <div className="flex space-x-2">
            {culturalNotes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentNoteIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentNoteIndex ? "bg-primary" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextNote}
            disabled={culturalNotes.length <= 1}
          >
            Siguiente
          </Button>
        </div>

        {/* Fun Fact Badge */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 mt-4">
          <div className="flex items-center space-x-2">
            <Flag className="h-4 w-4 text-green-600" />
            <span className="text-green-800 font-medium text-sm">Dato Curioso</span>
          </div>
          <p className="text-green-700 text-xs mt-1">
            Estonia tiene más startups per cápita que cualquier otro país europeo. ¡De ahí salieron Skype y Bolt!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}