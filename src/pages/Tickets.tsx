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
import { Loader2, Ticket, TicketCheck, TicketX } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTickets, updateTicket } from "@/lib/actions";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";

interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

type Tables = Database['public']['Tables'];
type TicketRow = Tables['tickets']['Row'];

interface TicketWithRelations extends Omit<TicketRow, 'customer_id' | 'assignee_id'> {
  customer: UserBasicInfo | null;
  assignee: UserBasicInfo | null;
}

const ITEMS_PER_PAGE = 10;

const TicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const { data: tickets = [], isLoading, error } = useTickets();
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setTotalPages(Math.ceil(tickets.length / ITEMS_PER_PAGE));
  }, [tickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket(ticketId, { status: newStatus });
      // React Query will automatically revalidate the tickets query
    } catch (err) {
      console.error("Failed to update ticket status:", err);
    }
  };

  const paginatedTickets = tickets.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-destructive">Error: {error instanceof Error ? error.message : "Failed to load tickets"}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            Manage and monitor support tickets
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link to="/tickets/new">
            <Ticket className="h-4 w-4" />
            New Ticket
          </Link>
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
              <TableHead>Customer</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tickets...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="text-primary hover:underline"
                    >
                      {ticket.ticket_number}
                    </Link>
                  </TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-2 w-2 rounded-full ${
                          ticket.status === "open"
                            ? "bg-green-500"
                            : ticket.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      />
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
                  <TableCell>
                    {format(new Date(ticket.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {ticket.customer?.full_name || ticket.customer?.email || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {ticket.assignee?.full_name || ticket.assignee?.email || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusChange(ticket.id, "closed")}
                        disabled={ticket.status === "closed"}
                      >
                        <TicketCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStatusChange(ticket.id, "open")}
                        disabled={ticket.status === "open"}
                      >
                        <TicketX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && tickets.length > 0 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSearchParams({ page: Math.max(1, page - 1).toString() })}
                disabled={page === 1}
              >
                <PaginationPrevious />
              </Button>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setSearchParams({ page: pageNum.toString() });
                  }}
                  isActive={pageNum === page}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSearchParams({ page: Math.min(totalPages, page + 1).toString() })}
                disabled={page === totalPages}
              >
                <PaginationNext />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default TicketsPage;