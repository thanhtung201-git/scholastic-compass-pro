import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface MarketingContextType {
  // Data
  leads: any[];
  campaigns: any[];
  sources: any[];
  followUps: any[];
  promotions: any[];
  leadActivities: any[];
  leadNotes: any[];
  staffs: any[]; // Bổ sung danh sách nhân viên vào Context
  loading: boolean;

  // Lead mutations
  addLead: (lead: any) => Promise<void>;
  updateLead: (id: string, lead: any) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  reassignLead: (id: string, staffId: string | null) => Promise<void>;

  // Campaign mutations
  addCampaign: (campaign: any) => Promise<void>;
  updateCampaign: (id: string, campaign: any) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;

  // Source mutations
  addSource: (source: any) => Promise<void>;
  updateSource: (id: string, source: any) => Promise<void>;
  deleteSource: (id: string) => Promise<void>;

  // Follow-up mutations
  addFollowUp: (followUp: any) => Promise<void>;
  updateFollowUp: (id: string, followUp: any) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;
  updateFollowUpStatus: (id: string, status: string) => Promise<void>;

  // Promotion mutations
  addPromotion: (promotion: any) => Promise<void>;
  updatePromotion: (id: string, promotion: any) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;

  // Activity mutations
  addActivity: (activity: any) => Promise<void>;
  getLeadActivities: (leadId: string) => Promise<any[]>;
  deleteActivity: (id: string) => Promise<void>;

  // Notes mutations
  addNote: (note: any) => Promise<void>;
  updateNote: (id: string, note: any) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getLeadNotes: (leadId: string) => Promise<any[]>;

  // Helpers
  getLeadsByStatus: (status: string) => any[];
}

const MarketingContext = createContext<MarketingContextType | null>(null);

