import { 
  Briefcase, 
  Brain, 
  Heart, 
  DollarSign, 
  GraduationCap, 
  Leaf, 
  Users, 
  Zap, 
  UserCog, 
  Coins, 
  CircleDashed, 
  LayoutGrid,
  type LucideIcon
} from "lucide-react";

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: Category[] = [
  { id: "SaaS", label: "SaaS", icon: Briefcase },
  { id: "AI", label: "AI", icon: Brain },
  { id: "Health", label: "Health", icon: Heart },
  { id: "FinTech", label: "FinTech", icon: DollarSign },
  { id: "EdTech", label: "EdTech", icon: GraduationCap },
  { id: "Climate", label: "Climate", icon: Leaf },
  { id: "Social", label: "Social", icon: Users },
  { id: "Productivity", label: "Productivity", icon: Zap },
  { id: "HR Tech", label: "HR Tech", icon: UserCog },
  { id: "Web3", label: "Web3", icon: Coins },
  { id: "Other", label: "Other", icon: CircleDashed },
];

// For dropdowns that need "All" option (e.g., filtering)
export const CATEGORIES_WITH_ALL: Category[] = [
  { id: "All", label: "All", icon: LayoutGrid },
  ...CATEGORIES,
];

// Simple array of category IDs for select dropdowns
export const CATEGORY_OPTIONS: string[] = CATEGORIES.map(c => c.id);
