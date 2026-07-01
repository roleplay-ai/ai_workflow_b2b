"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import MultiSelect, { type SelectOption } from "@/components/MultiSelect";
import type { Activity, ActivityContent, ActivityStep, PromptTemplate, DownloadFile, WhatYouGetItem } from "@/lib/supabase/types";
import { formatToolLabel, normalizeToolList, normalizeToolSlug, sortToolSlugs } from "@/lib/tools";
import { mergeToolSelectOptions, rowsToToolLogoMap, type ToolLogoMap } from "@/lib/toolLogos";

type Props = {
  activity: Activity & { activity_content: ActivityContent | null };
  activitySteps: ActivityStep[];
  toolOptions: SelectOption[];
  toolLogos: ToolLogoMap;
  tagOptions:      SelectOption[];
  functionOptions: SelectOption[];
  categories:      string[];
};

type EditableStep = Omit<ActivityStep, "created_at"> & {
  isNew: boolean;
  isDirty: boolean;
  isSaving: boolean;
  what_to_do_text: string;
  try_asking_text: string;
};

type Tab = "info" | "slides" | "steps" | "quiz" | "goals" | "prompts" | "downloads" | "video";
const TABS: { id: Tab; label: string }[] = [
  { id: "info",      label: "✏️ Info"      },
  { id: "slides",    label: "📸 Slides"    },
  { id: "steps",     label: "📋 Steps"     },
  { id: "quiz",      label: "✓ Quiz"      },
  { id: "goals",     label: "🎯 Goals"    },
  { id: "prompts",   label: "💬 Prompts"  },
  { id: "video",     label: "🎬 Video"    },
  { id: "downloads", label: "📥 Downloads"},
];