export function MarketingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Queries
  const { data: leads = [], isLoading: loadLeads } = useQuery({
    queryKey: ["marketing_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*, source:marketing_sources(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Bổ sung query lấy danh sách Staff từ hệ thống để làm dropdown select
  const { data: staffs = [], isLoading: loadStaffs } = useQuery({
    queryKey: ["system_staffs"],
    queryFn: async () => {
      // Lưu ý: Thay đổi tên bảng "profiles" thành tên bảng chứa User/Staff thực tế của bạn nếu có khác biệt
      const { data, error } = await supabase
        .from("profiles") 
        .select("id, full_name");
      if (error) return []; // Nếu lỗi hoặc chưa phân quyền thì trả về mảng rỗng để không crash app
      return data || [];
    },
  });

  const { data: campaigns = [], isLoading: loadCampaigns } = useQuery({
    queryKey: ["marketing_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sources = [], isLoading: loadSources } = useQuery({
    queryKey: ["marketing_sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_sources")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: followUps = [], isLoading: loadFollowUps } = useQuery({
    queryKey: ["marketing_follow_ups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_follow_ups")
        .select("*, lead:marketing_leads(full_name)")
        .order("deadline");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: promotions = [], isLoading: loadPromotions } = useQuery({
    queryKey: ["marketing_promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: leadActivities = [], isLoading: loadActivities } = useQuery({
    queryKey: ["marketing_lead_activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_lead_activities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: leadNotes = [], isLoading: loadNotes } = useQuery({
    queryKey: ["marketing_lead_notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_lead_notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const loading =
    loadLeads ||
    loadCampaigns ||
    loadSources ||
    loadFollowUps ||
    loadPromotions ||
    loadActivities ||
    loadStaffs || // Thêm trạng thái load nhân viên
    loadNotes;

  // Lead mutations
  const addLeadMutation = useMutation({
    mutationFn: async (lead: any) => {
      const { error } = await supabase.from("marketing_leads").insert([lead]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_leads"] });
      toast.success("Lead created successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_leads")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_leads"] });
      toast.success("Lead updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_leads"] });
      toast.success("Lead deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const reassignLeadMutation = useMutation({
    mutationFn: async ({ id, staffId }: { id: string; staffId: string | null }) => {
      const { error } = await supabase
        .from("marketing_leads")
        .update({ assigned_staff_id: staffId })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_leads"] });
      toast.success("Lead reassigned successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Campaign mutations
  const addCampaignMutation = useMutation({
    mutationFn: async (campaign: any) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .insert([campaign]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign created successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_campaigns"] });
      toast.success("Campaign deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Source mutations
  const addSourceMutation = useMutation({
    mutationFn: async (source: any) => {
      const { error } = await supabase.from("marketing_sources").insert([source]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_sources"] });
      toast.success("Source created successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_sources")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_sources"] });
      toast.success("Source updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_sources")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_sources"] });
      toast.success("Source deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Follow-up mutations
  const addFollowUpMutation = useMutation({
    mutationFn: async (followUp: any) => {
      const { error } = await supabase
        .from("marketing_follow_ups")
        .insert([followUp]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_follow_ups"] });
      toast.success("Follow-up created successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_follow_ups")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_follow_ups"] });
      toast.success("Follow-up updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteFollowUpMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_follow_ups")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_follow_ups"] });
      toast.success("Follow-up deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Promotion mutations
  const addPromotionMutation = useMutation({
    mutationFn: async (promotion: any) => {
      const { error } = await supabase
        .from("marketing_promotions")
        .insert([promotion]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_promotions"] });
      toast.success("Promotion created successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updatePromotionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_promotions")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_promotions"] });
      toast.success("Promotion updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_promotions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_promotions"] });
      toast.success("Promotion deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Activity mutations
  const addActivityMutation = useMutation({
    mutationFn: async (activity: any) => {
      const { error } = await supabase
        .from("marketing_lead_activities")
        .insert([activity]);
      if (error) throw error;
      
      // ĐÃ SỬA: Loại bỏ update trường 'last_contact_at' không có trong DB để tránh lỗi crash hệ thống
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_lead_activities"] });
      queryClient.invalidateQueries({ queryKey: ["marketing_leads"] });
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_lead_activities")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_lead_activities"] });
      toast.success("Activity deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  // Notes mutations
  const addNoteMutation = useMutation({
    mutationFn: async (note: any) => {
      const { error } = await supabase
        .from("marketing_lead_notes")
        .insert([note]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_lead_notes"] });
      toast.success("Note added successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_lead_notes")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_lead_notes"] });
      toast.success("Note updated successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_lead_notes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_lead_notes"] });
      toast.success("Note deleted successfully");
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const value: MarketingContextType = {
    leads,
    campaigns,
    sources,
    followUps,
    promotions,
    leadActivities,
    leadNotes,
    staffs, // Export dữ liệu staff ra ngoài UI sử dụng
    loading,

    addLead: (lead) => addLeadMutation.mutateAsync(lead),
    updateLead: (id, data) => updateLeadMutation.mutateAsync({ id, data }),
    deleteLead: (id) => deleteLeadMutation.mutateAsync(id),
    updateLeadStatus: (id, status) =>
      // ĐÃ SỬA: Loại bỏ trường 'last_contact_at' tại đây
      updateLeadMutation.mutateAsync({ id, data: { status } }),
    reassignLead: (id, staffId) => reassignLeadMutation.mutateAsync({ id, staffId }),

    addCampaign: (campaign) => addCampaignMutation.mutateAsync(campaign),
    updateCampaign: (id, data) => updateCampaignMutation.mutateAsync({ id, data }),
    deleteCampaign: (id) => deleteCampaignMutation.mutateAsync(id),

    addSource: (source) => addSourceMutation.mutateAsync(source),
    updateSource: (id, data) => updateSourceMutation.mutateAsync({ id, data }),
    deleteSource: (id) => deleteSourceMutation.mutateAsync(id),

    addFollowUp: (followUp) => addFollowUpMutation.mutateAsync(followUp),
    updateFollowUp: (id, data) => updateFollowUpMutation.mutateAsync({ id, data }),
    deleteFollowUp: (id) => deleteFollowUpMutation.mutateAsync(id),
    updateFollowUpStatus: (id, status) =>
      updateFollowUpMutation.mutateAsync({ id, data: { status } }),

    addPromotion: (promotion) => addPromotionMutation.mutateAsync(promotion),
    updatePromotion: (id, data) => updatePromotionMutation.mutateAsync({ id, data }),
    deletePromotion: (id) => deletePromotionMutation.mutateAsync(id),

    addActivity: (activity) => addActivityMutation.mutateAsync(activity),
    getLeadActivities: async (leadId: string) => {
      const activities = leadActivities.filter((a) => a.lead_id === leadId);
      return activities;
    },
    deleteActivity: (id) => deleteActivityMutation.mutateAsync(id),

    addNote: (note) => addNoteMutation.mutateAsync(note),
    updateNote: (id, data) => updateNoteMutation.mutateAsync({ id, data }),
    deleteNote: (id) => deleteNoteMutation.mutateAsync(id),
    getLeadNotes: async (leadId: string) => {
      const notes = leadNotes.filter((n) => n.lead_id === leadId);
      return notes;
    },

    getLeadsByStatus: (status: string) => {
      return leads.filter((l) => l.status === status);
    },
  };

  return (
    <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>
  );
}

export function useMarketing() {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error("useMarketing must be used within MarketingProvider");
  }
  return context;
}