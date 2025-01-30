import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateOrder, useUpdateOrder } from "../hooks/use-orders";
import {
  OrderFormProps,
  OrderFormData,
  ORDER_STATUS,
  OrderStatus,
} from "../types";

const orderSchema = z.object({
  company_id: z.string().min(1, "Company is required"),
  status: z.string().optional().transform((val): OrderStatus | undefined => 
    val ? (val as OrderStatus) : undefined
  ),
});

export function OrderForm({ initialData, companies }: OrderFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      company_id: initialData?.company_id || "",
      status: (initialData?.status as OrderStatus) || ORDER_STATUS.PENDING,
    },
  });

  const isLoading = isCreating || isUpdating;

  async function onSubmit(data: OrderFormData) {
    try {
      if (initialData?.id) {
        await updateOrder({
          orderId: initialData.id,
          updates: data,
        });
        toast({
          title: "Order updated",
          description: "Your order has been updated successfully.",
        });
      } else {
        await createOrder(data);
        toast({
          title: "Order created",
          description: "Your order has been created successfully.",
        });
      }
      navigate("/orders");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="company_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {initialData && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ORDER_STATUS).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/orders")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {initialData ? "Update" : "Create"} Order
          </Button>
        </div>
      </form>
    </Form>
  );
} 
