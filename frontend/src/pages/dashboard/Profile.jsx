import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { Loading } from "../../components/Loading";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Toast } from "../../components/Toast";
import {
  User, FileText, Loader, Pencil, Target, Trophy,
  Briefcase, GraduationCap, MapPin, DollarSign, Wrench, Plus, X,
} from "lucide-react";

const PAKISTAN_CAREER_FIELDS = [
  "Technology & IT","Medicine & Healthcare","Engineering","Business & Commerce",
  "Law & Legal","Education & Teaching","Government & Civil Services","Banking & Finance",
  "Media & Journalism","Arts, Design & Creative","Agriculture","Sciences & Research",
  "Social Sciences","Military & Defense","Real Estate","Hospitality & Tourism",
];
const PAKISTAN_CITIES = [
  "Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Peshawar","Quetta",
  "Multan","Hyderabad","Sialkot","Gujranwala","Bahawalpur","Sargodha","Sukkur",
  "Remote / Freelance",
];
const PKR_SALARY_RANGES = [
  "30,000 \u2013 50,000 PKR/month","50,000 \u2013 80,000 PKR/month","80,000 \u2013 120,000 PKR/month",
  "120,000 \u2013 200,000 PKR/month","200,000 \u2013 350,000 PKR/month",
  "350,000 \u2013 500,000 PKR/month","500,000+ PKR/month",
];
const EDUCATION_LEVELS = [
  "High School","Diploma / Associate","Bachelor's","Master's","PhD","MBBS / MD","LLB / LLM",
];

