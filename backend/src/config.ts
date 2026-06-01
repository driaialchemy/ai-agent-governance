import { isMissingOrRejectedSecret } from "./security/secrets";

type SecretCheck = {
  name: string;
  value: string | undefined;
  minLength?: number;
};

function validateSecret({ name, value, minLength = 32 }: SecretCheck): string[] {
  if (isMissingOrRejectedSecret(value, minLength)) {
    return [`${name} is required and must not be a known default or weak value.`];
  }
  return [];
}

export function validateRuntimeConfig(): void {
  const errors = [
    ...validateSecret({
      name: "WEBHOOK_INBOUND_SECRET",
      value: process.env.WEBHOOK_INBOUND_SECRET
    }),
    ...validateSecret({
      name: "ADMIN_API_KEY",
      value: process.env.ADMIN_API_KEY
    })
  ];

  if (errors.length > 0) {
    throw new Error(`Invalid security configuration: ${errors.join(" ")}`);
  }
}
