import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetModules, useGetUnits } from "../../hooks/useQueries";
import type { LessonPlan } from "../../lib/curriculumTypes";

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface LessonDetailPanelProps {
  lessonPlanId: string;
  moduleId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onBack: () => void;
}

// ─── Field Section ────────────────────────────────────────────────────────────

function FieldSection({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  ocid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  ocid?: string;
}) {
  return (
    <div className="px-6 py-5 border-b border-border/40">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
        {label}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="text-sm resize-none"
        data-ocid={ocid}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LessonDetailPanel({
  lessonPlanId,
  moduleId,
  unitId,
  courseId,
  onDeleted,
  onBack,
}: LessonDetailPanelProps) {
  const { data: modules = [] } = useGetModules(unitId);
  const { data: units = [] } = useGetUnits(courseId);
  const mod = modules.find((m) => m.id === moduleId);
  const parentUnit = units.find((u) => u.id === unitId);

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // Load plan from localStorage
  useEffect(() => {
    const plans = getLessonPlans(moduleId);
    const found = plans.find((p) => p.id === lessonPlanId);
    if (found) {
      setPlan(found);
      isFirstLoad.current = true;
    }
  }, [lessonPlanId, moduleId]);

  const persistPlan = useCallback(
    (updated: LessonPlan) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSaving(true);
        const plans = getLessonPlans(moduleId);
        const idx = plans.findIndex((p) => p.id === lessonPlanId);
        const saved = { ...updated, updatedAt: Date.now() };
        if (idx >= 0) plans[idx] = saved;
        else plans.push(saved);
        saveLessonPlans(moduleId, plans);
        setSavedAt(new Date());
        setSaving(false);
      }, 600);
    },
    [moduleId, lessonPlanId],
  );

  const updateField = useCallback(
    (field: keyof LessonPlan, value: string) => {
      setPlan((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [field]: value };
        persistPlan(next);
        return next;
      });
    },
    [persistPlan],
  );

  const handleDelete = () => {
    const plans = getLessonPlans(moduleId);
    saveLessonPlans(
      moduleId,
      plans.filter((p) => p.id !== lessonPlanId),
    );
    toast.success("Lesson plan deleted");
    onDeleted();
  };

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const breadcrumbParts = [
    parentUnit?.title,
    mod?.title,
    plan.title || "Lesson Plan",
  ].filter(Boolean) as string[];

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      data-ocid="curriculum.lesson_plan.panel"
    >
      {/* ── Header block 1: breadcrumb + badge + save status ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="lesson_plan.back.button"
          >
            <ChevronLeft size={13} />
            <span>Back</span>
          </button>
          <span className="text-muted-foreground/40 text-xs">/</span>
          {breadcrumbParts.slice(0, -1).map((part, crumbIdx) => (
            <React.Fragment key={part}>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {part}
              </span>
              {crumbIdx < breadcrumbParts.length - 2 && (
                <ChevronRight
                  size={11}
                  className="text-muted-foreground/40 flex-shrink-0"
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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
          <Badge className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-none">
            <FileText size={10} className="mr-1" />
            Lesson Plan
          </Badge>
        </div>
      </div>

      {/* ── Header block 2: title + date ── */}
      <div className="px-6 pb-5 border-b border-border flex-shrink-0">
        <Input
          value={plan.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Lesson title..."
          className="text-2xl font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-0 placeholder:text-muted-foreground/30"
          data-ocid="lesson_plan.title.input"
        />
        <div className="flex items-center gap-3 mt-2">
          {mod && (
            <span className="text-sm text-muted-foreground">
              In: {mod.title}
            </span>
          )}
          <Input
            type="date"
            value={plan.date}
            onChange={(e) => updateField("date", e.target.value)}
            className="h-7 text-sm w-36 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-muted-foreground"
            data-ocid="lesson_plan.date.input"
          />
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <FieldSection
          label="Learning Objective"
          value={plan.learningObjective}
          onChange={(v) => updateField("learningObjective", v)}
          placeholder="What will students know and be able to do by the end of this lesson?"
          rows={2}
          ocid="lesson_plan.objective.textarea"
        />

        <FieldSection
          label="Warm-Up"
          value={plan.warmUp}
          onChange={(v) => updateField("warmUp", v)}
          placeholder="Opening activity or hook to engage students..."
          rows={2}
          ocid="lesson_plan.warmup.textarea"
        />

        <FieldSection
          label="Instruction"
          value={plan.instruction}
          onChange={(v) => updateField("instruction", v)}
          placeholder="Direct instruction, modelling, or new content..."
          rows={3}
          ocid="lesson_plan.instruction.textarea"
        />

        <FieldSection
          label="Guided Practice"
          value={plan.guidedPractice}
          onChange={(v) => updateField("guidedPractice", v)}
          placeholder="Structured practice with teacher support..."
          rows={3}
          ocid="lesson_plan.guided_practice.textarea"
        />

        <FieldSection
          label="Independent Work"
          value={plan.independentWork}
          onChange={(v) => updateField("independentWork", v)}
          placeholder="Student-led practice or tasks..."
          rows={3}
          ocid="lesson_plan.independent_work.textarea"
        />

        <FieldSection
          label="Closure"
          value={plan.closure}
          onChange={(v) => updateField("closure", v)}
          placeholder="Exit ticket, summary, or reflection activity..."
          rows={2}
          ocid="lesson_plan.closure.textarea"
        />

        <FieldSection
          label="Materials & Resources"
          value={plan.materials}
          onChange={(v) => updateField("materials", v)}
          placeholder="Textbooks, handouts, technology, manipulatives..."
          rows={2}
          ocid="lesson_plan.materials.textarea"
        />

        <FieldSection
          label="Differentiation Notes"
          value={plan.differentiation}
          onChange={(v) => updateField("differentiation", v)}
          placeholder="Accommodations, extensions, support strategies for diverse learners..."
          rows={3}
          ocid="lesson_plan.differentiation.textarea"
        />

        <FieldSection
          label="Notes"
          value={plan.notes}
          onChange={(v) => updateField("notes", v)}
          placeholder="Reflections, reminders, follow-up ideas..."
          rows={2}
          ocid="lesson_plan.notes.textarea"
        />

        {/* Delete */}
        <div className="px-6 py-5">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-sm text-destructive flex-1">
                Delete this lesson plan? This cannot be undone.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                data-ocid="lesson_plan.confirm_delete.button"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                data-ocid="lesson_plan.cancel_delete.button"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
              data-ocid="lesson_plan.delete_button"
            >
              <Trash2 size={13} />
              Delete Lesson Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
