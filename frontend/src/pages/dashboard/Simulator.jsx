import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import * as d3 from "d3";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Toast } from "../../components/Toast";
import { Input } from "../../components/Input";
import {
  TreePine,
  Zap,
  Save,
  FileDown,
  FolderOpen,
  Trash2,
  Loader,
  DollarSign,
  Clock,
  BarChart3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
} from "lucide-react";

// ─── Skill gap helper ───────────────────────────────────────────────────────
const LEVEL_RANK = { basic: 1, intermediate: 2, expert: 3 };
const RANK_LEVEL = { 0: "none", 1: "basic", 2: "intermediate", 3: "expert" };

// Returns a per-skill gap analysis. Each item carries an explicit `status`:
//   "missing"  — user does not have the skill at all
//   "upgrade"  — user has it but below the required proficiency
//   "met"      — user's proficiency exactly meets the requirement
//   "exceeds"  — user's proficiency is above the requirement
function computeSkillGap(userSkillsWithLevels, requiredSkills) {
  const userMap = {};
  const raw = userSkillsWithLevels || {};
  Object.keys(raw).forEach((k) => {
    userMap[k.trim().toLowerCase()] = LEVEL_RANK[raw[k]] || 0;
  });

  return (requiredSkills || []).map((req) => {
    // requiredSkills may be a list of strings OR of { name, level } objects.
    const reqName =
      (typeof req === "string" ? req : req?.name || "").trim() || "Skill";
    const reqLevel =
      (typeof req === "string" ? "intermediate" : req?.level) ||
      "intermediate";
    const userRank = userMap[reqName.toLowerCase()] || 0;
    const reqRank = LEVEL_RANK[reqLevel] || 1;
    const gap = reqRank - userRank;

    let status;
    if (userRank === 0) status = "missing";
    else if (gap > 0) status = "upgrade";
    else if (gap === 0) status = "met";
    else status = "exceeds";

    return {
      name: reqName,
      requiredLevel: reqLevel,
      userLevel: RANK_LEVEL[userRank] || "none",
      gap, // positive = user lacks, 0 = met, negative = exceeds
      status,
    };
  });
}

// Roll the per-skill items up into a single summary for the modal header.
function summarizeSkillGap(items) {
  const total = items.length;
  const ready = items.filter((i) => i.gap <= 0).length;
  const missing = items.filter((i) => i.status === "missing").length;
  const upgrade = items.filter((i) => i.status === "upgrade").length;
  const pct = total ? Math.round((ready / total) * 100) : 0;
  return { total, ready, missing, upgrade, pct };
}

function normalizeJobTitle(title) {
  const parts = String(title || "Career Step")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const cleaned = parts.filter(
    (part, index) =>
      index === 0 || part.toLowerCase() !== parts[index - 1].toLowerCase(),
  );
  return cleaned.join(" ") || "Career Step";
}

function sanitizeTreeTitles(treeData) {
  if (!treeData?.rootNode) return treeData;

  const visit = (node) => ({
    ...node,
    jobTitle: normalizeJobTitle(node.jobTitle),
    children: Array.isArray(node.children) ? node.children.map(visit) : [],
  });

  return {
    ...treeData,
    rootNode: visit(treeData.rootNode),
  };
}

// Hard cap on tree depth — must match MAX_TREE_DEPTH in backend gemini_service.py.
// Root is depth 0, so MAX_TREE_DEPTH = 5 means 6 visible levels (0-5).
const MAX_TREE_DEPTH = 5;

// Trim any subtree that has children deeper than MAX_TREE_DEPTH (e.g. legacy
// saved paths that were generated when the cap was 4 or had been manually
// forked beyond the limit). Operates on raw tree-data shape (not D3 hierarchy).
function pruneTreeToMaxDepth(treeData, maxDepth = MAX_TREE_DEPTH) {
  if (!treeData?.rootNode) return treeData;

  const visit = (node, depth) => {
    if (depth >= maxDepth) {
      return { ...node, children: [] };
    }
    return {
      ...node,
      children: Array.isArray(node.children)
        ? node.children.map((c) => visit(c, depth + 1))
        : [],
    };
  };

  return { ...treeData, rootNode: visit(treeData.rootNode, 0) };
}

