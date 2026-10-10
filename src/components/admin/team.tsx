"use client";

import { IconBan, IconPencil, IconPlus, IconShieldCheck, IconUserMinus } from "@tabler/icons-react";
import { useState } from "react";

import { addStaffAction, removeStaffAction, setStaffBannedAction, setStaffPermissionsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSION_KEYS, PERMISSIONS, type Permission } from "@/lib/permissions";

import { ConfirmAction } from "./confirm-button";
import { useAdminAction } from "./use-admin-action";

type Member = { id: string; name: string | null; email: string; permissions: Permission[]; banned: boolean };

/** Add a staff member (no `member`) or edit an existing one's privileges. */
function StaffDialog({ member, open, onOpenChange }: { member: Member | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pending, run } = useAdminAction();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [granted, setGranted] = useState<Permission[]>(member?.permissions ?? []);
  const all = granted.length === PERMISSION_KEYS.length;

  const toggle = (key: Permission, on: boolean) =>
    setGranted((prev) => (on ? [...prev, key] : prev.filter((p) => p !== key)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? `Privileges for ${member.name ?? member.email}` : "Add staff"}</DialogTitle>
          <DialogDescription>
            {member
              ? "Choose which parts of the dashboard they can open."
              : "Staff can open only the parts of the dashboard you tick. If they don't have an account yet, we'll create one and email them a link to set a password."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="staff-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => (member ? setStaffPermissionsAction(member.id, granted) : addStaffAction({ email, name, permissions: granted })),
              { onSuccess: () => onOpenChange(false) },
            );
          }}
        >
          {!member && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input id="staff-email" type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff-name">Name (optional)</Label>
                <Input id="staff-name" autoComplete="off" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
          )}
          <fieldset className="grid gap-1">
            <div className="mb-1 flex items-center justify-between">
              <legend className="text-sm font-medium">Privileges</legend>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                onClick={() => setGranted(all ? [] : [...PERMISSION_KEYS])}
              >
                {all ? "Clear all" : "Select all"}
              </button>
            </div>
            {PERMISSION_KEYS.map((key) => (
              <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                <Checkbox className="mt-0.5" checked={granted.includes(key)} onCheckedChange={(on) => toggle(key, on === true)} />
                <span>
                  <span className="block text-sm font-medium">{PERMISSIONS[key].label}</span>
                  <span className="block text-xs text-muted-foreground">{PERMISSIONS[key].description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="staff-form" disabled={pending || granted.length === 0}>
            {pending ? "Saving…" : member ? "Save privileges" : "Add to team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddStaffButton() {
  const [open, setOpen] = useState(false);
  // A new key each time it opens, so the form starts blank.
  const [formKey, setFormKey] = useState(0);
  return (
    <>
      <Button
        onClick={() => {
          setFormKey((k) => k + 1);
          setOpen(true);
        }}
      >
        <IconPlus /> Add staff
      </Button>
      <StaffDialog key={formKey} member={null} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Edit privileges, ban or unban, and remove: the per-row controls for a staff member. */
export function StaffRowActions({ member }: { member: Member }) {
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { pending, run } = useAdminAction();
  const who = member.name ?? member.email;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`Edit privileges for ${who}`}
        title="Edit privileges"
        onClick={() => {
          setFormKey((k) => k + 1);
          setEditing(true);
        }}
      >
        <IconPencil />
      </Button>
      {member.banned ? (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Lift the ban on ${who}`}
          title="Lift ban"
          disabled={pending}
          onClick={() => run(() => setStaffBannedAction(member.id, false))}
        >
          <IconShieldCheck />
        </Button>
      ) : (
        <ConfirmAction
          title={`Ban ${who}?`}
          description="They are signed out immediately and can't sign in again, to the dashboard or the store, until you lift the ban. Their privileges are kept."
          confirmLabel="Ban"
          action={() => setStaffBannedAction(member.id, true)}
          trigger={(open) => (
            <Button size="icon-sm" variant="ghost" aria-label={`Ban ${who}`} title="Ban" onClick={open}>
              <IconBan />
            </Button>
          )}
        />
      )}
      <ConfirmAction
        title={`Remove ${who} from the team?`}
        description={
          member.banned
            ? "They lose all dashboard access and go back to being a normal customer. This also lifts their ban, so they will be able to sign in and shop."
            : "They lose all dashboard access and go back to being a normal customer. Their account and order history stay."
        }
        confirmLabel="Remove"
        action={() => removeStaffAction(member.id)}
        trigger={(open) => (
          <Button size="icon-sm" variant="ghost" aria-label={`Remove ${who} from the team`} title="Remove from team" onClick={open}>
            <IconUserMinus />
          </Button>
        )}
      />
      <StaffDialog key={formKey} member={member} open={editing} onOpenChange={setEditing} />
    </div>
  );
}
