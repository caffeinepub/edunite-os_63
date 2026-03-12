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
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteAssessment,
  useDeleteAssignment,
  useGetAssessments,
  useGetAssignments,
  useGetModules,
  useGetUnits,
  useUpdateAssessment,
  useUpdateAssignment,
} from "../../hooks/useQueries";
import { getAssessmentTypes } from "../../lib/assessmentTypes";
import { getAssignmentTypes } from "../../lib/assignmentTypes";
import type {
  Difficulty,
  Rubric,
  ScoringModel,
} from "../../lib/curriculumTypes";
import RubricBuilder from "./RubricBuilder";
import StandardsPicker from "./StandardsPicker";

// ─── Type badge colours ───────────────────────────────────────────────────────

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

function typeBadgeClass(type: string): string {
  let hash = 0;
  for (let i = 0; i < type.length; i++)
    hash = (hash * 31 + type.charCodeAt(i)) & 0xffff;
  return ASSIGNMENT_TYPE_COLORS[hash % ASSIGNMENT_TYPE_COLORS.length];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssignmentDetailPanelProps {
  itemType: "assignment" | "assessment";
  itemId: number;
  moduleId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onBack: () => void;
}

// ─── Assignment editor ────────────────────────────────────────────────────────

function AssignmentEditor({
  assignmentId,
  moduleId,
  unitId,
  courseId,
  onDeleted,
  onBack,
}: {
  assignmentId: number;
  moduleId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const { data: assignments = [] } = useGetAssignments(moduleId);
  const { data: modules = [] } = useGetModules(unitId);
  const { data: units = [] } = useGetUnits(courseId);
  const navigate = useNavigate();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const mod = modules.find((m) => m.id === moduleId);
  const parentUnit = units.find((u) => u.id === unitId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [points, setPoints] = useState("100");
  const [aType, setAType] = useState<string>("Homework");
  const [standards, setStandards] = useState<string[]>([]);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRubric, setShowRubric] = useState(false);

  const assignmentTypes = getAssignmentTypes();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when assignmentId changes
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setInstructions(assignment.instructions ?? "");
      setDueDate(assignment.dueDate);
      setPoints(String(assignment.points ?? assignment.pointsPossible ?? 100));
      setAType(assignment.assignmentType);
      setStandards(assignment.standards ?? []);
      setRubric(assignment.rubric ?? null);
      setShowRubric(!!assignment.rubric?.criteria?.length);
      isFirstLoad.current = true;
    }
  }, [assignmentId]);

  const triggerSave = (
    t: string,
    d: string,
    ins: string,
    dd: string,
    p: string,
    at: string,
    std: string[],
    rb: Rubric | null,
  ) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateAssignment.mutateAsync({
          id: assignmentId,
          moduleId,
          lessonId: moduleId,
          title: t,
          description: d,
          instructions: ins,
          dueDate: dd,
          points: Number.parseInt(p) || 0,
          pointsPossible: Number.parseInt(p) || 0,
          assignmentType: at,
          standards: std,
          rubric: rb,
        });
        setSavedAt(new Date());
      } catch {
        // silent
      }
      setSaving(false);
    }, 800);
  };

  if (!assignment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const breadcrumbParts = [
    parentUnit?.title,
    mod?.title,
    title || assignment.title,
  ].filter(Boolean);

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      data-ocid="curriculum.assignment_detail.panel"
    >
      {/* ── Header block 1: badge + save status + actions ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="assignment.back.button"
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
          <Badge className={`text-xs ${typeBadgeClass(aType)} border-0`}>
            <FileText size={10} className="mr-1" />
            Assignment
          </Badge>
        </div>
      </div>

      {/* ── Header block 2: title ── */}
      <div className="px-6 pb-5 border-b border-border flex-shrink-0">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerSave(
              e.target.value,
              description,
              instructions,
              dueDate,
              points,
              aType,
              standards,
              rubric,
            );
          }}
          placeholder="Assignment title..."
          className="text-2xl font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-0 placeholder:text-muted-foreground/30"
          data-ocid="curriculum.assignment.title.input"
        />
        {mod && (
          <p className="text-sm text-muted-foreground mt-0.5">
            In: {mod.title}
          </p>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Core fields */}
        <div className="px-6 py-5 border-b border-border/40 grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Type
            </Label>
            <Select
              value={aType}
              onValueChange={(v) => {
                setAType(v);
                triggerSave(
                  title,
                  description,
                  instructions,
                  dueDate,
                  points,
                  v,
                  standards,
                  rubric,
                );
              }}
            >
              <SelectTrigger
                className="h-8 text-sm"
                data-ocid="curriculum.assignment.type.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52 overflow-y-auto">
                {assignmentTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => navigate({ to: "/settings" })}
              className="text-[10px] text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
              data-ocid="curriculum.assignment.settings.link"
            >
              Manage types →
            </button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Due Date
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                triggerSave(
                  title,
                  description,
                  instructions,
                  e.target.value,
                  points,
                  aType,
                  standards,
                  rubric,
                );
              }}
              className="h-8 text-sm"
              data-ocid="curriculum.assignment.due_date.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Points
            </Label>
            <Input
              type="number"
              min={0}
              value={points}
              onChange={(e) => {
                setPoints(e.target.value);
                triggerSave(
                  title,
                  description,
                  instructions,
                  dueDate,
                  e.target.value,
                  aType,
                  standards,
                  rubric,
                );
              }}
              className="h-8 text-sm"
              data-ocid="curriculum.assignment.points.input"
            />
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Description
          </Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              triggerSave(
                title,
                e.target.value,
                instructions,
                dueDate,
                points,
                aType,
                standards,
                rubric,
              );
            }}
            placeholder="Brief overview of this assignment..."
            rows={3}
            className="text-sm resize-none"
            data-ocid="curriculum.assignment.description.textarea"
          />
        </div>

        {/* Instructions */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Instructions
          </Label>
          <Textarea
            value={instructions}
            onChange={(e) => {
              setInstructions(e.target.value);
              triggerSave(
                title,
                description,
                e.target.value,
                dueDate,
                points,
                aType,
                standards,
                rubric,
              );
            }}
            placeholder="Step-by-step instructions for students..."
            rows={5}
            className="text-sm resize-none"
            data-ocid="curriculum.assignment.instructions.textarea"
          />
        </div>

        {/* Standards */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Standards
          </Label>
          <StandardsPicker
            selected={standards}
            onChange={(std) => {
              setStandards(std);
              triggerSave(
                title,
                description,
                instructions,
                dueDate,
                points,
                aType,
                std,
                rubric,
              );
            }}
          />
        </div>

        {/* Rubric */}
        <div className="px-6 py-5 border-b border-border/40">
          <button
            type="button"
            onClick={() => setShowRubric((p) => !p)}
            className="flex items-center gap-2 w-full text-left mb-3"
            data-ocid="curriculum.assignment.rubric.toggle"
          >
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">
              Rubric
            </Label>
            {rubric?.criteria?.length ? (
              <Badge variant="secondary" className="text-xs py-0">
                {rubric.criteria.length} criteria
              </Badge>
            ) : null}
            {showRubric ? (
              <ChevronDown
                size={13}
                className="text-muted-foreground ml-auto"
              />
            ) : (
              <ChevronRight
                size={13}
                className="text-muted-foreground ml-auto"
              />
            )}
          </button>
          {showRubric && (
            <RubricBuilder
              rubric={rubric}
              onChange={(rb) => {
                setRubric(rb);
                triggerSave(
                  title,
                  description,
                  instructions,
                  dueDate,
                  points,
                  aType,
                  standards,
                  rb,
                );
              }}
            />
          )}
          {!showRubric && (
            <button
              type="button"
              onClick={() => setShowRubric(true)}
              className="text-xs text-primary hover:text-primary/80 underline-offset-2 hover:underline transition-colors"
            >
              {rubric?.criteria?.length ? "Edit rubric" : "Add rubric"}
            </button>
          )}
        </div>

        {/* Delete */}
        <div className="px-6 py-5">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-sm text-destructive flex-1">
                Delete this assignment? This cannot be undone.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await deleteAssignment.mutateAsync({
                    id: assignmentId,
                    moduleId,
                  });
                  toast.success("Assignment deleted");
                  onDeleted();
                }}
                data-ocid="assignment.confirm_delete.button"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                data-ocid="assignment.cancel_delete.button"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
              data-ocid="assignment.delete_button"
            >
              <Trash2 size={13} />
              Delete Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Assessment editor ────────────────────────────────────────────────────────