// Collapse/expand: given the raw rootNode and a Set of expanded node ids,
// produce a pruned copy where a node's children are only included if the
// node id is in `expandedIds`. Nodes whose children are hidden are tagged
// with `_hiddenChildCount` so the renderer can draw a "+N" affordance.
function buildVisibleTree(node, expandedIds) {
  const children = Array.isArray(node.children) ? node.children : [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  return {
    ...node,
    _hasChildren: hasChildren,
    _expanded: isExpanded && hasChildren,
    _hiddenChildCount: hasChildren && !isExpanded ? children.length : 0,
    children:
      isExpanded && hasChildren
        ? children.map((c) => buildVisibleTree(c, expandedIds))
        : [],
  };
}


const SimulatorPage = () => {
  const [searchParams] = useSearchParams();
  const pathIdFromUrl = searchParams.get("pathId");

  const [careerPath, setCareerPath] = useState(null);
  const [savedPaths, setSavedPaths] = useState([]);
  const [savedPathsLoading, setSavedPathsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activePathId, setActivePathId] = useState(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [pathName, setPathName] = useState("");
  const [decisionsCount, setDecisionsCount] = useState(0);
  const [hoverNode, setHoverNode] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Collapse/expand: ids of nodes whose children are currently shown.
  // Empty set ⇒ only the root node is visible.
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const treeWrapperRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const renderTreeRef = useRef(null);
  // Keeps the user's current zoom/pan stable across expand/collapse
  // re-renders (only a brand-new path resets the view).
  const lastTransformRef = useRef(null);
  const preserveViewRef = useRef(false);

  useEffect(() => {
    if (pathIdFromUrl) loadExistingPath(pathIdFromUrl);
    fetchProfile();
    fetchSavedPaths();
  }, [pathIdFromUrl]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/profile/");
      setUserProfile(res.data.data || null);
    } catch {
      setUserProfile(null);
    }
  };

  const fetchSavedPaths = async () => {
    setSavedPathsLoading(true);
    try {
      const response = await api.get("/simulator/saved-paths/");
      setSavedPaths(response.data.data || []);
    } catch {
      setSavedPaths([]);
    } finally {
      setSavedPathsLoading(false);
    }
  };

  useEffect(() => {
    if (careerPath && svgRef.current) renderTree(); // eslint-disable-line react-hooks/exhaustive-deps
  }, [careerPath, expandedIds]);

  useEffect(() => {
    const handleResize = () => {
      if (renderTreeRef.current) renderTreeRef.current();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadExistingPath = async (pathId) => {
    setLoading(true);
    try {
      const response = await api.get(`/simulator/path/${pathId}/`);
      const pathData = response.data.data;
      const parsed = JSON.parse(pathData.tree_data);
      const tree = pruneTreeToMaxDepth(sanitizeTreeTitles(parsed));
      preserveViewRef.current = false; // fresh path → reset zoom/pan
      setExpandedIds(new Set()); // start collapsed: only root visible
      setCareerPath(tree);
      setDecisionsCount(pathData.decisions_count || 0);
      setActivePathId(pathData.id);
      setPathName(pathData.path_name || "");
    } catch (error) {
      setToast({ message: "Failed to load path", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const generatePath = async () => {
    setLoading(true);
    try {
      const response = await api.post("/simulator/generate/");
      const tree = pruneTreeToMaxDepth(sanitizeTreeTitles(response.data.data));
      preserveViewRef.current = false; // fresh path → reset zoom/pan
      setExpandedIds(new Set()); // start collapsed: only root visible
      setCareerPath(tree);
      setDecisionsCount(0);
      setActivePathId(null);
      setPathName("");
      setToast({
        message: "Path generated! Click the root node to expand it.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: error.response?.data?.error || "Failed to generate",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Opens the read-only detail / skill-gap panel for a node.
  // 100% client-side — the whole tree is generated ONCE up front, so
  // inspecting a node never triggers another network request.
  const openNodeDetails = (node) => {
    setSelectedNode(node);
    setShowForkModal(true);
  };

  // Primary tree interaction (pure UI — no API calls):
  //   • branch node → toggle expand/collapse so its children show/hide
  //                    ON THE TREE (no modal blocking the view)
  //   • leaf node   → nothing to expand, so open the read-only detail /
  //                    skill-gap panel for that final role
  //
  // NOTE: the visible tree is pruned by buildVisibleTree(), so a collapsed
  // node's `children` is []. We must read the `_hasChildren` flag (set on
  // the visible node) to know whether the ORIGINAL node had children.
  const handleNodeClick = (node) => {
    const id = node.data?.id;
    const hasChildren = !!node.data?._hasChildren;

    if (!hasChildren) {
      openNodeDetails(node); // leaf — show its details / skill gap
      return;
    }

    preserveViewRef.current = true; // keep zoom/pan stable while toggling
    setShowForkModal(false); // never let the modal cover the expanding tree
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportPDF = async () => {
    if (!treeWrapperRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(treeWrapperRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "pt", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(18);
      pdf.setTextColor(30, 41, 59);
      pdf.text("Career Path Simulation", 40, 40);
      pdf.setFontSize(11);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}  |  Decisions made: ${decisionsCount}`,
        40,
        60,
      );

      const imgW = pageW - 80;
      const imgH = (canvas.height * imgW) / canvas.width;
      const maxH = pageH - 120;
      const finalH = imgH > maxH ? maxH : imgH;
      const finalW = imgH > maxH ? (canvas.width * maxH) / canvas.height : imgW;
      pdf.addImage(img, "PNG", 40, 80, finalW, finalH);

      const rootTitle = careerPath?.rootNode?.jobTitle || "Career";
      pdf.save(
        `career-path-${rootTitle.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
      );
      setToast({ message: "PDF exported!", type: "success" });
    } catch (err) {
      setToast({ message: "Export failed", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const resetView = () => {
    if (!zoomBehaviorRef.current || !svgRef.current) return;
    const { behavior, initialTransform } = zoomBehaviorRef.current;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(behavior.transform, initialTransform);
  };

  const fitAllNodes = () => {
    if (!zoomBehaviorRef.current || !svgRef.current) return;
    const { behavior, fullTransform } = zoomBehaviorRef.current;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(behavior.transform, fullTransform);
  };

  const zoomBy = (delta) => {
    if (!zoomBehaviorRef.current || !svgRef.current) return;
    const { behavior } = zoomBehaviorRef.current;
    d3.select(svgRef.current)
      .transition()
      .duration(200)
      .call(behavior.scaleBy, 1 + delta);
  };

  const openSaveModal = () => {
    if (!pathName.trim()) {
      const rootTitle = careerPath?.rootNode?.jobTitle || "Career Path";
      setPathName(`${rootTitle} Path`);
    }
    setShowSaveModal(true);
  };

  const handleSavePath = async () => {
    if (!pathName.trim()) {
      setToast({ message: "Enter a name", type: "error" });
      return;
    }
    try {
      const response = await api.post("/simulator/save-path/", {
        pathName,
        treeData: careerPath,
        decisionsCount,
      });
      setActivePathId(response.data.data?.id || null);
      setToast({ message: "Path saved!", type: "success" });
      setShowSaveModal(false);
      setPathName(response.data.data?.path_name || pathName);
      fetchSavedPaths();
    } catch (error) {
      setToast({ message: "Failed to save", type: "error" });
    }
  };

  const handleDeletePath = async (pathId) => {
    try {
      await api.delete(`/simulator/delete-path/${pathId}/`);
      if (activePathId === pathId) {
        setActivePathId(null);
      }
      setSavedPaths((prev) => prev.filter((path) => path.id !== pathId));
      setToast({ message: "Saved path deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete path", type: "error" });
    }
  };

  const renderTree = () => {
    const container = containerRef.current;
    if (!container || !careerPath?.rootNode) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const W = container.clientWidth || 1280;
    const H = container.clientHeight || 760;
    svg.attr("width", W).attr("height", H);

    // Layout constants
    const NODE_W = 220; // horizontal spacing between sibling nodes
    const LEVEL_H = 165; // vertical spacing between depth levels
    const R = 30; // node circle radius

    // Build D3 hierarchy from the *visible* (collapse-aware) tree.
    const visibleRoot = buildVisibleTree(careerPath.rootNode, expandedIds);
    const root = d3.hierarchy(visibleRoot);
    d3.tree().nodeSize([NODE_W, LEVEL_H])(root);

    // Compute full tree extent
    let xMin = Infinity,
      xMax = -Infinity,
      yMax = 0;
    root.each((d) => {
      if (d.x < xMin) xMin = d.x;
      if (d.x > xMax) xMax = d.x;
      if (d.y > yMax) yMax = d.y;
    });
    const treeW = xMax - xMin + NODE_W + 40;
    const treeH = yMax + LEVEL_H + 60;

    // Initial view: focus on the first 2-3 levels at a readable size.
    const preferredDepth = root.height >= 3 ? 1 : 2;
    let vxMin = Infinity,
      vxMax = -Infinity,
      vyMax = 0;
    root.each((d) => {
      if (d.depth > preferredDepth) return;
      if (d.x < vxMin) vxMin = d.x;
      if (d.x > vxMax) vxMax = d.x;
      if (d.y > vyMax) vyMax = d.y;
    });
    const vW = vxMax - vxMin + NODE_W * 2.4;
    const vH = vyMax + LEVEL_H * 1.4;
    const s0 = Math.min((W * 0.92) / vW, (H * 0.82) / vH, 1.35);
    const tx0 = W / 2 - ((vxMin + vxMax) / 2) * s0;
    const ty0 = Math.max(48, H * 0.1);
    const initialTransform = d3.zoomIdentity.translate(tx0, ty0).scale(s0);

    // Full-tree fit transform
    const sf = Math.min((W * 0.92) / treeW, (H * 0.88) / treeH);
    const txf = W / 2 - ((xMin + xMax) / 2) * sf;
    const fullTransform = d3.zoomIdentity.translate(txf, 20).scale(sf);

    // Zoom behavior — also remember the latest transform so expand/collapse
    // re-renders can restore the user's current viewport.
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        zoomLayer.attr("transform", event.transform);
        lastTransformRef.current = event.transform;
      });

    const zoomLayer = svg.append("g");
    svg.call(zoomBehavior).on("dblclick.zoom", null);
    const g = zoomLayer.append("g");

    // Drop-shadow filter
    const defs = svg.append("defs");
    const filt = defs
      .append("filter")
      .attr("id", "nshadow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%");
    filt
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 2)
      .attr("stdDeviation", 3)
      .attr("flood-color", "rgba(0,0,0,0.18)");

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 1.5)
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d) => d.x)
          .y((d) => d.y),
      );

    // Node color (lavender/indigo family):
    //   • collapsed branch (has hidden children)  → amber  — "click to expand"
    //   • expanded branch                          → depth indigo/violet
    //   • true leaf (no children at all)           → green  — end of path
    const depthColors = ["#4f46e5", "#6366f1", "#7c3aed", "#9333ea", "#a21caf"];
    const getNodeColor = (d) => {
      if (d.data._hiddenChildCount > 0) return "#f59e0b"; // collapsed branch
      if (!d.data._hasChildren) return "#16a34a"; // true leaf
      return depthColors[Math.min(d.depth, depthColors.length - 1)];
    };

    // Node groups
    const nodeGroups = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d) => handleNodeClick(d))
      .on("mouseover", (event, d) => {
        const rect = container.getBoundingClientRect();
        setHoverNode({
          x: event.clientX - rect.left + 14,
          y: event.clientY - rect.top + 14,
          data: d.data,
        });
      })
      .on("mousemove", (event) => {
        const rect = container.getBoundingClientRect();
        setHoverNode((prev) =>
          prev
            ? {
                ...prev,
                x: event.clientX - rect.left + 14,
                y: event.clientY - rect.top + 14,
              }
            : prev,
        );
      })
      .on("mouseout", () => setHoverNode(null));

    // Hit area (transparent, larger than circle for easier clicking)
    nodeGroups
      .append("circle")
      .attr("r", R + 6)
      .attr("fill", "transparent");

    // Visible circle
    nodeGroups
      .append("circle")
      .attr("r", R)
      .attr("fill", getNodeColor)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .attr("filter", "url(#nshadow)");

    // Initials text
    nodeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "11px")
      .attr("font-weight", "700")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .text((d) => {
        const t = (d.data.jobTitle || "?").trim();
        const parts = t.split(/\s+/);
        return parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : t.substring(0, 2).toUpperCase();
      });

    // Expand / collapse affordance badge at the top-right of the circle.
    //   collapsed branch → "+N"  (N hidden direct children)
    //   expanded branch  → "−"   (click to collapse)
    nodeGroups.each(function (d) {
      const isCollapsed = d.data._hiddenChildCount > 0;
      const isExpandedBranch = d.data._expanded;
      if (!isCollapsed && !isExpandedBranch) return; // leaf — no badge

      const grp = d3.select(this);
      const bx = R * 0.78;
      const by = -R * 0.78;
      const badge = grp.append("g").attr("pointer-events", "none");
      badge
        .append("circle")
        .attr("cx", bx)
        .attr("cy", by)
        .attr("r", 11)
        .attr("fill", "#ffffff")
        .attr("stroke", isCollapsed ? "#f59e0b" : "#6366f1")
        .attr("stroke-width", 2);
      badge
        .append("text")
        .attr("x", bx)
        .attr("y", by)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", isCollapsed ? "9px" : "13px")
        .attr("font-weight", "800")
        .attr("fill", isCollapsed ? "#b45309" : "#4338ca")
        .text(isCollapsed ? `+${d.data._hiddenChildCount}` : "−");
    });

    // "i" info button (bottom-right) — opens the read-only detail / skill-gap
    // panel for ANY node without expanding/collapsing it. Node body click
    // still toggles expand/collapse; this button is a separate target.
    nodeGroups.each(function (d) {
      const grp = d3.select(this);
      const ix = R * 0.78;
      const iy = R * 0.78;
      const info = grp
        .append("g")
        .style("cursor", "pointer")
        .on("click", (event) => {
          event.stopPropagation(); // don't trigger expand/collapse
          openNodeDetails(d);
        })
        .on("mouseover", (event) => event.stopPropagation());
      info
        .append("circle")
        .attr("cx", ix)
        .attr("cy", iy)
        .attr("r", 11)
        .attr("fill", "#4f46e5")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 2);
      info
        .append("text")
        .attr("x", ix)
        .attr("y", iy)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-size", "12px")
        .attr("font-weight", "800")
        .attr("font-style", "italic")
        .attr("fill", "#ffffff")
        .attr("pointer-events", "none")
        .text("i");
    });

    // Labels under each node (up to 2 lines + salary)
    nodeGroups.each(function (d) {
      const grp = d3.select(this);
      const title = d.data.jobTitle || "Node";
      const salary = d.data.salary;
      const words = title.trim().split(/\s+/);
      const maxChars = 18;

      let lines;
      if (title.length <= maxChars) {
        lines = [title];
      } else if (words.length === 1) {
        lines = [title.substring(0, maxChars - 1) + "\u2026"];
      } else {
        const mid = Math.ceil(words.length / 2);
        let l1 = words.slice(0, mid).join(" ");
        let l2 = words.slice(mid).join(" ");
        if (l1.length > maxChars) l1 = l1.substring(0, maxChars - 1) + "\u2026";
        if (l2.length > maxChars) l2 = l2.substring(0, maxChars - 1) + "\u2026";
        lines = l2 ? [l1, l2] : [l1];
      }

      const baseY = R + 15;
      const lh = 13;

      const txt = grp
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", "#1e293b")
        .attr("pointer-events", "none");

      lines.forEach((line, i) => {
        txt
          .append("tspan")
          .attr("x", 0)
          .attr("dy", i === 0 ? baseY : lh)
          .text(line);
      });

      // Salary pill — high-contrast so it's always readable on the canvas.
      const salaryNum = Number(salary) || 0;
      if (salaryNum > 0) {
        const salaryText =
          salaryNum >= 1000
            ? `PKR ${(salaryNum / 1000).toFixed(0)}k/mo`
            : `PKR ${salaryNum}/mo`;
        const pillY = baseY + lines.length * lh + 3;
        const pillW = salaryText.length * 6.6 + 16;
        const pillH = 18;
        const pill = grp.append("g").attr("pointer-events", "none");
        pill
          .append("rect")
          .attr("x", -pillW / 2)
          .attr("y", pillY)
          .attr("width", pillW)
          .attr("height", pillH)
          .attr("rx", 9)
          .attr("fill", "#dcfce7")
          .attr("stroke", "#16a34a")
          .attr("stroke-width", 1);
        pill
          .append("text")
          .attr("text-anchor", "middle")
          .attr("x", 0)
          .attr("y", pillY + pillH / 2)
          .attr("dominant-baseline", "central")
          .attr("font-size", "10.5px")
          .attr("font-weight", "700")
          .attr("fill", "#15803d")
          .text(salaryText);
      }
    });

    // Preserve the user's zoom/pan across expand/collapse re-renders;
    // only a brand-new path (preserveViewRef = false) resets to the
    // readable initial view.
    if (preserveViewRef.current && lastTransformRef.current) {
      svg.call(zoomBehavior.transform, lastTransformRef.current);
    } else {
      svg.call(zoomBehavior.transform, initialTransform);
      lastTransformRef.current = initialTransform;
      preserveViewRef.current = true;
    }

    // Store refs for controls
    zoomBehaviorRef.current = {
      behavior: zoomBehavior,
      initialTransform,
      fullTransform,
    };
    renderTreeRef.current = renderTree;
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-md border-b border-violet-100 py-5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TreePine size={20} className="text-indigo-600" />
              Career Simulator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Generate once · click a node to expand/collapse its next steps
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={generatePath}
              disabled={loading}
              className="px-4 py-2 text-white font-medium rounded-lg transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 disabled:opacity-50 flex items-center gap-2 text-sm"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Zap size={16} />{" "}
                  {careerPath ? "Regenerate" : "Generate Path"}
                </>
              )}
            </button>
            {careerPath && (
              <>
                <button
                  onClick={openSaveModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader size={16} className="animate-spin" /> Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown size={16} /> Export PDF
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white/85 backdrop-blur-sm rounded-lg border border-violet-100 overflow-hidden mb-6 shadow-sm shadow-violet-100/40">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Save size={16} className="text-indigo-600" /> Saved Paths
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                You can quickly open or delete your saved simulations from here.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {savedPaths.length} saved
            </span>
          </div>

          {savedPathsLoading ? (
            <div className="px-4 py-6 text-sm text-slate-500 flex items-center gap-2">
              <Loader size={16} className="animate-spin" /> Loading saved
              paths...
            </div>
          ) : savedPaths.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 p-4">
              {savedPaths.map((path) => (
                <div
                  key={path.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    activePathId === path.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {path.path_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {path.decisions_count || 0} decisions ·{" "}
                        {new Date(path.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {activePathId === path.id && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => loadExistingPath(path.id)}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                      <FolderOpen size={14} /> Open
                    </button>
                    <button
                      onClick={() => handleDeletePath(path.id)}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:border-red-300 hover:text-red-600 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">
              No paths saved yet. Generate a career path and save it using the Save button.
            </div>
          )}
        </div>

        {loading && !careerPath && (
          <Loading message="AI is generating your career path..." />
        )}

        {careerPath && (
          <div className="bg-white/85 backdrop-blur-sm rounded-lg border border-violet-100 overflow-hidden mb-6 shadow-sm shadow-violet-100/40">
            {/* Tree Info Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-100">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>
                  Decisions:{" "}
                  <span className="font-semibold text-slate-900">
                    {decisionsCount}
                  </span>
                </span>
                <span className="hidden sm:inline">
                  Root:{" "}
                  <span className="font-semibold text-slate-900">
                    {careerPath?.rootNode?.jobTitle || "Career"}
                  </span>
                </span>
                <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-violet-100 text-indigo-700 font-semibold">
                  Max {MAX_TREE_DEPTH + 1} levels
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Legend */}
                <span className="hidden lg:flex items-center gap-1 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />{" "}
                  Collapsed (click to expand)
                </span>
                <span className="hidden lg:flex items-center gap-1 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />{" "}
                  Expanded
                </span>
                <span className="hidden lg:flex items-center gap-1 text-xs text-slate-500 mr-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />{" "}
                  Leaf
                </span>
                <span className="hidden lg:inline w-px h-5 bg-slate-200 mx-1" />
                {/* Zoom controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => zoomBy(-0.3)}
                    title="Zoom out"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ZoomOut size={15} />
                  </button>
                  <button
                    onClick={() => zoomBy(0.3)}
                    title="Zoom in"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ZoomIn size={15} />
                  </button>
                  <button
                    onClick={resetView}
                    title="Reset to readable overview"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    onClick={fitAllNodes}
                    title="Fit entire tree in view"
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tree Canvas */}
            <div
              ref={containerRef}
              className="relative overflow-hidden"
              style={{
                height: "760px",
                background:
                  "radial-gradient(circle, #d1d5db 1.2px, transparent 1.2px)",
                backgroundSize: "28px 28px",
                backgroundColor: "#f8fafc",
              }}
            >
              <div
                ref={treeWrapperRef}
                style={{ width: "100%", height: "100%" }}
              >
                <svg ref={svgRef} style={{ display: "block" }} />
              </div>

              {/* Hover Tooltip */}
              {hoverNode && (
                <div
                  className="pointer-events-none absolute z-20 bg-white border border-slate-200 shadow-lg rounded-lg p-3 text-sm max-w-xs"
                  style={{ left: hoverNode.x, top: hoverNode.y }}
                >
                  <div className="font-bold text-slate-900 mb-1">
                    {hoverNode.data.jobTitle}
                  </div>
                  {hoverNode.data.careerField && (
                    <div className="text-xs text-purple-600 font-medium mb-1">
                      {hoverNode.data.careerField}
                    </div>
                  )}
                  {hoverNode.data.salary > 0 && (
                    <div className="flex items-center gap-1 text-green-600 font-medium mb-1 text-xs">
                      <DollarSign size={12} /> PKR{" "}
                      {Number(hoverNode.data.salary).toLocaleString()}/month
                    </div>
                  )}
                  {hoverNode.data.timeline && (
                    <div className="flex items-center gap-1 text-slate-500 mb-1 text-xs">
                      <Clock size={12} /> {hoverNode.data.timeline}
                    </div>
                  )}
                  {hoverNode.data.confidenceScore > 0 && (
                    <div className="flex items-center gap-1 text-indigo-600 mb-1 text-xs">
                      <BarChart3 size={12} /> {hoverNode.data.confidenceScore}%
                      confidence
                    </div>
                  )}
                  {hoverNode.data.sector && (
                    <div className="flex items-center gap-1 text-slate-500 mb-1 text-xs">
                      <Building2 size={12} /> {hoverNode.data.sector}
                    </div>
                  )}
                  {hoverNode.data.requiredSkills?.length > 0 && (
                    <div className="text-xs text-amber-600 mb-1">
                      {hoverNode.data.requiredSkills.length} required skills
                    </div>
                  )}
                  {hoverNode.data.description && (
                    <div className="text-slate-600 mt-1 leading-relaxed text-xs line-clamp-3">
                      {hoverNode.data.description}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-indigo-600 font-medium">
                    {hoverNode.data._hiddenChildCount > 0
                      ? `Click to expand ${hoverNode.data._hiddenChildCount} next step${hoverNode.data._hiddenChildCount > 1 ? "s" : ""}`
                      : hoverNode.data._expanded
                        ? "Click to collapse this branch"
                        : "End of this branch"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Tap the <span className="font-bold text-indigo-600">i</span>{" "}
                    button for full skill-gap analysis
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Click a node to expand/collapse its next steps · Click the{" "}
                <span className="font-bold text-indigo-600">i</span> button for
                skill-gap details · Amber{" "}
                <span className="text-amber-600 font-semibold">+N</span> = hidden
                steps · Scroll/pinch to zoom · Drag to pan
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!careerPath && !loading && (
          <div className="bg-white/85 backdrop-blur-sm rounded-lg border-2 border-dashed border-violet-200 p-12 text-center">
            <TreePine size={40} className="mx-auto mb-4 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Start Your Career Exploration
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Generate an AI-powered career tree based on your profile. Explore
              branches, fork at decision points, and discover new possibilities.
            </p>
            <button
              onClick={generatePath}
              className="px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 flex items-center gap-2 mx-auto"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)" }}
            >
              <Zap size={18} /> Generate Career Path
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Make sure your profile is filled out for best results
            </p>
          </div>
        )}
      </div>

      {/* Node Details Modal — read-only, fully client-side (no API calls).
          The whole tree is generated once; this just inspects a node. */}
      <Modal
        isOpen={showForkModal}
        onClose={() => setShowForkModal(false)}
        title="Node Details"
        size="large"
      >
        {(() => {
          const sd = selectedNode?.data || {};
          const salaryNum = Number(sd.salary) || 0;
          const depth = selectedNode?.depth ?? 0;
          const hasChildren = !!sd._hasChildren;
          const isExpanded = sd.id ? expandedIds.has(sd.id) : false;
          const childCount =
            sd._hiddenChildCount ||
            (Array.isArray(sd.children) ? sd.children.length : 0);
          return (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                    {depth === 0 ? "Starting Point" : `Level ${depth + 1} Role`}
                  </p>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-violet-100 px-2 py-0.5 rounded-full">
                    Level {depth + 1} of {MAX_TREE_DEPTH + 1}
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-lg">
                  {sd.jobTitle}
                </p>

                {/* Salary — prominent so it's never missed */}
                <div className="mt-2 inline-flex items-center gap-1.5 bg-green-100 text-green-800 font-bold text-sm px-3 py-1.5 rounded-lg">
                  <DollarSign size={15} />
                  {salaryNum > 0
                    ? `PKR ${salaryNum.toLocaleString()} / month`
                    : "Salary: your current starting point"}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {sd.timeline && (
                    <span className="text-slate-600 text-xs flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      <Clock size={12} /> {sd.timeline}
                    </span>
                  )}
                  {sd.sector && (
                    <span className="bg-white border border-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Building2 size={11} /> {sd.sector}
                    </span>
                  )}
                  {sd.careerField && (
                    <span className="bg-violet-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {sd.careerField}
                    </span>
                  )}
                  {sd.growthPotential && (
                    <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <TrendingUp size={11} /> {sd.growthPotential} growth
                    </span>
                  )}
                  {sd.confidenceScore > 0 && (
                    <span className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <BarChart3 size={11} /> {sd.confidenceScore}% confidence
                    </span>
                  )}
                </div>
                {sd.description && (
                  <p className="text-slate-600 text-xs mt-3 leading-relaxed">
                    {sd.description}
                  </p>
                )}

                {/* Required Skills + Skill Gap Analysis */}
                {sd.requiredSkills?.length > 0 &&
                  (() => {
                    const gapItems = computeSkillGap(
                      userProfile?.skills_with_levels,
                      sd.requiredSkills,
                    );
                    const summary = summarizeSkillGap(gapItems);
                    const STATUS_STYLE = {
                      missing:
                        "bg-red-50 border-red-200 text-red-700",
                      upgrade:
                        "bg-amber-50 border-amber-200 text-amber-700",
                      met: "bg-green-50 border-green-200 text-green-700",
                      exceeds:
                        "bg-emerald-50 border-emerald-200 text-emerald-700",
                    };
                    const STATUS_LABEL = {
                      missing: "Not learned yet",
                      upgrade: "Needs upgrade",
                      met: "Ready",
                      exceeds: "Exceeds",
                    };
                    return (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <AlertCircle
                              size={13}
                              className="text-amber-500"
                            />
                            Required Skills &amp; Your Gap Analysis
                          </p>
                          <span className="text-[11px] font-semibold text-indigo-700 bg-violet-100 px-2 py-0.5 rounded-full">
                            {summary.ready}/{summary.total} ready ·{" "}
                            {summary.pct}%
                          </span>
                        </div>

                        {/* Readiness bar */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${summary.pct}%`,
                              background:
                                "linear-gradient(90deg,#6366f1,#7c3aed)",
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {gapItems.map((item, i) => (
                            <div
                              key={i}
                              className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs border ${STATUS_STYLE[item.status]}`}
                            >
                              <span className="flex items-center gap-1 font-medium truncate">
                                {item.gap <= 0 ? (
                                  <CheckCircle2
                                    size={11}
                                    className="shrink-0"
                                  />
                                ) : (
                                  <AlertCircle
                                    size={11}
                                    className="shrink-0"
                                  />
                                )}
                                <span className="truncate">{item.name}</span>
                              </span>
                              <span className="text-[10px] opacity-90 whitespace-nowrap ml-1.5 text-right">
                                <span className="block font-semibold">
                                  {STATUS_LABEL[item.status]}
                                </span>
                                <span className="capitalize opacity-75">
                                  {item.userLevel === "none"
                                    ? "none"
                                    : item.userLevel}{" "}
                                  → {item.requiredLevel}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>

                        {summary.total > 0 && (
                          <p className="text-[11px] text-slate-500 mt-2">
                            {summary.missing > 0 && (
                              <span className="text-red-600 font-medium">
                                {summary.missing} skill
                                {summary.missing > 1 ? "s" : ""} to learn
                              </span>
                            )}
                            {summary.missing > 0 &&
                              summary.upgrade > 0 &&
                              " · "}
                            {summary.upgrade > 0 && (
                              <span className="text-amber-600 font-medium">
                                {summary.upgrade} to improve
                              </span>
                            )}
                            {summary.missing === 0 &&
                              summary.upgrade === 0 && (
                                <span className="text-green-600 font-medium">
                                  You meet every requirement for this role 🎉
                                </span>
                              )}
                          </p>
                        )}

                        {!userProfile && (
                          <p className="text-xs text-slate-400 mt-1">
                            Fill your profile to see personalized skill gap
                            analysis
                          </p>
                        )}
                      </div>
                    );
                  })()}
              </div>

              {/* Expand / collapse control — pure UI, no API call */}
              <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs text-slate-500">
                  {hasChildren
                    ? isExpanded
                      ? "Next steps are shown on the tree below this node."
                      : `${childCount} next career step${
                          childCount > 1 ? "s" : ""
                        } available — expand to explore them.`
                    : depth >= MAX_TREE_DEPTH
                      ? "End of this path — maximum depth reached."
                      : "This is a final step on this branch."}
                </p>
                {hasChildren && sd.id && (
                  <button
                    onClick={() => {
                      preserveViewRef.current = true;
                      setExpandedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(sd.id)) next.delete(sd.id);
                        else next.add(sd.id);
                        return next;
                      });
                      setShowForkModal(false);
                    }}
                    className="shrink-0 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                    }}
                  >
                    {isExpanded ? "Collapse" : "Expand"} next steps
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Save Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Save Career Path"
        size="small"
      >
        <p className="text-sm text-slate-500 mb-4">
          Give this path a memorable name so you can find it later.
        </p>
        <Input
          label="Path Name"
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
          placeholder="e.g., My AI Engineering Path"
        />
        <div className="flex gap-3 mt-4">
          <Button onClick={handleSavePath} fullWidth>
            <Save size={16} className="inline mr-1" /> Save Path
          </Button>
          <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SimulatorPage;