const skillMapToRows = (mapValue = {}) => {
  const entries = Object.entries(mapValue || {}).map(([name, level]) => ({ name, level: level || "basic" }));
  return entries.length ? entries : [{ name: "", level: "basic" }];
};
const rowsToSkillMap = (rows = []) =>
  rows.reduce((acc, row) => {
    const key = (row.name || "").trim();
    if (!key) return acc;
    acc[key] = (row.level || "basic").toLowerCase();
    return acc;
  }, {});

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "", education_level: "", current_job: "", skills: "",
    skills_with_levels: {}, years_experience: "", desired_field: "",
    salary_expectation: "", location: "",
  });
  const [skillRows, setSkillRows] = useState([{ name: "", level: "basic" }]);
  const [toast, setToast] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const applySkillRowsToForm = useCallback((rows) => {
    const skillMap = rowsToSkillMap(rows);
    setFormData((prev) => ({ ...prev, skills_with_levels: skillMap, skills: Object.keys(skillMap).join(", ") }));
  }, []);

  const updateSkillRow = (index, field, value) => {
    const updated = skillRows.map((row, idx) => idx === index ? { ...row, [field]: value } : row);
    setSkillRows(updated);
    applySkillRowsToForm(updated);
  };
  const addSkillRow = () => setSkillRows((prev) => [...prev, { name: "", level: "basic" }]);
  const removeSkillRow = (index) => {
    const updated = skillRows.filter((_, idx) => idx !== index);
    const final = updated.length ? updated : [{ name: "", level: "basic" }];
    setSkillRows(final);
    applySkillRowsToForm(final);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get("/profile/");
      const data = response.data.data;
      setProfile(data);
      setFormData({
        full_name: data.full_name || "", education_level: data.education_level || "",
        current_job: data.current_job || "", skills: data.skills || "",
        skills_with_levels: data.skills_with_levels || {}, years_experience: data.years_experience || "",
        desired_field: data.desired_field || "", salary_expectation: data.salary_expectation || "",
        location: data.location || "",
      });
      setSkillRows(skillMapToRows(data.skills_with_levels || {}));
    } catch (error) {
      if (error.response?.status === 404) setEditing(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setToast({ message: "File too large (max 2MB)", type: "error" }); return; }
    setUploadingResume(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await api.post("/profile/upload-resume/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const data = res.data.data || {};
      const extractedMap = data.skills_with_levels || {};
      const profilePatch = data.profile_patch || {};
      const desiredSuggestions = profilePatch.desired_field_suggestions || [];
      setFormData((prev) => ({
        ...prev,
        education_level: profilePatch.education_level || prev.education_level,
        years_experience: profilePatch.years_experience != null ? profilePatch.years_experience : prev.years_experience,
        current_job: profilePatch.current_job || prev.current_job,
        desired_field: prev.desired_field || desiredSuggestions[0] || "",
      }));
      const mergedMap = { ...rowsToSkillMap(skillRows), ...extractedMap };
      const mergedRows = skillMapToRows(mergedMap);
      setSkillRows(mergedRows);
      applySkillRowsToForm(mergedRows);
      setToast({ message: `Resume parsed. Found ${data.skills_count || 0} skills`, type: "success" });
    } catch (err) {
      setToast({ message: err.response?.data?.error || "Resume upload failed", type: "error" });
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, years_experience: Number(formData.years_experience || 0) };
      if (profile) await api.put("/profile/", payload);
      else await api.post("/profile/", payload);
      setToast({ message: "Profile saved!", type: "success" });
      setEditing(false);
      fetchProfile();
    } catch { setToast({ message: "Failed to save", type: "error" }); }
    finally { setSaving(false); }
  };

  if (loading) return <Loading message="Loading profile..." />;

  if (editing || !profile) {
    return (
      <div className="min-h-screen py-8" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white/85 backdrop-blur-sm rounded-2xl border border-violet-100 shadow-lg shadow-violet-200/30 overflow-hidden">
            <div className="bg-linear-to-br from-indigo-600 to-violet-700 px-6 py-7 text-center">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3">
                <User size={28} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">{profile ? "Edit Your Profile" : "Create Your Profile"}</h1>
              <p className="text-violet-100 mt-1 text-sm">Helps our AI generate personalized career paths for you</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <div className="md:col-span-2">
                  <Input label="Full Name" value={formData.full_name} onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Education Level <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800" value={formData.education_level} onChange={(e) => setFormData((p) => ({ ...p, education_level: e.target.value }))} required>
                    <option value="">-- Select --</option>
                    {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <Input label="Current Job / Role" value={formData.current_job} onChange={(e) => setFormData((p) => ({ ...p, current_job: e.target.value }))} placeholder="e.g., Software Developer" required />
                <div className="md:col-span-2 mb-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Skills with Proficiency <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {skillRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input className="col-span-7 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={row.name} onChange={(e) => updateSkillRow(idx, "name", e.target.value)} placeholder="e.g., Python" />
                        <select className="col-span-4 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={row.level} onChange={(e) => updateSkillRow(idx, "level", e.target.value)}>
                          <option value="basic">Basic</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="expert">Expert</option>
                        </select>
                        <button type="button" className="col-span-1 p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-300" onClick={() => removeSkillRow(idx)} aria-label="Remove">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addSkillRow} className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-700">
                    <Plus size={14} /> Add skill
                  </button>
                </div>
                <div className="md:col-span-2 mb-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700 font-medium hover:bg-indigo-100 transition-colors">
                    {uploadingResume ? <Loader size={16} className="animate-spin" /> : <FileText size={16} />}
                    <span>{uploadingResume ? "Parsing resume..." : "Upload Resume (PDF/DOCX) to auto-fill"}</span>
                    <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploadingResume} />
                  </label>
                </div>
                <Input label="Years of Experience" type="number" value={formData.years_experience} onChange={(e) => setFormData((p) => ({ ...p, years_experience: e.target.value }))} min="0" required />
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Desired Career Field <span className="text-red-500">*</span></label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800" value={formData.desired_field} onChange={(e) => setFormData((p) => ({ ...p, desired_field: e.target.value }))} required>
                    <option value="">-- Select field --</option>
                    {PAKISTAN_CAREER_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">City / Location</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800" value={formData.location} onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}>
                    <option value="">-- Select city --</option>
                    {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="mb-3 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Salary Expectation (PKR/month)</label>
                  <select className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800" value={formData.salary_expectation} onChange={(e) => setFormData((p) => ({ ...p, salary_expectation: e.target.value }))}>
                    <option value="">-- Select range --</option>
                    {PKR_SALARY_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button type="submit" loading={saving} fullWidth size="large">{profile ? "Save Changes" : "Create Profile"}</Button>
                {profile && (<Button variant="outlined" size="large" onClick={() => setEditing(false)}>Cancel</Button>)}
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  const skillEntries = Object.entries(profile.skills_with_levels || {});
  const fallbackSkillList = profile.skills ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const infoItems = [
    { label: "Education", value: profile.education_level || "Not set", icon: <GraduationCap size={16} /> },
    { label: "Desired Field", value: profile.desired_field || "Not set", icon: <Target size={16} /> },
    { label: "Location", value: profile.location || "Not set", icon: <MapPin size={16} /> },
    { label: "Salary Expectation", value: profile.salary_expectation || "Not set", icon: <DollarSign size={16} /> },
  ];

  const avatarSeed = encodeURIComponent(
    profile.full_name || profile.current_job || "user",
  );
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}&backgroundColor=c7d2fe,ddd6fe,cffafe,fef3c7`;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)" }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="bg-white/70 backdrop-blur-md border-b border-violet-100 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={avatarUrl}
            alt={profile.full_name}
            className="w-20 h-20 rounded-2xl bg-violet-50 border border-violet-200 mx-auto mb-4 shadow-md shadow-violet-200/40"
          />
          <h1 className="text-2xl font-bold text-slate-900">
            {profile.full_name}
          </h1>
          <p className="text-slate-600 mt-1">{profile.current_job}</p>
          <p className="text-slate-400 text-sm mt-1">
            {profile.years_experience} yrs experience &middot;{" "}
            {profile.location || "Location not set"}
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-5 shadow-sm shadow-violet-100/40">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => setEditing(true)} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-violet-50/70 hover:bg-violet-100 hover:text-indigo-600 transition-colors text-left text-sm font-medium text-slate-700">
                <Pencil size={16} /> Edit Profile
              </button>
              <button onClick={() => navigate("/simulator")} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-violet-50/70 hover:bg-violet-100 hover:text-indigo-600 transition-colors text-left text-sm font-medium text-slate-700">
                <Target size={16} /> Start Simulation
              </button>
              <button onClick={() => navigate("/achievements")} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-violet-50/70 hover:bg-violet-100 hover:text-indigo-600 transition-colors text-left text-sm font-medium text-slate-700">
                <Trophy size={16} /> View Achievements
              </button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-5 shadow-sm shadow-violet-100/40">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-indigo-600" /> Career Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {infoItems.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-gray-400">{item.icon}</span>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/85 backdrop-blur-sm rounded-xl border border-violet-100 p-5 shadow-sm shadow-violet-100/40">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wrench size={16} className="text-green-600" /> Skills ({skillEntries.length || fallbackSkillList.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillEntries.map(([skill, level], idx) => (
                  <span key={`${skill}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium">
                    {skill}<span className="text-[11px] uppercase text-indigo-500 tracking-wide">{level}</span>
                  </span>
                ))}
                {!skillEntries.length && fallbackSkillList.map((skill, idx) => (
                  <span key={`fallback-${idx}`} className="inline-flex items-center px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium">{skill}</span>
                ))}
                {!skillEntries.length && fallbackSkillList.length === 0 && (
                  <p className="text-gray-500 text-sm">No skills added yet. Edit your profile to add skills.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
