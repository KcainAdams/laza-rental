// ============================================================
//  LazaRental — Supabase Client & Data Hooks
//  File: src/lib/supabase.ts
//  Install: npm install @supabase/supabase-js
// ============================================================

import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useState, useCallback, useRef } from "react";

// ── ENV VARS ──────────────────────────────────────────────
// Create a .env file in your project root:
//   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ══════════════════════════════════════════════════════════
//  DATABASE TYPES  (mirrors schema)
// ══════════════════════════════════════════════════════════
export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "tenant" | "landlord";
  avatar_url: string | null;
  verified: boolean;
  trust_score: number;
  created_at: string;
}

export interface DbProperty {
  id: string;
  landlord_id: string;
  title: string;
  address: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  price: number;
  deposit: number;
  sqft: number;
  description: string | null;
  img_url: string | null;
  available: boolean;
  badge: string;
  landlord_verified: boolean;
  landlord_score: number;
  amenities: string[];
  bylaws: { icon: string; text: string }[];
  refund_rules: string[];
  price_history: number[];
  lat: number | null;
  lng: number | null;
  created_at: string;
  // joined fields
  profiles?: DbProfile;
  reviews?: DbReview[];
  avg_rating?: number;
}

export interface DbReview {
  id: string;
  property_id: string;
  user_id: string;
  rating: number;
  text: string;
  created_at: string;
  profiles?: DbProfile;
}

export interface DbApplication {
  id: string;
  property_id: string;
  tenant_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  created_at: string;
  properties?: DbProperty;
  profiles?: DbProfile;
}

export interface DbMessage {
  id: string;
  property_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  read: boolean;
  created_at: string;
  sender?: DbProfile;
}

export interface DbNotification {
  id: string;
  user_id: string;
  icon: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface DbSaved {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface DbViewingRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  preferred_date: string | null;
  message: string | null;
  status: "pending" | "confirmed" | "declined";
  created_at: string;
}

// ══════════════════════════════════════════════════════════
//  AUTH HOOK
// ══════════════════════════════════════════════════════════
export interface AuthState {
  user: import("@supabase/supabase-js").User | null;
  profile: DbProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<DbProfile>) => Promise<{ error: string | null }>;
}

export function useAuth(): AuthState {
  const [user, setUser]       = useState<AuthState["user"]>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();
    if (data) setProfile(data as DbProfile);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, name: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<DbProfile>) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id);
    if (!error) setProfile(p => p ? { ...p, ...data } : p);
    return { error: error?.message ?? null };
  };

  return { user, profile, loading, signUp, signIn, signOut, updateProfile };
}

// ══════════════════════════════════════════════════════════
//  PROPERTIES HOOK
// ══════════════════════════════════════════════════════════
export interface PropertyFilters {
  search?: string;
  bedrooms?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  neighborhood?: string | null;
  available?: boolean;
  sortBy?: "created_at" | "price" | "rating";
  sortDir?: "asc" | "desc";
}

export function useProperties(filters: PropertyFilters = {}) {
  const [properties, setProperties] = useState<DbProperty[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("properties")
      .select(`
        *,
        profiles:landlord_id ( id, full_name, avatar_url, verified, trust_score ),
        reviews ( rating )
      `);

    // Apply filters
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,neighborhood.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
      );
    }
    if (filters.bedrooms)    query = query.eq("bedrooms", filters.bedrooms);
    if (filters.minPrice)    query = query.gte("price", filters.minPrice);
    if (filters.maxPrice)    query = query.lte("price", filters.maxPrice);
    if (filters.neighborhood) query = query.eq("neighborhood", filters.neighborhood);
    if (filters.available !== undefined) query = query.eq("available", filters.available);

    // Sort
    const col = filters.sortBy === "price" ? "price" : "created_at";
    query = query.order(col, { ascending: filters.sortDir === "asc" });

    const { data, error: err } = await query;
    if (err) { setError(err.message); setLoading(false); return; }

    // Compute avg rating client-side from joined reviews
    const enriched = (data ?? []).map((p: any) => ({
      ...p,
      avg_rating: p.reviews?.length
        ? +(p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length).toFixed(1)
        : null,
    }));

    setProperties(enriched as DbProperty[]);
    setLoading(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { properties, loading, error, refetch: fetch };
}

