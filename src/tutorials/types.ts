export type TutorialStep = {
  /** CSS selector. Omit to show a centered popover (no spotlight). */
  element?: string;
  title: string;
  description: string;
  side?: "top" | "right" | "bottom" | "left" | "over";
  align?: "start" | "center" | "end";
};

export type Tutorial = {
  key: string;
  steps: TutorialStep[];
};
