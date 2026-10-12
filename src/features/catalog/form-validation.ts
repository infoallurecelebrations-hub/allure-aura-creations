import type { FormEvent } from "react";

export function validateRequestForm(form: HTMLFormElement) {
  for (const field of Array.from(form.elements)) {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
    if (field.required && !field.value.trim()) {
      field.setCustomValidity("Please enter this detail before continuing.");
    } else if (["phone", "customerPhone"].includes(field.name)) {
      const digits = field.value.replace(/\D/g, "");
      if (!/^[+\d\s()-]+$/.test(field.value) || digits.length < 7 || digits.length > 15) {
        field.setCustomValidity("Enter a phone number with 7 to 15 digits, including your country code if needed.");
      }
    }
  }
  return form.reportValidity();
}

export function clearFieldError(event: FormEvent<HTMLFormElement>) {
  const field = event.target;
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) field.setCustomValidity("");
}
