import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Building, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const organizations = [
  {
    id: 1,
    name: "Acme Corp",
    industry: "Technology",
    contacts: 5,
    location: "New York, USA",
  },
  {
    id: 2,
    name: "Global Industries",
    industry: "Manufacturing",
    contacts: 3,
    location: "London, UK",
  },
  {
    id: 3,
    name: "Tech Solutions",
    industry: "Software",
    contacts: 7,
    location: "San Francisco, USA",
  },
];

const Organizations = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Organizations</h2>
            <p className="text-muted-foreground">
              Manage your client organizations and their contacts
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{org.industry}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {org.contacts}
                    </div>
                  </TableCell>
                  <TableCell>{org.location}</TableCell>
                  <TableCell>
                    <Link to={`/organizations/${org.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Organizations;