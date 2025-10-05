import {
  AtSign,
  CreditCard,
  FileText,
  Globe,
  LucideIcon,
  Mail,
  Building2,
  Shield,
  UserCircle2,
  Wifi,
  FolderOpen,
} from "lucide-react";

interface CategoryIcon {
  [key: string]: LucideIcon;
}

export const categoryIcon: CategoryIcon = {
  "web-logins": Globe,
  "bank-accounts": Building2,
  "credit-cards": CreditCard,
  "email-accounts": Mail,
  "social-media-accounts": AtSign,
  "identity-documents": Shield,
  "wifi-passwords": Wifi,
  notes: FileText,
  others: FolderOpen,
};
