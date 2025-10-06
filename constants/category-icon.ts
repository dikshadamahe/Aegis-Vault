import {
  CreditCard,
  FileText,
  Globe,
  LucideIcon,
  Mail,
  Landmark,
  UserSquare,
  Users,
  Wifi,
  Archive,
  Code,
  Clapperboard,
  ShoppingCart,
  Briefcase,
} from "lucide-react";

interface CategoryIcon {
  [key: string]: LucideIcon;
}

// Dynamic category icons with meaningful representations
export const categoryIcon: CategoryIcon = {
  // Default categories with specific icons
  "banking": Landmark,
  "development": Code,
  "email": Mail,
  "entertainment": Clapperboard,
  "other": Archive,
  "shopping": ShoppingCart,
  "social-media": Users,
  "work": Briefcase,
  
  // Legacy mappings (keep for backwards compatibility)
  "web-logins": Globe,
  "bank-accounts": Landmark,
  "credit-cards": CreditCard,
  "email-accounts": Mail,
  "social-media-accounts": Users,
  "identity-documents": UserSquare,
  "wifi-passwords": Wifi,
  "notes": FileText,
  "others": Archive,
};