// ── Single property ────────────────────────────────────────
export function useProperty(id: string) {
  const [property, setProperty] = useState<DbProperty | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("properties")
      .select(`*, profiles:landlord_id(*), reviews(*, profiles:user_id(*))`)
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setProperty(data as DbProperty);
        setLoading(false);
      });
  }, [id]);

  return { property, loading };
}

// ── Post new property ──────────────────────────────────────
export async function createProperty(
  data: Omit<DbProperty, "id" | "created_at" | "profiles" | "reviews" | "avg_rating">,
  imageFile?: File
): Promise<{ id: string | null; error: string | null }> {
  let img_url = data.img_url;

  // Upload image if provided
  if (imageFile) {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user?.id}/${Date.now()}_${imageFile.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("property-images")
      .upload(path, imageFile);
    if (uploadErr) return { id: null, error: uploadErr.message };
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
    img_url = urlData.publicUrl;
  }

  const { data: row, error } = await supabase
    .from("properties")
    .insert({ ...data, img_url })
    .select("id")
    .single();

  return { id: row?.id ?? null, error: error?.message ?? null };
}

// ── Update property ────────────────────────────────────────
export async function updateProperty(
  id: string,
  data: Partial<DbProperty>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("properties").update(data).eq("id", id);
  return { error: error?.message ?? null };
}

// ── Delete property ────────────────────────────────────────
export async function deleteProperty(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  return { error: error?.message ?? null };
}

// ══════════════════════════════════════════════════════════
//  REVIEWS HOOK
// ══════════════════════════════════════════════════════════
export function useReviews(propertyId?: string) {
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from("reviews")
      .select("*, profiles:user_id(id, full_name, avatar_url)")
      .order("created_at", { ascending: false });
    if (propertyId) query = query.eq("property_id", propertyId);

    query.then(({ data }) => {
      setReviews((data ?? []) as DbReview[]);
      setLoading(false);
    });
  }, [propertyId]);

  const addReview = useCallback(async (
    propertyId: string,
    rating: number,
    text: string
  ): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("reviews")
      .insert({ property_id: propertyId, user_id: user.id, rating, text })
      .select("*, profiles:user_id(*)")
      .single();
    if (!error && data) setReviews(r => [data as DbReview, ...r]);
    return { error: error?.message ?? null };
  }, []);

  const deleteReview = useCallback(async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (!error) setReviews(r => r.filter(x => x.id !== reviewId));
    return { error: error?.message ?? null };
  }, []);

  return { reviews, loading, addReview, deleteReview };
}

// ══════════════════════════════════════════════════════════
//  SAVED / FAVOURITES HOOK
// ══════════════════════════════════════════════════════════
export function useSaved(userId?: string) {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", userId)
      .then(({ data }) => setSavedIds((data ?? []).map((r: any) => r.property_id)));
  }, [userId]);

  const toggle = useCallback(async (propertyId: string) => {
    if (!userId) return;
    const isSaved = savedIds.includes(propertyId);
    if (isSaved) {
      await supabase.from("saved_properties")
        .delete().eq("user_id", userId).eq("property_id", propertyId);
      setSavedIds(ids => ids.filter(x => x !== propertyId));
    } else {
      await supabase.from("saved_properties")
        .insert({ user_id: userId, property_id: propertyId });
      setSavedIds(ids => [...ids, propertyId]);
    }
  }, [userId, savedIds]);

  return { savedIds, toggle, isSaved: (id: string) => savedIds.includes(id) };
}

// ══════════════════════════════════════════════════════════
//  APPLICATIONS HOOK
// ══════════════════════════════════════════════════════════
export function useApplications(userId?: string, role?: "tenant" | "landlord") {
  const [applications, setApplications] = useState<DbApplication[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!userId) return;
    let query = supabase
      .from("applications")
      .select("*, properties(*), profiles:tenant_id(*)");

    if (role === "tenant") query = query.eq("tenant_id", userId);

    query.order("created_at", { ascending: false })
      .then(({ data }) => {
        setApplications((data ?? []) as DbApplication[]);
        setLoading(false);
      });
  }, [userId, role]);

  const apply = useCallback(async (
    propertyId: string,
    message?: string
  ): Promise<{ error: string | null }> => {
    if (!userId) return { error: "Not authenticated" };
    const { data, error } = await supabase
      .from("applications")
      .insert({ property_id: propertyId, tenant_id: userId, message: message ?? null })
      .select("*, properties(*)")
      .single();
    if (!error && data) setApplications(a => [data as DbApplication, ...a]);
    return { error: error?.message ?? null };
  }, [userId]);

  const updateStatus = useCallback(async (
    appId: string,
    status: "approved" | "rejected"
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", appId);
    if (!error) setApplications(a => a.map(x => x.id === appId ? { ...x, status } : x));
    return { error: error?.message ?? null };
  }, []);

  return { applications, loading, apply, updateStatus };
}

