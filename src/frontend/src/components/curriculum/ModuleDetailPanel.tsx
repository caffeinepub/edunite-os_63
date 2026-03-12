import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BookMarked,
  BookmarkPlus,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCreateAssessment,
  useCreateAssignment,
  useDeleteModule,
  useGetAssessments,
  useGetAssignments,
  useGetCourses,
  useGetModules,
  useGetUnits,
  useUpdateModule,
} from "../../hooks/useQueries";
import type {
  Assessment,
  Assignment,
  FrameworkFields,
  LessonPlan,
} from "../../lib/curriculumTypes";
import type { CustomFramework } from "../../lib/customFrameworks";
import { getCustomFrameworks } from "../../lib/customFrameworks";
import StandardsPicker from "./StandardsPicker";

// ─── Lesson Plan helpers ──────────────────────────────────────────────────────

function getLessonPlans(moduleId: number): LessonPlan[] {
  try {
    const raw = localStorage.getItem(`lessonPlans_${moduleId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLessonPlans(moduleId: number, plans: LessonPlan[]): void {
  localStorage.setItem(`lessonPlans_${moduleId}`, JSON.stringify(plans));
}

function createNewLessonPlan(moduleId: number): LessonPlan {
  return {
    id: `lp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    moduleId,
    title: "New Lesson Plan",
    date: new Date().toISOString().slice(0, 10),
    learningObjective: "",
    warmUp: "",
    instruction: "",
    guidedPractice: "",
    independentWork: "",
    closure: "",
    materials: "",
    differentiation: "",
    notes: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ─── Module Template helpers ──────────────────────────────────────────────────

const MODULE_TEMPLATES_KEY = "edunite_module_templates";

interface ModuleTemplate {
  id: string;
  name: string;
  description: string;
  learningObjectives: string[];
  vocabulary: string[];
  assignments: { title: string; assignmentType: string; points: number }[];
  assessments: { title: string; assessmentType: string; totalPoints: number }[];
  createdAt: number;
}

function getModuleTemplates(): ModuleTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(MODULE_TEMPLATES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveModuleTemplate(tpl: Omit<ModuleTemplate, "id" | "createdAt">) {
  const existing = getModuleTemplates();
  const newTpl: ModuleTemplate = {
    ...tpl,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  localStorage.setItem(
    MODULE_TEMPLATES_KEY,
    JSON.stringify([...existing, newTpl]),
  );
  return newTpl;
}

interface ModuleDetailPanelProps {
  moduleId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onNavigateToItem?: (type: "assignment" | "assessment", id: number) => void;
  onNavigateToLessonPlan?: (lessonPlanId: string) => void;
}

// ─── Assignment types ─────────────────────────────────────────────────────────

const ASSIGNMENT_TYPE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-amber-100 text-amber-700",
  "bg-red-100 text-red-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-green-100 text-green-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
];

function assignmentTypeBadgeClass(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++)
    hash = (hash * 31 + type.charCodeAt(i)) & 0xffff;
  return ASSIGNMENT_TYPE_COLORS[hash % ASSIGNMENT_TYPE_COLORS.length];
}

// ─── Assignment Editor ────────────────────────────────────────────────────────

function TagInputModule({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            const trimmed = input.trim().replace(/,$/, "");
            if (trimmed) {
              onChange([...values, trimmed]);
              setInput("");
            }
          }
        }}
        placeholder={placeholder ?? "Type and press Enter to add..."}
        className="text-sm"
      />
    </div>
  );
}

