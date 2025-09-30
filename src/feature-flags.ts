interface IntMin {
  type: "int:min";
  value: number;
}

interface IntMax {
  type: "int:max";
  value: number;
}

interface Int {
  type: "int";
  value: number;
}

interface Allow {
  type: "allow";
  value: boolean;
}

interface FeatureFlagBase {
  name: string;
  tier: string;
}

export type FeatureFlag = FeatureFlagBase & (Allow | IntMin | IntMax | Int);

const TierLookup = new Map<string, FeatureFlag>();

function getFeatureFlagKey(flagName: string, tier: string): string {
  return [flagName, tier].join(".");
}

export function load(flags: FeatureFlag[]): void {
  for (const flag of flags) {
    TierLookup.set(getFeatureFlagKey(flag.name, flag.tier), flag);
  }
}

export function clear() {
  TierLookup.clear();
}

export function isAllowed(flagName: string, tier: string): boolean {
  const flag = get(flagName, tier);
  if (!flag) return false;
  if (flag.type === "allow") {
    console.warn(`flag is not allow type`, { flag });
    return false;
  }
  return !!flag.value;
}

export function get(
  flagName: string,
  tier: string = "",
): FeatureFlag | undefined {
  const flag = TierLookup.get(getFeatureFlagKey(flagName, tier));
  if (!flag) {
    console.warn(`flag not found for tier`, flagName, tier);
  }
  return flag;
}

export function isInRange(flagName: string, tier: string = "", value: number) {
  const flag = get(flagName, tier);
  if (!flag) return false;

  if (flag.type === "int") {
    return value === flag.value;
  }

  if (flag.type === "int:max") {
    if (flag.value === null) return true;
    return value <= flag.value;
  }
  if (flag.type === "int:min") {
    if (flag.value === null) return true;
    return value >= flag.value;
  }

  console.warn("flag not of int type", { flag });
  return false;
}

export function getAll() {
  return TierLookup;
}
