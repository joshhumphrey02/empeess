// Shape returned by form Server Actions and read with useActionState.
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
};

export const initialFormState: FormState = {};
