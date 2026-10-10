import { ContentEditor } from "@/components/admin/content-editor";
import { PageHeader } from "@/components/admin/kit";
import { CONTENT_FIELDS, CONTENT_SECTIONS, defaultFor } from "@/lib/site-content";
import { requireAccess } from "@/server/admin/guard";
import { getContentOverrides } from "@/server/site-content";

export const metadata = { title: "Site content" };

export default async function SiteContentPage() {
  await requireAccess("content", "/admin/content");
  const rows = await getContentOverrides();
  const saved = Object.fromEntries(
    rows.filter((r) => CONTENT_FIELDS.has(r.key)).map((r) => [r.key, { value: r.value, arkId: r.arkId }]),
  );
  // The built-in value for every editable path, so the editor can show and restore it.
  const defaults = Object.fromEntries([...CONTENT_FIELDS.keys()].map((path) => [path, defaultFor(path)]));

  return (
    <>
      <PageHeader
        title="Site content"
        description="Change the photos, text and contact details shown on the store. Nothing goes live until you save."
      />
      <ContentEditor sections={CONTENT_SECTIONS} defaults={defaults} saved={saved} />
    </>
  );
}
