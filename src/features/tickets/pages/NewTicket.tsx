import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createTicket, getCustomers } from "@/lib/actions";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { ComboboxForm } from "@/components/ui/combobox-form";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  organization_id: string;
  organization_name?: string;
}

interface NewTicketFormData {
  subject: string;
  description: string;
  priority: string;
  customer_id: string;
}

const NewTicket = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, control } = useForm<NewTicketFormData>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

//   useEffect(() => {
//     const fetchCustomers = async () => {
//       try {



//         setCustomers(customerUsers);
//       } catch (err) {
//         toast({
//           title: "Error",
//           description: "Failed to load customers",
//           variant: "destructive",
//         });
//       } finally {
//         setLoadingCustomers(false);
//       }
//     };

//     fetchCustomers();
//   }, [toast]);

  const onSubmit = async (data: NewTicketFormData) => {
    try {
      setLoading(true);
      
      // Find the selected customer to get their organization_id
      const selectedCustomer = customers.find(c => c.id === data.customer_id);
      if (!selectedCustomer) {
        throw new Error("Selected customer not found");
      }

      const ticket = await createTicket({
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: "open",
        customer_id: data.customer_id,
        organization_id: selectedCustomer.organization_id
      });

      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map(customer => ({
    label: `${customer.full_name || customer.email} (${customer.organization_name})`,
    value: customer.id
  }));

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Ticket</CardTitle>
          <CardDescription>
            Create a new support ticket for a customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="customer" className="text-sm font-medium">
                Customer
              </label>
              <ComboboxForm
                name="customer_id"
                control={control}
                options={customerOptions}
                placeholder="Select a customer"
                disabled={loadingCustomers}
                rules={{ required: "Please select a customer" }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                {...register("subject", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Detailed description of your issue"
                className="min-h-[150px]"
                {...register("description", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <Controller
                name="priority"
                control={control}
                defaultValue="medium"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/tickets")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || loadingCustomers}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewTicket; 