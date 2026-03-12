import SessionPolicy from "../models/sessionPolicyModel.js";

export const getApplicablePolicy = async (user) => {
  const userPolicy = await SessionPolicy.findOne({
    appliesTo: "USER",
    userId: user._id,
    active: true,
  });

  if (userPolicy) return userPolicy;

  return SessionPolicy.findOne({
    appliesTo: "ROLE",
    role: user.role,
    active: true,
  });
};

export const calculateSessionExpiry = async (user, loginTime) => {
  const policy = await getApplicablePolicy(user);
  const base = loginTime || new Date();
  const expiries = [];

  const DEFAULT_MS = 8 * 60 * 60 * 1000;

  if (!policy) {
    return base.getTime() + DEFAULT_MS;
  }

  if (policy.maxDurationMinutes) {
    expiries.push(base.getTime() + policy.maxDurationMinutes * 60 * 1000);
  }

  if (policy.cutoffTime) {
    const [hh, mm] = policy.cutoffTime.split(":").map(Number);

    // ✅ small safety: only if valid numbers
    if (Number.isFinite(hh) && Number.isFinite(mm)) {
      const cutoff = new Date(base);
      cutoff.setHours(hh, mm, 0, 0);

      if (cutoff <= base) cutoff.setDate(cutoff.getDate() + 1);
      expiries.push(cutoff.getTime());
    }
  }

  // ✅ FIX: avoid Infinity if no rules found
  if (expiries.length === 0) {
    return base.getTime() + DEFAULT_MS;
  }

  return Math.min(...expiries);
};
