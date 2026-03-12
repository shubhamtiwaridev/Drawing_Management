export const DEPT_ID_MAP = { };

export function mapDepartmentToId(deptName) {
  if (!deptName) return "";
  return DEPT_ID_MAP[deptName] || "";
}







