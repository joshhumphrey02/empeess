/** Cookie holding the admin dashboard theme ("light" | "dark" | "system"). */
export const ADMIN_THEME_COOKIE = "empeess_admin_theme";

export type ThemePref = "light" | "dark" | "system";

export const parseThemePref = (v: string | undefined): ThemePref => (v === "light" || v === "dark" ? v : "system");
