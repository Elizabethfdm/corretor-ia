import { logoutAction } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton
        pendingLabel="Saindo..."
        className="bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
      >
        Sair
      </SubmitButton>
    </form>
  );
}
