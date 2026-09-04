import type {
  ElectiveCategory,
  ElectiveLesson,
  ElectiveModule,
  ElectiveQuestion,
} from "./types";
import { CATEGORY_META } from "./types";
import { functionalModules } from "./functional";
import { operationalModules } from "./operational";
import { playbookModules } from "./playbooks";
import { complianceModules } from "./compliance";

export type { ElectiveCategory, ElectiveLesson, ElectiveModule, ElectiveQuestion };
export { CATEGORY_META };

export const ELECTIVE_MODULES: ElectiveModule[] = [
  ...functionalModules,
  ...operationalModules,
  ...playbookModules,
  ...complianceModules,
];

export const CATEGORY_ORDER: ElectiveCategory[] = [
  "functional",
  "operational",
  "playbook",
  "compliance",
];

export function getModule(slug: string): ElectiveModule | undefined {
  return ELECTIVE_MODULES.find((m) => m.slug === slug);
}

export function getLesson(
  moduleSlug: string,
  lessonSlug: string,
): { module: ElectiveModule; lesson: ElectiveLesson } | undefined {
  const module = getModule(moduleSlug);
  const lesson = module?.lessons.find((l) => l.slug === lessonSlug);
  if (!module || !lesson) return undefined;
  return { module, lesson };
}

export const TOTAL_ELECTIVE_LESSONS = ELECTIVE_MODULES.reduce(
  (sum, m) => sum + m.lessons.length,
  0,
);