export default function ActivityEditClient({ activity, activitySteps: initSteps, toolOptions: initToolOpts, toolLogos: initToolLogos, tagOptions: initTagOpts, functionOptions: initFunctionOpts, categories: initCategories }: Props) {
  const supabase   = createClient();
  const content    = activity.activity_content;
  const [tab, setTab] = useState<Tab>("info");
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Info — basic fields
  const [infoTitle,    setInfoTitle]    = useState(activity.title ?? "");
  const [infoDesc,     setInfoDesc]     = useState(activity.description ?? "");
  const [infoLevel,    setInfoLevel]    = useState<Activity["level"]>(activity.level ?? null);
  const [infoTime,     setInfoTime]     = useState(activity.time_estimate_minutes ?? 0);
  const [infoPoints,   setInfoPoints]   = useState(activity.points ?? 0);
  const [infoPublished,setInfoPublished]= useState(activity.published ?? false);
  const [infoPosition, setInfoPosition] = useState(activity.position ?? 0);
  const [savingInfo,   setSavingInfo]   = useState(false);
  const [infoMsg,      setInfoMsg]      = useState("");

  // Thumbnail
  const [thumbnailUrl,       setThumbnailUrl]       = useState<string | null>(activity.thumbnail_url ?? null);
  const [thumbnailFile,      setThumbnailFile]      = useState<File | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // Banner (OG share image)
  const [bannerUrl,       setBannerUrl]       = useState<string | null>(activity.banner_url ?? null);
  const [bannerFile,      setBannerFile]      = useState<File | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Info — multi-select state (arrays)
  const [infoToolsArr,  setInfoToolsArr]  = useState<string[]>(normalizeToolList(activity.tools ?? []));
  const [infoTryLink,   setInfoTryLink]   = useState<string>(activity.try_link ?? "");
  const [infoTagsArr,       setInfoTagsArr]       = useState<string[]>(activity.tags ?? []);
  const [infoFunctionsArr,  setInfoFunctionsArr]  = useState<string[]>(activity.functions ?? []);
  const [infoCategoryArr,   setInfoCategoryArr]   = useState<string[]>(activity.category ? [activity.category] : []);

  // Option lists (grow when new items are added via the dropdowns)
  const [toolLogos, setToolLogos] = useState<ToolLogoMap>(initToolLogos);
  const [toolOpts, setToolOpts] = useState<SelectOption[]>(() => mergeToolSelectOptions(initToolOpts, initToolLogos));
  const [tagOpts,      setTagOpts]      = useState<SelectOption[]>(initTagOpts);
  const [functionOpts, setFunctionOpts] = useState<SelectOption[]>(initFunctionOpts);
  const [catOpts,      setCatOpts]      = useState<SelectOption[]>(initCategories.map(c => ({ name: c })));

  useEffect(() => {
    supabase.from("tool_logos").select("tool, logo_url").then(({ data }) => {
      if (!data) return;
      const logos = rowsToToolLogoMap(data);
      setToolLogos(logos);
      setToolOpts(prev => mergeToolSelectOptions(prev, logos));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers: upload icon + persist new option to DB ─────────────────────────
  async function uploadIcon(file: File, folder: string): Promise<string | null> {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${folder}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from("activity-icons").upload(path, file, { upsert: true });
    if (error) {
      console.error("[uploadIcon]", error.message);
      setInfoMsg(`Logo upload failed: ${error.message} — run supabase/migrations/20240603_activity_icons_storage.sql first`);
      setTimeout(() => setInfoMsg(""), 6000);
      return null;
    }
    return supabase.storage.from("activity-icons").getPublicUrl(path).data.publicUrl;
  }

  async function handleAddTool(name: string, imageFile: File | null) {
    const slug = normalizeToolSlug(name);
    if (!slug) return;
    const rawLogoUrl = imageFile ? (await uploadIcon(imageFile, "tools") ?? "") : "";
    const displayUrl = rawLogoUrl
      ? `${rawLogoUrl}${rawLogoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
      : null;
    await supabase.from("tool_logos").upsert({ tool: slug, logo_url: rawLogoUrl, updated_at: new Date().toISOString() });
    if (displayUrl) setToolLogos(prev => ({ ...prev, [slug]: displayUrl }));
    const opt = { name: slug, displayName: formatToolLabel(slug), imageUrl: displayUrl };
    setToolOpts(prev => {
      if (prev.some(o => o.name === slug)) return prev;
      return sortToolSlugs([...prev.map(o => o.name), slug]).map(tool => {
        const existing = prev.find(o => o.name === tool);
        return existing ?? (tool === slug ? opt : { name: tool, displayName: formatToolLabel(tool), imageUrl: null });
      });
    });
    setInfoToolsArr(prev => prev.includes(slug) ? prev : [...prev, slug]);
  }

  async function handleAddTag(name: string, imageFile: File | null) {
    const iconUrl = imageFile ? (await uploadIcon(imageFile, "tags") ?? null) : null;
    await supabase.from("activity_tags").insert({ name, icon_url: iconUrl });
    const opt = { name, imageUrl: iconUrl };
    setTagOpts(prev => [...prev, opt]);
    setInfoTagsArr(prev => [...prev, name]);
  }

  async function handleAddFunction(name: string, imageFile: File | null) {
    const iconUrl = imageFile ? (await uploadIcon(imageFile, "functions") ?? null) : null;
    await supabase.from("activity_functions").insert({ name, icon_url: iconUrl });
    const opt = { name, imageUrl: iconUrl };
    setFunctionOpts(prev => [...prev, opt]);
    setInfoFunctionsArr(prev => [...prev, name]);
  }

  async function handleAddCategory(name: string, _imageFile: File | null) {
    setCatOpts(prev => [...prev, { name }]);
    setInfoCategoryArr([name]);
  }

  async function handleUpdateToolImage(name: string, imageFile: File) {
    const slug = normalizeToolSlug(name);
    if (!slug) return;
    const logoUrl = await uploadIcon(imageFile, "tools");
    if (!logoUrl) return;
    const displayUrl = `${logoUrl}${logoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const { error } = await supabase.from("tool_logos").upsert({
      tool: slug,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setInfoMsg(`Logo saved locally but database error: ${error.message}`);
      setTimeout(() => setInfoMsg(""), 5000);
    }
    setToolLogos(prev => ({ ...prev, [slug]: displayUrl }));
    setToolOpts(prev => prev.map(o =>
      normalizeToolSlug(o.name) === slug ? { ...o, name: slug, imageUrl: displayUrl } : o
    ));
  }

  async function handleUpdateTagImage(name: string, imageFile: File) {
    const iconUrl = await uploadIcon(imageFile, "tags");
    if (!iconUrl) return;
    await supabase.from("activity_tags").update({ icon_url: iconUrl }).eq("name", name);
    setTagOpts(prev => prev.map(o => o.name === name ? { ...o, imageUrl: iconUrl } : o));
  }

  async function handleUpdateFunctionImage(name: string, imageFile: File) {
    const iconUrl = await uploadIcon(imageFile, "functions");
    if (!iconUrl) return;
    await supabase.from("activity_functions").update({ icon_url: iconUrl }).eq("name", name);
    setFunctionOpts(prev => prev.map(o => o.name === name ? { ...o, imageUrl: iconUrl } : o));
  }

  async function uploadThumbnail(file: File): Promise<string | null> {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const storagePath = `${activity.id}/${Date.now()}_${safe}`;
    setThumbnailUploading(true);
    const { error } = await supabase.storage
      .from("activity-thumbnails")
      .upload(storagePath, file, { upsert: true, contentType: file.type });
    setThumbnailUploading(false);
    if (error) {
      setInfoMsg(`Thumbnail upload failed: ${error.message}`);
      setTimeout(() => setInfoMsg(""), 6000);
      return null;
    }
    return supabase.storage.from("activity-thumbnails").getPublicUrl(storagePath).data.publicUrl;
  }

  async function uploadBanner(file: File): Promise<string | null> {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const storagePath = `${activity.id}/${Date.now()}_${safe}`;
    setBannerUploading(true);
    const { error } = await supabase.storage
      .from("activity-banners")
      .upload(storagePath, file, { upsert: true, contentType: file.type });
    setBannerUploading(false);
    if (error) {
      setInfoMsg(`Banner upload failed: ${error.message}`);
      setTimeout(() => setInfoMsg(""), 6000);
      return null;
    }
    return supabase.storage.from("activity-banners").getPublicUrl(storagePath).data.publicUrl;
  }

  async function saveInfo() {
    setSavingInfo(true); setInfoMsg("");

    // Upload thumbnail first (if a new file was picked)
    let finalThumbnailUrl = thumbnailUrl;
    if (thumbnailFile) {
      const url = await uploadThumbnail(thumbnailFile);
      if (url) { finalThumbnailUrl = url; setThumbnailUrl(url); setThumbnailFile(null); }
    }

    // Upload banner (if a new file was picked)
    let finalBannerUrl = bannerUrl;
    if (bannerFile) {
      const url = await uploadBanner(bannerFile);
      if (url) { finalBannerUrl = url; setBannerUrl(url); setBannerFile(null); }
    }

    const { error } = await supabase.from("activities").update({
      title:                  infoTitle.trim(),
      description:            infoDesc.trim() || null,
      level:                  infoLevel,
      time_estimate_minutes:  infoTime || null,
      points:                 infoPoints,
      category:               infoCategoryArr[0] ?? "",
      tools:                  normalizeToolList(infoToolsArr),
      tags:                   infoTagsArr,
      functions:              infoFunctionsArr,
      published:              infoPublished,
      position:               infoPosition,
      try_link:               infoTryLink.trim() || null,
    }).eq("id", activity.id);

    // Thumbnail & banner saved separately — best-effort, silent if columns don't exist yet
    if (finalThumbnailUrl !== activity.thumbnail_url) {
      await supabase.from("activities")
        .update({ thumbnail_url: finalThumbnailUrl } as any)
        .eq("id", activity.id);
    }
    if (finalBannerUrl !== activity.banner_url) {
      await supabase.from("activities")
        .update({ banner_url: finalBannerUrl })
        .eq("id", activity.id);
    }

    setSavingInfo(false);
    setInfoMsg(error ? `Error: ${error.message}` : "✓ Saved");
    if (!error) setTimeout(() => setInfoMsg(""), 3000);
  }

  // Slides
  const [slideFiles,    setSlideFiles]    = useState<FileList | null>(null);
  const [pdfFile,       setPdfFile]       = useState<File | null>(null);
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfProgress,   setPdfProgress]   = useState("");
  const [savedSlides,   setSavedSlides]   = useState<ActivityContent["slide_images"]>(content?.slide_images ?? []);

  // Steps (structured JSON)
  const [parsedSteps,      setParsedSteps]      = useState<any[]>([]);
  const [whatYouGetItems,  setWhatYouGetItems]  = useState<WhatYouGetItem[]>(content?.what_you_will_get ?? []);
  const [stepsMsg,         setStepsMsg]         = useState("");
  const [savingSteps,   setSavingSteps]   = useState(false);

  // Quiz
  const [quizJson,    setQuizJson]    = useState(JSON.stringify(content?.quiz ?? [], null, 2));
  const [quizMdFile,  setQuizMdFile]  = useState<File | null>(null);
  const [quizParsing, setQuizParsing] = useState(false);
  const [quizMsg,     setQuizMsg]     = useState("");

  // Goals & Access
  const [goalsText,  setGoalsText]  = useState((content?.goals ?? []).join("\n"));
  const [accessText, setAccessText] = useState((content?.access_needed ?? []).join("\n"));

  // Prompts
  const [prompts,         setPrompts]         = useState<PromptTemplate[]>(content?.prompts ?? []);
  const [newPromptLabel,  setNewPromptLabel]  = useState("");
  const [newPromptText,   setNewPromptText]   = useState("");

  // Downloads
  const [downloads,   setDownloads]   = useState<DownloadFile[]>(content?.downloads ?? []);
  const [dlFile,      setDlFile]      = useState<File | null>(null);
  const [dlLabel,     setDlLabel]     = useState("");
  const [uploadingDl, setUploadingDl] = useState(false);

  // Video
  const [videoUrl,       setVideoUrl]       = useState<string>(content?.video_url ?? "");
  const [videoPasteUrl,  setVideoPasteUrl]  = useState("");
  const [videoFile,      setVideoFile]      = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoMsg,       setVideoMsg]       = useState("");

  async function uploadVideo() {
    if (!videoFile) return;
    setUploadingVideo(true);
    setVideoMsg(`Uploading "${videoFile.name}"…`);

    try {
      // Upload directly to Supabase Storage (same pattern as slides / downloads)
      const safeName = videoFile.name.replace(/[^\w.\-]/g, "_");
      const path     = `${activity.id}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("activity-videos")
        .upload(path, videoFile, { upsert: true, contentType: videoFile.type });

      if (uploadError) {
        setVideoMsg(`Upload error: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("activity-videos")
        .getPublicUrl(path);

      // Persist the URL to the DB immediately — don't make the admin click Save All
      if (content) {
        await supabase
          .from("activity_content")
          .update({ video_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("activity_id", activity.id);
      } else {
        await supabase.from("activity_content").insert({
          activity_id:   activity.id,
          video_url:     publicUrl,
          slide_images:  [],
          quiz:          [],
          goals:         [],
          access_needed: [],
          prompts:       [],
          downloads:     [],
          updated_at:    new Date().toISOString(),
        });
      }

      setVideoUrl(publicUrl);
      setVideoFile(null);
      setVideoMsg("✓ Video saved");
    } catch (err: any) {
      setVideoMsg(`Error: ${err?.message ?? "Upload failed"}`);
    } finally {
      setUploadingVideo(false);
    }
  }

  function applyPastedUrl() {
    const trimmed = videoPasteUrl.trim();
    if (!trimmed) return;
    setVideoUrl(trimmed);
    setVideoPasteUrl("");
    setVideoMsg("✓ URL set — click Save All to apply");
  }

  function removeVideo() {
    setVideoUrl("");
    setVideoMsg("Video removed — click Save All to apply");
  }

  // Steps inline edit
  const [editSteps, setEditSteps] = useState<EditableStep[]>(() =>
    initSteps.map(s => ({
      ...s,
      isNew: false,
      isDirty: false,
      isSaving: false,
      what_to_do_text: s.what_to_do.join("\n"),
      try_asking_text: (s.try_asking ?? []).join("\n"),
    }))
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stepSaveMsg, setStepSaveMsg] = useState<Record<string, string>>({});

  function toggleExpand(id: string) {
    setExpandedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function updateStepField(id: string, field: string, value: string | number) {
    setEditSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value, isDirty: true } : s));
  }

  function addStep() {
    const maxNum = editSteps.length > 0 ? Math.max(...editSteps.map(s => s.step_number)) : 0;
    const tempId = `new-${Date.now()}`;
    const blank: EditableStep = {
      id: tempId, activity_id: activity.id, step_number: maxNum + 1, slide_number: maxNum + 1,
      title: "", what_learner_sees: "", what_this_means: "", what_to_do: [], what_to_do_text: "",
      if_stuck: "", callout: "", coach_next: "", try_asking: [], try_asking_text: "", isNew: true, isDirty: true, isSaving: false,
    };
    setEditSteps(prev => [...prev, blank]);
    setExpandedIds(prev => new Set([...prev, tempId]));
  }

  async function saveStep(stepId: string) {
    const step = editSteps.find(s => s.id === stepId);
    if (!step) return;
    setEditSteps(prev => prev.map(s => s.id === stepId ? { ...s, isSaving: true } : s));
    const what_to_do = step.what_to_do_text.split("\n").map(l => l.trim()).filter(Boolean);
    const try_asking = step.try_asking_text.split("\n").map(l => l.trim()).filter(Boolean);
    const payload = {
      activity_id: activity.id,
      step_number: step.step_number,
      slide_number: step.slide_number,
      title: step.title,
      what_learner_sees: step.what_learner_sees,
      what_this_means: step.what_this_means,
      what_to_do,
      if_stuck: step.if_stuck,
      callout: step.callout,
      coach_next: step.coach_next,
      try_asking,
    };
    if (step.isNew) {
      const { data, error } = await supabase.from("activity_steps").insert(payload).select().single();
      if (!error && data) {
        setEditSteps(prev => prev.map(s => s.id === stepId ? { ...s, id: data.id, what_to_do, try_asking, isNew: false, isDirty: false, isSaving: false } : s));
        setExpandedIds(prev => { const next = new Set(prev); next.delete(stepId); next.add(data.id); return next; });
        setStepSaveMsg(m => ({ ...m, [data.id]: "✓ Saved" }));
        setTimeout(() => setStepSaveMsg(m => { const n = { ...m }; delete n[data.id]; return n; }), 2500);
      }
    } else {
      const { error } = await supabase.from("activity_steps").update(payload).eq("id", stepId);
      if (!error) {
        setEditSteps(prev => prev.map(s => s.id === stepId ? { ...s, what_to_do, try_asking, isDirty: false, isSaving: false } : s));
        setStepSaveMsg(m => ({ ...m, [stepId]: "✓ Saved" }));
        setTimeout(() => setStepSaveMsg(m => { const n = { ...m }; delete n[stepId]; return n; }), 2500);
      }
    }
  }

  async function deleteStep(stepId: string) {
    const step = editSteps.find(s => s.id === stepId);
    if (!step) return;
    if (!step.isNew) await supabase.from("activity_steps").delete().eq("id", stepId);
    setEditSteps(prev => prev.filter(s => s.id !== stepId));
    setExpandedIds(prev => { const next = new Set(prev); next.delete(stepId); return next; });
  }

  // ── PDF → slides ─────────────────────────────────────────────────────────
  async function convertPdf() {
    if (!pdfFile) return;
    setPdfConverting(true); setPdfProgress(`Converting "${pdfFile.name}"…`);
    const fd = new FormData();
    fd.append("pdf", pdfFile);
    fd.append("activityId", activity.id);
    try {
      const res  = await fetch("/api/pdf-to-slides", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) { setPdfProgress(`Error: ${json.error}`); return; }
      setSavedSlides(json.slides);
      setPdfProgress(`✓ ${json.slides.length} of ${json.total} page(s) converted`);
      setPdfFile(null);
    } catch (e: any) {
      setPdfProgress(`Error: ${e?.message}`);
    } finally { setPdfConverting(false); }
  }

  // ── Upload images ─────────────────────────────────────────────────────────
  async function uploadImages(): Promise<ActivityContent["slide_images"]> {
    if (!slideFiles?.length) return savedSlides;
    const imgs: ActivityContent["slide_images"] = [];
    for (let i = 0; i < slideFiles.length; i++) {
      const f = slideFiles[i];
      const path = `slides/${activity.id}/${Date.now()}_${i}_${f.name}`;
      const { error } = await supabase.storage.from("activity-slides").upload(path, f, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("activity-slides").getPublicUrl(path);
        imgs.push({ url: publicUrl, caption: f.name });
      }
    }
    setSavedSlides(imgs);
    return imgs;
  }

  // ── Steps JSON upload ────────────────────────────────────────────────────
  // JSON shape: { steps: [...], what_you_will_get?: [...] }
  async function handleStepsJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const steps = json.steps ?? [];
      if (!Array.isArray(steps) || steps.length === 0) {
        setStepsMsg("Error: No 'steps' array found in JSON.");
        setParsedSteps([]);
        return;
      }
      const whatYouGet = Array.isArray(json.what_you_will_get) ? json.what_you_will_get : [];
      if (whatYouGet.length) setWhatYouGetItems(whatYouGet);
      setParsedSteps(steps);
      const tryAskingCount = steps.reduce((n: number, s: any) => n + (Array.isArray(s.try_asking) ? s.try_asking.length : 0), 0);
      const extras = [
        whatYouGet.length ? `${whatYouGet.length} "what you'll get" items` : "",
        tryAskingCount ? `${tryAskingCount} try-asking prompt(s)` : "",
      ].filter(Boolean).join(" + ");
      setStepsMsg(`Loaded ${steps.length} step(s)${extras ? ` + ${extras}` : ""} from "${file.name}" — click Save Steps to apply.`);
    } catch {
      setStepsMsg("Error: Invalid JSON file.");
      setParsedSteps([]);
    }
  }

  async function saveSteps() {
    if (!parsedSteps.length) return;
    setSavingSteps(true);
    setStepsMsg("");
    try {
      await supabase.from("activity_steps").delete().eq("activity_id", activity.id);
      const rows = parsedSteps.map((s: any) => ({
        activity_id:       activity.id,
        step_number:       Number(s.step_number),
        slide_number:      Number(s.slide_number ?? s.step_number),
        title:             s.title             ?? "",
        what_learner_sees: s.what_learner_sees ?? "Not specified in this slide.",
        what_this_means:   s.what_this_means   ?? "Not specified in this slide.",
        what_to_do:        Array.isArray(s.what_to_do) ? s.what_to_do : [],
        if_stuck:          s.if_stuck          ?? "Not specified in this slide.",
        callout:           s.callout           ?? "",
        coach_next:        s.coach_next        ?? "",
        try_asking:        Array.isArray(s.try_asking) ? s.try_asking : [],
      }));
      const { error } = await supabase.from("activity_steps").insert(rows);
      if (error) throw error;

      // Save what_you_will_get to activity_content if present
      if (whatYouGetItems.length > 0) {
        await supabase.from("activity_content").update({ what_you_will_get: whatYouGetItems }).eq("activity_id", activity.id);
      }

      setStepsMsg(`✓ ${rows.length} steps saved${whatYouGetItems.length ? ` + ${whatYouGetItems.length} overview items` : ""}`);
      setParsedSteps([]);
      // Reload editable steps from DB after JSON import
      const { data: fresh } = await supabase.from("activity_steps").select("*").eq("activity_id", activity.id).order("step_number", { ascending: true });
      setEditSteps((fresh ?? []).map(s => ({
        ...s,
        isNew: false,
        isDirty: false,
        isSaving: false,
        what_to_do_text: s.what_to_do.join("\n"),
        try_asking_text: (s.try_asking ?? []).join("\n"),
      })));
    } catch (e: any) {
      setStepsMsg(`Error: ${e?.message}`);
    } finally {
      setSavingSteps(false);
      setTimeout(() => setStepsMsg(""), 5000);
    }
  }

  // ── Parse quiz .md with Claude ────────────────────────────────────────────
  async function parseQuizMd() {
    if (!quizMdFile) return;
    setQuizParsing(true); setQuizMsg("Sending to Claude…");
    const fd = new FormData();
    fd.append("file", quizMdFile);
    try {
      const res  = await fetch("/api/parse-quiz-md", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || json.error) { setQuizMsg(`Error: ${json.error}`); return; }
      setQuizJson(JSON.stringify(json.questions, null, 2));
      setQuizMsg(`✓ ${json.total} question(s) extracted`);
      setQuizMdFile(null);
    } catch (e: any) {
      setQuizMsg(`Error: ${e?.message}`);
    } finally { setQuizParsing(false); }
  }

  // ── Upload download file ─────────────────────────────────────────────────
  async function uploadDownload() {
    if (!dlFile) return;
    setUploadingDl(true);
    const ext = dlFile.name.split(".").pop()?.toLowerCase() ?? "other";
    const typeMap: Record<string, DownloadFile["type"]> = { pdf:"pdf",ppt:"ppt",pptx:"ppt",xlsx:"xlsx",xls:"xlsx",doc:"doc",docx:"doc" };
    const path = `downloads/${activity.id}/${Date.now()}_${dlFile.name}`;
    const { error } = await supabase.storage.from("activity-downloads").upload(path, dlFile, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("activity-downloads").getPublicUrl(path);
      setDownloads(prev => [...prev, { label: dlLabel || dlFile.name, url: publicUrl, type: typeMap[ext] ?? "other" }]);
      setDlLabel(""); setDlFile(null);
    }
    setUploadingDl(false);
  }

  // ── Save all ──────────────────────────────────────────────────────────────
  async function saveAll() {
    setSaving(true); setSaveMsg("");
    const slides = await uploadImages();
    let quiz = [];
    try { quiz = JSON.parse(quizJson); } catch {}

    const payload = {
      activity_id:   activity.id,
      slide_images:  slides,
      quiz,
      goals:         goalsText.split("\n").map(s => s.trim()).filter(Boolean),
      access_needed: accessText.split("\n").map(s => s.trim()).filter(Boolean),
      prompts,
      downloads,
      video_url:     videoUrl || null,
      what_you_will_get: whatYouGetItems,
      updated_at:    new Date().toISOString(),
    };

    if (content) {
      await supabase.from("activity_content").update(payload).eq("activity_id", activity.id);
    } else {
      await supabase.from("activity_content").insert(payload);
    }

    setSaveMsg("✓ Saved");
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 3000);
  }

  function updateWhatYouGetItem(index: number, field: keyof WhatYouGetItem, value: string) {
    setWhatYouGetItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addWhatYouGetItem() {
    setWhatYouGetItems(prev => [...prev, { icon: "✨", title: "", description: "" }]);
  }

  function removeWhatYouGetItem(index: number) {
    setWhatYouGetItems(prev => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: 13, color: "#6B6B6B" }}>
          <Link href="/superadmin" style={{ color: "#6B6B6B", textDecoration: "none" }}>Superadmin</Link>
          <span>/</span>
          <span style={{ color: "#221D23", fontWeight: 600 }}>{activity.title}</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-.04em" }}>{activity.title}</h1>
            <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 13 }}>
              {activity.level} · {activity.time_estimate_minutes}m · {activity.points}pts
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveMsg && <span style={{ fontSize: 13, fontWeight: 700, color: "#17A855" }}>{saveMsg}</span>}
            <button onClick={saveAll} disabled={saving} style={btnAmber}>
              {saving ? "Saving…" : "Save All"}
            </button>
          </div>
        </div>

        {/* Content card */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24, boxShadow: "0 2px 12px rgba(34,29,35,.07)" }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #E8E6DC" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "7px 14px", borderRadius: 999, border: "1.5px solid",
                borderColor: tab === t.id ? "#221D23" : "#E8E6DC",
                background: tab === t.id ? "#221D23" : "white",
                color: tab === t.id ? "white" : "#6B6B6B",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── Info ─────────────────────────────────────────────────────────── */}
          {tab === "info" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Title */}
              <div>
                <label style={lbl}>Title</label>
                <input value={infoTitle} onChange={e => setInfoTitle(e.target.value)}
                  placeholder="Activity title" style={{ ...inp, marginTop: 6, fontSize: 15, fontWeight: 700 }} />
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Description</label>
                <textarea value={infoDesc} onChange={e => setInfoDesc(e.target.value)} rows={3}
                  placeholder="Short description shown to learners…"
                  style={{ ...inp, marginTop: 6, resize: "vertical" }} />
              </div>

              {/* Thumbnail */}
              <div>
                <label style={lbl}>Card Thumbnail</label>
                <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#9E9897", lineHeight: 1.4 }}>
                  Shown in place of the illustration on the browse page. Recommended: 16:9, JPG/PNG/WEBP.
                </p>
                {(thumbnailUrl || thumbnailFile) && (
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : thumbnailUrl!}
                      alt="Thumbnail preview"
                      style={{ width: 220, height: 124, objectFit: "cover", borderRadius: 10, border: "1px solid #E8E6DC", display: "block" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setThumbnailFile(null); setThumbnailUrl(null); }}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.62)", border: 0, color: "white", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 14, lineHeight: 1, display: "grid", placeItems: "center" }}
                    >×</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={e => { setThumbnailFile(e.target.files?.[0] ?? null); }}
                    style={{ fontSize: 13 }}
                  />
                  {thumbnailUploading && <span style={{ fontSize: 12, color: "#9E9897" }}>Uploading…</span>}
                </div>
              </div>

              {/* Share Banner (OG image) */}
              <div>
                <label style={lbl}>Share Banner (OG Preview Image)</label>
                <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#9E9897", lineHeight: 1.4 }}>
                  Shown when sharing activity links on social media / messaging apps. Recommended: 1200×630, JPG/PNG/WEBP.
                </p>
                {(bannerUrl || bannerFile) && (
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerFile ? URL.createObjectURL(bannerFile) : bannerUrl!}
                      alt="Banner preview"
                      style={{ width: 320, height: 168, objectFit: "cover", borderRadius: 10, border: "1px solid #E8E6DC", display: "block" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerUrl(null); }}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.62)", border: 0, color: "white", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 14, lineHeight: 1, display: "grid", placeItems: "center" }}
                    >×</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={e => { setBannerFile(e.target.files?.[0] ?? null); }}
                    style={{ fontSize: 13 }}
                  />
                  {bannerUploading && <span style={{ fontSize: 12, color: "#9E9897" }}>Uploading…</span>}
                </div>
              </div>

              {/* Level + Time + Points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Level</label>
                  <select value={infoLevel ?? ""} onChange={e => setInfoLevel((e.target.value || null) as Activity["level"])}
                    style={{ ...inp, marginTop: 6 }}>
                    <option value="">— none —</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Time (minutes)</label>
                  <input type="number" min={0} value={infoTime}
                    onChange={e => setInfoTime(Number(e.target.value))}
                    style={{ ...inp, marginTop: 6 }} />
                </div>
                <div>
                  <label style={lbl}>Points (XP)</label>
                  <input type="number" min={0} value={infoPoints}
                    onChange={e => setInfoPoints(Number(e.target.value))}
                    style={{ ...inp, marginTop: 6 }} />
                </div>
              </div>

              {/* Category (single-select dropdown) + Position */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12, alignItems: "end" }}>
                <MultiSelect
                  label="Category"
                  mode="single"
                  selected={infoCategoryArr}
                  options={catOpts}
                  onChange={setInfoCategoryArr}
                  onAddNew={handleAddCategory}
                  placeholder="Select or add a category…"
                />
                <div>
                  <label style={lbl}>Position</label>
                  <input type="number" min={0} value={infoPosition}
                    onChange={e => setInfoPosition(Number(e.target.value))}
                    style={{ ...inp, marginTop: 6 }} />
                </div>
              </div>

              {/* Tools multi-select */}
              <MultiSelect
                label="Tools"
                mode="multi"
                selected={infoToolsArr}
                options={toolOpts}
                toolLogos={toolLogos}
                onChange={next => setInfoToolsArr(normalizeToolList(next))}
                onAddNew={handleAddTool}
                onUpdateImage={handleUpdateToolImage}
                placeholder="Select tools (Claude, ChatGPT, Gemini…)"
              />

              {/* Try link — overrides tool catalog URL on activity overview */}
              <div>
                <label style={lbl}>Try Link</label>
                <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#9E9897", lineHeight: 1.4 }}>
                  Optional URL for the &quot;Open tool&quot; button on the activity overview. Leave blank to use the linked tool&apos;s default URL from the catalog.
                </p>
                <input
                  type="url"
                  value={infoTryLink}
                  onChange={e => setInfoTryLink(e.target.value)}
                  placeholder="https://chatgpt.com/"
                  style={{ ...inp, marginTop: 0 }}
                />
              </div>

              {/* Tags multi-select */}
              <MultiSelect
                label="Tags"
                mode="multi"
                selected={infoTagsArr}
                options={tagOpts}
                onChange={setInfoTagsArr}
                onAddNew={handleAddTag}
                onUpdateImage={handleUpdateTagImage}
                placeholder="Select tags (Chat, Email, PPT…)"
              />

              {/* Functions multi-select */}
              <MultiSelect
                label="Functions"
                mode="multi"
                selected={infoFunctionsArr}
                options={functionOpts}
                onChange={setInfoFunctionsArr}
                onAddNew={handleAddFunction}
                onUpdateImage={handleUpdateFunctionImage}
                placeholder="Select functions (HR, Finance, Marketing…)"
              />

              {/* Published toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: infoPublished ? "rgba(34,197,94,.07)" : "#FAFAF8", border: `1.5px solid ${infoPublished ? "rgba(34,197,94,.25)" : "#E8E6DC"}`, borderRadius: 12 }}>
                <button
                  type="button"
                  onClick={() => setInfoPublished(p => !p)}
                  style={{
                    width: 44, height: 24, borderRadius: 999, border: 0,
                    background: infoPublished ? "#22C55E" : "#D1D5DB",
                    position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, borderRadius: "50%",
                    width: 20, height: 20, background: "white",
                    boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                    left: infoPublished ? 22 : 2, transition: "left .2s",
                  }} />
                </button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: infoPublished ? "#15803D" : "#6B6B6B" }}>
                    {infoPublished ? "Published — visible to learners" : "Unpublished — hidden from learners"}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={saveInfo} disabled={savingInfo} style={btnAmber}>
                  {savingInfo ? "Saving…" : "Save Info"}
                </button>
                {infoMsg && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: infoMsg.startsWith("✓") ? "#17A855" : "#EF4444" }}>
                    {infoMsg}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Slides ──────────────────────────────────────────────────────── */}
          {tab === "slides" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* PDF */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>📄</span><b>Upload PDF</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>Each page becomes a slide</span></div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="file" accept=".pdf" onChange={e => { setPdfFile(e.target.files?.[0] ?? null); setPdfProgress(""); }} style={{ fontSize: 13 }} />
                  {pdfFile && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={convertPdf} disabled={pdfConverting} style={btnAmber}>
                        {pdfConverting ? "Converting…" : `Convert "${pdfFile.name}"`}
                      </button>
                      {pdfProgress && <span style={{ fontSize: 12.5, fontWeight: 700, color: pdfProgress.startsWith("✓") ? "#17A855" : "#EF4444" }}>{pdfProgress}</span>}
                    </div>
                  )}
                </div>
              </div>
              {/* Images */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>🖼</span><b>Upload images directly</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>PNG/JPG — replaces all</span></div>
                <div style={{ padding: 14 }}>
                  <input type="file" accept="image/*" multiple onChange={e => setSlideFiles(e.target.files)} style={{ fontSize: 13 }} />
                </div>
              </div>
              {/* Preview */}
              {savedSlides.length > 0 ? (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B", marginBottom: 8 }}>{savedSlides.length} slide(s) saved</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {savedSlides.map((s, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={s.url} alt={`Slide ${i+1}`} style={{ width: 90, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #E8E6DC" }} />
                        <div style={{ position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,.55)", color: "white", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>{i+1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={emptyState}>No slides yet — upload a PDF or images above, then Save All</div>
              )}
            </div>
          )}

          {/* ── Steps ─────────────────────────────────────────────────────────── */}
          {tab === "steps" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* What you'll walk away with — permanent */}
              <div style={sectionBox}>
                <div style={{ ...sectionHead, justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span>✨</span><b>What you&apos;ll walk away with</b></span>
                  <button type="button" onClick={addWhatYouGetItem} style={{ ...btnAmber, padding: "5px 12px", fontSize: 12 }}>+ Add item</button>
                </div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  {whatYouGetItems.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: "#94A3B8", fontStyle: "italic" }}>No overview items yet — add one or import from JSON.</div>
                  ) : (
                    whatYouGetItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, border: "1px solid #E8E6DC", borderRadius: 11, padding: 12, background: "#FAFAF8" }}>
                        <input value={item.icon} onChange={e => updateWhatYouGetItem(i, "icon", e.target.value)}
                          placeholder="✨" style={{ ...inp, width: 52, textAlign: "center", fontSize: 18, padding: "8px 4px" }} />
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                          <input value={item.title} onChange={e => updateWhatYouGetItem(i, "title", e.target.value)}
                            placeholder="Title shown on overview…" style={inp} />
                          <textarea value={item.description} onChange={e => updateWhatYouGetItem(i, "description", e.target.value)}
                            placeholder="Short description…" rows={2} style={{ ...inp, resize: "vertical" }} />
                        </div>
                        <button type="button" onClick={() => removeWhatYouGetItem(i)}
                          style={{ border: "1px solid #FCA5A5", background: "white", color: "#EF4444", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#6B6B6B" }}>
                  {editSteps.length} step{editSteps.length !== 1 ? "s" : ""}
                </div>
                <button onClick={addStep} style={btnAmber}>+ Add Step</button>
              </div>

              {/* Existing steps */}
              {editSteps.length === 0 && parsedSteps.length === 0 && (
                <div style={emptyState}>No steps yet — add one above or import JSON below.</div>
              )}

              {parsedSteps.length > 0 && (
                <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", padding: "8px 12px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  Showing {parsedSteps.length} pending step(s) from JSON — click Replace All Steps to apply.
                </div>
              )}

              {parsedSteps.length > 0 ? parsedSteps.map((step: any, i: number) => {
                const prompts = Array.isArray(step.try_asking) ? step.try_asking.filter(Boolean) : [];
                return (
                  <div key={`pending-${i}`} style={{ border: "1.5px solid #FBBF24", borderRadius: 12, overflow: "hidden", background: "#FFFBEB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FEF9C3" }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, background: "#F59E0B", color: "white" }}>
                        {step.step_number ?? i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {step.title || <span style={{ color: "#B0ABA5" }}>Untitled step</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#92400E", marginTop: 1 }}>Pending import</div>
                      </div>
                    </div>
                    <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #FDE68A", background: "#FFFBEB" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#94A3B8", marginBottom: 6 }}>TRY ASKING</div>
                      <TryAskingChips prompts={prompts} />
                    </div>
                  </div>
                );
              }) : editSteps.map(step => {
                const expanded = expandedIds.has(step.id);
                return (
                  <div key={step.id} style={{ border: `1.5px solid ${step.isDirty ? "#FBBF24" : "#E8E6DC"}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
                    {/* Step header */}
                    <div
                      onClick={() => toggleExpand(step.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#FAFAF8", cursor: "pointer", userSelect: "none" }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, background: step.isNew ? "#E2E8F0" : "#221D23", color: "white" }}>
                        {step.isNew ? "+" : step.step_number}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {step.title || <span style={{ color: "#B0ABA5" }}>Untitled step</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
                          Slide {step.slide_number} · {step.what_to_do_text.split("\n").filter(Boolean).length} action(s)
                          {step.callout ? ` · 💡 ${step.callout.slice(0, 40)}` : ""}
                        </div>
                      </div>
                      {stepSaveMsg[step.id] && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#17A855", flexShrink: 0 }}>{stepSaveMsg[step.id]}</span>
                      )}
                      {step.isDirty && !stepSaveMsg[step.id] && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", flexShrink: 0 }}>unsaved</span>
                      )}
                      <span style={{ fontSize: 13, color: "#B0ABA5", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
                    </div>

                    <div style={{ padding: "10px 14px 12px", borderTop: "1px solid #E8E6DC", background: "#FAFAF8" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", color: "#94A3B8", marginBottom: 6 }}>TRY ASKING</div>
                      <TryAskingChips prompts={step.try_asking_text.split("\n").map(l => l.trim()).filter(Boolean)} />
                    </div>

                    {/* Expanded edit form */}
                    {expanded && (
                      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, borderTop: "1px solid #E8E6DC", background: "white" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={lbl}>Step #</label>
                            <input type="number" value={step.step_number} min={1}
                              onChange={e => updateStepField(step.id, "step_number", parseInt(e.target.value) || 1)}
                              style={{ ...inp, marginTop: 4 }} />
                          </div>
                          <div>
                            <label style={lbl}>Slide #</label>
                            <input type="number" value={step.slide_number} min={1}
                              onChange={e => updateStepField(step.id, "slide_number", parseInt(e.target.value) || 1)}
                              style={{ ...inp, marginTop: 4 }} />
                          </div>
                        </div>

                        <div>
                          <label style={lbl}>Title</label>
                          <input value={step.title} onChange={e => updateStepField(step.id, "title", e.target.value)}
                            placeholder="Step title…" style={{ ...inp, marginTop: 4 }} />
                        </div>

                        <div>
                          <label style={lbl}>What the learner sees</label>
                          <textarea value={step.what_learner_sees} rows={2}
                            onChange={e => updateStepField(step.id, "what_learner_sees", e.target.value)}
                            style={{ ...inp, marginTop: 4, resize: "vertical" }} />
                        </div>

                        <div>
                          <label style={lbl}>What this means</label>
                          <textarea value={step.what_this_means} rows={2}
                            onChange={e => updateStepField(step.id, "what_this_means", e.target.value)}
                            style={{ ...inp, marginTop: 4, resize: "vertical" }} />
                        </div>

                        <div>
                          <label style={lbl}>What to do <span style={{ fontWeight: 400, color: "#B0ABA5" }}>(one action per line)</span></label>
                          <textarea value={step.what_to_do_text} rows={4}
                            onChange={e => updateStepField(step.id, "what_to_do_text", e.target.value)}
                            placeholder={"Click the + New button\nEnter a name\nClick Save"}
                            style={{ ...inp, marginTop: 4, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                        </div>

                        <div>
                          <label style={lbl}>If stuck</label>
                          <textarea value={step.if_stuck} rows={2}
                            onChange={e => updateStepField(step.id, "if_stuck", e.target.value)}
                            style={{ ...inp, marginTop: 4, resize: "vertical" }} />
                        </div>

                        <div>
                          <label style={lbl}>Callout (💡 insight shown in coach panel)</label>
                          <input value={step.callout} onChange={e => updateStepField(step.id, "callout", e.target.value)}
                            placeholder="Key insight for this step…" style={{ ...inp, marginTop: 4 }} />
                        </div>

                        <div>
                          <label style={lbl}>Coach next message</label>
                          <input value={step.coach_next} onChange={e => updateStepField(step.id, "coach_next", e.target.value)}
                            placeholder="What the AI says when learner proceeds…" style={{ ...inp, marginTop: 4 }} />
                        </div>

                        <div>
                          <label style={lbl}>Try asking <span style={{ fontWeight: 400, color: "#B0ABA5" }}>(one prompt per line)</span></label>
                          <textarea value={step.try_asking_text} rows={3}
                            onChange={e => updateStepField(step.id, "try_asking_text", e.target.value)}
                            placeholder={"What's a Creation?\nWhich format for onboarding?"}
                            style={{ ...inp, marginTop: 4, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                          <button
                            onClick={() => { if (confirm("Delete this step?")) deleteStep(step.id); }}
                            style={{ border: "1px solid #FCA5A5", background: "white", color: "#EF4444", borderRadius: 8, padding: "6px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                            Delete
                          </button>
                          <button onClick={() => saveStep(step.id)} disabled={step.isSaving}
                            style={{ ...btnAmber, opacity: step.isSaving ? .5 : 1 }}>
                            {step.isSaving ? "Saving…" : "Save Step"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* JSON import (collapsed by default) */}
              <details style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12 }}>
                <summary style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 700, color: "#6B6B6B", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📋</span> Import from JSON (replaces all steps)
                </summary>
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <input type="file" accept=".json" onChange={handleStepsJsonUpload} style={{ fontSize: 13 }} />
                  {stepsMsg && (
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: stepsMsg.startsWith("✓") || stepsMsg.startsWith("Loaded") ? "#17A855" : "#EF4444" }}>
                      {stepsMsg}
                    </div>
                  )}
                  {parsedSteps.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#6B6B6B" }}>{parsedSteps.length} step(s) ready</span>
                      <button onClick={saveSteps} disabled={savingSteps} style={{ ...btnAmber, opacity: savingSteps ? .5 : 1 }}>
                        {savingSteps ? "Saving…" : "Replace All Steps"}
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* ── Quiz ──────────────────────────────────────────────────────────── */}
          {tab === "quiz" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={sectionBox}>
                <div style={sectionHead}><span>🤖</span><b>Upload quiz .md — Claude auto-extracts questions</b></div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="file" accept=".md,.txt" onChange={e => { setQuizMdFile(e.target.files?.[0] ?? null); setQuizMsg(""); }} style={{ fontSize: 13, flex: 1 }} />
                    <button onClick={parseQuizMd} disabled={quizParsing || !quizMdFile} style={{ ...btnAmber, opacity: (!quizMdFile || quizParsing) ? .4 : 1 }}>
                      {quizParsing ? "Parsing…" : "Parse with AI"}
                    </button>
                  </div>
                  {quizMsg && <div style={{ fontSize: 12.5, fontWeight: 700, color: quizMsg.startsWith("✓") ? "#17A855" : "#EF4444" }}>{quizMsg}</div>}
                </div>
              </div>
              {/* Preview */}
              {(() => {
                try {
                  const qs = JSON.parse(quizJson);
                  if (!Array.isArray(qs) || !qs.length) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>{qs.length} question(s) ready</div>
                      {qs.map((q: any, i: number) => (
                        <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 11, padding: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{i+1}. {q.question}</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {(q.options ?? []).map((opt: string, oi: number) => (
                              <div key={oi} style={{ fontSize: 12.5, padding: "5px 10px", borderRadius: 8,
                                background: oi === q.correct_index ? "rgba(35,206,104,.1)" : "#FAFAF8",
                                border: `1px solid ${oi === q.correct_index ? "rgba(35,206,104,.3)" : "#E8E6DC"}`,
                                color: oi === q.correct_index ? "#17A855" : "#444",
                                fontWeight: oi === q.correct_index ? 700 : 400,
                                display: "flex", alignItems: "center", gap: 6 }}>
                                {oi === q.correct_index && <span>✓</span>}{opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                } catch { return null; }
              })()}
              <details>
                <summary style={{ fontSize: 12, color: "#B0ABA5", cursor: "pointer", fontWeight: 600 }}>Edit raw JSON manually</summary>
                <textarea value={quizJson} onChange={e => setQuizJson(e.target.value)} rows={10}
                  style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 11.5, marginTop: 8 }} />
              </details>
            </div>
          )}

          {/* ── Goals & Access ─────────────────────────────────────────────────── */}
          {tab === "goals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={lbl}>Goals — one per line (shown in learner sidebar)</label>
                <textarea value={goalsText} onChange={e => setGoalsText(e.target.value)} rows={6}
                  placeholder={"Write an effective AI prompt\nReduce back-and-forth with your chatbot"}
                  style={{ ...inp, resize: "vertical", marginTop: 6 }} />
              </div>
              <div>
                <label style={lbl}>Access you'll need — one per line</label>
                <textarea value={accessText} onChange={e => setAccessText(e.target.value)} rows={5}
                  placeholder={"ChatGPT (free or Plus)\nA Gmail account"}
                  style={{ ...inp, resize: "vertical", marginTop: 6 }} />
              </div>
            </div>
          )}

          {/* ── Prompts ───────────────────────────────────────────────────────── */}
          {tab === "prompts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {prompts.length === 0 && <div style={emptyState}>No prompts yet</div>}
              {prompts.map((p, i) => (
                <div key={i} style={{ border: "1px solid #E8E6DC", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</span>
                    <button onClick={() => setPrompts(prev => prev.filter((_, j) => j !== i))} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                  <pre style={{ margin: 0, padding: "10px 12px", fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", background: "white" }}>{p.text}</pre>
                </div>
              ))}
              <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Add prompt</div>
                <input value={newPromptLabel} onChange={e => setNewPromptLabel(e.target.value)} placeholder="Label (e.g. 'Draft email prompt')" style={inp} />
                <textarea value={newPromptText} onChange={e => setNewPromptText(e.target.value)} rows={4}
                  placeholder="Act as a professional email writer…" style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
                <button onClick={() => { if (!newPromptLabel.trim() || !newPromptText.trim()) return; setPrompts(p => [...p, { label: newPromptLabel.trim(), text: newPromptText.trim() }]); setNewPromptLabel(""); setNewPromptText(""); }} style={btnAmber}>Add Prompt</button>
              </div>
            </div>
          )}

          {/* ── Video ────────────────────────────────────────────────────────── */}
          {tab === "video" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Current video preview */}
              {videoUrl && (
                <div style={sectionBox}>
                  <div style={sectionHead}><span>▶️</span><b>Current video</b></div>
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 12, color: "#6B6B6B", wordBreak: "break-all", padding: "8px 10px", background: "#F8F8F6", borderRadius: 8, border: "1px solid #E8E6DC" }}>
                      {videoUrl}
                    </div>
                    {/* Preview player */}
                    {/youtube\.com|youtu\.be/.test(videoUrl) || /vimeo\.com/.test(videoUrl) ? (
                      <div style={{ borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "#000" }}>
                        <iframe
                          src={/youtu/.test(videoUrl)
                            ? `https://www.youtube.com/embed/${videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ?? ""}`
                            : `https://player.vimeo.com/video/${videoUrl.match(/vimeo\.com\/(\d+)/)?.[1] ?? ""}`}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          style={{ width: "100%", height: "100%", border: 0 }}
                          title="Video preview"
                        />
                      </div>
                    ) : (
                      <video src={videoUrl} controls style={{ width: "100%", borderRadius: 10, background: "#000", maxHeight: 260 }} />
                    )}
                    <button onClick={removeVideo} style={{ border: "1px solid #FCA5A5", background: "white", color: "#EF4444", borderRadius: 8, padding: "6px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}>
                      Remove video
                    </button>
                  </div>
                </div>
              )}

              {/* Paste URL */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>🔗</span><b>Paste a video URL</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>YouTube, Vimeo, or any direct .mp4 link</span></div>
                <div style={{ padding: 14, display: "flex", gap: 8 }}>
                  <input value={videoPasteUrl} onChange={e => setVideoPasteUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" style={{ ...inp, flex: 1 }} />
                  <button onClick={applyPastedUrl} disabled={!videoPasteUrl.trim()} style={{ ...btnAmber, opacity: !videoPasteUrl.trim() ? .4 : 1, flexShrink: 0 }}>Set URL</button>
                </div>
              </div>

              {/* Upload file */}
              <div style={sectionBox}>
                <div style={sectionHead}><span>📤</span><b>Upload video file</b><span style={{ color: "#B0ABA5", fontWeight: 400, fontSize: 12 }}>MP4, MOV, WebM — saved directly to Supabase Storage</span></div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={uploadingVideo}
                    onChange={e => { setVideoFile(e.target.files?.[0] ?? null); setVideoMsg(""); }}
                    style={{ fontSize: 13 }}
                  />
                  {videoFile && !uploadingVideo && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button onClick={uploadVideo} style={btnAmber}>
                        Upload &ldquo;{videoFile.name}&rdquo;
                      </button>
                      <span style={{ fontSize: 12, color: "#B0ABA5" }}>
                        {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                  {uploadingVideo && (
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6B6B6B" }}>{videoMsg}</div>
                  )}
                </div>
              </div>

              {/* status message (shown only when not in the middle of uploading, to avoid duplication) */}
              {videoMsg && !uploadingVideo && (
                <div style={{ fontSize: 13, fontWeight: 700, color: videoMsg.startsWith("✓") ? "#17A855" : "#EF4444" }}>
                  {videoMsg}
                </div>
              )}

              {!videoUrl && !videoMsg && (
                <div style={emptyState}>No video yet — paste a URL or upload a file above, then Save All</div>
              )}
            </div>
          )}

          {/* ── Downloads ─────────────────────────────────────────────────────── */}
          {tab === "downloads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {downloads.length === 0 && <div style={emptyState}>No downloads yet</div>}
              {downloads.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #E8E6DC", borderRadius: 12, background: "#FAFAF8" }}>
                  <span style={{ fontSize: 20 }}>{dlIcon(d.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{d.label}</div>
                    <div style={{ fontSize: 11, color: "#B0ABA5" }}>{d.type.toUpperCase()}</div>
                  </div>
                  <button onClick={() => setDownloads(prev => prev.filter((_, j) => j !== i))} style={{ border: 0, background: "none", color: "#EF4444", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ))}
              <div style={{ border: "1.5px dashed #E8E6DC", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#6B6B6B" }}>+ Upload file</div>
                <input value={dlLabel} onChange={e => setDlLabel(e.target.value)} placeholder="Label (e.g. 'Prompt cheat sheet')" style={inp} />
                <input type="file" accept=".pdf,.ppt,.pptx,.xlsx,.xls,.doc,.docx" onChange={e => setDlFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13 }} />
                <button onClick={uploadDownload} disabled={uploadingDl || !dlFile} style={{ ...btnAmber, opacity: (!dlFile || uploadingDl) ? .4 : 1 }}>
                  {uploadingDl ? "Uploading…" : "Upload & Add"}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

function TryAskingChips({ prompts }: { prompts: string[] }) {
  if (!prompts.length) {
    return <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>No try-asking prompts for this step.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {prompts.map((prompt, i) => (
        <div key={i} style={{ display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 999, border: "1px solid #E2E8F0", background: "white", color: "#2563EB", fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>
          {prompt}
        </div>
      ))}
    </div>
  );
}

function dlIcon(type: string) {
  return ({ pdf:"📄",ppt:"📊",xlsx:"📗",doc:"📝",other:"📎" } as Record<string,string>)[type] ?? "📎";
}

const sectionBox: React.CSSProperties = { border: "1.5px solid #E8E6DC", borderRadius: 12, overflow: "hidden" };
const sectionHead: React.CSSProperties = { padding: "10px 14px", background: "#FAFAF8", borderBottom: "1px solid #E8E6DC", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 };
const emptyState: React.CSSProperties = { padding: 24, textAlign: "center", background: "#FAFAF8", borderRadius: 12, color: "#B0ABA5", fontSize: 13 };
const inp: React.CSSProperties = { padding: "9px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC", fontSize: 13.5, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", background: "#FAFAF8" };
const lbl: React.CSSProperties = { display: "block", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B" };
const btnAmber: React.CSSProperties = { padding: "9px 18px", borderRadius: 999, border: 0, background: "#FFCE00", color: "#221D23", fontWeight: 800, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" };
