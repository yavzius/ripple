import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Ticket, TicketCheck, TicketX } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for initial display
const tickets = [
  {
    id: "TICK-1234",
    subject: "Login Issue",
    status: "open",
    priority: "high",
    created: "2024-03-10",
    assignee: "AI Agent",
  },
  {
    id: "TICK-1235",
    subject: "Password Reset",
    status: "closed",
    priority: "medium",
    created: "2024-03-09",
    assignee: "Human Agent",
  },
  {
    id: "TICK-1236",
    subject: "Feature Request",
    status: "pending",
    priority: "low",
    created: "2024-03-08",
    assignee: "AI Agent",
  },
];

const TicketsPage = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
            <p className="text-sm text-muted-foreground">
              Manage and monitor support tickets
            </p>
          </div>
          <Button className="gap-2">
            <Ticket className="h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="text-primary hover:underline"
                    >
                      {ticket.id}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ticket.status === "open" ? (
                        <span className="flex h-2 w-2 rounded-full bg-green-500" />
                      ) : ticket.status === "pending" ? (
                        <span className="flex h-2 w-2 rounded-full bg-yellow-500" />
                      ) : (
                        <span className="flex h-2 w-2 rounded-full bg-gray-500" />
                      )}
                      {ticket.status}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        ticket.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : ticket.priority === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>
                  <TableCell>{ticket.created}</TableCell>
                  <TableCell>{ticket.assignee}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <TicketCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <TicketX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                2
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </DashboardLayout>
  );
};

export default TicketsPage;