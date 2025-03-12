import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ChatInput({
  onSubmit,
  isDisabled = false,
  placeholder = "Was möchten Sie wissen?",
  primaryColor = "#005e3f", 
  secondaryColor = "#004730"
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    if (inputValue.trim() && !isDisabled) {
      onSubmit(inputValue);
      setInputValue("");
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit();
    }} className="relative w-full">
      <div className={cn(
        "absolute inset-0 rounded-3xl blur-lg transition-all duration-500",
        isFocused ? "opacity-70 scale-105" : "opacity-0 scale-100"
      )} style={{ 
        background: `linear-gradient(to right, ${primaryColor}20, ${secondaryColor || primaryColor}20)` 
      }} />
      
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r rounded-3xl" 
          style={{ 
            backgroundImage: `linear-gradient(to right, ${primaryColor}0A, ${secondaryColor || primaryColor}0A)`
          }} 
        />
        <div className={`absolute h-7 w-[2px] top-1/2 -mt-3.5 transition-all duration-200 left-8 ${
          inputValue ? 'opacity-0' : 'opacity-100'
        } ${
          isFocused ? 'animate-pulse' : ''
        }`} 
          style={{ 
            backgroundColor: isFocused ? primaryColor : '#cbd5e1'
          }} 
        />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isDisabled}
          className="w-full pl-8 pr-24 py-5 text-base text-slate-700 bg-white backdrop-blur-sm border-2 rounded-3xl shadow-lg transition-all duration-300 outline-none placeholder:text-slate-400"
          style={{ 
            caretColor: primaryColor,
            borderColor: isFocused ? primaryColor : '#e2e8f0'
          }}
        />
        <Button
          type="submit"
          size="lg"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl h-10 px-4"
          style={{ 
            backgroundColor: primaryColor,
            color: secondaryColor
          }}
          disabled={!inputValue.trim() || isDisabled}
        >
          {isDisabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Send className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Fragen</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 