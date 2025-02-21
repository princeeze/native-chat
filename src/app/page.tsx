"use client";

import type React from "react";
import { toast } from "sonner"


import { useState, useEffect } from "react";
import { Bot, Send, User, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
}

interface MessageActionsProps {
  content: string;
  onSummarize: () => void;
  onTranslate: (language: string) => void;
}

// Common English words for more accurate language detection
const COMMON_ENGLISH_WORDS = new Set([
  "the",
  "be",
  "to",
  "of",
  "and",
  "a",
  "in",
  "that",
  "have",
  "i",
  "it",
  "for",
  "not",
  "on",
  "with",
  "he",
  "as",
  "you",
  "do",
  "at",
  "this",
  "but",
  "his",
  "by",
  "from",
  "they",
  "we",
  "say",
  "her",
  "she",
]);

const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

// Mock responses for different actions
const mockResponses = {
  summarize: (text: string) => {
    const firstSentence = text.split(".")[0];
    return `Summary: ${firstSentence}. This is the main point of the message.`;
  },
  translate: (text: string, language: string) => {
    const languageName = LANGUAGES.find((l) => l.value === language)?.label;
    return `${languageName} translation: ${text} (${language})`;
  },
};

function MessageActions({
  content,
  onSummarize,
  onTranslate,
}: MessageActionsProps) {
  const [isEnglish, setIsEnglish] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");

  useEffect(() => {
    setIsChecking(true);

    const detectLanguage = async () => {
      const languageDetectorCapabilities = await self.ai.languageDetector.capabilities();
      const canDetect = languageDetectorCapabilities.capabilities;
      let detector;
      if (canDetect === 'no') {
        // The language detector isn't usable.
        toast("The language detector isn't usable")
        return;
      }
      if (canDetect === 'readily') {
        // The language detector can immediately be used.
        detector = await self.ai.languageDetector.create();
      } else {
        // The language detector can be used after model download.
        detector = await self.ai.languageDetector.create({
          monitor(m: { addEventListener: (arg0: string, arg1: (e: any) => void) => void; }) {
            m.addEventListener('downloadprogress', (e) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
            });
          },
        });
        await detector.ready;
      }
      const someUserText = 'Hallo und herzlich willkommen!';
      const results = await detector.detect(content);
      const languageResult = results[0].detectedLanguage
      if (languageResult === "en") {
        setIsEnglish(true)
      }
    };

    detectLanguage();
    setIsChecking(false);
  }, [content]);

  return (
    <div className="flex gap-2 mt-2">
      {isChecking ? (
        <Button variant="outline" size="sm" disabled>
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          Detecting language...
        </Button>
      ) : (
        isEnglish && (
          <Button variant="outline" size="sm" onClick={onSummarize}>
            Summarize
          </Button>
        )
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            size="sm"
            className="justify-between"
          >
            {selectedLanguage
              ? LANGUAGES.find(
                (language) => language.value === selectedLanguage
              )?.label
              : "Translate to..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search language..." />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((language) => (
                  <CommandItem
                    key={language.value}
                    value={language.value}
                    onSelect={(currentValue) => {
                      setSelectedLanguage(currentValue);
                      onTranslate(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLanguage === language.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {language.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Simulate typing effect with setTimeout
  const simulateTyping = (response: string) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            content: response,
            role: "assistant",
          },
        ]);
        resolve();
      }, 1500);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user" as const,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  };

  const handleSummarize = async (content: string) => {
    const summary = mockResponses.summarize(content);
    await simulateTyping(summary);
  };

  const handleTranslate = async (content: string, language: string) => {
    const translation = mockResponses.translate(content, language);
    await simulateTyping(translation);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="h-[60vh] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"
                }`}
            >
              <div className="flex items-start gap-2 max-w-[80%]">
                <div
                  className={`rounded-lg p-2 px-4 ${message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                    }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
              {message.role === "user" && (
                <MessageActions
                  content={message.content}
                  onSummarize={() => handleSummarize(message.content)}
                  onTranslate={(language) =>
                    handleTranslate(message.content, language)
                  }
                />
              )}
            </div>
          ))}
          {isTyping && (
            <div className="rounded-lg w-fit p-2 px-4 bg-muted">
              <div className="ticontainer">
                <div className="tiblock">
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" disabled={isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
