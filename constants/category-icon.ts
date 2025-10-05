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
} from "lucide-react";

interface CategoryIcon {
  [key: string]: LucideIcon;
}

export const categoryIcon: CategoryIcon = {
  "web-logins": Globe,
  "bank-accounts": Landmark,
  "credit-cards": CreditCard,
  "email-accounts": Mail,
  "social-media-accounts": Users,
  "identity-documents": UserSquare,
  "wifi-passwords": Wifi,
  notes: FileText,
  others: Archive,
};
