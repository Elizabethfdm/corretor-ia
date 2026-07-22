import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/features/dashboard/components/mobile-nav";
import { LogoutButton } from "@/features/auth/components/logout-button";

interface HeaderProps {
  name: string;
  email: string;
  isAdmin: boolean;
}

export function Header({ name, email, isAdmin }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-4 py-3 md:px-6 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <MobileNav isAdmin={isAdmin} />
        <div className="flex flex-col leading-tight">
          <span className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">
            {name}
            {isAdmin ? <Badge variant="primary">Admin</Badge> : null}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{email}</span>
        </div>
      </div>
      <LogoutButton />
    </header>
  );
}
