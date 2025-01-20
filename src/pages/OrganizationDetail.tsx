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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Mail, Phone, Plus, User } from "lucide-react";
import { useParams } from "react-router-dom";

const contacts = [
  {
    id: 1,
    name: "John Doe",
    role: "CEO",
    email: "john@acme.com",
    phone: "+1 234 567 890",
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "CTO",
    email: "jane@acme.com",
    phone: "+1 234 567 891",
  },
];

const OrganizationDetail = () => {
  const { id } = useParams();
  const organization = {
    id: 1,
    name: "Acme Corp",
    industry: "Technology",
    location: "New York, USA",
    website: "www.acme.com",
    description: "Leading provider of innovative technology solutions",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
              <Building className="h-8 w-8" />
              {organization.name}
            </h2>
            <p className="text-muted-foreground">{organization.description}</p>
          </div>
          <Button variant="outline">Edit Organization</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p>{organization.industry}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p>{organization.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Website</p>
                <p>{organization.website}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Contacts</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>{contact.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contact.email}</span>
                          <Phone className="h-4 w-4 ml-2 text-muted-foreground" />
                          <span className="text-sm">{contact.phone}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationDetail;