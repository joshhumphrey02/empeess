import { AddStaffButton, StaffRowActions } from "@/components/admin/team";
import { PageHeader, rowEnter, StatusPill } from "@/components/admin/kit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS } from "@/lib/permissions";
import { requireAdmin } from "@/server/admin/guard";
import { listTeam } from "@/server/admin/team";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireAdmin("/admin/team");
  const team = await listTeam();

  return (
    <>
      <PageHeader
        title="Team"
        description="Admins can do everything. Staff can open only the sections you give them."
        actions={<AddStaffButton />}
      />
      <Card className="gap-0 overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Privileges</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((m, i) => (
              <TableRow key={m.id} className={rowEnter(i).className} style={rowEnter(i).style}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                      <AvatarFallback className="bg-brand-soft text-xs font-medium text-brand">{(m.name ?? m.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <span className="block truncate font-medium">
                        {m.name ?? "-"}
                        {m.id === me.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusPill status={m.role} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {m.role === "ADMIN" ? (
                    <span className="text-muted-foreground">Full access</span>
                  ) : (
                    <div className="flex max-w-md flex-wrap gap-1">
                      {m.permissions.map((p) => (
                        <Badge key={p} variant="outline">
                          {PERMISSIONS[p].label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill status={m.banned ? "BANNED" : m.pending ? "INVITED" : "ACTIVE"} />
                </TableCell>
                <TableCell className="pr-4">
                  {m.role === "STAFF" && (
                    <StaffRowActions member={{ id: m.id, name: m.name, email: m.email, permissions: m.permissions, banned: m.banned }} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
