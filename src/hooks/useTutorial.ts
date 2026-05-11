import { useCallback, useEffect, useRef } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { TUTORIALS, tutorialStorageKey } from "@/tutorials";

export function useTutorial(key: string | undefined) {
  const startedRef = useRef(false);

  const start = useCallback(() => {
    if (!key) return;
    const tutorial = TUTORIALS[key];
    if (!tutorial) return;

    const steps: DriveStep[] = tutorial.steps.map((s) => ({
      element: s.element,
      popover: {
        title: s.title,
        description: s.description,
        side: s.side ?? "bottom",
        align: s.align ?? "center",
      },
    }));

    const d = driver({
      showProgress: true,
      progressText: "{{current}} de {{total}}",
      nextBtnText: "Próximo →",
      prevBtnText: "← Anterior",
      doneBtnText: "Concluir",
      allowClose: true,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      smoothScroll: true,
      steps,
      onDestroyed: () => {
        try {
          localStorage.setItem(tutorialStorageKey(key), "1");
        } catch {}
      },
    });
    d.drive();
  }, [key]);

  // Auto-start on first visit
  useEffect(() => {
    if (!key || startedRef.current) return;
    startedRef.current = true;
    let seen = "1";
    try {
      seen = localStorage.getItem(tutorialStorageKey(key)) ?? "";
    } catch {}
    if (seen) return;
    // Delay so that target elements have time to mount
    const t = setTimeout(() => start(), 600);
    return () => clearTimeout(t);
  }, [key, start]);

  return { start };
}
