// Dashboard privileges, shared by server guards and the Team UI. A STAFF user
// holds a subset of these; an ADMIN implicitly holds all of them and is the
// only role that can manage the team itself.

export const PERMISSIONS = {
  overview: { label: "Overview", description: "See sales totals and charts on the dashboard home." },
  orders: { label: "Orders", description: "View orders, update their status and issue refunds." },
  customers: { label: "Customers", description: "View customer accounts, their orders and addresses." },
  catalog: { label: "Catalog", description: "Manage products, categories and inventory." },
  reviews: { label: "Reviews", description: "Read and delete product reviews." },
  messages: { label: "Messages", description: "Read and delete contact-form messages." },
  subscribers: { label: "Subscribers", description: "View and export newsletter subscribers." },
  content: { label: "Site content", description: "Change home page photos, text and contact details." },
} as const;

export type Permission = keyof typeof PERMISSIONS;
export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as Permission[];

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";
export type Access = { role: Role; permissions: readonly string[] };

/** Keep only known privileges, without duplicates, in display order. */
export function cleanPermissions(input: readonly string[]): Permission[] {
  return PERMISSION_KEYS.filter((key) => input.includes(key));
}

/** Can this user open any part of the dashboard at all? */
export const isTeamMember = (user: Access) => user.role === "ADMIN" || user.role === "STAFF";

export function can(user: Access, permission: Permission) {
  if (user.role === "ADMIN") return true;
  return user.role === "STAFF" && user.permissions.includes(permission);
}

/** Where each privilege lives, in the order a staff member should land. */
export const PERMISSION_HOME: Record<Permission, string> = {
  overview: "/admin",
  orders: "/admin/orders",
  customers: "/admin/customers",
  catalog: "/admin/products",
  reviews: "/admin/reviews",
  messages: "/admin/messages",
  subscribers: "/admin/subscribers",
  content: "/admin/content",
};
