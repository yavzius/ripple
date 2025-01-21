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
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTickets, updateTicket, getTickets } from "@/lib/actions";
import { useEffect, useState } from "react";
import type { Database } from "@/integrations/supabase/types";
import { format } from "date-fns";


interface UserBasicInfo {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  customer_company?: {
    id: string;
    name: string;
    domain: string | null;
  } | null;
}

type Tables = Database['public']['Tables'];
type TicketRow = Tables['tickets']['Row'];
type CustomerRow = Tables['users']['Row'];
interface TicketWithRelations extends Omit<TicketRow, 'customer_id' | 'assignee_id'> {
  customer: UserBasicInfo | null;
  assignee: UserBasicInfo | null;
}

const ITEMS_PER_PAGE = 10;

const TicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTotalPages(Math.ceil(tickets.length / ITEMS_PER_PAGE));
  }, [tickets]);

  // Calculate paginated tickets
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedTickets = tickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  //get tickets
  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const tickets = await getTickets();
        setTickets(tickets);
        console.log(tickets);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tickets</h2>
        </div>
        <Button size="sm" asChild>
          <Link to="/tickets/new">
            Create Ticket
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
              <TableHead>Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading tickets...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No tickets found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTickets.map((ticket) => (
                <TableRow 
                  key={ticket.id}
                  className="group hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell className="font-medium">
                    {ticket.ticket_number}
                  </TableCell>
                  <TableCell>
                    {ticket.subject}
                  </TableCell>
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
                    {ticket.customer?.first_name || ticket.customer?.email || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {ticket.customer?.customer_company?.name || "Unknown"}
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