export default function ModuleDetailPanel({
  moduleId,
  unitId,
  courseId,
  onDeleted,
  onNavigateToItem,
  onNavigateToLessonPlan,
}: ModuleDetailPanelProps) {
  const { data: modules = [] } = useGetModules(unitId);
  const mod = modules.find((m) => m.id === moduleId);

  // Look up parent course for custom framework
  const { data: courses = [] } = useGetCourses();
  const parentCourse = courses.find((c) => c.id === courseId);

  // Look up parent unit title for header subtitle
  const { data: units = [] } = useGetUnits(courseId);
  const parentUnit = units.find((u) => u.id === unitId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [vocabulary, setVocabulary] = useState<string[]>([]);
  const [standards, setStandards] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [objInput, setObjInput] = useState("");
  const [vocabInput, setVocabInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [titleError, setTitleError] = useState("");

  const [customFieldValues, setCustomFieldValues] = useState<
    Record<string, string | string[]>
  >({});

  // Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [moduleTemplates, setModuleTemplates] = useState<ModuleTemplate[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(
    null,
  );
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);

  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createAssignment = useCreateAssignment();
  const createAssessment = useCreateAssessment();

  const { data: assignments = [] } = useGetAssignments(moduleId);
  const { data: assessments = [] } = useGetAssessments(moduleId);

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [lessonPlansExpanded, setLessonPlansExpanded] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-runs when moduleId changes to reset form
  useEffect(() => {
    if (mod) {
      setTitle(mod.title);
      setDescription(mod.description);
      setLearningObjectives(mod.learningObjectives ?? []);
      setVocabulary(mod.vocabulary ?? []);
      setStandards(mod.standards ?? []);
      setTags(mod.tags ?? []);
      const customData = mod.frameworkFields?.custom;
      setCustomFieldValues(customData?.values ?? {});
      isFirstLoad.current = true;
    }
    // Load lesson plans from localStorage
    const plans = getLessonPlans(moduleId);
    setLessonPlans(plans);
    setLessonPlansExpanded(plans.length > 0);
  }, [moduleId]);

  const triggerSave = (
    t: string,
    d: string,
    lo: string[],
    voc: string[],
    std: string[],
    tg: string[],
    fwf?: FrameworkFields,
  ) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateModule.mutateAsync({
          id: moduleId,
          unitId,
          courseId,
          title: t,
          description: d,
          learningObjectives: lo,
          vocabulary: voc,
          standards: std,
          tags: tg,
          frameworkFields: fwf,
        });
        setSavedAt(new Date());
      } catch {}
      setSaving(false);
    }, 800);
  };

  const update = (patch: {
    title?: string;
    description?: string;
    learningObjectives?: string[];
    vocabulary?: string[];
    standards?: string[];
    tags?: string[];
    customFieldValues?: Record<string, string | string[]>;
  }) => {
    const t = patch.title ?? title;
    const d = patch.description ?? description;
    const lo = patch.learningObjectives ?? learningObjectives;
    const voc = patch.vocabulary ?? vocabulary;
    const std = patch.standards ?? standards;
    const tg = patch.tags ?? tags;
    const cfv = patch.customFieldValues ?? customFieldValues;
    if ("title" in patch) setTitle(t);
    if ("description" in patch) setDescription(d);
    if ("learningObjectives" in patch) setLearningObjectives(lo);
    if ("vocabulary" in patch) setVocabulary(voc);
    if ("standards" in patch) setStandards(std);
    if ("tags" in patch) setTags(tg);
    if ("customFieldValues" in patch) setCustomFieldValues(cfv);

    // Build frameworkFields with custom values if applicable
    const existingCustomId =
      parentCourse?.framework === "custom"
        ? parentCourse.frameworkFields?.custom?.frameworkId
        : undefined;

    const fwf: FrameworkFields = {
      ...mod?.frameworkFields,
      ...(existingCustomId !== undefined
        ? {
            custom: {
              frameworkId: existingCustomId,
              values: cfv,
            },
          }
        : {}),
    };

    triggerSave(t, d, lo, voc, std, tg, fwf);
  };

  const addObjective = () => {
    const trimmed = objInput.trim();
    if (trimmed) {
      update({ learningObjectives: [...learningObjectives, trimmed] });
      setObjInput("");
    }
  };

  const addVocab = () => {
    const trimmed = vocabInput.trim();
    if (trimmed && !vocabulary.includes(trimmed)) {
      update({ vocabulary: [...vocabulary, trimmed] });
      setVocabInput("");
    }
  };

  const handleAddLessonPlan = () => {
    const plan = createNewLessonPlan(moduleId);
    const plans = getLessonPlans(moduleId);
    plans.unshift(plan);
    saveLessonPlans(moduleId, plans);
    setLessonPlans(plans);
    setLessonPlansExpanded(true);
    onNavigateToLessonPlan?.(plan.id);
  };

  const handleAddAssignment = async () => {
    const a = await createAssignment.mutateAsync({
      moduleId,
      courseId,
      title: "New Assignment",
      assignmentType: "homework",
      dueDate: "",
      points: 100,
    });
    onNavigateToItem?.("assignment", a.id);
  };

  const handleAddAssessment = async () => {
    const a = await createAssessment.mutateAsync({
      moduleId,
      courseId,
      title: "New Assessment",
    });
    onNavigateToItem?.("assessment", a.id);
  };

  const handleDelete = async () => {
    await deleteModule.mutateAsync({ moduleId, unitId });
    onDeleted();
  };

  const handleOpenSaveTemplate = () => {
    setTemplateName(title || "");
    setShowSaveTemplate((v) => !v);
    setShowLoadTemplate(false);
  };

  const handleOpenLoadTemplate = () => {
    setModuleTemplates(getModuleTemplates());
    setShowLoadTemplate((v) => !v);
    setShowSaveTemplate(false);
    setConfirmOverwrite(null);
  };

  const handleSaveTemplate = () => {
    const name = templateName.trim() || title || "Untitled Template";
    saveModuleTemplate({
      name,
      description: templateDescription.trim(),
      learningObjectives,
      vocabulary,
      assignments: assignments.map((a) => ({
        title: a.title,
        assignmentType: a.assignmentType,
        points: a.points,
      })),
      assessments: assessments.map((a) => ({
        title: a.title,
        assessmentType: a.assessmentType || "",
        totalPoints: a.totalPoints,
      })),
    });
    setModuleTemplates(getModuleTemplates());
    setShowSaveTemplate(false);
    setTemplateName("");
    setTemplateDescription("");
    toast.success("Module template saved");
  };

  const applyModuleTemplate = async (tpl: ModuleTemplate) => {
    setLoadingTemplate(true);
    setPendingTemplateId(tpl.id);
    try {
      // Fill module fields from template
      update({
        learningObjectives: tpl.learningObjectives,
        vocabulary: tpl.vocabulary,
      });

      // Create assignments from template
      for (const asgn of tpl.assignments) {
        await createAssignment.mutateAsync({
          moduleId,
          courseId,
          title: asgn.title,
          assignmentType: asgn.assignmentType as
            | "practice"
            | "graded"
            | "writing"
            | "project"
            | "formative"
            | "summative"
            | "homework"
            | "classwork"
            | "lab"
            | "presentation",
          points: asgn.points,
          dueDate: "",
        });
      }

      // Create assessments from template
      for (const assmt of tpl.assessments) {
        await createAssessment.mutateAsync({
          moduleId,
          courseId,
          title: assmt.title,
        });
      }

      toast.success(`Template "${tpl.name}" applied`);
      setShowLoadTemplate(false);
      setConfirmOverwrite(null);
    } catch {
      toast.error("Failed to apply template");
    } finally {
      setLoadingTemplate(false);
      setPendingTemplateId(null);
    }
  };

  const handleUseModuleTemplate = (tpl: ModuleTemplate) => {
    const hasContent =
      title.trim() !== "" ||
      learningObjectives.length > 0 ||
      assignments.length > 0 ||
      assessments.length > 0;
    if (hasContent) {
      setConfirmOverwrite(tpl.id);
    } else {
      applyModuleTemplate(tpl);
    }
  };

  if (!mod) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-h-0"
      data-ocid="curriculum.module_detail.panel"
    >
      {/* Badge + actions row */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-700">
            Module
          </span>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 size={11} className="animate-spin" /> Saving...
            </span>
          )}
          {!saving && savedAt && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check size={11} /> Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenSaveTemplate}
            className="gap-1.5 text-xs h-7"
            data-ocid="module.save_template.button"
          >
            <BookmarkPlus size={12} />
            Save as Template
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenLoadTemplate}
            className="gap-1.5 text-xs h-7"
            data-ocid="module.load_template.button"
          >
            <FolderOpen size={12} />
            Load Template
          </Button>
        </div>
      </div>

      {/* Title section */}
      <div className="px-6 pb-5 border-b border-border flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">
          {title || "Untitled Module"}
        </h1>
        {parentUnit && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Module in: {parentUnit.title}
          </p>
        )}
      </div>

      {/* Save as Template inline panel */}
      {showSaveTemplate && (
        <div className="border-b border-border/40 px-6 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Save as Template
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="module-template-name">
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="module-template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Reading Module, Lab Activity Module..."
              data-ocid="module.template_name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="module-template-desc">Description (optional)</Label>
            <Textarea
              id="module-template-desc"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Snapshots current module fields, {assignments.length} assignment
            {assignments.length !== 1 ? "s" : ""}, and {assessments.length}{" "}
            assessment{assessments.length !== 1 ? "s" : ""}.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() && !title.trim()}
              className="gap-1.5"
              data-ocid="module.template_save.submit_button"
            >
              <BookmarkPlus size={13} />
              Save Template
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveTemplate(false)}
              data-ocid="module.template_save.cancel_button"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Load Template inline panel */}
      {showLoadTemplate && (
        <div className="border-b border-border/40 px-6 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Load Template
          </p>
          {moduleTemplates.length === 0 ? (
            <div className="text-center py-6">
              <FolderOpen
                size={28}
                className="mx-auto mb-2 text-muted-foreground/40"
              />
              <p className="text-sm text-muted-foreground">
                No module templates saved yet.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Build a module, then click "Save as Template."
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {moduleTemplates.map((tpl, idx) => {
                const isConfirming = confirmOverwrite === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="border border-border rounded-lg p-3 space-y-2"
                    data-ocid={`module.template_list.item.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {tpl.name}
                        </p>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {tpl.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge variant="secondary" className="text-xs py-0">
                            {tpl.assignments.length} assignment
                            {tpl.assignments.length !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="secondary" className="text-xs py-0">
                            {tpl.assessments.length} assessment
                            {tpl.assessments.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      </div>
                      {!isConfirming && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseModuleTemplate(tpl)}
                          disabled={
                            loadingTemplate && pendingTemplateId === tpl.id
                          }
                          className="shrink-0 text-xs h-7 gap-1"
                          data-ocid={`module.template.use_button.${idx + 1}`}
                        >
                          {loadingTemplate && pendingTemplateId === tpl.id ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : null}
                          Use Template
                        </Button>
                      )}
                    </div>
                    {isConfirming && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle
                          size={13}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="text-xs text-amber-700 dark:text-amber-400 flex-1">
                          This will add template content to the current module.
                          Continue?
                        </span>
                        <button
                          type="button"
                          onClick={() => applyModuleTemplate(tpl)}
                          disabled={loadingTemplate}
                          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors shrink-0"
                          data-ocid="module.template.confirm_button"
                        >
                          {loadingTemplate ? "Applying..." : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmOverwrite(null)}
                          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          data-ocid="module.template.cancel_button"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLoadTemplate(false)}
              className="text-xs"
            >
              <X size={12} className="mr-1" />
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="p-6 space-y-8 flex-1 overflow-y-auto min-h-0">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Information
          </h3>
          <div className="space-y-1.5">
            <Label
              htmlFor="module-title"
              className="text-sm font-medium text-foreground"
            >
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="module-title"
              value={title}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={() => {
                if (!title.trim()) setTitleError("Title is required");
                else setTitleError("");
              }}
              placeholder="Module title"
              className={`rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20 ${titleError ? "border-destructive" : ""}`}
            />
            {titleError && (
              <p className="text-xs text-destructive">{titleError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="module-desc"
              className="text-sm font-medium text-foreground"
            >
              Description
            </Label>
            <Textarea
              id="module-desc"
              value={description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Describe this module..."
              rows={3}
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* ── Lesson Plans ── */}
        <div>
          <div className="flex items-center justify-between px-0 py-2">
            <button
              type="button"
              onClick={() => setLessonPlansExpanded((p) => !p)}
              className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              data-ocid="module.lesson_plans.toggle"
            >
              {lessonPlansExpanded ? (
                <ChevronDown size={13} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={13} className="text-muted-foreground" />
              )}
              <FileText size={13} className="text-violet-500 shrink-0" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                Lesson Plans
              </span>
              {lessonPlans.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs py-0 h-4 bg-violet-100 text-violet-600 border-0"
                >
                  {lessonPlans.length}
                </Badge>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddLessonPlan}
              className="gap-1 text-xs h-6 px-2 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
              data-ocid="module.lesson_plan.button"
            >
              <Plus size={10} />
              Add
            </Button>
          </div>
          {lessonPlansExpanded && (
            <div>
              {lessonPlans.length === 0 ? (
                <div
                  className="flex items-center gap-2 py-3 px-3 rounded-lg border border-dashed border-violet-200/60 text-xs text-muted-foreground"
                  data-ocid="module.lesson_plans.empty_state"
                >
                  <FileText size={12} className="text-violet-300" />
                  No lesson plans yet — add one to plan your daily lessons
                </div>
              ) : (
                <div className="space-y-0.5">
                  {lessonPlans.map((lp, idx) => (
                    <button
                      key={lp.id}
                      type="button"
                      onClick={() => onNavigateToLessonPlan?.(lp.id)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-violet-50/60 dark:hover:bg-violet-950/20 transition-colors text-left group"
                      data-ocid={`module.lesson_plan.row.${idx + 1}`}
                    >
                      <FileText
                        size={12}
                        className="text-violet-400 shrink-0"
                      />
                      <span className="text-sm text-foreground flex-1 truncate min-w-0">
                        {lp.title}
                      </span>
                      {lp.date && (
                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                          {new Date(`${lp.date}T00:00:00`).toLocaleDateString(
                            "en-US",
                            {
                              month: "numeric",
                              day: "numeric",
                            },
                          )}
                        </span>
                      )}
                      <ChevronRight
                        size={12}
                        className="text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Assignments & Assessments — compact nav list */}
        <div className="space-y-3">
          {/* ── Assignments ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={13} className="text-indigo-500 shrink-0" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                  Assignments
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs py-0 h-4 bg-indigo-100 text-indigo-600 border-0"
                >
                  {assignments.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAssignment}
                disabled={createAssignment.isPending}
                className="gap-1 text-xs h-6 px-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                data-ocid="module.assignment.button"
              >
                {createAssignment.isPending ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Plus size={10} />
                )}
                Add
              </Button>
            </div>
            {assignments.length === 0 ? (
              <div
                className="flex items-center gap-2 py-3 px-3 rounded-lg border border-dashed border-indigo-200/60 text-xs text-muted-foreground"
                data-ocid="module.assignments.empty_state"
              >
                <FileText size={12} className="text-indigo-300" />
                No assignments yet
              </div>
            ) : (
              <div className="space-y-0.5">
                {assignments.map((a, idx) => (
                  <button
                    key={`assign-${a.id}`}
                    type="button"
                    onClick={() => onNavigateToItem?.("assignment", a.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 transition-colors text-left group"
                    data-ocid={`module.assignment.row.${idx + 1}`}
                  >
                    <FileText size={12} className="text-indigo-400 shrink-0" />
                    <span className="text-sm text-foreground flex-1 truncate min-w-0">
                      {a.title}
                    </span>
                    <span
                      className={`text-[10px] shrink-0 px-1.5 py-0 rounded-full font-medium leading-5 ${assignmentTypeBadgeClass(a.assignmentType)}`}
                    >
                      {a.assignmentType}
                    </span>
                    {a.dueDate && (
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {new Date(a.dueDate).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {a.points > 0 && (
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums font-medium">
                        {a.points}pt
                      </span>
                    )}
                    <ChevronRight
                      size={12}
                      className="text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/60" />

          {/* ── Assessments ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClipboardCheck size={13} className="text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Assessments
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs py-0 h-4 bg-amber-100 text-amber-600 border-0"
                >
                  {assessments.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAssessment}
                disabled={createAssessment.isPending}
                className="gap-1 text-xs h-6 px-2 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                data-ocid="module.assessment.button"
              >
                {createAssessment.isPending ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Plus size={10} />
                )}
                Add
              </Button>
            </div>
            {assessments.length === 0 ? (
              <div
                className="flex items-center gap-2 py-3 px-3 rounded-lg border border-dashed border-amber-200/60 text-xs text-muted-foreground"
                data-ocid="module.assessments.empty_state"
              >
                <ClipboardCheck size={12} className="text-amber-300" />
                No assessments yet
              </div>
            ) : (
              <div className="space-y-0.5">
                {assessments.map((a, idx) => (
                  <button
                    key={`assess-${a.id}`}
                    type="button"
                    onClick={() => onNavigateToItem?.("assessment", a.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-colors text-left group"
                    data-ocid={`module.assessment.row.${idx + 1}`}
                  >
                    <ClipboardCheck
                      size={12}
                      className="text-amber-400 shrink-0"
                    />
                    <span className="text-sm text-foreground flex-1 truncate min-w-0">
                      {a.title}
                    </span>
                    {a.assessmentType && (
                      <span className="text-[10px] shrink-0 px-1.5 py-0 rounded-full font-medium leading-5 bg-amber-100 text-amber-700">
                        {a.assessmentType}
                      </span>
                    )}
                    {a.dueDate && (
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {new Date(a.dueDate).toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {a.totalPoints > 0 && (
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums font-medium">
                        {a.totalPoints}pt
                      </span>
                    )}
                    <ChevronRight
                      size={12}
                      className="text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* Learning Design */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Learning Design
          </h3>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Learning Objectives
            </Label>
            <div className="space-y-1">
              {learningObjectives.map((obj, i) => (
                <div
                  key={`obj-${i}-${obj.slice(0, 20)}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  <span className="text-xs text-muted-foreground font-mono w-5 shrink-0 text-right">
                    {i + 1}.
                  </span>
                  <span className="text-sm flex-1 text-foreground">{obj}</span>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        learningObjectives: learningObjectives.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                    className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    aria-label="Remove objective"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={objInput}
                onChange={(e) => setObjInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && objInput.trim()) {
                    e.preventDefault();
                    addObjective();
                  }
                }}
                placeholder="Add learning objective and press Enter..."
                className="text-sm"
              />
              <button
                type="button"
                onClick={addObjective}
                className="p-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Vocabulary */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Vocabulary
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {vocabulary.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                >
                  {v}
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        vocabulary: vocabulary.filter((x) => x !== v),
                      })
                    }
                    aria-label={`Remove ${v}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={vocabInput}
                onChange={(e) => setVocabInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === ",") &&
                    vocabInput.trim()
                  ) {
                    e.preventDefault();
                    addVocab();
                  }
                }}
                placeholder="Add vocabulary term..."
                className="text-sm"
              />
              <button
                type="button"
                onClick={addVocab}
                className="p-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Framework Fields (module-level) */}
        {(() => {
          if (parentCourse?.framework !== "custom") return null;
          const frameworkId = parentCourse.frameworkFields?.custom?.frameworkId;
          if (!frameworkId) return null;
          const allFrameworks: CustomFramework[] = getCustomFrameworks();
          const fw = allFrameworks.find((f) => f.id === frameworkId);
          if (!fw) return null;
          const moduleFields = fw.fields.filter((f) => f.level === "module");
          if (moduleFields.length === 0) return null;
          return (
            <>
              <div className="border-t border-border/40" />
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers size={13} />
                  Custom Fields
                </h3>
                {moduleFields.map((f) => {
                  const rawVal = customFieldValues[f.id];
                  return (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={`custom-mod-${f.id}`}>
                        {f.label}
                        {f.required && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </Label>
                      {f.type === "long-text" ? (
                        <Textarea
                          id={`custom-mod-${f.id}`}
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                          rows={2}
                        />
                      ) : f.type === "list" ? (
                        <TagInputModule
                          values={Array.isArray(rawVal) ? rawVal : []}
                          onChange={(vals) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: vals,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                        />
                      ) : f.type === "date" ? (
                        <input
                          id={`custom-mod-${f.id}`}
                          type="date"
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          className="h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                      ) : f.type === "number" ? (
                        <input
                          id={`custom-mod-${f.id}`}
                          type="number"
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                          className="h-9 w-40 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                      ) : (
                        <Input
                          id={`custom-mod-${f.id}`}
                          value={typeof rawVal === "string" ? rawVal : ""}
                          onChange={(e) => {
                            const next = {
                              ...customFieldValues,
                              [f.id]: e.target.value,
                            };
                            update({ customFieldValues: next });
                          }}
                          placeholder={f.placeholder}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        <div className="border-t border-border/40" />

        {/* Standards & Tags */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Standards & Tags
          </h3>
          <div className="space-y-3">
            <StandardsPicker
              selected={standards}
              onChange={(ids) => update({ standards: ids })}
              label="Standards"
            />
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Tags
              </Label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        update({ tags: tags.filter((x) => x !== t) })
                      }
                      aria-label={`Remove tag ${t}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                    e.preventDefault();
                    const trimmed = tagInput.trim().replace(/,$/, "");
                    if (trimmed && !tags.includes(trimmed)) {
                      update({ tags: [...tags, trimmed] });
                    }
                    setTagInput("");
                  }
                }}
                placeholder="Type a tag and press Enter..."
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Delete Section */}
        <div className="pt-4 border-t border-border">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
              data-ocid="curriculum.module.delete_button"
            >
              <Trash2 size={14} />
              Delete Module
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-sm text-destructive flex-1">
                Delete this module and all its assignments?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteModule.isPending}
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
                data-ocid="curriculum.module.confirm_button"
              >
                {deleteModule.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="curriculum.module.cancel_button"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
