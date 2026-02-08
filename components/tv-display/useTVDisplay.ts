import { useCallback, useState } from "react";
import type { WorkoutSection } from "@/lib/utils/workoutParser";

/**
 * Hook for managing TV display mode state
 */
export function useTVDisplay(sections: WorkoutSection[]) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(0);

  const openSection = useCallback((id: number) => {
    setCurrentSectionId(id);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goToNext = useCallback(() => {
    if (sections.length === 0) return;
    setCurrentSectionId((prev) => (prev + 1) % sections.length);
  }, [sections.length]);

  const goToPrevious = useCallback(() => {
    if (sections.length === 0) return;
    setCurrentSectionId((prev) => (prev - 1 + sections.length) % sections.length);
  }, [sections.length]);

  const goToSection = useCallback((id: number) => {
    setCurrentSectionId(id);
  }, []);

  const currentSection = sections[currentSectionId] || null;

  return {
    isOpen,
    currentSectionId,
    currentSection,
    openSection,
    close,
    goToNext,
    goToPrevious,
    goToSection,
  };
}
