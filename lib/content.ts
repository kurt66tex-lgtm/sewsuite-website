import { createServerClient } from "./supabase";
import type {
  SewSuitePage,
  SewSuiteService,
  SewSuiteTestimonial,
  SewSuiteFAQ,
} from "@/types";

export async function getPage(slug: string): Promise<SewSuitePage | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("sewsuite_pages")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

export async function getServices(): Promise<SewSuiteService[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("sewsuite_services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data as SewSuiteService[]) ?? [];
}

export async function getService(slug: string): Promise<SewSuiteService | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("sewsuite_services")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return (data as SewSuiteService) ?? null;
}

export async function getTestimonials(): Promise<SewSuiteTestimonial[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("sewsuite_testimonials")
    .select("*")
    .eq("approved", true)
    .order("sort_order", { ascending: true });
  return (data as SewSuiteTestimonial[]) ?? [];
}

export async function getFAQs(): Promise<SewSuiteFAQ[]> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("sewsuite_faq")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data as SewSuiteFAQ[]) ?? [];
}
