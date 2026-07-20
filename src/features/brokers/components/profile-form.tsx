"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProfileAction } from "@/features/brokers/actions";
import { idleActionState } from "@/lib/forms/action-state";
import { FormField } from "@/components/ui/form-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { SlugField } from "@/features/brokers/components/slug-field";
import type { BrokerProfile } from "@/generated/prisma/client";

interface ProfileFormProps {
  profile: BrokerProfile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction] = useActionState(saveProfileAction, idleActionState);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "idle") {
      messageRef.current?.focus();
    }
  }, [state]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.status !== "idle" && state.message ? (
        <div ref={messageRef} tabIndex={-1}>
          <FormMessage
            status={state.status === "error" ? "error" : "success"}
            message={state.message}
          />
        </div>
      ) : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Identificação
        </legend>

        <FormField
          id="professionalName"
          label="Nome profissional"
          errors={errors["professionalName"]}
        >
          <Input
            name="professionalName"
            type="text"
            required
            maxLength={150}
            defaultValue={profile?.professionalName ?? ""}
          />
        </FormField>

        <FormField id="fullName" label="Nome completo" errors={errors["fullName"]}>
          <Input
            name="fullName"
            type="text"
            required
            maxLength={150}
            defaultValue={profile?.fullName ?? ""}
          />
        </FormField>

        <SlugField defaultValue={profile?.slug ?? ""} errors={errors["slug"]} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Dados profissionais
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="creciNumber" label="Número do CRECI" errors={errors["creciNumber"]}>
            <Input
              name="creciNumber"
              type="text"
              maxLength={30}
              defaultValue={profile?.creciNumber ?? ""}
            />
          </FormField>

          <FormField id="creciState" label="Estado do CRECI (UF)" errors={errors["creciState"]}>
            <Input
              name="creciState"
              type="text"
              maxLength={2}
              defaultValue={profile?.creciState ?? ""}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="whatsapp" label="WhatsApp" errors={errors["whatsapp"]}>
            <Input
              name="whatsapp"
              type="tel"
              placeholder="11999999999"
              defaultValue={profile?.whatsapp ?? ""}
            />
          </FormField>

          <FormField id="phone" label="Telefone (opcional)" errors={errors["phone"]}>
            <Input name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
          </FormField>
        </div>

        <FormField
          id="commercialEmail"
          label="E-mail comercial (opcional)"
          errors={errors["commercialEmail"]}
        >
          <Input
            name="commercialEmail"
            type="email"
            defaultValue={profile?.commercialEmail ?? ""}
          />
        </FormField>

        <FormField id="biography" label="Biografia (opcional)" errors={errors["biography"]}>
          <textarea
            name="biography"
            maxLength={1000}
            rows={4}
            defaultValue={profile?.biography ?? ""}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Localização
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="city" label="Cidade de atuação" errors={errors["city"]}>
            <Input name="city" type="text" maxLength={100} defaultValue={profile?.city ?? ""} />
          </FormField>

          <FormField id="state" label="Estado (UF)" errors={errors["state"]}>
            <Input name="state" type="text" maxLength={2} defaultValue={profile?.state ?? ""} />
          </FormField>
        </div>

        <FormField
          id="businessAddress"
          label="Endereço comercial (opcional)"
          errors={errors["businessAddress"]}
        >
          <Input
            name="businessAddress"
            type="text"
            maxLength={200}
            defaultValue={profile?.businessAddress ?? ""}
          />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Redes sociais (opcional)
        </legend>

        <FormField id="instagramUrl" label="Instagram" errors={errors["instagramUrl"]}>
          <Input
            name="instagramUrl"
            type="url"
            placeholder="https://instagram.com/..."
            defaultValue={profile?.instagramUrl ?? ""}
          />
        </FormField>
        <FormField id="facebookUrl" label="Facebook" errors={errors["facebookUrl"]}>
          <Input
            name="facebookUrl"
            type="url"
            placeholder="https://facebook.com/..."
            defaultValue={profile?.facebookUrl ?? ""}
          />
        </FormField>
        <FormField id="linkedinUrl" label="LinkedIn" errors={errors["linkedinUrl"]}>
          <Input
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/..."
            defaultValue={profile?.linkedinUrl ?? ""}
          />
        </FormField>
        <FormField id="websiteUrl" label="Site" errors={errors["websiteUrl"]}>
          <Input
            name="websiteUrl"
            type="url"
            placeholder="https://..."
            defaultValue={profile?.websiteUrl ?? ""}
          />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Identidade visual (opcional)
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField id="primaryColor" label="Cor principal" errors={errors["primaryColor"]}>
            <Input
              name="primaryColor"
              type="text"
              placeholder="#1D4ED8"
              defaultValue={profile?.primaryColor ?? ""}
            />
          </FormField>
          <FormField id="secondaryColor" label="Cor secundária" errors={errors["secondaryColor"]}>
            <Input
              name="secondaryColor"
              type="text"
              placeholder="#F59E0B"
              defaultValue={profile?.secondaryColor ?? ""}
            />
          </FormField>
        </div>
      </fieldset>

      <SubmitButton pendingLabel="Salvando...">Salvar perfil</SubmitButton>
    </form>
  );
}