// ══════════════════════════════════════════════════════════
//  MESSAGES HOOK  (with Realtime)
// ══════════════════════════════════════════════════════════
export function useMessages(propertyId: string, otherUserId: string) {
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const channelRef              = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!propertyId || !otherUserId) return;

    // Load history
    supabase
      .from("messages")
      .select("*, sender:sender_id(id, full_name, avatar_url)")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as DbMessage[]);
        setLoading(false);
      });

    // Subscribe to realtime new messages
    channelRef.current = supabase
      .channel(`messages:${propertyId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `property_id=eq.${propertyId}`,
      }, (payload) => {
        setMessages(m => [...m, payload.new as DbMessage]);
      })
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [propertyId, otherUserId]);

  const send = useCallback(async (text: string): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("messages").insert({
      property_id: propertyId,
      sender_id: user.id,
      receiver_id: otherUserId,
      text,
    });
    return { error: error?.message ?? null };
  }, [propertyId, otherUserId]);

  const markRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("property_id", propertyId)
      .eq("receiver_id", user.id)
      .eq("read", false);
    setMessages(m => m.map(x => ({ ...x, read: true })));
  }, [propertyId]);

  return { messages, loading, send, markRead };
}

// ══════════════════════════════════════════════════════════
//  NOTIFICATIONS HOOK  (with Realtime)
// ══════════════════════════════════════════════════════════
export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setNotifications((data ?? []) as DbNotification[]));

    channelRef.current = supabase
      .channel(`notifs:${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifications(n => [payload.new as DbNotification, ...n]);
      })
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [userId]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead };
}

// ══════════════════════════════════════════════════════════
//  VIEWING REQUESTS HOOK
// ══════════════════════════════════════════════════════════
export function useViewingRequests(propertyId?: string) {
  const [requests, setRequests] = useState<DbViewingRequest[]>([]);

  useEffect(() => {
    if (!propertyId) return;
    supabase
      .from("viewing_requests")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRequests((data ?? []) as DbViewingRequest[]));
  }, [propertyId]);

  const request = useCallback(async (
    propertyId: string,
    preferredDate?: string,
    message?: string
  ): Promise<{ error: string | null }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("viewing_requests").insert({
      property_id: propertyId,
      tenant_id: user.id,
      preferred_date: preferredDate ?? null,
      message: message ?? null,
    });
    return { error: error?.message ?? null };
  }, []);

  return { requests, request };
}

// ══════════════════════════════════════════════════════════
//  IMAGE UPLOAD HELPER
// ══════════════════════════════════════════════════════════
export async function uploadPropertyImage(
  file: File,
  userId: string
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("property-images")
    .upload(path, file, { upsert: false });

  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from("property-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// ══════════════════════════════════════════════════════════
//  LANDLORD ANALYTICS HELPER
// ══════════════════════════════════════════════════════════
export async function getLandlordAnalytics(landlordId: string) {
  const [propertiesRes, applicationsRes, messagesRes, reviewsRes] = await Promise.all([
    supabase.from("properties").select("id, title, price, available").eq("landlord_id", landlordId),
    supabase.from("applications")
      .select("status, properties!inner(landlord_id)")
      .eq("properties.landlord_id", landlordId),
    supabase.from("messages")
      .select("id, created_at, receiver_id")
      .eq("receiver_id", landlordId),
    supabase.from("reviews")
      .select("rating, properties!inner(landlord_id)")
      .eq("properties.landlord_id", landlordId),
  ]);

  const properties   = propertiesRes.data   ?? [];
  const applications = applicationsRes.data ?? [];
  const reviews      = reviewsRes.data      ?? [];

  const avgRating = reviews.length
    ? +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return {
    totalListings:    properties.length,
    activeListings:   properties.filter(p => p.available).length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === "pending").length,
    approvedApplications: applications.filter(a => a.status === "approved").length,
    totalMessages:    messagesRes.data?.length ?? 0,
    totalReviews:     reviews.length,
    avgRating,
    properties,
  };
}