function AssessmentEditor({
  assessmentId,
  moduleId,
  unitId,
  courseId,
  onDeleted,
  onBack,
}: {
  assessmentId: number;
  moduleId: number;
  unitId: number;
  courseId: number;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const { data: assessments = [] } = useGetAssessments(moduleId);
  const { data: modules = [] } = useGetModules(unitId);
  const { data: units = [] } = useGetUnits(courseId);

  const assessment = assessments.find((a) => a.id === assessmentId);
  const mod = modules.find((m) => m.id === moduleId);
  const parentUnit = units.find((u) => u.id === unitId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assessmentType, setAssessmentType] = useState<string>("Quiz");
  const [scoringModel, setScoringModel] = useState<ScoringModel>("points");
  const [totalPoints, setTotalPoints] = useState("100");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [standards, setStandards] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const assessmentTypes = getAssessmentTypes();
  const updateAssessment = useUpdateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when assessmentId changes
  useEffect(() => {
    if (assessment) {
      setTitle(assessment.title);
      setDescription(assessment.description);
      setAssessmentType(
        assessment.assessmentType || getAssessmentTypes()[0] || "Quiz",
      );
      setScoringModel(assessment.scoringModel);
      setTotalPoints(String(assessment.totalPoints));
      setDifficulty(assessment.difficulty);
      setDueDate(assessment.dueDate);
      setItems(assessment.items ?? []);
      setStandards(assessment.standards ?? []);
      isFirstLoad.current = true;
    }
  }, [assessmentId]);

  const triggerSave = (
    t: string,
    d: string,
    at: string,
    sm: ScoringModel,
    tp: string,
    diff: Difficulty,
    dd: string,
    itms: string[],
    std: string[],
  ) => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateAssessment.mutateAsync({
          id: assessmentId,
          moduleId,
          title: t,
          description: d,
          assessmentType: at,
          scoringModel: sm,
          totalPoints: Number.parseInt(tp) || 0,
          difficulty: diff,
          dueDate: dd,
          items: itms,
          standards: std,
        });
        setSavedAt(new Date());
      } catch {
        // silent
      }
      setSaving(false);
    }, 800);
  };

  const addItem = () => {
    const trimmed = itemInput.trim();
    if (trimmed) {
      const next = [...items, trimmed];
      setItems(next);
      setItemInput("");
      triggerSave(
        title,
        description,
        assessmentType,
        scoringModel,
        totalPoints,
        difficulty,
        dueDate,
        next,
        standards,
      );
    }
  };

  const removeItem = (i: number) => {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    triggerSave(
      title,
      description,
      assessmentType,
      scoringModel,
      totalPoints,
      difficulty,
      dueDate,
      next,
      standards,
    );
  };

  if (!assessment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const breadcrumbParts = [
    parentUnit?.title,
    mod?.title,
    title || assessment.title,
  ].filter(Boolean);

  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      data-ocid="curriculum.assessment_detail.panel"
    >
      {/* ── Header block 1: breadcrumb + badge ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="assessment.back.button"
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
          <Badge className="text-xs bg-amber-100 text-amber-700 border-0">
            <ClipboardCheck size={10} className="mr-1" />
            Assessment
          </Badge>
        </div>
      </div>

      {/* ── Header block 2: title ── */}
      <div className="px-6 pb-5 border-b border-border flex-shrink-0">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            triggerSave(
              e.target.value,
              description,
              assessmentType,
              scoringModel,
              totalPoints,
              difficulty,
              dueDate,
              items,
              standards,
            );
          }}
          placeholder="Assessment title..."
          className="text-2xl font-bold border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-0 placeholder:text-muted-foreground/30"
          data-ocid="curriculum.assessment.title.input"
        />
        {mod && (
          <p className="text-sm text-muted-foreground mt-0.5">
            In: {mod.title}
          </p>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Core fields */}
        <div className="px-6 py-5 border-b border-border/40">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Assessment Type
              </Label>
              <Select
                value={assessmentType}
                onValueChange={(v) => {
                  setAssessmentType(v);
                  triggerSave(
                    title,
                    description,
                    v,
                    scoringModel,
                    totalPoints,
                    difficulty,
                    dueDate,
                    items,
                    standards,
                  );
                }}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="curriculum.assessment.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-52 overflow-y-auto">
                  {assessmentTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Total Points
              </Label>
              <Input
                type="number"
                min={0}
                value={totalPoints}
                onChange={(e) => {
                  setTotalPoints(e.target.value);
                  triggerSave(
                    title,
                    description,
                    assessmentType,
                    scoringModel,
                    e.target.value,
                    difficulty,
                    dueDate,
                    items,
                    standards,
                  );
                }}
                className="h-8 text-sm"
                data-ocid="curriculum.assessment.points.input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Difficulty
              </Label>
              <Select
                value={difficulty}
                onValueChange={(v) => {
                  const d = v as Difficulty;
                  setDifficulty(d);
                  triggerSave(
                    title,
                    description,
                    assessmentType,
                    scoringModel,
                    totalPoints,
                    d,
                    dueDate,
                    items,
                    standards,
                  );
                }}
              >
                <SelectTrigger
                  className="h-8 text-sm"
                  data-ocid="curriculum.assessment.difficulty.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Due Date
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  triggerSave(
                    title,
                    description,
                    assessmentType,
                    scoringModel,
                    totalPoints,
                    difficulty,
                    e.target.value,
                    items,
                    standards,
                  );
                }}
                className="h-8 text-sm"
                data-ocid="curriculum.assessment.due_date.input"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
            Description
          </Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              triggerSave(
                title,
                e.target.value,
                assessmentType,
                scoringModel,
                totalPoints,
                difficulty,
                dueDate,
                items,
                standards,
              );
            }}
            placeholder="What will students demonstrate in this assessment?"
            rows={3}
            className="text-sm resize-none"
            data-ocid="curriculum.assessment.description.textarea"
          />
        </div>

        {/* Assessment Items / Questions */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Items / Questions
          </Label>
          <div className="space-y-1.5 mb-3">
            {items.length === 0 && (
              <p
                className="text-xs text-muted-foreground"
                data-ocid="assessment.items.empty_state"
              >
                No items yet
              </p>
            )}
            {items.map((item, idx) => (
              <div
                key={`item-${item}`}
                className="flex items-start gap-2 text-sm"
              >
                <span className="text-xs text-muted-foreground tabular-nums pt-0.5 w-4 shrink-0">
                  {idx + 1}.
                </span>
                <span className="flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  data-ocid={`assessment.item.delete_button.${idx + 1}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={itemInput}
              onChange={(e) => setItemInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
              }}
              placeholder="Add an item or question..."
              className="h-8 text-sm flex-1"
              data-ocid="assessment.item.input"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-8 text-xs"
              data-ocid="assessment.item.add_button"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Standards */}
        <div className="px-6 py-5 border-b border-border/40">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
            Standards
          </Label>
          <StandardsPicker
            selected={standards}
            onChange={(std) => {
              setStandards(std);
              triggerSave(
                title,
                description,
                assessmentType,
                scoringModel,
                totalPoints,
                difficulty,
                dueDate,
                items,
                std,
              );
            }}
          />
        </div>

        {/* Delete */}
        <div className="px-6 py-5">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <span className="text-sm text-destructive flex-1">
                Delete this assessment? This cannot be undone.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await deleteAssessment.mutateAsync({
                    assessmentId,
                    moduleId,
                  });
                  toast.success("Assessment deleted");
                  onDeleted();
                }}
                data-ocid="assessment.confirm_delete.button"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                data-ocid="assessment.cancel_delete.button"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
              data-ocid="assessment.delete_button"
            >
              <Trash2 size={13} />
              Delete Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AssignmentDetailPanel({
  itemType,
  itemId,
  moduleId,
  unitId,
  courseId,
  onDeleted,
  onBack,
}: AssignmentDetailPanelProps) {
  if (itemType === "assignment") {
    return (
      <AssignmentEditor
        assignmentId={itemId}
        moduleId={moduleId}
        unitId={unitId}
        courseId={courseId}
        onDeleted={onDeleted}
        onBack={onBack}
      />
    );
  }
  return (
    <AssessmentEditor
      assessmentId={itemId}
      moduleId={moduleId}
      unitId={unitId}
      courseId={courseId}
      onDeleted={onDeleted}
      onBack={onBack}
    />
  );
}
