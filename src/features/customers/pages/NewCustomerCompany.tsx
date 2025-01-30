import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/hooks/use-workspace";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PageLayout } from "@/components/layout/PageLayout";

const formSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  domain: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCustomerCompany() {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      domain: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!workspace?.id) return;
    
    setIsSubmitting(true);
    try {
      // Insert the new customer company
      const { data: company, error: companyError } = await supabase
        .from("customer_companies")
        .insert({
          name: values.name,
          domain: values.domain || null,
          workspace_id: workspace.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      toast({
        title: "Success",
        description: "Customer company created successfully",
      });

      navigate("/customers");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout
      title="New Customer Company"
      backTo="/companies"
    >
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the customer company.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="acme.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      The company's domain name, if applicable.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Company"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 