import type { InvoiceItem, Member, SplitSession, UpdateSessionInput } from "@/lib/types";

const MIN_MEMBERS = 2;
const MAX_MEMBERS = 20;
const MAX_NAME_LENGTH = 50;
const MAX_VPA_LENGTH = 100;

const UPI_VPA_REGEX = /^[\w.-]+@[\w.-]+$/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateMemberNames(names: string[]): string[] {
  const trimmed = names.map((name) => name.trim()).filter((name) => name.length > 0);

  if (trimmed.length < MIN_MEMBERS) {
    throw new ValidationError(
      `At least ${MIN_MEMBERS} members with valid names are required.`,
    );
  }

  if (trimmed.length > MAX_MEMBERS) {
    throw new ValidationError(`A session can have at most ${MAX_MEMBERS} members.`);
  }

  for (const name of trimmed) {
    if (name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `Member names must be ${MAX_NAME_LENGTH} characters or fewer.`,
      );
    }
  }

  const lowerNames = trimmed.map((name) => name.toLowerCase());
  const uniqueNames = new Set(lowerNames);

  if (uniqueNames.size !== lowerNames.length) {
    throw new ValidationError("Member names must be unique.");
  }

  return trimmed;
}

export function validateVpa(vpa: string): string {
  const trimmed = vpa.trim();

  if (!trimmed) {
    throw new ValidationError("UPI VPA is required.");
  }

  if (trimmed.length > MAX_VPA_LENGTH) {
    throw new ValidationError(
      `UPI VPA must be ${MAX_VPA_LENGTH} characters or fewer.`,
    );
  }

  if (!UPI_VPA_REGEX.test(trimmed)) {
    throw new ValidationError("Invalid UPI VPA format. Expected name@bank.");
  }

  return trimmed;
}

export function validateInvoiceItem(
  item: InvoiceItem,
  memberIds: Set<string>,
): void {
  const name = item.name.trim();

  if (!name) {
    throw new ValidationError("Item name is required.");
  }

  if (!Number.isFinite(item.quantity) || item.quantity < 1) {
    throw new ValidationError("Item quantity must be at least 1.");
  }

  if (!Number.isFinite(item.totalAmount) || item.totalAmount <= 0) {
    throw new ValidationError("Item total amount must be greater than 0.");
  }

  if (!Array.isArray(item.sharedBy)) {
    throw new ValidationError("Item sharedBy must be an array.");
  }

  for (const memberId of item.sharedBy) {
    if (!memberIds.has(memberId)) {
      throw new ValidationError("Item references an unknown member.");
    }
  }
}

export function validateMembers(members: Member[]): void {
  if (members.length < MIN_MEMBERS || members.length > MAX_MEMBERS) {
    throw new ValidationError(
      `A session must have between ${MIN_MEMBERS} and ${MAX_MEMBERS} members.`,
    );
  }

  const names = members.map((member) => member.name);
  validateMemberNames(names);

  const ids = new Set<string>();
  for (const member of members) {
    if (!member.id.trim()) {
      throw new ValidationError("Each member must have an id.");
    }
    if (ids.has(member.id)) {
      throw new ValidationError("Member ids must be unique.");
    }
    ids.add(member.id);
  }
}

export function validateSessionUpdate(
  existing: SplitSession,
  partial: UpdateSessionInput,
): UpdateSessionInput {
  const members = partial.members ?? existing.members;
  const items = partial.items ?? existing.items;
  const payerVpa =
    partial.payerVpa !== undefined ? partial.payerVpa : existing.payerVpa;
  const payerMemberId =
    partial.payerMemberId !== undefined
      ? partial.payerMemberId
      : existing.payerMemberId;

  validateMembers(members);

  const memberIds = new Set(members.map((member) => member.id));

  for (const item of items) {
    validateInvoiceItem(item, memberIds);
  }

  if (payerVpa !== null && payerVpa !== undefined) {
    validateVpa(payerVpa);
  }

  if (payerMemberId !== null && payerMemberId !== undefined) {
    if (!memberIds.has(payerMemberId)) {
      throw new ValidationError("Payer must be one of the session members.");
    }
  }

  return {
    members,
    items,
    payerVpa: payerVpa ?? null,
    payerMemberId: payerMemberId ?? null,
  };
}
